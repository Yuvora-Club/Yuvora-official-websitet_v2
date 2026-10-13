# Yuvora Event System — Setup & Backend Integration Guide

The event-registration journey is **UI-ready in demo mode**. Every service below is a
clearly-marked **mock adapter** backed by `localStorage` — nothing is permanent, no money
moves, no real passes are issued. The database team can connect the real backend **without
redesigning any UI**: keep the service function names and return shapes, swap the internals.

Demo keys used in this browser (safe to clear to reset the demo):

- `yuvora.v1.mock.users` — demo accounts (salted SHA-256 demo hash, browser-only)
- `yuvora.v1.mock.session` — current demo session
- `yuvora.v1.mock.applications` — demo applications + status history
- `yuvora.v1.mock.checkin` — demo scan log for the check-in preview

## Routes (no router dependency — see `src/services/router.js`)

| Path | Page | Notes |
|---|---|---|
| `/events` | `EventsPage` | Category filter, status badges |
| `/events/:id` | `EventDetailPage` | Detail + Apply entry; full/closed handled gracefully |
| `/login?next=…` / `/register?next=…` | `AuthPages` | Validation, show/hide password, demo labels |
| `/apply/:eventId` | `ApplyPage` | Requires sign-in; blocks duplicates |
| `/my-events` | `MyEventsPage` | Dashboard: statuses, payment panel, pass links |
| `/pass/:applicationId` | `SeedPassPage` | Owner-only, confirmation-gated, DEMO-labelled |
| `/check-in` | `CheckInPage` | **Not in public nav.** Organizer preview only |
| `/#join` | Home section | Old public pass generator **removed**; anchor kept so old links land on the new join panel |

The Members page (`src/pages/MembersPage.jsx`) and 404 page were **not modified**.

## Service contracts — exactly what the backend must provide

### `authService.js` → replace `mockAdapter` internals, keep signatures

- `register({name,email,phone,password,confirm}) → {ok, user? , errors? , mock?}`
- `login({email,password}) → {ok, user?, errors?, mock?}`
- `logout()`, `getSessionUser() → user|null`
- Proposed endpoints: `POST /api/auth/register`, `POST /api/auth/login`,
  `POST /api/auth/logout`, `GET /api/auth/session` (Bearer token).
- `User = { id, name, email, phone, createdAt }`. Passwords must be hashed
  **server-side** (bcrypt/scrypt/argon2). Firebase Auth is a drop-in alternative.

### `eventsService.js` → point at the event catalog

- `listEvents(category) → {events, mock, sample}`
- `getEvent(id) → {event, mock, sample}`
- `applyAvailability(event, now) → {canApply, status, reason}`
- Proposed: `GET /api/events`, `GET /api/events/:id`.
- `Event` shape is documented in `src/data/events.js`. Current rows are **SAMPLE
  DATA** (placeholder dates, venues, fees, seat counts) — replace contents freely.
- **No schema assumptions**: field names above are a proposal; adapt the service
  mapping to whatever the team builds.

### `applicationsService.js` → server must own state machine

- `listMyApplications(userId)`, `getApplication(id, userId)`,
  `findExistingApplication(userId, eventId)` (UI duplicate guard),
  `submitApplication({eventId, user, contact, paymentMethod})` (creates **pending**
  states only — never `confirmed`),
  `cancelApplication(id, userId)`,
  `mockOrganizerDecision` / `mockApplyPaymentResult` / `mockRetryPayment` are
  **demo-only** and must be deleted at integration.
- Proposed: `POST /api/applications` (409 on duplicate `(user,event)`),
  `GET /api/applications/mine`, `GET /api/applications/:id`,
  `POST /api/applications/:id/cancel`.
- **Backend must enforce**: unique `(userId, eventId)` for live applications; only
  organizer roles / verified webhooks may set `confirmed`, `rejected`, `refunded`.
- Statuses: `submitted · awaiting_payment · awaiting_confirmation · confirmed ·
  rejected · cancelled · refunded`.

### `paymentsService.js` → real provider + webhook

- `createMockIntent(application)`, `getMockIntent(id)`, `mockProviderWebhook`
  (demo-only, delete at integration), `retryMockPayment`,
  `paymentSummaryFor(application)`.
- **Rules**: no card fields exist anywhere; button clicks never verify payment.
  Real flow: `POST /api/payments/intent → {intentId, amountPaise, provider, keyId}`,
  provider webhook → backend (signature-verified) → application update.
- Per-event config (`payments: {online, onVisit}`) decides which options render.
  `on_visit` means *due at venue*, never *collected*.

### `seedPassService.js` → backend-issued credentials

- `passEligibility(application) → {eligible, reason}` mirrors organizer rules
  (`passRules: {requirePaymentVerified, allowPayOnVisitConfirmed}`); backend
  re-checks at issuance.
- `getDemoPassPreview` returns a **DEMO-marked preview** (`DEMO-…` marker,
  decorative grid). Delete at integration; call `GET /api/passes/:applicationId`
  instead → `{token(opaque), verifyUrl, status, participantName, eventId,
  referenceId, issuedAt}`.
- QR must encode the opaque `verifyUrl` (e.g. `/check-in?t=<token>`), **never**
  names/emails/phones. States: `active · used · cancelled · revoked`.
- Frontend treats screenshots as non-proof; the gate verifies with the backend.

### `checkInService.js` → organizer-gated verification

- `parseTokenInput(raw)`, `mockVerifyToken(token)`, `mockRecordDemoScan`,
  `mockResetDemoScans` — demo-only.
- Proposed: `POST /api/check-in/verify {token}` and `POST /api/check-in/confirm
  {token, eventId}` (organizer auth, idempotent, atomic consume).
- Backend must verify signature, event match, revocation, and **prevent double
  acceptance**. Results: `valid · already-used · cancelled · invalid · wrong-event`.

## What is intentionally NOT built

- No Firebase config exists in this project — none was added (per instructions).
- No payment gateway, no payment URLs, no card handling.
- No real QR issuance, no server-side check-in.
- No production database reads/writes; no secrets in frontend code.

## Verification checklist (all runnable now)

1. `node ./node_modules/vite/bin/vite.js build` — production build passes.
2. `node ./node_modules/oxlint/bin/oxlint` — lint passes.
3. Register validation errors, show/hide password, demo success + redirect.
4. Category filter across Play/Build/Gather; open/upcoming/full/closed badges.
5. Signed-out Apply → login → returned to event; duplicate apply blocked.
6. Payment panel: pending → simulated success/failed → retry; **no auto-success**.
7. Unconfirmed application shows locked pass with reason; confirmed + verified
   shows **DEMO-labelled** preview only.
8. Members page, footer socials, FAQ and all home sections render unchanged.
9. `/events`, `/my-events`, `/pass/:id`, `/check-in` load on direct navigation.
10. Mobile (≤980px): Events/My Events links visible; grids stack; forms usable.
