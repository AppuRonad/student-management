/**
 * Firebase Service — SMS Pro
 *
 * MESSAGING uses Firebase Realtime Database (rtdb) — 100% FREE, no billing.
 *   Free tier: 1 GB storage, 10 GB/month transfer, no credit card needed.
 *   Path: /chats/admin_{studentId}/messages/{pushId}
 *
 * STUDENTS CRUD still uses the Spring Boot REST API (localhost:8080).
 * Firestore (db) import is kept but messaging no longer uses it.
 *
 * All messages are encrypted with AES-256-GCM before writing.
 */

import {
  ref, push, set, update, remove,
  onValue, off, serverTimestamp, get, query,
  orderByChild,
} from 'firebase/database';
import { rtdb, isFirebaseConfigured } from './config';
import { encryptMessage, decryptMessages, encryptEdit } from './messageEncryption';

// ── RTDB path helpers ─────────────────────────────────────────────────────────

const chatRef       = (sid)       => ref(rtdb, `chats/admin_${sid}`);
const messagesRef   = (sid)       => ref(rtdb, `chats/admin_${sid}/messages`);
const messageRef    = (sid, mid)  => ref(rtdb, `chats/admin_${sid}/messages/${mid}`);
const metaRef       = (sid)       => ref(rtdb, `chats/admin_${sid}/meta`);
const receiptsRef   = (sid)       => ref(rtdb, `chats/admin_${sid}/meta/readReceipts`);

// ── isRTDBConfigured ─────────────────────────────────────────────────────────

function isReady() {
  if (!isFirebaseConfigured || !rtdb) {
    console.error('[Messaging] Firebase Realtime DB not configured. Check VITE_FIREBASE_DATABASE_URL in .env');
    return false;
  }
  return true;
}

// ═════════════════════════════════════════════════════════════════════════════
//  MESSAGING  (Realtime Database — free tier)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Send an encrypted message.
 * Uses RTDB push() which auto-generates a unique chronological key.
 */
export async function fsSendMessage(studentId, senderId, plaintext) {
  if (!isReady()) return null;

  console.log(`[Messaging] Sending to admin_${studentId}...`);

  // Encrypt
  const { ciphertext, iv, encrypted } = await encryptMessage(plaintext, studentId);
  console.log(`[Messaging] Encrypted — len: ${ciphertext.length}`);

  const timestamp = Date.now();

  const data = {
    senderId,
    ciphertext,
    iv,
    encrypted,
    timestamp,     // RTDB uses ms epoch, not server timestamp
    edited:  false,
    unsent:  false,
  };

  // push() creates a new child with a push key (chronologically ordered)
  const newRef = await push(messagesRef(studentId), data);
  console.log(`[Messaging] Written — key: ${newRef.key}`);

  // Update conversation metadata
  await set(chatRef(studentId), {
    studentId,
    lastActivity: timestamp,
    lastSender:   senderId,
  }, { merge: true }).catch(() =>
    // set() doesn't support merge — use update instead
    update(ref(rtdb, `chats/admin_${studentId}`), {
      lastActivity: timestamp,
      lastSender:   senderId,
    }).catch(() => {})
  );

  return { ...data, id: newRef.key, text: plaintext };
}

/**
 * Edit a message — re-encrypt and update in RTDB.
 */
export async function fsEditMessage(studentId, messageId, newPlaintext) {
  if (!isReady()) return null;
  try {
    const { ciphertext, iv, encrypted } = await encryptEdit(newPlaintext, studentId);
    await update(messageRef(studentId, messageId), {
      ciphertext,
      iv,
      encrypted,
      edited:   true,
      editedAt: Date.now(),
    });
    console.log(`[Messaging] Edited: ${messageId}`);
  } catch (err) {
    console.error('[Messaging] Edit failed:', err.message);
    throw err;
  }
}

/**
 * Delete a message permanently.
 */
export async function fsDeleteMessage(studentId, messageId) {
  if (!isReady()) return null;
  try {
    await remove(messageRef(studentId, messageId));
    console.log(`[Messaging] Deleted: ${messageId}`);
  } catch (err) {
    console.error('[Messaging] Delete failed:', err.message);
    throw err;
  }
}

/**
 * Unsend — wipe ciphertext, mark tombstone.
 */
export async function fsUnsendMessage(studentId, messageId) {
  if (!isReady()) return null;
  try {
    await update(messageRef(studentId, messageId), {
      ciphertext: '',
      iv:         '',
      encrypted:  false,
      unsent:     true,
      editedAt:   Date.now(),
    });
    console.log(`[Messaging] Unsent: ${messageId}`);
  } catch (err) {
    console.error('[Messaging] Unsend failed:', err.message);
    throw err;
  }
}

/**
 * Real-time listener.
 * onValue fires immediately with all data, then again on every change.
 * Decrypts all messages before passing to callback.
 * Returns an unsubscribe function.
 */
export function fsListenMessages(studentId, callback) {
  if (!isReady()) return () => {};

  console.log(`[Messaging] Listening on admin_${studentId}...`);

  // orderByChild('timestamp') keeps messages in chronological order
  const q = query(messagesRef(studentId), orderByChild('timestamp'));

  const handler = async (snapshot) => {
    const raw = [];
    snapshot.forEach((child) => {
      raw.push({ ...child.val(), id: child.key });
    });
    console.log(`[Messaging] Snapshot — ${raw.length} messages`);

    const decrypted = await decryptMessages(raw, studentId);
    callback(decrypted);
  };

  onValue(q, handler, (err) => {
    console.error('[Messaging] onValue error:', err.message);
    if (err.message?.includes('permission')) {
      console.error('[Messaging] FIX: Update Realtime DB rules in Firebase Console');
      console.error('[Messaging] Go to: Realtime Database → Rules → set to allow read/write: true');
    }
  });

  // Return unsubscribe
  return () => {
    off(q, 'value', handler);
    console.log(`[Messaging] Unsubscribed from admin_${studentId}`);
  };
}

/**
 * Mark conversation as read.
 */
export async function fsMarkRead(studentId, role) {
  if (!isReady()) return null;
  try {
    await update(receiptsRef(studentId), { [role]: Date.now() });
  } catch (err) {
    console.warn('[Messaging] fsMarkRead failed (non-critical):', err.message);
  }
}

/**
 * Get unread count for a role.
 */
export async function fsGetUnreadCount(studentId, role) {
  if (!isReady()) return 0;
  try {
    const [receiptsSnap, msgsSnap] = await Promise.all([
      get(receiptsRef(studentId)),
      get(query(messagesRef(studentId), orderByChild('timestamp'))),
    ]);

    const lastRead = receiptsSnap.exists() ? receiptsSnap.val()?.[role] : null;
    if (!lastRead) {
      let count = 0;
      msgsSnap.forEach(() => count++);
      return count;
    }

    let unread = 0;
    msgsSnap.forEach((child) => {
      const ts = child.val()?.timestamp;
      if (ts && ts > lastRead) unread++;
    });
    return unread;
  } catch {
    return 0;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  STUDENTS  (kept for backwards compat — actual CRUD uses Spring Boot API)
// ═════════════════════════════════════════════════════════════════════════════

export async function fsGetAllStudents()        { return null; }
export async function fsGetStudent()            { return null; }
export async function fsAddStudent()            { return null; }
export async function fsUpdateStudent()         { return null; }
export async function fsDeleteStudent()         { return null; }
export async function fsSeedStudents()          { return; }
