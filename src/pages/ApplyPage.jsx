// Event application: summary → confirm details → payment choice → submit.
// Signed-out visitors are routed to sign in and returned here afterwards.

import { useState } from "react";
import { useAuth } from "../state/useAuth.js";
import { getEvent } from "../services/eventsService.js";
import { applyAvailability } from "../services/eventsService.js";
import { findExistingApplication, submitApplication } from "../services/applicationsService.js";
import { navigate } from "../services/router.js";
import { DemoNotice } from "../components/eventBits.jsx";

export default function ApplyPage({ eventId }) {
  const { user } = useAuth();
  const { event } = getEvent(eventId);
  const [name, setName] = useState(() => user?.name || "");
  const [email, setEmail] = useState(() => user?.email || "");
  const [phone, setPhone] = useState(() => user?.phone || "");
  const [method, setMethod] = useState(() =>
    !event || !event.sampleFee ? "none" : event.payments.online ? "online" : "on_visit",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!event) {
    return (
      <section className="wrap members-page">
        <div className="sec-head reveal in">
          <span className="sec-no">❧ 12 — apply</span>
          <h2>Nothing to <em>apply for</em></h2>
          <p>That event identifier did not sprout anything.</p>
        </div>
        <div className="members-cta">
          <a className="btn btn-clay" href="/events">Browse events →</a>
        </div>
      </section>
    );
  }

  const avail = applyAvailability(event);
  const free = !event.sampleFee;

  if (!user) {
    const next = `/apply/${event.id}`;
    return (
      <section className="wrap members-page">
        <div className="sec-head reveal in">
          <span className="sec-no">❧ 12 — apply</span>
          <h2>Sign in to <em>apply</em></h2>
          <p>
            Applying for <b>{event.title}</b> needs an account first — we will bring you straight back here.
          </p>
        </div>
        <div className="members-cta reveal in">
          <a className="btn btn-clay" href={`/login?next=${encodeURIComponent(next)}`}>Sign in →</a>
          <a className="btn btn-paper" href={`/register?next=${encodeURIComponent(next)}`}>Create account →</a>
          <a className="btn btn-paper" href={`/events/${event.id}`}>← Event details</a>
        </div>
      </section>
    );
  }

  const existing = findExistingApplication(user.id, event.id);

  if (!avail.canApply && !existing) {
    return (
      <section className="wrap members-page">
        <div className="sec-head reveal in">
          <span className="sec-no">❧ 12 — apply</span>
          <h2>Applications <em>paused</em></h2>
          <p>{avail.reason}</p>
        </div>
        <div className="members-cta">
          <a className="btn btn-paper" href={`/events/${event.id}`}>← Event details</a>
          <a className="btn btn-paper" href="/my-events">My Events →</a>
        </div>
      </section>
    );
  }

  if (existing) {
    return (
      <section className="wrap members-page">
        <div className="sec-head reveal in">
          <span className="sec-no">❧ 12 — apply</span>
          <h2>Already <em>applied</em></h2>
          <p>
            Your application <b>{existing.id}</b> for {event.title} is on record — duplicates are blocked
            (the backend will enforce this too). Track it in My Events.
          </p>
        </div>
        <div className="members-cta">
          <a className="btn btn-clay" href="/my-events">Open My Events →</a>
          <a className="btn btn-paper" href={`/events/${event.id}`}>← Event details</a>
        </div>
      </section>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    await new Promise((r) => setTimeout(r, 400));
    const res = submitApplication({ eventId: event.id, user, contact: { name, email, phone }, paymentMethod: method });
    setBusy(false);
    if (!res.ok) {
      setError(res.error || "Could not submit the application.");
      return;
    }
    navigate("/my-events");
  }

  return (
    <section className="wrap members-page">
      <div className="sec-head reveal in">
        <span className="sec-no">❧ 12 — apply</span>
        <h2>Apply for <em>{event.title.split("—")[0].split(":")[0]}</em></h2>
        <p>
          {event.timeLabel} · {event.isOnline ? "Online" : event.venue} ·{" "}
          <b>{free ? "Free" : `₹${event.sampleFee} sample fee`}</b>. Submitting creates a pending
          application — <b>never an instant confirmation.</b>
        </p>
      </div>
      <DemoNotice text="Demo applications live in this browser only. Duplicate applications are blocked here; the backend must enforce uniqueness on (user, event)." />

      <form className="ev-apply reveal in" onSubmit={onSubmit}>
        <div className="ev-applysummary">
          <h3>Application summary</h3>
          <dl>
            <div><dt>Event</dt><dd>{event.title}</dd></div>
            <div><dt>When</dt><dd>{event.timeLabel}</dd></div>
            <div><dt>Where</dt><dd>{event.isOnline ? "Online" : event.venue}</dd></div>
            <div><dt>Fee</dt><dd>{free ? "Free" : `₹${event.sampleFee} (sample fee)`}</dd></div>
          </dl>
        </div>

        <div className="ev-applyfields">
          <h3>Confirm your details</h3>
          <label className="field" htmlFor="apply-name">
            Full name
            <input id="apply-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" />
          </label>
          <label className="field" htmlFor="apply-email">
            Email address
            <input id="apply-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="field" htmlFor="apply-phone">
            Contact number
            <input id="apply-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" autoComplete="tel" />
          </label>

          {!free && (
            <fieldset className="ev-paychoice">
              <legend>Payment method</legend>
              {event.payments.online && (
                <label>
                  <input type="radio" name="paymethod" checked={method === "online"} onChange={() => setMethod("online")} />
                  <span><b>Pay Online</b> — via the future payment provider. Nothing is charged in demo mode; confirmation needs the backend webhook.</span>
                </label>
              )}
              {event.payments.onVisit && (
                <label>
                  <input type="radio" name="paymethod" checked={method === "on_visit"} onChange={() => setMethod("on_visit")} />
                  <span><b>Pay on Visit</b> — due at the venue. Selecting this does not mean payment has been collected.</span>
                </label>
              )}
            </fieldset>
          )}

          {error && <p className="ev-formerror" role="alert">{error}</p>}
          <div className="members-cta">
            <button className="btn btn-clay" type="submit" disabled={busy}>
              {busy ? "Submitting… (demo)" : "Confirm & submit application →"}
            </button>
            <a className="btn btn-paper" href={`/events/${event.id}`}>← Back</a>
          </div>
        </div>
      </form>
    </section>
  );
}
