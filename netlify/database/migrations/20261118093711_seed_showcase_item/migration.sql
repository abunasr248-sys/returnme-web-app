-- Public showcase tag used by the landing page ("See what a finder sees").
-- Must match SHOWCASE_TOKEN / SHOWCASE_CODE in src/lib/fixtures.ts.
INSERT INTO "profiles" ("owner_id", "email", "display_name", "notify_email")
VALUES ('showcase-owner', 'hidden', 'Rahul Varma', false)
ON CONFLICT ("owner_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "items" ("owner_id", "name", "category", "finder_note", "dropoff_instructions", "token", "short_code", "status", "created_at")
VALUES (
  'showcase-owner',
  'Green Water Bottle',
  'bottle',
  'Thanks for picking this up! It has my hostel room sticker on the bottom.',
  'Please hand it to the security desk at the main gate (Block A).',
  'rm7Qk2vXp9LbT4wZs8NdYa',
  'K7MPQ4',
  'safe',
  '2026-10-02T09:12:00.000Z'
)
ON CONFLICT DO NOTHING;
