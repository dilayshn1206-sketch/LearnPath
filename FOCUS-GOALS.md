# Editable focus goals · 1 November 2026

The passport shows each selected project goal once, in its original full wording,
above the three focus goals. Repeated short captions and the duplicate View all
list are removed. The existing Compass remains beside the goals.

Focus goals are prefilled from the saved What feels hardest choice, then editable
as three labelled fields in Edit my goals. Original project-goal counts remain.
Edits save to the existing weaknessTips field, so class plans, teacher-facing
records, project snapshots, export records and share reminders read the revised
text. Changing a submitted focus goal returns the passport to draft. Existing
records are not bulk edited, and prior revisions remain archived.

Private function patch: supabase/editable-focus-goals.sql. It adds the single
owner-editable field, validates three strings (up to 500 characters each), allows
unfinished drafts and rejects empty submitted goals. Identity, role, peer and
teacher authorization stay unchanged. Synthetic rollback verification:
tests/editable-focus-goals.sql. Host validation and escaped UI text also apply.

Verified with isolated planner and feed browser tests, regression checks and a
fully rolled-back database transaction. Tests cover prefill, actual text editing,
send/reopen, unchanged project goals/plan/scores, malformed input, edited pending
status and rejection of cross-student edits. No real learner answer was changed.

Cache version 20261101-2. Previous live main 6f2acce remains in Git and an external
ZIP backup. Local learning-diversity demos remain separate and unpublished.
