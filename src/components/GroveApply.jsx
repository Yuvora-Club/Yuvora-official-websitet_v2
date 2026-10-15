// GroveApply — dashboard event discovery + application experience.
//
// Play / Build / Gather selector, selectable event cards, shuffle interaction,
// dynamic application form and honest demo submission. No dates, no capacity,
// no availability tracking; Play + Build show an INDICATIVE ₹50–₹100
// contribution, Gather is free, online payment is a future preference only.

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  FREE_LABEL,
  GROVES,
  INDICATIVE_CONTRIBUTION_LABEL,
  TBA_LABEL,
  getGroveEvent,
  listGroveEvents,
} from "../data/groves.js";
import {
  cancelGroveApplication,
  findExistingGroveApplication,
  groveApplicationsSnapshot,
  listMyGroveApplications,
  submitGroveApplication,
  subscribeGroveApplications,
} from "../services/groveApplicationsService.js";
import { FieldError } from "./eventBits.jsx";

const GROVE_COPY = {
  play: { micro: "Pick your playground.", accent: "leafy green · sporty orange" },
  build: { micro: "Build first. Figure it out together.", accent: "deep forest green · blueprint" },
  gather: { micro: "Curiosity is a valid entry ticket.", accent: "warm peach · terracotta · gold" },
};

const BUILD_INTERESTS = [
  "Coding and software",
  "Hardware and robotics",
  "Creative technology",
  "Hands-on workshops",
  "Building with others",
  "Exploring and learning",
];

function defaultAnswers(event) {
  if (!event) return {};
  if (event.kind === "duo") return { badmintonMode: "singles", partner: "" };
  if (event.kind === "team") return { teamStyle: "solo", teamName: "" };
  if (event.kind === "build") return { interests: [] };
  if (event.kind === "founder") return { role: "attend", idea: "" };
  if (event.kind === "bazaar") return { role: "explore", project: "", projectDesc: "" };
  return {};
}

