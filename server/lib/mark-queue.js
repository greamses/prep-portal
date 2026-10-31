/**
 * The AI marking queue.
 *
 * Marking is the slow, rate-limited part of an exam: thirty students finish together and the AI cannot
 * mark thirty scripts in the same second. So a finished script is not marked on the spot, it joins a
 * queue, and the queue is worked through at the rate the providers allow, first come first served, until
 * every script is marked. A student whose script is waiting is told their place; nobody is turned away.
 *
 *   markQueue/{code}_{uid}   one job: the questions with the student's answers, its state, its marks
 *   markMeta/limiter         the shared allowance: calls this minute, and a pause when a provider is busy
 *
 * There is no background worker (the site has no scheduled jobs), so the queue is drained COOPERATIVELY:
 * whenever a student's page asks how its marking is going, or the teacher opens the list, that request
 * does a little of the work first (`drain`). A shared limiter keeps all those requests together to
 * `rpm` calls a minute, and a lease on each job being worked keeps two requests from marking the same
 * script twice. A job whose provider was only BUSY goes back with a growing wait (20 s, 40 s, 80 s …),
 * it is never lost; it fails only after `MAX_TRIES` tries, and then the student is told, so the marks
 * can be given by hand.
 */

const MAX_TRIES = 6;
const LEASE_MS = 120000;
const delayFor = (tries) => Math.min(600, 20 * 2 ** Math.max(0, tries - 1)) * 1000;

