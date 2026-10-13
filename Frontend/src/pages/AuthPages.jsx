// Sign-in (LIVE backend) + demo registration UI in the Yuvora theme.

import { useState } from "react";
import { AUTH_MODE_NOTICE, loginLive, register, requestPasswordReset } from "../services/authService.js";
import { navigate } from "../services/router.js";
import { DemoNotice, FieldError } from "../components/eventBits.jsx";

function PasswordField({ id, label, value, onChange, error, describedBy }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field" htmlFor={id}>
      {label}
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

function nextPath(next) {
  return next && next.startsWith("/") ? next : "/dashboard";
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
    setTimeout(() => navigate(nextPath(next)), 650);
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
    <section className="wrap members-page">
      <div className="sec-head reveal in">
        <span className="sec-no">❧ 11 — account</span>
        <h2>
          Welcome <em>back</em>
        </h2>
        <p>
          Log in to see your member pass. Works with the account you created via <b>Join</b>.
        </p>
      </div>
      <form className="ev-form reveal in" onSubmit={onSubmit} noValidate>
        {formError && <p className="ev-formerror" role="alert">{formError}</p>}
        {info && <p className="ev-success" role="status">{info}</p>}
        {done && <p className="ev-success" role="status">Signed in — taking you back…</p>}
        <label className="field" htmlFor="login-email">
          Email address
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
        <button className="btn btn-clay" type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log in →"}
        </button>
        <p className="ev-switch">
          <button type="button" className="ev-linkbtn" onClick={onForgotPassword} disabled={busy}>
            Forgot password?
          </button>
        </p>
        <p className="ev-switch">
          New here? <a href={`/join${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Join Yuvora →</a>
        </p>
      </form>
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
    <section className="wrap members-page">
      <div className="sec-head reveal in">
        <span className="sec-no">❧ 11 — account</span>
        <h2>
          Create your <em>account</em>
        </h2>
        <p>
          One account for every league, jam and summit. <b>Demo only — not permanently registered.</b>
        </p>
      </div>
      <DemoNotice text={AUTH_MODE_NOTICE} />
      <form className="ev-form reveal in" onSubmit={onSubmit} noValidate>
        {formError && <p className="ev-formerror" role="alert">{formError}</p>}
        {done && <p className="ev-success" role="status">Demo account created in this browser — taking you back…</p>}
        <label className="field" htmlFor="reg-name">
          Full name
          <input id="reg-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarav Sharma" maxLength={60} autoComplete="name" aria-invalid={errors.name ? "true" : undefined} aria-describedby="reg-name-err" />
          <FieldError id="reg-name-err" message={errors.name} />
        </label>
        <label className="field" htmlFor="reg-email">
          Email address
          <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" aria-invalid={errors.email ? "true" : undefined} aria-describedby="reg-email-err" />
          <FieldError id="reg-email-err" message={errors.email} />
        </label>
        <label className="field" htmlFor="reg-phone">
          Contact number
          <input id="reg-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" autoComplete="tel" inputMode="numeric" aria-invalid={errors.phone ? "true" : undefined} aria-describedby="reg-phone-err" />
          <FieldError id="reg-phone-err" message={errors.phone} />
        </label>
        <PasswordField id="reg-password" label="Password (min 8 characters)" value={password} onChange={setPassword} error={errors.password} describedBy="reg-password-err" />
        <PasswordField id="reg-confirm" label="Confirm password" value={confirm} onChange={setConfirm} error={errors.confirm} describedBy="reg-confirm-err" />
        <button className="btn btn-clay" type="submit" disabled={busy}>
          {busy ? "Sowing… (demo)" : "Create demo account →"}
        </button>
        <p className="ev-switch">
          Already growing here? <a href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Sign in →</a>
        </p>
      </form>
    </section>
  );
}
