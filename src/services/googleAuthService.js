// YUVORA — Google "Continue with Google" plumbing for the auth pages.
//
// Flow (matches the REST backend, no Firebase SDK on the frontend):
//   1. Google Identity Services (GIS) renders the official button.
//   2. Google returns a one-time ID token (JWT) to our callback.
//   3. authService.loginWithGoogle(credential) POSTs it to
//      /api/auth/google, which exchanges it with Firebase and returns the
//      same { user, idToken, refreshToken } session as password login.
//
// Configuration (Frontend/.env.development + .env.production + Render):
//   VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
// While the env var is empty, the button simply does not render — every
// call site stays safe.

const GSI_SRC = "https://accounts.google.com/gsi/client";

/** The configured Google OAuth Client ID ("" when not configured). */
export function googleClientId() {
  return String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
}

export function isGoogleConfigured() {
  return googleClientId().length > 0;
}

let poolPromise = null;

/**
 * Loads the GIS script exactly once and resolves `window.google.accounts.id`.
 * Resolves null if the script fails to load (offline, blocked script, etc.)
 * so callers can degrade gracefully instead of crashing the page.
 */
function loadGoogleIdentity() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!poolPromise) {
    poolPromise = new Promise((resolve) => {
      const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(window.google?.accounts?.id || null), { once: true });
        existing.addEventListener("error", () => resolve(null), { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = GSI_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve(window.google?.accounts?.id || null);
      s.onerror = () => {
        poolPromise = null; // allow a retry if the network recovers
        resolve(null);
      };
      document.head.appendChild(s);
    });
  }
  return poolPromise;
}

/**
 * Renders the official Google button into `element`.
 * Resolves { ok: true } | { ok: false, formError } — never throws.
 */
export async function renderGoogleButton(element, clientId, onCredential) {
  const gsi = await loadGoogleIdentity();
  if (!gsi || !element) {
    return { ok: false, formError: "Google sign-in couldn't load. Check your connection and refresh the page." };
  }
  try {
    gsi.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) onCredential(response.credential);
      },
    });
    gsi.renderButton(element, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "left",
      width: 280,
    });
    return { ok: true };
  } catch {
    return { ok: false, formError: "Google sign-in couldn't start. Refresh the page and try again." };
  }
}
