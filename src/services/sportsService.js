// Sports client — events (admin-made), teams, captain-approved joining.
// Writes need the member ID token (POST /api/auth/login) in the header;
// the meta + event list are public.

import { apiFetch, apiFetchAuth } from "./api.js";

function friendlyError(err) {
  const sessionExpired = !!(err && (err.sessionExpired || err.status === 401));
  const payload = err && err.data;
  if (payload && payload.errors) return { ok: false, errors: payload.errors, sessionExpired };
  if (payload && payload.error) {
    return {
      ok: false,
      formError: sessionExpired ? "Session expired. Log in again, then retry." : payload.error,
      sessionExpired,
    };
  }
  return { ok: false, formError: "Couldn't reach the sports server. Check your connection and try again.", sessionExpired: false };
}

export async function fetchSportsMeta() {
  try {
    const data = await apiFetch("/api/sports/meta");
    return {
      ok: true,
      sports: Array.isArray(data.sports) ? data.sports : [],
      categories: Array.isArray(data.categories) ? data.categories : [],
    };
  } catch {
    return { ok: false, sports: [], categories: [] };
  }
}

export async function listSportEvents() {
  try {
    const data = await apiFetch("/api/sport-events");
    return { ok: true, events: Array.isArray(data.events) ? data.events : [] };
  } catch {
    return { ok: false, events: [] };
  }
}

export async function createSportEvent(payload) {
  try {
    const data = await apiFetchAuth("/api/sport-events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ok: true, event: data.event };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function updateSportEvent(id, payload) {
  try {
    const data = await apiFetchAuth(`/api/sport-events/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return { ok: true, event: data.event };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function deleteSportEvent(id) {
  try {
    await apiFetchAuth(`/api/sport-events/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return { ok: true };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function listTeams(eventId, sportId) {
  const q = `?eventId=${encodeURIComponent(eventId)}${sportId ? `&sportId=${encodeURIComponent(sportId)}` : ""}`;
  try {
    const data = await apiFetchAuth(`/api/teams${q}`);
    return { ok: true, teams: Array.isArray(data.teams) ? data.teams : [] };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function fetchMyTeams() {
  try {
    const data = await apiFetchAuth("/api/my-teams");
    return {
      ok: true,
      teams: Array.isArray(data.teams) ? data.teams : [],
      pending: Array.isArray(data.pending) ? data.pending : [],
    };
  } catch (err) {
    return { ok: false, ...friendlyError(err), teams: [], pending: [] };
  }
}

export async function createTeam({ eventId, sportId, name }) {
  try {
    const data = await apiFetchAuth("/api/teams", {
      method: "POST",
      body: JSON.stringify({ eventId, sportId, name }),
    });
    return { ok: true, team: data.team };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function requestToJoin(teamId) {
  try {
    const data = await apiFetchAuth(`/api/teams/${encodeURIComponent(teamId)}/request`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return { ok: true, captain: data.captain };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function fetchTeamRequests(teamId) {
  try {
    const data = await apiFetchAuth(`/api/teams/${encodeURIComponent(teamId)}/requests`);
    return { ok: true, requests: Array.isArray(data.requests) ? data.requests : [] };
  } catch (err) {
    return { ok: false, ...friendlyError(err), requests: [] };
  }
}

export async function decideRequest(teamId, uid, action) {
  try {
    const data = await apiFetchAuth(`/api/teams/${encodeURIComponent(teamId)}/requests/${encodeURIComponent(uid)}`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    return { ok: true, ...data };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function leaveTeam(teamId) {
  try {
    await apiFetchAuth(`/api/teams/${encodeURIComponent(teamId)}/leave`, {
      method: "DELETE",
    });
    return { ok: true };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function deleteTeam(teamId) {
  try {
    await apiFetchAuth(`/api/teams/${encodeURIComponent(teamId)}`, {
      method: "DELETE",
    });
    return { ok: true };
  } catch (err) {
    return friendlyError(err);
  }
}
