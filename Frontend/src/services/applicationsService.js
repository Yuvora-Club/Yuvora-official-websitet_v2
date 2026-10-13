// YUVORA applicationsService — MOCK-ONLY store (development).
//
// Applications live in browser localStorage under `yuvora.v1.mock.applications`
// so the full UI journey can be tested. The real backend MUST re-enforce all
// rules server-side — especially duplicate prevention and status transitions.
//
// Backend contract (proposal):
//   POST /api/applications { eventId, name, email, phone, paymentMethod }
//     -> 201 { application } | 409 { error: 'duplicate_application' }
//   GET  /api/applications/mine (auth) -> { applications: Application[] }
//   GET  /api/applications/:id (auth, owner-or-organizer) -> { application }
//   POST /api/applications/:id/cancel (auth, owner) -> { application }
// Application: { id, eventId, userId, name, email, phone,
//   paymentMethod: 'online'|'on_visit'|'none',
//   paymentStatus: 'not_required'|'pending'|'verified'|'failed',
//   regStatus: 'submitted'|'awaiting_payment'|'awaiting_confirmation'|
//              'confirmed'|'rejected'|'cancelled'|'refunded',
//   createdAt, updatedAt, history: [{ at, note }] }
// Only the backend (organizer action / verified webhook) may move an
// application to `confirmed`, `rejected` or `refunded`.

import { notify, readJSON, subscribeTo, snapshotOf, writeJSON } from "./store.js";
import { getEventById } from "../data/events.js";

const KEY = "yuvora.v1.mock.applications";
const CHANNEL = "applications";

export const APPLICATION_STATUSES = [
  "submitted",
  "awaiting_payment",
  "awaiting_confirmation",
  "confirmed",
  "rejected",
  "cancelled",
  "refunded",
];

