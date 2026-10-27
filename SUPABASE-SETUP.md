# LearnPath Supabase deployment state

Fresh start approved by the user on 2026-10-27. Historical Firebase student records are not being migrated. No source records were deleted.

## Implemented

- Project `wrgkupncvgrcjsbfcqze`, eu-central-1; client uses a publishable key only.
- Native Supabase Google OAuth client with PKCE; Firebase SDK/config removed from the active index.
- Existing path-based workflows use authenticated database RPCs over a private JSON document. This preserves the existing catalog IDs, contracts, comments and all form fields without redesigning the map/UI.
- Private tables have RLS and no direct browser grants. Narrow RPCs check verified accounts, server-owned roles, enrollment, ownership, grouping and locks.
- Teacher bootstrap: verified Google account `dilay.sahin@bayetav.k12.tr`. All other accounts await teacher approval on Class Overview before reading class data.
- Rewards are calculated from saved records. Client amounts are ignored. Purchases debit and grant accessories atomically using the existing 21 prices.
- Previous state revisions are archived before mutations, including resets. Files remain in the private bucket after post deletion; signed downloads last one hour.
- Polling refresh every 3 seconds, paused in hidden tabs; no realtime publication changes required.

## Required configuration before publishing

1. Supabase dashboard: Authentication → Sign In / Providers → Google. Configure the Google Web OAuth client ID and secret in the dashboard, never in the frontend or chat.
2. Google Cloud OAuth client authorized origin: `https://dilayshn1206-sketch.github.io`.
3. Google authorized callback: `https://wrgkupncvgrcjsbfcqze.supabase.co/auth/v1/callback`.
4. Supabase Authentication URL configuration: Site URL and redirect allowlist must include `https://dilayshn1206-sketch.github.io/LearnPath/`. For local acceptance, temporarily add `http://localhost:8000/`.
5. Sign in as teacher and a separate synthetic student. Approve student, configure unit/catalog, test grouping, submission, review, reset/history, actual upload/download and sign-out. No real student answers should be fabricated.
6. GitHub browser upload permission verified working. Browser session is the repository owner; connector remains read-only and local Git lacks credentials.
7. Upload `index.html` and complete `assets/` to the existing repository after acceptance, using a branch/PR first. Existing main still equals `136d50494f8022474e93c9c31cc350fde7d40ded` at the last fetch. Never force push.

## Verified and unverified

- 24 regression checks / 3 local passes: PASS; persistence/auth mocked.
- Isolated Chromium visual tests: PASS via installed headless shell (24 sprite positions, 3000ms, reduced motion, pause, tablet/mobile overflow, keyboard and errors). Standard Chromium executable failed to spawn on this Windows host.
- PNG alpha: PASS, 24 unique RGBA 256px cells; all frame outer edges alpha=0.
- Adapter tests: PASS (RPC errors, immutable snapshots, private signed downloads/cache, unique IDs, update/delete dispatch).
- Real Supabase SQL tests with synthetic users in a rolled-back transaction: PASS (enrollment, role escalation prevention, ownership, private answers, grouping/locks, rewards/purchases, comments/notifications, reset archives, anonymous/direct access).
- Real Google OAuth: NOT TESTED; API settings observed `external.google=false`.
- Actual authenticated upload/download and cross-device login: NOT TESTED. Bucket requests 100MiB maximum; global/project Free-plan limits may be lower. Do not promise 100MiB uploads without verifying the project limit.
- Production deployment: NOT DONE. Runtime files uploaded to migration/supabase-grade6; main/live remain unchanged.
- Database is optimized for a small classroom, using a serialized document and revision archive; large-scale load and archive growth are not yet benchmarked.
- Security advisor reports INFO for private tables with RLS/no policies; deny-by-default is intentional. No direct table access is granted. This is not a full security audit of the inherited HTML renderer.

Do not run `supabase/backend.sql` again on this database; it is the assembled fresh-install schema. Changes already applied are recorded in remote migration history. Keep future changes in new migrations.
