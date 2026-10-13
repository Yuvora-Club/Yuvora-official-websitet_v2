// Member dashboard — opens right after login or Join registration.
// Today: sidebar + Announcements (empty state). More panels plug in later.

import { logout } from "../services/authService.js";
import { navigate } from "../services/router.js";
import { useAuth } from "../state/useAuth.js";

const SIDE_LINKS = [
  { id: "announcements", label: "Announcements", icon: "✿", href: "/dashboard" },
  { id: "members", label: "Members", icon: "❧", href: "/members" },
  { id: "home", label: "Back to site", icon: "←", href: "/" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <section className="wrap members-page">
        <div className="sec-head reveal in">
          <span className="sec-no">✿ dashboard</span>
          <h2>
            Sign in to see your <em>dashboard</em>
          </h2>
          <p>Your grove notices live here — members only.</p>
        </div>
        <div className="members-cta reveal in">
          <a className="btn btn-clay" href="/login?next=%2Fdashboard">
            Log in →
          </a>
          <a className="btn btn-paper" href="/join">
            Join Yuvora →
          </a>
        </div>
      </section>
    );
  }

  const firstName = (user.name || "").trim().split(/\s+/)[0] || "Seedling";

  function onLogout() {
    logout();
    navigate("/");
  }

  return (
    <section className="wrap members-page">
      <div className="sec-head reveal in">
        <span className="sec-no">✿ dashboard</span>
        <h2>
          Welcome, <em>{firstName}</em>
        </h2>
        <p>
          Your corner of the grove — notices first, everything else as it
          grows.
        </p>
      </div>

      <div className="dash-layout reveal in">
        <aside className="dash-side">
          <nav>
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
          </nav>
          <button className="btn btn-paper" type="button" onClick={onLogout}>
            Log out
          </button>
        </aside>

        <div className="dash-main">
          <div className="join-card">
            <h3>Announcements 📢</h3>
            <p className="join-sub">
              Fresh from the crew — check back often.
            </p>
            <div className="note-bar" style={{ marginTop: 14 }}>
              <b>QUIET GROVE →</b>
              <span>
                No announcements yet. When the crew posts one, it will sprout
                here.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
