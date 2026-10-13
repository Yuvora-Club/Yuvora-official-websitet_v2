// YUVORA paymentsService — MOCK-ONLY adapter (development).
//
// HARD RULES (enforced by this module, not just docs):
// - No card details are ever collected or stored — there is no field for them.
// - Clicking a button NEVER marks payment verified. Only a (currently
//   simulated) provider webhook can do that, and the simulation is explicitly
//   labelled DEMO in the UI.
// - The real integration must confirm payment via a trusted backend / verified
//   webhook (e.g. Razorpay/Stripe signature verification server-side). The
//   frontend must treat `verified` as a backend-issued fact.
//
// Backend contract (proposal):
//   POST /api/payments/intent { applicationId } -> { intentId, amountPaise, provider, keyId }
//   webhook POST /api/payments/webhook (provider-signed) -> updates application
//   GET  /api/payments/:applicationId (auth) -> { paymentStatus, intentId }
// Frontend never handles provider secrets.

import { mockApplyPaymentResult, mockRetryPayment } from "./applicationsService.js";
import { getEventById } from "../data/events.js";

export const PAYMENT_MODE = "mock";
export const PAYMENT_MODE_NOTICE =
  "Demo payments — no money moves here. Online confirmation needs the real payment provider + backend webhook.";

let intents = [];

/**
 * MOCK create-intent: records an order summary locally and returns PENDING.
 * Never verified at creation.
 */
export function createMockIntent(application) {
  if (!application) return { ok: false, error: "Application not found." };
  const event = getEventById(application.eventId);
  if (!event) return { ok: false, error: "Event not found." };
  if (application.paymentMethod !== "online") {
    return { ok: false, error: "This application does not use online payment." };
  }
  const intent = {
    intentId: `demo_intent_${application.id}`,
    applicationId: application.id,
    amountPaise: (event.sampleFee || 0) * 100,
    currency: event.currency || "INR",
    status: "pending",
    createdAt: new Date().toISOString(),
    mock: true,
  };
  intents = [...intents.filter((i) => i.applicationId !== application.id), intent];
  return { ok: true, intent, mock: true };
}

export function getMockIntent(applicationId) {
  return intents.find((i) => i.applicationId === applicationId) || null;
}

/**
 * MOCK-ONLY simulated provider webhook. Called only from the clearly-labelled
 * "Simulate provider callback (demo)" control. The real system deletes this
 * path entirely — verification arrives from the provider to the backend.
 */
export function mockProviderWebhook(applicationId, userId, outcome) {
  if (!["success", "failed"].includes(outcome)) return { ok: false, error: "Unknown outcome." };
  return mockApplyPaymentResult(applicationId, userId, outcome);
}

/** MOCK retry: back to pending, never to verified. */
export function retryMockPayment(applicationId, userId) {
  return mockRetryPayment(applicationId, userId);
}

export function paymentSummaryFor(application) {
  const event = application ? getEventById(application.eventId) : null;
  return {
    method: application?.paymentMethod || "none",
    status: application?.paymentStatus || "not_required",
    amountLabel: !event || !event.sampleFee ? "Free" : `₹${event.sampleFee} (sample fee)`,
    dueNote:
      application?.paymentMethod === "on_visit"
        ? "Due at the venue. Selecting this does not mean payment has been collected."
        : application?.paymentMethod === "online"
          ? "Payable online via the future payment provider. Nothing is charged in demo mode."
          : "No payment needed for this event.",
  };
}
