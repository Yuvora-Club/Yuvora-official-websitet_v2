// Seed Pass view — event-specific, confirmation-gated, DEMO-labelled.
// A screenshot of this page is not an entry credential.

import { useAuth } from "../state/useAuth.js";
import { getApplication } from "../services/applicationsService.js";
import { SEED_PASS_DEMO_NOTICE, demoCodeGrid, getDemoPassPreview, passEligibility } from "../services/seedPassService.js";
import { DemoNotice } from "../components/eventBits.jsx";

function DemoCode({ marker }) {
  const { size, cells } = demoCodeGrid(marker);
  const unit = 8;
  return (
    <svg
      className="ev-demoqr"
      width={size * unit}
      height={size * unit}
      viewBox={`0 0 ${size * unit} ${size * unit}`}
      role="img"
      aria-label={`Demo code ${marker}. Not a valid entry credential.`}
    >
      <rect width={size * unit} height={size * unit} fill="#fffef8" />
      {cells.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={(i % size) * unit}
            y={Math.floor(i / size) * unit}
            width={unit}
            height={unit}
            fill="#2f352c"
          />
        ) : null,
      )}
    </svg>
  );
}

export default function SeedPassPage({ applicationId }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <section className="wrap members-page">
        <div className="sec-head reveal in">
          <span className="sec-no">✿ 14 — seed pass</span>
          <h2>Sign in for <em>passes</em></h2>
          <p>Seed Passes live inside confirmed applications.</p>
        </div>
        <div className="members-cta">
          <a className="btn btn-clay" href={`/login?next=${encodeURIComponent(`/pass/${applicationId}`)}`}>Sign in →</a>
        </div>
      </section>
    );
  }

  const { application } = getApplication(applicationId, user.id);
  if (!application) {
    return (
      <section className="wrap members-page">
        <div className="sec-head reveal in">
          <span className="sec-no">✿ 14 — seed pass</span>
          <h2>No pass <em>here</em></h2>
          <p>That reference did not match any of your applications.</p>
        </div>
        <div className="members-cta">
          <a className="btn btn-clay" href="/my-events">Open My Events →</a>
        </div>
      </section>
    );
  }

  const check = passEligibility(application);
  if (!check.eligible) {
    return (
      <section className="wrap members-page">
        <div className="sec-head reveal in">
          <span className="sec-no">✿ 14 — seed pass</span>
          <h2>Pass <em>locked</em></h2>
          <p>{check.reason}</p>
        </div>
        <div className="members-cta">
          <a className="btn btn-clay" href="/my-events">Track in My Events →</a>
        </div>
      </section>
    );
  }

  const preview = getDemoPassPreview(application);
  const pass = preview.pass;

  return (
    <section className="wrap members-page">
      <div className="sec-head reveal in">
        <span className="sec-no">✿ 14 — seed pass</span>
        <h2>
          Your event <em>pass</em>
        </h2>
        <p>
          For <b>{pass.eventTitle}</b> — show this at the gate alongside your ID.{" "}
          <b>A screenshot alone proves nothing; the gate verifies with the backend.</b>
        </p>
      </div>
      <DemoNotice text={SEED_PASS_DEMO_NOTICE} />

      <div className="ev-passwrap-card reveal in">
        <div className="id-card ev-passcard">
          <div className="ev-demotag" aria-hidden="true">DEMO PREVIEW</div>
          <div className="id-top"><span>✿ Yuvora seed pass</span><span>{pass.referenceId}</span></div>
          <div className="id-name">{pass.participantName}</div>
          <div className="ev-pass-event">{pass.eventTitle}</div>
          <div className="ev-pass-when">{pass.timeLabel} · {pass.venue}</div>
          <div className="id-meta">
            <span>confirmed ✓</span>
            <span>1 entry</span>
            <span>ID checked</span>
          </div>
          <div className="ev-qrrow">
            <DemoCode marker={pass.marker} />
            <div className="ev-qrcap">
              <b>{pass.marker}</b>
              <span>Demo marker — the real QR carries a backend-issued opaque token, never personal details.</span>
            </div>
          </div>
          <div className="barcode" aria-hidden="true" />
          <div className="ev-pass-foot">Pass state: active (demo) · used / cancelled / revoked states arrive with the backend</div>
        </div>
        <div className="members-cta">
          <button className="btn btn-paper" type="button" onClick={() => window.print()}>Print / save ↓</button>
          <a className="btn btn-paper" href="/my-events">← My Events</a>
        </div>
      </div>
    </section>
  );
}
