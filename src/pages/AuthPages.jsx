// Sign-in (LIVE backend) + demo registration UI in the Yuvora theme.
// UI-only refresh: layout + styling changed. All input/label IDs,
// aria wiring, and authService calls (loginLive / register /
// requestPasswordReset) are intentionally untouched.

import { useEffect, useRef, useState } from "react";
import { AUTH_MODE_NOTICE, isAdminUser, loginLive, loginWithGoogle, register, requestPasswordReset } from "../services/authService.js";
import { googleClientId, isGoogleConfigured, renderGoogleButton } from "../services/googleAuthService.js";
import { navigate } from "../services/router.js";
import { DemoNotice, FieldError } from "../components/eventBits.jsx";

function PasswordField({ id, label, value, onChange, error, describedBy }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field auth-field" htmlFor={id}>
      <span className="auth-label">{label}</span>
      <span className="ev-passwrap">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={id === "reg-password" || id === "login-password" ? "current-password" : "new-password"}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
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
      <FieldError id={describedBy} message={error} />
    </label>
  );
}

function nextPath(next, user) {
  // Explicit ?next= always wins (e.g. /login?next=%2Fadmin from a gate).
  if (next && next.startsWith("/")) return next;
  // Admins land in the admin greenhouse, members in their dashboard.
  if (isAdminUser(user)) return "/admin";
  return "/dashboard";
}

