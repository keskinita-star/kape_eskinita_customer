/* global process */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

function getAdminApp() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error("Firebase Admin environment variables are not configured");
  }

  const existingApp = getApps().find(app => app.name === "payment-functions");
  if (existingApp) return existingApp;

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL,
  }, "payment-functions");
}

export const getAdminAuth = () => getAuth(getAdminApp());
export const getAdminDatabase = () => getDatabase(getAdminApp());