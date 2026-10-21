// Admin page — announcements board editor, dynamic add-user, admin profile.
// Route: /admin (wired in App.jsx). Only renders fully for admin accounts
// (role === "admin"); everyone else sees a gate. Posting here writes to
// /api/announcements, which the member dashboard (/dashboard) renders live.

import { useEffect, useState } from "react";
import { getLiveSession, logout, patchLiveSessionUser } from "../services/authService.js";
import { navigate } from "../services/router.js";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "../services/announcementsService.js";
import { createAdminUser, fetchAdminMe, fetchAdminUsers, updateAdminProfile } from "../services/adminService.js";
import { createPlan, deletePlan, fetchPlans, updatePlan } from "../services/plansService.js";
import { createGeneralEvent, createSportEvent, deleteGeneralEvent, deleteSportEvent, fetchEventRegistrations, fetchSportsMeta, fetchTeamRequests, listGeneralEvents, listSportEvents, listTeams, setTeamPaid, updateGeneralEvent, updateSportEvent } from "../services/sportsService.js";
import { calcAge, displayAge } from "../utils/age.js";
import VerifyPassTab from "./VerifyPassTab.jsx";

const TABS = [
  { id: "announcements", label: "Announcements", icon: "📢" },
  { id: "verify", label: "Verify Pass", icon: "🎟" },
  { id: "roster", label: "Club Roster", icon: "❧" },
  { id: "plans", label: "Future Plans", icon: "✦" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "events", label: "Events", icon: "◈" },
  { id: "results", label: "Results", icon: "🏆" },
  { id: "add-user", label: "Add User", icon: "＋" },
  { id: "profile", label: "Profile", icon: "❧" },
];

