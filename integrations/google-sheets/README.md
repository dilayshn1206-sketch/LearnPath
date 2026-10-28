# LearnPath Google Sheets sync

Status on 2026-10-28 at 16:53 Istanbul: **activated and first real sync verified**. The user saved the valid export capability and completed Google's authorization in `dilayshn1206@gmail.com`. `setupLearnPath` completed successfully. All ten native Sheets files were observed in the correct Google Drive account, the vocabulary file opened privately with a populated `Kayıtlar` sheet, and the `syncLearnPath` trigger was observed with a five-minute interval. Supabase acknowledged event ID 31 (latest event at verification). The scheduled trigger's first independent run is not yet observed; the initial setup/manual sync passed.

Verified folder: https://drive.google.com/drive/folders/1ZiVIiJnEIwajdblZNvx8M9ZcbvUFsvVk

Prepared project: https://script.google.com/home/projects/1PRouZ20DlUAiKaZWJyn2Y39wylYkmFddQF2Hb-kOvNgoEmYueKxLqBJl/edit

## One-time activation

1. Sign in to the local LearnPath teacher panel using `dilay.sahin@bayetav.k12.tr`.
2. Class Overview → Google Sheets records → Set up Google Sheets → Create export key → Anahtarı kopyala. Copy it once; do not send it in chat or commit it. Do not repeat setup or rotate the key after successful activation unless recovery is necessary.
3. In the private Apps Script project owned by `dilayshn1206@gmail.com`, open Project Settings → Script Properties. Add `LP_EXPORT_KEY` with that key. The user should enter this credential themselves.
4. Select `setupLearnPath` and Run. Review/approve Google's permissions as the 1206 account. This private script uses Drive to create/find its folder and move its files, Sheets to write responses, URL Fetch for the export RPC, email to verify the owner, and ScriptApp for its five-minute trigger. The DriveApp implementation requests the broad Drive scope; do not authorize it silently.
5. Verify ten native Sheets files in `ChatGPT/LearnPath öğrenci kayıtları`, a successful run, a `syncLearnPath` time trigger, and the teacher panel's last-sync timestamp. Keep files and script private.

No public web-app deployment, OAuth client secret, Google password or Supabase service-role key is needed. The one-year export capability can only read the response queue and acknowledge a cursor. A teacher can rotate or disable it. Rotating preserves the export cursor and existing files. Stopping the script's trigger does not revoke its key: disable it in LearnPath too.

## Records

Each category has a separate spreadsheet: learning contracts, diaries, self assessments, peer assessments, teacher assessments (including plan feedback), project-end reflections, vocabulary before/after, grammar before/after, shared projects, and remaining persisted student inputs (resources, profile choices, likes). Initial project-choice questionnaire answers remain in the complete learning contract.

The database queues current active records as a baseline, then captures each changed persisted record in the same transaction as the application write. Earlier Firebase data is not imported; older pre-queue Supabase revisions remain in the existing research history. An active-record deletion produces an export event with its last payload, rather than deleting spreadsheet rows. Files are retained privately in Supabase; the export includes stable file paths, not file bytes or expiring signed URLs.

Each row contains the student, actor, form/record ID, timestamp, operation, field path, question/context and answer. Long answers are split into numbered 30,000-character chunks. Arrays/rubric indices and source question snapshots remain available. Text that resembles a formula is escaped. No synthetic learner responses should be added to real Sheets during testing.

## Recovery and limits

Successful writes advance `LP_CURSOR`; row identities allow a partial failed batch to retry without duplication. A script lock prevents concurrent timer/manual runs. Export errors are recorded in `LP_LAST_ERROR`, and Apps Script execution history provides diagnostics. `LP_LAST_SUCCESS` records the last completed run. Ten files are created lazily by the setup workflow; setup is repeatable and does not remove records or existing files. Avoid manual edits to the headers or row identity column.

The five-minute schedule is approximate and subject to Google's trigger timing/quotas. Runs stop after roughly 200 seconds and continue the next time. Classroom-scale operation is intended; large archives, spreadsheet cell limits, the all-ID deduplication read, and very large batches have not been benchmarked. Do not claim a perpetual/unlimited sync guarantee.

## Verification

- `tests/sheets-export.sql`: actual Postgres transaction, rolled back; all ten categories, ownership mapping, updates/removal, no-op deduplication, private table grants, invalid/revoked capability, bounded ordered pagination.
- `tests/sheets-script.cjs`: isolated Apps Script mocks; partial write recovery, cursor advancement, row deduplication, long-answer preservation, formula escaping, wrong-account rejection.
- Real Google authorization, ten-file creation, populated vocabulary cell readback, database acknowledgement and five-minute trigger configuration: verified on 2026-10-28. No synthetic responses were added to the real spreadsheets.
