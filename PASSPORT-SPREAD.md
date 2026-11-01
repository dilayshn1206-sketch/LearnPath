# Learning Passport · 1 November 2026

Approved two-page passport presentation: current learner photo (initials on
missing/failed photo), name, topic, product and small target scores on the left;
three concise goal captions, original Compass and numbered steps on the right.
“View all my goals” keeps every original focus/project/custom goal accessible.
The fixed next-action box is removed. Existing section editing and confirmed-save
receipt remain. No stored goals, answers, grades, roles or map/sprite art change.

The share composer hides the fixed navigation even after session callbacks set
inline display, and reserves safe-area space. The floating passport tab stays
hidden while composing. Tests check actual button hit targets at 1024×768,
1024×520 and 390×660.

Notifications are keyboard-accessible buttons. Comment/teacher alerts open the
matching project with written feedback expanded; resources open Resources.
Older alerts use only a unique matching comment. Deleted or unresolvable targets
get an explicit message. Notification targets are IDs, never arbitrary URLs.

`supabase/notification-targets.sql` adds postId/commentId in the existing private
server function without changing its actor checks, ACL, search_path or records.
`tests/notification-targets.sql` verifies targets, read flags and denied forgery
inside a fully rolled-back synthetic transaction. Production function installed
and checked on 1 November 2026.

Verification: regression (35 checks × 4 passes), planner host/frame browser flow,
class/share/notification browser flow and synthetic database transaction passed.
Browser tests block all external requests and use mock persistence. They do not
claim live student uploads or actual learner comprehension were tested.
The strict static audit retains the same six pre-existing dynamic-handler false
positives; the affected controls have explicit bindings exercised by browser tests.

Runtime cache version: 20261101-1. Previous live main e0938a0 is retained in Git
and an external ZIP. A deployment is complete only when Pages reports success
and published runtime files match these sources.
