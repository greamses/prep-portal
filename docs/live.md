# Live rooms

One small API for everything on the site that wants to be live — a teacher
watching a student work, two children on one canvas, "who else is here".

```js
import { joinRoom } from "/utils/live/room.js";

const room = await joinRoom({ ns: "maths-workbook", code: "7F3K2", role: "student" });

room.presence.set({ at: "q3" });          // where I am — ephemeral, self-clearing
room.state.patch({ answers: { q3: "56" } });  // the work — merged, kept
room.send("cursor", { x, y });            // a shout — never stored, never replayed

room.on("presence", (people) => drawFaces(people));
room.on("state",    (s)      => paint(s));
room.on("cursor",   (p, who) => moveGhost(who, p));

await room.leave();
```

## The three channels, and why they are separate

| | what it is | lives for | cost |
|---|---|---|---|
| `presence` | who is here, what they are on | seconds | one small write per person per throttle tick |
| `state` | the work itself — answers, score | until deleted | one merge per throttle tick |
| `send`/`on` | a shout | an instant | one write per shout |

Keeping them apart is the whole design. Presence and shouts are chatty and
worthless a second later; state is the only thing worth storing. Mixing them
means paying storage prices for cursor positions.

## Why Realtime Database and not Firestore

Arithmetic, not taste. One class of thirty, writing once every 400ms, for a
forty-minute lesson:

```
(1000 / 400) × (40 × 60) × 30  ≈  180,000 writes
```

Firestore's free tier stops at **20,000 writes a day** — one lesson would go
through it nine times over. RTDB is not write-capped. What it caps is:

* **100 simultaneous connections** — about three classes at once,
* **1 GB stored**, **10 GB/month out** — thousands of lessons at these sizes.

So: **RTDB for the live path, Firestore for the durable one.** Submissions,
scores and assignment records stay exactly where they are.

RTDB also brings `onDisconnect`, which is the fiddliest part of presence and
the main reason not to hand-roll this on a socket: a closed tab, a shut laptop,
a train tunnel — the server takes that person out of the room without anyone
having to notice.

## Throttling is the budget

Every write is throttled **where it is sent**, not where it is heard —
throttling a listener saves nothing. `state.patch()` and `presence.set()`
coalesce and send at most one write per `throttle` ms (400 by default), and the
last value always gets out. Measured: 100 patches in a rush become **one**
write, and the hundredth value still arrives.

## Before it can go live

The Realtime Database does not exist in this project yet. Someone has to:

1. **Create it** — Firebase console → Build → Realtime Database → Create. Pick
   a region; if it is not the United States the URL is not the default one and
   `utils/live/transport-rtdb.js` needs the real one passing in.
2. **Deploy the rules** — `npm run deploy:rules` now sends
   `database.rules.json` as well as the Firestore rules. It says so and carries
   on if there is no database yet.
3. **Add `firebase/database` to the import map** of any page that joins a room.
   The existing maps list app, auth, firestore and storage only.

Until then `transport-memory` is the default, so `joinRoom()` works, tests run,
and two views in one page share a room. Nothing above the transport knows the
difference.

## Rules

`database.rules.json`. A room is readable and writable by anyone signed in who
has the code — the code *is* the key, exactly as an assignment code already is.
Presence and shouts are the exception: you may only write your own, enforced by
requiring the key to begin with your uid.

**So the `me.id` you pass must begin with the signed-in uid** — the uid itself,
or `uid + ":" + tab` if one person can be in two tabs at once.

## What is not built yet

This is the foundation and the memory transport. Still to come: wiring the
teacher's watch view onto the workbook assignment player, presence faces, and
co-editing op models per surface (Number Match, the manipulatives canvas,
Algebra Moves). See the phases in the plan.
