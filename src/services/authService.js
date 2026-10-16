// YUVORA authService — MOCK-ONLY adapter (development).
//
// Every function in this file is a clearly-marked mock. Accounts are kept in
// the browser's localStorage, never sent anywhere, and MUST NOT be treated
// as permanent registrations. The UI always labels this as demo mode.
//
// Backend contract (for the database/auth team — proposal, no assumptions):
//   POST /api/auth/register { name, email, phone, password } -> { user, token }
//   POST /api/auth/login    { email, password }               -> { user, token }
//   POST /api/auth/logout   {}                                -> { ok: true }
//   GET  /api/auth/session  (Authorization: Bearer <token>)   -> { user | null }
// User: { id, name, email, phone, createdAt }
// The real adapter (e.g. Firebase Auth) must replace `mockAdapter` below and
// keep these exact function names + return shapes so no component changes.

import { notify, readJSON, removeKey, subscribeTo, snapshotOf, writeJSON } from "./store.js";
import { apiFetch } from "./api.js";

const USERS_KEY = "yuvora.v1.mock.users";
const SESSION_KEY = "yuvora.v1.mock.session";
// Live backend session (POST /api/auth/login). Separate key so demo and
// real accounts never mix.
const LIVE_SESSION_KEY = "yuvora.v1.live-session";
const CHANNEL = "auth";

