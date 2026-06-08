/**
 * Firebase Storage Service — profile photo upload/delete
 */
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './config';

/**
 * Upload a profile photo with progress callback.
 * @param {string} studentId
 * @param {File} file
 * @param {(progress: number) => void} onProgress
 * @returns {Promise<string>} download URL
 */
export function uploadProfilePhoto(studentId, file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!isFirebaseConfigured) { reject(new Error('Firebase not configured')); return; }

    const ext  = file.name.split('.').pop();
    const path = `profile-photos/${studentId}.${ext}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      snap => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function deleteProfilePhoto(studentId) {
  if (!isFirebaseConfigured) return;
  try {
    await deleteObject(ref(storage, `profile-photos/${studentId}.jpg`));
    await deleteObject(ref(storage, `profile-photos/${studentId}.png`));
  } catch (_) { /* file may not exist */ }
}
