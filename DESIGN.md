# LearnPath design

## Context
Grade 6 English project learning, primarily landscape tablets. Source of requirements:
the user's supplied `Dilay_7_Sinif_Site_Notlari_19_Ekim_2026(3).txt`, with the later
explicit landscape preference taking precedence. The approved atlas mockup owns
the visual identity; existing application code owns workflow and permissions.

## North Star
A calm illustrated learning map leading to the student's own project. Keep
the actual four milestones, all questions, teacher-defined project catalog,
teacher grouping for collaboration, uploads, reflections, comments, and records.
The owner removed project editing/grouping/timer gates on 29 October 2026;
teacher review is retained and never prevents the learner from revising their own work.
The user's approved Explore/Plan/Create/Reflect map labels are retained as visual
aliases for the four existing workflow actions; the underlying milestones do not change. No social ranking or new mandatory project format.

## Visual system
Runtime source of tokens: `assets/learnpath.css`.
- Navy text `#142d4b`, teal primary `#16787d`, light blue `#edf5f8`.
- White task paper, opaque enough to read clearly over the atlas.
- Mustard action `#edbd60`, dark text for contrast.
- Source Sans 3 body, Bricolage Grotesque restrained headings; system fallbacks.
- Landscape map above task, 1250px max content width. Natural document scroll.
- Three equal project-category columns on tablets; one column on narrow screens.
- Real RGBA images; no blend-mode, chroma key, opaque white sprite background,
  or opacity on entire controls. Alpha is confined to surfaces and artwork.

## Motion
Compass companion: 24 unique 256px frames, 6×4 atlas, 3-second loop, 125ms per
frame. Fixed shared scale and bottom-center anchor. Discrete CSS frame steps.
Pause/resume control, pause in hidden tabs, static first frame for reduced motion.
Sprite timing and sheet metadata: `assets/compass-idle.json`.

## Content
The owner clarified on 29 October that “My Learning Passport” denotes the
completed goals-and-plan result. Before completion, use “Set goals and plan”
and omit its persistent reminder; never present an empty overview as a passport.
New passports carry `grade:6`, `goalVersion:grade6-v1`. Stored goal IDs remain
compatible and the minimum-three-project-goals rule is unchanged. New targets
are five unit words, five sentences and 1.5–2 minutes of speech.
Historical unversioned contracts keep their
original goal wording in all student and teacher views. No bulk migration.
Teacher unit content and project names remain teacher-owned and are not overwritten.

## Approved Learning Passport (2026-10-28)
The user's reviewed planner supplies six topic prompts plus a centered own-topic
choice; twelve formats in Written/Spoken/Visual; tools; and the original four
learning challenges. Teacher-added and renamed formats remain available. The
compass offers explicitly labelled prepared guidance, with no AI service claim.
The passport starts at Goals, then Plan and Evaluation. Focus and project goals
share one paper/card; eight project goals remain offered. Removed options are not
erased from historical records. Plan fields supply a fixed “I will” prefix. The
mustard final action says “Save and send to the teacher”. A full saved summary
and a persistent My Learning Passport tab keep the plan visible.

## Accessibility
The owner wants a friendly travel-passport identity, not a plain report: teal
cover, gold compass seal, named holder, warm paper, bound edge and four numbered
sections. A “Sent to the teacher” stamp is shown only after confirmed submission.
The saved passport appears as a small book tab at the right side on tablets,
with reserved reading space; mobile uses the compact bottom variant.
The completed passport is a single continuous paper document with a Compass
reading guide outside it. Project, combined goals, ordered actions and target
scores share one sheet with ruled sections rather than separate colored cards.
Short staggered line reveals preserve layout, support the shared motion toggle
and disappear under reduced motion. All text remains in semantic document order.
Visible keyboard focus, labelled controls, natural zoom, large tablet targets,
status text beside milestone colors, semantic choice buttons, preserved native
select behavior, reduced motion. Mobile reflow preserves every question/action.

## Verification and limits
Use isolated Firebase mocks for tests; never test against student records.
Supabase owns persistence and server authorization following the 2026-10-27 transition.
The 2026-10-28 export queue is private; Google sync activation is tracked in
`integrations/google-sheets/README.md`. Live deployment remains separate from the local draft.

## Unit discovery (2026-10-28)
Reuse the existing paper/teal surfaces. The unit introduction is a teacher-supplied JPG,
followed by 29 word-only native checkboxes in three landscape columns, then five grammar
questions. Submitted unchecked vocabulary is listed as “Words to learn”; all-known and
no-selection states remain explicit. Incorrect submitted grammar choices use the original
transparent compass sprite beside the user's supplied explanation. The shared pause,
hidden-tab pause and reduced-motion behavior apply to these companions too.

## Anti-references
The saved-idea screen is a Compass conversation beside task paper, using existing
navy/teal/mustard tokens. The transparent companion offers a format-specific
observation question and optional external example search, then a clear passport
action. No emoji success tile or teacher-grouping wait state. Keep its shared
24-frame/3-second animation and pause/reduced-motion behavior.

No generic purple dashboard, giant marketing hero, floating fantasy islands,
leaderboard, forced sound, speed race, or answer-hint artwork in vocabulary tests.
