/**
 * Supabase Messaging Service — SMS Pro
 *
 * Uses Supabase (free, no credit card) instead of Firebase Firestore.
 * Free tier: 500 MB DB, unlimited API calls, real-time subscriptions.
 * Sign up at: https://supabase.com (no credit card required)
 *
 * All messages are AES-256-GCM encrypted before storage.
 *
 * Supabase table schema (run this SQL in Supabase SQL Editor):
 * ─────────────────────────────────────────────────────────────
 * create table messages (
 *   id          uuid default gen_random_uuid() primary key,
 *   student_id  text not null,
 *   sender_id   text not null,
 *   ciphertext  text not null,
 *   iv          text not null,
 *   encrypted   boolean default true,
 *   edited      boolean default false,
 *   unsent      boolean default false,
 *   edited_at   timestamptz,
 *   created_at  timestamptz default now()
 * );
 *
 * -- Enable Row Level Security (open policy for dev)
 * alter table messages enable row level security;
 * create policy "allow all" on messages for all using (true) with check (true);
 *
 * -- Enable real-time
 * alter publication supabase_realtime add table messages;
 * ─────────────────────────────────────────────────────────────
 */

import { supabase, isSupabaseConfigured } from './client';
import {
  encryptMessage, decryptMessage, encryptEdit,
} from '../firebase/messageEncryption';

const TABLE = 'messages';

