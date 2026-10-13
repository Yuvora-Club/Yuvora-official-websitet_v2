// YUVORA eventsService — reads the central catalog today, backend tomorrow.
//
// Current source: `src/data/events.js` (SAMPLE DATA). To connect the real
// database, replace the body of `listEvents` / `getEvent` with:
//   GET /api/events       -> { events: Event[] }
//   GET /api/events/:id   -> { event: Event | null }
// and keep the return shapes below. Components must import from this file,
// never from `../data/events.js` directly.

import { EVENTS, SAMPLE_DATA, categoryLabel, formatFee, formatRegWindow, getEventById, getEventStatus } from "../data/events.js";

export { SAMPLE_DATA, categoryLabel, formatFee, formatRegWindow, getEventStatus };

/** List events, optionally filtered by category id. MOCK source: sample data. */
export function listEvents(category = "all") {
  const all = [...EVENTS];
  if (!category || category === "all") return { events: all, mock: true, sample: SAMPLE_DATA };
  return { events: all.filter((e) => e.category === category), mock: true, sample: SAMPLE_DATA };
}

/** Get one event by id or slug. MOCK source: sample data. */
export function getEvent(id) {
  const event = getEventById(id);
  return { event, mock: true, sample: SAMPLE_DATA };
}

/** Whether the Apply button may be shown for this event right now. */
export function applyAvailability(event, now = new Date()) {
  const { status, reason } = getEventStatus(event, now);
  if (status === "open") return { canApply: true, status, reason };
  return { canApply: false, status, reason };
}
