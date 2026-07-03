/* ═══════════════════════════════════════════════════════
   RECALL PRESS — DECK PERSISTENCE + LEITNER BOX LOGIC
   Decks live at users/{uid}/flashcardDecks/{deckId}, read
   through the shared TTL-cached data-service (never a raw,
   unbounded Firestore poll).
═══════════════════════════════════════════════════════ */
import { collection } from 'firebase/firestore';
import { auth, db } from '/firebase-init.js';
import { getDoc, getList, saveDoc, invalidateDoc, invalidateList } from '/utils/data-service.js';
import { slugify, nextBox, dueAtFor } from './config.js';

function uid() {
  const u = auth.currentUser;
  if (!u) throw new Error('Please sign in to use flashcards.');
  return u.uid;
}

export function deckIdFor(subject, topic) {
  return `${slugify(subject)}__${slugify(topic)}`;
}

/** All decks for the signed-in user, newest first. */
export async function listDecks({ force = false } = {}) {
  const id = uid();
  const decks = await getList(
    `flashcardDecks:${id}`,
    () => collection(db, 'users', id, 'flashcardDecks'),
    { force },
  );
  return decks.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function getDeck(deckId, opts) {
  return getDoc(`users/${uid()}/flashcardDecks/${deckId}`, opts);
}

/** Append freshly-printed cards to a deck, creating it if it doesn't exist yet. */
export async function appendCards({ classLabel, subject, topic, cards }) {
  const id = uid();
  const deckId = deckIdFor(subject, topic);
  const path = `users/${id}/flashcardDecks/${deckId}`;
  const existing = await getDoc(path, { force: true });
  const now = Date.now();

  const newCards = cards.map((c, i) => ({
    id: `${now}_${i}`,
    front: c.front,
    back: c.back,
    box: 1,
    dueAt: now, // printable cards are due immediately
    createdAt: now,
  }));

  const merged = {
    classLabel,
    subject,
    topic,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    cards: [...(existing?.cards || []), ...newCards],
  };

  await saveDoc(path, merged, { merge: true });
  invalidateDoc(path);
  invalidateList(`flashcardDecks:${id}`);
  return { deckId, ...merged };
}

/** Cards in a given box that are due now. */
export function dueCardsInBox(deck, box) {
  const now = Date.now();
  return (deck.cards || []).filter((c) => c.box === box && c.dueAt <= now);
}

/** Count of due cards per box, for the shelf drawer badges. */
export function boxCounts(deck) {
  const now = Date.now();
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  (deck.cards || []).forEach((c) => {
    if (c.box >= 1 && c.box <= 5) counts[c.box] += 1;
  });
  const due = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  (deck.cards || []).forEach((c) => {
    if (c.dueAt <= now && c.box >= 1 && c.box <= 5) due[c.box] += 1;
  });
  return { counts, due };
}

/** Grade a single card (again/hard/good/easy) and persist its new box + due date. */
export async function gradeCard(deckId, cardId, grade) {
  const id = uid();
  const path = `users/${id}/flashcardDecks/${deckId}`;
  const deck = await getDoc(path, { force: true });
  if (!deck) return null;

  const cards = (deck.cards || []).map((c) => {
    if (c.id !== cardId) return c;
    const box = nextBox(c.box, grade);
    return { ...c, box, dueAt: dueAtFor(box) };
  });

  await saveDoc(path, { cards, updatedAt: Date.now() }, { merge: true });
  invalidateDoc(path);
  invalidateList(`flashcardDecks:${id}`);
  return cards;
}

/** Patch one card's fields (edited text, an image URL, a regenerated front/back). */
export async function updateCard(deckId, cardId, patch) {
  const id = uid();
  const path = `users/${id}/flashcardDecks/${deckId}`;
  const deck = await getDoc(path, { force: true });
  if (!deck) return null;

  let updated = null;
  const cards = (deck.cards || []).map((c) => {
    if (c.id !== cardId) return c;
    updated = { ...c, ...patch };
    return updated;
  });

  await saveDoc(path, { cards, updatedAt: Date.now() }, { merge: true });
  invalidateDoc(path);
  invalidateList(`flashcardDecks:${id}`);
  return updated;
}
