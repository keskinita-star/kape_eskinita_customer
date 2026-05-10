import { ref, push, get, query, orderByChild, equalTo, update, onValue, off } from "firebase/database";
import { rtdb } from "./firebase";

export const placeCustomerOrder = (order) =>
  push(ref(rtdb, "customerOrders"), {
    ...order,
    status: "ordered",
    createdAt: Date.now(),
  });

export const getCustomerOrders = async (customerId) => {
  const q = query(ref(rtdb, "customerOrders"), orderByChild("customerId"), equalTo(customerId));
  const snap = await get(q);
  if (!snap.exists()) return [];
  return Object.entries(snap.val())
    .map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const getAllCustomerOrders = async () => {
  const snap = await get(ref(rtdb, "customerOrders"));
  if (!snap.exists()) return [];
  return Object.entries(snap.val())
    .map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const updateOrderStatus = (orderId, status) =>
  update(ref(rtdb, `customerOrders/${orderId}`), { status });

export const listenToOrder = (orderId, callback) => {
  const orderRef = ref(rtdb, `customerOrders/${orderId}`);
  onValue(orderRef, snap => {
    if (snap.exists()) callback({ id: orderId, ...snap.val() });
  });
  return () => off(orderRef);
};