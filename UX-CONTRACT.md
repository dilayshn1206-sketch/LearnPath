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
- Existing callbacks and identifiers own persisted behavior. UI helper does not
  import Firebase, issue requests, store answers, or write data.
- Home map reads the same completion booleans as the existing cards. Resources
  remain available independently. Contract access still depends on grouping.
- Live teacher sessions block map navigation to avoid bypassing session locks.
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
- Client roles have no direct data-table access. Database RPCs enforce ownership, group/approval locks and coin transactions.
- Resetting active records archives the previous revision. Removing a post retains its private research file.
- Backend acceptance and production limitations are recorded in SUPABASE-SETUP.md. Google OAuth and live upload still require account-level configuration and acceptance.
The original application uses browser confirmation dialogs for destructive
actions. This update does not change those actions or their authorization.
Do not claim the visual patch is a security or end-to-end production audit.
