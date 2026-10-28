# LearnPath Supabase deployment state

## Latest draft update — 2026-10-28

- Owner-supplied unit content installed without replacing unrelated teacher metadata: 29 word-only choices and five questions, key c/a/b/d/a, exact option-specific feedback. Teacher JPG preview/save retained with JPG/size checks. Submitted unchecked vocabulary appears as “Words to learn”, including reopen/resubmit/all-known behavior.
- Local acceptance: 35 regression checks / four passes, including an explicit masked-key clipboard button; Chromium checks now include this unit, checkbox selection, incomplete-answer blocking, all five wrong-answer explanations, responsive feedback, and teacher JPG processing/save/student display. Actual learner answers were not auto-filled by tests.
- Real school Google sign-in **verified** for `dilay.sahin@bayetav.k12.tr`: server teacher role/enrollment and Class Overview observed. Gmail student role remains separate.
- `append_only_sheets_export_queue` migration applied. Ten categories queue transactionally, with retained versions/deleted payloads. Export SQL and isolated Apps Script retry/deduplication/escaping tests passed; existing backend SQL acceptance passed again after adding the trigger (synthetic fixtures rolled back).
- **Google Sheets activated at 16:53 Istanbul:** the user saved the export key and completed Google consent; setup and first real sync succeeded. Ten native spreadsheets were observed in the 1206 Gmail account, and the vocabulary spreadsheet had populated records and private sharing. Supabase acknowledged event 31, matching the latest event at verification. The `syncLearnPath` time trigger is configured for every five minutes; its first independent scheduled execution has not yet been observed. The Drive connector itself still points to the other account, so verification used Chrome in the correct account. See `integrations/google-sheets/README.md` for the verified folder and recovery details.
- All UI changes remain local drafts. GitHub main/live have not been updated.

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

- 35 regression checks / 4 local passes: PASS; persistence/auth mocked.
- Isolated Chromium visual tests: PASS via installed headless shell (24 sprite positions, 3000ms, reduced motion, pause, tablet/mobile overflow, keyboard and errors). Standard Chromium executable failed to spawn on this Windows host.
- PNG alpha: PASS, 24 unique RGBA 256px cells; all frame outer edges alpha=0.
- Adapter tests: PASS (RPC errors, immutable snapshots, private signed downloads/cache, unique IDs, update/delete dispatch).
- Real Supabase SQL tests with synthetic users in a rolled-back transaction: PASS (enrollment, role escalation prevention, ownership, private answers, grouping/locks, rewards/purchases, comments/notifications, reset archives, anonymous/direct access).
- Real Google OAuth: PASS for dilayshn1206@gmail.com as student, and dilay.sahin@bayetav.k12.tr as teacher. Both native Supabase users and their distinct server roles were verified. Teacher Class Overview opened on 2026-10-28. Production callback/allowlist and authenticated file upload still need acceptance before deployment.
- Actual authenticated upload/download and cross-device login: NOT TESTED. Bucket requests 100MiB maximum; global/project Free-plan limits may be lower. Do not promise 100MiB uploads without verifying the project limit.
- Production deployment: NOT DONE. Runtime files uploaded to migration/supabase-grade6; main/live remain unchanged.
- Database is optimized for a small classroom, using a serialized document and revision archive; large-scale load and archive growth are not yet benchmarked.
- Security advisor reports INFO for private tables with RLS/no policies; deny-by-default is intentional. No direct table access is granted. This is not a full security audit of the inherited HTML renderer.

Do not run `supabase/backend.sql` again on this database; it is the assembled fresh-install schema. Changes already applied are recorded in remote migration history. Keep future changes in new migrations.

Pending-account screen now supports Use another Google account. OAuth explicitly requests account selection; sign-out is local to the current session. Runtime entry uses a versioned backend module URL to avoid stale browser cache. These latest account-switch changes are local pending upload to the existing GitHub preparation branch.
