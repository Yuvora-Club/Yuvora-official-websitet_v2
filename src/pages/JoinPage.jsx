// Join Us form — LIVE. Submits to POST /api/auth/register on the backend
// (see Backend/src/routes/auth.js). Backend URL comes from VITE_API_URL
// (Frontend/.env.development / .env.production via src/services/api.js).
//
// UI-only refresh: layout + styling changed to match login/register.
// All label htmlFor / input IDs, button behavior, href paths, and the
// apiFetch + saveLiveSession + navigate flow are intentionally untouched.

import { useEffect, useState } from "react";
import { apiFetch } from "../services/api.js";
import { requestEmailOtp, saveLiveSession, verifyEmailOtp } from "../services/authService.js";
import { GoogleButton } from "./AuthPages.jsx";
import { navigate } from "../services/router.js";

function FieldErr({ message }) {
  if (!message) return null;
  return (
    <p className="join-error" role="alert">
      {message}
    </p>
  );
}

function JoinPasswordField({ id, label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field auth-field join-field" htmlFor={id}>
      <span className="auth-label">{label}</span>
      <span className="ev-passwrap">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="ev-showpass"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
        >
          {show ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}

export default function JoinPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [altEmail, setAltEmail] = useState("");
  const [school, setSchool] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(null);

  // Email OTP gate — registration is blocked until the primary email is
  // verified (Send OTP -> 6-digit code -> Verify). Google sign-ups skip
  // this because Google already verified that address.
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpInfo, setOtpInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Changing the email after verifying invalidates the check.
  function onEmailChange(v) {
    setEmail(v);
    if (otpVerified && v.trim().toLowerCase() !== verifiedEmail) {
      setOtpVerified(false);
      setVerifiedEmail("");
      setOtpInfo("");
    }
  }

  async function onSendOtp() {
    setOtpError("");
    setOtpInfo("");
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) {
      setOtpError("Enter a valid email address first, then tap Send OTP.");
      return;
    }
    setOtpBusy(true);
    const res = await requestEmailOtp(clean);
    setOtpBusy(false);
    if (!res.ok) {
      setOtpError(res.errors?.email || res.formError || "Couldn't send the code. Try again.");
      return;
    }
    setOtpSent(true);
    setCooldown(60);
    setOtpInfo(`Code sent to ${clean} — check inbox + spam, it expires in 10 min.`);
  }

  async function onVerifyOtp() {
    setOtpError("");
    setOtpInfo("");
    const clean = email.trim().toLowerCase();
    if (!/^\d{6}$/.test(otp.trim())) {
      setOtpError("Enter the 6-digit code from your email.");
      return;
    }
    setOtpBusy(true);
    const res = await verifyEmailOtp(clean, otp.trim());
    setOtpBusy(false);
    if (!res.ok) {
      setOtpError(res.errors?.otp || res.errors?.email || res.formError || "Wrong code. Try again.");
      return;
    }
    setOtpVerified(true);
    setVerifiedEmail(clean);
    setOtpInfo("Email verified — you can now Apply to join.");
  }

  const passwordsMatch = !confirm || password === confirm;

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    if (!passwordsMatch) {
      setFieldErrors({ confirm: "Passwords don't match yet." });
      return;
    }
    // Hard gate: no verified OTP -> no registration.
    if (!otpVerified || email.trim().toLowerCase() !== verifiedEmail) {
      setFieldErrors({ email: "Please verify your email with the OTP first — tap Send OTP, enter the code, then Verify." });
      setFormError("Verify your email first, then Apply to join.");
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
          school,
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
      <section className="wrap members-page auth-wrap join-wrap">
        <div className="sec-head reveal in">
          <span className="sec-no">✿ join us</span>
          <h2>
            Welcome to <em>Yuvora</em>
          </h2>
          <p>
            <b>{joined.fullName || "Seedling"}</b>, you&apos;re on the roster —
              we saved <b>{joined.email}</b> to the club database.
          </p>
        </div>
        <div className="auth-grid join-grid reveal in">
          <div className="auth-card join-success" role="status">
            <div className="auth-card-top">
              <span className="auth-card-kicker">❧ pressed · live roster</span>
              <span className="auth-card-dot" aria-hidden="true">● ● ●</span>
            </div>
            <div className="join-success-body">
              <span className="join-seal" aria-hidden="true">✿</span>
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
          </div>
          <aside className="auth-side">
            <span className="auth-kicker">✿ what grows next</span>
            <h3>
              Stay soft,
              <br />
              stay close.
            </h3>
            <p className="auth-side-sub">
              You&apos;re in. A senior will reach out — then your member pass.
            </p>
            <ol className="auth-steps">
              <li><b>1</b><span>Verify email + phone when a senior reaches out.</span></li>
              <li><b>2</b><span>Pick a section — Play, Build or Gather.</span></li>
              <li><b>3</b><span>Get your seed pass after a senior says hi.</span></li>
            </ol>
            <div className="auth-seal-row">
              <span className="auth-seal">✿ YV · LIVE ROSTER</span>
              <span className="auth-hand">see you at golden hour —</span>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="wrap members-page auth-wrap join-wrap">
      <div className="sec-head reveal in">
        <span className="sec-no">✿ join us</span>
        <h2>
          Join <em>Yuvora</em>
        </h2>
        <p>
          One form for the whole club — <b>Play · Build · Gather</b>. Fill it in
          and you&apos;re <b>registered on the live backend</b>.
        </p>
      </div>

      <div className="auth-grid join-grid reveal in">
        <aside className="auth-side" aria-label="How joining grows">
          <span className="auth-kicker">✿ live registration · ~1 min</span>
          <h3>
            Join
            <br />
            the club.
          </h3>
          <p className="auth-side-sub">
            One form for leagues, workshops, summits &amp; music nights.
          </p>
          <ul className="auth-points">
            <li>
              <span className="auth-ic" aria-hidden="true">☀</span>
              <div>
                <b>Instant live roster</b>
                <small>saved to the club database</small>
              </div>
            </li>
            <li>
              <span className="auth-ic" aria-hidden="true">⌨</span>
              <div>
                <b>Play · Build · Gather</b>
                <small>pick your section after joining</small>
              </div>
            </li>
            <li>
              <span className="auth-ic" aria-hidden="true">☾</span>
              <div>
                <b>Seed pass comes next</b>
                <small>after a senior says hi</small>
              </div>
            </li>
          </ul>
          <div className="auth-note">
            <b>NOTE →</b>
            <span>No spam, no fees to join. Just dusty shoes + curiosity.</span>
          </div>
          <div className="auth-seal-row">
            <span className="auth-seal">✿ SOWN BY STUDENTS</span>
            <span className="auth-hand">grown, not built —</span>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-card-top">
            <span className="auth-card-kicker">❧ member form · live</span>
            <span className="auth-card-dot" aria-hidden="true">● ● ●</span>
          </div>
          <form className="join-card join-form auth-form" onSubmit={onSubmit} noValidate>
            <h3 className="auth-title">Member application 🌱</h3>
            <p className="auth-sub join-sub">
              Submits to the live registration endpoint.
            </p>

            {formError && (
              <p className="join-error" role="alert">
                {formError}
              </p>
            )}

            <div className="join-group">
              <p className="join-group-title">❧ who you are</p>
              <label className="field auth-field join-field" htmlFor="join-name">
                <span className="auth-label">Full name</span>
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

              <label className="field auth-field join-field" htmlFor="join-email">
                <span className="auth-label">Email</span>
                <input
                  id="join-email"
                  type="email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="you@college.edu"
                  autoComplete="email"
                />
              </label>
              <FieldErr message={fieldErrors.email} />

              <div className="join-otp" style={{ marginTop: 10, border: "1.5px dashed #d9a441", borderRadius: 12, padding: 12, background: "#fdf6e3" }}>
                <p className="join-group-title" style={{ margin: "0 0 8px" }}>✿ verify email — OTP required</p>
                {!otpVerified ? (
                  <>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" className="btn btn-paper" onClick={onSendOtp} disabled={otpBusy || cooldown > 0} style={{ fontSize: 13 }}>
                        {otpBusy ? "Sending…" : otpSent ? (cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP") : "Send OTP →"}
                      </button>
                    </div>
                    {otpSent && (
                      <label className="field auth-field join-field" htmlFor="join-otp" style={{ marginTop: 10 }}>
                        <span className="auth-label">6-digit code (check inbox + spam)</span>
                        <span style={{ display: "flex", gap: 8 }}>
                          <input
                            id="join-otp"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="e.g. 482913"
                            inputMode="numeric"
                            maxLength={6}
                            style={{ letterSpacing: "0.3em", fontWeight: 800 }}
                          />
                          <button type="button" className="btn btn-clay" onClick={onVerifyOtp} disabled={otpBusy || otp.length !== 6} style={{ whiteSpace: "nowrap", fontSize: 13 }}>
                            {otpBusy ? "Checking…" : "Verify"}
                          </button>
                        </span>
                      </label>
                    )}
                  </>
                ) : (
                  <p className="ev-success" role="status" style={{ margin: 0 }}>
                    ✓ {verifiedEmail} verified — you can now Apply to join.
                  </p>
                )}
                {otpError && <p className="join-error" role="alert" style={{ marginBottom: 0 }}>{otpError}</p>}
                {otpInfo && !otpVerified && <p className="ev-success" role="status" style={{ marginBottom: 0 }}>{otpInfo}</p>}
              </div>

              <label className="field auth-field join-field" htmlFor="join-altemail">
                <span className="auth-label">Alternate email <span className="opt">(optional)</span></span>
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
            </div>

            <div className="join-group">
              <p className="join-group-title">❧ where to find you</p>
              <div className="join-row">
                <div>
                  <label className="field auth-field join-field" htmlFor="join-phone">
                    <span className="auth-label">Phone no.</span>
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
                </div>
                <div>
                  <label className="field auth-field join-field" htmlFor="join-age">
                    <span className="auth-label">Age</span>
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
              </div>
              <FieldErr message={fieldErrors.phone} />
              <FieldErr message={fieldErrors.age} />

              <label className="field auth-field join-field" htmlFor="join-school">
                <span className="auth-label">School</span>
                <input
                  id="join-school"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="e.g. Delhi Public School"
                  maxLength={120}
                />
              </label>
              <FieldErr message={fieldErrors.school} />
            </div>

            <div className="join-group">
              <p className="join-group-title">❧ lock the gate</p>
              <JoinPasswordField id="join-pass" label="Password" value={password} onChange={setPassword} placeholder="min 8 characters" />
              <FieldErr message={fieldErrors.password} />

              <JoinPasswordField id="join-confirm" label="Confirm password" value={confirm} onChange={setConfirm} placeholder="repeat password" />
              <FieldErr message={fieldErrors.confirm} />
              {!passwordsMatch && (
                <p className="join-error" role="alert">
                  Passwords don&apos;t match yet.
                </p>
              )}
            </div>

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
              <button className="btn btn-clay auth-submit" type="submit" disabled={busy || !otpVerified}>
                {busy ? "Registering… →" : "Register →"}
              </button>
              <a className="btn btn-paper" href="/">
                ← Back to sunlight
              </a>
            </div>
            <GoogleButton next={null} />
            <p className="ev-switch auth-switch auth-switch-center">
              Already a member? <a href="/login">Log in →</a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
