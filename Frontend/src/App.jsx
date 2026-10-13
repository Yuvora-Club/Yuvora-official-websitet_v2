import { useEffect, useMemo, useState } from "react";
import MembersPage from "./pages/MembersPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import JoinPage from "./pages/JoinPage.jsx";
import { LoginPage, RegisterPage } from "./pages/AuthPages.jsx";
import { TermsPage, PrivacyPage } from "./pages/LegalPages.jsx";

const HOME_TITLE = "Yuvora — Student-Led Club | Play. Build. Gather.";
const MEMBERS_TITLE = "Members — Yuvora | Meet the crew";
const JOIN_TITLE = "Join Us — Yuvora | Grow with the grove";
const LOGIN_TITLE = "Log in — Yuvora";
const REGISTER_TITLE = "Create account — Yuvora";
const TERMS_TITLE = "Terms & Conditions — Yuvora";
const PRIVACY_TITLE = "Privacy Policy — Yuvora";
const NOTFOUND_TITLE = "404 — Wandered off the trail · Yuvora";

function getRoute() {
  if (typeof window === "undefined") return "home";
  if (window.location.hash === "#/members") return "members";
  const path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
  if (path === "/members") return "members";
  if (path === "/join") return "join";
  if (path === "/login") return "login";
  if (path === "/register") return "register";
  if (path === "/terms") return "terms";
  if (path === "/privacy") return "privacy";
  if (path === "/") return "home";
  return "notfound";
}

// `?next=/where-to-go-after` passthrough for login/register.
function getNext() {
  if (typeof window === "undefined") return null;
  try {
    const n = new URL(window.location.href).searchParams.get("next");
    return n && n.startsWith("/") ? n : null;
  } catch {
    return null;
  }
}

const SPORTS = [
  {
    name: "Volleyball",
    short: "VB",
    color: "#E9DFB8",
    format: "6v6 · Best of 3",
    squad: "Squad of 8–10",
    ground: "Mud + mat court",
    time: "Golden hour league",
    type: "team",
    note: "Rotation + rally scoring. Bibs washed, dried & folded by juniors.",
    whisper: "smells of dust + evening chai",
  },
  {
    name: "Football",
    short: "FB",
    color: "#D4E2C8",
    format: "7v7 turf · 2×15 min",
    squad: "Squad of 10–12",
    ground: "Turf, monsoon-soft",
    time: "Sat + Sun mornings",
    type: "team",
    note: "Turf ball + student ref included. Bring studs, we bring lime powder lines.",
    whisper: "grass stains guaranteed",
  },
  {
    name: "Badminton",
    short: "BD",
    color: "#F3D2D2",
    format: "Singles + Doubles",
    squad: "1 or 2 players",
    ground: "Indoor wooden court",
    time: "Slow Sunday brackets",
    type: "duo",
    note: "Our only solo/duo event. Feather shuttles + court + umpire sorted.",
    whisper: "the quietest, tensest room",
  },
  {
    name: "Cricket",
    short: "CR",
    color: "#CBD8BD",
    format: "8-a-side · tennis ball",
    squad: "Squad of 10",
    ground: "Box cage, floodlit",
    time: "Friday night lights",
    type: "team",
    note: "Fast 5-over smash. Bat, box booking + scorer's notebook on us.",
    whisper: "tape-ball swing after dew",
  },
  {
    name: "Basketball",
    short: "BB",
    color: "#F3D2B8",
    format: "5v5 · 4×8 min",
    squad: "Squad of 8–10",
    ground: "Outdoor asphalt",
    time: "Sunset runs",
    type: "team",
    note: "Full-court runs. Reversible jerseys, pine-scented bench spray.",
    whisper: "squeak of shoes at dusk",
  },
  {
    name: "Kho Kho",
    short: "KK",
    color: "#D9CFC0",
    format: "9 on mat + 3 subs",
    squad: "Squad of 12",
    ground: "Clay + mat",
    time: "Heritage Sundays",
    type: "team",
    note: "Desi classic, proper mat, whistle + a dhol for finals.",
    whisper: "fastest feet on campus",
  },
];

