import { Router } from "express";
import { auth, rtdb, isFirebaseReady } from "../firebase.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cleanPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  return digits.length === 10 ? digits : "";
}

function validate(body) {
  const errors = {};
  const fullName = String(body?.fullName ?? body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const altEmail = String(body?.altEmail ?? "").trim().toLowerCase();
  const phoneRaw = body?.phone ?? "";
  const ageNum = body?.age === "" || body?.age == null ? null : Number(body.age);
  const password = String(body?.password ?? "");
  const confirm = body?.confirm ?? body?.confirmPassword ?? "";
  const accepted = body?.accepted === true || body?.termsAccepted === true;

  if (fullName.length < 2) errors.fullName = "Please enter your full name.";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (altEmail && !EMAIL_RE.test(altEmail)) errors.altEmail = "Alternate email looks invalid.";
  else if (altEmail && altEmail === email) errors.altEmail = "Alternate email must differ from primary email.";

  const phone = cleanPhone(phoneRaw);
  if (!phoneRaw || !phone) errors.phone = "Enter a 10-digit contact number.";

  if (ageNum == null || Number.isNaN(ageNum)) errors.age = "Enter your age.";
  else if (ageNum < 10 || ageNum > 100) errors.age = "Age must be between 10 and 100.";

  if (!password || password.length < 8) errors.password = "Password needs at least 8 characters.";
  if (confirm !== password) errors.confirm = "Passwords do not match.";
  if (!accepted) errors.accepted = "Please accept the Terms & Privacy Policy.";

  return {
    errors,
    clean: { fullName, email, altEmail: altEmail || null, phone, age: ageNum, password, accepted },
  };
}

// POST /api/auth/register — first API endpoint.
// Body: { fullName, email, altEmail?, phone, age, password, confirm, accepted }
// Creates the Firebase Auth user, writes the member profile to Realtime
// Database `users/{uid}`, and returns a custom token so the new account is
// JOINED (signed in) immediately on the Join Us page.
router.post("/register", async (req, res) => {
  const { errors, clean } = validate(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  if (!isFirebaseReady()) {
    return res.status(503).json({
      ok: false,
      error: "Firebase is not configured on the backend yet. Set FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY / FIREBASE_DATABASE_URL in Backend/.env.",
    });
  }

  try {
    let record;
    try {
      record = await auth().createUser({
        displayName: clean.fullName,
        email: clean.email,
        password: clean.password,
        emailVerified: false,
        disabled: false,
      });
    } catch (err) {
      if (err?.code === "auth/email-already-exists") {
        return res.status(409).json({ ok: false, errors: { email: "This email already has a Yuvora account. Try signing in." } });
      }
      if (err?.code === "auth/invalid-email" || err?.code === "auth/invalid-password") {
        return res.status(400).json({ ok: false, errors: { email: "Firebase rejected the email/password. Check the fields and retry." } });
      }
      throw err;
    }

    const profile = {
      fullName: clean.fullName,
      email: clean.email,
      altEmail: clean.altEmail,
      phone: clean.phone,
      age: clean.age,
      termsAcceptedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      provider: "password",
    };
    await rtdb().ref(`users/${record.uid}`).set(profile);

    // Custom token lets the frontend sign the user in immediately => "joined".
    const customToken = await auth().createCustomToken(record.uid, { joinedVia: "join-us" });

    return res.status(201).json({
      ok: true,
      user: { id: record.uid, uid: record.uid, ...profile },
      customToken,
    });
  } catch (err) {
    console.error("POST /api/auth/register failed:", err?.code || err?.message || err);
    return res.status(500).json({ ok: false, error: "Could not create the account. Please try again." });
  }
});

function webApiKey() {
  return String(process.env.FIREBASE_WEB_API_KEY || "").trim();
}

function keyMissing(res) {
  return res.status(503).json({
    ok: false,
    error:
      "Password login is not configured on the backend yet. Add FIREBASE_WEB_API_KEY (Firebase Console > Project settings > General > Web API Key) to Backend/.env and to the Render dashboard, then restart/redeploy.",
  });
}

// POST /api/auth/login — sign in with an account created via /register.
// Body: { email, password } -> { user, idToken } | 400/401/429
// Verifies the password via the Firebase Auth REST API (Admin SDK cannot
// check passwords), then returns the RTDB profile + ID token.
router.post("/login", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const errors = {};
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  if (!isFirebaseReady()) {
    return res.status(503).json({
      ok: false,
      error: "Firebase is not configured on the backend yet. Set FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY / FIREBASE_DATABASE_URL in Backend/.env.",
    });
  }
  const key = webApiKey();
  if (!key) return keyMissing(res);

  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      const msg = String(data?.error?.message || "");
      if (
        msg.includes("INVALID_LOGIN_CREDENTIALS") ||
        msg.includes("INVALID_PASSWORD") ||
        msg.includes("EMAIL_NOT_FOUND")
      ) {
        return res.status(401).json({ ok: false, errors: { email: "Email or password is wrong." } });
      }
      if (msg.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
        return res.status(429).json({ ok: false, error: "Too many attempts. Try again in a few minutes." });
      }
      if (msg.includes("USER_DISABLED")) {
        return res.status(403).json({ ok: false, error: "This account has been disabled. Contact the crew." });
      }
      return res.status(400).json({ ok: false, error: "Couldn't log you in. Try again." });
    }

    const uid = data.localId;
    let profile = null;
    try {
      const snap = await rtdb().ref(`users/${uid}`).get();
      profile = snap.val() || null;
    } catch {
      /* profile optional — auth already succeeded */
    }
    return res.json({
      ok: true,
      user: { id: uid, uid, ...(profile || {}), email: (profile && profile.email) || data.email || email },
      idToken: data.idToken,
    });
  } catch (err) {
    console.error("POST /api/auth/login failed:", err?.code || err?.message || err);
    return res.status(500).json({ ok: false, error: "Couldn't log you in. Try again." });
  }
});

// POST /api/auth/reset — send a Firebase password-reset email.
// Body: { email } -> { ok: true } (always ok to avoid leaking which emails exist).
router.post("/reset", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, errors: { email: "Enter a valid email address." } });
  }
  const key = webApiKey();
  if (!key) return keyMissing(res);
  try {
    await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
      }
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/reset failed:", err?.code || err?.message || err);
    return res.status(500).json({ ok: false, error: "Couldn't send the reset link. Try again." });
  }
});

export default router;
