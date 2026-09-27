import { handler as createPaymentSession } from "../netlify/functions/create-payment-session.js";

export default async function handler(request, response) {
  const result = await createPaymentSession({
    httpMethod: request.method,
    headers: request.headers,
    body: typeof request.body === "string"
      ? request.body
      : JSON.stringify(request.body || {}),
  });

  Object.entries(result.headers || {}).forEach(([name, value]) => response.setHeader(name, value));
  return response.status(result.statusCode).send(result.body);
}