module.exports = function createMarkQueue({ db, markScript, now = Date.now, rpm = Number(process.env.MARK_RPM) || 20 }) {
  const jobs = () => db().collection("markQueue");
  const limiter = () => db().collection("markMeta").doc("limiter");
  const idOf = (code, uid) => `${code}_${uid}`;

  /** Put a script in the queue. A script already waiting or being marked is left as it is. */
  async function enqueue({ code, uid, ownerUid, name, subject, klass, items }) {
    const ref = jobs().doc(idOf(code, uid));
    const had = await ref.get();
    if (had.exists && ["queued", "working"].includes(had.data().status)) return { status: had.data().status, already: true };
    await ref.set({ code, uid, ownerUid: ownerUid || "", name: String(name || "").slice(0, 60), subject: subject || "", klass: klass || "", items,
      status: "queued", attempts: 0, notBefore: 0, lockedUntil: 0, createdAt: now(), updatedAt: now(), result: null, error: "" });
    return { status: "queued", already: false };
  }

  /** How one student's script is getting on, and where it is in the line. */
  async function statusOf(code, uid) {
    const snap = await jobs().doc(idOf(code, uid)).get();
    if (!snap.exists) return { status: "none" };
    const j = snap.data();
    const out = { status: j.status, attempts: j.attempts || 0 };
    if (j.status === "queued") {
      const ahead = (await jobs().where("status", "==", "queued").limit(200).get()).docs.filter((d) => (d.data().createdAt || 0) < j.createdAt).length;
      out.position = ahead + 1;
      out.waitingFor = j.notBefore > now() ? Math.ceil((j.notBefore - now()) / 1000) : 0;
    }
    if (j.status === "done") out.result = j.result;
    if (j.status === "failed") out.error = j.error;
    return out;
  }

  /** One allowance token from the shared per-minute limit; false if there is none (or a provider asked us to wait). */
  async function takeToken() {
    return db().runTransaction(async (tx) => {
      const snap = await tx.get(limiter());
      const s = snap.exists ? snap.data() : { windowStart: 0, count: 0, pausedUntil: 0 };
      const t = now();
      if ((s.pausedUntil || 0) > t) return false;
      let { windowStart, count } = s;
      if (t - windowStart >= 60000) { windowStart = t; count = 0; }
      if (count >= rpm) return false;
      tx.set(limiter(), { windowStart, count: count + 1, pausedUntil: s.pausedUntil || 0 });
      return true;
    });
  }
  async function pause(ms) {
    await db().runTransaction(async (tx) => {
      const snap = await tx.get(limiter());
      const s = snap.exists ? snap.data() : { windowStart: 0, count: 0, pausedUntil: 0 };
      tx.set(limiter(), { ...s, pausedUntil: Math.max(s.pausedUntil || 0, now() + ms) });
    });
  }

  /** Jobs whose worker went away (the lease ran out) go back in the line, or fail if they have been tried enough. */
  async function reapStale() {
    const snap = await jobs().where("status", "==", "working").limit(50).get();
    for (const d of snap.docs) {
      const j = d.data();
      if ((j.lockedUntil || 0) >= now()) continue;
      const tries = (j.attempts || 0) + 1;
      await d.ref.set(tries >= MAX_TRIES
        ? { status: "failed", attempts: tries, error: "The marking did not finish.", updatedAt: now() }
        : { status: "queued", attempts: tries, notBefore: now(), lockedUntil: 0, updatedAt: now() }, { merge: true });
    }
  }

  /** Take the oldest script that is ready, or null. */
  async function claim() {
    const snap = await jobs().where("status", "==", "queued").limit(50).get();
    const ready = snap.docs.filter((d) => (d.data().notBefore || 0) <= now()).sort((a, b) => (a.data().createdAt || 0) - (b.data().createdAt || 0));
    for (const d of ready) {
      const got = await db().runTransaction(async (tx) => {
        const cur = await tx.get(d.ref);
        if (!cur.exists || cur.data().status !== "queued") return null;
        tx.set(d.ref, { status: "working", lockedUntil: now() + LEASE_MS, updatedAt: now() }, { merge: true });
        return { ref: d.ref, ...cur.data() };
      });
      if (got) return got;
    }
    return null;
  }

  async function run(job) {
    try {
      const { marks, provider } = await markScript({ subject: job.subject, klass: job.klass, items: job.items });
      await job.ref.set({ status: "done", result: { marks, provider }, finishedAt: now(), updatedAt: now(), lockedUntil: 0, error: "" }, { merge: true });
      return "done";
    } catch (e) {
      const tries = (job.attempts || 0) + 1;
      const busy = !!(e && e.retryable);
      const giveUp = tries >= (busy ? MAX_TRIES : 3);
      if (busy) await pause(15000);              // every worker eases off while a provider is busy
      await job.ref.set(giveUp
        ? { status: "failed", attempts: tries, lockedUntil: 0, updatedAt: now(), error: busy ? "The AI marker is busy or unavailable right now." : "The AI could not mark this script." }
        : { status: "queued", attempts: tries, notBefore: now() + delayFor(tries), lockedUntil: 0, updatedAt: now(), error: String((e && e.message) || e).slice(0, 160) }, { merge: true });
      return giveUp ? "failed" : "requeued";
    }
  }

  /**
   * Do some of the work: up to `max` scripts, within `budgetMs`, and only as fast as the shared limiter allows.
   * → { done, requeued, failed }
   */
  async function drain({ max = 1, budgetMs = 20000 } = {}) {
    const out = { done: 0, requeued: 0, failed: 0 };
    const t0 = now();
    await reapStale();
    while (out.done + out.requeued + out.failed < max && now() - t0 < budgetMs) {
      const peek = (await jobs().where("status", "==", "queued").limit(50).get()).docs.some((d) => (d.data().notBefore || 0) <= now());
      if (!peek) break;
      if (!(await takeToken())) break;
      const job = await claim();
      if (!job) break;
      out[await run(job)]++;
    }
    return out;
  }

  /** For the teacher: every script of one paper and how it stands. */
  async function summary(code) {
    const snap = await jobs().where("code", "==", code).limit(500).get();
    const list = snap.docs.map((d) => {
      const j = d.data();
      return { uid: j.uid, name: j.name || "Student", status: j.status, attempts: j.attempts || 0, provider: j.result && j.result.provider || "", error: j.status === "failed" ? j.error : "", createdAt: j.createdAt || 0 };
    }).sort((a, b) => a.createdAt - b.createdAt);
    const count = (s) => list.filter((x) => x.status === s).length;
    return { total: list.length, queued: count("queued"), working: count("working"), done: count("done"), failed: count("failed"), students: list };
  }

  return { enqueue, statusOf, drain, summary, takeToken, reapStale, MAX_TRIES };
};
