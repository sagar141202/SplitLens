import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc, setDoc, getDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import app from './config';

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

const db = getFirestore(app);

export async function signUp({ name, email, password, upi }) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await firebaseUpdateProfile(user, { displayName: name });
  await setDoc(doc(db, 'users', user.uid), {
    uid:        user.uid,
    name,
    email,
    upi:        upi ?? '',
    avatar:     name.charAt(0).toUpperCase(),
    createdAt:  serverTimestamp(),
    totalSplit: 0,
    groups:     [],
    friends:    [],
  });
  return user;
}

export async function signIn({ email, password }) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateProfile({ uid, name, upi }) {
  await updateDoc(doc(db, 'users', uid), { name, upi });
  if (auth.currentUser) {
    await firebaseUpdateProfile(auth.currentUser, { displayName: name });
  }
}

export function onAuthStateChanged(callback) {
  return firebaseOnAuthStateChanged(auth, callback);
}