//
// "Continue with Google" — one shared component for both auth pages.
// Renders Google Identity Services' official button; the credential it
// returns is exchanged by loginWithGoogle() for a real backend session.
// Hidden entirely while VITE_GOOGLE_CLIENT_ID is unset, so dev machines
// without the env var see exactly the page they had before.
// (Also imported by JoinPage — Google emails skip the OTP gate because
// Google already verified them.)
//
export function GoogleButton({ next }) {
  const holderRef = useRef(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [available] = useState(() => isGoogleConfigured());

  useEffect(() => {
    if (!available || !holderRef.current) return undefined;
    let cancelled = false;
    renderGoogleButton(holderRef.current, googleClientId(), async (credential) => {
      if (cancelled) return;
      setError("");
      setBusy(true);
      const res = await loginWithGoogle(credential);
      if (cancelled) return;
      setBusy(false);
      if (!res.ok) {
        setError(res.formError || "Google sign-in failed. Try again.");
        return;
      }
      setDone(true);
      setTimeout(() => navigate(nextPath(next, res.user)), 650);
    }).then((res) => {
      if (!cancelled && res && !res.ok) setError(res.formError || "");
    });
    return () => {
      cancelled = true;
    };
  }, [available, next]);

  if (!available) {
    // Preview mode so the button placement is visible before Google setup.
    // Once VITE_GOOGLE_CLIENT_ID is set, the real GIS button replaces this.
    return (
      <div className="auth-google">
        <div className="auth-alt" role="separator" aria-label="or continue with Google">
          <span className="auth-alt-line" aria-hidden="true" />
          <span className="auth-alt-label">or</span>
          <span className="auth-alt-line" aria-hidden="true" />
        </div>
        <button
          type="button"
          className="btn btn-paper"
          disabled
          title="Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: 0.85, cursor: "not-allowed" }}
        >
          <span aria-hidden="true" style={{ fontWeight: 800 }}>G</span>
          Continue with Google
        </button>
        <p className="ev-formerror" role="note" style={{ fontSize: 12 }}>
          Preview — add VITE_GOOGLE_CLIENT_ID in Frontend/.env to switch it on.
        </p>
      </div>
    );
  }
  return (
    <div className="auth-google">
      <div className="auth-alt" role="separator" aria-label="or continue with Google">
        <span className="auth-alt-line" aria-hidden="true" />
        <span className="auth-alt-label">or</span>
        <span className="auth-alt-line" aria-hidden="true" />
      </div>
      <div ref={holderRef} className="auth-google-btn" />
      {busy && <p className="ev-success" role="status">Finishing Google sign-in…</p>}
      {done && <p className="ev-success" role="status">Signed in with Google — taking you back…</p>}
      {error && <p className="ev-formerror" role="alert">{error}</p>}
    </div>
  );
}

export function LoginPage({ next }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");
    setInfo("");
    setBusy(true);
    // LIVE: checks the real account created via Join (POST /api/auth/login).
    const res = await loginLive({ email, password });
    setBusy(false);
    if (!res.ok) {
      setErrors(res.errors || {});
      setFormError(res.formError || "Email or password is wrong.");
      return;
    }
    setErrors({});
    setDone(true);
    setTimeout(() => navigate(nextPath(next, res.user)), 650);
  }

  async function onForgotPassword() {
    setFormError("");
    setInfo("");
    if (!email.trim()) {
      setErrors({ email: "Type your email first, then tap Forgot password." });
      return;
    }
    setBusy(true);
    const res = await requestPasswordReset(email);
    setBusy(false);
    if (!res.ok) {
      setErrors(res.errors || {});
      setFormError(res.formError || "Couldn't send the reset link. Check the email address.");
      return;
    }
    setErrors({});
    setInfo("Reset link sent. Check your inbox.");
  }

  return (
    <section className="wrap members-page auth-wrap">
      <div className="sec-head reveal in">
        <span className="sec-no">❧ 11 — account</span>
        <h2>
          Welcome <em>back</em>
        </h2>
        <p>
          Log in to see your member pass. Works with the account you created via <b>Join</b>.
        </p>
      </div>
      <div className="auth-grid reveal in">
        <aside className="auth-side" aria-label="Why log in">
          <span className="auth-kicker">✿ seed pass · members only</span>
          <h3>
            Back to
            <br />
            the grove.
          </h3>
          <p className="auth-side-sub">
            Your leagues, builds &amp; moon socials waited — dust off your shoes.
          </p>
          <ul className="auth-points">
            <li>
              <span className="auth-ic" aria-hidden="true">☀</span>
              <div>
                <b>Member dashboard</b>
                <small>passes, notices &amp; grove news</small>
              </div>
            </li>
            <li>
              <span className="auth-ic" aria-hidden="true">⌨</span>
              <div>
                <b>Play · Build · Gather</b>
                <small>one login for all three groves</small>
              </div>
            </li>
            <li>
              <span className="auth-ic" aria-hidden="true">☾</span>
              <div>
                <b>Moon socials</b>
                <small>RSVPs unlock after sign-in</small>
              </div>
            </li>
          </ul>
          <div className="auth-seal-row">
            <span className="auth-seal">✿ YV · SOWN 2026</span>
            <span className="auth-hand">grown, not built —</span>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-card-top">
            <span className="auth-card-kicker">❧ field log · entry no. 11</span>
            <span className="auth-card-dot" aria-hidden="true">● ● ●</span>
          </div>
          <form className="ev-form auth-form" onSubmit={onSubmit} noValidate>
            <h3 className="auth-title">Log in to Yuvora</h3>
            <p className="auth-sub">Use the email + password from your Join application.</p>
            {formError && <p className="ev-formerror" role="alert">{formError}</p>}
            {info && <p className="ev-success" role="status">{info}</p>}
            {done && <p className="ev-success" role="status">Signed in — taking you back…</p>}
            <label className="field auth-field" htmlFor="login-email">
              <span className="auth-label">Email address</span>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={errors.email ? "true" : undefined}
                aria-describedby="login-email-err"
              />
              <FieldError id="login-email-err" message={errors.email} />
            </label>
            <PasswordField id="login-password" label="Password" value={password} onChange={setPassword} error={errors.password} describedBy="login-password-err" />
            <button className="btn btn-clay auth-submit" type="submit" disabled={busy}>
              {busy ? "Logging in…" : "Log in →"}
            </button>
            <GoogleButton next={next} />
            <div className="auth-aux">
              <button type="button" className="ev-linkbtn" onClick={onForgotPassword} disabled={busy}>
                Forgot password?
              </button>
              <span className="auth-aux-sep" aria-hidden="true">·</span>
              <span className="ev-switch auth-switch">
                New here? <a href={`/join${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Join Yuvora →</a>
              </span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export function RegisterPage({ next }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    const res = await register({ name, email, phone, password, confirm });
    setBusy(false);
    if (!res.ok) {
      setErrors(res.errors || {});
      setFormError("Could not create the demo account — check the fields below.");
      return;
    }
    setErrors({});
    setDone(true);
    setTimeout(() => navigate(nextPath(next)), 900);
  }

  return (
    <section className="wrap members-page auth-wrap">
      <div className="sec-head reveal in">
        <span className="sec-no">❧ 11 — account</span>
        <h2>
          Create your <em>account</em>
        </h2>
        <p>
          One account for every league, jam and summit. <b>Demo only — not permanently registered.</b>
        </p>
      </div>
      <div className="auth-grid reveal in">
        <aside className="auth-side auth-side-clay" aria-label="What you get">
          <span className="auth-kicker">✿ seedling · takes 30 seconds</span>
          <h3>
            Sow your
            <br />
            first seed.
          </h3>
          <p className="auth-side-sub">
            One demo account to wander all three groves — no fees, no spam.
          </p>
          <ol className="auth-steps">
            <li><b>1</b><span>Sow — name, email &amp; phone</span></li>
            <li><b>2</b><span>Sprout — pick a strong password</span></li>
            <li><b>3</b><span>Shade — log in &amp; get your pass</span></li>
          </ol>
          <div className="auth-seal-row">
            <span className="auth-seal">✿ PLAY · BUILD · GATHER</span>
            <span className="auth-hand">come dusty-shoed —</span>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-card-top">
            <span className="auth-card-kicker">❧ seed packet · demo sowing</span>
            <span className="auth-card-dot" aria-hidden="true">● ● ●</span>
          </div>
          <div className="auth-demo">
            <DemoNotice text={AUTH_MODE_NOTICE} />
          </div>
          <form className="ev-form auth-form" onSubmit={onSubmit} noValidate>
            <h3 className="auth-title">Create demo account</h3>
            <p className="auth-sub">Lives only in this browser — for the real pass, use Join.</p>
            {formError && <p className="ev-formerror" role="alert">{formError}</p>}
            {done && <p className="ev-success" role="status">Demo account created in this browser — taking you back…</p>}
            <label className="field auth-field" htmlFor="reg-name">
              <span className="auth-label">Full name</span>
              <input id="reg-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarav Sharma" maxLength={60} autoComplete="name" aria-invalid={errors.name ? "true" : undefined} aria-describedby="reg-name-err" />
              <FieldError id="reg-name-err" message={errors.name} />
            </label>
            <div className="auth-row">
              <label className="field auth-field" htmlFor="reg-email">
                <span className="auth-label">Email address</span>
                <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" aria-invalid={errors.email ? "true" : undefined} aria-describedby="reg-email-err" />
                <FieldError id="reg-email-err" message={errors.email} />
              </label>
              <label className="field auth-field" htmlFor="reg-phone">
                <span className="auth-label">Contact number</span>
                <input id="reg-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" autoComplete="tel" inputMode="numeric" aria-invalid={errors.phone ? "true" : undefined} aria-describedby="reg-phone-err" />
                <FieldError id="reg-phone-err" message={errors.phone} />
              </label>
            </div>
            <PasswordField id="reg-password" label="Password (min 8 characters)" value={password} onChange={setPassword} error={errors.password} describedBy="reg-password-err" />
            <PasswordField id="reg-confirm" label="Confirm password" value={confirm} onChange={setConfirm} error={errors.confirm} describedBy="reg-confirm-err" />
            <button className="btn btn-clay auth-submit" type="submit" disabled={busy}>
              {busy ? "Sowing… (demo)" : "Create demo account →"}
            </button>
            <GoogleButton next={next} />
            <p className="ev-switch auth-switch auth-switch-center">
              Already growing here? <a href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Sign in →</a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
