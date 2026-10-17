// YUVORA — central event catalog.
//
// DEVELOPMENT SAMPLE DATA. Nothing here is a real schedule, confirmed venue,
// actual fee, or live seat count. Every number below is a clearly-marked
// sample so the UI can be built and tested before the team's database is
// connected. The backend will replace this file's contents without any
// layout changes: components must read through `eventsService`, never this
// array directly.
//
// Expected backend shape (for the database team — field names are a
// proposal, not a schema assumption):
//   GET /api/events            -> { events: Event[] }
//   GET /api/events/:id        -> { event: Event }
// Event: { id, slug, title, category: 'play'|'build'|'gather', tagline,
//   description, startsAt (ISO), endsAt (ISO|null), timeLabel, venue,
//   isOnline, onlineNote, feePaise (int, 0 = free), currency,
//   capacity (int|null), seatsTaken (int), regOpensAt (ISO|null),
//   regClosesAt (ISO|null), payments: { online: bool, onVisit: bool },
//   passRules: { requirePaymentVerified: bool, allowPayOnVisitConfirmed: bool },
//   tint, glyph }

export const SAMPLE_DATA = true;

export const EVENT_CATEGORIES = [
  { id: "play", label: "Play", glyph: "☀", tagline: "Leagues, matches & loud sidelines" },
  { id: "build", label: "Build", glyph: "⌨", tagline: "Workshops, jams & shipped things" },
  { id: "gather", label: "Gather", glyph: "☾", tagline: "Summits, socials & moonlit music" },
];

export function categoryLabel(id) {
  return (EVENT_CATEGORIES.find((c) => c.id === id) || {}).label || id;
}

