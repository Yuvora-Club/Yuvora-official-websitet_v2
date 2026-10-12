// Join Us form — PLACEHOLDER ONLY. Does not submit anywhere yet.
// Same Yuvora paper/moss/clay theme, reuses .field / .btn / .wrap classes.

import { useState } from "react";

export default function JoinPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [altEmail, setAltEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [tried, setTried] = useState(false);

  const passwordsMatch = !confirm || password === confirm;

  function onPlaceholderSubmit(e) {
    e.preventDefault();
    setTried(true);
    // Intentionally does nothing — backend not connected yet.
  }

  return (
    <section className="wrap members-page">
      <div className="sec-head reveal in">
        <span className="sec-no">✿ join us</span>
        <h2>
          Join <em>Yuvora</em>
        </h2>
        <p>
          One form for the whole grove — <b>Play · Build · Gather</b>. Fill it in,
          screenshot your vibe, and come say hi. Submissions are{" "}
          <b>disabled for now</b> — this is a design preview.
        </p>
      </div>

      <div className="join-layout reveal in">
        <form className="join-card" onSubmit={onPlaceholderSubmit}>
          <h3>Seedling application 🌱</h3>
          <p className="join-sub">
            Placeholder form — button below does nothing yet. Backend coming soon.
          </p>

          <label className="field" htmlFor="join-name">
            Full name
            <input
              id="join-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              maxLength={60}
              autoComplete="name"
            />
          </label>

          <label className="field" htmlFor="join-email">
            Email
            <input
              id="join-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu"
              autoComplete="email"
            />
          </label>

          <label className="field" htmlFor="join-altemail">
            Alternate email <span className="opt">(optional)</span>
            <input
              id="join-altemail"
              type="email"
              value={altEmail}
              onChange={(e) => setAltEmail(e.target.value)}
              placeholder="optional backup email"
              autoComplete="email"
            />
          </label>

          <div className="join-row">
            <label className="field" htmlFor="join-phone">
              Phone no.
              <input
                id="join-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 98765 43210"
                inputMode="numeric"
                autoComplete="tel"
              />
            </label>
            <label className="field" htmlFor="join-age">
              Age
              <input
                id="join-age"
                type="number"
                min="10"
                max="100"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 19"
              />
            </label>
          </div>

          <label className="field" htmlFor="join-pass">
            Password
            <input
              id="join-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </label>

          <label className="field" htmlFor="join-confirm">
            Confirm password
            <input
              id="join-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="repeat password"
              autoComplete="new-password"
            />
          </label>
          {!passwordsMatch && (
            <p className="join-error" role="alert">
              Passwords don&apos;t match yet.
            </p>
          )}

          <label className="join-check" htmlFor="join-terms">
            <input
              id="join-terms"
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>
              I agree to the <a href="/terms">Terms &amp; Conditions</a> and{" "}
              <a href="/privacy">Privacy Policy</a>.
            </span>
          </label>

          {tried && (
            <p className="join-notice" role="status">
              ✿ Placeholder only — form doesn&apos;t submit yet. Backend + email
              verification coming soon.
            </p>
          )}

          <div className="join-actions">
            <button
              className="btn btn-clay"
              type="submit"
              title="Placeholder — submissions disabled"
            >
              Apply to join (coming soon) →
            </button>
            <a className="btn btn-paper" href="/">
              ← Back to sunlight
            </a>
          </div>
          {!accepted && tried && (
            <p className="join-error" role="alert">
              Please tick the Terms &amp; Privacy box (preview only).
            </p>
          )}
        </form>

        <aside className="join-side">
          <h3>How joining grows</h3>
          <ol>
            <li>Fill the form (preview — nothing is sent).</li>
            <li>Later: verify email + phone, pick a grove.</li>
            <li>Get your seed pass after a senior says hi.</li>
          </ol>
          <div className="note-bar" style={{ marginTop: 14 }}>
            <b>SOIL NOTE →</b>
            <span>No spam, no fees to join. Just dusty shoes + curiosity.</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
