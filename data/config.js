// Static site flags — shipped with the deploy, read WITHOUT touching Firestore.
// This is the source of truth for the archive gate, so it works even when the
// Firestore daily quota is exhausted. To change a flag: edit this file + deploy
// (the admin "Publish" flow), exactly like the static question bank.
//
// archiveEnabled  — reveal the verbatim past-paper archive pages (copyright gate).
// hideOriginals   — hide source:"past" questions from learners in the CBT bank.
//                   (Harmless for cbtQuestions now: no doc is tagged source:"past"
//                   anymore — those were original AI questions, retagged to "ai".)
export const SITE_CONFIG = { archiveEnabled: true, hideOriginals: true };