const FAQS = [
  {
    q: "Is Yuvora really 100% student-led?",
    a: "Yes — like a kitchen garden. Seniors plant (book grounds, set brackets, handle cash), juniors water (volunteer, ref, clean up after raves) and eventually take over the whole plot. No faculty committee, no adult manager.",
  },
  {
    q: "How much is the entry fee for sports?",
    a: "Chai-money only — roughly ₹50–₹100 per player depending on ground cost. Every season we pin a handwritten split on the board: ground + gear + ref + leftover seed for the next event.",
  },
  {
    q: "How does the Hack Club + merch funding work?",
    a: "Our tech wing grows inside Hack Club's global greenhouse. Ship a real project → Hack Club sends you swag / hardware grants and that stays 100% yours. Separately, Yuvora event tees sold at matches and summits go into one shared soil fund for grounds, speakers and sound.",
  },
  {
    q: "I'm not sporty or techy. Can I still join?",
    a: "That's why the Gather grove exists — entrepreneur summits, tech fairs, open-mics, terrace music and slow socials. Pick Raver / Founder / Volunteer on your pass. Plenty of members never touch a ball or a keyboard.",
  },
  {
    q: "Are the music nights / raves safe?",
    a: "Student-only, ID-checked, no-alcohol student policy, a volunteer safety + chill-out crew, lit paths, water station and a 10pm campus wrap. Loud and glowy, never sketchy.",
  },
];

function useReveal(dep) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [dep]);
}

