// YUVORA checkInService — organizer interface contract + MOCK-ONLY logic.
//
// The check-in screen is an organizer tool: it must be authorization-gated and
// backed by server-side verification before it can be trusted. This module
// defines the contract and a demo implementation so the UI can be built now.
//
// Backend contract (proposal):
//   POST /api/check-in/verify { token } (organizer auth)
//     -> { result: 'valid'|'already_used'|'cancelled'|'invalid'|'wrong_event',
//          participant?, event?, checkedInAt? }
//   POST /api/check-in/confirm { token, eventId } (organizer auth, idempotent)
//     -> { result: 'checked_in'|'already_used'|'cancelled'|'invalid'|'wrong_event' }
// The backend must: verify the token signature, confirm it belongs to the
// event being scanned, reject revoked/cancelled passes, and prevent the same
// pass being accepted twice (atomic consume).
//
// MOCK behaviour: tokens starting with `DEMO-` are recognised as demo
// previews and ALWAYS reported as non-entry demo codes. Anything else is
// `invalid` in mock mode. The mock keeps an in-memory + localStorage log of
// demo scans so double-scan UI states can be previewed.

import { readJSON, writeJSON } from "./store.js";

const SCAN_LOG_KEY = "yuvora.v1.mock.checkin";

function loadLog() {
  const log = readJSON(SCAN_LOG_KEY, {});
  return log && typeof log === "object" ? log : {};
}

function saveLog(log) {
  writeJSON(SCAN_LOG_KEY, log);
}

export function parseTokenInput(raw) {
  const input = (raw || "").trim();
  if (!input) return { ok: false, error: "Enter or scan a pass identifier." };
  // Accept either a bare token or a verification URL containing ?t=<token>.
  const match = input.match(/[?&]t=([^&\s]+)/);
  const token = (match ? match[1] : input).trim().toUpperCase();
  if (token.length < 6) return { ok: false, error: "That identifier looks too short — check the scan." };
  return { ok: true, token };
}

/**
 * MOCK verify — never trusts the browser. Demo tokens are reported as demo;
 * everything else is invalid until the backend exists.
 */
export function mockVerifyToken(token) {
  const log = loadLog();
  if (token.startsWith("DEMO-")) {
    const seen = log[token] || 0;
    return {
      ok: true,
      mock: true,
      result: "demo",
      detail: "Demo preview code — not a valid entry credential. Real passes verify against the backend.",
      scans: seen,
    };
  }
  return { ok: true, mock: true, result: "invalid", detail: "Unknown identifier in demo mode. Real verification needs the backend.", scans: 0 };
}

/** MOCK record of a demo scan (lets the UI preview already-used states). */
export function mockRecordDemoScan(token) {
  const log = loadLog();
  log[token] = (log[token] || 0) + 1;
  saveLog(log);
  return log[token];
}

export function mockResetDemoScans() {
  writeJSON(SCAN_LOG_KEY, {});
}
