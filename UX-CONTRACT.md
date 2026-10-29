# LearnPath UI contract

## Canonical UI Map
| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Existing native select in index.html | Existing forms | Native OS popup | DOM regression |
| Form | Existing render and save functions in index.html | Original source + user notes | Student / teacher / reflection | Isolated mocked tests |
| Scrollbar | assets/learnpath.css | DESIGN.md | Forced colors | CSS audit |
| Toast | Existing toast() in index.html | Existing workflow | Success / guidance / failure | Mocked invalid-submit tests |
| CRUD | Existing Firebase functions in index.html | Existing storage paths and schema | Same save and navigation destinations | Source comparison + mock tests |

## Behavior ledger
- The approved Grade 6 planner/passport is rendered by `assets/planner.html`.
  Its same-origin bridge only requests actions; the authenticated module in
  `index.html` owns all Supabase reads/writes, student identity and permission
  checks. Messages from any other origin/window are ignored. No credential or
  session token is sent to the planner frame.
- Draft changes are coalesced and serialized through the existing contract
  update path. Submit flushes draft writes, validates goals/steps/percentages,
  sets pending while keeping editing available, waits for successful persistence, then shows
  the complete summary. Failures remain visible and never show a sent state.
- The passport starts with Goals; no redundant project confirmation step.
  Its persistent tab remains available during classroom activities. Grouping is
  for collaboration; pending/approved status and legacy edit flags do not gate
  the owner's edits. Editing an approved/submitted passport returns it to draft.
- Existing callbacks and identifiers own persisted behavior. UI helper does not
  import Firebase, issue requests, store answers, or write data.
- Home map reads the same completion booleans as the existing cards. Resources
  remain available independently. Passport access needs a chosen project, not grouping.
- Classroom step timers do not block navigation or owner saves. Teacher-triggered
  reflection forms remain available as before.
- The project catalog keeps every active teacher-defined entry and ID.
- Screen re-layout never resets responses or research records.
- New Grade 6 goals are additive/versioned; unversioned contracts keep old goals.
- Teacher targets remain percentages as stored. A 1–10 migration is out of scope.
- Existing sign-in, role selection, upload, comment moderation, and deletion
  policies stay in the original source. This visual patch does not redefine them.

## Scope of inherited debt

## Supabase transition (2026-10-27)
- Active runtime now uses Supabase; existing path identifiers and UI form owners remain.
- Browser role choice no longer grants access. The verified teacher Google account receives the server-owned teacher role; students require approval from Class Overview before accessing class records.
- New account approvals reuse existing card/form/button/toast styles and remain keyboard-accessible.
- Client roles have no direct data-table access. Database RPCs enforce ownership, enrollment, teacher-only approval and coin transactions. Project editing does not require a group or unlock.
- Resetting active records archives the previous revision. Removing a post retains its private research file.
- Backend acceptance and production limitations are recorded in SUPABASE-SETUP.md. Google OAuth and live upload still require account-level configuration and acceptance.
The original application uses browser confirmation dialogs for destructive
actions. This update does not change those actions or their authorization.
Do not claim the visual patch is a security or end-to-end production audit.

## Unit discovery and record exports (2026-10-28)
- `renderStep1Screen` and the existing teacher `renderTUnit` own unit discovery. New word inputs are native labelled checkboxes; grammar options are native buttons with visible selection and post-submit disabled state.
- Word choices save through the existing Supabase paths. Submission shows the unchecked words under “Words to learn” and saves their labels. Resubmission recomputes that list; reopening restores the last submitted list. All words selected produces a clear all-known message.
- Grammar submission requires an answer to every question. The original selected option and question snapshot are retained; incorrect answers show their supplied option-specific explanation through the shared `LearnPathUI.grammarFeedback` helper. The learner's live answers are never filled by automated UI testing.
- Teacher JPG processing retains preview-before-save behavior; a JPG up to 10 MB is reduced to at most 1100×1600 pixels before the existing unit save.
- `sheet_events` captures changed persisted input records transactionally. Google Sheets files are grouped by form type, retain versions and deleted-record payloads, and use a private revocable export capability. Keys remain outside public source and Google credentials remain user-controlled.
- Class Overview shows the observed Google acknowledgement, with an inactive/setup-needed state before the first successful sync. The local application working does not prove that Google files exist or that the live site has been deployed.
