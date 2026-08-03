/**
 * Writes a Firebase service-account key into .env as FIREBASE_SERVICE_ACCOUNT
 * (base64, Option A).
 *
 *   node scripts/set-firebase-credentials.mjs <path-to-service-account.json>
 *
 * Encoding by hand means pasting a ~2000 character line into a terminal, which
 * is easy to truncate. This does it in one step and refuses the most damaging
 * mistake: a key from a different Firebase project. FCM rejects sends whose
 * credentials don't match the project that issued the device token, and the
 * resulting error is far from obvious.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ENV_PATH = path.join(__dirname, "..", ".env");
const ENV_KEY = "FIREBASE_SERVICE_ACCOUNT";

/* The project google-services.json belongs to. A key from anywhere else cannot
   deliver to this app's tokens. */
const EXPECTED_PROJECT_ID = "rmdocto-dd025";

const fail = (msg) => {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
};

/* ---------- read the key ---------- */

const keyPath = process.argv[2];

if (!keyPath) {
  fail(
    "Usage: node scripts/set-firebase-credentials.mjs <path-to-service-account.json>"
  );
}

if (!fs.existsSync(keyPath)) {
  fail(`No such file: ${keyPath}`);
}

const raw = fs.readFileSync(keyPath, "utf8");

let key;
try {
  key = JSON.parse(raw);
} catch (err) {
  fail(`That file is not valid JSON (${err.message})`);
}

/* ---------- validate ---------- */

if (key.type !== "service_account") {
  fail(
    `That is not a service-account key (type: "${key.type}").\n` +
      "   You may have grabbed google-services.json — that is the app's public\n" +
      "   client config, not the server key. Download the server key from:\n" +
      `   Firebase console -> Project settings -> Service accounts -> Generate new private key`
  );
}

if (!key.private_key || !key.client_email) {
  fail("That key is missing private_key / client_email.");
}

if (key.project_id !== EXPECTED_PROJECT_ID) {
  fail(
    `Wrong Firebase project.\n` +
      `   This key belongs to : ${key.project_id}\n` +
      `   The app expects     : ${EXPECTED_PROJECT_ID}\n\n` +
      "   Push would fail with a sender-ID mismatch, because device tokens are\n" +
      `   issued by ${EXPECTED_PROJECT_ID}. Generate the key from that project.`
  );
}

/* ---------- write to .env ---------- */

const encoded = Buffer.from(JSON.stringify(key), "utf8").toString("base64");
const line = `${ENV_KEY}=${encoded}`;

if (!fs.existsSync(ENV_PATH)) {
  fail(`No .env found at ${ENV_PATH}`);
}

// Keep a timestamped backup — .env holds every other secret this server needs,
// so a botched rewrite here would be expensive.
const backup = `${ENV_PATH}.bak-${Date.now()}`;
fs.copyFileSync(ENV_PATH, backup);

const env = fs.readFileSync(ENV_PATH, "utf8");

// Replace the existing (possibly empty) assignment rather than appending a
// second one — later duplicates win in dotenv and that is a nasty surprise.
const pattern = new RegExp(`^${ENV_KEY}=.*$`, "m");

const updated = pattern.test(env)
  ? env.replace(pattern, line)
  : `${env.replace(/\s*$/, "")}\n${line}\n`;

fs.writeFileSync(ENV_PATH, updated, "utf8");

console.log(`
✅ ${ENV_KEY} written to .env

   project      : ${key.project_id}
   client_email : ${key.client_email}
   encoded      : ${encoded.length} chars
   backup       : ${path.basename(backup)}

   Restart the backend — you should see "✅ FIREBASE: messaging ready".
   You can delete the downloaded .json now; the key lives in .env.
`);
