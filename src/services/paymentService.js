import { auth } from "./firebase";

export async function createPaymentSession({ orderId }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again to pay");

  const idToken = await user.getIdToken();
  const response = await fetch("/api/create-payment-session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderId }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Unable to start payment");
  }

  return result;
}