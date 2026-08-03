# Push Notifications (FCM) — Setup

**Firebase project:** RMDOCTO · `rmdocto-dd025` · project number `885570882440`
**Android app:** `com.sureshsau2004.RMDOCTO` · app ID `1:885570882440:android:2b957659f30347a782083d`

| Step | Status |
|---|---|
| 1. Firebase project + Android app created | ✅ done |
| 2. `google-services.json` in the app, native project regenerated | ✅ done |
| 3. Backend service-account key in `.env` | ✅ done — **verified live against FCM** |
| 4. Build & install on a physical device | ⬜ **you need to do this** |

The backend now logs `✅ FIREBASE: messaging ready (rmdocto-dd025)` on boot.
Credentials were confirmed by a real call to FCM, not just a parse check.

> ⚠️ **Rotate the current key.** The service-account JSON was pasted into a
> chat transcript, so it must be treated as exposed. See "Rotating the key"
> at the bottom — it takes about a minute and needs no code changes.

---

## ✅ 1 & 2 — already done

`RMDOCTO/google-services.json` is in place and verified against the console
values above. `npx expo prebuild --platform android --clean` has been run, and
the regenerated native project now contains:

- `android/app/google-services.json`
- `com.google.gms:google-services:4.4.1` classpath + `apply plugin`
- `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE` permissions
- the expo-notifications icon/colour meta-data

Nothing further is needed on the app config.

---

## ✅ 3 — Backend service-account key (done)

The key is stored base64-encoded as `FIREBASE_SERVICE_ACCOUNT` in `.env`,
written by `scripts/set-firebase-credentials.mjs`.

To replace it later (e.g. after rotating), just re-run:

```bash
cd rmdoctoweb/Backend
node scripts/set-firebase-credentials.mjs /path/to/new-key.json
```

The script refuses keys from the wrong Firebase project and refuses
`google-services.json`, backs up `.env` first, and replaces the existing line
rather than appending a duplicate.

<details>
<summary>Original manual instructions (kept for reference)</summary>

This is a **different file** from `google-services.json` — that one is the
public client config, this one is the private server key.

1. Open <https://console.firebase.google.com/project/rmdocto-dd025/settings/serviceaccounts/adminsdk>
2. Click **Generate new private key** → downloads a JSON file.
3. Add it to `rmdoctoweb/Backend/.env` in **one** of these two forms.

**Option A — whole JSON as base64 (recommended, survives copy/paste):**

```bash
# Git Bash / Linux:
base64 -w0 rmdocto-dd025-firebase-adminsdk-xxxxx.json

# PowerShell:
[Convert]::ToBase64String([IO.File]::ReadAllBytes("rmdocto-dd025-firebase-adminsdk-xxxxx.json"))
```

Paste the single-line result:

```env
FIREBASE_SERVICE_ACCOUNT=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCi4uLg==
```

**Option B — the three fields separately:**

```env
FIREBASE_PROJECT_ID=rmdocto-dd025
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@rmdocto-dd025.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

Keep the quotes on `FIREBASE_PRIVATE_KEY` and leave the `\n` escaped — the
config turns them back into real newlines.

⚠️ **Never commit the service-account JSON.** `.env` and the usual key
filenames are already gitignored.

Restart the backend. You should see:

```
✅ FIREBASE: messaging ready
```

</details>

---

## ⬜ 4 — Build and install

`expo-notifications` is a native module, so an OTA update is not enough.

```bash
cd RMDOCTO
eas build --profile development --platform android
```

For production:

```bash
eas build --profile production --platform android
```

**Push does not work in Expo Go** — it needs the dev or production build.

> If a build fails with `EBUSY: resource busy or locked` on the `android`
> folder, close Android Studio and any terminal sitting inside `RMDOCTO/android`,
> then run `cd RMDOCTO/android && ./gradlew --stop` and retry. A shell whose
> working directory is inside the folder is enough to lock it on Windows.

---

## Verify end to end

1. Install the new build on a **physical device** — emulators without Google
   Play Services never get a token. Log in and accept the notification prompt.
2. Confirm the token reached the backend:

   ```js
   // mongosh
   db.users.findOne({ _id: ObjectId("<user id>") }, { fcmTokens: 1 })
   ```

   `fcmTokens` should hold one entry with a long token string.
3. **Fully close the app** — swipe it away from recents.
4. From an admin account: **Admin dashboard → Send Notification**.
5. The banner appears on the locked/closed phone. Tapping it opens the app on
   the notifications screen.

The send response reports `devicesPushed` — how many physical devices got a
banner. It is lower than `recipientCount` whenever some users haven't opened
the new build yet or have notifications switched off.

---

## How it fits together

| Concern | Where |
|---|---|
| Admin sends | `POST /notifications/send` → `notification.service.js` |
| Saved per user | `Notification` collection (fan-out on write) |
| Live update, app open | Socket.io room `user:<id>` |
| Banner, app closed | `push.service.js` → FCM multicast |
| Device tokens | `User.fcmTokens[]`, via `POST/DELETE /notifications/device-token` |
| Dead token cleanup | Automatic — FCM reports them, `pruneDeadTokens` removes them |

A device token is detached from every other account when it registers, so a
shared phone never leaks the previous user's notifications. Logout detaches it
too.

### Troubleshooting

| Symptom | Cause |
|---|---|
| No banner, `devicesPushed: 0` | No token registered — user hasn't opened the new build, or denied the permission prompt |
| Backend logs "no credentials found" | Step 3 not done |
| Notification arrives in-app but never as a banner | Android channel mismatch — `ANDROID_CHANNEL_ID` in `push.service.js` must equal the channel in `RMDOCTO/services/push.js` (`rmdocto-default`) |
| Works in dev build, not production | Different signing key — no extra FCM config needed, but confirm the production build also ships `google-services.json` |
| `messaging/mismatched-credential` | The `.env` key is from a different Firebase project than `google-services.json` |

---

## Rotating the key

The service-account private key currently in `.env` was pasted into a chat
transcript, so it should be considered exposed and replaced. A leaked key lets
anyone send push notifications to your users in your app's name.

1. <https://console.firebase.google.com/project/rmdocto-dd025/settings/serviceaccounts/adminsdk>
   → **Generate new private key**
2. Install it:

   ```bash
   cd rmdoctoweb/Backend
   node scripts/set-firebase-credentials.mjs /path/to/new-key.json
   ```

3. Delete the old key: Google Cloud console →
   [Service account keys](https://console.cloud.google.com/iam-admin/serviceaccounts?project=rmdocto-dd025)
   → the `firebase-adminsdk-fbsvc@rmdocto-dd025` account → **Keys** tab →
   delete key ID `1005d091233b0abe9cbd550efe7ddd171fbe4229`.
4. Restart the backend and confirm `✅ FIREBASE: messaging ready`.

No code changes are needed — only the `.env` value moves. Deleting the old key
is the step that actually revokes access; generating a new one does not
invalidate the old.

**Also delete any `.env.bak-*` files** before sharing the repo — they contain
every other secret from `.env`. They are gitignored, but only from the point
the ignore rule was added.
