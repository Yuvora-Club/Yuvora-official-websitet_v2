// Member events board — summits & co. Individual events: one-tap direct
// registration. Team events: the same team engine as sports (captain
// approval, auto-lock), with the roster window set per event.

import { useCallback, useEffect, useState } from "react";
import { TeamCard } from "./SportsBoard.jsx";
import {
  createTeam,
  fetchMyRegistrations,
  fetchMyTeams,
  listGeneralEvents,
  listTeams,
  registerIndividual,
  unregisterIndividual,
} from "../services/sportsService.js";

function feeLabel(ev) {
  if (ev.fee == null) return "Free entry";
  return `₹${ev.fee} entry`;
}

export default function EventsBoard({ user }) {
  const [events, setEvents] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [myRegs, setMyRegs] = useState([]);
  const [mine, setMine] = useState({ teams: [], pending: [] });
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    const [e, r, m] = await Promise.all([listGeneralEvents(), fetchMyRegistrations(), fetchMyTeams()]);
    setEvents(e.events);
    if (r.ok) setMyRegs(r.eventIds);
    if (m.ok) setMine({ teams: m.teams, pending: m.pending });
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const refreshTeams = useCallback(async (eventId) => {
    setTeamsLoading(true);
    const [t, m] = await Promise.all([listTeams(eventId, "general"), fetchMyTeams()]);
    if (t.ok) setTeams(t.teams);
    if (m.ok) setMine({ teams: m.teams, pending: m.pending });
    setTeamsLoading(false);
  }, []);

  function openEvent(ev) {
    setOpenId(ev.id);
    setMsg({ type: "", text: "" });
    setTeamName("");
    if (ev.kind === "team") refreshTeams(ev.id);
  }

  const event = events.find((e) => e.id === openId) || null;
  const registered = event ? myRegs.includes(event.id) : false;
  const myTeamHere = event ? mine.teams.find((t) => t.eventId === event.id) || null : null;
  const myPendingHere = event ? mine.pending.find((p) => p.eventId === event.id) || null : null;
  const myTeamIds = new Set(mine.teams.map((t) => t.id));
  const pendingTeamIds = new Set(mine.pending.map((p) => p.teamId));

  async function onRegister() {
    setBusy(true);
    const res = await registerIndividual(event.id);
    setBusy(false);
    if (!res.ok) {
      setMsg({ type: "error", text: res.formError || "Could not register." });
      return;
    }
    setMsg({ type: "success", text: "You're in ✓ see you there." });
    refreshAll();
  }

  async function onUnregister() {
    setBusy(true);
    const res = await unregisterIndividual(event.id);
    setBusy(false);
    if (!res.ok) {
      setMsg({ type: "error", text: res.formError || "Could not unregister." });
      return;
    }
    setMsg({ type: "success", text: "Unregistered." });
    refreshAll();
  }

  async function onCreateTeam(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setBusy(true);
    const res = await createTeam({ eventId: event.id, sportId: "general", name: teamName });
    setBusy(false);
    if (!res.ok) {
      setMsg({ type: "error", text: res.errors?.name || res.formError || "Could not create the team." });
      return;
    }
    setTeamName("");
    setMsg({ type: "success", text: `Team ${res.team.name} formed — you are captain ★` });
    refreshTeams(event.id);
  }

  if (loading) return <p className="join-sub">Setting up the stage…</p>;

  return (
    <div className="admin-tab">
      {msg.text && (
        <p className={msg.type === "success" ? "ev-success" : "ev-formerror"} role={msg.type === "success" ? "status" : "alert"}>
          {msg.text}
        </p>
      )}

      {!event && (
        <article className="notice-board">
          <div className="notice-head">
            <div>
              <span className="dash-sticker" aria-hidden="true">◈ gatherings</span>
              <h3>Events</h3>
              <p className="join-sub">Summits, fairs, jams — register solo or raise a team.</p>
            </div>
            <span className="notice-count">{events.filter((e) => e.status === "open").length}</span>
          </div>
          {events.length === 0 ? (
            <div className="notice-empty">
              <span className="notice-empty-leaf" aria-hidden="true">◈</span>
              <b>Nothing on stage yet.</b>
              <p>The crew announces gatherings on the notice board first.</p>
            </div>
          ) : (
            <div className="event-list">
              {events.map((ev) => (
                <article key={ev.id} className={ev.status === "open" ? "event-card" : "event-card closed"}>
                  <div className="event-top">
                    <span className="event-cat">{ev.kind === "team" ? "team event" : "individual"}</span>
                    <span className={ev.status === "open" ? "event-status open" : "event-status closed"}>
                      {ev.status === "open" ? "● open" : "■ closed"}
                    </span>
                  </div>
                  <h4 className="event-title">{ev.title}</h4>
                  {ev.description && <p className="event-desc">{ev.description}</p>}
                  <div className="event-meta">
                    <span>{feeLabel(ev)}</span>
                    {ev.eventDate && <span>📅 {ev.eventDate}</span>}
                    {ev.venue && <span>📍 {ev.venue}</span>}
                    {ev.kind === "individual" && <span>● {ev.regCount || 0} going</span>}
                    {ev.kind === "individual" && myRegs.includes(ev.id) && <span className="event-mine">★ registered</span>}
                  </div>
                  <button type="button" className="btn btn-clay dash-btn event-cta" onClick={() => openEvent(ev)}>
                    Open →
                  </button>
                </article>
              ))}
            </div>
          )}
        </article>
      )}

      {event && (
        <article className="notice-board">
          <div className="dash-play-row" style={{ marginTop: 0 }}>
            <button type="button" className="btn btn-paper dash-btn" onClick={() => { setOpenId(null); setMsg({ type: "", text: "" }); }}>
              ← All events
            </button>
          </div>
          <div className="notice-head">
            <div>
              <span className="dash-sticker" aria-hidden="true">{event.kind === "team" ? "team event" : "individual"}</span>
              <h3>{event.title}</h3>
              <p className="join-sub">
                {event.description || ""}
                {event.venue ? ` · 📍 ${event.venue}` : ""}{event.eventDate ? ` · ${event.eventDate}` : ""} · {feeLabel(event)}
              </p>
            </div>
          </div>

          {event.kind === "individual" ? (
            event.status !== "open" ? (
              <p className="join-sub">■ Registrations closed for this one.</p>
            ) : registered ? (
              <div className="dash-play-row">
                <span className="dash-tag">★ you&apos;re registered</span>
                <button type="button" className="btn btn-paper dash-btn" disabled={busy} onClick={onUnregister}>
                  Unregister ←
                </button>
              </div>
            ) : (
              <div className="dash-play-row">
                <button type="button" className="btn btn-clay dash-btn" disabled={busy} onClick={onRegister}>
                  {busy ? "Registering…" : "Register →"}
                </button>
                <span className="dash-tag">● {(event.regCount || 0)} going</span>
              </div>
            )
          ) : (
            <>
              <p className="join-sub">Squad {event.minPlayers}–{event.maxPlayers} · full house locks the team.</p>
              {event.status === "open" && !myTeamHere && !myPendingHere && (
                <form className="team-create" onSubmit={onCreateTeam}>
                  <b>Raise your own team ★</b>
                  <p className="join-sub">You become captain — every join needs your yes.</p>
                  <div className="team-create-row">
                    <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Pitch Pirates" maxLength={60} aria-label="Team name" />
                    <button type="submit" className="btn btn-clay dash-btn" disabled={busy}>
                      {busy ? "Forming…" : "Form team →"}
                    </button>
                  </div>
                </form>
              )}
              {myTeamHere && (
                <p className="join-sub">★ You play for <b>{myTeamHere.name}</b> here — one roster per event.</p>
              )}
              {myPendingHere && !myTeamHere && (
                <p className="join-sub">…Request pending — a captain is reading it.</p>
              )}
              {teamsLoading ? (
                <p className="join-sub">Listing teams…</p>
              ) : teams.length === 0 ? (
                <div className="notice-empty">
                  <span className="notice-empty-leaf" aria-hidden="true">❧</span>
                  <b>No teams yet — form the first one above.</b>
                </div>
              ) : (
                <div className="team-list">
                  {teams.map((t) => (
                    <TeamCard key={t.id} team={t} me={user} myTeamIds={myTeamIds} pendingTeamIds={pendingTeamIds} setMsg={setMsg} onChanged={() => refreshTeams(event.id)} />
                  ))}
                </div>
              )}
            </>
          )}
        </article>
      )}
    </div>
  );
}
