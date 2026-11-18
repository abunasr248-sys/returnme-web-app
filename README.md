# ReturnMe

A mobile-first web app for college students, starting at VNR VJIET, Hyderabad. Each belonging gets a printed QR sticker. Anyone who scans it can notify the owner without an account, and the owner sees the alert in the app.

## What's in the app today
- **Landing page** at `/`, with a live example sticker and a "See what a finder sees" demo.
- **Owner app** at `/app` with bottom tabs:
  - **Items**: item cards, Safe/Lost badges, "Load sample items", add/edit, QR with PNG download, an A4 sticker-sheet PDF, regenerate QR, Test it, Simulate a scan, scan history, mute for 1 hour.
  - **Alerts**: newest first, unread highlight and badge, tap to mark read, map pins, refreshes every 15 seconds.
  - **Settings**: display name, the email alerts toggle, and Phase 2 features marked "Coming soon".
- **Finder page** at `/f/:token`: public and fast, shows the owner's first name only, with a notify form and tap-to-share location.
- **Backup code page** at `/f`.

> **Preview data:** accounts, items and scans are currently kept in your browser (seeded from `src/lib/fixtures.ts`) so the whole flow can be clicked through. Netlify Identity, Netlify Database and Netlify Functions come next; see [PLAN.md](./PLAN.md).

## Tech
React 19, Vite, Tailwind CSS v4, React Router, `qrcode` (QR codes generated in the browser), `jspdf` (sticker sheets), Leaflet with OpenStreetMap tiles, `vite-plugin-pwa`, and lucide icons. It's hosted on Netlify.

## Run locally
```bash
npm install
netlify dev   # or: npm run dev
```

## Roadmap
1. ✅ Product surface (this release)
2. Netlify Database schema (profiles, items, scans)
3. Netlify Identity sign-up and login
4. Owner API on Netlify Functions with per-owner checks
5. Public finder API with hashed-IP rate limiting and a honeypot
6. Optional email alerts
7. Hardening and polish

See [PLAN.md](./PLAN.md) for details.
