/* global process, Buffer */

import { getAdminAuth, getAdminDatabase } from "./utils/firebaseAdmin.js";
import { getAddonsForProduct, NO_SIZE_CATEGORIES, SIZES } from "../../src/utils/constants.js";

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

async function calculateOrderTotal(order, database) {
  if (!Array.isArray(order.items) || order.items.length === 0) return null;

  let total = 0;
  for (const item of order.items) {
    if (!item.productId || !Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 100) return null;

    const productSnapshot = await database.ref(`products/${item.productId}`).get();
    const product = productSnapshot.val();
    if (!product || !Number.isFinite(Number(product.price))) return null;

    const needsSize = !NO_SIZE_CATEGORIES.includes(product.category);
    const selectedSize = needsSize ? SIZES.find(size => size.label === item.size) : null;
    if (needsSize && !selectedSize) return null;
    if (!needsSize && item.size) return null;

    const allowedAddons = getAddonsForProduct(product.category, product.name);
    const selectedAddonIds = (item.addons || []).map(addon => addon.id);
    if (new Set(selectedAddonIds).size !== selectedAddonIds.length) return null;
    const selectedAddons = selectedAddonIds.map(id => allowedAddons.find(addon => addon.id === id));
    if (selectedAddons.some(addon => !addon)) return null;

    const unitPrice = Number(product.price)
      + (selectedSize?.priceAdd || 0)
      + selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    total += unitPrice * item.qty;
  }

  return Math.round(total * 100);
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  if (!process.env.PAYMONGO_SECRET_KEY || !process.env.PUBLIC_SITE_URL) {
    return jsonResponse(500, { error: "Payment service is not configured" });
  }

  const authorization = event.headers?.authorization || event.headers?.Authorization || "";
  const idToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!idToken) return jsonResponse(401, { error: "Authentication required" });

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const { orderId } = JSON.parse(event.body || "{}");
    if (typeof orderId !== "string" || !/^[A-Za-z0-9_-]+$/.test(orderId)) {
      return jsonResponse(400, { error: "Invalid order" });
    }

    const database = getAdminDatabase();
    const orderRef = database.ref(`customerOrders/${orderId}`);
    const orderSnapshot = await orderRef.get();
    const order = orderSnapshot.val();

    if (!order || order.customerId !== decodedToken.uid) {
      return jsonResponse(404, { error: "Order not found" });
    }
    if (order.payment !== "gcash" || order.paymentStatus !== "awaiting_payment") {
      return jsonResponse(409, { error: "Order is not awaiting online payment" });
    }

    const amountInCentavos = await calculateOrderTotal(order, database);
    if (!Number.isSafeInteger(amountInCentavos) || amountInCentavos <= 0
      || Math.round(Number(order.total) * 100) !== amountInCentavos) {
      return jsonResponse(409, { error: "Order items or total do not match the current menu" });
    }

    const paymongoResponse = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [{
              currency: "PHP",
              amount: amountInCentavos,
              name: `Kape Eskinita order ${orderId}`,
              quantity: 1,
            }],
            payment_method_types: ["gcash", "paymaya"],
            description: `Order ${orderId}`,
            reference_number: orderId,
            metadata: { orderId, customerId: decodedToken.uid },
            success_url: `${process.env.PUBLIC_SITE_URL}/orders/${orderId}?payment=success`,
            cancel_url: `${process.env.PUBLIC_SITE_URL}/cart?payment=cancelled`,
          },
        },
      }),
    });

    const result = await paymongoResponse.json();
    if (!paymongoResponse.ok) {
      console.error("PayMongo checkout rejected", result);
      return jsonResponse(502, { error: "PayMongo rejected the payment" });
    }

    const session = result.data;
    const checkoutUrl = session?.attributes?.checkout_url;
    if (!session?.id || !checkoutUrl) {
      return jsonResponse(502, { error: "PayMongo returned an invalid checkout session" });
    }

    await orderRef.update({
      total: amountInCentavos / 100,
      paymongoAmountInCentavos: amountInCentavos,
      paymongoCheckoutSessionId: session.id,
    });
    return jsonResponse(200, { checkoutUrl });
  } catch (error) {
    console.error("PayMongo checkout error", error);
    if (["auth/argument-error", "auth/id-token-expired", "auth/invalid-id-token"].includes(error.code)) {
      return jsonResponse(401, { error: "Please sign in again" });
    }
    return jsonResponse(500, { error: "Unable to start payment" });
  }
}