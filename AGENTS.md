# AGENTS.md

**Continue from [PLAN.md](./PLAN.md).** Milestone 1 (the product surface) is complete. Start with the next unchecked milestone.

## Architecture
- Plain React + Vite SPA (no SSR framework). `netlify.toml` builds with `npm run build`, publishes `dist`, and has an SPA fallback redirect. The user asked for **Netlify Functions** for the API, so put endpoints in `netlify/functions/*.mts` with `config.path` under `/api/...` (path-configured functions take precedence over the SPA redirect). The PWA service worker denylists `/api/` from navigation fallback.
- `src/lib/api.ts` is the **only** data layer. It is currently a stub backed by `localStorage` (key `returnme-preview-v1`) and seeded from `src/lib/fixtures.ts`. Its exported function names and shapes map 1:1 to the planned endpoints in PLAN.md. Replace bodies with `fetch` calls; keep signatures so the UI doesn't change. Throw `ApiError(message, status)` with user-friendly messages; the UI displays `error.message` directly.
- `src/lib/session.tsx`: `SessionProvider` (current user) and `AlertsProvider` (polls `listAlerts` every 15 s while the tab is visible; also feeds the unread badge). Pages re-fetch when `alerts` changes.
- `src/lib/qr.ts`: QR data URLs, PNG export (canvas), A4 sticker sheet (jspdf, dynamically imported). The URLs encode `${origin}/f/${token}`.
- `src/lib/types.ts`: domain types that mirror the planned DB tables. `PublicItem` is the only shape a finder may receive.

## Key directories
- `src/pages/finder/`: public finder pages. They are **eagerly bundled** in `App.tsx` for speed on phones; keep them light (no Leaflet or jspdf imports).
- `src/pages/app/`: owner screens (lazy-loaded) under `OwnerLayout` (auth guard and bottom tabs).
- `src/components/ui.tsx`: Button, Field, inputCls, StatusBadge, CategoryIcon/CATEGORIES, Skeleton, Sheet, Toaster/toast, ComingSoon, Logo.
- `src/components/ScanCard.tsx`: shared by Alerts and item scan history; lazy-loads `MapPin.tsx` (Leaflet, with a divIcon to avoid marker image paths).

## Conventions
- Design tokens are in `src/index.css` `@theme` (paper, pine, marigold, alarm, leaf). Fonts: Bricolage Grotesque (display) and Figtree (body). Big touch targets (h-12 to h-16), rounded-2xl and up.
- Privacy rules: finders get the owner's first name only; never send email, phone or full name to `/f`. Location is only sent after the finder taps "Share my location". Never store raw IPs (hash with a salt server-side).
- Tokens: 22-char base62 from a CSPRNG; short codes: 6 chars from `A–Z` and `2–9` without `0/O/1/I`.
- No emojis in UI copy. Keep features to what PLAN.md lists.
