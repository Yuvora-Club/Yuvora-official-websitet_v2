// Join Us form — LIVE. Submits to POST /api/auth/register on the backend
// (see Backend/src/routes/auth.js). Backend URL comes from VITE_API_URL
// (Frontend/.env.development / .env.production via src/services/api.js).

import { useState } from "react";
import { apiFetch } from "../services/api.js";
import { saveLiveSession } from "../services/authService.js";
import { navigate } from "../services/router.js";

function FieldErr({ message }) {
  if (!message) return null;
  return (
    <p className="join-error" role="alert">
      {message}
    </p>
  );
}

export default function JoinPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [altEmail, setAltEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(null);

  const passwordsMatch = !confirm || password === confirm;

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    if (!passwordsMatch) {
      setFieldErrors({ confirm: "Passwords don't match yet." });
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          email,
          altEmail: altEmail || undefined,
          phone,
          age: age === "" ? "" : Number(age),
          password,
          confirm,
          accepted,
        }),
      });
      setBusy(false);
      if (data && data.ok) {
        setJoined(data.user);
        // Sign straight in so the dashboard greets the new member.
        saveLiveSession(data.user, data.customToken);
        try {
          window.localStorage.setItem(
            "yuvora.v1.joined",
            JSON.stringify({ user: data.user, at: new Date().toISOString() })
          );
        } catch {
          /* storage blocked — dashboard still opens */
        }
        setTimeout(() => navigate("/dashboard"), 900);
        return;
      }
      setFormError("Unexpected response from the server. Please try again.");
    } catch (err) {
      setBusy(false);
      const payload = err && err.data;
      if (payload && payload.errors) {
        // 400 validation / 409 email-taken — show per-field messages.
        setFieldErrors(payload.errors);
        setFormError(
          err.status === 409
            ? "That email already has a Yuvora account. Try signing in."
            : "Please fix the highlighted fields and try again."
        );
        return;
      }
      if (payload && payload.error) {
        // 503 Firebase not configured / 500 server error.
        setFormError(payload.error);
        return;
      }
      setFormError(
        "Could not reach the registration server. Check your connection and try again."
      );
    }
  }

  if (joined) {
    return (
      <section className="wrap members-page">
        <div className="sec-head reveal in">
          <span className="sec-no">✿ join us</span>
          <h2>
            Welcome to <em>Yuvora</em>
          </h2>
          <p>
            <b>{joined.fullName || "Seedling"}</b>, you&apos;re on the roster —
            we saved <b>{joined.email}</b> to the grove database.
          </p>
        </div>
        <div className="join-layout reveal in">
          <div className="join-card" role="status">
            <h3>Application received 🌱</h3>
            <p className="join-sub">
              Your account was created on the live backend. Opening your
              dashboard…
            </p>
            <div className="join-actions">
              <a className="btn btn-clay" href="/events">
                Browse events →
              </a>
              <a className="btn btn-paper" href="/">
                ← Back to sunlight
              </a>
            </div>
          </div>
          <aside className="join-side">
            <h3>What grows next</h3>
            <ol>
              <li>Verify email + phone when a senior reaches out.</li>
              <li>Pick a grove — Play, Build or Gather.</li>
              <li>Get your seed pass after a senior says hi.</li>
            </ol>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="wrap members-page">
      <div className="sec-head reveal in">
        <span className="sec-no">✿ join us</span>
        <h2>
          Join <em>Yuvora</em>
        </h2>
        <p>
          One form for the whole grove — <b>Play · Build · Gather</b>. Fill it in
          and you&apos;re <b>registered on the live backend</b>.
        </p>
      </div>

      <div className="join-layout reveal in">
        <form className="join-card" onSubmit={onSubmit} noValidate>
          <h3>Seedling application 🌱</h3>
          <p className="join-sub">
            Submits to the live registration endpoint.
          </p>

          {formError && (
            <p className="join-error" role="alert">
              {formError}
            </p>
          )}

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
          <FieldErr message={fieldErrors.fullName || fieldErrors.name} />

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
          <FieldErr message={fieldErrors.email} />

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
          <FieldErr message={fieldErrors.altEmail} />

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
          <FieldErr message={fieldErrors.phone} />
          <FieldErr message={fieldErrors.age} />

          <label className="field" htmlFor="join-pass">
            Password
            <input
              id="join-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 8 characters"
              autoComplete="new-password"
            />
          </label>
          <FieldErr message={fieldErrors.password} />

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
          <FieldErr message={fieldErrors.confirm} />
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
          <FieldErr message={fieldErrors.accepted} />

          <div className="join-actions">
            <button className="btn btn-clay" type="submit" disabled={busy}>
              {busy ? "Planting… →" : "Apply to join →"}
            </button>
            <a className="btn btn-paper" href="/">
              ← Back to sunlight
            </a>
          </div>
          <p className="ev-switch">
            Already growing here? <a href="/login">Log in →</a>
          </p>
        </form>

        <aside className="join-side">
          <h3>How joining grows</h3>
          <ol>
            <li>Fill the form — it registers you instantly.</li>
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
