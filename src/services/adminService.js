// Admin client — profile, user directory, and dynamic add-user.
// Calls go through apiFetchAuth: the live ID token is attached, and an
// expired session is refreshed + retried once before surfacing an error.

import { apiFetchAuth } from "./api.js";

function friendlyError(err) {
  const sessionExpired = !!(err && (err.sessionExpired || err.status === 401));
  const payload = err && err.data;
  if (payload && payload.errors) return { ok: false, errors: payload.errors, sessionExpired };
  if (payload && payload.error) {
    // Admin-only endpoint: a backend `detail` (the raw failure) is appended so
    // gate errors are self-diagnosing instead of an opaque "try again".
    const detail = payload.detail ? ` — ${payload.detail}` : "";
    return {
      ok: false,
      formError: sessionExpired
        ? "Admin session expired. Log in again, then retry."
        : `${payload.error}${detail}`,
      sessionExpired,
    };
  }
  return { ok: false, formError: "Couldn't reach the admin server. Check your connection and try again.", sessionExpired: false };
}

export async function fetchAdminMe() {
  try {
    const data = await apiFetchAuth("/api/admin/me");
    return { ok: true, admin: data.admin };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function fetchAdminUsers() {
  try {
    const data = await apiFetchAuth("/api/admin/users");
    return { ok: true, users: Array.isArray(data.users) ? data.users : [] };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function createAdminUser({ fullName, email, school, phone, birthDate, age, password }) {
  try {
    const data = await apiFetchAuth("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ fullName, email, school, phone, birthDate, age, password }),
    });
    return { ok: true, user: data.user };
  } catch (err) {
    return friendlyError(err);
  }
}

/** Update own profile — ONLY phone, birthDate, age, role are writable. */
export async function updateAdminProfile({ phone, birthDate, age, role }) {
  try {
    const data = await apiFetchAuth("/api/admin/profile", {
      method: "PUT",
      body: JSON.stringify({ phone, birthDate, age, role }),
    });
    return { ok: true, admin: data.admin };
  } catch (err) {
    return friendlyError(err);
  }
}

// ---------- seed-pass member check (Verify tab in /admin) ----------
// Code format YV-XXXX (e.g. YV-8930), case-insensitive, dash optional.
// Backend owns verification (read-only — nothing is recorded); admin ID
// token attached via apiFetchAuth.

/** Membership check by seed-pass code: profile + every registered event. */
export async function verifySeedPass(code) {
  try {
    const data = await apiFetchAuth("/api/admin/seedpass/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    return { ok: true, ...data };
  } catch (err) {
    return friendlyError(err);
  }
}
