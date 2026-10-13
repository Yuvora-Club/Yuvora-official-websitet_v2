// Organizer check-in screen (interface + mock contract only).
// Not linked in public navigation. Real check-in needs organizer auth +
// server-side verification — this page never claims otherwise.

import { useState } from "react";
import { mockRecordDemoScan, mockVerifyToken, parseTokenInput } from "../services/checkInService.js";
import { DemoNotice } from "../components/eventBits.jsx";

const RESULT_LABEL = {
  demo: "Demo code — not valid for entry",
  valid: "Valid",
  already_used: "Already used",
  cancelled: "Cancelled",
  invalid: "Invalid",
  wrong_event: "Wrong event",
};

export default function CheckInPage() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function onVerify(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    const parsed = parseTokenInput(input);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const res = mockVerifyToken(parsed.token);
      if (res.result === "demo") mockRecordDemoScan(parsed.token);
      setResult({ token: parsed.token, ...res });
      setBusy(false);
    }, 400);
  }

  return (
    <section className="wrap members-page">
      <div className="sec-head reveal in">
        <span className="sec-no">☾ 15 — organizers</span>
        <h2>
          Gate <em>check-in</em>
        </h2>
        <p>
          Organizer interface preview. <b>Mock only — no real verification happens here.</b> Real
          check-in needs organizer sign-in and backend verification with double-use protection.
        </p>
      </div>
      <DemoNotice text="Interface + service contract only. Demo codes are always reported as non-entry; every other identifier is invalid until the backend exists." />

      <form className="ev-form reveal in" onSubmit={onVerify}>
        <label className="field" htmlFor="checkin-token">
          Pass identifier (scan or type)
          <input
            id="checkin-token"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. DEMO-… or verification URL"
            autoComplete="off"
            spellCheck="false"
          />
        </label>
        {error && <p className="ev-formerror" role="alert">{error}</p>}
        <button className="btn btn-clay" type="submit" disabled={busy}>
          {busy ? "Verifying… (demo)" : "Verify pass →"}
        </button>
      </form>

      {result && (
        <div className="note-bar reveal in" role="status">
          <b>{RESULT_LABEL[result.result] || result.result} →</b>
          <span>
            <b>{result.token}</b>
            <br />
            {result.detail}
            {typeof result.scans === "number" && result.scans > 0 && (
              <> Demo scans recorded for this code: {result.scans + 1}.</>
            )}
          </span>
        </div>
      )}

      <div className="note-bar reveal in">
        <b>BACKEND CONTRACT →</b>
        <span>
          POST /api/check-in/verify and POST /api/check-in/confirm (organizer auth, idempotent) must
          own genuineness, event match, revocation and double-use. See EVENT_SYSTEM_SETUP.md.
        </span>
      </div>
    </section>
  );
}
