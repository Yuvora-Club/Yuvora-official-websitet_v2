// Shared bits for the event system. Reuses the Yuvora theme variables —
// no new palette, no new fonts.

export function DemoNotice({ text }) {
  return (
    <p className="ev-demo" role="note">
      <b>Demo ·</b> {text}
    </p>
  );
}

const STATUS_CLASS = {
  open: "ev-st-open",
  upcoming: "ev-st-upcoming",
  full: "ev-st-full",
  closed: "ev-st-closed",
  submitted: "ev-st-submitted",
  awaiting_payment: "ev-st-awaiting",
  awaiting_confirmation: "ev-st-awaiting",
  confirmed: "ev-st-open",
  rejected: "ev-st-full",
  cancelled: "ev-st-closed",
  refunded: "ev-st-upcoming",
  not_required: "ev-st-open",
  pending: "ev-st-awaiting",
  verified: "ev-st-open",
  failed: "ev-st-full",
};

export function StatusPill({ status, label }) {
  const cls = STATUS_CLASS[status] || "ev-st-awaiting";
  return <span className={`ev-status ${cls}`}>{label || status}</span>;
}

export function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <span className="ev-error" id={id} role="alert">
      {message}
    </span>
  );
}
