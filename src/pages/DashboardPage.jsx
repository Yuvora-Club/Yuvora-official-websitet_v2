// Member dashboard — UI refresh only. Auth flow untouched:
// useAuth() -> user, logout() + navigate("/"), SIDE_LINKS hrefs,
// and user fields (fullName/name/email/altEmail/phone/age) all preserved.
// New bits (tabs, vibe, daily sprout, water streak, copy ID) are
// localStorage-only play — no backend calls.

import { useEffect, useMemo, useState } from "react";
import { isAdminUser, logout } from "../services/authService.js";
import { navigate } from "../services/router.js";
import { useAuth } from "../state/useAuth.js";
import { listAnnouncements } from "../services/announcementsService.js";
import SportsBoard from "../components/SportsBoard.jsx";

const SIDE_LINKS = [
  { id: "announcements", label: "Announcements", icon: "✿", href: "/dashboard" },
  { id: "members", label: "Members", icon: "❧", href: "/members" },
  { id: "home", label: "Back to site", icon: "←", href: "/" },
];

const VIBES = [
  { id: "Athlete", icon: "☀", blurb: "dusty shoes era" },
  { id: "Builder", icon: "⌨", blurb: "ship-it mode" },
  { id: "Founder", icon: "◈", blurb: "pitch-day energy" },
  { id: "Raver", icon: "☾", blurb: "glow-paint ready" },
  { id: "Volunteer", icon: "✿", blurb: "watering crew" },
];

const SPROUTS = [
  { text: "Say hi to one new face in your grove today.", tag: "tiny + brave" },
  { text: "Sketch your dream seed-pass in the logbook.", tag: "doodle break" },
  { text: "Teach someone one thing you learned this week.", tag: "shade others" },
  { text: "Walk a field you have never played on.", tag: "touch grass" },
  { text: "Demo something half-broken. Loud applause anyway.", tag: "build grove" },
  { text: "Write one line about tonight's moon. Keep it.", tag: "after dark" },
];

const VIBE_KEY = "yuvora.v1.dash.vibe";
const WATER_KEY = "yuvora.v1.dash.water";
const SPROUT_KEY = "yuvora.v1.dash.sprout";

// Local calendar day (YYYY-MM-DD). The old version used toISOString (UTC),
// so the sprout + watering rolled over at 5:30am IST instead of midnight.
function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 864e5);
}

function dailySproutSeed(date = new Date()) {
  if (SPROUTS.length === 0) return 0;
  return (date.getFullYear() * 1000 + dayOfYear(date)) % SPROUTS.length;
}

function loadVibe() {
  try {
    const v = window.localStorage.getItem(VIBE_KEY);
    if (VIBES.some((x) => x.id === v)) return v;
  } catch {
    /* private mode — fall through */
  }
  return "Builder";
}

function loadWater() {
  try {
    const raw = window.localStorage.getItem(WATER_KEY);
    if (!raw) return { count: 0, last: null };
    const p = JSON.parse(raw);
    const count = Number.isFinite(p.count) ? Math.max(0, Math.floor(p.count)) : 0;
    return { count, last: typeof p.last === "string" ? p.last : null };
  } catch {
    /* ignore */
  }
  return { count: 0, last: null };
}

