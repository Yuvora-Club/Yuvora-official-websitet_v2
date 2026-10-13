// My Events — participant dashboard. Application states, payment states
// (mock, never auto-verified), and Seed Pass availability per organizer rules.

import { useState, useSyncExternalStore } from "react";
import { useAuth } from "../state/useAuth.js";
import { getEventById } from "../data/events.js";
import {
  PAYMENT_STATUS_LABEL,
  REG_STATUS_LABEL,
  applicationsSnapshot,
  cancelApplication,
  listMyApplications,
  mockOrganizerDecision,
  subscribeApplications,
} from "../services/applicationsService.js";
import {
  PAYMENT_MODE_NOTICE,
  createMockIntent,
  mockProviderWebhook,
  paymentSummaryFor,
  retryMockPayment,
} from "../services/paymentsService.js";
import { passEligibility } from "../services/seedPassService.js";
import { DemoNotice, StatusPill } from "../components/eventBits.jsx";

function PaymentPanel({ application, refresh }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const summary = paymentSummaryFor(application);

  if (application.paymentMethod === "none") {
    return <p className="ev-paynote">No payment needed for this event.</p>;
  }
  if (application.paymentMethod === "on_visit") {
    return (
      <p className="ev-paynote">
        <b>Pay on visit</b> — {summary.dueNote} Status: <b>{PAYMENT_STATUS_LABEL[application.paymentStatus]}</b>
      </p>
    );
  }

  async function act(fn, ...args) {
    setBusy(true);
    setMsg("");
    await new Promise((r) => setTimeout(r, 400));
    const res = fn(...args);
    setBusy(false);
    if (!res.ok) setMsg(res.error || "Something did not sprout. Try again.");
    if (refresh) refresh();
  }

  return (
    <div className="ev-paypanel">
      <p className="ev-paynote">
        <b>Pay Online</b> — {summary.amountLabel}. Status: <b>{PAYMENT_STATUS_LABEL[application.paymentStatus]}</b>
      </p>
      <DemoNotice text={PAYMENT_MODE_NOTICE} />
      {application.paymentStatus === "pending" && (
        <div className="ev-paybtns">
          <button className="btn btn-clay" disabled={busy} onClick={() => act(createMockIntent, application)}>
            {busy ? "Working…" : "Continue to payment (demo) →"}
          </button>
        </div>
      )}
      {application.paymentStatus !== "verified" && (
        <details className="ev-sim">
          <summary>Simulate provider callback (demo only)</summary>
          <p>
            A real provider would call the backend webhook — never this button. These simulations exist only
            so the pending / success / failed / retry states can be previewed.
          </p>
          <div className="ev-paybtns">
            <button className="btn btn-paper" disabled={busy} onClick={() => act(mockProviderWebhook, application.id, application.userId, "success")}>
              Simulate success
            </button>
            <button className="btn btn-paper" disabled={busy} onClick={() => act(mockProviderWebhook, application.id, application.userId, "failed")}>
              Simulate failure
            </button>
            {application.paymentStatus === "failed" && (
              <button className="btn btn-paper" disabled={busy} onClick={() => act(retryMockPayment, application.id, application.userId)}>
                Retry payment ↻
              </button>
            )}
          </div>
        </details>
      )}
      {msg && <p className="ev-formerror" role="alert">{msg}</p>}
    </div>
  );
}

function ApplicationCard({ application }) {
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const [msg, setMsg] = useState("");
  const event = getEventById(application.eventId);
  const pass = passEligibility(application);
  const closed = ["cancelled", "rejected", "refunded"].includes(application.regStatus);

  if (!event) return null;

  return (
    <article className="sport reveal in">
      <div className="sport-banner">
        <span className="ball" style={{ background: event.tint }} aria-hidden="true">{event.glyph}</span>
        <span>
          {event.title}
          <br />
          <span className="micro">{event.timeLabel} · {event.isOnline ? "online" : event.venue}</span>
        </span>
      </div>
      <div className="sport-body">
        <StatusPill status={application.regStatus} label={`● ${REG_STATUS_LABEL[application.regStatus]}`} />
        <span className="tag">{PAYMENT_STATUS_LABEL[application.paymentStatus]}</span>
        <dl>
          <div><dt>Reference</dt><dd>{application.id}</dd></div>
          <div><dt>Paid via</dt><dd>{application.paymentMethod === "none" ? "—" : application.paymentMethod === "online" ? "Online" : "On visit"}</dd></div>
        </dl>

        <PaymentPanel application={application} refresh={refresh} />

        <div className="ev-passrow">
          {pass.eligible ? (
            <a className="btn btn-clay" href={`/pass/${application.id}`}>View Seed Pass ✿</a>
          ) : (
            <p className="ev-paynote" role="status">Seed Pass locked — {pass.reason}</p>
          )}
        </div>

        {!closed && application.regStatus !== "confirmed" && (
          <div className="ev-paybtns">
            <button
              className="btn btn-paper"
              onClick={() => {
                const res = cancelApplication(application.id, application.userId);
                if (!res.ok) setMsg(res.error);
                refresh();
              }}
            >
              Cancel application
            </button>
          </div>
        )}
        {msg && <p className="ev-formerror" role="alert">{msg}</p>}

        <details className="ev-sim">
          <summary>Demo organizer simulation (not a real decision)</summary>
          <p>
            Real confirmation comes from an authorized organizer via the backend. These buttons only preview
            the confirmed / rejected states in this browser.
          </p>
          <div className="ev-paybtns">
            <button
              className="btn btn-paper"
              onClick={() => {
                const res = mockOrganizerDecision(application.id, "approve");
                if (!res.ok) setMsg(res.error);
                refresh();
              }}
            >
              Simulate approval
            </button>
            <button
              className="btn btn-paper"
              onClick={() => {
                const res = mockOrganizerDecision(application.id, "reject");
                if (!res.ok) setMsg(res.error);
                refresh();
              }}
            >
              Simulate rejection
            </button>
          </div>
        </details>
      </div>
    </article>
  );
}

export default function MyEventsPage() {
  const { user } = useAuth();
  useSyncExternalStore(subscribeApplications, applicationsSnapshot, applicationsSnapshot);

  if (!user) {
    return (
      <section className="wrap members-page">
        <div className="sec-head reveal in">
          <span className="sec-no">❧ 13 — my events</span>
          <h2>Your <em>patch</em> awaits</h2>
          <p>Sign in to see the events you have applied for.</p>
        </div>
        <div className="members-cta reveal in">
          <a className="btn btn-clay" href="/login?next=%2Fmy-events">Sign in →</a>
          <a className="btn btn-paper" href="/events">Browse events →</a>
        </div>
      </section>
    );
  }

  const { applications } = listMyApplications(user.id);

  return (
    <section className="wrap members-page">
      <div className="sec-head reveal in">
        <span className="sec-no">❧ 13 — my events</span>
        <h2>
          {user.name.split(" ")[0]}&rsquo;s <em>events</em>
        </h2>
        <p>
          Every application, its payment state and its Seed Pass — <b>growing in one place.</b>
        </p>
      </div>
      <DemoNotice text="Demo dashboard — applications live in this browser only. Statuses change only through the labelled demo controls until the backend arrives." />
      {applications.length === 0 ? (
        <div className="note-bar reveal in">
          <b>UNSOWN PATCH →</b>
          <span>
            No applications yet. <a href="/events">Browse events</a> and apply — your passes will sprout here after confirmation.
          </span>
        </div>
      ) : (
        <div className="sports">
          {applications.map((a) => (
            <ApplicationCard key={a.id} application={a} />
          ))}
        </div>
      )}
    </section>
  );
}
