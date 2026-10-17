// Standalone payments dashboard — unlocked with the ADMIN_PASSWORD_HASH
// password (NOT the Firebase admin login). Lists team entry-fee orders and
// lets the crew Confirm / Reject / flag refunds. Route: /pay-admin.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearPayAdminToken,
  downloadPayOrdersCsv,
  getPayAdminToken,
  getPaySummary,
  listPayOrders,
  payAdminLogin,
  payAdminLogout,
  setPayOrderStatus,
} from "../services/payService.js";

const STATUS_FILTERS = ["", "Pending", "Confirmed", "Rejected", "Expired", "NeedsRefund", "Refunded"];

function money(n) {
  const v = Number(n);
  return Number.isFinite(v) ? `₹${v.toFixed(2)}` : "—";
}

function when(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function PayAdminPage() {
  const [authed, setAuthed] = useState(() => !!getPayAdminToken());
  const [password, setPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginErr, setLoginErr] = useState("");
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [received, setReceived] = useState({});
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [o, s] = await Promise.all([listPayOrders(filter), getPaySummary()]);
    setLoading(false);
    if (!o.ok) {
      if (o.status === 401 || o.sessionExpired) {
        clearPayAdminToken();
        setAuthed(false);
        return;
      }
      setNotice(o.formError || "Could not load orders.");
      return;
    }
    setOrders(o.orders);
    if (s.ok) setSummary(s);
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    if (authed) load();
  }, [authed, load]);

  function refresh() {
    setLoading(true);
    void load();
  }

  async function onLogin(e) {
    e.preventDefault();
    setLoginErr("");
    setLoginBusy(true);
    const res = await payAdminLogin(password);
    setLoginBusy(false);
    if (!res.ok) {
      setLoginErr(res.formError || "Login failed.");
      return;
    }
    setPassword("");
    setAuthed(true);
  }

  async function onLogout() {
    await payAdminLogout();
    setAuthed(false);
    setOrders([]);
    setSummary(null);
  }

  async function act(order, status) {
    let note = "";
    if (status === "Confirmed") {
      const got = received[order.id];
      if (got !== undefined && got !== "" && Number(got) !== Number(order.expectedAmount)) {
        const ok = window.confirm(
          `Amount differs: expected ${money(order.expectedAmount)} but received ${money(got)}.\nConfirm anyway?`
        );
        if (!ok) return;
        note = `received ${got}`;
      }
    } else if (status === "Rejected" || status === "NeedsRefund" || status === "Refunded") {
      note = window.prompt(`Note for marking ${order.orderRef} ${status}? (optional)`) || "";
    }
    setBusyId(order.id);
    setNotice("");
    const res = await setPayOrderStatus(order.id, status, note);
    setBusyId("");
    if (!res.ok) {
      setNotice(res.formError || "Could not update the order.");
      return;
    }
    setNotice(`${order.orderRef} → ${status}.`);
    refresh();
  }

  async function onCsv() {
    try {
      await downloadPayOrdersCsv();
    } catch (err) {
      setNotice(err?.message || "CSV download failed.");
    }
  }

  const counts = useMemo(() => summary?.counts || {}, [summary]);

  if (!authed) {
    return (
      <section className="wrap members-page dash-wrap">
        <div className="sec-head reveal in">
          <span className="sec-no">₹ payments</span>
          <h2>
            Payments <em>dashboard</em>
          </h2>
          <p>Enter the crew password to reconcile team entry fees. Separate from your member login.</p>
        </div>
        <div className="dash-gate reveal in">
          <div className="dash-gate-card">
            <span className="dash-sticker" aria-hidden="true">crew only ₹</span>
            <form className="auth-form" onSubmit={onLogin} noValidate>
              {loginErr && (
                <p className="ev-formerror" role="alert">
                  {loginErr}
                </p>
              )}
              <label className="field auth-field" htmlFor="payadmin-pass">
                <span className="auth-label">Dashboard password</span>
                <input
                  id="payadmin-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </label>
              <button type="submit" className="btn btn-clay dash-btn" disabled={loginBusy || !password}>
                {loginBusy ? "Checking…" : "Unlock dashboard →"}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="wrap members-page dash-wrap">
      <div className="sec-head reveal in">
        <span className="sec-no">₹ payments</span>
        <h2>
          Entry-fee <em>reconciliation</em>
        </h2>
        <p>Confirm UPI payments by matching the exact amount here to the amount in the club account.</p>
      </div>

      <div className="dash-play-row" style={{ marginTop: 0 }}>
        <button type="button" className="btn btn-paper dash-btn" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh ↻"}
        </button>
        <button type="button" className="btn btn-paper dash-btn" onClick={onCsv}>
          Download CSV ↓
        </button>
        <button type="button" className="btn btn-paper dash-btn" onClick={onLogout}>
          Lock dashboard
        </button>
      </div>

      {notice && <p className="ev-success" role="status">{notice}</p>}

      {summary && (
        <div className="payadmin-cards">
          <div className="join-card payadmin-card">
            <small>Confirmed</small>
            <b>{counts.Confirmed || 0}</b>
          </div>
          <div className="join-card payadmin-card">
            <small>Pending</small>
            <b>{counts.Pending || 0}</b>
          </div>
          <div className="join-card payadmin-card">
            <small>Total collected</small>
            <b>{money(summary.totalCollected)}</b>
          </div>
          <div className="join-card payadmin-card">
            <small>All orders</small>
            <b>{summary.totalOrders || 0}</b>
          </div>
        </div>
      )}

      <div className="dash-tabs" role="tablist" aria-label="Filter orders">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s || "all"}
            type="button"
            role="tab"
            aria-selected={filter === s}
            className={filter === s ? "dash-tab active" : "dash-tab"}
            onClick={() => setFilter(s)}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading && orders.length === 0 ? (
        <p className="join-sub">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="notice-empty">
          <span className="notice-empty-leaf" aria-hidden="true">₹</span>
          <b>No orders{filter ? ` in ${filter}` : ""} yet.</b>
          <p>When a captain creates an entry-fee order it lands here.</p>
        </div>
      ) : (
        <div className="payadmin-table-wrap">
          <table className="payadmin-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Ref</th>
                <th>Team / event</th>
                <th>Captain</th>
                <th>Players</th>
                <th>Expected</th>
                <th>Received</th>
                <th>UTR</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{when(o.createdAt)}</td>
                  <td className="pay-ref">{o.orderRef}</td>
                  <td>
                    <b>{o.teamName}</b>
                    <br />
                    <small>{o.eventTitle || o.eventId} · {o.sportName || o.sportId}</small>
                  </td>
                  <td>
                    {o.captainName}
                    <br />
                    <small>{o.captainPhone || "—"} · {o.captainEmail || "—"}</small>
                  </td>
                  <td>{o.playerCount}</td>
                  <td className="payadmin-amt">{money(o.expectedAmount)}</td>
                  <td>
                    <input
                      className="payadmin-input"
                      value={received[o.id] ?? ""}
                      onChange={(e) => setReceived((r) => ({ ...r, [o.id]: e.target.value }))}
                      placeholder="₹"
                      inputMode="decimal"
                      aria-label={`Amount received for ${o.orderRef}`}
                    />
                  </td>
                  <td>{o.utr || "—"}</td>
                  <td>
                    <span className={`pay-status ${String(o.status).toLowerCase()}`}>{o.status}</span>
                  </td>
                  <td>
                    <div className="payadmin-actions">
                      {o.status !== "Confirmed" && (
                        <button type="button" className="btn btn-clay dash-btn" disabled={busyId === o.id} onClick={() => act(o, "Confirmed")}>
                          Confirm ✓
                        </button>
                      )}
                      {o.status === "Pending" && (
                        <button type="button" className="btn btn-paper dash-btn" disabled={busyId === o.id} onClick={() => act(o, "Rejected")}>
                          Reject ✕
                        </button>
                      )}
                      {o.status !== "NeedsRefund" && o.status !== "Refunded" && (
                        <button type="button" className="btn btn-paper dash-btn" disabled={busyId === o.id} onClick={() => act(o, "NeedsRefund")}>
                          Refund?
                        </button>
                      )}
                      {o.status === "NeedsRefund" && (
                        <button type="button" className="btn btn-paper dash-btn" disabled={busyId === o.id} onClick={() => act(o, "Refunded")}>
                          Refunded
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
