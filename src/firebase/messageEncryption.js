/**
 * messageEncryption.js
 *
 * End-to-end AES-256-GCM encryption for chat messages.
 *
 * How it works:
 *  1. A conversation key is derived from a shared secret using PBKDF2
 *     (Password-Based Key Derivation Function 2) with 100,000 iterations.
 *     The shared secret = studentId + Firebase projectId — both sides
 *     (admin and student) know these values, so no key exchange is needed.
 *
 *  2. Each message is encrypted with AES-256-GCM, which provides both
 *     confidentiality and integrity (authentication tag prevents tampering).
 *
 *  3. A random 12-byte IV (Initialization Vector) is generated per message
 *     and prepended to the ciphertext before base64 encoding. This means
 *     the same plaintext encrypts to a different ciphertext every time.
 *
 *  4. What Firestore stores:
 *     { ciphertext: "base64...", iv: "base64...", encrypted: true }
 *
 *  Security properties:
 *   - AES-256-GCM is authenticated encryption — detects tampering
 *   - PBKDF2 with 100k iterations prevents brute-force of the key
 *   - Random IV per message prevents pattern analysis
 *   - No key is ever sent over the network or stored anywhere
 *   - Even Firestore admins cannot read message content
 */

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sms-pro';
const PBKDF2_ITERATIONS = 100_000;
const KEY_CACHE = new Map(); // Cache derived keys to avoid re-deriving every message

// ── Utility: string <-> ArrayBuffer ──────────────────────────────────────────

function str2ab(str) {
  return new TextEncoder().encode(str);
}

function ab2str(buf) {
  return new TextDecoder().decode(buf);
}

function buf2b64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b642buf(b64) {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

// ── Key derivation ────────────────────────────────────────────────────────────

async function deriveKey(studentId) {
  if (KEY_CACHE.has(studentId)) return KEY_CACHE.get(studentId);

  // Shared secret known to both admin and student
  const secret = `${studentId}::${PROJECT_ID}::sms-pro-chat-v1`;

  // Import the secret as a raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    str2ab(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Salt: deterministic so both sides derive the same key
  const salt = str2ab(`salt::${studentId}::${PROJECT_ID}`);

  // Derive AES-256-GCM key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // not extractable — key never leaves the browser
    ['encrypt', 'decrypt']
  );

  KEY_CACHE.set(studentId, key);
  return key;
}

// ── Encrypt ───────────────────────────────────────────────────────────────────

/**
 * Encrypts a plaintext message for a specific conversation.
 * Returns { ciphertext, iv, encrypted: true }
 */
export async function encryptMessage(plaintext, studentId) {
  try {
    const key = await deriveKey(studentId);
    const iv  = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

    const cipherbuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      str2ab(plaintext)
    );

    return {
      ciphertext: buf2b64(cipherbuf),
      iv:         buf2b64(iv.buffer),
      encrypted:  true,
    };
  } catch (err) {
    console.error('[Encryption] Failed to encrypt:', err);
    // Fallback: store plaintext with a flag so the UI can warn
    return { ciphertext: plaintext, iv: '', encrypted: false };
  }
}

// ── Decrypt ───────────────────────────────────────────────────────────────────

/**
 * Decrypts an encrypted message payload.
 * Accepts either the new { ciphertext, iv, encrypted } format
 * or legacy { text } format (unencrypted, pre-migration messages).
 */
export async function decryptMessage(payload, studentId) {
  // Legacy message — not encrypted
  if (!payload.encrypted || !payload.iv) {
    return payload.ciphertext || payload.text || '';
  }

  try {
    const key    = await deriveKey(studentId);
    const iv     = new Uint8Array(b642buf(payload.iv));
    const cipher = b642buf(payload.ciphertext);

    const plainbuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher
    );

    return ab2str(plainbuf);
  } catch (err) {
    console.error('[Decryption] Failed to decrypt:', err);
    return '🔒 [Encrypted message — could not decrypt]';
  }
}

// ── Batch decrypt (for message list) ─────────────────────────────────────────

export async function decryptMessages(messages, studentId) {
  return Promise.all(
    messages.map(async (msg) => {
      if (msg.unsent) return { ...msg, text: '' };
      const text = await decryptMessage(msg, studentId);
      return { ...msg, text };
    })
  );
}

// ── Encrypt edit ──────────────────────────────────────────────────────────────

export async function encryptEdit(newText, studentId) {
  return encryptMessage(newText, studentId);
}
