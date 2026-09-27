/* global Buffer */

import { handler as processPayMongoWebhook } from "../netlify/functions/paymongo-webhook.js";

export const config = { api: { bodyParser: false } };

function readRawBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

export default async function handler(request, response) {
  let body;
  try {
    body = await readRawBody(request);
  } catch {
    return response.status(400).json({ error: "Unable to read webhook body" });
  }

  const result = await processPayMongoWebhook({
    httpMethod: request.method,
    headers: request.headers,
    body,
  });

  Object.entries(result.headers || {}).forEach(([name, value]) => response.setHeader(name, value));
  return response.status(result.statusCode).send(result.body);
}