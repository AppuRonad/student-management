import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  !!firebaseConfig.databaseURL;

let app, rtdb, storage, db;

if (isFirebaseConfigured) {
  app     = initializeApp(firebaseConfig);
  rtdb    = getDatabase(app);    // ← Realtime Database — FREE, no billing
  storage = getStorage(app);     // ← Storage — profile photos
  db      = null;                // Firestore not used (requires billing)
}

export { app, db, rtdb, storage, isFirebaseConfigured };
