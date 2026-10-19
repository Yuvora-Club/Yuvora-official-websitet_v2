import { useEffect, useMemo, useState } from "react";
import MembersPage from "./pages/MembersPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import JoinPage from "./pages/JoinPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import PayAdminPage from "./pages/PayAdminPage.jsx";
import { LoginPage, RegisterPage } from "./pages/AuthPages.jsx";
import { TermsPage, PrivacyPage } from "./pages/LegalPages.jsx";
import { useAuth } from "./state/useAuth.js";
import { isAdminUser } from "./services/authService.js";

const HOME_TITLE = "Yuvora — Student-Led Club | Play. Build. Gather.";
const MEMBERS_TITLE = "Members — Yuvora | Meet the crew";
const JOIN_TITLE = "Join Us — Yuvora | Grow with Yuvora";
const DASHBOARD_TITLE = "Dashboard — Yuvora | Your space";
const ADMIN_TITLE = "Admin — Yuvora | Crew clipboard";
const PAYADMIN_TITLE = "Payments — Yuvora | Entry-fee dashboard";
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
  if (path === "/dashboard") return "dashboard";
  if (path === "/admin") return "admin";
  if (path === "/pay-admin") return "payadmin";
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
    whisper: "Every ball is a new opportunity. Every innings is a new story",
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
];

