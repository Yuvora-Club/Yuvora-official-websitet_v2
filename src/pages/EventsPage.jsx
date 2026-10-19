// Events discovery page. Reads through eventsService (sample data today,
// backend tomorrow). Theme and card language reuse the existing grove styles.

import { useMemo, useState } from "react";
import { EVENT_CATEGORIES } from "../data/events.js";
import { formatFee, formatRegWindow, getEventStatus, listEvents, SAMPLE_DATA } from "../services/eventsService.js";
import { DemoNotice, StatusPill } from "../components/eventBits.jsx";

const STATUS_LABEL = { open: "Open", upcoming: "Upcoming", full: "Full", closed: "Closed" };

function EventCard({ event }) {
  const { status } = getEventStatus(event);
  return (
    <article className="sport ev-card reveal in">
      <div className="sport-banner">
        <span className="ball" style={{ background: event.tint }} aria-hidden="true">
          {event.glyph}
        </span>
        <span>
          {event.title}
          <br />
          <span className="micro">
            {event.category} · {event.timeLabel}
          </span>
        </span>
      </div>
      <div className="sport-body">
        <StatusPill status={status} label={`● ${STATUS_LABEL[status]}`} />
        <span className="tag">{formatFee(event)}</span>
        <p className="sport-note">
          {event.tagline}
          <br />
          <em>↳ {event.isOnline ? "online gathering" : event.venue}</em>
        </p>
        <div className="ev-meta">
          <span>reg: {formatRegWindow(event)}</span>
        </div>
        <div className="fee-row">
          <span>{event.timeLabel}</span>
          <a href={`/events/${event.id}`}>Details →</a>
        </div>
      </div>
    </article>
  );
}

export default function EventsPage() {
  const [category, setCategory] = useState("all");
  const { events } = useMemo(() => listEvents(category), [category]);

  return (
    <section className="wrap members-page">
      <div className="sec-head reveal in">
        <span className="sec-no">❧ 10 — events</span>
        <h2>
          Find your <em>gathering</em>
        </h2>
        <p>
          Leagues, jams and summits with honest sign-ups. Pick a section, open an event, and apply —{" "}
          <b>your Seed Pass activates only after a confirmed application.</b>
        </p>
      </div>

      {SAMPLE_DATA && <DemoNotice text="Sample schedule — dates, venues, fees and seat counts are placeholders until the database is connected." />}

      <div className="vibe-pick reveal in" role="tablist" aria-label="Event categories">
        {[{ id: "all", label: "All" }, ...EVENT_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))].map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={category === c.id}
            className={category === c.id ? "active" : ""}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="note-bar reveal in">
          <b>NOTHING HERE →</b>
          <span>No events in this section right now. Try another category.</span>
        </div>
      ) : (
        <div className="sports">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}

      <div className="note-bar reveal in">
        <b>HOW APPLYING GROWS →</b>
        <span>
          Open an event → Apply → sign in → confirm details and payment choice → organizer confirms → Seed Pass unlocks in My Events.
        </span>
      </div>
    </section>
  );
}
