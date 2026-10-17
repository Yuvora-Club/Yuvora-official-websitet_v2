// Seed-pass gate verifier — admin-only tab inside /admin.
// Type a member's YV-XXXX code -> profile pops up instantly -> Mark entry logs the scan.

import { useState } from "react";
import { consumeSeedPass, verifySeedPass } from "../services/adminService.js";

function when(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function VerifyPassTab() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [consuming, setConsuming] = useState(false);
  const [error, setError] = useState("");
  const [found, setFound] = useState(null);
  const [marked, setMarked] = useState(null);

  async function onVerify(e) {
    e.preventDefault();
    setError("");
    setFound(null);
    setMarked(null);
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

  async function onMarkEntry() {
    if (!found?.pass?.code) return;
    setConsuming(true);
    const res = await consumeSeedPass(found.pass.code);
    setConsuming(false);
    if (!res.ok) {
      setError(res.formError || "Could not record entry.");
      return;
    }
    setMarked(res);
    setFound((prev) => prev && { ...prev, pass: res.pass, member: res.member || prev.member });
  }

  function reset() {
    setCode("");
    setError("");
    setFound(null);
    setMarked(null);
  }

  const member = found?.member || marked?.member || null;
  const pass = marked?.pass || found?.pass || null;
  const scans = found?.scans || [];
  const doubleUse = !!(marked?.pass?.alreadyScanned || (!marked && (pass?.scanCount || 0) > 0));
  const border = doubleUse ? { borderColor: "#c0392b" } : { borderColor: "#2e7d32" };
  const sticker = doubleUse ? { background: "#c0392b" } : { background: "#2e7d32" };
  const stickerText = marked
    ? (marked.pass?.alreadyScanned ? "already scanned" : "entry marked")
    : (pass?.scanCount || 0) > 0 ? `scanned ${pass.scanCount}x before` : "verified";

  return (
    <div className="admin-tab">
      <div className="join-card admin-card">
        <span className="dash-sticker" aria-hidden="true">gate verifier</span>
        <h3>Verify seed pass</h3>
        <p className="join-sub">
          Type the member's <b>YV-XXXX</b> code at the gate — their profile pops up instantly.
          Hit <b>Mark entry</b> to log the scan. Already-scanned codes flash a double-use warning.
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

      {member && pass && (
        <div className="join-card admin-card" role="status" style={border}>
          <span className="dash-sticker" aria-hidden="true" style={sticker}>{stickerText}</span>
          <h3 style={{ fontSize: 26 }}>{member.fullName || "—"}</h3>
          <p className="join-sub">{pass.code} · {member.role === "admin" ? "admin" : "member"}</p>
          <dl className="admin-profile-list">
            <div><dt>Email</dt><dd>{member.email || "—"}</dd></div>
            <div><dt>Phone</dt><dd>{member.phone || "—"}</dd></div>
            <div><dt>School</dt><dd>{member.school || "—"}</dd></div>
            <div><dt>Age</dt><dd>{member.age ?? "—"}</dd></div>
            <div><dt>Scans</dt><dd>{pass.scanCount ?? 0} recorded</dd></div>
          </dl>
          {doubleUse && (
            <p className="ev-formerror" role="alert">
              Already scanned before — possible double-use. Check the person before letting them in.
            </p>
          )}
          {scans.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p className="auth-hint">Recent scans:</p>
              {scans.slice(0, 5).map((s) => (
                <p key={s.id} className="auth-hint">· {when(s.at)}{s.note ? ` — ${s.note}` : ""}</p>
              ))}
            </div>
          )}
          {!marked && (
            <div className="dash-play-row" style={{ marginTop: 12 }}>
              <button className="btn btn-clay dash-btn" type="button" onClick={onMarkEntry} disabled={consuming}>
                {consuming ? "Marking…" : "Mark entry"}
              </button>
            </div>
          )}
          {marked && !marked.pass?.alreadyScanned && (
            <p className="ev-success" role="status">Entry logged — wave them in.</p>
          )}
        </div>
      )}
    </div>
  );
}
