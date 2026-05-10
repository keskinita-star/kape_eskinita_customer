import { ref, get, set, update } from "firebase/database";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { auth, rtdb } from "./firebase";

export const signupCustomer = async ({ name, email, password }) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await set(ref(rtdb, `customers/${cred.user.uid}`), {
    name, email, role: "customer",
    loyaltyPoints: 0, totalOrders: 0, totalSpent: 0,
    createdAt: Date.now(),
  });
  return cred.user;
};

export const loginCustomer = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await get(ref(rtdb, `customers/${cred.user.uid}`));
  if (!snap.exists()) throw new Error("Customer record not found.");
  return { uid: cred.user.uid, ...snap.val() };
};

export const logoutCustomer = () => signOut(auth);

export const getCustomer = async (uid) => {
  const snap = await get(ref(rtdb, `customers/${uid}`));
  if (!snap.exists()) return null;
  return { uid, ...snap.val() };
};

export const updateCustomer = (uid, data) =>
  update(ref(rtdb, `customers/${uid}`), data);