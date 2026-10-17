// Team entry-fee payments client — manual UPI orders + the standalone
// pay-admin dashboard. Money fields (fee, expected amount, status) are always
// server-decided; this module only carries the captain's intent and the UTR.
//
// Captain calls use the member ID token (apiFetchAuth). Dashboard calls use a
// separate pay-admin session token kept in sessionStorage.

import { apiFetch, apiFetchAuth, API_BASE_URL } from "./api.js";

function friendlyError(err, fallback) {
  const sessionExpired = !!(err && (err.sessionExpired || err.status === 401));
  const payload = err && err.data;
  if (payload && payload.errors) return { ok: false, errors: payload.errors, sessionExpired };
  if (payload && payload.error) return { ok: false, formError: payload.error, status: err.status, sessionExpired };
  return { ok: false, formError: fallback || "Couldn't reach the server. Check your connection and try again.", sessionExpired };
}

// ---------- captain ----------

export async function getTeamPayment(teamId) {
  try {
    const data = await apiFetchAuth(`/api/teams/${encodeURIComponent(teamId)}/payment`);
    return { ok: true, ...data };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function createTeamOrder(teamId, { captchaToken } = {}) {
  try {
    const data = await apiFetchAuth(`/api/teams/${encodeURIComponent(teamId)}/order`, {
      method: "POST",
      body: JSON.stringify({ captchaToken: captchaToken || "" }),
    });
    return { ok: true, order: data.order, paymentsOpen: data.paymentsOpen };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function submitUtr(orderId, utr) {
  try {
    const data = await apiFetchAuth(`/api/pay/orders/${encodeURIComponent(orderId)}/utr`, {
      method: "POST",
      body: JSON.stringify({ utr }),
    });
    return { ok: true, order: data.order };
  } catch (err) {
    return friendlyError(err);
  }
}

// ---------- standalone pay-admin dashboard ----------

const TOKEN_KEY = "yuvora.v1.payadmin";

export function getPayAdminToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function setPayAdminToken(token) {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked */
  }
}

export function clearPayAdminToken() {
  setPayAdminToken("");
}

async function adminFetch(path, options = {}) {
  const token = getPayAdminToken();
  return apiFetch(path, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

export async function payAdminLogin(password) {
  try {
    const data = await apiFetch("/api/pay-admin/login", {
      method: "POST",
      body: JSON.stringify({ password: password || "open" }),
    });
    setPayAdminToken(data.token || "open");
    return { ok: true, open: !!data.open };
  } catch (err) {
    return friendlyError(err, "Couldn't reach the dashboard server.");
  }
}

export async function payAdminLogout() {
  try {
    await adminFetch("/api/pay-admin/logout", { method: "POST", body: JSON.stringify({}) });
  } catch {
    /* ignore — token is dropped locally regardless */
  }
  clearPayAdminToken();
  return { ok: true };
}

export async function listPayOrders(status) {
  try {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    const data = await adminFetch(`/api/pay-admin/orders${q}`);
    return { ok: true, orders: Array.isArray(data.orders) ? data.orders : [] };
  } catch (err) {
    return { ok: false, ...friendlyError(err), orders: [] };
  }
}

export async function getPaySummary() {
  try {
    const data = await adminFetch("/api/pay-admin/summary");
    return { ok: true, ...data };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function setPayOrderStatus(orderId, status, note) {
  try {
    const data = await adminFetch(`/api/pay-admin/orders/${encodeURIComponent(orderId)}/status`, {
      method: "POST",
      body: JSON.stringify({ status, note: note || "" }),
    });
    return { ok: true, order: data.order };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function downloadPayOrdersCsv() {
  const token = getPayAdminToken();
  const res = await fetch(`${API_BASE_URL}/api/pay-admin/orders.csv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`CSV download failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "yuvora-payments.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
