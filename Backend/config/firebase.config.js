import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging as getAdminMessaging } from "firebase-admin/messaging";

/**
 * Firebase Admin bootstrap for FCM push delivery.
 *
 * Note the subpath imports above. This backend is an ESM package
 * ("type": "module"), and firebase-admin v13's default export is the *modular*
 * API — the namespaced style (admin.credential.cert, admin.messaging()) simply
 * does not exist there and fails at runtime.
 *
 * Credentials are read from the environment so no service-account key ever
 * lands in the repo. Supply EITHER:
 *
 *   FIREBASE_SERVICE_ACCOUNT  – the whole service-account JSON, raw or base64
 *
 * or the three individual fields:
 *
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY      – newlines may be escaped as \n
 *
 * If none are set, push is simply disabled: the notification still lands in the
 * database and the in-app inbox, it just doesn't ring the device. That keeps
 * local development working without Firebase credentials.
 */

const APP_NAME = "rmdocto-push";

let messaging = null;
let initialised = false;

const parseServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (raw?.trim()) {
    // Accept both raw JSON and base64 — hosting panels often mangle multi-line
    // values, so base64 is the safer thing to paste.
    const text = raw.trim().startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");

    const parsed = JSON.parse(text);

    // The JSON uses snake_case; the Admin SDK wants camelCase.
    return {
      projectId: parsed.project_id || parsed.projectId,
      clientEmail: parsed.client_email || parsed.clientEmail,
      privateKey: (parsed.private_key || parsed.privateKey)?.replace(
        /\\n/g,
        "\n"
      ),
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) return null;

  return {
    projectId,
    clientEmail,
    // .env files store the key as a single line with literal "\n" sequences.
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
};

const init = () => {
  initialised = true;

  let serviceAccount;
  try {
    serviceAccount = parseServiceAccount();
  } catch (err) {
    console.error("❌ FIREBASE: service account is not valid JSON —", err.message);
    return;
  }

  if (!serviceAccount) {
    console.warn(
      "⚠️  FIREBASE: no credentials found — device push is disabled (in-app notifications still work)."
    );
    return;
  }

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error(
      "❌ FIREBASE: credentials are incomplete (need projectId, clientEmail and privateKey)."
    );
    return;
  }

  try {
    // Named app so this never collides with any other Firebase usage.
    const existing = getApps().find((a) => a.name === APP_NAME);

    const app =
      existing ||
      initializeApp({ credential: cert(serviceAccount) }, APP_NAME);

    messaging = getAdminMessaging(app);
    console.log(`✅ FIREBASE: messaging ready (${serviceAccount.projectId})`);
  } catch (err) {
    console.error("❌ FIREBASE: init failed —", err.message);
  }
};

/**
 * Returns the Messaging instance, or null when Firebase is not configured.
 * Callers must treat null as "push unavailable", not as an error.
 */
export const getMessaging = () => {
  if (!initialised) init();
  return messaging;
};

export const isPushConfigured = () => getMessaging() !== null;
