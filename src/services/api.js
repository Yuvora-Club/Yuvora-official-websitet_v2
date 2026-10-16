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