// Sample fees are in rupees and labelled SAMPLE in the UI. The real fee
// comes from the backend later.
export const EVENTS = [
  {
    id: "golden-hour-volleyball",
    slug: "golden-hour-volleyball",
    title: "Golden Hour Volleyball League",
    category: "play",
    tagline: "6v6 rally scoring under floodlights",
    description:
      "A slow-burn evening league: round-robin groups, then semis and a final under lights. Student refs, washed bibs, and a chalk bracket on the board.",
    startsAt: "2026-11-08T16:30:00+05:30",
    endsAt: "2026-11-08T19:30:00+05:30",
    timeLabel: "Sun 8 Nov · 4:30–7:30 pm",
    venue: "Mud + mat court, main ground",
    isOnline: false,
    onlineNote: "",
    sampleFee: 80,
    currency: "INR",
    capacitySample: 48,
    seatsTakenSample: 31,
    regOpensAt: "2026-09-01T00:00:00+05:30",
    regClosesAt: "2026-11-01T23:59:00+05:30",
    payments: { online: true, onVisit: true },
    passRules: { requirePaymentVerified: true, allowPayOnVisitConfirmed: true },
    tint: "#E9DFB8",
    glyph: "☀",
  },
  {
    id: "box-cricket-friday",
    slug: "box-cricket-friday",
    title: "Friday Night Box Cricket",
    category: "play",
    tagline: "8-a-side tennis-ball smash in the cage",
    description:
      "Fast 5-over games in the floodlit box cage. Bat, booking and the scorer's notebook are on us — bring studs and loud friends.",
    startsAt: "2026-11-20T19:00:00+05:30",
    endsAt: "2026-11-20T22:00:00+05:30",
    timeLabel: "Fri 20 Nov · 7–10 pm",
    venue: "Box cage, floodlit",
    isOnline: false,
    onlineNote: "",
    sampleFee: 100,
    currency: "INR",
    capacitySample: 32,
    seatsTakenSample: 19,
    regOpensAt: "2026-09-15T00:00:00+05:30",
    regClosesAt: "2026-11-15T23:59:00+05:30",
    payments: { online: true, onVisit: false },
    passRules: { requirePaymentVerified: true, allowPayOnVisitConfirmed: false },
    tint: "#CBD8BD",
    glyph: "☀",
  },
  {
    id: "web-jam-hackclub",
    slug: "web-jam-hackclub",
    title: "Hack Club Web Jam",
    category: "build",
    tagline: "Build a tiny site, ship it the same evening",
    description:
      "Zero-to-demo web jam in the greenhouse: personal sites, tiny games and bots, with seniors potting beside you. Free for everyone; demos on the little stage.",
    startsAt: "2026-10-25T16:00:00+05:30",
    endsAt: "2026-10-25T19:00:00+05:30",
    timeLabel: "Sun 25 Oct · 4–7 pm",
    venue: "Build greenhouse, club room",
    isOnline: false,
    onlineNote: "",
    sampleFee: 0,
    currency: "INR",
    capacitySample: 60,
    seatsTakenSample: 44,
    regOpensAt: "2026-09-01T00:00:00+05:30",
    regClosesAt: "2026-10-23T23:59:00+05:30",
    payments: { online: false, onVisit: false },
    passRules: { requirePaymentVerified: false, allowPayOnVisitConfirmed: false },
    tint: "#D4E2C8",
    glyph: "⌨",
  },
  {
    id: "tech-solder-sunday",
    slug: "tech-solder-sunday",
    title: "Tech & Solder Sunday",
    category: "build",
    tagline: "Sensors, PCBs and blink-everything boards",
    description:
      "A slow Sunday of hardware: solder your first sensor board and take it home blinking. Kits are arranged by the club; seats are few on purpose.",
    startsAt: "2026-12-06T11:00:00+05:30",
    endsAt: "2026-12-06T14:00:00+05:30",
    timeLabel: "Sun 6 Dec · 11 am–2 pm",
    venue: "Build greenhouse, club room",
    isOnline: false,
    onlineNote: "",
    sampleFee: 150,
    currency: "INR",
    capacitySample: 24,
    seatsTakenSample: 0,
    regOpensAt: "2026-11-10T00:00:00+05:30",
    regClosesAt: "2026-12-03T23:59:00+05:30",
    payments: { online: true, onVisit: true },
    passRules: { requirePaymentVerified: true, allowPayOnVisitConfirmed: true },
    tint: "#F3D2B8",
    glyph: "⌨",
  },
  {
    id: "founder-mela",
    slug: "founder-mela",
    title: "Founder Mela — Day Summit",
    category: "gather",
    tagline: "Stalls, 5-min pitches and the mock-deal bell",
    description:
      "Student startups on jute-covered tables, gentle judges, a flea-market demo lane and the worst-idea comedy round. Sample data: this edition is shown as full.",
    startsAt: "2026-11-29T10:00:00+05:30",
    endsAt: "2026-11-29T16:00:00+05:30",
    timeLabel: "Sun 29 Nov · 10 am–4 pm",
    venue: "Main hall + demo lane",
    isOnline: false,
    onlineNote: "",
    sampleFee: 50,
    currency: "INR",
    capacitySample: 120,
    seatsTakenSample: 120,
    regOpensAt: "2026-09-01T00:00:00+05:30",
    regClosesAt: "2026-11-20T23:59:00+05:30",
    payments: { online: true, onVisit: true },
    passRules: { requirePaymentVerified: true, allowPayOnVisitConfirmed: true },
    tint: "#f6e8c8",
    glyph: "◈",
  },
  {
    id: "terrace-frequency",
    slug: "terrace-frequency",
    title: "Terrace Frequency + Glow Social",
    category: "gather",
    tagline: "Open mic melting into a student DJ close",
    description:
      "Guitars, beatbox and a DJ close under 214 fairy bulbs. Sample data: registration for this edition has closed.",
    startsAt: "2026-10-04T18:00:00+05:30",
    endsAt: "2026-10-04T22:00:00+05:30",
    timeLabel: "Sun 4 Oct · 6–10 pm",
    venue: "Terrace, north block",
    isOnline: false,
    onlineNote: "",
    sampleFee: 49,
    currency: "INR",
    capacitySample: 80,
    seatsTakenSample: 63,
    regOpensAt: "2026-08-15T00:00:00+05:30",
    regClosesAt: "2026-10-01T23:59:00+05:30",
    payments: { online: true, onVisit: true },
    passRules: { requirePaymentVerified: true, allowPayOnVisitConfirmed: true },
    tint: "#F3D2D2",
    glyph: "☾",
  },
];

export function getEventById(id) {
  return EVENTS.find((e) => e.id === id || e.slug === id) || null;
}

/**
 * Registration availability for an event.
 * Precedence: closed (past close / past start) > full > upcoming > open.
 * Returns { status: 'open'|'upcoming'|'full'|'closed', reason }.
 */
export function getEventStatus(event, now = new Date()) {
  if (!event) return { status: "closed", reason: "Event not found." };
  const t = now instanceof Date ? now : new Date(now);
  if (event.startsAt && new Date(event.startsAt) <= t) {
    return { status: "closed", reason: "This edition has already started." };
  }
  if (event.regClosesAt && new Date(event.regClosesAt) <= t) {
    return { status: "closed", reason: "Registration has closed for this edition." };
  }
  if (
    typeof event.capacitySample === "number" &&
    typeof event.seatsTakenSample === "number" &&
    event.seatsTakenSample >= event.capacitySample
  ) {
    return { status: "full", reason: "All sample seats are taken." };
  }
  if (event.regOpensAt && new Date(event.regOpensAt) > t) {
    return { status: "upcoming", reason: "Registration opens soon." };
  }
  return { status: "open", reason: "Registration is open." };
}

export function formatFee(event) {
  if (!event) return "";
  if (!event.sampleFee) return "Free";
  return `₹${event.sampleFee} (sample fee)`;
}

export function formatRegWindow(event) {
  const fmt = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const open = event.regOpensAt ? fmt(event.regOpensAt) : "—";
  const close = event.regClosesAt ? fmt(event.regClosesAt) : "—";
  return `${open} → ${close}`;
}
