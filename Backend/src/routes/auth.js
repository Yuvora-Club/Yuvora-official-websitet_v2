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

export default router;