// Sprout persists per day: shuffles survive refresh, a new day reseeds.
function loadSproutIdx() {
  const fallback = dailySproutSeed();
  try {
    const raw = window.localStorage.getItem(SPROUT_KEY);
    if (!raw) return fallback;
    const p = JSON.parse(raw);
    if (p.date === todayStr() && Number.isInteger(p.idx) && p.idx >= 0 && p.idx < SPROUTS.length) {
      return p.idx;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function plantFor(count) {
  if (count <= 0) return { emoji: "🌱", label: "seed" };
  if (count <= 2) return { emoji: "🌱", label: "sprout" };
  if (count <= 4) return { emoji: "🌿", label: "sapling" };
  if (count <= 6) return { emoji: "🌳", label: "tree" };
  return { emoji: "🌳✨", label: "glowing grove" };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("grove");
  const [vibe, setVibe] = useState(loadVibe);
  const [sproutIdx, setSproutIdx] = useState(loadSproutIdx);
  const [water, setWater] = useState(loadWater);
  const [copied, setCopied] = useState(false);
  // Live notice board — whatever an admin posts on /admin sprouts here.
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { announcements: list } = await listAnnouncements();
      if (alive) {
        setAnnouncements(list);
        setAnnLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(VIBE_KEY, vibe);
    } catch {
      /* storage blocked */
    }
  }, [vibe]);

  useEffect(() => {
    try {
      window.localStorage.setItem(WATER_KEY, JSON.stringify(water));
    } catch {
      /* storage blocked */
    }
  }, [water]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SPROUT_KEY, JSON.stringify({ date: todayStr(), idx: sproutIdx }));
    } catch {
      /* storage blocked */
    }
  }, [sproutIdx]);

  const vibeInfo = VIBES.find((v) => v.id === vibe) || VIBES[1];
  const waterToday = water.last === todayStr();
  const plant = plantFor(water.count);
  const safeIdx = Number.isInteger(sproutIdx) && sproutIdx >= 0 && sproutIdx < SPROUTS.length ? sproutIdx : dailySproutSeed();
  const sprout = SPROUTS[safeIdx] || SPROUTS[0];

  const memberId = useMemo(() => {
    const src = (user && (user.id || user.email || user.name)) || "yuvora";
    let h = 0;
    for (let i = 0; i < src.length; i++) h = (Math.imul(h, 31) + src.charCodeAt(i)) >>> 0;
    return `YV-${String((h % 9000) + 1000)}`;
  }, [user]);

  if (!user) {
    return (
      <section className="wrap members-page dash-wrap">
        <div className="sec-head reveal in">
          <span className="sec-no">✿ dashboard</span>
          <h2>
            Sign in to see your <em>dashboard</em>
          </h2>
          <p>Your grove notices live here — members only.</p>
        </div>
        <div className="dash-gate reveal in">
          <div className="dash-gate-card">
            <span className="dash-sticker" aria-hidden="true">members only ✿</span>
            <p className="dash-hand">psst — your seed pass is waiting…</p>
            <div className="members-cta">
              <a className="btn btn-clay" href="/login?next=%2Fdashboard">
                Log in →
              </a>
              <a className="btn btn-paper" href="/join">
                Join Yuvora →
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const firstName = (user.name || "").trim().split(/\s+/)[0] || "Seedling";
  const fullName = user.fullName || user.name || "—";

  function onLogout() {
    logout();
    navigate("/");
  }

  function onWater() {
    if (water.last === todayStr()) return;
    setWater((w) => ({ count: (w.count || 0) + 1, last: todayStr() }));
  }

  function onShuffle() {
    if (SPROUTS.length <= 1) return;
    let next = safeIdx;
    while (next === safeIdx) {
      next = Math.floor(Math.random() * SPROUTS.length);
    }
    setSproutIdx(next);
  }

  function onResetPlay() {
    setVibe("Builder");
    setWater({ count: 0, last: null });
    setSproutIdx(dailySproutSeed());
    try {
      window.localStorage.removeItem(VIBE_KEY);
      window.localStorage.removeItem(WATER_KEY);
      window.localStorage.removeItem(SPROUT_KEY);
    } catch {
      /* storage blocked */
    }
  }

  async function onCopyId() {
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(memberId);
      else throw new Error("no clipboard");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = memberId;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      } catch {
        /* copy unavailable — still show feedback */
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="wrap members-page dash-wrap">
      <div className="sec-head reveal in">
        <span className="sec-no">✿ dashboard</span>
        <h2>
          Welcome, <em>{firstName}</em>
        </h2>
        <p>
          Your corner of the grove — notices first, everything else as it
          grows. Feeling <b>{vibeInfo.icon} {vibe.toLowerCase()}</b> today?{" "}
          <span className="dash-hand-inline">{vibeInfo.blurb} —</span>
        </p>
      </div>

      <div className="dash-layout reveal in">
        <aside className="dash-side dash-side-plus">
          <div className="dash-profile">
            <span className="dash-avatar" aria-hidden="true">
              {(fullName || "Y").trim().charAt(0).toUpperCase()}
            </span>
            <div className="dash-who">
              <b>{fullName}</b>
              <small>{user.email || "—"}</small>
              <button type="button" className="dash-id" onClick={onCopyId} title="Copy member ID">
                {memberId} · {copied ? "copied ✓" : "tap to copy"}
              </button>
            </div>
          </div>

          <div className="dash-vibes">
            <span className="dash-mini-title">today&apos;s vibe — tap one</span>
            <div className="dash-vibe-row">
              {VIBES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={v.id === vibe ? "dash-vibe active" : "dash-vibe"}
                  onClick={() => setVibe(v.id)}
                  aria-pressed={v.id === vibe}
                  title={`${v.id} — ${v.blurb}`}
                >
                  {v.icon}
                </button>
              ))}
            </div>
          </div>

          <nav aria-label="Dashboard sections">
            {SIDE_LINKS.map((l) => (
              <a
                key={l.id}
                href={l.href}
                className={
                  l.id === "announcements" ? "dash-link active" : "dash-link"
                }
                aria-current={l.id === "announcements" ? "page" : undefined}
              >
                <span aria-hidden="true">{l.icon}</span>
                {l.label}
              </a>
            ))}
            {isAdminUser(user) && (
              <a href="/admin" className="dash-link dash-link-admin">
                <span aria-hidden="true">★</span>
                Back to admin
              </a>
            )}
          </nav>
          <button className="btn btn-paper" type="button" onClick={onLogout}>
            Log out
          </button>
        </aside>

        <div className="dash-main">
          <div className="dash-tabs" role="tablist" aria-label="Dashboard sections">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "grove"}
              className={tab === "grove" ? "dash-tab active" : "dash-tab"}
              onClick={() => setTab("grove")}
            >
              ✿ Grove
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "sports"}
              className={tab === "sports" ? "dash-tab active" : "dash-tab"}
              onClick={() => setTab("sports")}
            >
              ⚽ Sports
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "settings"}
              className={tab === "settings" ? "dash-tab active" : "dash-tab"}
              onClick={() => setTab("settings")}
            >
              ⚙ Settings
            </button>
          </div>

          {tab === "grove" ? (
            <>
              {isAdminUser(user) && (
                <div className="notice-admin-bar">
                  <span aria-hidden="true">★</span>
                  <p>
                    You&apos;re signed in as an <b>admin</b> — post and manage board notices in the greenhouse.
                  </p>
                  <a className="btn btn-ink dash-btn" href="/admin">
                    Open admin panel →
                  </a>
                </div>
              )}
              <div className="dash-grid">
                <article className="dash-card dash-pass">
                  <span className="dash-sticker" aria-hidden="true">seed pass ✿</span>
                  <div className="dash-pass-top">
                    <span>✿ YUVORA · {vibe.toUpperCase()}</span>
                    <span>{memberId}</span>
                  </div>
                  <div className="dash-pass-name">{fullName}</div>
                  <div className="dash-pass-sub">
                    {vibeInfo.icon} {vibeInfo.blurb} · pressed on campus
                  </div>
                  <div className="dash-pass-meta">
                    <span>play ✓</span>
                    <span>build ✓</span>
                    <span>gather ✓</span>
                    <span>moon ✓</span>
                  </div>
                  <div className="dash-barcode" aria-hidden="true" />
                  <p className="dash-hand">flash at the gate, dusty shoes ok —</p>
                </article>

                <article className="dash-card dash-play">
                  <span className="dash-sticker dash-sticker-clay" aria-hidden="true">
                    daily sprout 🌱
                  </span>
                  <p className="dash-mini-title">your tiny mission</p>
                  <p className="dash-sprout" key={safeIdx} aria-live="polite">
                    “{sprout.text}”
                  </p>
                  <span className="dash-tag">{sprout.tag}</span>
                  <div className="dash-play-row">
                    <button type="button" className="btn btn-paper dash-btn" onClick={onShuffle}>
                      Shuffle ↻
                    </button>
                    <button
                      type="button"
                      className={waterToday ? "btn btn-paper dash-btn dash-watered" : "btn btn-clay dash-btn"}
                      onClick={onWater}
                      disabled={waterToday}
                    >
                      {waterToday ? "Watered ✓" : `Water ${plant.emoji}`}
                    </button>
                  </div>
                  <div className="dash-plant">
                    <span className="dash-plant-emoji" aria-hidden="true">{plant.emoji}</span>
                    <div>
                      <b>{plant.label} · ×{water.count} watered</b>
                      <small>{waterToday ? "see? you showed up today." : "one tap = one watering. no overthinking."}</small>
                    </div>
                  </div>
                </article>
              </div>

              <article className="notice-board" aria-live="polite">
                <div className="notice-head">
                  <div>
                    <span className="dash-sticker" aria-hidden="true">📢 notice board</span>
                    <h3>Announcements</h3>
                    <p className="join-sub">One after another, newest first — straight from the crew.</p>
                  </div>
                  <span className="notice-count" aria-label={`${announcements.length} announcements`}>
                    {annLoading ? "…" : announcements.length}
                  </span>
                </div>
                {annLoading ? (
                  <p className="join-sub">Pinning fresh notices…</p>
                ) : announcements.length === 0 ? (
                  <div className="notice-empty">
                    <span className="notice-empty-leaf" aria-hidden="true">❧</span>
                    <b>Quiet grove — nothing pinned yet.</b>
                    <p>When the crew posts a notice, it appears here in order.</p>
                  </div>
                ) : (
                  <ol className="notice-list">
                    {announcements.map((a, i) => (
                      <li key={a.id} className="notice-item">
                        <span className="notice-rail" aria-hidden="true">
                          <i className="notice-dot" />
                          {i < announcements.length - 1 && <i className="notice-line" />}
                        </span>
                        <div className="notice-card">
                          <div className="notice-top">
                            {a.createdAt && (
                              <time className="notice-date" dateTime={a.createdAt}>
                                {new Date(a.createdAt).toLocaleDateString(undefined, {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </time>
                            )}
                            {a.tag && <span className="dash-tag">{a.tag}</span>}
                          </div>
                          <b className="notice-title">{a.title}</b>
                          <p className="notice-body">{a.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            </>
          ) : tab === "sports" ? (
            <SportsBoard user={user} />
          ) : (
            <>
              <div className="join-card dash-card-wide">
                <h3>Your details 🌱</h3>
                <p className="join-sub">
                  Exactly what you gave us when you joined — password never shown,
                  never stored here.
                </p>
                <dl className="dash-facts">
                  <div>
                    <dt>Full name</dt>
                    <dd>{user.fullName || user.name || "—"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{user.email || "—"}</dd>
                  </div>
                  {user.altEmail ? (
                    <div>
                      <dt>Alternate email</dt>
                      <dd>{user.altEmail}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Phone</dt>
                    <dd>{user.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt>Age</dt>
                    <dd>{user.age ?? "—"}</dd>
                  </div>
                </dl>
              </div>

              <div className="join-card dash-card-wide">
                <h3>Play preferences 🌿</h3>
                <p className="join-sub">
                  Just this browser — vibe, sprout and watering live here, never on
                  the backend.
                </p>
                <dl className="dash-facts">
                  <div>
                    <dt>Today&apos;s vibe</dt>
                    <dd>{vibeInfo.icon} {vibe}</dd>
                  </div>
                  <div>
                    <dt>Plant</dt>
                    <dd>{plant.emoji} {plant.label} · ×{water.count}</dd>
                  </div>
                  <div>
                    <dt>Member ID</dt>
                    <dd>{memberId}</dd>
                  </div>
                </dl>
                <div className="dash-play-row">
                  <button type="button" className="btn btn-paper dash-btn" onClick={onResetPlay}>
                    Reset play data ↻
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