function EventFields({ event, answers, onPatch, fieldErrors }) {
  if (!event) return null;
  if (event.kind === "duo") {
    return (
      <fieldset className="grove-fieldset">
        <legend>Singles or doubles? <span className="grove-req" aria-hidden="true">*</span></legend>
        <div className="grove-radio-row" role="radiogroup" aria-label="Singles or doubles">
          {[
            ["singles", "Singles — just me"],
            ["doubles", "Doubles — me + a partner"],
          ].map(([v, label]) => (
            <label key={v} className={answers.badmintonMode === v ? "grove-opt picked" : "grove-opt"}>
              <input
                type="radio"
                name="badmintonMode"
                value={v}
                checked={answers.badmintonMode === v}
                onChange={() => onPatch({ badmintonMode: v })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <FieldError id="f-badmintonMode" message={fieldErrors.badmintonMode} />
        {answers.badmintonMode === "doubles" && (
          <label className="field grove-field" htmlFor="f-partner">
            Doubles partner <span className="grove-opt-label">(optional)</span>
            <input
              id="f-partner"
              type="text"
              value={answers.partner || ""}
              onChange={(e) => onPatch({ partner: e.target.value })}
              placeholder="Partner name, if you have one"
              maxLength={60}
            />
          </label>
        )}
      </fieldset>
    );
  }
  if (event.kind === "team") {
    return (
      <fieldset className="grove-fieldset">
        <legend>How are you applying? <span className="grove-req" aria-hidden="true">*</span></legend>
        <div className="grove-radio-row" role="radiogroup" aria-label="Team preference">
          {[
            ["solo", "Solo — find me teammates"],
            ["friends", "With friends"],
            ["team", "We have a team"],
          ].map(([v, label]) => (
            <label key={v} className={answers.teamStyle === v ? "grove-opt picked" : "grove-opt"}>
              <input
                type="radio"
                name="teamStyle"
                value={v}
                checked={answers.teamStyle === v}
                onChange={() => onPatch({ teamStyle: v })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <FieldError id="f-teamStyle" message={fieldErrors.teamStyle} />
        <label className="field grove-field" htmlFor="f-teamName">
          Team name <span className="grove-opt-label">(optional — only if you have one)</span>
          <input
            id="f-teamName"
            type="text"
            value={answers.teamName || ""}
            onChange={(e) => onPatch({ teamName: e.target.value })}
            placeholder="e.g. Dusty Strikers"
            maxLength={60}
          />
        </label>
        <p className="grove-hint">Solo applicants are welcome — you never need a full squad to apply.</p>
      </fieldset>
    );
  }
  if (event.kind === "build") {
    return (
      <fieldset className="grove-fieldset">
        <legend>What do you want to build or explore? <span className="grove-req" aria-hidden="true">*</span></legend>
        <div className="grove-check-grid">
          {BUILD_INTERESTS.map((interest) => {
            const on = (answers.interests || []).includes(interest);
            return (
              <label key={interest} className={on ? "grove-opt picked" : "grove-opt"}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    onPatch({
                      interests: on
                        ? (answers.interests || []).filter((i) => i !== interest)
                        : [...(answers.interests || []), interest],
                    })
                  }
                />
                <span>{interest}</span>
              </label>
            );
          })}
        </div>
        <FieldError id="f-interests" message={fieldErrors.interests} />
      </fieldset>
    );
  }
  if (event.kind === "founder") {
    return (
      <fieldset className="grove-fieldset">
        <legend>How do you want to join? <span className="grove-req" aria-hidden="true">*</span></legend>
        <div className="grove-radio-row" role="radiogroup" aria-label="Founder Mela intention">
          {[
            ["attend", "Attend + explore"],
            ["pitch", "Pitch an idea"],
            ["stalls", "Explore stalls"],
            ["volunteer", "Volunteer / help"],
          ].map(([v, label]) => (
            <label key={v} className={answers.role === v ? "grove-opt picked" : "grove-opt"}>
              <input type="radio" name="founderRole" value={v} checked={answers.role === v} onChange={() => onPatch({ role: v })} />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <FieldError id="f-founderRole" message={fieldErrors.role} />
        {answers.role === "pitch" && (
          <label className="field grove-field" htmlFor="f-idea">
            Your idea <span className="grove-opt-label">(optional — a few lines is plenty)</span>
            <input
              id="f-idea"
              type="text"
              value={answers.idea || ""}
              onChange={(e) => onPatch({ idea: e.target.value })}
              placeholder="What would you pitch in 5 minutes?"
              maxLength={200}
            />
          </label>
        )}
        <p className="grove-hint">No startup needed — curiosity counts as a ticket.</p>
      </fieldset>
    );
  }
  if (event.kind === "bazaar") {
    return (
      <fieldset className="grove-fieldset">
        <legend>How do you want to join? <span className="grove-req" aria-hidden="true">*</span></legend>
        <div className="grove-radio-row" role="radiogroup" aria-label="Build Bazaar intention">
          {[
            ["explore", "Explore demos"],
            ["demo", "Demonstrate a project"],
            ["volunteer", "Volunteer / help"],
          ].map(([v, label]) => (
            <label key={v} className={answers.role === v ? "grove-opt picked" : "grove-opt"}>
              <input type="radio" name="bazaarRole" value={v} checked={answers.role === v} onChange={() => onPatch({ role: v })} />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <FieldError id="f-bazaarRole" message={fieldErrors.role} />
        {answers.role === "demo" && (
          <>
            <label className="field grove-field" htmlFor="f-project">
              Project name <span className="grove-opt-label">(optional)</span>
              <input
                id="f-project"
                type="text"
                value={answers.project || ""}
                onChange={(e) => onPatch({ project: e.target.value })}
                placeholder="e.g. Line-following bot"
                maxLength={80}
              />
            </label>
            <label className="field grove-field" htmlFor="f-projectDesc">
              Short description <span className="grove-opt-label">(optional)</span>
              <input
                id="f-projectDesc"
                type="text"
                value={answers.projectDesc || ""}
                onChange={(e) => onPatch({ projectDesc: e.target.value })}
                placeholder="What does it do?"
                maxLength={200}
              />
            </label>
            <p className="grove-hint">Sharing a project never guarantees a display slot — details later.</p>
          </>
        )}
      </fieldset>
    );
  }
  return null;
}

export default function GroveApply({ user }) {
  const [groveId, setGroveId] = useState("play");
  const events = useMemo(() => listGroveEvents(groveId), [groveId]);
  const [eventId, setEventId] = useState(() => listGroveEvents("play")[0]?.id || "");
  const event = getGroveEvent(eventId) && getGroveEvent(eventId).groveId === groveId ? getGroveEvent(eventId) : events[0];

  const [answersByEvent, setAnswersByEvent] = useState({});
  const answers = answersByEvent[event?.id] || defaultAnswers(event);

  const [name, setName] = useState(() => user?.fullName || user?.name || "");
  const [email, setEmail] = useState(() => user?.email || "");
  const [phone, setPhone] = useState(() => user?.phone || "");
  const [note, setNote] = useState("");
  const [payPref, setPayPref] = useState("offline");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(null);

  useSyncExternalStore(subscribeGroveApplications, groveApplicationsSnapshot, groveApplicationsSnapshot);
  const { applications } = useMemo(() => listMyGroveApplications(user?.id), [user?.id, groveApplicationsSnapshot()]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      if (!name && (user.fullName || user.name)) setName(user.fullName || user.name);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function patchAnswers(patch) {
    if (!event) return;
    setAnswersByEvent((m) => ({ ...m, [event.id]: { ...defaultAnswers(event), ...(m[event.id] || {}), ...patch } }));
    setFieldErrors({});
    setFormError("");
    setSuccess(null);
  }

  function selectGrove(id) {
    if (id === groveId) return;
    const next = listGroveEvents(id);
    setGroveId(id);
    setEventId(next[0]?.id || "");
    setFieldErrors({});
    setFormError("");
    setSuccess(null);
  }

  function selectEvent(id) {
    if (id === event?.id) return;
    setEventId(id);
    setFieldErrors({});
    setFormError("");
    setSuccess(null);
  }

  function shuffle() {
    if (events.length <= 1) return;
    let next = event?.id;
    let guard = 0;
    while (next === event?.id && guard++ < 20) {
      next = events[Math.floor(Math.random() * events.length)].id;
    }
    if (next !== event?.id) selectEvent(next);
  }

  function validateShared() {
    const errs = {};
    if (name.trim().length < 2) errs.name = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errs.email = "Enter a valid email address.";
    if (phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").length !== 10) {
      errs.phone = "Enter a 10-digit contact number.";
    }
    return errs;
  }

  function validateEventAnswers(ev, a) {
    const errs = {};
    if (!ev) return errs;
    if (ev.kind === "duo" && !["singles", "doubles"].includes(a.badmintonMode)) {
      errs.badmintonMode = "Choose singles or doubles.";
    }
    if (ev.kind === "team" && !["solo", "friends", "team"].includes(a.teamStyle)) {
      errs.teamStyle = "Tell us how you are applying.";
    }
    if (ev.kind === "build" && (!Array.isArray(a.interests) || a.interests.length === 0)) {
      errs.interests = "Pick at least one build interest.";
    }
    if (ev.kind === "founder" && !["attend", "pitch", "stalls", "volunteer"].includes(a.role)) {
      errs.role = "Tell us how you want to join the Mela.";
    }
    if (ev.kind === "bazaar" && !["explore", "demo", "volunteer"].includes(a.role)) {
      errs.role = "Tell us how you want to join the Bazaar.";
    }
    return errs;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!event || busy) return;
    const errs = { ...validateShared(), ...validateEventAnswers(event, answers) };
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setFormError("A couple of fields need attention before we can submit.");
      return;
    }
    setFormError("");
    setBusy(true);
    await new Promise((r) => setTimeout(r, 450));
    const res = submitGroveApplication({
      groveId: event.groveId,
      eventId: event.id,
      user,
      contact: { name, email, phone },
      answers,
      paymentPreference: event.priced ? payPref : "none",
      note,
    });
    setBusy(false);
    if (!res.ok) {
      setFormError(res.error || "Could not submit the application.");
      setSuccess(null);
      return;
    }
    setSuccess(res.application);
  }

  const existing = user && event ? findExistingGroveApplication(user.id, event.id) : null;
  const copy = GROVE_COPY[groveId] || GROVE_COPY.play;

  return (
    <div className="join-card dash-card-wide grove-apply" data-grove={groveId}>
      <span className="dash-sticker" aria-hidden="true">apply for events 🌱</span>
      <h3>Find your next grove 🌱</h3>
      <p className="join-sub">Pick a sport, ship something cool, or wander into the next big idea.</p>

      <div className="grove-cards" role="group" aria-label="Choose a grove">
        {GROVES.map((g) => (
          <button
            key={g.id}
            type="button"
            className={g.id === groveId ? "grove-card picked" : "grove-card"}
            aria-pressed={g.id === groveId}
            onClick={() => selectGrove(g.id)}
          >
            <span className="grove-glyph" aria-hidden="true">{g.glyph}</span>
            <b>{g.short}</b>
            <small>{g.tagline}</small>
            {g.id === groveId && <span className="grove-check" aria-hidden="true">✓</span>}
            <span className="grove-sr">{g.id === groveId ? " (selected)" : ""}</span>
          </button>
        ))}
      </div>

      <div className="grove-grovebar">
        <p className="grove-micro" aria-live="polite">
          {GROVES.find((g) => g.id === groveId)?.intro} <em>{copy.micro}</em>
        </p>
        <button type="button" className="btn btn-paper grove-shuffle" onClick={shuffle} disabled={events.length <= 1} title={events.length <= 1 ? "Only one option in this grove for now" : "Pick a different event in this grove"}>
          Shuffle the grove ↻
        </button>
      </div>
      {events.length <= 1 && <p className="grove-hint">Only one application option in this grove for now — no shuffle needed.</p>}

      {groveId === "build" && (
        <div className="grove-buildintro">
          <b className="grove-buildline">You ship. You keep. The grove still drinks.</b>
          <p>
            Personal Hack Club rewards stay with the shipper — tees, stickers, grants, glory. Separately, Yuvora event
            merch (sold at matches + summits) flows into one shared watering can for grounds, speakers and sound.
          </p>
          <div className="grove-pills" aria-label="Funding rules">
            {["soil: shared fund", "petals: personal", "water: transparent"].map((p) => (
              <span key={p} className="pill light">{p}</span>
            ))}
          </div>
        </div>
      )}

      <div className={groveId === "play" ? "grove-picks grove-picks-3" : "grove-picks grove-picks-2"} role="group" aria-label="Choose an event">
        {events.map((ev) => {
          const picked = event?.id === ev.id;
          return (
            <button
              key={ev.id}
              type="button"
              className={picked ? "grove-pick picked" : "grove-pick"}
              aria-pressed={picked}
              aria-label={picked ? `${ev.title}, ${ev.subtitle} (selected)` : `Select ${ev.title}, ${ev.subtitle}`}
              onClick={() => selectEvent(ev.id)}
            >
              <span className="grove-pick-glyph" aria-hidden="true">{ev.glyph}</span>
              <span className="grove-pick-text">
                <b>{ev.title}</b>
                <small>{ev.subtitle}</small>
              </span>
              {picked && <span className="grove-check grove-pick-check" aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>

      {event && (
        <div className="grove-panel" key={event.id} aria-live="polite">
          {groveId === "build" ? (
            <div className="grove-themebar">
              <span className="term-dots" aria-hidden="true"><i /><i /><i /></span>
              <code>$ yuvora apply --grove build --ship-it</code>
            </div>
          ) : groveId === "gather" ? (
            <div className="grove-themebar">
              <span className="grove-tbadge">◈ ON STAGE</span>
              <span>Pitches, demos, applause — take the mic.</span>
            </div>
          ) : (
            <div className="grove-themebar">
              <span className="grove-tbadge">☀ GAME ON</span>
              <span>Dusty shoes, loud sidelines — pick your playground.</span>
            </div>
          )}
          <aside className="grove-summary">
            <span className="dash-mini-title">{GROVES.find((g) => g.id === event.groveId)?.short} · your pick</span>
            <article className="sport grove-detail-card" aria-label={`Selected event: ${event.title}`}>
              <div className="sport-banner">
                <span className="ball" style={{ background: event.tint }} aria-hidden="true">{event.glyph}</span>
                <span>{event.title}<br /><span className="micro">{event.subtitle}</span></span>
              </div>
              <div className="sport-body">
                <span className={`tag ${event.kind === "duo" ? "duo" : ""}`}>● {event.category}</span>
                <span className={event.priced ? "tag grove-tag-pay" : "tag grove-tag-free"}>{event.priced ? "≈ ₹50–100 · indicative" : "free"}</span>
                <span className="tag grove-tag-tba">{TBA_LABEL}</span>
                <dl>
                  <div><dt>Format</dt><dd>{event.format}</dd></div>
                  <div><dt>Squad</dt><dd>{event.squad}</dd></div>
                </dl>
                <p className="sport-note">{event.description}{event.whisper ? (<><br /><em>↳ {event.whisper}</em></>) : null}</p>
                <div className="fee-row">
                  <span>{event.priced ? "≈ ₹50–100 · indicative" : "Free to attend"}</span>
                  <span>{TBA_LABEL}</span>
                </div>
              </div>
            </article>
            {event.priced ? (
              <div className="grove-price">
                <b>Entry contribution</b>
                <span>{INDICATIVE_CONTRIBUTION_LABEL}</span>
              </div>
            ) : (
              <div className="grove-price grove-price-free">
                <b>{FREE_LABEL}</b>
                <span>No payment needed for this experience.</span>
              </div>
            )}
            {existing && !success && (
              <p className="grove-applied" role="status">
                You already applied for this event — ref <b>{existing.id}</b>. It is on your grove list below.
              </p>
            )}
          </aside>

          <form className="grove-form" onSubmit={onSubmit} noValidate>
            <h4>{event.formHeading}</h4>
            <p className="join-sub">Applying for <b>{event.title}</b>. Details + final contribution info will be shared when confirmed.</p>

            {success ? (
              <div className="grove-success" role="status">
                <span className="grove-seal" aria-hidden="true">✿</span>
                <b>You&apos;re on the grove list! 🌱</b>
                <p>
                  Your application for <b>{success.eventTitle}</b> has been submitted{success.paymentPreference === "none" ? "." : success.paymentPreference === "online" ? " with online payment saved as a future preference (coming soon — nothing was charged)." : " with offline payment saved as your preference. Instructions will be shared when finalized."}
                  {" "}Reference: <b>{success.id}</b>. Event details and final contribution information will be shared when they are confirmed.
                </p>
                <div className="grove-formrow">
                  <button type="button" className="btn btn-paper" onClick={() => setSuccess(null)}>Apply for another event →</button>
                </div>
              </div>
            ) : (
              <>
                <div className="grove-formrow">
                  <label className="field grove-field" htmlFor="g-name">
                    Full name <span className="grove-req" aria-hidden="true">*</span>
                    <input id="g-name" type="text" value={name} onChange={(e) => { setName(e.target.value); setFieldErrors({}); }} maxLength={60} autoComplete="name" aria-invalid={fieldErrors.name ? "true" : undefined} aria-describedby="g-name-err" />
                    <FieldError id="g-name-err" message={fieldErrors.name} />
                  </label>
                  <label className="field grove-field" htmlFor="g-email">
                    Email address <span className="grove-req" aria-hidden="true">*</span>
                    <input id="g-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors({}); }} autoComplete="email" aria-invalid={fieldErrors.email ? "true" : undefined} aria-describedby="g-email-err" />
                    <FieldError id="g-email-err" message={fieldErrors.email} />
                  </label>
                </div>
                <label className="field grove-field" htmlFor="g-phone">
                  Contact number <span className="grove-req" aria-hidden="true">*</span>
                  <input id="g-phone" type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setFieldErrors({}); }} inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile" aria-invalid={fieldErrors.phone ? "true" : undefined} aria-describedby="g-phone-err" />
                  <FieldError id="g-phone-err" message={fieldErrors.phone} />
                </label>

                <EventFields event={event} answers={answers} onPatch={patchAnswers} fieldErrors={fieldErrors} />

                {event.priced ? (
                  <fieldset className="grove-fieldset">
                    <legend>Payment preference <span className="grove-req" aria-hidden="true">*</span></legend>
                    <label className={payPref === "online" ? "grove-opt picked" : "grove-opt"}>
                      <input type="radio" name="payPref" value="online" checked={payPref === "online"} onChange={() => setPayPref("online")} />
                      <span><b>Online payment — coming soon.</b> Payment setup is not available yet; this only saves your preference. Nothing is charged.</span>
                    </label>
                    <label className={payPref === "offline" ? "grove-opt picked" : "grove-opt"}>
                      <input type="radio" name="payPref" value="offline" checked={payPref === "offline"} onChange={() => setPayPref("offline")} />
                      <span><b>Offline payment.</b> Choose offline as your preference. Payment instructions will be shared when finalized.</span>
                    </label>
                  </fieldset>
                ) : null}

                <label className="field grove-field" htmlFor="g-note">
                  Anything we should know? <span className="grove-opt-label">(optional)</span>
                  <input id="g-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Short note, if any" maxLength={200} />
                </label>

                {formError && <p className="ev-formerror" role="alert">{formError}</p>}
                <p className="ev-demo" role="note"><b>Demo ·</b> Applications are saved in this browser only until the backend arrives. Selecting a payment option never charges anything.</p>
                <div className="grove-formrow">
                  <button className="btn btn-clay" type="submit" disabled={busy || !!existing}>
                    {busy ? "Submitting…" : existing ? "Already applied ✓" : `Apply for ${event.title} →`}
                  </button>
                </div>
                <p className="grove-themefoot" aria-hidden="true">
                  {groveId === "build"
                    ? "// half-broken demos welcome — no portfolio needed."
                    : groveId === "gather"
                      ? "curiosity is a valid entry ticket — applause guaranteed."
                      : "come dewy-eyed, leave dusty-shoed."}
                </p>
              </>
            )}
          </form>
        </div>
      )}

      <div className="grove-mine">
        <h4>Your grove list 🌱</h4>
        {applications.length === 0 ? (
          <p className="join-sub">No grove applications yet — your submitted applications will sprout here.</p>
        ) : (
          <ul className="grove-minelist">
            {applications.map((a) => (
              <li key={a.id}>
                <span><b>{a.eventTitle}</b> · ref {a.id} · {a.status === "cancelled" ? "cancelled" : "submitted"} · {a.paymentPreference === "none" ? "no payment needed" : a.paymentPreference === "online" ? "online preference (coming soon) · pending" : "offline preference · pending"}</span>
                {a.status !== "cancelled" && (
                  <button type="button" className="ev-linkbtn" onClick={() => cancelGroveApplication(a.id, a.userId)}>Cancel</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
