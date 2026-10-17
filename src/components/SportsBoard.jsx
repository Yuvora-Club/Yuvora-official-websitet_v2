// Member sports board — event → sport → teams → join (captain approves)
// or create-your-own-team (you become captain). Renders inside the member
// dashboard's Sports tab. Announcements stay untouched on the Grove tab.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTeam,
  decideRequest,
  deleteTeam,
  fetchMyTeams,
  fetchSportsMeta,
  fetchTeamRequests,
  leaveTeam,
  listSportEvents,
  listTeams,
  requestToJoin,
  isEventClosed,
} from "../services/sportsService.js";
import TeamPayment from "./TeamPayment.jsx";

function statusChip(team) {
  if (team.status === "locked") return { text: "■ locked — roster full", cls: "dash-tag admin-tag" };
  if (team.status === "ready") return { text: `● ready ${team.count}/${team.maxPlayers}`, cls: "dash-tag" };
  return { text: `○ forming ${team.count}/${team.minPlayers} min`, cls: "dash-tag" };
}

export function TeamCard({ team, me, myTeamIds, pendingTeamIds, onChanged, setMsg, registrationClosed = false }) {
  const isCaptain = team.captainUid === (me && me.id);
  const isMember = myTeamIds.has(team.id);
  const askedHere = pendingTeamIds.has(team.id);
  const [requests, setRequests] = useState([]);
  const [showReqs, setShowReqs] = useState(false);
  const [busy, setBusy] = useState(false);

  async function loadRequests() {
    const res = await fetchTeamRequests(team.id);
    if (res.ok) setRequests(res.requests);
  }

  useEffect(() => {
    if (isCaptain) loadRequests();
  }, [team.id, team.count]);

  async function run(fn, okText) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      setMsg({ type: "error", text: res.formError || "Something went wrong." });
      return;
    }
    setMsg({ type: "success", text: okText });
    onChanged();
    if (isCaptain) loadRequests();
  }

  const chip = statusChip(team);

  return (
    <div className="notice-card">
      <div className="notice-top">
        <b className="notice-title">{team.name}</b>
        <span className={chip.cls}>{chip.text}</span>
      </div>
      {isCaptain && team.paid && <span className="dash-tag pay-paid-chip">₹ entry fee paid</span>}
      <small className="admin-item-meta">
        {isCaptain ? "★ you are captain" : `captain ${team.captainName}`} · subs allowed {team.subs}
      </small>
      <div className="team-roster">
        {team.members.map((m) => (
          <span key={m.uid} className={m.uid === team.captainUid ? "team-chip captain" : "team-chip"}>
            {m.uid === team.captainUid ? "★ " : ""}{m.name}
          </span>
        ))}
      </div>
      <div className="team-bar" aria-hidden="true">
        <i style={{ width: `${Math.min(100, Math.round((team.count / team.maxPlayers) * 100))}%` }} />
      </div>

      {isCaptain ? (
        <>
          <div className="dash-play-row">
            <button type="button" className="btn btn-paper dash-btn" disabled={busy} onClick={() => { setShowReqs((s) => !s); loadRequests(); }}>
              {showReqs ? "Hide requests" : `Join requests (${requests.length})`}
            </button>
            <button type="button" className="btn btn-paper dash-btn" disabled={busy} onClick={() => { if (window.confirm(`Delete team ${team.name}? Members scatter.`)) run(() => deleteTeam(team.id), "Team deleted."); }}>
              Delete team ✕
            </button>
          </div>
          {showReqs && (
            requests.length === 0 ? (
              <p className="join-sub">No pending requests — share the event, they'll come.</p>
            ) : (
              <ul className="team-reqs">
                {requests.map((r) => (
                  <li key={r.uid}>
                    <span>{r.name}</span>
                    <span className="team-req-btns">
                      <button type="button" className="btn btn-clay dash-btn" disabled={busy || registrationClosed} onClick={() => run(() => decideRequest(team.id, r.uid, "approve"), `${r.name} is in ✓`)}>Let in ✓</button>
                      <button type="button" className="btn btn-paper dash-btn" disabled={busy} onClick={() => run(() => decideRequest(team.id, r.uid, "reject"), "Request declined.")}>No ✕</button>
                    </span>
                  </li>
                ))}
              </ul>
            )
          )}
          <TeamPayment teamId={team.id} paid={team.paid} onChanged={onChanged} setMsg={setMsg} />
        </>
      ) : isMember ? (
        <div className="dash-play-row">
          <button type="button" className="btn btn-paper dash-btn" disabled={busy} onClick={() => run(() => leaveTeam(team.id), "You left the team.")}>
            Leave team ←
          </button>
        </div>
      ) : askedHere ? (
        <p className="join-sub">Request sent — waiting on captain {team.captainName}…</p>
      ) : registrationClosed ? (
        <p className="join-sub">■ Registrations are closed for this event — view only.</p>
      ) : team.locked ? (
        <p className="join-sub">Locked — roster hit {team.maxPlayers}. Try another team or event.</p>
      ) : (
        <div className="dash-play-row">
          <button type="button" className="btn btn-clay dash-btn" disabled={busy} onClick={() => run(() => requestToJoin(team.id), `Ask sent to captain ${team.captainName} ✓`)}>
            Ask to join →
          </button>
        </div>
      )}
    </div>
  );
}

