// Announcements client — what the member dashboard renders.
// Public list needs no token; writes go through apiFetchAuth (token
// attached, expired sessions refreshed + retried once).

import { apiFetch, apiFetchAuth } from "./api.js";

export async function listAnnouncements() {
  try {
    const data = await apiFetch("/api/announcements");
    const list = data && Array.isArray(data.announcements) ? data.announcements : [];
    return { announcements: list, live: true };
  } catch {
    return { announcements: [], live: false };
  }
}

function sessionFlag(err) {
  return !!(err && (err.sessionExpired || err.status === 401));
}

export async function createAnnouncement({ title, body, tag }) {
  try {
    const data = await apiFetchAuth("/api/announcements", {
      method: "POST",
      body: JSON.stringify({ title, body, tag }),
    });
    return data.announcement;
  } catch (err) {
    err.sessionExpired = sessionFlag(err);
    throw err;
  }
}

export async function updateAnnouncement(id, { title, body, tag }) {
  try {
    const data = await apiFetchAuth(`/api/announcements/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ title, body, tag }),
    });
    return data.announcement;
  } catch (err) {
    err.sessionExpired = sessionFlag(err);
    throw err;
  }
}

export async function deleteAnnouncement(id) {
  try {
    await apiFetchAuth(`/api/announcements/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return true;
  } catch (err) {
    err.sessionExpired = sessionFlag(err);
    throw err;
  }
}
