  import admin from "firebase-admin";

let initialized = false;

function required(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : "";
}

// Initializes the Firebase Admin SDK from ENV only (no key files committed).
// Returns { ready: boolean, missing: string[] } so routes can fail with a
// clear 503 instead of crashing when env vars are not set yet.
export function initFirebase() {
  if (initialized) return { ready: admin.apps.length > 0, missing: [] };

  const missing = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_DATABASE_URL",
  ].filter((k) => !required(k));
  if (missing.length > 0) return { ready: false, missing };

  const privateKey = required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: required("FIREBASE_PROJECT_ID"),
        clientEmail: required("FIREBASE_CLIENT_EMAIL"),
        privateKey,
      }),
      projectId: required("FIREBASE_PROJECT_ID"),
      databaseURL: required("FIREBASE_DATABASE_URL"),
    });
  }
  initialized = true;
  return { ready: true, missing: [] };
}

export function isFirebaseReady() {
  return admin.apps.length > 0;
}

export const auth = () => admin.auth();
export const db = () => admin.firestore();
export const rtdb = () => admin.database();
export { admin };
