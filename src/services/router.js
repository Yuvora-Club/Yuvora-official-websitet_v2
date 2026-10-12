// Tiny router for the no-dependency SPA. Internal paths only.

export function navigate(path) {
  if (typeof window === "undefined") return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function parseRoute() {
  if (typeof window === "undefined") return { name: "home", param: null };
  if (window.location.hash === "#/members") return { name: "members", param: null };
  const url = new URL(window.location.href);
  const path = (url.pathname || "/").replace(/\/+$/, "") || "/";
  const seg = path.split("/").filter(Boolean);
  if (seg.length === 0) return { name: "home", param: null };
  if (seg[0] === "members") return { name: "members", param: null };
  if (seg[0] === "join") return { name: "join", param: null };
  if (seg[0] === "terms") return { name: "terms", param: null };
  if (seg[0] === "privacy") return { name: "privacy", param: null };
  if (seg[0] === "events" && seg.length === 1) return { name: "events", param: null };
  if (seg[0] === "events" && seg.length === 2) return { name: "eventDetail", param: decodeURIComponent(seg[1]) };
  if (seg[0] === "login") return { name: "login", param: url.searchParams.get("next") || null };
  if (seg[0] === "register") return { name: "register", param: url.searchParams.get("next") || null };
  if (seg[0] === "apply" && seg.length === 2) return { name: "apply", param: decodeURIComponent(seg[1]) };
  if (seg[0] === "my-events") return { name: "myevents", param: null };
  if (seg[0] === "pass" && seg.length === 2) return { name: "pass", param: decodeURIComponent(seg[1]) };
  if (seg[0] === "check-in") return { name: "checkin", param: null };
  return { name: "notfound", param: path };
}

export function isInternalAppPath(href) {
  if (!href || !href.startsWith("/")) return false;
  if (href.startsWith("/#")) return false;
  const clean = href.split("?")[0].replace(/\/+$/, "") || "/";
  const first = clean.split("/").filter(Boolean)[0];
  if (!first) return true; // "/"
  return ["members", "join", "terms", "privacy", "events", "login", "register", "apply", "my-events", "pass", "check-in"].includes(first);
}

export const TITLES = {
  home: "Yuvora — Student-Led Club | Play. Build. Gather.",
  members: "Members — Yuvora | Meet the crew",
  join: "Join Us — Yuvora | Grow with the grove",
  terms: "Terms & Conditions — Yuvora",
  privacy: "Privacy Policy — Yuvora",
  events: "Events — Yuvora | Play. Build. Gather.",
  eventDetail: "Event — Yuvora",
  login: "Sign in — Yuvora",
  register: "Create account — Yuvora",
  apply: "Apply for event — Yuvora",
  myevents: "My Events — Yuvora",
  pass: "Seed Pass — Yuvora",
  checkin: "Check-in (organizers) — Yuvora",
  notfound: "404 — Wandered off the trail · Yuvora",
};
