// Sports client — events (admin-made), teams, captain-approved joining.
// Writes need the member ID token (POST /api/auth/login) in the header;
// the meta + event list are public.

import { apiFetch } from "./api.js";
import { getLiveSession } from "./authService.js";

function authHeaders() {
  const session = getLiveSession();
  const token = session && session.idToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function friendlyError(err) {
  const payload = err && err.data;
  if (payload && payload.errors) return { ok: false, errors: payload.errors };
  if (payload && payload.error) return { ok: false, formError: payload.error };
  return { ok: false, formError: "Couldn't reach the sports server. Check your connection and try again." };
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
    const data = await apiFetch("/api/sport-events", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return { ok: true, event: data.event };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function updateSportEvent(id, payload) {
  try {
    const data = await apiFetch(`/api/sport-events/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return { ok: true, event: data.event };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function deleteSportEvent(id) {
  try {
    await apiFetch(`/api/sport-events/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return { ok: true };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function listTeams(eventId, sportId) {
  const q = `?eventId=${encodeURIComponent(eventId)}${sportId ? `&sportId=${encodeURIComponent(sportId)}` : ""}`;
  try {
    const data = await apiFetch(`/api/teams${q}`, { headers: authHeaders() });
    return { ok: true, teams: Array.isArray(data.teams) ? data.teams : [] };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function fetchMyTeams() {
  try {
    const data = await apiFetch("/api/my-teams", { headers: authHeaders() });
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
    const data = await apiFetch("/api/teams", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ eventId, sportId, name }),
    });
    return { ok: true, team: data.team };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function requestToJoin(teamId) {
  try {
    const data = await apiFetch(`/api/teams/${encodeURIComponent(teamId)}/request`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    return { ok: true, captain: data.captain };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function fetchTeamRequests(teamId) {
  try {
    const data = await apiFetch(`/api/teams/${encodeURIComponent(teamId)}/requests`, {
      headers: authHeaders(),
    });
    return { ok: true, requests: Array.isArray(data.requests) ? data.requests : [] };
  } catch (err) {
    return { ok: false, ...friendlyError(err), requests: [] };
  }
}

export async function decideRequest(teamId, uid, action) {
  try {
    const data = await apiFetch(`/api/teams/${encodeURIComponent(teamId)}/requests/${encodeURIComponent(uid)}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ action }),
    });
    return { ok: true, ...data };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function leaveTeam(teamId) {
  try {
    await apiFetch(`/api/teams/${encodeURIComponent(teamId)}/leave`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return { ok: true };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function deleteTeam(teamId) {
  try {
    await apiFetch(`/api/teams/${encodeURIComponent(teamId)}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return { ok: true };
  } catch (err) {
    return friendlyError(err);
  }
}
