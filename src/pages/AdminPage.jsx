// Admin page — announcements board editor, dynamic add-user, admin profile.
// Route: /admin (wired in App.jsx). Only renders fully for admin accounts
// (role === "admin"); everyone else sees a gate. Posting here writes to
// /api/announcements, which the member dashboard (/dashboard) renders live.

import { useEffect, useState } from "react";
import { getLiveSession, isAdminUser, logout } from "../services/authService.js";
import { navigate } from "../services/router.js";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "../services/announcementsService.js";
import { createAdminUser, fetchAdminMe, fetchAdminUsers } from "../services/adminService.js";
import { calcAge, displayAge } from "../utils/age.js";

const TABS = [
  { id: "announcements", label: "Announcements", icon: "📢" },
  { id: "add-user", label: "Add User", icon: "＋" },
  { id: "profile", label: "Profile", icon: "❧" },
];

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

  return (
    <div className="admin-tab">
      <div className="join-card admin-card">
        <h3>Post an announcement 📢</h3>
        <p className="join-sub">Publishes instantly to the member dashboard (/dashboard) for every signed-in member.</p>
        {formError && (
          <p className="ev-formerror" role="alert">
            {formError}
          </p>
        )}
        <form onSubmit={onPost} noValidate>
          <label className="field auth-field" htmlFor="admin-ann-title">
            <span className="auth-label">Title</span>
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
          <label className="field auth-field" htmlFor="admin-ann-tag">
            <span className="auth-label">Tag (optional)</span>
            <input
              id="admin-ann-tag"
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. Play · Build · Gather"
              maxLength={40}
            />
          </label>
          <label className="field auth-field" htmlFor="admin-ann-body">
            <span className="auth-label">Message</span>
            <textarea
              id="admin-ann-body"
              className="admin-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What should every member know?"
              rows={4}
              maxLength={2000}
            />
            {fieldErrors.body && <span className="ev-error">{fieldErrors.body}</span>}
          </label>
          <div className="dash-play-row">
            <button className="btn btn-clay dash-btn" type="submit" disabled={busy}>
              {busy ? "Posting…" : "Post announcement →"}
            </button>
          </div>
        </form>
      </div>

      <div className="join-card admin-card">
        <h3>Live board ({items.length})</h3>
        <p className="join-sub">Exactly what members see on their dashboard. Edit or remove any post.</p>
        {loading ? (
          <p className="join-sub">Loading announcements…</p>
        ) : items.length === 0 ? (
          <div className="note-bar dash-note">
            <b>QUIET GROVE →</b>
            <span>No announcements yet. Post the first one above — it will sprout on /dashboard.</span>
          </div>
        ) : (
          <ul className="admin-list">
            {items.map((a) => (
              <li key={a.id} className="admin-item">
                {editingId === a.id ? (
                  <div className="admin-edit">
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={120} aria-label="Edit title" />
                    <input value={editTag} onChange={(e) => setEditTag(e.target.value)} maxLength={40} placeholder="Tag (optional)" aria-label="Edit tag" />
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
                    <div className="admin-item-top">
                      <b>{a.title}</b>
                      {a.tag && <span className="dash-tag">{a.tag}</span>}
                    </div>
                    <p className="admin-item-body">{a.body}</p>
                    <small className="admin-item-meta">
                      {formatDate(a.createdAt)}
                      {a.updatedAt && a.updatedAt !== a.createdAt ? ` · edited ${formatDate(a.updatedAt)}` : ""}
                    </small>
                    <div className="dash-play-row">
                      <button type="button" className="btn btn-paper dash-btn" onClick={() => startEdit(a)}>
                        Edit ✎
                      </button>
                      <button type="button" className="btn btn-paper dash-btn" onClick={() => onDelete(a.id)} disabled={busy}>
                        Delete ✕
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddUserTab() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
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
    setSuccess("");
    setBusy(true);
    const res = await createAdminUser({
      fullName,
      email,
      phone,
      birthDate: birthDate || undefined,
      password,
    });
    setBusy(false);
    if (!res.ok) {
      setErrors(res.errors || {});
      setFormError(res.formError || "Could not create the admin user — check the fields.");
      return;
    }
    setSuccess(`${res.user.fullName} is now an admin. They can log in and open /admin.`);
    setFullName("");
    setEmail("");
    setPhone("");
    setBirthDate("");
    setPassword("");
    refreshUsers();
  }

  return (
    <div className="admin-tab">
      <div className="join-card admin-card">
        <h3>Add user ＋</h3>
        <p className="join-sub">
          Creates a Firebase account <b>with admin powers</b> — the new admin can post announcements and add more
          admins. Age is computed from the birth date and increments every birthday.
        </p>
        {formError && (
          <p className="ev-formerror" role="alert">
            {formError}
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
          <div className="dash-play-row">
            <button className="btn btn-clay dash-btn" type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create admin →"}
            </button>
          </div>
        </form>
      </div>

      <div className="join-card admin-card">
        <h3>Admins & members ({users.length})</h3>
        <p className="join-sub">Updates live — every admin you add appears here with powers.</p>
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
                  {u.email || "—"} · {u.phone || "no phone"} · {u.birthDate ? `born ${u.birthDate} · age ${displayAge(u) ?? "—"}` : `age ${u.age ?? "—"}`}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
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
            <dd>★ admin</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default function AdminPage({ user }) {
  const [tab, setTab] = useState("announcements");

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
            Admin <em>grove gate</em>
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

  if (!isAdminUser(user)) {
    return (
      <section className="wrap members-page dash-wrap">
        <div className="sec-head reveal in">
          <span className="sec-no">★ admin</span>
          <h2>
            Not an <em>admin</em>
          </h2>
          <p>
            <b>{user.fullName || user.name || "Seedling"}</b>, this corner is for admins only. Your dashboard is
            waiting instead.
          </p>
        </div>
        <div className="dash-gate reveal in">
          <div className="dash-gate-card">
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

  const fullName = user.fullName || user.name || "Admin";

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
              <small>{user.email || "—"}</small>
              <span className="dash-tag admin-tag">★ admin</span>
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
          ) : tab === "add-user" ? (
            <AddUserTab />
          ) : (
            <ProfileTab sessionUser={user} />
          )}
        </div>
      </div>
    </section>
  );
}
