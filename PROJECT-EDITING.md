# Independent project editing

The owner requested removing project locks and the ask-your-teacher-to-unlock
warning. Students can now open the passport immediately after saving an idea,
edit a previously locked/pending/approved passport, retake the idea flow, and
save during classroom steps even after a timer expires. Grouping remains for
collaboration; the teacher panel no longer offers an edit lock/unlock button.

Submission remains pending for teacher review but stays editable. Revising its
content makes it a draft again. A student cannot approve their own work, alter
another learner's records, change their role or read the private backend tables.
Enrollment and Google authentication remain required. Existing records are not
bulk-rewritten; old edit flags and waiting-for-group status no longer gate edits.
History and the Sheets queue continue retaining changed versions.

The private write function update is in supabase/free-project-editing.sql.
Real database acceptance uses synthetic users inside a rolled-back transaction:
tests/free-project-editing.sql. It covers missing groups, old locked approvals,
expired sessions, resubmission/retake, archive retention and denied escalation.
The updated planner browser test covers these same user paths with isolated data.
