# Teacher project options repair

Current live catalog was read without modifying records. Its original legacy defaults and teacher additions are retained. resolveCatalog materializes current defaults only for absent/legacy categories, merges edits by stable id, preserves inactive items for teacher editing and honors explicit deleted=true markers. A fully removed category remains empty.

Teachers can edit names, visibility and an optional exampleUrl. New products also accept exampleUrl. Only complete HTTP(S) links without embedded credentials are allowed. Blank links retain Google search. All rendered links use safe DOM/escaped attributes and noopener/noreferrer.

The host sends an authoritative catalogProducts collection to the planner, replacing the student hardcoded choices while retaining format metadata for saved plans. The question-mark link and saved-idea Explore examples use teacher destinations. No contract or student progress migration; no database schema/auth changes. Existing backend teacher-only catalog writes remain authoritative.

Validation: real ES-module UI with isolated persistence, legacy virtual-default removal/reopen, existing-name edits, custom add/remove, URL validation, failed-save preservation, student choice/link rendering, historical-plan readability, and existing regression/planner/teacher/animation suites.
