// YUVORA groveApplicationsService — MOCK-ONLY store for dashboard event
// applications (development).
//
// Applications live in browser localStorage under
// `yuvora.v1.mock.groveApplications` so the dashboard journey can be tested
// end-to-end. Honest rules, matching the event-application business rules:
// - No dates, no capacity, no availability checks — any listed event is
//   always appliable. Duplicate (user, event) applications are blocked.
// - Paid events (Play, Build): paymentPreference is 'online' | 'offline'.
//   'online' is a FUTURE preference only ("coming soon") — selecting it never
//   charges anything and never marks payment verified. 'offline' is a
//   preference too — never marked received. paymentStatus stays 'pending'.
// - Free events (Gather): paymentPreference 'none', paymentStatus
//   'not_required'. No payment UI, no payment data.
// - regStatus is 'submitted' on creation. There is no auto-confirm path here.
// - The authenticated user object (from useAuth) owns the userId. A
//   member-supplied id is never trusted.
//
// Backend contract (proposal, mirrors applicationsService conventions):
//   POST /api/grove-applications { groveId, eventId, name, email, phone,
//     answers, paymentPreference, note } -> 201 { application }
//     | 409 { error: 'duplicate_application' }
//   GET  /api/grove-applications/mine (auth) -> { applications }
//   POST /api/grove-applications/:id/cancel (auth, owner) -> { application }
// Application: { id, groveId, eventId, eventTitle, userId, name, email,
//   phone, answers, paymentPreference: 'online'|'offline'|'none',
//   paymentStatus: 'pending'|'not_required', status: 'submitted'|'cancelled',
//   createdAt, mock: true }

import { notify, readJSON, subscribeTo, snapshotOf, writeJSON } from "./store.js";
import { getGrove, getGroveEvent } from "../data/groves.js";

const KEY = "yuvora.v1.mock.groveApplications";
const CHANNEL = "groveApplications";

export function subscribeGroveApplications(listener) {
  return subscribeTo(CHANNEL, listener);
}

export function groveApplicationsSnapshot() {
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
  const bytes =
    typeof crypto !== "undefined" && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(6))
      : Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
  for (const b of bytes) tail += abc[b % abc.length];
  return `YV-${new Date().getFullYear()}-${tail}`;
}

function cleanPhone(phone) {
  return (phone || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
}

function validateAnswers(event, answers) {
  const a = answers || {};
  if (event.kind === "duo") {
    if (!["singles", "doubles"].includes(a.badmintonMode)) return "Choose singles or doubles.";
    return "";
  }
  if (event.kind === "team") {
    if (!["solo", "friends", "team"].includes(a.teamStyle)) return "Tell us how you are applying.";
    return "";
  }
  if (event.kind === "build") {
    if (!Array.isArray(a.interests) || a.interests.length === 0) return "Pick at least one build interest.";
    return "";
  }
  if (event.kind === "founder") {
    if (!["attend", "pitch", "stalls", "volunteer"].includes(a.role)) return "Tell us how you want to join the Mela.";
    if (a.role === "pitch" && (a.idea || "").trim().length > 0 && (a.idea || "").trim().length < 3) {
      return "Your idea note looks too short — a few words is enough.";
    }
    return "";
  }
  if (event.kind === "bazaar") {
    if (!["explore", "demo", "volunteer"].includes(a.role)) return "Tell us how you want to join the Bazaar.";
    if (a.role === "demo" && (a.project || "").trim().length > 0 && (a.project || "").trim().length < 2) {
      return "Your project name looks too short.";
    }
    return "";
  }
  return "";
}

/** All grove applications for one user, newest first. MOCK. */
export function listMyGroveApplications(userId) {
  if (!userId) return { applications: [], mock: true };
  const apps = loadAll()
    .filter((a) => a.userId === userId)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return { applications: apps, mock: true };
}

/** Existing live application for this user+event, if any. MOCK. */
export function findExistingGroveApplication(userId, eventId) {
  if (!userId || !eventId) return null;
  return loadAll().find((a) => a.userId === userId && a.eventId === eventId && a.status !== "cancelled") || null;
}

/** MOCK submit — creates a 'submitted' application. Never confirmed here. */
export function submitGroveApplication({ groveId, eventId, user, contact, answers, paymentPreference, note }) {
  const grove = getGrove(groveId);
  const event = getGroveEvent(eventId);
  if (!grove || !event || event.groveId !== grove.id) return { ok: false, error: "That event is not available right now." };
  if (!user || !user.id) return { ok: false, error: "Sign in to apply." };

  const existing = findExistingGroveApplication(user.id, event.id);
  if (existing) {
    return { ok: false, error: "You have already applied for this event.", application: existing, duplicate: true };
  }

  const name = (contact?.name || user.fullName || user.name || "").trim();
  const email = (contact?.email || user.email || "").trim();
  const phone = cleanPhone(contact?.phone ?? user.phone ?? "");
  if (name.length < 2) return { ok: false, error: "Please confirm your full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "Please confirm a valid email." };
  if (phone.length !== 10) return { ok: false, error: "Please confirm a 10-digit contact number." };

  const answerError = validateAnswers(event, answers);
  if (answerError) return { ok: false, error: answerError };

  let method = "none";
  let paymentStatus = "not_required";
  if (event.priced) {
    if (!["online", "offline"].includes(paymentPreference)) return { ok: false, error: "Choose a payment preference." };
    method = paymentPreference;
    // Honest state: a preference, never proof of payment. Online is
    // "coming soon" — nothing is charged, nothing is verified.
    paymentStatus = "pending";
  } else if (paymentPreference && paymentPreference !== "none") {
    return { ok: false, error: "This event is free — no payment needed." };
  }

  const now = new Date().toISOString();
  const app = {
    id: refId(),
    groveId: grove.id,
    eventId: event.id,
    eventTitle: event.title,
    userId: user.id,
    name,
    email,
    phone,
    answers: answers || {},
    paymentPreference: method,
    paymentStatus,
    status: "submitted",
    note: (note || "").trim().slice(0, 500),
    createdAt: now,
    mock: true,
  };
  const all = loadAll();
  all.push(app);
  saveAll(all);
  return { ok: true, application: app };
}

/** MOCK owner cancel. */
export function cancelGroveApplication(applicationId, userId) {
  const all = loadAll();
  const app = all.find((a) => a.id === applicationId && a.userId === userId);
  if (!app) return { ok: false, error: "Application not found." };
  if (app.status === "cancelled") return { ok: true, application: app };
  app.status = "cancelled";
  saveAll(all);
  return { ok: true, application: app };
}
