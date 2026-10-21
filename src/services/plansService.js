// Club future-plans client — admin-only crew todos.
// Every call goes through apiFetchAuth (live ID token + refresh-once retry).
// The backend enforces requireAdmin, so only assigned admins can list,
// create, edit or delete plans. Members get 401/403 here.

import { apiFetchAuth } from "./api.js";

function friendlyError(err) {
  const sessionExpired = !!(err && (err.sessionExpired || err.status === 401));
  const forbidden = err && err.status === 403;
  const payload = err && err.data;
  if (payload && payload.errors) return { ok: false, errors: payload.errors, sessionExpired, forbidden };
  if (payload && payload.error) {
    return {
      ok: false,
      formError: sessionExpired
        ? "Admin session expired. Log in again, then retry."
        : forbidden
          ? "Only assigned admins can manage future plans."
          : payload.error,
      sessionExpired,
      forbidden,
    };
  }
  return { ok: false, formError: "Couldn't reach the admin server. Check your connection and try again.", sessionExpired: false, forbidden: false };
}

export async function fetchPlans() {
  try {
    const data = await apiFetchAuth("/api/admin/plans");
    return { ok: true, plans: Array.isArray(data.plans) ? data.plans : [] };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function createPlan({ title, details, status, priority, dueDate }) {
  try {
    const data = await apiFetchAuth("/api/admin/plans", {
      method: "POST",
      body: JSON.stringify({ title, details, status, priority, dueDate }),
    });
    return { ok: true, plan: data.plan };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function updatePlan(id, { title, details, status, priority, dueDate }) {
  try {
    const data = await apiFetchAuth(`/api/admin/plans/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ title, details, status, priority, dueDate }),
    });
    return { ok: true, plan: data.plan };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function deletePlan(id) {
  try {
    await apiFetchAuth(`/api/admin/plans/${encodeURIComponent(id)}`, { method: "DELETE" });
    return { ok: true, id };
  } catch (err) {
    return friendlyError(err);
  }
}
