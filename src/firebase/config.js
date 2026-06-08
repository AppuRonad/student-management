import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// Initialize Firebase only if config is present
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key_here';

let app, auth, db, storage, rtdb;

if (isFirebaseConfigured) {
  app     = initializeApp(firebaseConfig);
  auth    = getAuth(app);
  db      = getFirestore(app);       // Firestore — main database
  storage = getStorage(app);         // Storage  — profile photos
  rtdb    = getDatabase(app);        // Realtime DB — live announcements
}

export { app, auth, db, storage, rtdb, isFirebaseConfigured };