function Ticker() {
  const items = [
    "100% student-grown",
    "6 sports · 1 doubles-only",
    "coding + etch workshops",
    "hack club greenhouse inside",
    "entrepreneur summit",
    "tech fair",
    "hackathons — <b>funded</b>",
    "terrace music",
    "slow socials & glowy raves",
  ];
  const row = [...items, ...items];
  return (
    <div className="ticker" aria-hidden>
      <div className="ticker-track">
        {[0, 1].map((half) => (
          <div key={half} style={{ display: "inline-flex" }}>
            {row.map((t, i) => (
              <span key={i} dangerouslySetInnerHTML={{ __html: `✿ ${t}` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  useReveal(route);
  const [vibe, setVibe] = useState("Builder");
  const [name, setName] = useState("");
  const [wing, setWing] = useState("Build grove");
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const sync = () => setRoute(getRoute());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  useEffect(() => {
    document.title =
      route === "members"
        ? MEMBERS_TITLE
        : route === "join"
          ? JOIN_TITLE
          : route === "login"
            ? LOGIN_TITLE
            : route === "register"
              ? REGISTER_TITLE
              : route === "terms"
                ? TERMS_TITLE
                : route === "privacy"
                  ? PRIVACY_TITLE
                  : route === "notfound"
                    ? NOTFOUND_TITLE
                    : HOME_TITLE;
    if (route === "members" || route === "join" || route === "login" || route === "register" || route === "terms" || route === "privacy" || route === "notfound") {
      window.scrollTo(0, 0);
    } else {
      const h = window.location.hash;
      if (h && h !== "#/members") {
        const el = document.querySelector(h);
        if (el) {
          requestAnimationFrame(() => el.scrollIntoView());
          return;
        }
      }
      if (!h || h === "#top") window.scrollTo(0, 0);
    }
  }, [route]);

  // Minimal SPA navigation without adding a router dependency. Only the
  // club's own links are intercepted — external links (mailto, instagram,
  // hackclub) keep their default behavior.
  useEffect(() => {
    const goHome = (hash) => {
      window.history.pushState({}, "", hash && hash !== "#top" ? `/${hash}` : "/");
      setRoute("home");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!hash || hash === "#top") window.scrollTo(0, 0);
          else document.querySelector(hash)?.scrollIntoView();
        })
      );
    };
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      const href = a.getAttribute("href");
      const current = getRoute();
      const offHome = current !== "home";
      const pathOnly = href ? href.split("?")[0].replace(/\/+$/, "") || "/" : "";
      if (pathOnly === "/members" || pathOnly === "/join" || pathOnly === "/login" || pathOnly === "/register" || pathOnly === "/terms" || pathOnly === "/privacy") {
        e.preventDefault();
        const target = pathOnly === "/members" ? "members" : pathOnly === "/join" ? "join" : pathOnly === "/login" ? "login" : pathOnly === "/register" ? "register" : pathOnly === "/terms" ? "terms" : "privacy";
        if (current !== target) {
          window.history.pushState({}, "", href);
          setRoute(target);
        } else {
          window.scrollTo(0, 0);
        }
        return;
      }
      if (href === "/") {
        if (offHome) {
          e.preventDefault();
          goHome("#top");
        }
        return;
      }
      if ((href && href.startsWith("/#")) && offHome) {
        e.preventDefault();
        goHome(href === "/" ? "#top" : href.slice(1));
        return;
      }
      if (href && href.startsWith("#") && offHome) {
        e.preventDefault();
        goHome(href);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const memberId = useMemo(() => {
    const base = (name || "yuvora").toLowerCase().replace(/[^a-z]/g, "") || "yuvora";
    const n = base.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return `YV-${String((n * 7919) % 9000 + 1000)}`;
  }, [name]);

  const displayName = name.trim() || "Your Name";

  return (
    <>
      <div className="aura aura-1" aria-hidden />
      <div className="aura aura-2" aria-hidden />
      <div className="aura aura-3" aria-hidden />
      <Ticker />

      <nav className="nav">
        <div className="nav-inner">
          <a className="logo" href="#top">
            <span className="logo-mark">❧</span>
            <span>
              YUVORA
              <small>student-run club</small>
              <em>grown on campus soil</em>
            </span>
          </a>
          <div className="nav-links">
            <a className="plain" href="#play">Play</a>
            <a className="plain" href="#build">Build</a>
            <a className="plain" href="#summits">Summits</a>
            <a className="plain" href="#afterdark">After Dark</a>
            <a className={route === "members" ? "plain members-link active" : "plain members-link"} href="/members" aria-current={route === "members" ? "page" : undefined}>Members</a>
            <a className="btn btn-ink btn-tilt" href="/join" aria-current={route === "join" ? "page" : undefined}>Join Us →</a>
          </div>
        </div>
      </nav>

      {route === "members" ? (
        <MembersPage />
      ) : route === "join" ? (
        <JoinPage />
      ) : route === "login" ? (
        <LoginPage next={getNext()} />
      ) : route === "register" ? (
        <RegisterPage next={getNext()} />
      ) : route === "terms" ? (
        <TermsPage />
      ) : route === "privacy" ? (
        <PrivacyPage />
      ) : route === "notfound" ? (
        <NotFoundPage path={typeof window !== "undefined" ? window.location.pathname : "/"} />
      ) : (
      <>
      {/* HERO */}
      <header className="hero" id="top">
        <div>
          <span className="eyebrow"><span className="dot">✿</span> sowing season · new crew sprouting now</span>
          <h1>
            Run by<br />
            <span className="italic-hand">students,</span><br />
            <span className="soft">not by</span><br />
            commit<span className="clay">tees.</span>
          </h1>
          <p className="hero-sub">
            <strong>Yuvora</strong> is one all-student club with three groves —{" "}
            <strong>sunlit sport leagues</strong>, a <strong>Hack Club tech greenhouse</strong> with
            coding + etch workshops, and <strong>summits, fairs, hackathons &amp; moonlit music</strong>.
            Small entry fees. Honest merch funding. Zero stiff adult energy.
          </p>
          <div className="hero-cta">
            <a href="#join" className="btn btn-clay">Claim your seed pass ✿</a>
            <a href="#play" className="btn btn-paper">Walk the 6 fields ↓</a>
          </div>
          <div className="hero-meta">
            <span className="chip">✿ 6 sports · badminton = singles + doubles</span>
            <span className="chip">☘ hack club inside</span>
            <span className="chip">☾ summits by day, music by night</span>
          </div>
          <div className="field-note">
            <b>Field note 001 —</b> everything except badminton is a full <b>team sport</b>.
            Badminton stays tender: <b>singles + doubles only</b>. Entry is chai-money, split
            written by hand every season. <span className="scribble">come dewy-eyed, leave dusty-shoed.</span>
          </div>
        </div>

        <div className="collage" aria-hidden>
          <div className="packet p1">
            <div className="packet-top"><span>field pass · play</span><span>No. 042</span></div>
            <h3>Box Cricket Under Lights</h3>
            <p>8-a-side · tennis ball · floodlit cage, Friday 7pm.</p>
            <div className="detail">soil: turf dust · water: one orange sharbat break · bring: studs</div>
            <span className="price">entry ≈ ₹79 / player</span>
          </div>
          <div className="packet p2">
            <div className="packet-top"><span>greenhouse · build</span><span>ship it</span></div>
            <h3>Hack Club Night</h3>
            <p>Build a tiny site, ship it, press a leaf in the logbook. Keep the swag.</p>
            <div className="detail">tonight: personal sites · mentors: 2 seniors + chai · first-timers potted gently</div>
            <span className="price">free for members</span>
          </div>
          <div className="packet p3">
            <div className="packet-top"><span>moon pass · gather</span><span>18:00 → 22:00</span></div>
            <h3 style={{ color: "#f4efe0" }}>Terrace Social + Glow Rave</h3>
            <p>Open mic first, student DJs after. Fairy lights, floor cushions, fries stall.</p>
            <div className="detail">moon: waxing · safety fireflies on patrol · +1 allowed with pass</div>
            <span className="price" style={{ background: "#f6e3b4", color: "#4a3a22" }}>members +1 · ID checked</span>
          </div>
          <div className="sun-seal"><div className="disc">✿<br />YV<br />SOWN<br />2026</div></div>
        </div>
      </header>

      <div className="strip sun" aria-hidden>
        <div className="strip-track">
          {[0, 1].map((h) => (
            <div key={h} style={{ display: "inline-flex" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <i key={i}>play <span className="leaf">❧</span> build <span className="leaf">❧</span> gather <span className="leaf">❧</span> rest <span className="leaf">❧</span>&nbsp;</i>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* WINGS */}
      <section className="wrap" id="wings">
        <div className="sec-head reveal">
          <span className="sec-no">❧ 01 — groves</span>
          <h2>One club,<br /><em>three living groves</em></h2>
          <p>Pick a patch or wander all three. Every grove is captained by students — soil reports, watering rota and all. <b>You can captain one next season.</b></p>
        </div>
        <div className="wings">
          <article className="wing reveal">
            <span className="wing-stamp">entry · chai-money</span>
            <div className="wing-kicker">grove one — sweat + soil</div>
            <div className="wing-big">Play</div>
            <small className="latin">campus athletica — sown at golden hour</small>
            <ul>
              <li><span className="ic">☀</span><span><b>Volleyball · Football · Cricket</b><br />dust, turf, floodlights + lime lines</span></li>
              <li><span className="ic">☘</span><span><b>Basketball · Kho Kho</b> <small>(full teams, loud sidelines)</small></span></li>
              <li><span className="ic">✿</span><span><b>Badminton</b> <small>(singles + doubles only — the quiet room)</small></span></li>
            </ul>
            <div className="soil">soil: worn grass · water: 2 chai breaks · light: flood + fireflies</div>
            <a className="mini" href="#play">Walk the fields →</a>
          </article>
          <article className="wing reveal">
            <span className="wing-stamp">hack club inside</span>
            <div className="wing-kicker" style={{ color: "#c8d6a8" }}>grove two — bark + solder</div>
            <div className="wing-big" style={{ color: "#f4efe0" }}>Build</div>
            <small className="latin">hackus clubus — ship & keep your petals</small>
            <ul>
              <li><span className="ic">⌨</span><span><b>Coding workshops</b><br /><span style={{ color: "#b9c2a8" }}>sites, bots, mini-games · zero to demo</span></span></li>
              <li><span className="ic">◍</span><span><b>Etch / electronics</b><br /><span style={{ color: "#b9c2a8" }}>PCBs, sensors, blink-everything boards</span></span></li>
              <li><span className="ic">✿</span><span>Ship → <b>keep your merch</b>. Club merch → <b>waters Yuvora</b>.</span></li>
            </ul>
            <div className="soil">humidity: solder + rain · mentors: seniors with burnt fingers</div>
            <a className="mini" href="#build" style={{ color: "#f6e3b4" }}>Enter the greenhouse →</a>
          </article>
          <article className="wing reveal">
            <span className="wing-stamp">day → moon</span>
            <div className="wing-kicker">grove three — stage + sky</div>
            <div className="wing-big">Gather</div>
            <small className="latin">convivia nocturna — talk, taste, dance</small>
            <ul>
              <li><span className="ic">◈</span><span><b>Entrepreneur Summit</b><br />stalls, 5-min pitches, worst-idea comedy</span></li>
              <li><span className="ic">◎</span><span><b>Tech Summit / Fair</b><br />touch-everything tables + teardown corner</span></li>
              <li><span className="ic">☾</span><span><b>Music, socials &amp; glowy raves</b><br />open mic → DJ, fairy lights always</span></li>
            </ul>
            <div className="soil">light: sun → moon · sound: dhol → decks · wrap: 10pm, softly</div>
            <a className="mini" href="#summits">See gatherings →</a>
          </article>
        </div>
      </section>

      {/* PLAY */}
      <section className="wrap" id="play" style={{ paddingTop: 8 }}>
        <div className="sec-head reveal">
          <span className="sec-no">❧ 02 — play</span>
          <h2>The Play grove<br /><em>six little fields</em></h2>
          <p>Everything except badminton is a <b>team sport</b>. Badminton blooms as <b>singles + doubles</b>. Each card lists its ground, its hour and its smell — because details are the aura.</p>
        </div>
        <div className="sports">
          {SPORTS.map((s) => (
            <article className="sport reveal" key={s.name}>
              <div className="sport-banner">
                <span className="ball" style={{ background: s.color }}>{s.short}</span>
                <span>{s.name}<br /><span className="micro">{s.ground} · {s.time}</span></span>
              </div>
              <div className="sport-body">
                <span className={`tag ${s.type}`}>{s.type === "team" ? "● team sport" : "● singles + doubles"}</span>
                <dl>
                  <div><dt>Format</dt><dd>{s.format}</dd></div>
                  <div><dt>Squad</dt><dd>{s.squad}</dd></div>
                </dl>
                <p className="sport-note">{s.note}<br /><em>↳ {s.whisper}</em></p>
                <div className="fee-row">
                  <span>entry ≈ ₹50–100 / head</span>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="note-bar reveal">
          <b>HOW LEAGUES GROW →</b>
          <span>Student captains draft under the neem tree · round-robin → semis → finals under lights · live bracket in chalk on the board · best chant wins nothing but a pressed leaf in the logbook.</span>
        </div>
      </section>

      <div className="strip sage" aria-hidden>
        <div className="strip-track">
          {[0, 1].map((h) => (
            <div key={h} style={{ display: "inline-flex" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <i key={i}>volleyball ❧ football ❧ badminton ❧ cricket ❧ basketball ❧ kho kho ❧&nbsp;</i>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* BUILD */}
      <section className="dark" id="build">
        <span className="firefly" style={{ top: "12%", left: "8%" }} />
        <span className="firefly" style={{ top: "30%", right: "12%", animationDelay: "-2s" }} />
        <span className="firefly" style={{ bottom: "18%", left: "46%", animationDelay: "-4s" }} />
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="sec-no">❧ 03 — build</span>
            <h2>Build grove ×<br />Hack Club</h2>
            <p style={{ color: "#b9c2a8" }}>Our tech grove grows inside <b style={{ color: "#f6e3b4" }}>Hack Club</b> — the global greenhouse of student hackers. Weekend workshops in code + etch, then ship real things into the rain and earn real petals.</p>
          </div>
          <div className="hack-grid">
            <div className="journal reveal">
              <div className="term-bar">
                <i style={{ background: "#e8a87c" }} /><i style={{ background: "#e8cf8a" }} /><i style={{ background: "#9dbf8a" }} />
                <span style={{ marginLeft: 8, fontFamily: "var(--mono)", fontSize: 11.5, color: "#8d967f", letterSpacing: "0.08em" }}>yuvora — monsoon ship-log ❧</span>
              </div>
              <div className="term-body">
                <div><span className="g">$</span> yuvora workshops --list</div>
                <div className="dim">→ coding: personal sites, discord bots, tiny games (sat, 4pm, with pakoras)</div>
                <div className="dim">→ etch: sensors, PCBs, blink-everything boards (sun, 11am, burnt fingers club)</div>
                <div><span className="g">$</span> yuvora ship ./my-project --with-rain</div>
                <div>✓ shipped! hack club sent <span className="o">stickers + tee + hardware grant</span> → <span className="paper-note">yours to keep, forever</span></div>
                <div>✓ club merch counter <span className="g">+₹2,400</span> → waters next summit + new footballs</div>
                <div className="dim"># law of the grove: personal ship petals = yours. club-event harvest = everyone's water.</div>
              </div>
            </div>
            <div>
              <div className="merch-card reveal">
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#6f8f5e" }}>THE SEED LOOP ↻ — READ SLOWLY</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 29, fontWeight: 800, lineHeight: 1.05, marginTop: 6 }}>You ship. You keep.<br />The grove still drinks.</div>
                <p style={{ fontWeight: 500, color: "#5c6758", lineHeight: 1.65, fontSize: 14.5 }}>Personal Hack Club rewards stay with the shipper — tees, stickers, grants, glory. Separately, Yuvora event merch (sold at matches + summits) flows into one shared watering can for grounds, speakers and sound.</p>
                <div className="pill-row">
                  {["soil: shared fund", "petals: personal", "water: transparent"].map((p) => (
                    <span className="pill light" key={p}>{p}</span>
                  ))}
                </div>
              </div>
              <div className="steps reveal">
                <div className="step"><b>1</b><p><strong>Sow.</strong> Weekend coding + etch workshops. Zero experience needed — seniors pot beside you, debug beside you.</p></div>
                <div className="step"><b>2</b><p><strong>Sprout.</strong> Finish a site / bot / board, demo it on the little stage. Hack Club counts it as shipped.</p></div>
                <div className="step"><b>3</b><p><strong>Shade others.</strong> Wear the club tee at summits; harvest profits keep every entry fee tiny.</p></div>
              </div>
              <div className="pill-row">
                {["web jams", "hardware sundays", "demo nights", "open source", "figma + film"].map((p) => (
                  <span className="pill" key={p}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUMMITS */}
      <section className="wrap" id="summits">
        <div className="sec-head reveal">
          <span className="sec-no">❧ 04 — gather</span>
          <h2>Summits, fairs<br /><em>&amp; midnight ships</em></h2>
          <p>Founders on stage in the morning, robots on jute cloth by noon, shipping till the moon is high. Hackathons are watered by <b>Hack Club</b>.</p>
        </div>
        <div className="posters">
          <article className="poster reveal">
            <div className="poster-top" style={{ background: "#f6e8c8" }}>
              <div className="when">Entrepreneur Summit · day fest · stall no. 1–24</div>
              <h3>Founder<br />Mela</h3>
              <span className="latin" style={{ color: "#96522f" }}>pitch, haggle, sip chai →</span>
              <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 11, color: "#6b5f45" }}>❧ 5-min lightning pitches · worst-idea comedy round · mock-deal bell</div>
            </div>
            <div className="poster-body">
              Student startups on jute-covered tables, local founders as gentle judges, a <strong>flea-market demo lane</strong> and handshake deals counted in applause, not rupees.
            </div>
          </article>
          <article className="poster reveal">
            <div className="poster-top" style={{ background: "#dfe7d2" }}>
              <div className="when">Tech Summit / Fair · show + tell · touch allowed</div>
              <h3>Build<br />Bazaar</h3>
              <span className="latin" style={{ color: "#42563a" }}>unscrew everything, ask anything</span>
              <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 11, color: "#42563a" }}>❧ try-it zones · sticker passports · teardown corner (guilt-free)</div>
            </div>
            <div className="poster-body">
              Robots, etched boards, games and glowing sites. <strong>Sticker passports</strong> for wanderers, a teardown table of dead remotes, and seniors who explain without sighing.
            </div>
          </article>
          <article className="poster reveal">
            <div className="poster-top" style={{ background: "#2e332c", color: "#f4efe0" }}>
              <div className="when" style={{ color: "#e8a87c" }}>Hackathon · overnight · funded · maggi at 2am</div>
              <h3>Ship Till<br />Sunrise</h3>
              <span className="latin" style={{ color: "#f6e3b4" }}>form fri, demo sun, sleep later</span>
              <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 11, color: "#b9d39a" }}>☾ mentor fireflies · hello-world track for first-timers</div>
            </div>
            <div className="poster-body">
              Teams form Friday, demo Sunday noon. Food, judging + prizes flow through <strong>Hack Club</strong>. Blankets, extension boards and quiet corners provided.
              <br /><span className="funded">✿ funded by Hack Club</span>
            </div>
          </article>
        </div>
      </section>

      {/* AFTER DARK */}
      <section className="afterdark" id="afterdark">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="sec-no">☾ 05 — after dark</span>
            <h2>After dark:<br />music + moon socials</h2>
            <p style={{ color: "#b9bfae" }}>Terrace frequencies, open mics that melt into dancefloors, themed slow socials and one glowy student rave per season. Loud, lit, and tucked in by 10.</p>
          </div>
          <div className="gig-list">
            <article className="gig reveal">
              <div className="when">♪ OPEN MIC → HEADLINER · fairy lights: 214 bulbs</div>
              <h3>Terrace Frequency</h3>
              <p style={{ fontWeight: 500, color: "#5c6758", lineHeight: 1.65 }}>Guitars → beatbox → a student DJ closes. Anyone gets 7 minutes. Floor cushions, jute rugs, <b>canteen fries stall</b> and a notebook for song requests.</p>
              <div className="fee-row"><span>members free · +1 ₹49</span><a href="#join">RSVP →</a></div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#9aa392", marginTop: 8 }}>setlist pressed in logbook · rain plan: indoor hall, same glow</div>
            </article>
            <article className="gig reveal">
              <div className="when">☾ STUDENT GLOW RAVE · ID CHECKED · WATER STATION</div>
              <h3>Neon Kho-Kho Afterparty</h3>
              <p style={{ fontWeight: 500, color: "#5c6758", lineHeight: 1.65 }}>Finals-night special. Glow paint by volunteers, two DJ crews, a 10-min kho-kho exhibition as the “opening act”. <b>Chill corner + safety fireflies</b> all night.</p>
              <div className="fee-row"><span>seed-pass holders only</span><a href="#join">Get pass →</a></div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#9aa392", marginTop: 8 }}>wrap 10pm · lit paths · parent/campus contact on every poster</div>
            </article>
          </div>
          <p className="reveal" style={{ fontFamily: "var(--mono)", fontSize: 12, marginTop: 16, color: "#9aa78f" }}>
            house rules, handwritten: student-only · no-alcohol student policy · consent + chill-out crew · wrap by 10pm — glow, not sketch.
          </p>
        </div>
      </section>

      {/* FUNDING */}
      <section className="wrap" id="money">
        <div className="sec-head reveal">
          <span className="sec-no">❧ 06 — soil & water</span>
          <h2>How the grove<br /><em>stays watered</em></h2>
          <p>No giant sponsor with a loud banner. Three small streams — <b>fees, merch, shipped love</b> — keep Yuvora soft, honest and independent.</p>
        </div>
        <div className="ledger">
          <div className="reveal"><h4>① tiny entry fees — the rain</h4><p>Sports leagues charge <b>chai-money per head</b>. Every rupee pinned on the board: ground + gear + ref + a seed left for next time.</p></div>
          <div className="reveal"><h4>② club merch — the compost</h4><p>Yuvora tees + stickers at summits and matches melt into <b>one shared watering can</b>. Pays for sound, speakers, shuttles and balls.</p></div>
          <div className="reveal"><h4>③ ship rewards — your petals</h4><p>Hack Club swag you earn by shipping is <b>100% yours</b>. We garland you on stage — we never tax a petal.</p></div>
        </div>
      </section>

      {/* JOIN */}
      <section className="wrap" id="join" style={{ paddingTop: 8 }}>
        <div className="sec-head reveal">
          <span className="sec-no">✿ 07 — seed pass</span>
          <h2>Get your<br /><em>seed pass</em></h2>
          <p>Static site, so this pass presses in your browser — screenshot it, flash it at the gate. When we go dynamic, this becomes your real root system. Pick a vibe:</p>
        </div>
        <div className="pass-sec">
          <div className="reveal">
            <div className="vibe-pick">
              {["Athlete", "Builder", "Founder", "Raver", "Volunteer"].map((v) => (
                <button key={v} className={vibe === v ? "active" : ""} onClick={() => setVibe(v)}>
                  {v === "Athlete" ? "☀ " : v === "Builder" ? "⌨ " : v === "Founder" ? "◈ " : v === "Raver" ? "☾ " : "✿ "}{v}
                </button>
              ))}
            </div>
            <label className="field">
              Your name, handwritten
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarav Sharma" maxLength={30} />
            </label>
            <label className="field">
              Home grove
              <input value={wing} onChange={(e) => setWing(e.target.value)} placeholder="Play / Build / Gather" maxLength={24} />
            </label>
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <a className="btn btn-clay" href={`mailto:yuvoraclub.official@gmail.com?subject=Yuvora%20seed%20pass%20—%20${encodeURIComponent(displayName)}%20(${vibe})&body=Hi%20Yuvora!%20I%20want%20to%20grow%20in.%20Vibe:%20${vibe}%20Grove:%20${encodeURIComponent(wing)}%20ID:%20${memberId}`}>Send join note →</a>
              <a className="btn btn-paper" href="#faq">Doubts? Read soil FAQ</a>
            </div>
            <p style={{ fontFamily: "var(--hand)", fontSize: 22, marginTop: 12, color: "var(--clay)" }}>no long forms — just a name, a vibe, and showing up with dusty shoes ↑</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 12.5, marginTop: 10, color: "var(--muted)", lineHeight: 1.7 }}>
              write to us → <a href="mailto:yuvoraclub.official@gmail.com" style={{ fontWeight: 700, color: "var(--ink)" }}>yuvoraclub.official@gmail.com</a>
              <br />dm us → <a href="https://instagram.com/the_yuvora_club" target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: "var(--ink)" }}>@the_yuvora_club</a>
            </p>
          </div>
          <div className="id-card reveal">
            <div className="id-top"><span>✿ Yuvora seed pass</span><span>{memberId}</span></div>
            <div className="id-name">{displayName}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "#6b5a35", letterSpacing: "0.06em" }}>{vibe.toUpperCase()} · {(wing || "Yuvora").toUpperCase()}</div>
            <div style={{ fontFamily: "var(--hand)", fontSize: 19, color: "#8a6f3c", marginTop: 4 }}>pressed on campus, watered weekly</div>
            <div className="id-meta">
              <span>play ✓</span><span>build ✓</span><span>gather ✓</span><span>moon ✓</span>
            </div>
            <div className="barcode" />
            <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, marginTop: 8, color: "#8a7a52" }}>screenshot this · flash at gate · v1 pressed pass · dynamic roots soon</div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="wrap" id="faq" style={{ paddingTop: 8 }}>
        <div className="sec-head reveal">
          <span className="sec-no">❧ 08 — soil faq</span>
          <h2>Doubts?<br /><em>composted.</em></h2>
        </div>
        <div className="faq">
          {FAQS.map((f, i) => (
            <div className="faq-item reveal" key={i}>
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                {f.q}<span>{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && <div className="ans">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>
      </>
      )}

      <footer>
        <div className="foot-inner">
          <div className="foot-grid">
            <div style={{ maxWidth: 330 }}>
              <div className="logo" style={{ color: "#f4efe0" }}><span className="logo-mark">❧</span><span>YUVORA<small style={{ color: "#8d967f" }}>student-run club</small></span></div>
              <p style={{ color: "#a8b09a", fontWeight: 500, lineHeight: 1.65, fontSize: 14.5 }}>One student grove for sport, tech and gathering. Leagues at golden hour, shipping with Hack Club, summits by sun and music by moon.</p>
              <div className="pill-row">
                <span className="pill">sown by students</span><span className="pill">watered by students</span>
              </div>
            </div>
            <div>
              <h5>Groves</h5>
              <a href="#play">Play — 6 fields</a>
              <a href="#build">Build — Hack Club</a>
              <a href="#summits">Summits + ships</a>
              <a href="#afterdark">After dark</a>
            </div>
            <div>
              <h5>Crew</h5>
              <a href="/join">Join Us</a>
              <a href="#join">Get seed pass</a>
              <a href="#money">Soil & water</a>
              <a href="#faq">FAQ</a>
              <a href="mailto:yuvoraclub.official@gmail.com">yuvoraclub.official@gmail.com</a>
              <a href="https://instagram.com/the_yuvora_club" target="_blank" rel="noreferrer">@the_yuvora_club ↗</a>
            </div>
            <div>
              <h5>Friends</h5>
              <a href="https://instagram.com/the_yuvora_club" target="_blank" rel="noreferrer">Instagram ↗</a>
              <a href="https://hackclub.com" target="_blank" rel="noreferrer">Hack Club ↗</a>
              <a href="#top">Back to sunlight ↑</a>
            </div>
          </div>
          <div className="giant" aria-hidden>YUVORA</div>
          <div className="foot-base">
            <span>© 2026 Yuvora · student-grown · v1 static (roots deepen soon)</span>
            <span>made with chai, floodlights, solder & moonlight</span>
          </div>
        </div>
      </footer>
    </>
  );
}