export const REG_STATUS_LABEL = {
  submitted: "Application submitted",
  awaiting_payment: "Awaiting payment",
  awaiting_confirmation: "Awaiting organizer confirmation",
  confirmed: "Confirmed",
  rejected: "Not accepted",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_LABEL = {
  not_required: "No payment needed",
  pending: "Payment pending",
  verified: "Payment verified",
  failed: "Payment failed",
};

export function subscribeApplications(listener) {
  return subscribeTo(CHANNEL, listener);
}

export function applicationsSnapshot() {
  return snapshotOf(CHANNEL);
}

function loadAll() {
  const list = readJSON(KEY, []);
  return Array.isArray(list) ? list : [];
}

function saveAll(list) {
  writeJSON(KEY, list);
  notify(CHANNEL);
}

function refId() {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let tail = "";
  const bytes = typeof crypto !== "undefined" && crypto.getRandomValues
    ? crypto.getRandomValues(new Uint8Array(6))
    : Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
  for (const b of bytes) tail += abc[b % abc.length];
  return `YV-${new Date().getFullYear()}-${tail}`;
}

function touch(app, note) {
  app.updatedAt = new Date().toISOString();
  app.history = [...(app.history || []), { at: app.updatedAt, note }];
  return app;
}

/** All applications for one user, newest first. MOCK. */
export function listMyApplications(userId) {
  if (!userId) return { applications: [], mock: true };
  const apps = loadAll()
    .filter((a) => a.userId === userId)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return { applications: apps, mock: true };
}

/** One application if it belongs to the user. MOCK. */
export function getApplication(applicationId, userId) {
  const app = loadAll().find((a) => a.id === applicationId && (!userId || a.userId === userId));
  return { application: app || null, mock: true };
}

/** Existing live application for this user+event, if any. MOCK. */
export function findExistingApplication(userId, eventId) {
  if (!userId || !eventId) return null;
  return (
    loadAll().find(
      (a) =>
        a.userId === userId &&
        a.eventId === eventId &&
        !["cancelled", "rejected", "refunded"].includes(a.regStatus),
    ) || null
  );
}

/**
 * MOCK submit — creates the application in `awaiting_*` state. NEVER
 * `confirmed`: confirmation is an organizer/backend action only.
 */
export function submitApplication({ eventId, user, contact, paymentMethod }) {
  const event = getEventById(eventId);
  if (!event) return { ok: false, error: "Event not found." };
  if (!user) return { ok: false, error: "Sign in to apply." };
  const existing = findExistingApplication(user.id, eventId);
  if (existing) {
    return { ok: false, error: "You have already applied for this event.", application: existing, duplicate: true };
  }
  const name = (contact?.name || user.name || "").trim();
  const email = (contact?.email || user.email || "").trim();
  const phone = (contact?.phone || user.phone || "").replace(/\D/g, "");
  if (name.length < 2) return { ok: false, error: "Please confirm your full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "Please confirm a valid email." };
  if (phone.length !== 10) return { ok: false, error: "Please confirm a 10-digit contact number." };

  const free = !event.sampleFee;
  let method = paymentMethod;
  if (free) {
    method = "none";
  } else {
    if (method === "online" && !event.payments.online) return { ok: false, error: "Online payment is not offered for this event." };
    if (method === "on_visit" && !event.payments.onVisit) {
      return { ok: false, error: "Pay-on-visit is not offered for this event." };
    }
    if (!["online", "on_visit"].includes(method)) return { ok: false, error: "Choose a payment method." };
  }

  const now = new Date().toISOString();
  const app = {
    id: refId(),
    eventId: event.id,
    userId: user.id,
    name,
    email,
    phone,
    paymentMethod: method,
    paymentStatus: free ? "not_required" : "pending",
    regStatus: free || method === "on_visit" ? "awaiting_confirmation" : "awaiting_payment",
    createdAt: now,
    updatedAt: now,
    history: [{ at: now, note: "Application submitted (demo store)." }],
    mock: true,
  };
  const all = loadAll();
  all.push(app);
  saveAll(all);
  return { ok: true, application: app };
}

/** MOCK owner cancel. */
export function cancelApplication(applicationId, userId) {
  const all = loadAll();
  const app = all.find((a) => a.id === applicationId && a.userId === userId);
  if (!app) return { ok: false, error: "Application not found." };
  if (["cancelled", "rejected"].includes(app.regStatus)) return { ok: true, application: app };
  if (app.regStatus === "confirmed") {
    return { ok: false, error: "Confirmed passes need an organizer to cancel. Write to the club." };
  }
  touch(app, "Cancelled by participant (demo store).");
  app.regStatus = "cancelled";
  saveAll(all);
  return { ok: true, application: app };
}

/**
 * MOCK-ONLY organizer simulation. This exists so the UI journey (including
 * Seed Pass eligibility) can be tested without a backend. It is always
 * labelled as a demo in the interface. The real backend must authorize
 * organizer roles and own this transition.
 */
export function mockOrganizerDecision(applicationId, decision) {
  const all = loadAll();
  const app = all.find((a) => a.id === applicationId);
  if (!app) return { ok: false, error: "Application not found." };
  if (!["approve", "reject"].includes(decision)) return { ok: false, error: "Unknown decision." };
  if (decision === "approve") {
    const event = getEventById(app.eventId);
    if (event && event.sampleFee && event.passRules.requirePaymentVerified) {
      const onlineNeedsVerification = app.paymentMethod === "online" && app.paymentStatus !== "verified";
      const visitAllowed = app.paymentMethod === "on_visit" && event.passRules.allowPayOnVisitConfirmed;
      if (onlineNeedsVerification && !visitAllowed && app.paymentMethod !== "none") {
        return { ok: false, error: "Online payment must be verified before approval (demo rule)." };
      }
    }
    touch(app, "Approved in DEMO organizer simulation — not a real confirmation.");
    app.regStatus = "confirmed";
  } else {
    touch(app, "Rejected in DEMO organizer simulation — not a real decision.");
    app.regStatus = "rejected";
  }
  saveAll(all);
  return { ok: true, application: app };
}

/** MOCK internal: used by paymentsService when a demo webhook fires. */
export function mockApplyPaymentResult(applicationId, userId, result) {
  const all = loadAll();
  const app = all.find((a) => a.id === applicationId && (!userId || a.userId === userId));
  if (!app) return { ok: false, error: "Application not found." };
  if (result === "success") {
    touch(app, "Demo payment webhook (simulated) marked payment verified.");
    app.paymentStatus = "verified";
    if (app.regStatus === "awaiting_payment") app.regStatus = "awaiting_confirmation";
  } else {
    touch(app, "Demo payment webhook (simulated) reported failure.");
    app.paymentStatus = "failed";
  }
  saveAll(all);
  return { ok: true, application: app };
}

/** MOCK internal: retry a failed payment back to pending. */
export function mockRetryPayment(applicationId, userId) {
  const all = loadAll();
  const app = all.find((a) => a.id === applicationId && (!userId || a.userId === userId));
  if (!app) return { ok: false, error: "Application not found." };
  touch(app, "Payment retried (demo store) — awaiting provider.");
  app.paymentStatus = "pending";
  if (app.regStatus !== "awaiting_confirmation") app.regStatus = "awaiting_payment";
  saveAll(all);
  return { ok: true, application: app };
}