const FAQS = [
  {
    q: "What is Yuvora?",
    a: "Yuvora is a student-led club that brings people together to explore ideas, develop skills, join activities, and build real connections.",
  },
  {
    q: "What does “Play. Build. Gather.” mean?",
    a: "Our three sections: Play is sports leagues, Build is coding + electronics workshops with Hack Club, and Gather is summits, fairs, hackathons and music nights.",
  },
  {
    q: "Who can join Yuvora?",
    a: "Any student who wants to explore interests, learn new things, collaborate with others, and be part of a community.",
  },
  {
    q: "Is Yuvora only for students with experience?",
    a: "Not at all. Beginners and experienced students are both welcome — curiosity, creativity, and a willingness to learn are what matter.",
  },
  {
    q: "What activities does Yuvora organize?",
    a: "Sports leagues, coding + electronics workshops, summits, tech fairs, hackathons, open-mics and music nights. The exact schedule is announced on this site and on Instagram.",
  },
  {
    q: "Does Yuvora organize events and meetups?",
    a: "Yes. Check Yuvora.org and our official Instagram (@the_yuvora_club) for announcements.",
  },
  {
    q: "How can I become a member of Yuvora?",
    a: "Hit Join Us on this site, verify your email with the OTP code, and you're on the roster. A senior will reach out next.",
  },
  {
    q: "Do I need special skills to participate?",
    a: "No. Start with whatever interests you have, and build new skills by learning, experimenting, and collaborating with other students.",
  },
  {
    q: "Can I work on projects with other students?",
    a: "Yes — collaboration is the point. Watch the Build section and the dashboard announcements for current projects.",
  },
  {
    q: "How can I stay updated about upcoming events?",
    a: "Visit Yuvora.org regularly and follow @the_yuvora_club on Instagram for the latest announcements and updates.",
  },
  {
    q: "Can I suggest an idea or propose an event?",
    a: "Yes — email the team with your idea and we'll review it for a future activity.",
  },
  {
    q: "How can I contact the Yuvora team?",
    a: (
      <span>
        Tap a line to reach a human —{" "}
        <a href="mailto:yuvoraclub.official@gmail.com" style={{ fontWeight: 700, color: "var(--ink)" }}>yuvoraclub.official@gmail.com</a>
        {" · "}
        <a href="https://instagram.com/the_yuvora_club" target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: "var(--ink)" }}>@the_yuvora_club</a>
      </span>
    ),
  },
  {
    q: "Is Yuvora really 100% student-led?",
    a: "Yes. Seniors handle the work (booking grounds, setting brackets, managing cash), juniors help out (volunteering, refereeing, clean-up) and take over with time. No faculty committee, no adult manager.",
  },
  {
    q: "How much is the entry fee for sports?",
    a: "Fair fees — roughly ₹100–₹200 per player depending on ground cost. Every season we pin a handwritten split on the board: ground + gear + ref.",
  },
  {
    q: "Do Hack Club grants run the club?",
    a: "No — Yuvora runs on its own sports entry fees and is never dependent on grants or rewards. Hack Club funding only covers specific STEM events (tech fairs, hackathons, hardware). And anything you earn by shipping — swag, grants, glory — stays 100% yours.",
  },
  {
    q: "Are the music nights / raves safe?",
    a: "Yes. Entry is student-only with ID check, no alcohol, a volunteer safety team on duty all night, lit paths, free water, and everything wraps up by 10pm.",
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
    "100% student-run",
    "5 sports · 1 doubles-only",
    "coding + tech workshops",
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
  // Live session (localStorage-backed). Nav shows Dashboard when signed
  // in, Log in when signed out — so the dashboard is never "lost".
  const { user } = useAuth();
  useReveal(route);
  const [vibe, setVibe] = useState("Builder");
  const [name, setName] = useState("");
  const [wing, setWing] = useState("Build");
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
          : route === "dashboard"
            ? DASHBOARD_TITLE
            : route === "admin"
              ? ADMIN_TITLE
              : route === "payadmin"
                ? PAYADMIN_TITLE
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
    if (route === "members" || route === "join" || route === "dashboard" || route === "admin" || route === "payadmin" || route === "login" || route === "register" || route === "terms" || route === "privacy" || route === "notfound") {
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
      if (pathOnly === "/members" || pathOnly === "/join" || pathOnly === "/dashboard" || pathOnly === "/admin" || pathOnly === "/pay-admin" || pathOnly === "/login" || pathOnly === "/register" || pathOnly === "/terms" || pathOnly === "/privacy") {
        e.preventDefault();
        const target = pathOnly === "/members" ? "members" : pathOnly === "/join" ? "join" : pathOnly === "/dashboard" ? "dashboard" : pathOnly === "/admin" ? "admin" : pathOnly === "/pay-admin" ? "payadmin" : pathOnly === "/login" ? "login" : pathOnly === "/register" ? "register" : pathOnly === "/terms" ? "terms" : "privacy";
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
                <em>made on campus</em>
            </span>
          </a>
          <div className="nav-links">
            <a className="plain" href="#play">Play</a>
            <a className="plain" href="#build">Build</a>
            <a className="plain" href="#summits">Summits</a>
            <a className="plain" href="#afterdark">After Dark</a>
            <a className={route === "members" ? "plain members-link active" : "plain members-link"} href="/members" aria-current={route === "members" ? "page" : undefined}>Members</a>
            {user ? (
              <a className={route === "dashboard" ? "plain members-link active" : "plain members-link"} href="/dashboard" aria-current={route === "dashboard" ? "page" : undefined}>Dashboard</a>
            ) : (
              <a className={route === "login" ? "plain members-link active" : "plain members-link"} href="/login" aria-current={route === "login" ? "page" : undefined}>Log in</a>
            )}
            {isAdminUser(user) && (
              <a className={route === "admin" ? "plain members-link active" : "plain members-link"} href="/admin" aria-current={route === "admin" ? "page" : undefined}>Admin</a>
            )}
            <a className="btn btn-ink btn-tilt" href="/join" aria-current={route === "join" ? "page" : undefined}>Join Us →</a>
          </div>
        </div>
      </nav>

      {route === "members" ? (
        <MembersPage />
      ) : route === "join" ? (
        <JoinPage />
      ) : route === "dashboard" ? (
        <DashboardPage />
      ) : route === "admin" ? (
        <AdminPage user={user} />
      ) : route === "payadmin" ? (
        <PayAdminPage />
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
          <span className="eyebrow"><span className="dot">✿</span> admissions open · new members joining now</span>
          <p style={{ marginTop: 12, display: "inline-block", fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.6, color: "#7a4a1f", background: "#fdf3d8", border: "1.5px dashed #d9a441", borderRadius: 10, padding: "8px 12px", maxWidth: "52ch" }}>
            ⚠ Please do not create an account yet — accounts created now may be lost, as the database will be refreshed on completion of the website.
          </p>
          <h1>
            Run by<br />
            <span className="italic-hand">students,</span><br />
            <span className="soft">not by</span><br />
            commit<span className="clay">tees.</span>
          </h1>
          <p className="hero-sub">
            <strong>Yuvora</strong> is one all-student club with three sections —{" "}
            <strong>sports leagues</strong>, <strong>coding + electronics workshops</strong> with
            Hack Club, and <strong>summits, fairs, hackathons &amp; music nights</strong>.
            Small entry fees. STEM nights funded by Hack Club. Zero stiff adult energy.
          </p>
          <div className="hero-cta">
            <a href="#join" className="btn btn-clay">Claim your seed pass ✿</a>
            <a href="#play" className="btn btn-paper">See the 5 sports ↓</a>
          </div>
          <div className="hero-meta">
            <span className="chip">✿ volleyball · football · badminton · cricket · basketball</span>
            <span className="chip">☘ hack club inside</span>
            <span className="chip">☾ summits by day, music by night</span>
          </div>
          <div className="field-note">
            <b>Good to know —</b> everything except badminton is a full <b>team sport</b>.
            Badminton is <b>singles + doubles only</b>. Entry is ₹100–200 per head, and we put up a
            handwritten cost split every season. <span className="scribble">just show up ready to play.</span>
          </div>
        </div>

        <div className="collage" aria-hidden>
          <div className="packet p1">
            <div className="packet-top"><span>field pass · play</span><span>No. 042</span></div>
            <h3>Box Cricket Under Lights</h3>
            <p>8-a-side · tennis ball · floodlit cage, Friday 7pm.</p>
            <div className="detail">turf ground · one sharbat break · bring studs</div>
            <span className="price">entry ≈ ₹150 / player</span>
          </div>
          <div className="packet p2">
            <div className="packet-top"><span>greenhouse · build</span><span>ship it</span></div>
            <h3>Hack Club Night</h3>
            <p>Build a small website, launch it, demo it on stage. You keep all the swag.</p>
            <div className="detail">tonight: personal websites · mentors: 2 seniors + chai · beginners welcome</div>
            <span className="price">free for members</span>
          </div>
          <div className="packet p3">
            <div className="packet-top"><span>moon pass · gather</span><span>18:00 → 22:00</span></div>
            <h3 style={{ color: "#f4efe0" }}>Terrace Social + Glow Rave</h3>
            <p>Open mic first, student DJs after. Fairy lights, floor cushions, fries stall.</p>
            <div className="detail">student safety team on duty · +1 allowed with pass</div>
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
          <span className="sec-no">❧ 01 — sections</span>
          <h2>One club,<br /><em>three sections</em></h2>
          <p>Pick one section or try all three. Students lead every section — <b>you can lead one next season.</b></p>
        </div>
        <div className="wings">
          <article className="wing reveal">
            <span className="wing-stamp">entry · ₹100–200</span>
            <div className="wing-kicker">section one — sports</div>
            <div className="wing-big">Play</div>
            <small className="latin">evening leagues on campus grounds</small>
            <ul>
              <li><span className="ic">☀</span><span><b>Volleyball · Football · Cricket</b><br />dust, turf, floodlights + lime lines</span></li>
              <li><span className="ic">☘</span><span><b>Basketball</b> <small>(full team, loud sidelines)</small></span></li>
              <li><span className="ic">✿</span><span><b>Badminton</b> <small>(singles + doubles only — the quiet room)</small></span></li>
            </ul>
            <div className="soil">worn-grass grounds · 2 chai breaks · floodlights</div>
            <a className="mini" href="#play">See the sports →</a>
          </article>
          <article className="wing reveal">
            <span className="wing-stamp">hack club inside</span>
            <div className="wing-kicker" style={{ color: "#c8d6a8" }}>section two — code + circuits</div>
            <div className="wing-big" style={{ color: "#f4efe0" }}>Build</div>
            <small className="latin">build it, launch it, keep the rewards</small>
            <ul>
              <li><span className="ic">⌨</span><span><b>Coding workshops</b><br /><span style={{ color: "#b9c2a8" }}>sites, bots, mini-games · zero to demo</span></span></li>
              <li><span className="ic">◍</span><span><b>Tech / electronics</b><br /><span style={{ color: "#b9c2a8" }}>PCBs, sensors, blink-everything boards</span></span></li>
                <li><span className="ic">✿</span><span>Ship → <b>keep your rewards</b>. The club runs on entry fees — never on grants.</span></li>
            </ul>
            <div className="soil">mentors: seniors who've burnt their fingers so you don't have to</div>
            <a className="mini" href="#build" style={{ color: "#f6e3b4" }}>See the workshops →</a>
          </article>
          <article className="wing reveal">
            <span className="wing-stamp">day → moon</span>
            <div className="wing-kicker">section three — stage + spotlight</div>
            <div className="wing-big">Gather</div>
            <small className="latin">talks, stalls, music and dance</small>
            <ul>
              <li><span className="ic">◈</span><span><b>Entrepreneur Summit</b><br />stalls, 5-min pitches, worst-idea comedy</span></li>
              <li><span className="ic">◎</span><span><b>Tech Summit / Fair</b><br />touch-everything tables + teardown corner</span></li>
              <li><span className="ic">☾</span><span><b>Music, socials &amp; glowy raves</b><br />open mic → DJ, fairy lights always</span></li>
            </ul>
            <div className="soil">day events → night music · ends 10pm sharp</div>
            <a className="mini" href="#summits">See the events →</a>
          </article>
        </div>
      </section>

      {/* PLAY */}
      <section className="wrap" id="play" style={{ paddingTop: 8 }}>
        <div className="sec-head reveal">
          <span className="sec-no">❧ 02 — play</span>
          <h2>The Play section<br /><em>five sports</em></h2>
          <p>Everything except badminton is a <b>team sport</b>. Badminton is <b>singles + doubles</b>. Each card lists the ground and the timings.</p>
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
                  <span>entry ≈ ₹100–200 / head</span>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="note-bar reveal">
          <b>HOW LEAGUES WORK →</b>
          <span>Student captains pick the teams · round-robin, then semis and finals under lights · live bracket on the notice board.</span>
        </div>
      </section>

      <div className="strip sage" aria-hidden>
        <div className="strip-track">
          {[0, 1].map((h) => (
            <div key={h} style={{ display: "inline-flex" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <i key={i}>volleyball ❧ football ❧ badminton ❧ cricket ❧ basketball ❧&nbsp;</i>
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
            <h2>Build section ×<br />Hack Club</h2>
            <p style={{ color: "#b9c2a8" }}>Our tech section runs with <b style={{ color: "#f6e3b4" }}>Hack Club</b> — a global community of student builders. Weekend coding + electronics workshops: build a real project, launch it, and keep every reward you earn.</p>
          </div>
          <div className="hack-grid">
            <div className="journal reveal">
              <div className="term-bar">
                <i style={{ background: "#e8a87c" }} /><i style={{ background: "#e8cf8a" }} /><i style={{ background: "#9dbf8a" }} />
                <span style={{ marginLeft: 8, fontFamily: "var(--mono)", fontSize: 11.5, color: "#8d967f", letterSpacing: "0.08em" }}>yuvora — monsoon ship-log ❧</span>
              </div>
              <div className="term-body">
                <div><span className="g">$</span> yuvora workshops --list</div>
                <div className="dim">→ coding: personal websites, discord bots, tiny games (sat, 4pm, with pakoras)</div>
                <div className="dim">→ electronics: sensors, PCBs, boards that blink (sun, 11am, beginners welcome)</div>
                <div><span className="g">$</span> yuvora launch ./my-project</div>
                <div>✓ shipped! hack club sent <span className="o">stickers + tee + hardware grant</span> → <span className="paper-note">yours to keep, forever</span></div>
                <div className="dim"># law of the grove: what you ship and earn is yours. the club runs on entry fees — never on grants.</div>
              </div>
            </div>
            <div>
              <div className="merch-card reveal">
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#6f8f5e" }}>FUNDED BY HACK CLUB ✿ — READ SLOWLY</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 29, fontWeight: 800, lineHeight: 1.05, marginTop: 6 }}>STEM nights are funded.<br />The club isn't dependent.</div>
                <p style={{ fontWeight: 500, color: "#5c6758", lineHeight: 1.65, fontSize: 14.5 }}>Tech fairs, hackathons and hardware come via Hack Club funding — and anything you earn by shipping stays 100% yours. Yuvora itself runs on its own sports entry fees, never on grants or rewards.</p>
                <div className="pill-row">
                  {["stem: funded by hack club", "rewards: personal", "club: independent"].map((p) => (
                    <span className="pill light" key={p}>{p}</span>
                  ))}
                </div>
              </div>
              <div className="steps reveal">
                <div className="step"><b>1</b><p><strong>Learn.</strong> Weekend coding + electronics workshops. No experience needed — seniors sit with you and debug with you.</p></div>
                <div className="step"><b>2</b><p><strong>Build.</strong> Finish a website, bot or circuit board and demo it on stage. Hack Club counts it as a launched project.</p></div>
                <div className="step"><b>3</b><p><strong>Lead.</strong> Demo your work on stage. Entry fees — not grants — keep the club running.</p></div>
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
          <p>Founders on stage in the morning, robots on jute cloth by noon, shipping till the moon is high. Tech fairs &amp; hackathons are <b>funded by Hack Club</b> — the club itself runs on entry fees, not grants.</p>
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
              Student startups on jute-covered tables, local founders as friendly judges, a <strong>flea-market demo lane</strong> and handshake deals counted in applause, not money.
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
              Robots, tech boards, games and glowing sites. <strong>Sticker passports</strong> for wanderers, a teardown table of dead remotes, and seniors who explain without sighing.
              <br /><span className="funded">✿ funded by Hack Club</span>
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
              Teams form Friday, demo Sunday noon. Food, judging and prizes are covered by <strong>Hack Club</strong>. Blankets, extension boards and quiet corners provided.
              <br /><span className="funded">✿ funded by Hack Club</span>
            </div>
          </article>
        </div>
      </section>

      {/* AFTER DARK — youth music + social gatherings */}
      <section className="afterdark" id="afterdark">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="sec-no">☾ 05 — after dark</span>
            <h2>After dark:<br />youth music + socials</h2>
            <p style={{ color: "#b9bfae" }}>Yuvora is where the campus comes to feel alive after sunset. <b style={{ color: "#f6e3b4" }}>Youth music, open mics, DJ nights and social gatherings</b> — from slow terrace jam circles to full student raves with glow paint, fairy lights and dancefloors that don't quit. Every night is student-run, loud in the best way, and tucked in by 10.</p>
          </div>
          <div className="gig-list" style={{ gridTemplateColumns: "1fr" }}>
            <article className="gig reveal">
              <div className="when">☾ YOUTH MUSIC · SOCIAL GATHERINGS · STUDENT RAVES · ID CHECKED</div>
              <h3>After Dark at Yuvora</h3>
              <p style={{ fontWeight: 500, color: "#5c6758", lineHeight: 1.7 }}>When the sun sets, the campus lights up. Open mics and student bands first, then rap cyphers and jam circles, then student DJs till close. Glow paint, fairy lights, themed nights and mixers to meet new people — <b>every event is student-run, for students only.</b></p>
              <p style={{ fontWeight: 500, color: "#5c6758", lineHeight: 1.7, marginTop: 8 }}><b>Safety first:</b> ID checked at entry · no alcohol · safety team in glowing vests all night · lit paths · free water · everything ends sharp by 10pm with parent/campus contacts on every poster. Anyone uncomfortable gets walked out safe, no questions.</p>
              <div className="fee-row"><span>free for members · guests with a member ₹49</span><a href="#join">Get pass →</a></div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#9aa392", marginTop: 8 }}>rain plan: indoor hall, same event · playlist in the logbook</div>
            </article>
          </div>
          <p className="reveal" style={{ fontFamily: "var(--mono)", fontSize: 12, marginTop: 16, color: "#9aa78f" }}>
            house rules: student-only · no alcohol · safety team · ends by 10pm.
          </p>
        </div>
      </section>

      {/* FUNDING */}
      <section className="wrap" id="money">
        <div className="sec-head reveal">
          <span className="sec-no">❧ 06 — money</span>
          <h2>How the club<br /><em>pays for itself</em></h2>
          <p>No giant sponsor with a loud banner. Entry fees run the club — Hack Club funding boosts STEM nights. <b>Never the other way around.</b></p>
        </div>
        <div className="ledger">
          <div className="reveal"><h4>① sports entry fees — the budget</h4><p>Leagues charge <b>₹100–₹200 per head</b>. Every rupee pinned on the board: ground + gear + ref. This — and only this — keeps Yuvora running.</p></div>
          <div className="reveal"><h4>② stem events — funded by Hack Club</h4><p>Tech fairs, hackathons and hardware come via <b>Hack Club funding</b>. A bonus for builders, never the club's budget.</p></div>
          <div className="reveal"><h4>③ independent by design</h4><p>No grant dependence, no reward cuts. What you earn by shipping is <b>100% yours</b> — we garland you on stage and never take a share.</p></div>
        </div>
      </section>

      {/* JOIN */}
      <section className="wrap" id="join" style={{ paddingTop: 8 }}>
        <div className="sec-head reveal">
          <span className="sec-no">✿ 07 — member pass</span>
          <h2>Get your<br /><em>member pass</em></h2>
          <p>This is a demo pass for now — screenshot it and show it at the gate. Pick your style:</p>
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
              Your name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarav Sharma" maxLength={30} />
            </label>
            <label className="field">
              Your section
              <input value={wing} onChange={(e) => setWing(e.target.value)} placeholder="Play / Build / Gather" maxLength={24} />
            </label>
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <a className="btn btn-clay" href={`mailto:yuvoraclub.official@gmail.com?subject=Yuvora%20seed%20pass%20—%20${encodeURIComponent(displayName)}%20(${vibe})&body=Hi%20Yuvora!%20I%20want%20to%20grow%20in.%20Vibe:%20${vibe}%20Grove:%20${encodeURIComponent(wing)}%20ID:%20${memberId}`}>Send join note →</a>
              <a className="btn btn-paper" href="#faq">Questions? Read the FAQ</a>
            </div>
            <p style={{ fontFamily: "var(--hand)", fontSize: 22, marginTop: 12, color: "var(--clay)" }}>no long forms — just a name, a vibe, and showing up ready ↑</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 12.5, marginTop: 10, color: "var(--muted)", lineHeight: 1.7 }}>
              write to us → <a href="mailto:yuvoraclub.official@gmail.com" style={{ fontWeight: 700, color: "var(--ink)" }}>yuvoraclub.official@gmail.com</a>
              <br />dm us → <a href="https://instagram.com/the_yuvora_club" target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: "var(--ink)" }}>@the_yuvora_club</a>
            </p>
          </div>
          <div className="id-card reveal">
            <div className="id-top"><span>✿ Yuvora seed pass</span><span>{memberId}</span></div>
            <div className="id-name">{displayName}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "#6b5a35", letterSpacing: "0.06em" }}>{vibe.toUpperCase()} · {(wing || "Yuvora").toUpperCase()}</div>
            <div style={{ fontFamily: "var(--hand)", fontSize: 19, color: "#8a6f3c", marginTop: 4 }}>made on campus, with love</div>
            <div className="id-meta">
              <span>play ✓</span><span>build ✓</span><span>gather ✓</span><span>moon ✓</span>
            </div>
            <div className="barcode" />
            <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, marginTop: 8, color: "#8a7a52" }}>screenshot this · show at gate · demo pass v1</div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="wrap" id="faq" style={{ paddingTop: 8 }}>
        <div className="sec-head reveal">
          <span className="sec-no">❧ 08 — faq</span>
          <h2>Questions?<br /><em>Answered.</em></h2>
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
        <div className="reveal" style={{ marginTop: 22, border: "var(--line)", borderRadius: 16, padding: "18px 20px", background: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontFamily: "var(--display)", fontSize: 24, margin: "0 0 6px" }}>Still have questions?</h3>
          <p style={{ margin: "0 0 14px", color: "var(--muted)", fontWeight: 500, lineHeight: 1.65 }}>We'd be happy to hear from you. Reach out to the team and stay connected with the community.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn btn-clay" href="mailto:yuvoraclub.official@gmail.com?subject=Yuvora%20question">Email the team →</a>
            <a className="btn btn-paper" href="https://instagram.com/the_yuvora_club" target="_blank" rel="noreferrer">DM on Instagram ↗</a>
          </div>
        </div>
      </section>
      </>
      )}

      <footer>
        <div className="foot-inner">
          <div className="foot-grid">
            <div style={{ maxWidth: 330 }}>
              <div className="logo" style={{ color: "#f4efe0" }}><span className="logo-mark">❧</span><span>YUVORA<small style={{ color: "#8d967f" }}>student-run club</small></span></div>
              <p style={{ color: "#a8b09a", fontWeight: 500, lineHeight: 1.65, fontSize: 14.5 }}>One student club for sports, tech and events. Evening leagues, building with Hack Club, summits by day and music by night.</p>
              <div className="pill-row">
                <span className="pill">run by students</span><span className="pill">for students</span>
              </div>
            </div>
            <div>
              <h5>Sections</h5>
              <a href="#play">Play — 5 fields</a>
              <a href="#build">Build — Hack Club</a>
              <a href="#summits">Summits + ships</a>
              <a href="#afterdark">After dark</a>
            </div>
            <div>
              <h5>Crew</h5>
              <a href="/join">Join Us</a>
              <a href="#join">Get seed pass</a>
              <a href="#money">Money</a>
              <a href="#faq">FAQ</a>
              <a href="mailto:yuvoraclub.official@gmail.com">yuvoraclub.official@gmail.com</a>
              <a href="https://instagram.com/the_yuvora_club" target="_blank" rel="noreferrer">@the_yuvora_club ↗</a>
            </div>
            <div>
              <h5>Friends</h5>
              <a href="https://instagram.com/the_yuvora_club" target="_blank" rel="noreferrer">Instagram ↗</a>
              <a href="https://hackclub.com" target="_blank" rel="noreferrer">Hack Club ↗</a>
              <a href="#top">Back to top ↑</a>
            </div>
          </div>
          <div className="giant" aria-hidden>YUVORA</div>
          <div className="foot-base">
            <span>© 2026 Yuvora · student-run · demo site v1</span>
            <span>made with chai, floodlights, solder & moonlight</span>
          </div>
        </div>
      </footer>
    </>
  );
}
