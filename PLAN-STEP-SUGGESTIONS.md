# Difficulty choice → editable plan actions

The user's final clarification supersedes FOCUS-GOALS.md: the three tips from
What feels hardest belong in Step 1, Step 2 and Step 3, alongside Add another step.
They are not an extra group in the goals editor or passport overview, and are
excluded from goal counts in class plans and project-evaluation goal reminders.

New or wholly blank plans prefill three first-person action tails. The fixed
I will prefix is unchanged. Example speaking actions: practise my talk out loud;
record myself once and listen; take a breath and speak slowly. Students may edit
these or add actions. A plan with any existing written action restores its entire
saved array exactly, including deliberately blank additional fields. Merely
opening a screen does not bulk-rewrite any student's saved plan.

The original difficulty-choice metadata remains archived and available to the
existing share Compass reminder. The planner no longer edits or submits it as
extra goals. Supabase removes the obsolete nonempty-focus submission checks;
three actual project goals and complete plan actions remain required. Actor,
ownership and teacher authorization are unchanged. The compatibility SQL test
tests/editable-focus-goals.sql now tests this superseding rule.

Verified: isolated planner prefill/blank/partial-plan preservation and send/reopen;
class goal counts; feed/share flow; 35 regression checks across four passes; and
rolled-back database checks for optional metadata, required plan/project goals
and denied cross-student edits. No real student response was filled by tests.

Cache 20261101-3. Prior live commit 8fa6920 is preserved in Git and an external ZIP.
The local learning-support prototype remains unpublished.
