# React + Vite

## PayMongo Checkout

Online checkout is created by Vercel Node.js Functions in `api/` and confirmed by a signed PayMongo webhook. Keep all secret values out of Git and browser `VITE_` variables.

Configure these environment variables locally and in Vercel Project Settings -> Environment Variables:

- `PAYMONGO_SECRET_KEY`: PayMongo test secret key for test mode.
- `PAYMONGO_WEBHOOK_SECRET`: signing secret shown when creating the test webhook.
- `PUBLIC_SITE_URL`: deployed Vercel site URL.
- `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`: service-account credentials for the Firebase project.
- `FIREBASE_DATABASE_URL`: Realtime Database URL (or reuse `VITE_FIREBASE_DATABASE_URL`).

Create the Firebase service account in Firebase Console -> Project settings -> Service accounts. Store its credentials only in local environment variables or Vercel, never in the repository.

In PayMongo test mode, add a webhook at `https://YOUR_SITE/api/paymongo-webhook` and subscribe to `checkout_session.payment.paid`. Copy that endpoint's signing secret into `PAYMONGO_WEBHOOK_SECRET`. Use a publicly reachable HTTPS deployment for PayMongo delivery; localhost requires a secure tunnel.

Update Realtime Database security rules so customer clients cannot set or modify `paymentStatus` or any `paymongo*` fields. The Admin SDK webhook bypasses database rules.

Run locally with `npx vercel dev` so the `/api` functions are available. Deploy again after setting the Vercel variables. Test mode and live mode require separate PayMongo API keys and webhook signing secrets.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