// ── Utility: check ready ──────────────────────────────────────────────────────
function ready() {
  if (!isSupabaseConfigured || !supabase) {
    console.error('[Supabase] Not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    return false;
  }
  return true;
}

// ── Map DB row → app message ──────────────────────────────────────────────────
function rowToMsg(row) {
  return {
    id:        row.id,
    senderId:  row.sender_id,
    ciphertext: row.ciphertext,
    iv:        row.iv,
    encrypted: row.encrypted,
    edited:    row.edited,
    unsent:    row.unsent,
    editedAt:  row.edited_at,
    // timestamp object with toDate() so existing date helpers keep working
    timestamp: {
      toDate: () => new Date(row.created_at),
      _raw:   row.created_at,
    },
    text: '',   // filled by decryptMessages()
  };
}

// ── Decrypt a batch of raw rows ───────────────────────────────────────────────
async function decryptRows(rows, studentId) {
  return Promise.all(
    rows.map(async (row) => {
      const msg = rowToMsg(row);
      if (msg.unsent) return { ...msg, text: '' };
      msg.text = await decryptMessage(msg, studentId);
      return msg;
    })
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SEND
// ═════════════════════════════════════════════════════════════════════════════
export async function fsSendMessage(studentId, senderId, plaintext) {
  if (!ready()) return null;

  const { ciphertext, iv, encrypted } = await encryptMessage(plaintext, studentId);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      student_id: studentId,
      sender_id:  senderId,
      ciphertext,
      iv,
      encrypted,
      edited:  false,
      unsent:  false,
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Send failed:', error.message, error.code);
    // Give helpful hints for common errors
    if (error.code === '42P01') {
      console.error('[Supabase] Table "messages" does not exist — run the SQL setup in Supabase SQL Editor');
    }
    if (error.code === '42501' || error.message?.includes('policy')) {
      console.error('[Supabase] RLS policy blocking write — run: create policy "allow all" on messages for all using (true) with check (true)');
    }
    throw error;
  }

  console.log('[Supabase] Message sent:', data.id);
  return { ...rowToMsg(data), text: plaintext };
}

// ═════════════════════════════════════════════════════════════════════════════
//  EDIT
// ═════════════════════════════════════════════════════════════════════════════
export async function fsEditMessage(studentId, messageId, newPlaintext) {
  if (!ready()) return null;

  const { ciphertext, iv, encrypted } = await encryptEdit(newPlaintext, studentId);

  const { error } = await supabase
    .from(TABLE)
    .update({
      ciphertext,
      iv,
      encrypted,
      edited:    true,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('student_id', studentId);

  if (error) { console.error('[Supabase] Edit failed:', error.message); throw error; }
}

// ═════════════════════════════════════════════════════════════════════════════
//  DELETE
// ═════════════════════════════════════════════════════════════════════════════
export async function fsDeleteMessage(studentId, messageId) {
  if (!ready()) return null;

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', messageId)
    .eq('student_id', studentId);

  if (error) { console.error('[Supabase] Delete failed:', error.message); throw error; }
}

// ═════════════════════════════════════════════════════════════════════════════
//  UNSEND  (tombstone — wipe ciphertext)
// ═════════════════════════════════════════════════════════════════════════════
export async function fsUnsendMessage(studentId, messageId) {
  if (!ready()) return null;

  const { error } = await supabase
    .from(TABLE)
    .update({
      ciphertext: '',
      iv:         '',
      encrypted:  false,
      unsent:     true,
      edited_at:  new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('student_id', studentId);

  if (error) { console.error('[Supabase] Unsend failed:', error.message); throw error; }
}

// ═════════════════════════════════════════════════════════════════════════════
//  LISTEN  (real-time subscription)
// ═════════════════════════════════════════════════════════════════════════════
export function fsListenMessages(studentId, callback) {
  if (!ready()) return () => {};

  console.log(`[Supabase] Listening for student: ${studentId}`);

  // 1. Initial fetch
  supabase
    .from(TABLE)
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true })
    .then(async ({ data, error }) => {
      if (error) {
        console.error('[Supabase] Initial fetch failed:', error.message);
        if (error.code === '42P01') {
          console.error('[Supabase] Table missing — run SQL setup (see supabaseService.js comments)');
        }
        return;
      }
      const decrypted = await decryptRows(data || [], studentId);
      callback(decrypted);
    });

  // 2. Real-time subscription for INSERT / UPDATE / DELETE
  const channel = supabase
    .channel(`messages:${studentId}`)
    .on(
      'postgres_changes',
      {
        event:  '*',
        schema: 'public',
        table:  TABLE,
        filter: `student_id=eq.${studentId}`,
      },
      async () => {
        // Re-fetch on every change — simple and bulletproof
        const { data, error } = await supabase
          .from(TABLE)
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: true });

        if (error) { console.error('[Supabase] Refetch failed:', error.message); return; }
        const decrypted = await decryptRows(data || [], studentId);
        callback(decrypted);
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase] Channel status: ${status}`);
      if (status === 'CHANNEL_ERROR') {
        console.error('[Supabase] Real-time channel error — check supabase_realtime publication');
      }
    });

  // Return unsubscribe
  return () => {
    supabase.removeChannel(channel);
    console.log(`[Supabase] Unsubscribed from ${studentId}`);
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  READ RECEIPTS
// ═════════════════════════════════════════════════════════════════════════════

// Using localStorage for read receipts — simple, no extra table needed
export async function fsMarkRead(studentId, role) {
  try {
    localStorage.setItem(`sms_read_${studentId}_${role}`, Date.now().toString());
  } catch {}
}

export async function fsGetUnreadCount(studentId, role) {
  if (!ready()) return 0;
  try {
    const lastRead = parseInt(localStorage.getItem(`sms_read_${studentId}_${role}`) || '0');
    const { data, error } = await supabase
      .from(TABLE)
      .select('created_at')
      .eq('student_id', studentId);
    if (error || !data) return 0;
    return data.filter(row => new Date(row.created_at).getTime() > lastRead).length;
  } catch { return 0; }
}

// ── Stub student CRUD (still handled by Spring Boot) ─────────────────────────
export async function fsGetAllStudents()  { return null; }
export async function fsGetStudent()      { return null; }
export async function fsAddStudent()      { return null; }
export async function fsUpdateStudent()   { return null; }
export async function fsDeleteStudent()   { return null; }
export async function fsSeedStudents()    { return; }