const TAG_PRESETS = ["Play", "Build", "Gather", "Summit", "Music", "Urgent"];

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function AnnouncementsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editBody, setEditBody] = useState("");

  async function refresh() {
    setLoading(true);
    const { announcements } = await listAnnouncements();
    setItems(announcements);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onPost(e) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    if (!getLiveSession()?.idToken) {
      setFormError("Admin session missing. Log out and log in again as an admin, then retry.");
      return;
    }
    setBusy(true);
    try {
      const created = await createAnnouncement({ title, body, tag });
      setItems((prev) => [created, ...prev]);
      setTitle("");
      setTag("");
      setBody("");
    } catch (err) {
      const payload = err && err.data;
      if (payload?.errors) {
        setFieldErrors(payload.errors);
        setFormError("Please fix the highlighted fields.");
      } else {
        setFormError(payload?.error || "Could not post the announcement.");
      }
    } finally {
      setBusy(false);
    }
  }

  function startEdit(a) {
    setEditingId(a.id);
    setEditTitle(a.title || "");
    setEditTag(a.tag || "");
    setEditBody(a.body || "");
    setFormError("");
  }

  async function onSaveEdit(id) {
    setBusy(true);
    try {
      const updated = await updateAnnouncement(id, { title: editTitle, body: editBody, tag: editTag });
      setItems((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setEditingId(null);
    } catch (err) {
      const payload = err && err.data;
      setFormError(payload?.error || "Could not save the changes.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this announcement for all members?")) return;
    setBusy(true);
    try {
      await deleteAnnouncement(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      const payload = err && err.data;
      setFormError(payload?.error || "Could not delete the announcement.");
    } finally {
      setBusy(false);
    }
  }

  const previewReady = title.trim().length >= 3 && body.trim().length >= 3;

  return (
    <div className="admin-tab">
      <div className="join-card admin-card">
        <h3>Announcement maker ✿</h3>
        <p className="join-sub">Compose on the left, watch exactly what members will see on the right — then pin it to the board.</p>
        {formError && (
          <p className="ev-formerror" role="alert">
            {formError}
          </p>
        )}
        <div className="maker-grid">
          <form onSubmit={onPost} noValidate className="maker-form">
            <label className="field auth-field" htmlFor="admin-ann-title">
              <span className="auth-label">Title · {title.length}/120</span>
              <input
                id="admin-ann-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Box cricket finals under lights"
                maxLength={120}
              />
              {fieldErrors.title && <span className="ev-error">{fieldErrors.title}</span>}
            </label>
            <div className="field auth-field">
              <span className="auth-label" id="admin-ann-tag-label">Tag · pick one</span>
              <div className="maker-tags" role="group" aria-labelledby="admin-ann-tag-label">
                {TAG_PRESETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={tag === t ? "dash-tag maker-tag active" : "dash-tag maker-tag"}
                    onClick={() => setTag((prev) => (prev === t ? "" : t))}
                    aria-pressed={tag === t}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <label className="field auth-field" htmlFor="admin-ann-body">
              <span className="auth-label">Message · {body.length}/2000</span>
              <textarea
                id="admin-ann-body"
                className="admin-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What should every member know? Date, venue, what to bring…"
                rows={5}
                maxLength={2000}
              />
              {fieldErrors.body && <span className="ev-error">{fieldErrors.body}</span>}
            </label>
            <div className="dash-play-row">
              <button className="btn btn-clay dash-btn" type="submit" disabled={busy || !previewReady}>
                {busy ? "Pinning…" : "Pin to board →"}
              </button>
              <button
                type="button"
                className="btn btn-paper dash-btn"
                disabled={busy || (!title && !body && !tag)}
                onClick={() => {
                  setTitle("");
                  setBody("");
                  setTag("");
                  setFieldErrors({});
                  setFormError("");
                }}
              >
                Clear ↻
              </button>
            </div>
          </form>
          <div className="maker-preview" aria-label="Live preview">
            <span className="dash-mini-title">live preview · member view</span>
            <div className="notice-card maker-preview-card">
              <div className="notice-top">
                <time className="notice-date">
                  {new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </time>
                {tag && <span className="dash-tag">{tag}</span>}
              </div>
              <b className="notice-title">{title.trim() || "Your title appears here"}</b>
              <p className="notice-body">{body.trim() || "Your message appears here, exactly as members will read it — one card, stacked newest-first on their board."}</p>
            </div>
            {!previewReady && (
              <p className="join-sub">Keep typing — the pin button unlocks once title + message are set.</p>
            )}
          </div>
        </div>
      </div>

      <div className="join-card admin-card">
        <h3>Pinned board ({items.length})</h3>
        <p className="join-sub">Newest first — exactly the member order. Edit or unpin any notice.</p>
        {loading ? (
          <p className="join-sub">Loading announcements…</p>
        ) : items.length === 0 ? (
          <div className="notice-empty">
            <span className="notice-empty-leaf" aria-hidden="true">❧</span>
            <b>Board is empty — pin the first notice above.</b>
            <p>Nothing shows on the member dashboard until you do.</p>
          </div>
        ) : (
          <div className="pinned-list">
            {items.map((a, i) => (
              <article key={a.id} className="pinned-card">
                <span className="pinned-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <div className="pinned-main">
                  {editingId === a.id ? (
                    <div className="admin-edit">
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={120} aria-label="Edit title" />
                      <div className="maker-tags" role="group" aria-label="Edit tag">
                        {TAG_PRESETS.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={editTag === t ? "dash-tag maker-tag active" : "dash-tag maker-tag"}
                            onClick={() => setEditTag((prev) => (prev === t ? "" : t))}
                            aria-pressed={editTag === t}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} maxLength={2000} aria-label="Edit message" />
                      <div className="dash-play-row">
                        <button type="button" className="btn btn-clay dash-btn" onClick={() => onSaveEdit(a.id)} disabled={busy}>
                          Save ✓
                        </button>
                        <button type="button" className="btn btn-paper dash-btn" onClick={() => setEditingId(null)} disabled={busy}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="pinned-top">
                        {a.tag && <span className="event-sport">{a.tag}</span>}
                        <time className="pinned-date" dateTime={a.createdAt}>
                          {formatDate(a.createdAt)}
                        </time>
                      </div>
                      <h4 className="pinned-title">{a.title}</h4>
                      <p className="pinned-body">{a.body}</p>
                      {a.updatedAt && a.updatedAt !== a.createdAt && (
                        <small className="admin-item-meta">edited {formatDate(a.updatedAt)}</small>
                      )}
                      <div className="dash-play-row">
                        <button type="button" className="btn btn-paper dash-btn" onClick={() => startEdit(a)}>
                          Edit ✎
                        </button>
                        <button type="button" className="btn btn-paper dash-btn" onClick={() => onDelete(a.id)} disabled={busy}>
                          Unpin ✕
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AddUserTab() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [sessionGone, setSessionGone] = useState(false);
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  async function refreshUsers() {
    setLoadingUsers(true);
    const res = await fetchAdminUsers();
    if (res.ok) setUsers(res.users);
    setLoadingUsers(false);
  }

  useEffect(() => {
    refreshUsers();
  }, []);

  const liveAge = calcAge(birthDate);

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setSessionGone(false);
    setSuccess("");
    setBusy(true);
    const res = await createAdminUser({
      fullName,
      email,
      school,
      phone,
      birthDate: birthDate || undefined,
      password,
      role,
    });
    setBusy(false);
    if (!res.ok) {
      setErrors(res.errors || {});
      setFormError(res.formError || "Could not create the user — check the fields.");
      setSessionGone(!!res.sessionExpired);
      return;
    }
    setSuccess(
      res.user.role === "admin"
        ? `${res.user.fullName} is now an admin. They can log in and open /admin.`
        : `${res.user.fullName} is now a member. They can log in, but cannot open /admin.`
    );
    setFullName("");
    setEmail("");
    setSchool("");
    setPhone("");
    setBirthDate("");
    setPassword("");
    setRole("admin");
    refreshUsers();
  }

  return (
    <div className="admin-tab">
      <div className="join-card admin-card">
        <h3>Add user ＋</h3>
        <p className="join-sub">
          Role is assigned <b>at creation</b> — pick <b>★ admin</b> to grant /admin access, or <b>member</b> for a
          normal account that <b>cannot</b> open /admin. Age is computed from the birth date and increments every birthday.
        </p>
        {formError && (
          <p className="ev-formerror" role="alert">
            {formError}{" "}
            {sessionGone && (
              <a href="/login?next=%2Fadmin">Log in again →</a>
            )}
          </p>
        )}
        {success && (
          <p className="ev-success" role="status">
            {success}
          </p>
        )}
        <form onSubmit={onSubmit} noValidate>
          <label className="field auth-field" htmlFor="admin-new-name">
            <span className="auth-label">Full name</span>
            <input id="admin-new-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Aarav Sharma" maxLength={60} autoComplete="off" />
            {errors.fullName && <span className="ev-error">{errors.fullName}</span>}
          </label>
          <div className="auth-row">
            <label className="field auth-field" htmlFor="admin-new-email">
              <span className="auth-label">Email</span>
              <input id="admin-new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" autoComplete="off" />
              {errors.email && <span className="ev-error">{errors.email}</span>}
            </label>
            <label className="field auth-field" htmlFor="admin-new-phone">
              <span className="auth-label">Phone</span>
              <input id="admin-new-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" inputMode="numeric" autoComplete="off" />
              {errors.phone && <span className="ev-error">{errors.phone}</span>}
            </label>
          </div>
          <label className="field auth-field" htmlFor="admin-new-school">
            <span className="auth-label">School</span>
            <input id="admin-new-school" type="text" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Delhi Public School" maxLength={120} autoComplete="off" />
            {errors.school && <span className="ev-error">{errors.school}</span>}
          </label>
          <div className="auth-row">
            <label className="field auth-field" htmlFor="admin-new-dob">
              <span className="auth-label">Birth date {liveAge != null ? `· age ${liveAge}` : ""}</span>
              <input id="admin-new-dob" type="date" value={birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setBirthDate(e.target.value)} />
              {errors.birthDate && <span className="ev-error">{errors.birthDate}</span>}
              {errors.age && <span className="ev-error">{errors.age}</span>}
            </label>
            <label className="field auth-field" htmlFor="admin-new-pass">
              <span className="auth-label">Password (min 8)</span>
              <input id="admin-new-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set their password" autoComplete="new-password" />
              {errors.password && <span className="ev-error">{errors.password}</span>}
            </label>
          </div>
          <div className="field auth-field">
            <span className="auth-label" id="admin-new-role-label">Role assigned at creation</span>
            <div className="maker-tags" role="group" aria-labelledby="admin-new-role-label">
              <button
                type="button"
                className={role === "admin" ? "dash-tag maker-tag active" : "dash-tag maker-tag"}
                onClick={() => setRole("admin")}
                aria-pressed={role === "admin"}
              >
                ★ admin · can open /admin
              </button>
              <button
                type="button"
                className={role === "member" ? "dash-tag maker-tag active" : "dash-tag maker-tag"}
                onClick={() => setRole("member")}
                aria-pressed={role === "member"}
              >
                member · cannot open /admin
              </button>
            </div>
            {errors.role && <span className="ev-error">{errors.role}</span>}
          </div>
          <div className="dash-play-row">
            <button className="btn btn-clay dash-btn" type="submit" disabled={busy}>
              {busy ? "Creating…" : role === "admin" ? "Create admin →" : "Create member →"}
            </button>
          </div>
        </form>
      </div>

      <div className="join-card admin-card">
        <h3>Admins & members ({users.length})</h3>
        <p className="join-sub">Updates live — only ★ admin roles can open /admin. Members are blocked at the gate.</p>
        {loadingUsers ? (
          <p className="join-sub">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="join-sub">No users found yet.</p>
        ) : (
          <ul className="admin-list">
            {users.map((u) => (
              <li key={u.id} className="admin-item admin-user">
                <div className="admin-item-top">
                  <b>{u.fullName || "—"}</b>
                  <span className={u.role === "admin" ? "dash-tag admin-tag" : "dash-tag"}>{u.role === "admin" ? "★ admin" : "member"}</span>
                </div>
                <small className="admin-item-meta">
                  {u.email || "—"} · {u.school || "no school"} · {u.phone || "no phone"} · {u.birthDate ? `born ${u.birthDate} · age ${displayAge(u) ?? "—"}` : `age ${u.age ?? "—"}`}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SportsTab() {
  const [meta, setMeta] = useState({ sports: [], categories: [] });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [sports, setSports] = useState([]);
  const [status, setStatus] = useState("open");
  const [regDeadline, setRegDeadline] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [maxTeams, setMaxTeams] = useState("");
  const [sportFees, setSportFees] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);
  const [inspectEvent, setInspectEvent] = useState(null);

  async function refresh() {
    setLoading(true);
    const [m, e] = await Promise.all([fetchSportsMeta(), listSportEvents()]);
    if (m.ok) setMeta({ sports: m.sports, categories: m.categories });
    setEvents(e.events);
    if (!category && m.categories.length > 0) setCategory(m.categories[0]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function toggleSport(id) {
    setSports((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function startEdit(ev) {
    setEditingId(ev.id);
    setTitle(ev.title || "");
    setCategory(ev.category || meta.categories[0] || "");
    setDescription(ev.description || "");
    setVenue(ev.venue || "");
    setEventDate(ev.eventDate || "");
    setSports(Array.isArray(ev.sports) ? ev.sports : []);
    setStatus(ev.status || "open");
    setRegDeadline(ev.regDeadline || "");
    setEntryFee(ev.entryFee == null ? "" : String(ev.entryFee));
    setMaxTeams(ev.maxTeams == null ? "" : String(ev.maxTeams));
    setSportFees(ev.sportFees && typeof ev.sportFees === "object" ? ev.sportFees : {});
    setErrors({});
    setMsg({ type: "", text: "" });
    window.scrollTo(0, 0);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setCategory(meta.categories[0] || "");
    setDescription("");
    setVenue("");
    setEventDate("");
    setSports([]);
    setStatus("open");
    setRegDeadline("");
    setEntryFee("");
    setMaxTeams("");
    setSportFees({});
    setErrors({});
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setMsg({ type: "", text: "" });
    setBusy(true);
    const fees = {};
    for (const [sid, v] of Object.entries(sportFees)) {
      if (sports.includes(sid) && v !== "" && v != null) fees[sid] = v;
    }
    const payload = {
      title,
      category,
      description,
      venue,
      eventDate,
      sports,
      status,
      regDeadline,
      entryFee: entryFee === "" ? null : entryFee,
      maxTeams: maxTeams === "" ? null : maxTeams,
      sportFees: fees,
    };
    const res = editingId ? await updateSportEvent(editingId, payload) : await createSportEvent(payload);
    setBusy(false);
    if (!res.ok) {
      setErrors(res.errors || {});
      setMsg({ type: "error", text: res.formError || "Could not save the event — check the fields." });
      return;
    }
    setEvents((prev) => (editingId ? prev.map((x) => (x.id === editingId ? res.event : x)) : [res.event, ...prev]));
    resetForm();
    setMsg({ type: "success", text: editingId ? "Event updated ✓" : "Event launched — members see it on their Sports page ✓" });
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this event, its teams and all join requests?")) return;
    const res = await deleteSportEvent(id);
    if (!res.ok) {
      setMsg({ type: "error", text: res.formError || "Could not delete the event." });
      return;
    }
    setEvents((prev) => prev.filter((x) => x.id !== id));
  }

  async function onToggleStatus(ev) {
    const res = await updateSportEvent(ev.id, { ...ev, status: ev.status === "open" ? "closed" : "open" });
    if (res.ok) setEvents((prev) => prev.map((x) => (x.id === ev.id ? res.event : x)));
  }

  const sportName = (id) => (meta.sports.find((s) => s.id === id) || {}).name || id;

  return (
    <div className="admin-tab">
      <div className="join-card admin-card">
        <h3>{editingId ? "Edit sports event ✎" : "Launch a sports event ⚽"}</h3>
        <p className="join-sub">Pick a category, write the details, tick the sports — it appears on the member Sports page instantly.</p>
        {msg.text && (
          <p className={msg.type === "success" ? "ev-success" : "ev-formerror"} role={msg.type === "success" ? "status" : "alert"}>
            {msg.text}
          </p>
        )}
        <form onSubmit={onSubmit} noValidate>
          <label className="field auth-field" htmlFor="admin-ev-title">
            <span className="auth-label">Event title</span>
            <input id="admin-ev-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Monsoon Box Cricket League" maxLength={120} />
            {errors.title && <span className="ev-error">{errors.title}</span>}
          </label>
          <div className="auth-row">
            <label className="field auth-field" htmlFor="admin-ev-cat">
              <span className="auth-label">Category</span>
              <select id="admin-ev-cat" className="admin-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {meta.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <span className="ev-error">{errors.category}</span>}
            </label>
            <label className="field auth-field" htmlFor="admin-ev-status">
              <span className="auth-label">Status</span>
              <select id="admin-ev-status" className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="open">open — teams can form</option>
                <option value="closed">closed — rosters frozen</option>
              </select>
              {errors.status && <span className="ev-error">{errors.status}</span>}
            </label>
          </div>
          <div className="auth-row">
            <label className="field auth-field" htmlFor="admin-ev-venue">
              <span className="auth-label">Venue (optional)</span>
              <input id="admin-ev-venue" type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Floodlit box cage" maxLength={120} />
            </label>
            <label className="field auth-field" htmlFor="admin-ev-date">
              <span className="auth-label">Date (optional)</span>
              <input id="admin-ev-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </label>
          </div>
          <label className="field auth-field" htmlFor="admin-ev-deadline">
            <span className="auth-label">Registration deadline (optional)</span>
            <input id="admin-ev-deadline" type="datetime-local" value={regDeadline} onChange={(e) => setRegDeadline(e.target.value)} />
            {errors.regDeadline && <span className="ev-error">{errors.regDeadline}</span>}
            <span className="auth-hint">When this moment passes, teams freeze and the event closes automatically.</span>
          </label>
          <div className="auth-row">
            <label className="field auth-field" htmlFor="admin-ev-fee">
              <span className="auth-label">Team entry fee (₹)</span>
              <input id="admin-ev-fee" type="number" min="0" max="1000000" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} placeholder="e.g. 1500" />
              {errors.entryFee && <span className="ev-error">{errors.entryFee}</span>}
              <span className="auth-hint">Empty = the club&apos;s default fee. Captains pay this by UPI.</span>
            </label>
            <label className="field auth-field" htmlFor="admin-ev-maxteams">
              <span className="auth-label">Team cap (optional)</span>
              <input id="admin-ev-maxteams" type="number" min="1" max="1000" value={maxTeams} onChange={(e) => setMaxTeams(e.target.value)} placeholder="e.g. 15" />
              {errors.maxTeams && <span className="ev-error">{errors.maxTeams}</span>}
              <span className="auth-hint">Max paid teams. Empty = global default.</span>
            </label>
          </div>
          {sports.length > 0 && (
            <div className="field auth-field">
              <span className="auth-label">Per-sport fee override (optional)</span>
              <div className="fee-grid">
                {sports.map((sid) => (
                  <label className="fee-row" key={sid}>
                    <span>{sportName(sid)}</span>
                    <input
                      type="number"
                      min="0"
                      value={sportFees[sid] ?? ""}
                      onChange={(e) => setSportFees((f) => ({ ...f, [sid]: e.target.value }))}
                      placeholder="₹ base"
                    />
                  </label>
                ))}
              </div>
              <span className="auth-hint">Blank uses the team entry fee above.</span>
            </div>
          )}
          <label className="field auth-field" htmlFor="admin-ev-desc">
            <span className="auth-label">Details for members</span>
            <textarea id="admin-ev-desc" className="admin-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Format, entry, what to bring…" rows={3} maxLength={2000} />
            {errors.description && <span className="ev-error">{errors.description}</span>}
          </label>
          <div className="field auth-field">
            <span className="auth-label">Sports in this event</span>
            <div className="maker-tags" role="group" aria-label="Sports in this event">
              {meta.sports.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={sports.includes(s.id) ? "dash-tag maker-tag active" : "dash-tag maker-tag"}
                  onClick={() => toggleSport(s.id)}
                  aria-pressed={sports.includes(s.id)}
                  title={`${s.format} · squad ${s.min}–${s.max}`}
                >
                  {s.name} · {s.min}–{s.max}
                </button>
              ))}
            </div>
            {errors.sports && <span className="ev-error">{errors.sports}</span>}
          </div>
          <div className="dash-play-row">
            <button className="btn btn-clay dash-btn" type="submit" disabled={busy}>
              {busy ? "Saving…" : editingId ? "Save changes ✓" : "Launch event →"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-paper dash-btn" onClick={resetForm} disabled={busy}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="join-card admin-card">
        <h3>Official events ({events.length})</h3>
        <p className="join-sub">What members pick from. Closing freezes new teams; deleting wipes its teams too.</p>
        {loading ? (
          <p className="join-sub">Loading events…</p>
        ) : events.length === 0 ? (
          <div className="notice-empty">
            <span className="notice-empty-leaf" aria-hidden="true">⚽</span>
            <b>No events yet — launch the first one above.</b>
            <p>Members see an empty Sports page until you do.</p>
          </div>
        ) : (
          <div className="event-list">
            {events.map((ev) => {
              const closed = ev.status === "closed" || ev.regClosed;
              return (
                <article key={ev.id} className={closed ? "event-card closed" : "event-card"}>
                  <div className="event-top">
                    <span className="event-cat">{ev.category}</span>
                    <span className={closed ? "event-status closed" : "event-status open"}>
                      {closed ? "■ closed" : "● open"}
                    </span>
                  </div>
                  <h4 className="event-title">{ev.title}</h4>
                  {ev.description && <p className="event-desc">{ev.description}</p>}
                  <div className="event-meta">
                    {ev.eventDate && <span>📅 {ev.eventDate}</span>}
                    {ev.venue && <span>📍 {ev.venue}</span>}
                    {ev.regDeadline && <span>⏳ reg. closes {ev.regDeadline.replace("T", " · ")}</span>}
                  </div>
                  <div className="event-sports">
                    {(ev.sports || []).map((s) => (
                      <span key={s} className="event-sport">{sportName(s)}</span>
                    ))}
                  </div>
                  <div className="dash-play-row">
                    <button type="button" className="btn btn-clay dash-btn" onClick={() => setInspectEvent(ev)}>Teams &amp; payments 👥</button>
                    <button type="button" className="btn btn-paper dash-btn" onClick={() => startEdit(ev)}>Edit ✎</button>
                    <button type="button" className="btn btn-paper dash-btn" onClick={() => onToggleStatus(ev)}>
                      {ev.status === "open" ? "Close ■" : "Reopen ●"}
                    </button>
                    <button type="button" className="btn btn-paper dash-btn" onClick={() => onDelete(ev.id)}>Delete ✕</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      {inspectEvent && (
        <EventTeamsModal event={inspectEvent} sports={meta.sports} onClose={() => setInspectEvent(null)} />
      )}
    </div>
  );
}

function PersonDetails({ person, fallbackName }) {
  if (!person) {
    return (
      <dl className="dash-facts">
        <div>
          <dt>Name</dt>
          <dd>{fallbackName || "—"}</dd>
        </div>
        <div>
          <dt>Details</dt>
          <dd>No profile on record.</dd>
        </div>
      </dl>
    );
  }
  return (
    <dl className="dash-facts">
      <div>
        <dt>Full name</dt>
        <dd>{person.fullName || fallbackName || "—"}</dd>
      </div>
      <div>
        <dt>Email</dt>
        <dd>{person.email || "—"}</dd>
      </div>
      <div>
        <dt>School</dt>
        <dd>{person.school || "—"}</dd>
      </div>
      <div>
        <dt>Phone</dt>
        <dd>{person.phone || "—"}</dd>
      </div>
      <div>
        <dt>Birth date</dt>
        <dd>{person.birthDate || "—"}</dd>
      </div>
      <div>
        <dt>Age</dt>
        <dd>{displayAge(person) ?? "—"}</dd>
      </div>
      <div>
        <dt>Role</dt>
        <dd>{person.role === "admin" ? "★ admin" : "member"}</dd>
      </div>
      <div>
        <dt>Joined</dt>
        <dd>
          {person.createdAt
            ? new Date(person.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
            : "—"}
        </dd>
      </div>
    </dl>
  );
}

function EventTeamsModal({ event, sports, onClose }) {
  const [teams, setTeams] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTeam, setOpenTeam] = useState(null);
  const [openPerson, setOpenPerson] = useState(null);
  const [busyTeam, setBusyTeam] = useState(null);
  const [msg, setMsg] = useState("");

  const sportName = (id) => (sports.find((s) => s.id === id) || {}).name || id;
  const personKey = (u) => u.uid || u.id;
  const byUid = new Map(people.map((u) => [personKey(u), u]));
  const toggleTeam = (id) => { setOpenPerson(null); setOpenTeam((cur) => (cur === id ? null : id)); };
  const togglePerson = (uid) => setOpenPerson((cur) => (cur === uid ? null : uid));

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [t, u] = await Promise.all([listTeams(event.id), fetchAdminUsers()]);
      if (!alive) return;
      setTeams(t.ok ? t.teams : []);
      setPeople(u.ok ? u.users : []);
      if (!t.ok) setMsg(t.formError || "Could not load teams.");
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [event.id]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function togglePaid(team) {
    setBusyTeam(team.id);
    setMsg("");
    const res = await setTeamPaid(team.id, !team.paid);
    setBusyTeam(null);
    if (!res.ok) { setMsg(res.formError || "Could not update payment."); return; }
    setTeams((prev) => prev.map((t) => (t.id === team.id ? { ...t, paid: !team.paid } : t)));
  }

  const bySport = {};
  for (const t of teams) {
    (bySport[t.sportId] = bySport[t.sportId] || []).push(t);
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-label={`Teams for ${event.title}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3 className="modal-title">{event.title}</h3>
            <p className="modal-sub">{event.category} · {teams.length} team{teams.length === 1 ? "" : "s"}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          {msg && <p className="ev-error">{msg}</p>}
          {loading ? (
            <p className="join-sub">Loading teams…</p>
          ) : teams.length === 0 ? (
            <div className="notice-empty">
              <span className="notice-empty-leaf" aria-hidden="true">👥</span>
              <b>No teams yet.</b>
              <p>Members haven’t formed any teams for this event.</p>
            </div>
          ) : (
            Object.entries(bySport).map(([sportId, list]) => (
              <section key={sportId} className="modal-sport">
                <h4 className="modal-sport-title">{sportName(sportId)}</h4>
                {list.map((team) => {
                  const expanded = openTeam === team.id;
                  return (
                    <article key={team.id} className={expanded ? "team-inspect open" : "team-inspect"}>
                      <button type="button" className="team-inspect-head" onClick={() => toggleTeam(team.id)} aria-expanded={expanded}>
                        <span className="team-inspect-name">{team.name}</span>
                        <span className="team-inspect-count">{team.count}/{team.maxPlayers}</span>
                        <span className={team.paid ? "dash-tag paid-tag" : "dash-tag"}>{team.paid ? "● paid" : "○ unpaid"}</span>
                        <span className="team-inspect-caret">{expanded ? "▾" : "▸"}</span>
                      </button>
                      {expanded && (
                        <div className="team-inspect-body">
                          <div className="team-inspect-actions">
                            <button type="button" className={team.paid ? "btn btn-paper dash-btn" : "btn btn-clay dash-btn"} disabled={busyTeam === team.id} onClick={() => togglePaid(team)}>
                              {busyTeam === team.id ? "Saving…" : team.paid ? "Mark unpaid" : "Mark paid ✓"}
                            </button>
                          </div>
                          <p className="modal-line"><b>Captain:</b> {team.captainName || "—"}</p>
                          <div className="field auth-field">
                            <span className="auth-label">Members ({team.count})</span>
                            <div className="maker-tags" role="group" aria-label="Team members">
                              {(team.members || []).map((m) => (
                                <button key={m.uid} type="button" className={openPerson === m.uid ? "dash-tag maker-tag active" : "dash-tag maker-tag"} onClick={() => togglePerson(m.uid)} aria-pressed={openPerson === m.uid}>
                                  {m.name}{m.uid === team.captainUid ? " ★" : ""}
                                </button>
                              ))}
                            </div>
                          </div>
                          {openPerson && (team.members || []).some((m) => m.uid === openPerson) && (
                            <div className="person-details">
                              <PersonDetails person={byUid.get(openPerson)} fallbackName={(team.members || []).find((m) => m.uid === openPerson)?.name} />
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FuturePlansTab() {
  const STATUS_META = {
    todo: { label: "○ todo", cls: "dash-tag" },
    "in-progress": { label: "● in progress", cls: "dash-tag" },
    done: { label: "✓ done", cls: "dash-tag admin-tag" },
  };
  const PRIORITY_META = {
    high: "▲ high",
    medium: "◆ medium",
    low: "▽ low",
  };

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editStatus, setEditStatus] = useState("todo");
  const [editPriority, setEditPriority] = useState("medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    setMsg({ type: "", text: "" });
    const res = await fetchPlans();
    if (res.ok) {
      setPlans(res.plans);
    } else {
      setMsg({ type: "error", text: res.formError || "Could not load future plans." });
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function resetComposer() {
    setTitle("");
    setDetails("");
    setStatus("todo");
    setPriority("medium");
    setDueDate("");
    setErrors({});
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEditTitle(p.title || "");
    setEditDetails(p.details || "");
    setEditStatus(p.status || "todo");
    setEditPriority(p.priority || "medium");
    setEditDueDate(p.dueDate || "");
    setErrors({});
    setMsg({ type: "", text: "" });
  }

  async function onCreate(e) {
    e.preventDefault();
    setErrors({});
    setMsg({ type: "", text: "" });
    setBusy(true);
    const res = await createPlan({ title, details, status, priority, dueDate: dueDate || null });
    setBusy(false);
    if (!res.ok) {
      setErrors(res.errors || {});
      setMsg({ type: "error", text: res.formError || "Could not save the plan — check the fields." });
      return;
    }
    setPlans((prev) => [res.plan, ...prev]);
    resetComposer();
    setMsg({ type: "success", text: "Plan pinned to the crew board ✓ — only admins can see this." });
  }

  async function onSaveEdit(id) {
    setBusy(true);
    const res = await updatePlan(id, {
      title: editTitle,
      details: editDetails,
      status: editStatus,
      priority: editPriority,
      dueDate: editDueDate || null,
    });
    setBusy(false);
    if (!res.ok) {
      setErrors(res.errors || {});
      setMsg({ type: "error", text: res.formError || "Could not save the changes." });
      return;
    }
    setPlans((prev) => prev.map((p) => (p.id === id ? res.plan : p)));
    setEditingId(null);
    setMsg({ type: "success", text: "Plan updated ✓" });
  }

  async function onCycleStatus(p) {
    const next = p.status === "todo" ? "in-progress" : p.status === "in-progress" ? "done" : "todo";
    const res = await updatePlan(p.id, {
      title: p.title,
      details: p.details,
      status: next,
      priority: p.priority,
      dueDate: p.dueDate,
    });
    if (res.ok) setPlans((prev) => prev.map((x) => (x.id === p.id ? res.plan : x)));
    else setMsg({ type: "error", text: res.formError || "Could not update status." });
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this future plan? Only admins ever saw it.")) return;
    const res = await deletePlan(id);
    if (!res.ok) {
      setMsg({ type: "error", text: res.formError || "Could not delete the plan." });
      return;
    }
    setPlans((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) setEditingId(null);
  }

  const filtered = plans.filter((p) => (filter === "all" ? true : p.status === filter));
  const counts = {
    all: plans.length,
    todo: plans.filter((p) => p.status === "todo").length,
    "in-progress": plans.filter((p) => p.status === "in-progress").length,
    done: plans.filter((p) => p.status === "done").length,
  };

  return (
    <div className="admin-tab">
      <div className="join-card admin-card">
        <h3>Club future plans ✦</h3>
        <p className="join-sub">
          Private crew todos — roadmaps, events to launch, gear to buy. <b>Only assigned admins</b> can see or edit this board. Members never see it.
        </p>
        {msg.text && (
          <p className={msg.type === "success" ? "ev-success" : "ev-formerror"} role={msg.type === "success" ? "status" : "alert"}>
            {msg.text}
          </p>
        )}
        <form onSubmit={onCreate} noValidate>
          <label className="field auth-field" htmlFor="plans-title">
            <span className="auth-label">Plan title · {title.length}/120</span>
            <input
              id="plans-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Floodlit box-cricket finals in December"
              maxLength={120}
            />
            {errors.title && <span className="ev-error">{errors.title}</span>}
          </label>
          <label className="field auth-field" htmlFor="plans-details">
            <span className="auth-label">Details · {details.length}/2000</span>
            <textarea
              id="plans-details"
              className="admin-textarea"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Owner, budget, venue, first 3 steps…"
              rows={3}
              maxLength={2000}
            />
            {errors.details && <span className="ev-error">{errors.details}</span>}
          </label>
          <div className="auth-row">
            <div className="field auth-field">
              <span className="auth-label">Status</span>
              <div className="maker-tags" role="group" aria-label="Plan status">
                {Object.keys(STATUS_META).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={status === s ? "dash-tag maker-tag active" : "dash-tag maker-tag"}
                    onClick={() => setStatus(s)}
                    aria-pressed={status === s}
                  >
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
              {errors.status && <span className="ev-error">{errors.status}</span>}
            </div>
            <div className="field auth-field">
              <span className="auth-label">Priority</span>
              <div className="maker-tags" role="group" aria-label="Plan priority">
                {Object.keys(PRIORITY_META).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={priority === p ? "dash-tag maker-tag active" : "dash-tag maker-tag"}
                    onClick={() => setPriority(p)}
                    aria-pressed={priority === p}
                  >
                    {PRIORITY_META[p]}
                  </button>
                ))}
              </div>
              {errors.priority && <span className="ev-error">{errors.priority}</span>}
            </div>
          </div>
          <div className="auth-row">
            <label className="field auth-field" htmlFor="plans-due">
              <span className="auth-label">Target date (optional)</span>
              <input id="plans-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              {errors.dueDate && <span className="ev-error">{errors.dueDate}</span>}
            </label>
          </div>
          <div className="dash-play-row">
            <button className="btn btn-clay dash-btn" type="submit" disabled={busy || title.trim().length < 3}>
              {busy ? "Pinning…" : "Pin plan →"}
            </button>
            <button type="button" className="btn btn-paper dash-btn" disabled={busy || (!title && !details && !dueDate)} onClick={resetComposer}>
              Clear ↻
            </button>
          </div>
        </form>
      </div>

      <div className="join-card admin-card">
        <h3>Crew board ({filtered.length}/{plans.length})</h3>
        <p className="join-sub">Admin eyes only — tap a status pill to filter, tap a card&apos;s status to move it along.</p>
        <div className="maker-tags" role="group" aria-label="Filter plans">
          {[
            { id: "all", label: `All (${counts.all})` },
            { id: "todo", label: `○ Todo (${counts.todo})` },
            { id: "in-progress", label: `● In progress (${counts["in-progress"]})` },
            { id: "done", label: `✓ Done (${counts.done})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? "dash-tag maker-tag active" : "dash-tag maker-tag"}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="dash-play-row">
          <button type="button" className="btn btn-paper dash-btn" onClick={refresh} disabled={loading}>
            {loading ? "Loading…" : "Refresh ↻"}
          </button>
        </div>
        {loading ? (
          <p className="join-sub">Loading future plans…</p>
        ) : filtered.length === 0 ? (
          <div className="notice-empty">
            <span className="notice-empty-leaf" aria-hidden="true">✦</span>
            <b>{plans.length === 0 ? "Board is empty — pin the first plan above." : "Nothing in this lane."}</b>
            <p>{plans.length === 0 ? "Only admins will ever see what you pin here." : "Try another filter."}</p>
          </div>
        ) : (
          <ul className="admin-list">
            {filtered.map((p) => {
              const meta = STATUS_META[p.status] || STATUS_META.todo;
              return (
                <li key={p.id} className="admin-item">
                  {editingId === p.id ? (
                    <div className="admin-edit">
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={120} aria-label="Edit plan title" />
                      <textarea value={editDetails} onChange={(e) => setEditDetails(e.target.value)} rows={3} maxLength={2000} aria-label="Edit plan details" />
                      <div className="maker-tags" role="group" aria-label="Edit status">
                        {Object.keys(STATUS_META).map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={editStatus === s ? "dash-tag maker-tag active" : "dash-tag maker-tag"}
                            onClick={() => setEditStatus(s)}
                            aria-pressed={editStatus === s}
                          >
                            {STATUS_META[s].label}
                          </button>
                        ))}
                      </div>
                      <div className="maker-tags" role="group" aria-label="Edit priority">
                        {Object.keys(PRIORITY_META).map((pr) => (
                          <button
                            key={pr}
                            type="button"
                            className={editPriority === pr ? "dash-tag maker-tag active" : "dash-tag maker-tag"}
                            onClick={() => setEditPriority(pr)}
                            aria-pressed={editPriority === pr}
                          >
                            {PRIORITY_META[pr]}
                          </button>
                        ))}
                      </div>
                      <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} aria-label="Edit due date" />
                      <div className="dash-play-row">
                        <button type="button" className="btn btn-clay dash-btn" onClick={() => onSaveEdit(p.id)} disabled={busy}>
                          Save ✓
                        </button>
                        <button type="button" className="btn btn-paper dash-btn" onClick={() => setEditingId(null)} disabled={busy}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="admin-item-top">
                        <b>{p.title}</b>
                      </div>
                      <div className="maker-tags">
                        <button type="button" className={meta.cls} onClick={() => onCycleStatus(p)} title="Tap to move to next status">
                          {meta.label} ↻
                        </button>
                        <span className="dash-tag">{PRIORITY_META[p.priority] || p.priority}</span>
                        {p.dueDate && <span className="dash-tag">📅 {p.dueDate}</span>}
                      </div>
                      {p.details && <p className="admin-item-body">{p.details}</p>}
                      <small className="admin-item-meta">
                        {p.createdByName ? `by ${p.createdByName} · ` : ""}
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        {p.updatedAt && p.updatedAt !== p.createdAt
                          ? ` · edited ${new Date(p.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
                          : ""}
                      </small>
                      <div className="dash-play-row">
                        <button type="button" className="btn btn-paper dash-btn" onClick={() => startEdit(p)}>
                          Edit ✎
                        </button>
                        <button type="button" className="btn btn-paper dash-btn" onClick={() => onDelete(p.id)}>
                          Delete ✕
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ClubRosterTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [openUid, setOpenUid] = useState(null);

  async function refresh() {
    setLoading(true);
    setError("");
    const res = await fetchAdminUsers();
    if (res.ok) {
      setUsers(res.users || []);
    } else {
      setError(res.formError || "Could not load the roster.");
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const personKey = (u) => u.uid || u.id;
  const togglePerson = (uid) => setOpenUid((cur) => (cur === uid ? null : uid));

  const q = query.trim().toLowerCase();
  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && (u.role || "member") !== roleFilter) return false;
    if (!q) return true;
    return [u.fullName, u.email, u.school, u.phone, u.seedPassCode, u.birthDate]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return String(a.fullName || "").localeCompare(String(b.fullName || ""));
    if (sortBy === "oldest") return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });

  const adminCount = users.filter((u) => u.role === "admin").length;
  const memberCount = users.length - adminCount;

  function exportCsv(list) {
    const headers = ["Full name", "Email", "Phone", "School", "Birth date", "Age", "Role", "Seed pass", "Joined"];
    const rows = list.map((u) => [
      u.fullName || "",
      u.email || "",
      u.phone || "",
      u.school || "",
      u.birthDate || "",
      displayAge(u) ?? "",
      u.role || "member",
      u.seedPassCode || "",
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
    ]);
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yuvora-club-roster-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-tab">
      <div className="join-card admin-card">
        <h3>Club Roster ❧</h3>
        <p className="join-sub">
          Every account on the roster — admins + members — with full details. Click a name to see everything on record.
        </p>
        {error && (
          <p className="ev-formerror" role="alert">
            {error} <a href="/login?next=%2Fadmin">Log in again →</a>
          </p>
        )}
        <div className="maker-tags" aria-label="Roster totals">
          <span className="dash-tag">❧ {users.length} total</span>
          <span className="dash-tag">★ {adminCount} admins</span>
          <span className="dash-tag">● {memberCount} members</span>
          <span className="dash-tag">◈ {sorted.length} shown</span>
        </div>
        <div className="auth-row" style={{ marginTop: 14 }}>
          <label className="field auth-field" htmlFor="roster-search">
            <span className="auth-label">Search name, email, school, phone, seed pass</span>
            <input
              id="roster-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Aarav, DPS, YV-8930…"
              autoComplete="off"
            />
          </label>
          <label className="field auth-field" htmlFor="roster-sort">
            <span className="auth-label">Sort</span>
            <select id="roster-sort" className="admin-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
        <div className="maker-tags" role="group" aria-label="Filter by role" style={{ marginTop: 4 }}>
          {[
            { id: "all", label: `All (${users.length})` },
            { id: "admin", label: `★ Admins (${adminCount})` },
            { id: "member", label: `Members (${memberCount})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={roleFilter === f.id ? "dash-tag maker-tag active" : "dash-tag maker-tag"}
              onClick={() => setRoleFilter(f.id)}
              aria-pressed={roleFilter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="dash-play-row">
          <button type="button" className="btn btn-paper dash-btn" onClick={refresh} disabled={loading}>
            {loading ? "Loading…" : "Refresh ↻"}
          </button>
          <button
            type="button"
            className="btn btn-clay dash-btn"
            onClick={() => exportCsv(sorted)}
            disabled={loading || sorted.length === 0}
          >
            Export CSV ↓
          </button>
        </div>
      </div>

      <div className="join-card admin-card">
        <h3>Accounts ({sorted.length})</h3>
        {loading ? (
          <p className="join-sub">Loading the roster…</p>
        ) : sorted.length === 0 ? (
          <div className="notice-empty">
            <span className="notice-empty-leaf" aria-hidden="true">❧</span>
            <b>{users.length === 0 ? "No accounts yet." : "Nobody matches that search."}</b>
            <p>{users.length === 0 ? "New signups will appear here." : "Try a different name, email or seed-pass code."}</p>
          </div>
        ) : (
          <ul className="admin-list">
            {sorted.map((u) => {
              const key = personKey(u);
              const open = openUid === key;
              return (
                <li key={key} className="admin-item admin-user">
                  <div className="admin-item-top">
                    <button
                      type="button"
                      className="person-name"
                      onClick={() => togglePerson(key)}
                      aria-expanded={open}
                    >
                      {u.fullName || "—"} {open ? "▾" : "▸"}
                    </button>
                    <span className={u.role === "admin" ? "dash-tag admin-tag" : "dash-tag"}>
                      {u.role === "admin" ? "★ admin" : "member"}
                    </span>
                    {u.seedPassCode && <span className="dash-tag">{u.seedPassCode}</span>}
                  </div>
                  <small className="admin-item-meta">
                    {u.email || "—"} · {u.school || "no school"} · {u.phone || "no phone"} · age {displayAge(u) ?? "—"}
                    {u.createdAt
                      ? ` · joined ${new Date(u.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`
                      : ""}
                  </small>
                  {open && (
                    <div className="person-details">
                      <PersonDetails person={u} fallbackName={u.fullName} />
                      <dl className="dash-facts" style={{ marginTop: 8 }}>
                        <div>
                          <dt>Seed pass</dt>
                          <dd>{u.seedPassCode || "—"}</dd>
                        </div>
                        <div>
                          <dt>User ID</dt>
                          <dd style={{ overflowWrap: "anywhere" }}>{key || "—"}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ResultsTab() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [meta, setMeta] = useState({ sports: [] });
  const [rosters, setRosters] = useState({});
  const [formError, setFormError] = useState("");
  const [openPerson, setOpenPerson] = useState(null);
  const [generalEvents, setGeneralEvents] = useState([]);
  const [generalRosters, setGeneralRosters] = useState({});

  const personKey = (u) => u.uid || u.id;
  const byUid = new Map(members.map((u) => [personKey(u), u]));
  const togglePerson = (uid) => setOpenPerson((cur) => (cur === uid ? null : uid));

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [m, e, u, ge] = await Promise.all([fetchSportsMeta(), listSportEvents(), fetchAdminUsers(), listGeneralEvents()]);
      if (!alive) return;
      if (m.ok) setMeta({ sports: m.sports });
      setEvents(e.events);
      setGeneralEvents(ge.events);
      if (u.ok) setMembers(u.users);
      else setFormError(u.formError || "Could not load registrations.");
      // Sport events: every event × sport -> teams + their pending requests.
      const agg = {};
      for (const ev of e.events) {
        agg[ev.id] = {};
        for (const sid of ev.sports || []) {
          const t = await listTeams(ev.id, sid);
          if (!t.ok || !alive) continue;
          const withReqs = [];
          for (const team of t.teams) {
            const r = await fetchTeamRequests(team.id);
            withReqs.push({ ...team, pendingReqs: r.ok ? r.requests : [] });
            if (!alive) return;
          }
          agg[ev.id][sid] = withReqs;
        }
      }
      // General events: team events -> teams, individual events -> signups.
      const agg2 = {};
      for (const ev of ge.events) {
        if (ev.kind === "team") {
          const t = await listTeams(ev.id, "general");
          const withReqs = [];
          for (const team of (t.ok ? t.teams : [])) {
            const r = await fetchTeamRequests(team.id);
            withReqs.push({ ...team, pendingReqs: r.ok ? r.requests : [] });
            if (!alive) return;
          }
          agg2[ev.id] = { kind: "team", teams: withReqs };
        } else {
          const r = await fetchEventRegistrations(ev.id);
          agg2[ev.id] = { kind: "individual", regs: r.ok ? r.registrations : [] };
        }
      }
      if (alive) {
        setRosters(agg);
        setGeneralRosters(agg2);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const sportName = (id) => (meta.sports.find((s) => s.id === id) || {}).name || id;
  const sportTeams = Object.values(rosters).flatMap((bySport) => Object.values(bySport).flat());
  const generalTeamList = Object.values(generalRosters).flatMap((g) => (g.kind === "team" ? g.teams : []));
  const allTeams = [...sportTeams, ...generalTeamList];
  const totalPlayers = allTeams.reduce((n, t) => n + (t.members ? t.members.length : 0), 0);
  const totalPending = allTeams.reduce((n, t) => n + (t.pendingReqs ? t.pendingReqs.length : 0), 0);
  const totalSoloRegs = Object.values(generalRosters).reduce((n, g) => n + (g.kind === "individual" && g.regs ? g.regs.length : 0), 0);
  const totalEvents = events.length + generalEvents.length;

  // One team card (sport events and general team events share it).
  function renderTeam(t) {
    const memberIsOpen = (t.members || []).some((m) => m.uid === openPerson);
    const reqIsOpen = (t.pendingReqs || []).some((r) => r.uid === openPerson);
    return (
      <div key={t.id} className="notice-card">
        <div className="notice-top">
          <b className="notice-title">{t.name}</b>
          <span className={t.status === "locked" ? "dash-tag admin-tag" : "dash-tag"}>
            {t.status === "locked" ? "■ locked" : `● ${t.count}/${t.maxPlayers}`}
          </span>
        </div>
        <small className="admin-item-meta">captain {t.captainName}</small>
        <div className="team-roster">
          {(t.members || []).map((m) => (
            <button
              type="button"
              key={m.uid}
              className={(m.uid === t.captainUid ? "team-chip captain" : "team-chip") + (openPerson === m.uid ? " active" : "")}
              onClick={() => togglePerson(m.uid)}
              aria-expanded={openPerson === m.uid}
            >
              {m.uid === t.captainUid ? "★ " : ""}{m.name}
            </button>
          ))}
        </div>
        {memberIsOpen && (
          <div className="person-details">
            <PersonDetails person={byUid.get(openPerson)} fallbackName={(t.members || []).find((m) => m.uid === openPerson)?.name} />
          </div>
        )}
        {t.pendingReqs && t.pendingReqs.length > 0 && (
          <small className="admin-item-meta">
            …awaiting captain:{" "}
            {t.pendingReqs.map((r, i) => (
              <span key={r.uid}>
                {i > 0 ? ", " : ""}
                <button type="button" className="person-name person-name-inline" onClick={() => togglePerson(r.uid)}>
                  {r.name}
                </button>
              </span>
            ))}
          </small>
        )}
        {reqIsOpen && !memberIsOpen && (
          <div className="person-details">
            <PersonDetails person={byUid.get(openPerson)} fallbackName={(t.pendingReqs || []).find((r) => r.uid === openPerson)?.name} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-tab">
      <div className="join-card admin-card">
        <h3>Registrations & results 🏆</h3>
        <p className="join-sub">Everyone who registered, and every roster they landed in.</p>
        {formError && (
          <p className="ev-formerror" role="alert">
            {formError} <a href="/login?next=%2Fadmin">Log in again →</a>
          </p>
        )}
        {loading ? (
          <p className="join-sub">Gathering the registers…</p>
        ) : (
          <>
            <div className="maker-tags" aria-label="Totals">
              <span className="dash-tag">❧ {members.length} registered</span>
              <span className="dash-tag">⚽ {totalEvents} events</span>
              <span className="dash-tag">★ {allTeams.length} teams</span>
              <span className="dash-tag">● {totalPlayers} players in</span>
              <span className="dash-tag">◈ {totalSoloRegs} solo signups</span>
              <span className="dash-tag">… {totalPending} awaiting captain</span>
            </div>

            <p className="join-group-title">❧ registered people</p>
            {members.length === 0 ? (
              <p className="join-sub">Nobody yet.</p>
            ) : (
              <ul className="admin-list">
                {members.map((u) => (
                  <li key={u.id} className="admin-item admin-user">
                    <div className="admin-item-top">
                      <button
                        type="button"
                        className="person-name"
                        onClick={() => togglePerson(personKey(u))}
                        aria-expanded={openPerson === personKey(u)}
                      >
                        {u.fullName || "—"} {openPerson === personKey(u) ? "▾" : "▸"}
                      </button>
                      <span className={u.role === "admin" ? "dash-tag admin-tag" : "dash-tag"}>{u.role === "admin" ? "★ admin" : "member"}</span>
                    </div>
                    <small className="admin-item-meta">
                      {u.email || "—"} · {u.school || "no school"} · {u.phone || "no phone"} · age {displayAge(u) ?? "—"}
                      {u.createdAt ? ` · joined ${new Date(u.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : ""}
                    </small>
                    {openPerson === personKey(u) && (
                      <div className="person-details">
                        <PersonDetails person={byUid.get(personKey(u))} fallbackName={u.fullName} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <p className="join-group-title">❧ event-wise rosters</p>
            {totalEvents === 0 ? (
              <p className="join-sub">No events launched yet.</p>
            ) : (
              <>
                {generalEvents.map((ev) => {
                  const g = generalRosters[ev.id] || {};
                  return (
                    <div key={ev.id} className="result-event">
                      <div className="admin-item-top">
                        <b>{ev.title}</b>
                        <span className={ev.status === "open" ? "dash-tag" : "dash-tag admin-tag"}>
                          {ev.status === "open" ? "● open" : "■ closed"} · {ev.kind === "team" ? "team" : "individual"}
                        </span>
                      </div>
                      {ev.kind === "team" ? (
                        (g.teams || []).length === 0 ? (
                          <p className="join-sub">No teams yet.</p>
                        ) : (
                          (g.teams || []).map((t) => renderTeam(t))
                        )
                      ) : (g.regs || []).length === 0 ? (
                        <p className="join-sub">Nobody registered yet.</p>
                      ) : (
                        <>
                          <div className="team-roster">
                            {(g.regs || []).map((r) => (
                              <button
                                type="button"
                                key={r.uid}
                                className={"team-chip" + (openPerson === r.uid ? " active" : "")}
                                onClick={() => togglePerson(r.uid)}
                                aria-expanded={openPerson === r.uid}
                              >
                                {r.name}
                              </button>
                            ))}
                          </div>
                          {(g.regs || []).some((r) => r.uid === openPerson) && (
                            <div className="person-details">
                              <PersonDetails
                                person={byUid.get(openPerson)}
                                fallbackName={(g.regs || []).find((r) => r.uid === openPerson)?.name}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                {events.map((ev) => (
                  <div key={ev.id} className="result-event">
                    <div className="admin-item-top">
                      <b>{ev.title}</b>
                      <span className={ev.status === "open" ? "dash-tag" : "dash-tag admin-tag"}>
                        {ev.status === "open" ? "● open" : "■ closed"}
                      </span>
                    </div>
                    {(ev.sports || []).map((sid) => {
                      const teams = (rosters[ev.id] && rosters[ev.id][sid]) || [];
                      return (
                        <div key={sid} className="result-sport">
                          <p className="join-group-title">— {sportName(sid)} · {teams.length} team{teams.length === 1 ? "" : "s"}</p>
                          {teams.length === 0 ? (
                            <p className="join-sub">No teams yet.</p>
                          ) : (
                            teams.map((t) => renderTeam(t))
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("individual");
  const [description, setDescription] = useState("");
  const [fee, setFee] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [minPlayers, setMinPlayers] = useState("2");
  const [maxPlayers, setMaxPlayers] = useState("5");
  const [status, setStatus] = useState("open");
  const [regDeadline, setRegDeadline] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);
  const [regs, setRegs] = useState({});
  const [regsOpen, setRegsOpen] = useState(null);
  const [people, setPeople] = useState({});
  const [openPerson, setOpenPerson] = useState(null);

  const togglePerson = (uid) => setOpenPerson((cur) => (cur === uid ? null : uid));

  async function refresh() {
    setLoading(true);
    const [e, u] = await Promise.all([listGeneralEvents(), fetchAdminUsers()]);
    setEvents(e.events);
    if (u.ok) setPeople(Object.fromEntries(u.users.map((x) => [x.uid || x.id, x])));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function startEdit(ev) {
    setEditingId(ev.id);
    setTitle(ev.title || "");
    setKind(ev.kind || "individual");
    setDescription(ev.description || "");
    setFee(ev.fee == null ? "" : String(ev.fee));
    setVenue(ev.venue || "");
    setEventDate(ev.eventDate || "");
    setMinPlayers(ev.minPlayers != null ? String(ev.minPlayers) : "2");
    setMaxPlayers(ev.maxPlayers != null ? String(ev.maxPlayers) : "5");
    setStatus(ev.status || "open");
    setRegDeadline(ev.regDeadline || "");
    setErrors({});
    setMsg({ type: "", text: "" });
    window.scrollTo(0, 0);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setKind("individual");
    setDescription("");
    setFee("");
    setVenue("");
    setEventDate("");
    setMinPlayers("2");
    setMaxPlayers("5");
    setStatus("open");
    setRegDeadline("");
    setErrors({});
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setMsg({ type: "", text: "" });
    setBusy(true);
    const payload = {
      title,
      kind,
      description,
      fee: fee === "" ? null : Number(fee),
      venue,
      eventDate,
      minPlayers: kind === "team" ? Number(minPlayers) : undefined,
      maxPlayers: kind === "team" ? Number(maxPlayers) : undefined,
      status,
      regDeadline,
    };
    const res = editingId ? await updateGeneralEvent(editingId, payload) : await createGeneralEvent(payload);
    setBusy(false);
    if (!res.ok) {
      setErrors(res.errors || {});
      setMsg({ type: "error", text: res.formError || "Could not save the event — check the fields." });
      return;
    }
    setEvents((prev) => (editingId ? prev.map((x) => (x.id === editingId ? res.event : x)) : [res.event, ...prev]));
    resetForm();
    setMsg({ type: "success", text: "Event live on the member Events page ✓" });
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this event, its teams and registrations?")) return;
    const res = await deleteGeneralEvent(id);
    if (!res.ok) {
      setMsg({ type: "error", text: res.formError || "Could not delete the event." });
      return;
    }
    setEvents((prev) => prev.filter((x) => x.id !== id));
  }

  async function onToggleStatus(ev) {
    const res = await updateGeneralEvent(ev.id, { ...ev, status: ev.status === "open" ? "closed" : "open" });
    if (res.ok) setEvents((prev) => prev.map((x) => (x.id === ev.id ? res.event : x)));
  }

  async function toggleRegs(ev) {
    if (regsOpen === ev.id) {
      setRegsOpen(null);
      return;
    }
    if (ev.kind !== "individual") return;
    const res = await fetchEventRegistrations(ev.id);
    if (res.ok) {
      setRegs((prev) => ({ ...prev, [ev.id]: res.registrations }));
      setRegsOpen(ev.id);
    }
  }

  return (
    <div className="admin-tab">
      <div className="join-card admin-card">
        <h3>{editingId ? "Edit event ✎" : "Launch an event ◈"}</h3>
        <p className="join-sub">Summits, fairs, jams — team events run the captain flow, individuals register in one tap. Fee is optional.</p>
        {msg.text && (
          <p className={msg.type === "success" ? "ev-success" : "ev-formerror"} role={msg.type === "success" ? "status" : "alert"}>
            {msg.text}
          </p>
        )}
        <form onSubmit={onSubmit} noValidate>
          <label className="field auth-field" htmlFor="admin-gev-title">
            <span className="auth-label">Event name</span>
            <input id="admin-gev-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Founder Mela — Season 2" maxLength={120} />
            {errors.title && <span className="ev-error">{errors.title}</span>}
          </label>
          <div className="auth-row">
            <div className="field auth-field">
              <span className="auth-label">Type</span>
              <div className="maker-tags" role="group" aria-label="Event type">
                <button type="button" className={kind === "individual" ? "dash-tag maker-tag active" : "dash-tag maker-tag"} onClick={() => setKind("individual")} aria-pressed={kind === "individual"}>
                  Individual · direct signup
                </button>
                <button type="button" className={kind === "team" ? "dash-tag maker-tag active" : "dash-tag maker-tag"} onClick={() => setKind("team")} aria-pressed={kind === "team"}>
                  Team · captain flow
                </button>
              </div>
              {errors.kind && <span className="ev-error">{errors.kind}</span>}
            </div>
            <label className="field auth-field" htmlFor="admin-gev-fee">
              <span className="auth-label">Fee ₹ (empty = free)</span>
              <input id="admin-gev-fee" type="number" min="0" max="100000" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="Free" />
              {errors.fee && <span className="ev-error">{errors.fee}</span>}
            </label>
          </div>
          {kind === "team" && (
            <div className="auth-row">
              <label className="field auth-field" htmlFor="admin-gev-min">
                <span className="auth-label">Team min players</span>
                <input id="admin-gev-min" type="number" min="2" max="50" value={minPlayers} onChange={(e) => setMinPlayers(e.target.value)} />
                {errors.minPlayers && <span className="ev-error">{errors.minPlayers}</span>}
              </label>
              <label className="field auth-field" htmlFor="admin-gev-max">
                <span className="auth-label">Team max (locks at this)</span>
                <input id="admin-gev-max" type="number" min="2" max="50" value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} />
                {errors.maxPlayers && <span className="ev-error">{errors.maxPlayers}</span>}
              </label>
            </div>
          )}
          <div className="auth-row">
            <label className="field auth-field" htmlFor="admin-gev-venue">
              <span className="auth-label">Venue (optional)</span>
              <input id="admin-gev-venue" type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Main auditorium" maxLength={120} />
            </label>
            <label className="field auth-field" htmlFor="admin-gev-date">
              <span className="auth-label">Date (optional)</span>
              <input id="admin-gev-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </label>
          </div>
          <div className="auth-row">
            <label className="field auth-field" htmlFor="admin-gev-status">
              <span className="auth-label">Status</span>
              <select id="admin-gev-status" className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="open">open — signups on</option>
                <option value="closed">closed — frozen</option>
              </select>
              {errors.status && <span className="ev-error">{errors.status}</span>}
            </label>
            <label className="field auth-field" htmlFor="admin-gev-deadline">
              <span className="auth-label">Registration deadline (optional)</span>
              <input id="admin-gev-deadline" type="datetime-local" value={regDeadline} onChange={(e) => setRegDeadline(e.target.value)} />
              {errors.regDeadline && <span className="ev-error">{errors.regDeadline}</span>}
            </label>
          </div>
          <p className="auth-hint">When the deadline passes, registrations freeze and the event closes automatically.</p>
          <label className="field auth-field" htmlFor="admin-gev-long">
            <span className="auth-label">Full details</span>
            <textarea id="admin-gev-long" className="admin-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Schedule, guests, rounds, what to bring…" rows={3} maxLength={2000} />
            {errors.description && <span className="ev-error">{errors.description}</span>}
          </label>
          <div className="dash-play-row">
            <button className="btn btn-clay dash-btn" type="submit" disabled={busy}>
              {busy ? "Saving…" : editingId ? "Save changes ✓" : "Launch event →"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-paper dash-btn" onClick={resetForm} disabled={busy}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="join-card admin-card">
        <h3>Gatherings ({events.length})</h3>
        <p className="join-sub">Individual signups list their people below each card.</p>
        {loading ? (
          <p className="join-sub">Loading events…</p>
        ) : events.length === 0 ? (
          <div className="notice-empty">
            <span className="notice-empty-leaf" aria-hidden="true">◈</span>
            <b>No gatherings yet — launch the first one above.</b>
          </div>
        ) : (
          <div className="event-list">
            {events.map((ev) => {
              const closed = ev.status === "closed" || ev.regClosed;
              return (
              <article key={ev.id} className={closed ? "event-card closed" : "event-card"}>
                <div className="event-top">
                  <span className="event-cat">{ev.kind === "team" ? "team event" : "individual"}</span>
                  <span className={closed ? "event-status closed" : "event-status open"}>
                    {closed ? "■ closed" : "● open"}
                  </span>
                </div>
                <h4 className="event-title">{ev.title}</h4>
                {ev.description && <p className="event-desc">{ev.description}</p>}
                <div className="event-meta">
                  <span>{ev.fee == null ? "Free entry" : `₹${ev.fee} entry`}</span>
                  {ev.eventDate && <span>📅 {ev.eventDate}</span>}
                  {ev.venue && <span>📍 {ev.venue}</span>}
                  {ev.regDeadline && <span>⏳ reg. closes {ev.regDeadline.replace("T", " · ")}</span>}
                  {ev.kind === "team"
                    ? <span>squad {ev.minPlayers}–{ev.maxPlayers}</span>
                    : <span>● {ev.regCount || 0} registered</span>}
                </div>
                <div className="dash-play-row">
                  <button type="button" className="btn btn-paper dash-btn" onClick={() => startEdit(ev)}>Edit ✎</button>
                  <button type="button" className="btn btn-paper dash-btn" onClick={() => onToggleStatus(ev)}>
                    {ev.status === "open" ? "Close ■" : "Reopen ●"}
                  </button>
                  <button type="button" className="btn btn-paper dash-btn" onClick={() => onDelete(ev.id)}>Delete ✕</button>
                  {ev.kind === "individual" && (
                    <button type="button" className="btn btn-paper dash-btn" onClick={() => toggleRegs(ev)}>
                      {regsOpen === ev.id ? "Hide people" : `See people (${ev.regCount || 0})`}
                    </button>
                  )}
                </div>
                {regsOpen === ev.id && (
                  (regs[ev.id] || []).length === 0 ? (
                    <p className="join-sub">Nobody registered yet.</p>
                  ) : (
                    <>
                      <div className="team-roster">
                        {(regs[ev.id] || []).map((r) => (
                          <button
                            type="button"
                            key={r.uid}
                            className={"team-chip" + (openPerson === r.uid ? " active" : "")}
                            onClick={() => togglePerson(r.uid)}
                            aria-expanded={openPerson === r.uid}
                          >
                            {r.name}
                          </button>
                        ))}
                      </div>
                      {(regs[ev.id] || []).some((r) => r.uid === openPerson) && (
                        <div className="person-details">
                          <PersonDetails
                            person={people[openPerson]}
                            fallbackName={(regs[ev.id] || []).find((r) => r.uid === openPerson)?.name}
                          />
                        </div>
                      )}
                    </>
                  )
                )}
              </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileEditCard({ profile, onSaved }) {
  const [phone, setPhone] = useState(profile.phone || "");
  const [birthDate, setBirthDate] = useState(profile.birthDate || "");
  const [age, setAge] = useState(profile.birthDate ? "" : (profile.age ?? ""));
  const [role, setRole] = useState(profile.role || "admin");
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  // Refresh the form when the server profile arrives/changes.
  useEffect(() => {
    setPhone(profile.phone || "");
    setBirthDate(profile.birthDate || "");
    setAge(profile.birthDate ? "" : (profile.age ?? ""));
    setRole(profile.role || "admin");
  }, [profile.phone, profile.birthDate, profile.age, profile.role]);

  const previewAge = calcAge(birthDate);

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setMsg({ type: "", text: "" });
    if (role === "member" && profile.role === "admin") {
      if (!window.confirm("Step down to member? You will lose /admin access immediately.")) return;
    }
    setBusy(true);
    const res = await updateAdminProfile({
      phone,
      birthDate,
      age: age === "" ? undefined : Number(age),
      role,
    });
    setBusy(false);
    if (!res.ok) {
      setErrors(res.errors || {});
      setMsg({ type: "error", text: res.formError || "Could not save — check the fields." });
      return;
    }
    patchLiveSessionUser({
      phone: res.admin.phone,
      birthDate: res.admin.birthDate,
      age: res.admin.age,
      role: res.admin.role,
    });
    onSaved(res.admin);
    setMsg({ type: "success", text: "Profile updated ✓" });
  }

  return (
    <div className="join-card admin-card">
      <h3>Edit profile ✎</h3>
      <p className="join-sub">
        Only <b>phone, birth date, age and role</b> can change here — name and email stay fixed.
        {birthDate || previewAge != null ? " Age follows the birth date automatically." : ""}
      </p>
      {msg.text && (
        <p className={msg.type === "success" ? "ev-success" : "ev-formerror"} role={msg.type === "success" ? "status" : "alert"}>
          {msg.text}
        </p>
      )}
      <form onSubmit={onSubmit} noValidate>
        <div className="auth-row">
          <label className="field auth-field" htmlFor="admin-edit-phone">
            <span className="auth-label">Phone</span>
            <input id="admin-edit-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" inputMode="numeric" autoComplete="off" />
            {errors.phone && <span className="ev-error">{errors.phone}</span>}
          </label>
          <label className="field auth-field" htmlFor="admin-edit-dob">
            <span className="auth-label">Birth date {previewAge != null ? `· age ${previewAge}` : ""}</span>
            <input id="admin-edit-dob" type="date" value={birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setBirthDate(e.target.value)} />
            {errors.birthDate && <span className="ev-error">{errors.birthDate}</span>}
          </label>
        </div>
        <div className="auth-row">
          <label className="field auth-field" htmlFor="admin-edit-age">
            <span className="auth-label">Age {birthDate ? "(from birth date ↑)" : "(manual)"}</span>
            <input id="admin-edit-age" type="number" min="10" max="100" value={age} disabled={!!birthDate} onChange={(e) => setAge(e.target.value)} placeholder={birthDate ? String(previewAge ?? "") : "e.g. 15"} />
            {errors.age && <span className="ev-error">{errors.age}</span>}
          </label>
          <label className="field auth-field" htmlFor="admin-edit-role">
            <span className="auth-label">Role</span>
            <select id="admin-edit-role" className="admin-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="admin">★ admin</option>
              <option value="member">member</option>
            </select>
            {errors.role && <span className="ev-error">{errors.role}</span>}
          </label>
        </div>
        <div className="dash-play-row">
          <button className="btn btn-clay dash-btn" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save changes ✓"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProfileTab({ sessionUser }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetchAdminMe();
      if (alive) {
        setAdmin(res.ok ? res.admin : null);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const profile = admin || sessionUser || {};
  const fullName = profile.fullName || profile.name || "—";
  const age = displayAge(profile);

  return (
    <div className="admin-tab">
      <div className="join-card admin-card admin-profile">
        <span className="dash-sticker" aria-hidden="true">★ admin profile</span>
        <div className="admin-profile-top">
          <span className="dash-avatar admin-avatar" aria-hidden="true">
            {(fullName || "A").trim().charAt(0).toUpperCase()}
          </span>
          <div>
            <h3 className="admin-name">{fullName}</h3>
            <p className="join-sub">Signed in as an admin — announcements + user powers unlocked.</p>
          </div>
        </div>
        {loading && !admin ? <p className="join-sub">Loading live profile…</p> : null}
        <dl className="dash-facts">
          <div>
            <dt>Full name</dt>
            <dd>{fullName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{profile.email || "—"}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{profile.phone || "—"}</dd>
          </div>
          <div>
            <dt>Birth date</dt>
            <dd>{profile.birthDate || "—"}</dd>
          </div>
          <div>
            <dt>Age</dt>
            <dd>{age ?? "—"} {profile.birthDate ? "(auto-increments every birthday 🎂)" : ""}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{profile.role === "member" ? "member" : "★ admin"}</dd>
          </div>
        </dl>
      </div>
      <ProfileEditCard profile={profile} onSaved={(a) => setAdmin(a)} />
    </div>
  );
}

export default function AdminPage({ user }) {
  const [tab, setTab] = useState("announcements");
  // Server-verified admin gate: localStorage `role` is only a hint.
  // The backend re-checks Firebase ID token + users/{uid}.role on every
  // /api/admin/* call — only assigned admins (role === "admin" in RTDB or
  // an admin custom claim) ever get `ok`. A tampered local role can't pass.
  // Existing accounts keep access: we always ask the server when signed in,
  // even if the saved local session is stale (pre-role), then heal it.
  const [serverCheck, setServerCheck] = useState({ state: "idle", admin: null, error: "" });

  useEffect(() => {
    let alive = true;
    if (!user) {
      setServerCheck({ state: "idle", admin: null, error: "" });
      return () => {
        alive = false;
      };
    }
    setServerCheck({ state: "checking", admin: null, error: "" });
    (async () => {
      const res = await fetchAdminMe();
      if (!alive) return;
      if (res.ok && res.admin && res.admin.role === "admin") {
        // Heal stale local sessions (e.g. saved before `role` existed) so
        // existing assigned admins never lose the nav + gate on refresh.
        try {
          patchLiveSessionUser({ role: "admin" });
        } catch {
          /* healing is best-effort */
        }
        setServerCheck({ state: "ok", admin: res.admin, error: "" });
      } else {
        setServerCheck({
          state: "denied",
          admin: null,
          error: res.formError || "This account is not an assigned admin.",
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.id]);

  function onLogout() {
    logout();
    navigate("/");
  }

  if (!user) {
    return (
      <section className="wrap members-page dash-wrap">
        <div className="sec-head reveal in">
          <span className="sec-no">★ admin</span>
          <h2>
            Admin <em>gate</em>
          </h2>
          <p>Sign in as an admin to post announcements and manage users.</p>
        </div>
        <div className="dash-gate reveal in">
          <div className="dash-gate-card">
            <span className="dash-sticker" aria-hidden="true">admins only ★</span>
            <p className="dash-hand">psst — the crew clipboard lives behind login…</p>
            <div className="members-cta">
              <a className="btn btn-clay" href="/login?next=%2Fadmin">
                Log in →
              </a>
              <a className="btn btn-paper" href="/">
                ← Back to sunlight
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const verifiedUser = serverCheck.admin || user;
  const fullName = verifiedUser.fullName || verifiedUser.name || "Admin";

  // While we ask the server, don't trust the local role yet — this keeps
  // existing assigned admins (even with a stale pre-role local session)
  // from flashing a false "Not an admin".
  if (serverCheck.state === "checking" || serverCheck.state === "idle") {
    return (
      <section className="wrap members-page dash-wrap">
        <div className="sec-head reveal in">
          <span className="sec-no">★ admin</span>
          <h2>
            Checking <em>access…</em>
          </h2>
          <p>Verifying your admin assignment with the server — one moment.</p>
        </div>
        <div className="dash-gate reveal in">
          <div className="dash-gate-card">
            <span className="dash-sticker" aria-hidden="true">★ verifying</span>
            <p className="dash-hand">asking the server if you&apos;re on the admin list…</p>
          </div>
        </div>
      </section>
    );
  }

  if (serverCheck.state === "denied") {
    return (
      <section className="wrap members-page dash-wrap">
        <div className="sec-head reveal in">
          <span className="sec-no">★ admin</span>
          <h2>
            Access <em>restricted</em>
          </h2>
          <p>
            <b>{user.fullName || user.name || "Seedling"}</b>, only assigned admins can open this page.{" "}
            {serverCheck.error || "Your account is not on the admin list."}
          </p>
        </div>
        <div className="dash-gate reveal in">
          <div className="dash-gate-card">
            <span className="dash-sticker" aria-hidden="true">assigned admins only ★</span>
            <p className="dash-hand">if you should be an admin, ask an existing admin to add you via Add User.</p>
            <div className="members-cta">
              <a className="btn btn-clay" href="/dashboard">
                Back to dashboard →
              </a>
              <button className="btn btn-paper" type="button" onClick={onLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="wrap members-page dash-wrap">
      <div className="sec-head reveal in">
        <span className="sec-no">★ admin</span>
        <h2>
          Admin <em>greenhouse</em>
        </h2>
        <p>
          Welcome, <b>{fullName}</b> — post to the notice board, grow the admin crew, check your profile.
        </p>
      </div>

      <div className="dash-layout reveal in">
        <aside className="dash-side dash-side-plus">
          <div className="dash-profile">
            <span className="dash-avatar" aria-hidden="true">
              {(fullName || "A").trim().charAt(0).toUpperCase()}
            </span>
            <div className="dash-who">
              <b>{fullName}</b>
              <small>{verifiedUser.email || "—"}</small>
              <span className="dash-tag admin-tag">★ admin · verified</span>
            </div>
          </div>

          <nav aria-label="Admin sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={tab === t.id ? "dash-link active" : "dash-link"}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
              >
                <span aria-hidden="true">{t.icon}</span>
                {t.label}
              </button>
            ))}
            <a href="/pay-admin" className="dash-link">
              <span aria-hidden="true">₹</span>
              Payments dashboard
            </a>
            <a href="/dashboard" className="dash-link">
              <span aria-hidden="true">✿</span>
              Member dashboard
            </a>
            <a href="/members" className="dash-link">
              <span aria-hidden="true">❧</span>
              Members
            </a>
            <a href="/" className="dash-link">
              <span aria-hidden="true">←</span>
              Back to site
            </a>
          </nav>
          <button className="btn btn-paper" type="button" onClick={onLogout}>
            Log out
          </button>
        </aside>

        <div className="dash-main">
          <div className="dash-tabs" role="tablist" aria-label="Admin sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={tab === t.id ? "dash-tab active" : "dash-tab"}
                onClick={() => setTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {tab === "announcements" ? (
            <AnnouncementsTab />
          ) : tab === "verify" ? (
            <VerifyPassTab />
          ) : tab === "roster" ? (
            <ClubRosterTab />
          ) : tab === "plans" ? (
            <FuturePlansTab />
          ) : tab === "sports" ? (
            <SportsTab />
          ) : tab === "events" ? (
            <EventsTab />
          ) : tab === "results" ? (
            <ResultsTab />
          ) : tab === "add-user" ? (
            <AddUserTab />
          ) : (
            <ProfileTab sessionUser={verifiedUser} />
          )}
        </div>
      </div>
    </section>
  );
}
