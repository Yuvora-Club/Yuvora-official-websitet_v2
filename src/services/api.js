// YUVORA — central API config for Vite.
//
// Reads the backend URL from Vite env:
//   VITE_API_URL  (e.g. http://localhost:4000 locally,
//                   https://yuvora-backend.onrender.com in production)
//
// Files (repo root):
//   .env.development  -> VITE_API_URL=http://localhost:4000
//   .env.production   -> VITE_API_URL=https://yuvora-backend.onrender.com
//
// Usage:
//   import { API_BASE_URL, apiUrl, apiFetch } from "./api.js";
//   const { events } = await apiFetch("/api/events");

const PROD_API_URL = "https://yuvora-backend.onrender.com";

function normalizeBaseUrl(raw) {
  // A baked VITE_API_URL without a scheme (e.g. "xyz.up.railway.app")
  // would be treated as a RELATIVE path and POST to the static host
  // (GitHub Pages answers 405). Force https:// so that can never happen.
  let v = String(raw || "").trim().replace(/\/+$/, "");
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  return v;
}

function defaultApiUrl() {
  // If the production build forgot to bake VITE_API_URL (e.g. the Pages
  // variable was empty), still point the live domain at the live backend
  // instead of localhost — otherwise every login/join fetch fails.
  if (typeof window !== "undefined" && window.location?.hostname?.endsWith("yuvora.org")) {
    return PROD_API_URL;
  }
  return "http://localhost:4000";
}

export const API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_API_URL) || defaultApiUrl();

/** Join the base URL with an `/api/...` path. */
export function apiUrl(path = "/") {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

/**
 * fetch() wrapper that prefixes `/api/...` paths with the base URL
 * and always sends/accepts JSON. Throws on network error;
 * returns parsed JSON (or text) — caller checks `res.ok` / payload.
 */
export async function apiFetch(path, options = {}) {
  const url = /^https?:\/\//i.test(path) ? path : apiUrl(path);
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(
      (data && data.error) || `Request failed (${res.status})`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Authed fetch: attaches the live ID token, and on a 401 refreshes the
 * session once (POST /api/auth/token) and retries — so admin/member
 * actions survive token expiry instead of failing with "session expired".
 * Dynamic import avoids a static cycle with authService.
 */
export async function apiFetchAuth(path, options = {}) {
  const { getLiveSession, refreshLiveToken } = await import("./authService.js");
  async function once(token) {
    return apiFetch(path, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  }
  try {
    return await once(getLiveSession()?.idToken);
  } catch (err) {
    if (!err || err.status !== 401) throw err;
    const fresh = await refreshLiveToken().catch(() => null);
    if (!fresh) {
      err.sessionExpired = true;
      throw err;
    }
    try {
      return await once(fresh);
    } catch (retryErr) {
      retryErr.sessionExpired = retryErr && retryErr.status === 401;
      throw retryErr;
    }
  }
}
