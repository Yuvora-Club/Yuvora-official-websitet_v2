// Single event detail. Apply entry point with graceful full/closed handling.

import { applyAvailability, categoryLabel, formatFee, formatRegWindow, getEvent } from "../services/eventsService.js";
import { DemoNotice, StatusPill } from "../components/eventBits.jsx";

const STATUS_LABEL = { open: "Registration open", upcoming: "Registration upcoming", full: "Event full", closed: "Registration closed" };

export default function EventDetailPage({ eventId }) {
  const { event } = getEvent(eventId);

  if (!event) {
    return (
      <section className="wrap members-page">
        <div className="sec-head reveal in">
          <span className="sec-no">❧ 10 — events</span>
          <h2>
            No such <em>patch</em>
          </h2>
          <p>That event identifier did not sprout anything.</p>
        </div>
        <div className="members-cta">
          <a className="btn btn-clay" href="/events">Browse events →</a>
          <a className="btn btn-paper" href="/">← Back to sunlight</a>
        </div>
      </section>
    );
  }

  const avail = applyAvailability(event);
  const free = !event.sampleFee;

  return (
    <section className="wrap members-page">
      <div className="sec-head reveal in">
        <span className="sec-no">❧ 10 — {event.category}</span>
        <h2>
          {event.title.split("—")[0].split(":")[0]} <em>{categoryLabel(event.category)}</em>
        </h2>
        <p>
          {event.description} <b>{event.tagline}.</b>
        </p>
      </div>

      <DemoNotice text="Sample event — schedule, venue, fee and seats are placeholders until the database is connected." />

      <div className="ev-detail">
        <div className="sport reveal in">
          <div className="sport-banner">
            <span className="ball" style={{ background: event.tint }} aria-hidden="true">
              {event.glyph}
            </span>
            <span>
              {event.title}
              <br />
              <span className="micro">{event.timeLabel}</span>
            </span>
          </div>
          <div className="sport-body">
            <StatusPill status={avail.status} label={`● ${STATUS_LABEL[avail.status]}`} />
            <span className="tag">{formatFee(event)}</span>
            <dl>
              <div><dt>Date</dt><dd>{event.timeLabel}</dd></div>
              <div><dt>Venue</dt><dd>{event.isOnline ? "Online" : event.venue}</dd></div>
            </dl>
            <dl>
              <div><dt>Registration</dt><dd>{formatRegWindow(event)}</dd></div>
              <div><dt>Seats (sample)</dt><dd>{event.seatsTakenSample} / {event.capacitySample}</dd></div>
            </dl>
            <p className="sport-note">
              {free ? "Free gathering — no payment needed." : `Sample fee ${formatFee(event)}. `}
              {event.payments.online && event.payments.onVisit
                ? "Pay online or at the venue."
                : event.payments.online
                  ? "Online payment only."
                  : event.payments.onVisit
                    ? "Pay at the venue only."
                    : ""}
              <br />
              <em>↳ seed pass unlocks after organizer confirmation</em>
            </p>
            {!avail.canApply && (
              <div className="ev-warn" role="status">
                {avail.reason} Applications are paused for this edition.
              </div>
            )}
            <div className="fee-row">
              <span>{free ? "free entry" : formatFee(event)}</span>
              {avail.canApply ? (
                <a href={`/apply/${event.id}`}>Apply for Event →</a>
              ) : (
                <span aria-disabled="true">Apply paused</span>
              )}
            </div>
          </div>
        </div>

        <aside className="ev-side reveal in">
          <h3>How applying works</h3>
          <ol>
            <li>Sign in or create a demo account.</li>
            <li>Confirm your contact details.</li>
            <li>Choose online or pay-on-visit{event.payments.online && !event.payments.onVisit ? " (online only for this event)" : ""}.</li>
            <li>Track status in My Events — the pass appears after confirmation.</li>
          </ol>
          <div className="members-cta">
            <a className="btn btn-paper" href="/events">← All events</a>
            <a className="btn btn-paper" href="/my-events">My Events →</a>
          </div>
        </aside>
      </div>
    </section>
  );
}
