// Captain-only entry-fee payment panel. Renders inside a team card on the
// member Sports board. The fee + expected amount come from the backend — the
// browser never sets or edits them. Payments stay dormant (no link/QR) until
// the crew sets a real UPI_ID.

import { useCallback, useEffect, useRef, useState } from "react";
import { createTeamOrder, getTeamPayment, submitUtr } from "../services/payService.js";

function money(n) {
  const v = Number(n);
  return Number.isFinite(v) ? `₹${v.toFixed(2)}` : "—";
}

function TurnstileWidget({ siteKey, onToken }) {
  const host = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    let disposed = false;
    function render() {
      if (disposed || !host.current || !window.turnstile) return;
      try {
        widgetId.current = window.turnstile.render(host.current, {
          sitekey: siteKey,
          callback: (token) => onToken(token),
          "error-callback": () => onToken(""),
          "expired-callback": () => onToken(""),
        });
      } catch {
        /* render can fail if the script raced — ignore */
      }
    }
    if (window.turnstile) {
      render();
    } else {
      let script = document.getElementById("cf-turnstile-script");
      if (!script) {
        script = document.createElement("script");
        script.id = "cf-turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }
    return () => {
      disposed = true;
      try {
        if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      } catch {
        /* ignore */
      }
    };
  }, [siteKey, onToken]);

  return <div className="pay-turnstile" ref={host} />;
}

export default function TeamPayment({ teamId, paid, onChanged, setMsg }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [utr, setUtr] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    const res = await getTeamPayment(teamId);
    if (!res.ok) {
      setData(null);
      setLoading(false);
      return;
    }
    setData(res);
    if (res.order && res.order.utr) setUtr(res.order.utr);
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    load();
  }, [load, paid]);

  const onToken = useCallback((t) => setCaptchaToken(t), []);

  async function onCreate() {
    setMsg({ type: "", text: "" });
    setBusy(true);
    const res = await createTeamOrder(teamId, { captchaToken });
    setBusy(false);
    if (!res.ok) {
      setMsg({ type: "error", text: res.formError || "Could not start the payment." });
      return;
    }
    setData((d) => (d ? { ...d, order: res.order } : d));
    setMsg({ type: "success", text: "Payment order created — follow the UPI steps below." });
  }

  async function onSubmitUtr(e) {
    e.preventDefault();
    if (!data?.order) return;
    setMsg({ type: "", text: "" });
    setBusy(true);
    const res = await submitUtr(data.order.id, utr);
    setBusy(false);
    if (!res.ok) {
      setMsg({ type: "error", text: res.formError || "Could not save the UTR." });
      return;
    }
    setData((d) => (d ? { ...d, order: res.order } : d));
    setMsg({ type: "success", text: "UTR saved — the crew will confirm your payment." });
    onChanged();
  }

  async function copy(text, which) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(""), 1400);
    } catch {
      /* clipboard blocked */
    }
  }

  if (loading) return <p className="join-sub">Checking entry fee…</p>;
  if (!data || !data.isCaptain) return null;

  if (data.paid) {
    return (
      <div className="pay-panel pay-paid">
        <b>✓ Entry fee paid</b>
        <p className="join-sub">
          {money(data.baseAmount)} for <b>{data.teamName}</b>{data.paidAt ? ` · cleared ${new Date(data.paidAt).toLocaleDateString()}` : ""}
        </p>
      </div>
    );
  }

  const order = data.order;
  const pending = order && order.status === "Pending";

  return (
    <div className="pay-panel">
      <div className="pay-head">
        <span className="dash-sticker" aria-hidden="true">₹ entry fee</span>
        <b>{money(data.baseAmount)}</b>
        <small className="join-sub">
          {data.playerCount} player{data.playerCount === 1 ? "" : "s"} · {data.eventTitle || "event"}
        </small>
      </div>

      {!data.paymentsOpen && (
        <p className="pay-notice">
          ⏳ Payments are opening soon. Your order is saved as <b>Pending</b> — the crew will share UPI details shortly.
        </p>
      )}

      {!order ? (
        <>
          <p className="join-sub">
            Only the captain pays. Create the order, then pay by UPI and enter your UTR.
          </p>
          {data.captchaSiteKey && <TurnstileWidget siteKey={data.captchaSiteKey} onToken={onToken} />}
          <div className="dash-play-row">
            <button type="button" className="btn btn-clay dash-btn" disabled={busy || (!!data.captchaSiteKey && !captchaToken)} onClick={onCreate}>
              {busy ? "Creating…" : "Create payment order →"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="pay-order-top">
            <span className="pay-ref">{order.orderRef}</span>
            <span className={`pay-status ${order.status.toLowerCase()}`}>{order.status}</span>
          </div>

          {pending ? (
            <>
              <div className="pay-amount">
                <span>Pay exactly</span>
                <b>{money(order.expectedAmount)}</b>
                <small className="pay-paise">includes {order.uniquePaise} paise — this exact amount identifies your team</small>
              </div>

              {data.paymentsOpen && order.upiLink ? (
                <>
                  <div className="pay-upi">
                    <div>
                      <span className="pay-mini">UPI ID</span>
                      <button type="button" className="pay-copy" onClick={() => copy(data.upiId || "", "upi")}>
                        {data.upiId} {copied === "upi" ? "✓" : "⧉"}
                      </button>
                    </div>
                    <a className="btn btn-clay dash-btn" href={order.upiLink}>Open in UPI app →</a>
                  </div>
                  {order.qrDataUrl && (
                    <div className="pay-qr">
                      <img src={order.qrDataUrl} alt={`UPI QR for ${order.orderRef}`} width={220} height={220} />
                      <small className="pay-mini">Scan with any UPI app</small>
                    </div>
                  )}
                </>
              ) : (
                <p className="pay-notice">UPI link + QR appear here once the crew sets the club UPI ID.</p>
              )}

              <form className="pay-utr" onSubmit={onSubmitUtr}>
                <label className="field auth-field join-field" htmlFor={`utr-${teamId}`}>
                  <span className="auth-label">UPI reference (UTR) — 12 digits</span>
                  <input
                    id={`utr-${teamId}`}
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    inputMode="numeric"
                    placeholder="e.g. 40231xxxxxxx"
                    maxLength={12}
                  />
                </label>
                <div className="dash-play-row">
                  <button type="submit" className="btn btn-clay dash-btn" disabled={busy || utr.length !== 12}>
                    {busy ? "Saving…" : order.utr ? "Update UTR ✓" : "Save UTR ✓"}
                  </button>
                  <button type="button" className="btn btn-paper dash-btn" disabled={busy} onClick={load}>
                    Refresh ↻
                  </button>
                </div>
                {order.utr && <p className="join-sub">Saved UTR <b>{order.utr}</b> — awaiting crew confirmation.</p>}
                {data.refundNote && <p className="auth-hint">{data.refundNote}</p>}
              </form>
            </>
          ) : (
            <>
              <p className="join-sub">
                This order is <b>{order.status}</b>. {order.notes ? `Note: ${order.notes}` : ""}
              </p>
              {(order.status === "Expired" || order.status === "Rejected") && (
                <div className="dash-play-row">
                  <button type="button" className="btn btn-clay dash-btn" disabled={busy} onClick={onCreate}>
                    {busy ? "Starting…" : "Start a fresh order →"}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
