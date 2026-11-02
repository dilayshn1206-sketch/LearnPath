# Guided planning, attachments and feedback — 2026-11-01

The topic/product Compass uses an authored topic/format/intent library only. Learners
write their interests/questions; prepared replies use short keyword bullets and a
follow-up, and unknown input gets a short guiding question. There is no option list,
model connection, remote chat request or persisted chat transcript. Up to four
conversation turns and an unfinished message remain in tab memory. Actual project
topic/product inputs remain deliberate choices in the main form.

The plan editor starts with editable Step 1–3 from the hardest-choice suggestions.
The example box is removed; Compass explains this briefly on the right.
The pre-share guide has three optional checkboxes. Choices survive sharing stages
and save in a new post's versioned preShareChecklist, without a submission gate.

Attachments use one preview owner for upload, gallery and profile. Images/video/audio
use native media; PDFs use the browser PDF viewer. PPTX files are parsed locally
in the browser with vendored JSZip 3.10.1 (MIT license included). Slide order follows
presentation relationships. Text and embedded raster images appear with navigation.
Complex masters, charts, fonts, effects and animations are not reproduced: the
original file remains available. Private file URLs never go to an external document
viewer. Unsupported/unreadable files retain a fallback link; signing failure on one
attachment does not suppress the gallery. Existing storage permissions stay intact.

Browser Back/Forward follows app routes, planner steps and sharing questions.
In-tab snapshots preserve text, selections and attachment objects. History contains
opaque entry numbers, not learner answers. This is not offline/reload persistence.
Going back past the first app entry retains normal browser behavior.

Feedback Summary shows teacher and classmates' aggregate scores, with the closest
Step. Scoring remains unchanged. Optional aggregate criterion descriptions show
their corresponding Step; the written-feedback toggle is a prominent 17px button;
individual reviewers' Step breakdowns are removed. Written feedback is in Good points
and To improve columns, with muted names. Teacher Yes/No goal feedback stays separate.

Verification: isolated browser planner/feed/PPTX flows; 35 regression checks × 4;
adapter tests including signed URL renewal and partial file-read failure. No real
student submissions were created. Synthetic fixtures prove supported slide rendering,
not full PowerPoint fidelity. Release hashes/deployment evidence are recorded outside
the public site. The previous live version is backed up separately before publishing.
