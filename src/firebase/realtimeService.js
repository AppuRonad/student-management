/**
 * Firebase Realtime Database — live announcements
 */
import { ref, push, onValue, off, remove, serverTimestamp } from 'firebase/database';
import { rtdb, isFirebaseConfigured } from './config';

const ANN_PATH = 'announcements';

export function subscribeAnnouncements(callback) {
  if (!isFirebaseConfigured) { callback([]); return () => {}; }
  const dbRef = ref(rtdb, ANN_PATH);
  const handler = snapshot => {
    const data = snapshot.val() || {};
    const list = Object.entries(data)
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20);
    callback(list);
  };
  onValue(dbRef, handler);
  return () => off(dbRef, 'value', handler);
}

export async function pushAnnouncement({ title, message, type = 'info', author = 'Admin' }) {
  if (!isFirebaseConfigured) return;
  await push(ref(rtdb, ANN_PATH), {
    title, message, type, author,
    createdAt: Date.now(),
  });
}

export async function deleteAnnouncement(id) {
  if (!isFirebaseConfigured) return;
  await remove(ref(rtdb, `${ANN_PATH}/${id}`));
}