export const AUTH_MODE = "mock";
// Shown verbatim in the UI so nobody mistakes this for real registration.
export const AUTH_MODE_NOTICE =
  "Demo sign-in — accounts live only in this browser and are not permanently registered. Real authentication arrives with the backend.";

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `u_${crypto.randomUUID()}`;
  return `u_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function salt() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `s${Date.now().toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`;
}

// Demo-grade hash only. NEVER a pattern for production passwords — the real
// backend must hash server-side (bcrypt/scrypt/argon2) and never see this.
async function hashPassword(password, saltValue) {
  const input = `${saltValue}::${password}`;
  try {
    if (crypto && crypto.subtle && window.isSecureContext !== false) {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
      return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    /* fall through to fallback */
  }
  let h1 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  return `fnv-demo-${h1.toString(16)}`;
}

function publicUser(record) {
  if (!record) return null;
  return { id: record.id, name: record.name, email: record.email, phone: record.phone, createdAt: record.createdAt };
}

function loadUsers() {
  const list = readJSON(USERS_KEY, []);
  return Array.isArray(list) ? list : [];
}

function saveUsers(list) {
  writeJSON(USERS_KEY, list);
}

export function subscribeAuth(listener) {
  return subscribeTo(CHANNEL, listener);
}

export function authSnapshot() {
  return snapshotOf(CHANNEL);
}

function setSession(userId) {
  if (userId) writeJSON(SESSION_KEY, { userId, at: new Date().toISOString() });
  else removeKey(SESSION_KEY);
  notify(CHANNEL);
}

/** Currently signed-in user: live backend account first, else demo account, else null. */
export function getSessionUser() {
  const live = readJSON(LIVE_SESSION_KEY, null);
  if (live && live.user && live.user.id) return live.user;
  const session = readJSON(SESSION_KEY, null);
  if (!session || !session.userId) return null;
  const record = loadUsers().find((u) => u.id === session.userId);
  return publicUser(record) || null;
}

/** Stored live session ({ user, idToken }) or null. */
export function getLiveSession() {
  return readJSON(LIVE_SESSION_KEY, null);
}

// Backend profile -> frontend public user shape. Keeps everything the Join
// form collected (except the password, which never leaves Firebase Auth).
function toPublicUser(u) {
  if (!u) return null;
  return {
    id: u.id || u.uid,
    name: u.fullName || u.name || "",
    fullName: u.fullName || u.name || "",
    email: u.email || "",
    altEmail: u.altEmail || null,
    phone: u.phone || "",
    birthDate: u.birthDate || null,
    age: u.age ?? null,
    role: u.role || "member",
    termsAcceptedAt: u.termsAcceptedAt,
    createdAt: u.createdAt,
  };
}

/** True when the signed-in user may open /admin. */
export function isAdminUser(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  // Seed-admin fallback so /admin stays reachable even if an old session
  // was saved before `role` existed on the profile.
  return String(user.email || "").toLowerCase() === "rishithmanchala989@gmail.com";
}

/**
 * LIVE login — verifies email + password against the backend
 * (POST /api/auth/login, Firebase-checked). Resolves { ok, user } or
 * { ok:false, errors|formError }. Throws nothing; network failures come
 * back as { ok:false, formError }.
 */
export async function loginLive({ email, password }) {
  const cleanEmail = (email || "").trim().toLowerCase();
  try {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: cleanEmail, password }),
    });
    const user = saveLiveSession(data.user, data.idToken, data.refreshToken);
    return { ok: true, user };
  } catch (err) {
    const payload = err && err.data;
    if (payload && payload.errors) return { ok: false, errors: payload.errors };
    if (payload && payload.error) return { ok: false, formError: payload.error };
    return { ok: false, formError: "Couldn't reach the login server. Check your connection and try again." };
  }
}

/** Persist a backend user as the signed-in session (used by login AND join). */
export function saveLiveSession(backendUser, token, refreshToken = null) {
  const user = toPublicUser(backendUser);
  writeJSON(LIVE_SESSION_KEY, {
    user,
    idToken: token || null,
    refreshToken: refreshToken || null,
    at: new Date().toISOString(),
  });
  notify(CHANNEL);
  return user;
}

/** Patch fields on the stored live session user (e.g. after an email change). */
export function patchLiveSessionUser(patch) {
  const session = readJSON(LIVE_SESSION_KEY, null);
  if (!session || !session.user) return null;
  const user = { ...session.user, ...(patch || {}) };
  writeJSON(LIVE_SESSION_KEY, { ...session, user });
  notify(CHANNEL);
  return user;
}

/** LIVE password reset — POST /api/auth/reset. Always resolves ok (see backend). */
export async function requestPasswordReset(email) {
  try {
    await apiFetch("/api/auth/reset", {
      method: "POST",
      body: JSON.stringify({ email: (email || "").trim() }),
    });
    return { ok: true };
  } catch (err) {
    const payload = err && err.data;
    if (payload && payload.errors) return { ok: false, errors: payload.errors };
    if (payload && payload.error) return { ok: false, formError: payload.error };
    return { ok: false, formError: "Couldn't reach the server. Check your connection and try again." };
  }
}

export function validateRegistration({ name, email, phone, password, confirm }) {
  const errors = {};
  const cleanName = (name || "").trim();
  if (cleanName.length < 2) errors.name = "Please enter your full name.";
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) errors.email = "Enter a valid email address.";
  const digits = (phone || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  if (digits.length !== 10) errors.phone = "Enter a 10-digit contact number.";
  if (!password || password.length < 8) errors.password = "Password needs at least 8 characters.";
  if (confirm !== password) errors.confirm = "Passwords do not match.";
  return { errors, clean: { name: cleanName, email: cleanEmail, phone: digits } };
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || "").trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

/**
 * MOCK register — stores a demo account locally. Resolves { ok, user } or
 * { ok:false, errors }. Simulated latency only; nothing is permanent.
 */
export async function register({ name, email, phone, password, confirm }) {
  await new Promise((r) => setTimeout(r, 500));
  const { errors, clean } = validateRegistration({ name, email, phone, password, confirm });
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const users = loadUsers();
  if (users.some((u) => u.email === clean.email)) {
    return { ok: false, errors: { email: "This email already has a demo account on this browser. Try signing in." } };
  }
  const s = salt();
  const record = {
    id: uid(),
    name: clean.name,
    email: clean.email,
    phone: clean.phone,
    salt: s,
    hash: await hashPassword(password, s),
    createdAt: new Date().toISOString(),
  };
  users.push(record);
  saveUsers(users);
  setSession(record.id);
  return { ok: true, user: publicUser(record), mock: true };
}

/** MOCK login — checks the local demo store only. */
export async function login({ email, password }) {
  await new Promise((r) => setTimeout(r, 500));
  const fieldErrors = validateLogin({ email, password });
  if (Object.keys(fieldErrors).length > 0) return { ok: false, errors: fieldErrors };
  const cleanEmail = email.trim().toLowerCase();
  const record = loadUsers().find((u) => u.email === cleanEmail);
  if (!record) {
    return { ok: false, errors: { email: "No demo account found for this email on this browser." } };
  }
  const attempt = await hashPassword(password, record.salt);
  if (attempt !== record.hash) {
    return { ok: false, errors: { password: "Wrong password for this demo account." } };
  }
  setSession(record.id);
  return { ok: true, user: publicUser(record), mock: true };
}

/** Logout — clears live and demo sessions. */
export function logout() {
  setSession(null);
  removeKey(LIVE_SESSION_KEY);
  notify(CHANNEL);
}

// Single-flight session refresh: mints a fresh ID token via
// POST /api/auth/token (refreshToken from login, or the Join customToken
// exchanged once). Resolves the new idToken, or null when a real re-login
// is needed. Concurrent callers share one in-flight refresh.
let refreshPromise = null;

export function refreshLiveToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const session = readJSON(LIVE_SESSION_KEY, null);
      if (!session || (!session.refreshToken && !session.idToken)) return null;
      const body = session.refreshToken
        ? { refreshToken: session.refreshToken }
        : { customToken: session.idToken };
      const data = await apiFetch("/api/auth/token", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!data || !data.idToken) return null;
      writeJSON(LIVE_SESSION_KEY, {
        ...session,
        user: session.user,
        idToken: data.idToken,
        refreshToken: data.refreshToken || session.refreshToken || null,
        at: new Date().toISOString(),
      });
      notify(CHANNEL);
      return data.idToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}
