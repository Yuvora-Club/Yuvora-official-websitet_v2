// Admin client — profile, user directory, and dynamic add-user.
// Every call needs the admin ID token from POST /api/auth/login.

import { apiFetch } from "./api.js";
import { getLiveSession } from "./authService.js";

function authHeaders() {
  const session = getLiveSession();
  const token = session && session.idToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function friendlyError(err) {
  const payload = err && err.data;
  if (payload && payload.errors) return { ok: false, errors: payload.errors };
  if (payload && payload.error) return { ok: false, formError: payload.error };
  return { ok: false, formError: "Couldn't reach the admin server. Check your connection and try again." };
}

export async function fetchAdminMe() {
  try {
    const data = await apiFetch("/api/admin/me", { headers: authHeaders() });
    return { ok: true, admin: data.admin };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function fetchAdminUsers() {
  try {
    const data = await apiFetch("/api/admin/users", { headers: authHeaders() });
    return { ok: true, users: Array.isArray(data.users) ? data.users : [] };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function createAdminUser({ fullName, email, phone, birthDate, age, password }) {
  try {
    const data = await apiFetch("/api/admin/users", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ fullName, email, phone, birthDate, age, password }),
    });
    return { ok: true, user: data.user };
  } catch (err) {
    return friendlyError(err);
  }
}

/** Change own login email (current password required). Returns updated admin. */
export async function updateAdminEmail({ newEmail, password }) {
  try {
    const data = await apiFetch("/api/admin/credentials/email", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ newEmail, password }),
    });
    return { ok: true, admin: data.admin };
  } catch (err) {
    return friendlyError(err);
  }
}

/** Change own password (current password required). Caller must re-login. */
export async function updateAdminPassword({ currentPassword, newPassword }) {
  try {
    await apiFetch("/api/admin/credentials/password", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return { ok: true };
  } catch (err) {
    return friendlyError(err);
  }
}
