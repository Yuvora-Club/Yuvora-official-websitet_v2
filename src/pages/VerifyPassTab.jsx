// Seed-pass member check — admin-only tab inside /admin.
// Type a member's YV-XXXX code -> do they belong? Shows their profile and
// every event they're registered in. Pure lookup — nothing is ever recorded.

import { useState } from "react";
import { verifySeedPass } from "../services/adminService.js";

function when(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function sportLabel(id) {
  const s = String(id || "").replace(/[-_]/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

export default function VerifyPassTab() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [found, setFound] = useState(null);

  async function onVerify(e) {
    e.preventDefault();
    setError("");
    setFound(null);
    if (!code.trim()) {
      setError("Type a seed-pass code — e.g. YV-8930.");
      return;
    }
    setBusy(true);
    const res = await verifySeedPass(code.trim());
    setBusy(false);
    if (!res.ok) {
      setError(res.formError || "Could not verify that code.");
      return;
    }
    setFound(res);
  }

  function reset() {
    setCode("");
    setError("");
    setFound(null);
  }

  const member = found?.member || null;
  const events = found?.events; // array = list, [] = none yet, null = load failed

  return (
    <div className="admin-tab">
      <div className="join-card admin-card">
        <span className="dash-sticker" aria-hidden="true">member check</span>
        <h3>Verify seed pass</h3>
        <p className="join-sub">
          Type the member's <b>YV-XXXX</b> code to check they belong — you'll see
          their profile and <b>every event they're registered in</b>.
        </p>
        <form onSubmit={onVerify} noValidate>
          <label className="field auth-field" htmlFor="admin-verify-code">
            <span className="auth-label">Seed-pass code</span>
            <input
              id="admin-verify-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. YV-8930"
              autoComplete="off"
              spellCheck="false"
              maxLength={12}
            />
          </label>
          <div className="dash-play-row">
            <button className="btn btn-clay dash-btn" type="submit" disabled={busy}>
              {busy ? "Verifying…" : "Verify"}
            </button>
            {(found || error) && (
              <button type="button" className="btn btn-paper dash-btn" onClick={reset}>
                Clear
              </button>
            )}
          </div>
        </form>
        {error && <p className="ev-formerror" role="alert">{error}</p>}
      </div>

      {member && (
        <div className="join-card admin-card" role="status" style={{ borderColor: "#2e7d32" }}>
          <span className="dash-sticker" aria-hidden="true" style={{ background: "#2e7d32", color: "#fff", borderColor: "#2e7d32" }}>
            belongs
          </span>
          <h3 style={{ fontSize: 26 }}>{member.fullName || "—"}</h3>
          <p className="join-sub">{found?.code || member.seedPassCode || "—"} · {member.role === "admin" ? "admin" : "member"}</p>
          <dl className="admin-profile-list">
            <div><dt>Email</dt><dd>{member.email || "—"}</dd></div>
            <div><dt>Phone</dt><dd>{member.phone || "—"}</dd></div>
            <div><dt>School</dt><dd>{member.school || "—"}</dd></div>
            <div><dt>Age</dt><dd>{member.age ?? "—"}</dd></div>
          </dl>

          <p className="auth-hint" style={{ marginTop: 14, marginBottom: 6 }}>Registered events</p>
          {events === null ? (
            <p className="ev-formerror" role="alert">{found?.eventsError || "Registrations could not be loaded — try again."}</p>
          ) : events.length === 0 ? (
            <p className="auth-hint">Not registered for any event yet.</p>
          ) : (
            <div>
              {events.map((ev) => (
                <div
                  key={ev.teamId ? `team-${ev.teamId}` : `ind-${ev.eventId}`}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    flexWrap: "wrap",
                    padding: "8px 0",
                    borderBottom: "1px dashed rgba(0,0,0,.14)",
                  }}
                >
                  <strong>{ev.name}</strong>
                  <span
                    className={`dash-sticker${ev.type === "team" ? " dash-sticker-clay" : ""}`}
                    style={{ marginBottom: 0, padding: "3px 9px" }}
                  >
                    {ev.type === "team" ? `team${ev.sport ? ` · ${sportLabel(ev.sport)}` : ""}` : "individual"}
                  </span>
                  {ev.teamName && <span className="join-sub" style={{ margin: 0 }}>{ev.teamName}</span>}
                  <span className="auth-hint" style={{ marginLeft: "auto" }}>{when(ev.when)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
