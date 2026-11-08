# Topic Compass: short digital-life topics

The topic stage now recognises English word families and platform names, combines
the learner's current words with bounded in-tab topic context, and offers one
existing topic plus one short custom title. Platform-only and offline-only inputs
get a brief question. Shopping suggestions cover reviews, prices, ads, privacy
and order details. A learner deliberately chooses the main form option; the bot
offers short topics without repetitive form instructions and never changes the selection itself.

`assets/compass-topics.js` owns the new topic words and routing. Product-stage
guidance remains in the existing library/router; topic memory is retained for
the separately planned product improvements. No new service, transcript storage,
student-record migration, authentication or data-write path is introduced.

The new script and planner entry have versioned URLs. Tests cover topic aliases,
word order, ordinary negative preferences, digital relevance, shopping, alternative
ideas and follow-up selection. Existing product/guard checks and the mocked full
planner flow cover unchanged products, deliberate custom-topic entry, Back/Forward,
saving and passport navigation. This remains authored guidance, not unrestricted
natural-language understanding; unfamiliar language may need a clarifying answer.

Release base: c8a296b7d7903760db1a0c5eca0cb67b58c71bb1. Rollback is the inverse of
this frontend patch, without changing existing learner data.

Follow-up revision: clarify replies and the topic opening show one short question,
without recurring headings/bullets. Repeated clarifications vary their question.
Topic suggestions no longer instruct learners to select or type in the own-topic field.
