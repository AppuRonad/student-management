/**
 * Firestore Service — wraps all Firestore operations.
 * Falls back to localStorage if Firebase is not configured.
 */
import {
  collection, doc, getDocs, getDoc,
  addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

const COLLECTION = 'students';

// ── Read all ────────────────────────────────────────────────────────────────
export async function fsGetAllStudents() {
  if (!isFirebaseConfigured) return null;
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

// ── Read one ────────────────────────────────────────────────────────────────
export async function fsGetStudent(id) {
  if (!isFirebaseConfigured) return null;
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { ...snap.data(), id: snap.id } : null;
}

// ── Create ──────────────────────────────────────────────────────────────────
export async function fsAddStudent(student) {
  if (!isFirebaseConfigured) return null;
  const data = { ...student, createdAt: serverTimestamp() };
  const ref = await addDoc(collection(db, COLLECTION), data);
  return { ...data, id: ref.id };
}

// ── Update ──────────────────────────────────────────────────────────────────
export async function fsUpdateStudent(id, data) {
  if (!isFirebaseConfigured) return null;
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
  return true;
}

// ── Delete ──────────────────────────────────────────────────────────────────
export async function fsDeleteStudent(id) {
  if (!isFirebaseConfigured) return null;
  await deleteDoc(doc(db, COLLECTION, id));
  return true;
}

// ── Seed initial data (run once) ────────────────────────────────────────────
export async function fsSeedStudents(students) {
  if (!isFirebaseConfigured) return;
  for (const s of students) {
    await setDoc(doc(db, COLLECTION, s.id), { ...s, createdAt: serverTimestamp() });
  }
}
