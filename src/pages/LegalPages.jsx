// Placeholder legal pages — same Yuvora theme. Real copy later.

export function TermsPage() {
  return (
    <section className="wrap members-page">
      <div className="sec-head reveal in">
        <span className="sec-no">❧ legal</span>
        <h2>
          Terms <em>&amp; Conditions</em>
        </h2>
        <p>Placeholder page — friendly rules coming soon. Nothing binding yet.</p>
      </div>
      <div className="join-card reveal in">
        <h3>Member promise (draft)</h3>
        <ol className="legal-list">
          <li>Be kind on the field, in the greenhouse, and after dark.</li>
          <li>Student-only events · ID checked · wrap by 10pm.</li>
          <li>Your ships are yours — rewards you earn are 100% yours.</li>
        </ol>
        <p className="join-sub">Full legal text will be added before real sign-ups open.</p>
        <div className="join-actions">
          <a className="btn btn-clay" href="/join">← Back to Join Us</a>
          <a className="btn btn-paper" href="/">Home →</a>
        </div>
      </div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <section className="wrap members-page">
      <div className="sec-head reveal in">
        <span className="sec-no">❧ legal</span>
        <h2>
          Privacy <em>Policy</em>
        </h2>
        <p>What we collect, why we collect it, and what we never do with it. Plain words, no fine print.</p>
      </div>
      <div className="join-card reveal in">
        <p className="join-sub" style={{ marginTop: 0 }}>
          Effective from <b>October 2026</b>. Yuvora is a student-run club. If you have any question about
          your data, email us — a human replies.
        </p>

        <h3>1 · What we collect</h3>
        <ol className="legal-list">
          <li><b>Account details (Join form):</b> full name, email address, school, phone number, and age. Alternate email is optional.</li>
          <li><b>Login details:</b> your password is stored and checked by Firebase Authentication (Google's login system) — we never see or store the actual password ourselves.</li>
          <li><b>Google sign-in (if you use it):</b> your name, email address, and profile photo from Google.</li>
          <li><b>Email verification:</b> your email address plus the one-time code we send you. Codes expire in 10 minutes and are deleted after you register.</li>
          <li><b>Club activity:</b> your seed-pass code, event applications, team memberships, and announcements you've read.</li>
          <li><b>Payments (sports entry fees only):</b> the UPI transaction reference (UTR) you submit so we can confirm your payment. We never ask for, see, or store bank passwords, PINs, or card numbers.</li>
          <li><b>On your device only:</b> your login session and site preferences, saved in your own browser. Clearing site data logs you out — nothing else breaks.</li>
        </ol>

        <h3>2 · What we never collect</h3>
        <ol className="legal-list">
          <li>No location tracking. No contacts, photos, or files from your phone.</li>
          <li>No advertising trackers and no analytics profiles. The site has no ad SDKs.</li>
          <li>No bank details, passwords, or OTPs beyond what is listed above.</li>
        </ol>

        <h3>3 · How we use it</h3>
        <ol className="legal-list">
          <li>To create and sign you in to your account.</li>
          <li>To verify your email, issue your seed pass, and manage event and team registrations.</li>
          <li>To confirm entry-fee payments from your UTR.</li>
          <li>To contact you about your membership, events, and safety updates. No spam, no marketing blasts.</li>
        </ol>

        <h3>4 · Who can see it</h3>
        <ol className="legal-list">
          <li><b>Club admins</b> (student crew) can see member profiles to run leagues, verify passes, and confirm payments.</li>
          <li><b>Teammates and event captains</b> can see your name on rosters and entry lists — nothing else.</li>
          <li><b>Service providers:</b> Firebase/Google (account login + database hosting). They process data under their own policies; we share nothing with them beyond running the site.</li>
          <li><b>Hack Club</b> funds STEM events but receives none of your personal data from us. Anything you earn by shipping stays between you and Hack Club.</li>
          <li>We <b>never sell</b> your data, and we share it with no one else unless the law requires it.</li>
        </ol>

        <h3>5 · Members under 18</h3>
        <p className="join-sub">
          Students as young as 10 can join. If you are under 18, please join with a parent or
          guardian's permission, and ask them to contact us if they ever want your account reviewed or removed.
        </p>

        <h3>6 · Storage &amp; security</h3>
        <ol className="legal-list">
          <li>Accounts live in Firebase Authentication; profiles live in Google Firebase databases (hosted outside India).</li>
          <li>Passwords are hashed by Firebase — even the crew cannot read them.</li>
          <li>Everything travels over encrypted (HTTPS) connections. Admin areas need a signed-in admin session.</li>
          <li>No system is perfect: if there is ever a breach that affects you, we will email you directly about it.</li>
        </ol>

        <h3>7 · Your rights</h3>
        <ol className="legal-list">
          <li><b>See it:</b> your dashboard shows your profile, pass, teams, and applications.</li>
          <li><b>Fix it:</b> email us corrections (name, phone, school, email) and we'll update them.</li>
          <li><b>Delete it:</b> email us from your registered address asking to leave. We delete your login, profile, pass, and pending applications. Past event records may stay in anonymized score sheets (name removed).</li>
        </ol>

        <h3>8 · Changes to this policy</h3>
        <p className="join-sub">
          If this policy changes in a way that matters, we'll pin a notice on the dashboard before it
          takes effect. Small clarifications just update the date above.
        </p>

        <h3>9 · Contact</h3>
        <p className="join-sub">
          Yuvora (student crew) · <a href="mailto:yuvoraclub.official@gmail.com" style={{ fontWeight: 700, color: "var(--ink)" }}>yuvoraclub.official@gmail.com</a>
          {" · "}<a href="https://instagram.com/the_yuvora_club" target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: "var(--ink)" }}>@the_yuvora_club</a>
        </p>
        <div className="join-actions">
          <a className="btn btn-clay" href="/join">← Back to Join Us</a>
          <a className="btn btn-paper" href="/">Home →</a>
        </div>
      </div>
    </section>
  );
}
