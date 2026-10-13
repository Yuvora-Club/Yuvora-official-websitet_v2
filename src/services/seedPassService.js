// YUVORA seedPassService — eligibility + DEMO preview only.
//
// SECURITY MODEL (the UI is built around this):
// - A valid entry credential is NEVER generated in the browser. The browser
//   cannot mint passes, and a screenshot / name / client-drawn code proves
//   nothing.
// - The real pass is issued by the backend: an unpredictable opaque token
//   (e.g. signed JWT / random 256-bit id) embedded in the QR as a verification
//   URL like https://yuvora.org/check-in?t=<opaque-token>. The QR must NOT
//   contain names, emails or phone numbers.
// - The backend verifies genuineness, event match, and revocation / double-use
//   at scan time. Pass states: active | used | cancelled | revoked.
// - What this module returns in mock mode is a DEMO PREVIEW, visibly labelled,
//   containing a non-credential `DEMO-…` marker. It must not be accepted for entry.
//
// Backend contract (proposal):
//   GET /api/passes/:applicationId (auth, owner) -> { pass } | 403/404
//   pass: { token (opaque), verifyUrl, status: 'active'|'used'|'cancelled'|'revoked',
//           participantName, eventId, referenceId, issuedAt }

import { getEventById } from "../data/events.js";

export const SEED_PASS_MODE = "mock";
export const SEED_PASS_DEMO_NOTICE =
  "Demo pass preview — not a valid entry credential. Real passes are issued by the backend after confirmation.";

function hashToken(seed) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < seed.length; i++) {
    h1 = Math.imul(h1 ^ seed.charCodeAt(i), 0x01000193) >>> 0;
    h2 = Math.imul(h2 + seed.charCodeAt(i), 0x811c9dc5) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`.toUpperCase();
}

/**
 * Can a Seed Pass be shown for this application? Mirrors the organizer's
 * configured rules; the backend re-checks at issuance.
 */
export function passEligibility(application) {
  if (!application) return { eligible: false, reason: "No application found." };
  if (application.regStatus === "cancelled") return { eligible: false, reason: "This application was cancelled." };
  if (application.regStatus === "rejected") return { eligible: false, reason: "This application was not accepted." };
  if (application.regStatus === "refunded") return { eligible: false, reason: "This registration was refunded." };
  if (application.regStatus !== "confirmed") {
    return { eligible: false, reason: "Seed Pass unlocks after the organizer confirms your application." };
  }
  const event = getEventById(application.eventId);
  if (!event) return { eligible: false, reason: "Event not found." };
  if (!event.sampleFee) return { eligible: true, reason: "" };
  if (application.paymentStatus === "verified") return { eligible: true, reason: "" };
  if (
    application.paymentMethod === "on_visit" &&
    event.passRules.allowPayOnVisitConfirmed
  ) {
    return { eligible: true, reason: "" };
  }
  if (application.paymentMethod === "online" && event.passRules.requirePaymentVerified) {
    return { eligible: false, reason: "Online payment must be verified before the pass unlocks." };
  }
  return { eligible: false, reason: "Payment conditions for the pass are not met yet." };
}

/**
 * MOCK preview pass. Contains a DEMO marker, never a credential.
 * Real implementation: fetch the backend-issued pass instead.
 */
export function getDemoPassPreview(application) {
  const check = passEligibility(application);
  if (!check.eligible) return { ok: false, ...check, mock: true };
  const event = getEventById(application.eventId);
  const marker = `DEMO-${hashToken(`${application.id}::${application.eventId}`).slice(0, 12)}`;
  return {
    ok: true,
    eligible: true,
    mock: true,
    demo: true,
    pass: {
      marker,
      status: "active",
      statusNote: "Demo preview state — real states (active / used / cancelled / revoked) come from the backend.",
      participantName: application.name,
      eventTitle: event.title,
      timeLabel: event.timeLabel,
      venue: event.isOnline ? `Online — ${event.onlineNote || "link shared later"}` : event.venue,
      referenceId: application.id,
      issuedNote: "Preview only. A backend-issued token will appear here after integration.",
    },
  };
}

/** Deterministic decorative grid for the DEMO code (not a real QR). */
export function demoCodeGrid(marker, size = 21) {
  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const h = hashToken(`${marker}:${x},${y}`);
      cells.push(parseInt(h.slice((x + y) % 14, (x + y) % 14 + 2), 16) % 3 === 0);
    }
  }
  return { size, cells };
}
