// YUVORA — Grove event catalog for the member dashboard application experience.
//
// Single source of truth for Play / Build / Gather discovery. Business rules
// enforced by this file's shape:
// - NO fixed dates, NO countdowns, NO availability/capacity/seat counts.
// - Play + Build carry an INDICATIVE contribution range only (never a final price).
// - Gather events are FREE (no payment fields, no amounts).
// - No venues are promised; subtitles are vibe lines from the event concept,
//   not confirmed bookings.
//
// This catalog is intentionally separate from `src/data/events.js` (the older
// sample schedule with placeholder dates/fees/seats). That file is preserved
// untouched; this one follows the finalized application rules.

export const INDICATIVE_CONTRIBUTION_LABEL = "Expected contribution: around ₹100–₹200 per person. Final details will be confirmed later.";
export const FREE_LABEL = "Free to attend";
export const TBA_LABEL = "Date to be announced";

export const GROVES = [
  {
    id: "play",
    name: "Play Grove",
    short: "PLAY GROVE",
    tagline: "Move, compete, cheer, repeat.",
    intro: "Sports, movement, teamwork and campus fun — competitive without being intimidating.",
    glyph: "☀",
  },
  {
    id: "build",
    name: "Build Grove",
    short: "BUILD GROVE",
    tagline: "Make something. Ship something. Learn something.",
    intro: "Building, coding, experimentation and hands-on workshops with other students.",
    glyph: "⌨",
  },
  {
    id: "gather",
    name: "Gather Grove",
    short: "GATHER GROVE",
    tagline: "Meet people. Trade ideas. Explore everything.",
    intro: "Entrepreneurship, technology, discovery and student-led community.",
    glyph: "◈",
  },
];

export function getGrove(id) {
  return GROVES.find((g) => g.id === id) || null;
}

export const GROVE_EVENTS = [
  // ---- Play Grove (5 sports, exact supplied concepts) ----
  {
    id: "play-volleyball",
    groveId: "play",
    title: "Volleyball",
    subtitle: "Mud + mat court · Golden hour league",
    category: "Team sport",
    format: "6v6 · Best of 3",
    squad: "Squad of 8–10",
    description: "Rotation + rally scoring. Bibs washed, dried & folded by juniors.",
    whisper: "Smells of dust + evening chai",
    kind: "team",
    priced: true,
    formHeading: "Ready to hit the court?",
    glyph: "☀",
    tint: "#E9DFB8",
  },
  {
    id: "play-football",
    groveId: "play",
    title: "Football",
    subtitle: "Turf, monsoon-soft · Sat + Sun mornings",
    category: "Team sport",
    format: "7v7 turf · 2×15 min",
    squad: "Squad of 10–12",
    description: "Turf ball + student ref included. Bring studs, we bring lime powder lines.",
    whisper: "Grass stains guaranteed",
    kind: "team",
    priced: true,
    formHeading: "Ready to chase the ball?",
    glyph: "⚽",
    tint: "#D4E2C8",
  },
  {
    id: "play-badminton",
    groveId: "play",
    title: "Badminton",
    subtitle: "Indoor wooden court · Slow Sunday brackets",
    category: "Singles + doubles",
    format: "Singles + doubles",
    squad: "1 or 2 players",
    description: "Our only solo/duo event. Feather shuttles + court + umpire sorted.",
    whisper: "The quietest, tensest room",
    kind: "duo",
    priced: true,
    formHeading: "Ready for the quiet, tense room?",
    glyph: "🏸",
    tint: "#F3D2D2",
  },
  {
    id: "play-cricket",
    groveId: "play",
    title: "Cricket",
    subtitle: "Box cage, floodlit · Friday night lights",
    category: "Team sport",
    format: "8-a-side · tennis ball",
    squad: "Squad of 10",
    description: "Fast 5-over smash. Bat, box booking + scorer's notebook on us.",
    whisper: "Every ball is a new opportunity. Every innings is a new story",
    kind: "team",
    priced: true,
    formHeading: "Ready for Friday night lights?",
    glyph: "🏏",
    tint: "#CBD8BD",
  },
  {
    id: "play-basketball",
    groveId: "play",
    title: "Basketball",
    subtitle: "Outdoor asphalt · Sunset runs",
    category: "Team sport",
    format: "5v5 · 4×8 min",
    squad: "Squad of 8–10",
    description: "Full-court runs. Reversible jerseys, pine-scented bench spray.",
    whisper: "Squeak of shoes at dusk",
    kind: "team",
    priced: true,
    formHeading: "Ready for sunset runs?",
    glyph: "🏀",
    tint: "#F3D2B8",
  },
  // ---- Build Grove (one general application option) ----
  {
    id: "build-workshops-projects",
    groveId: "build",
    title: "Build Grove — Workshops & Projects",
    subtitle: "Coding · hardware · creative tech · hands-on workshops",
    category: "Workshops & projects",
    format: "Build together · demo together",
    squad: "Solo or with friends",
    description:
      "Coding and software, hardware and robotics, creative technology and hands-on workshops — build projects with other students, or just come to explore and learn.",
    whisper: "Build first. Figure it out together.",
    kind: "build",
    priced: true,
    formHeading: "Let's ship something.",
    glyph: "⌨",
    tint: "#D4E2C8",
  },
  // ---- Gather Grove (free experiences) ----
  {
    id: "gather-founder-mela",
    groveId: "gather",
    title: "Founder Mela",
    subtitle: "Entrepreneur Summit · day fest · stall no. 1–24",
    category: "Entrepreneur community",
    format: "5-minute lightning pitches · worst-idea comedy round · mock-deal bell",
    squad: "Just bring curiosity",
    description:
      "Student startups on jute-covered tables, local founders as gentle judges, a flea-market demo lane and handshake deals counted in applause, not rupees.",
    whisper: "Pitch, haggle, sip chai →",
    kind: "founder",
    priced: false,
    formHeading: "Pitch an idea. Meet your people.",
    glyph: "◈",
    tint: "#f6e8c8",
  },
  {
    id: "gather-build-bazaar",
    groveId: "gather",
    title: "Build Bazaar",
    subtitle: "Tech Summit / Fair · show + tell · touch allowed",
    category: "Tech discovery",
    format: "Try-it zones · sticker passports · teardown corner — guilt-free",
    squad: "Wanderers welcome",
    description:
      "Robots, tech boards, games and glowing sites. Sticker passports for wanderers, a teardown table of dead remotes, and seniors who explain without sighing.",
    whisper: "Unscrew everything, ask anything",
    kind: "bazaar",
    priced: false,
    formHeading: "Come explore the Build Bazaar.",
    glyph: "◎",
    tint: "#dfe7d2",
  },
];

export function getGroveEvent(id) {
  return GROVE_EVENTS.find((e) => e.id === id) || null;
}

export function listGroveEvents(groveId) {
  return GROVE_EVENTS.filter((e) => e.groveId === groveId);
}

export function priceLabelFor(event) {
  if (!event) return "";
  return event.priced ? INDICATIVE_CONTRIBUTION_LABEL : FREE_LABEL;
}
