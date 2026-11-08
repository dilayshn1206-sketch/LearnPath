# Targeted guided learning release

Based on teacher review notes (4), revision 11. Eligibility identities are held
only in the private Supabase allowlist, deliberately absent from this repository.
The three designated accounts do not yet have registered Auth users. Their
verified Google sign-in and the existing teacher approval flow remain required.

## Behaviour

- Three everyday digital-life topics; three visual-first products with other
  formats behind an explicit disclosure. Teacher catalog edits and links remain.
- Three simple tool choices; three visible help areas plus speaking on demand.
- Exactly two of three project goals, including five unit words. One to three
  checkbox plan actions, without retyping.
- The same real passport, save, send, edit, resume and navigation bridge.
- Five self/peer questions, two explicit endings, high choice first, 3/1 SVG stars.
  Short editable written-feedback prompts; help does not choose a score.
- Default calm motion for supported accounts; the approved animation release and
  24-frame/3-second sprite remain unchanged for standard accounts.

## Data and access

`lp_learning_support()` has no account parameter and returns only the caller's
variant. It checks the exact private email, email confirmation, Google provider
from trusted app metadata and student membership. It does not use display names
or editable user metadata. No existing learner records are rewritten.

Versioned goals: `grade6-support-goals-20261108-v1`.
Versioned rubric: `grade6-support-binary-20261108-v1`; stored 0/1, points 1/3.
Feedback averages remain separate by version. Existing four/three-step records
retain their instrument and descriptors. The backend enforces supported
requirements only for the eligible caller; standard minimums remain unchanged.

## Validation

- `tests/learning-support.cjs`: production host/frame flow, choices, goal limits,
  checkbox plan, send/reopen, versioned self save, peer selector and written
  prompts, separate score groups; fictional records, no external network.
- `tests/support-authorization.sql`: rollback-only database checks for all private
  allowlist entries, unverified/non-Google rejection, metadata spoofing, supported
  save, invalid score rejection and unchanged standard minimums.
- Existing regression, rubric, planner, catalog, teacher workspace, feed and
  Supabase adapter checks pass. School-account end-to-end login is pending the
  actual learners' first sign-in; tests do not claim to impersonate those users.

The local 14-page comparison panel retains previous versions and review notes.
Changes can be reversed through Git history and by disabling the private
allowlist; saved response versions must remain readable during any rollback.