export default function SportsBoard({ user }) {
  const [meta, setMeta] = useState({ sports: [], categories: [] });
  const [events, setEvents] = useState([]);
  const [mine, setMine] = useState({ teams: [], pending: [] });
  const [view, setView] = useState({ name: "events", eventId: null, sportId: null });
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    const [m, e, my] = await Promise.all([fetchSportsMeta(), listSportEvents(), fetchMyTeams()]);
    if (m.ok) setMeta({ sports: m.sports, categories: m.categories });
    setEvents(e.events);
    if (my.ok) setMine({ teams: my.teams, pending: my.pending });
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const refreshTeams = useCallback(async (eventId, sportId) => {
    setTeamsLoading(true);
    const [t, my] = await Promise.all([listTeams(eventId, sportId), fetchMyTeams()]);
    if (t.ok) setTeams(t.teams);
    if (my.ok) setMine({ teams: my.teams, pending: my.pending });
    setTeamsLoading(false);
  }, []);

  function openEvent(eventId) {
    setView({ name: "event", eventId, sportId: null });
    setMsg({ type: "", text: "" });
  }

  function openSport(eventId, sportId) {
    setView({ name: "teams", eventId, sportId });
    setMsg({ type: "", text: "" });
    refreshTeams(eventId, sportId);
  }

  const event = useMemo(() => events.find((e) => e.id === view.eventId) || null, [events, view.eventId]);
  const sportMeta = useMemo(() => meta.sports.find((s) => s.id === view.sportId) || null, [meta.sports, view.sportId]);
  const myTeamIds = useMemo(() => new Set(mine.teams.map((t) => t.id)), [mine.teams]);
  const pendingTeamIds = useMemo(() => new Set(mine.pending.map((p) => p.teamId)), [mine.pending]);
  const myRosterHere = useMemo(
    () => mine.teams.find((t) => t.eventId === view.eventId && t.sportId === view.sportId) || null,
    [mine.teams, view.eventId, view.sportId]
  );
  const myPendingHere = useMemo(
    () => mine.pending.find((p) => p.eventId === view.eventId && p.sportId === view.sportId) || null,
    [mine.pending, view.eventId, view.sportId]
  );

  async function onCreateTeam(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setBusy(true);
    const res = await createTeam({ eventId: view.eventId, sportId: view.sportId, name: teamName });
    setBusy(false);
    if (!res.ok) {
      setMsg({ type: "error", text: res.errors?.name || res.formError || "Could not create the team." });
      return;
    }
    setTeamName("");
    setMsg({ type: "success", text: `Team ${res.team.name} formed — you are captain ★` });
    refreshTeams(view.eventId, view.sportId);
  }

  if (loading) return <p className="join-sub">Rolling out the fields…</p>;

  return (
    <div className="admin-tab">
      {msg.text && (
        <p className={msg.type === "success" ? "ev-success" : "ev-formerror"} role={msg.type === "success" ? "status" : "alert"}>
          {msg.text}
        </p>
      )}

      {view.name === "events" && (
        <article className="notice-board">
          <div className="notice-head">
            <div>
              <span className="dash-sticker" aria-hidden="true">⚽ sports arena</span>
              <h3>Official events</h3>
              <p className="join-sub">Pick an event, pick a sport, join a team — or raise your own.</p>
            </div>
            <span className="notice-count">{events.filter((e) => !isEventClosed(e)).length}</span>
          </div>
          {events.length === 0 ? (
            <div className="notice-empty">
              <span className="notice-empty-leaf" aria-hidden="true">⚽</span>
              <b>No events yet.</b>
              <p>The crew hasn't launched one — check the notice board for the call.</p>
            </div>
          ) : (
            <div className="event-list">
              {events.map((ev) => {
                const myCount = mine.teams.filter((t) => t.eventId === ev.id).length;
                const evClosed = isEventClosed(ev);
                return (
                  <article key={ev.id} className={evClosed ? "event-card closed" : "event-card"}>
                    <div className="event-top">
                      <span className="event-cat">{ev.category}</span>
                      <span className={evClosed ? "event-status closed" : "event-status open"}>
                        {evClosed ? "■ closed" : "● open"}
                      </span>
                    </div>
                    <h4 className="event-title">{ev.title}</h4>
                    {ev.description && <p className="event-desc">{ev.description}</p>}
                    <div className="event-meta">
                      {ev.eventDate && <span>📅 {ev.eventDate}</span>}
                      {ev.venue && <span>📍 {ev.venue}</span>}
                      {ev.regDeadline && <span>⏳ reg. closes {ev.regDeadline.replace("T", " · ")}</span>}
                      {myCount > 0 && <span className="event-mine">★ in {myCount} team{myCount > 1 ? "s" : ""}</span>}
                    </div>
                    <div className="event-sports">
                      {(ev.sports || []).map((s) => (
                        <span key={s} className="event-sport">{(meta.sports.find((x) => x.id === s) || {}).name || s}</span>
                      ))}
                    </div>
                    <button type="button" className="btn btn-clay dash-btn event-cta" onClick={() => openEvent(ev.id)}>
                      Open event →
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </article>
      )}

      {view.name === "event" && event && (
        <article className="notice-board">
          <div className="dash-play-row" style={{ marginTop: 0 }}>
            <button type="button" className="btn btn-paper dash-btn" onClick={() => setView({ name: "events", eventId: null, sportId: null })}>
              ← All events
            </button>
          </div>
          <div className="notice-head">
            <div>
              <span className="dash-sticker" aria-hidden="true">{event.category}</span>
              <h3>{event.title}</h3>
              <p className="join-sub">
                {event.description || "Pick your sport below."}
                {event.venue ? ` · 📍 ${event.venue}` : ""}{event.eventDate ? ` · ${event.eventDate}` : ""}
              </p>
            </div>
          </div>
          <div className="sport-pick-grid">
            {(event.sports || []).map((sid) => {
              const s = meta.sports.find((x) => x.id === sid) || { id: sid, name: sid, min: 0, max: 0, format: "" };
              const inTeam = mine.teams.some((t) => t.eventId === event.id && t.sportId === sid);
              const pend = mine.pending.some((p) => p.eventId === event.id && p.sportId === sid);
              return (
                <button key={sid} type="button" className="sport-pick" onClick={() => openSport(event.id, sid)}>
                  <b>{s.name}</b>
                  <small>{s.format}</small>
                  <small>squad {s.min}–{s.max}</small>
                  {inTeam && <span className="dash-tag">★ your team</span>}
                  {!inTeam && pend && <span className="dash-tag">…requested</span>}
                </button>
              );
            })}
          </div>
          {isEventClosed(event) && (
            <p className="join-sub">■ This event is closed — rosters are frozen, view only.</p>
          )}
        </article>
      )}

      {view.name === "teams" && event && sportMeta && (
        <article className="notice-board">
          <div className="dash-play-row" style={{ marginTop: 0 }}>
            <button type="button" className="btn btn-paper dash-btn" onClick={() => openEvent(event.id)}>
              ← {event.title}
            </button>
          </div>
          <div className="notice-head">
            <div>
              <span className="dash-sticker" aria-hidden="true">{sportMeta.format}</span>
              <h3>{sportMeta.name} teams</h3>
              <p className="join-sub">Squad {sportMeta.min}–{sportMeta.max}{sportMeta.subs ? ` · ${sportMeta.subs} subs` : ""} · full house locks the team.</p>
            </div>
            <span className="notice-count">{teams.length}</span>
          </div>

          {!isEventClosed(event) && !myRosterHere && !myPendingHere && (
            <form className="team-create" onSubmit={onCreateTeam}>
              <b>Raise your own team ★</b>
              <p className="join-sub">You become captain — every join needs your yes.</p>
              <div className="team-create-row">
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Dust Devils" maxLength={60} aria-label="Team name" />
                <button type="submit" className="btn btn-clay dash-btn" disabled={busy}>
                  {busy ? "Forming…" : "Form team →"}
                </button>
              </div>
            </form>
          )}
          {myRosterHere && (
            <p className="join-sub">★ You play for <b>{myRosterHere.name}</b> here — one roster per sport.</p>
          )}
          {myPendingHere && !myRosterHere && (
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
                <TeamCard key={t.id} team={t} me={user} myTeamIds={myTeamIds} pendingTeamIds={pendingTeamIds} registrationClosed={isEventClosed(event)} setMsg={setMsg} onChanged={() => refreshTeams(event.id, sportMeta.id)} />
              ))}
            </div>
          )}
        </article>
      )}
    </div>
  );
}
