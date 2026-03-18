import auth      from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export async function signUp({ name, email, password, upi }) {
  const { user } = await auth().createUserWithEmailAndPassword(email, password);
  await user.updateProfile({ displayName: name });
  await firestore().collection('users').doc(user.uid).set({
    uid:       user.uid,
    name,
    email,
    upi:       upi ?? '',
    avatar:    name.charAt(0).toUpperCase(),
    createdAt: firestore.FieldValue.serverTimestamp(),
    totalSplit: 0,
    groups:    [],
    friends:   [],
  });
  return user;
}

export async function signIn({ email, password }) {
  const { user } = await auth().signInWithEmailAndPassword(email, password);
  return user;
}

export async function signOut() {
  await auth().signOut();
}

export async function resetPassword(email) {
  await auth().sendPasswordResetEmail(email);
}

export async function getUserProfile(uid) {
  const doc = await firestore().collection('users').doc(uid).get();
  return doc.exists ? doc.data() : null;
}

export async function updateProfile({ uid, name, upi }) {
  await firestore().collection('users').doc(uid).update({ name, upi });
  await auth().currentUser?.updateProfile({ displayName: name });
}

export function onAuthStateChanged(callback) {
  return auth().onAuthStateChanged(callback);
}
