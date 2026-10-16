// Announcements client — what the member dashboard renders.
// Public list needs no token; writes go through the admin API with the
// live ID token (POST /api/auth/login) in the Authorization header.

import { apiFetch } from "./api.js";
import { getLiveSession } from "./authService.js";

function authHeaders() {
  const session = getLiveSession();
  const token = session && session.idToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listAnnouncements() {
  try {
    const data = await apiFetch("/api/announcements");
    const list = data && Array.isArray(data.announcements) ? data.announcements : [];
    return { announcements: list, live: true };
  } catch {
    return { announcements: [], live: false };
  }
}

export async function createAnnouncement({ title, body, tag }) {
  const data = await apiFetch("/api/announcements", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title, body, tag }),
  });
  return data.announcement;
}

export async function updateAnnouncement(id, { title, body, tag }) {
  const data = await apiFetch(`/api/announcements/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ title, body, tag }),
  });
  return data.announcement;
}

export async function deleteAnnouncement(id) {
  await apiFetch(`/api/announcements/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return true;
}
