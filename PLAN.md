# ReturnMe roadmap

ReturnMe puts a QR sticker on a student's belongings. Anyone who scans it can notify the owner without an account, and the owner sees the alert in the app. The first campus is VNR VJIET, Hyderabad.

We start with the full clickable product, then connect it to real accounts, storage and APIs one milestone at a time. Every screen already talks to `src/lib/api.ts`, and its function signatures match the endpoints below, so each later milestone swaps a function body for a `fetch` and leaves the UI alone.

## Milestone 1: Product surface ✅ (done)
- Landing page, sign-up / log-in screens, owner app with bottom tabs (Items, Alerts, Settings).
- My Items list with category icons, Safe/Lost badges, last-scanned time, empty state and "Load sample items".
- Add / edit item; item detail with QR preview, PNG download, A4 sticker-sheet PDF (12 labels with backup code), "Regenerate QR code" with a warning, Safe/Lost toggle, "Test it", "Simulate a scan", per-item scan history with delete and "Mute for 1 hour".
- Alerts tab: newest first, unread highlight and badge, tap to mark read, Leaflet/OpenStreetMap pins, 15-second polling.
- Public finder page `/f/:token` (lost banner, first name only, note, drop-off, notify form with optional message/name/contact, tap-to-share location, honeypot, thank-you screen, inactive state) and backup-code page `/f`.
- Installable PWA (manifest and service worker).
- Data: a stubbed store kept in the browser, seeded from `src/lib/fixtures.ts`.

## Milestone 2: Netlify Database schema
- `db/schema.ts` with Drizzle and `@netlify/database`: `profiles`, `items` (unique `token`, unique `short_code`, `status` check `safe|lost`, `muted_until`), `scans` (`read` default false, `ip_hash`), plus a small `rate_events` table or index on `scans(item_id, ip_hash, scanned_at)` for rate limiting.
- Indexes: `items(owner_id)`, `scans(item_id, scanned_at desc)`.
- Migration generated with drizzle-kit.

## Milestone 3: Netlify Identity
- `@netlify/identity` for email/password sign-up, login, logout and password recovery; run the Identity enable script.
- Replace `signUp`, `logIn`, `logOut`, `currentUser` in `api.ts`. Remove the preview notice on the auth screen.
- On first login, create the `profiles` row (display name from sign-up).

## Milestone 4: Owner API (Netlify Functions)
All database access goes through functions in `netlify/functions/`, each with a `config.path` under `/api/`. Every handler verifies the Identity JWT and scopes every query by `owner_id`.
- `GET/PATCH /api/profile`
- `GET/POST /api/items`, `GET/PATCH/DELETE /api/items/:id`, `POST /api/items/:id/status`, `POST /api/items/:id/regenerate` (new 22-char token + 6-char code from `crypto.randomBytes`), `POST /api/items/:id/mute`
- `GET /api/alerts`, `POST /api/alerts/:id/read`, `POST /api/alerts/read-all`, `GET /api/items/:id/scans`, `DELETE /api/scans/:id`
- `POST /api/demo/sample-items`, `POST /api/items/:id/simulate-scan`

## Milestone 5: Public finder API
- `GET /api/found/:token` returns only `name, category, owner_first_name, finder_note, dropoff_instructions, status`.
- `GET /api/found/code/:code` resolves the backup code.
- `POST /api/found/:token/scan`: honeypot check, input length limits, salted SHA-256 IP hash (salt in an env var, raw IP never stored), max 5 scans per item per hour per hashed IP (429 with a friendly message), and silent save without an alert when the item is muted.
- Cache headers kept short so the finder page stays fast on phones.

## Milestone 6: Email alerts (optional)
- When a scan is saved and the owner has `notify_email` on, send a short email from the scan function (after the response). Uses an email provider API key stored only as a Netlify environment variable; ask the product owner for the key at this step. Skip if setup is complicated, since in-app alerts already work.

## Milestone 7: Hardening and polish
- Error and offline states for the PWA, the finder page served without the owner bundle (already split), Lighthouse pass on mid-range Android.
- Tests for ownership checks and rate limiting.

## Phase 2 (shown as "Coming soon" in Settings)
- Web push notifications
- Two-way anonymous chat between finder and owner
- Group / shared items
- Campus lost-and-found desk mode
