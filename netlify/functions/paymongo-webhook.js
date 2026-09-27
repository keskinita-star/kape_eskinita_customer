/* global process, Buffer */

import { createHmac, timingSafeEqual } from "node:crypto";
import { getAdminDatabase } from "./utils/firebaseAdmin.js";
import { LOYALTY_POINTS_PER_PESO } from "../../src/utils/constants.js";

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

function verifySignature(rawBody, signatureHeader, livemode) {
  if (!signatureHeader || !process.env.PAYMONGO_WEBHOOK_SECRET) return false;

  const parts = Object.fromEntries(signatureHeader.split(",").map(part => {
    const [key, ...value] = part.trim().split("=");
    return [key, value.join("=")];
  }));
  const signature = livemode ? parts.li : parts.te;
  if (!parts.t || !/^[a-f\d]{64}$/i.test(signature || "")) return false;

  const expected = createHmac("sha256", process.env.PAYMONGO_WEBHOOK_SECRET)
    .update(`${parts.t}.${rawBody}`)
    .digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : event.body || "";
  const headers = event.headers || {};
  const signatureHeader = headers["paymongo-signature"] || headers["Paymongo-Signature"];

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload" });
  }

  const webhookEvent = payload.data || payload;
  const attributes = webhookEvent.attributes || {};
  if (!verifySignature(rawBody, signatureHeader, attributes.livemode === true)) {
    console.warn("PayMongo webhook rejected: signature verification failed", {
      webhookSecretConfigured: Boolean(process.env.PAYMONGO_WEBHOOK_SECRET),
      eventType: attributes.type || "unknown",
      livemode: attributes.livemode === true,
    });
    return jsonResponse(401, { error: "Invalid webhook signature" });
  }

  if (attributes.type !== "checkout_session.payment.paid") {
    console.info("PayMongo webhook ignored: event type is not handled", {
      eventType: attributes.type || "unknown",
    });
    return jsonResponse(200, { received: true, ignored: true });
  }

  const eventSession = attributes.data;
  if (!eventSession?.id) {
    console.warn("PayMongo webhook rejected: checkout session is missing");
    return jsonResponse(400, { error: "Missing checkout session" });
  }

  try {
    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    const expectedLivemode = secretKey?.startsWith("sk_live_");
    if (!secretKey || expectedLivemode !== (attributes.livemode === true)) {
      console.warn("PayMongo webhook ignored: API key mode does not match event mode", {
        apiKeyConfigured: Boolean(secretKey),
        eventLivemode: attributes.livemode === true,
      });
      return jsonResponse(200, { received: true, ignored: true });
    }

    const sessionResponse = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${encodeURIComponent(eventSession.id)}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      },
    });
    const sessionResult = await sessionResponse.json();
    if (!sessionResponse.ok) {
      console.error("Unable to verify PayMongo checkout session", sessionResult);
      return jsonResponse(502, { error: "Unable to verify checkout session" });
    }

    const session = sessionResult.data;
    const sessionAttributes = session?.attributes || {};
    const orderId = sessionAttributes.reference_number;
    if (!orderId || session.id !== eventSession.id) {
      console.warn("PayMongo webhook rejected: checkout session reference is invalid");
      return jsonResponse(400, { error: "Checkout session reference is invalid" });
    }

    const database = getAdminDatabase();
    const orderRef = database.ref(`customerOrders/${orderId}`);
    const orderSnapshot = await orderRef.get();
    const order = orderSnapshot.val();
    if (!order || order.payment !== "gcash" || order.paymongoCheckoutSessionId !== session.id) {
      console.warn("PayMongo webhook could not match checkout session to an online order", {
        orderFound: Boolean(order),
        onlinePaymentOrder: order?.payment === "gcash",
        checkoutSessionMatched: order?.paymongoCheckoutSessionId === session.id,
      });
      return jsonResponse(404, { error: "Matching online order not found" });
    }

    const expectedAmount = Number(order.paymongoAmountInCentavos);
    const paidPayment = (sessionAttributes.payments || []).find(payment => {
      const paymentAttributes = payment.attributes || {};
      return paymentAttributes.status === "paid"
        && Number(paymentAttributes.amount) === expectedAmount
        && paymentAttributes.currency === "PHP";
    });
    if (!Number.isSafeInteger(expectedAmount) || expectedAmount <= 0 || !paidPayment) {
      console.warn("PayMongo webhook rejected: paid payment does not match expected order amount", {
        expectedAmountValid: Number.isSafeInteger(expectedAmount) && expectedAmount > 0,
        matchingPaidPaymentFound: Boolean(paidPayment),
      });
      return jsonResponse(400, { error: "Payment amount does not match the order" });
    }

    let orderGuardFailure = null;
    const orderResult = await orderRef.transaction(currentOrder => {
      orderGuardFailure = null;
      const transactionOrder = currentOrder || order;
      if (transactionOrder.paymentStatus === "paid") return transactionOrder;
      if (transactionOrder.paymentStatus !== "awaiting_payment") {
        orderGuardFailure = "payment_status_not_awaiting_payment";
        return transactionOrder;
      }
      if (transactionOrder.paymongoCheckoutSessionId !== session.id) {
        orderGuardFailure = "checkout_session_mismatch";
        return transactionOrder;
      }
      if (Number(transactionOrder.paymongoAmountInCentavos) !== expectedAmount) {
        orderGuardFailure = "amount_mismatch";
        return transactionOrder;
      }

      return {
        ...transactionOrder,
        paymentStatus: "paid",
        paymongoPaymentId: paidPayment.id,
        paidAt: Date.now(),
      };
    });
    const confirmedOrder = orderResult.snapshot.val();
    if (!orderResult.committed || confirmedOrder?.paymentStatus !== "paid"
      || confirmedOrder.paymongoCheckoutSessionId !== session.id
      || Number(confirmedOrder.paymongoAmountInCentavos) !== expectedAmount) {
      console.error("PayMongo webhook could not mark the verified order paid", {
        eventId: webhookEvent.id || "unknown",
        orderExists: Boolean(confirmedOrder),
        currentPaymentStatus: confirmedOrder?.paymentStatus || "missing",
        checkoutSessionMatched: confirmedOrder?.paymongoCheckoutSessionId === session.id,
        amountMatched: Number(confirmedOrder?.paymongoAmountInCentavos) === expectedAmount,
        orderGuardFailure,
      });
      return jsonResponse(409, { error: "Order payment state changed; retry webhook" });
    }

    const customerRef = database.ref(`customers/${order.customerId}`);
    const pointsEarned = Math.floor(Number(order.total) * LOYALTY_POINTS_PER_PESO);
    const customerResult = await customerRef.transaction(customer => {
      if (!customer) return;
      const creditedOrders = customer.paymongoCreditedOrders || {};
      if (creditedOrders[orderId]) return customer;

      return {
        ...customer,
        loyaltyPoints: (customer.loyaltyPoints || 0) + pointsEarned,
        totalSpent: (customer.totalSpent || 0) + Number(order.total),
        totalOrders: (customer.totalOrders || 0) + 1,
        paymongoCreditedOrders: { ...creditedOrders, [orderId]: true },
      };
    });
    if (!customerResult.committed) {
      console.error("PayMongo payment is confirmed, but customer totals were not credited", {
        eventId: webhookEvent.id || "unknown",
        customerExists: customerResult.snapshot.exists(),
      });
      return jsonResponse(500, { error: "Payment confirmed, but customer totals could not be updated" });
    }

    console.info("PayMongo checkout payment confirmed", {
      eventId: webhookEvent.id || "unknown",
      orderAlreadyPaid: order.paymentStatus === "paid",
    });
    return jsonResponse(200, { received: true });
  } catch (error) {
    console.error("PayMongo webhook processing error", error);
    return jsonResponse(500, { error: "Unable to process payment confirmation" });
  }
}