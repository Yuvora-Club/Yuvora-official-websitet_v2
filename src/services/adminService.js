// Admin client — profile, user directory, and dynamic add-user.
// Calls go through apiFetchAuth: the live ID token is attached, and an
// expired session is refreshed + retried once before surfacing an error.

import { apiFetchAuth } from "./api.js";

function friendlyError(err) {
  const sessionExpired = !!(err && (err.sessionExpired || err.status === 401));
  const payload = err && err.data;
  if (payload && payload.errors) return { ok: false, errors: payload.errors, sessionExpired };
  if (payload && payload.error) {
    return {
      ok: false,
      formError: sessionExpired
        ? "Admin session expired. Log in again, then retry."
        : payload.error,
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

export async function createAdminUser({ fullName, email, phone, birthDate, age, password }) {
  try {
    const data = await apiFetchAuth("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ fullName, email, phone, birthDate, age, password }),
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
