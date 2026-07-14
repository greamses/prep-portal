# Feature Flags — how gating works & how to add a feature

_Living doc. Update it whenever a feature, part, or setting is added._

## Architecture

**One registry, one resolver, two enforcement layers.**

| Piece | File | Role |
|---|---|---|
| Registry + resolver | `utils/features.js` | THE source of truth: the `FEATURES` catalogue, `resolveAccess()` (canonical decision), path→feature/part mapping, client config fetch (5-min TTL). Dependency-free ESM. |
| Server enforcement | `server/lib/access.js` | Loads `utils/features.js` via dynamic `import()` (listed in `vercel.json` `includeFiles`). Exposes `canUse(req, featureId, partId?)` and `requireFeature()` middleware. The authoritative gate. |
| Client page gate | `utils/auth/premium-guard.js` | Drop-in script for whole-page gating; resolves via `resolveAccess` with the user's profile. UX layer only. |
| Inline client gates | `utils/prepbot/prepbot.js`, `exam-archive/.../quiz-engine.js`, `payment-manager.js` interceptor | Same resolver, feature/part looked up by id or path. |
| Admin UIs | `admin/settings/index.html` (global), dashboard **Users** panel (`home/js/dashboard/users.js`, per-user overrides) | Both render from the registry — no per-feature UI code. |

### Storage

`config/site` (Firestore, written by `/api/config`, admin-only):

```jsonc
{
  "features":     { "theory": "free" },                 // featureId → "off"|"free"|"premium" (only overrides of defaults)
  "featureParts": { "games-3d": { "chess": false } },   // featureId → partId → bool; absent ⇒ enabled
  "aiQuota":      { "windowTokens": 10000, "monthTokens": 300000 },
  "archiveEnabled": false,
  "hideOriginals": false
}
```

`users/{uid}.featureOverrides` (admin-written only; listed in `protectedUserFields()` in `firestore.rules` so users can't self-write):

```jsonc
{
  "virtual-lab": { "access": "grant" },                      // unlock for this user
  "prepbot":     { "access": "block" },                      // deny even if globally free
  "games-3d":    { "access": "grant", "parts": { "maze": true, "chess": false } }
}
```

No entry = inherit global. Remove with `deleteField()`.

### Resolution order (canonical — `resolveAccess()` in `utils/features.js`)

```
1. part-disabled   (the specific sub-part is unchecked for this scope)
2. user block      (beats everything, including global "free")
3. user grant      (beats global state INCLUDING "off" — deliberate: enables
                    private betas where a feature is off site-wide but granted
                    to named testers)
4. global state    off → nobody (admins too) | free → any signed-in user
                   | premium → isPremium users (server treats ADMIN_EMAIL as premium)
```

Part maps: an override with `parts` defines them outright; a grant without
`parts` = all parts; no override falls back to the global `featureParts` map;
an absent part entry means enabled.

### Caches / staleness (admin changes take effect within ~5 minutes)

| Cache | Where | TTL |
|---|---|---|
| Feature config (states+parts) | `utils/features.js` in-page | 5 min |
| Page-guard verdict (`pp_access:{uid}` localStorage) | `premium-guard.js` | 5 min |
| `config/site` | `server/lib/access.js` | 60 s (invalidated instantly on the instance that handles the `/api/config` POST) |
| `users/{uid}` entitlement | `server/lib/access.js` | 5 min per uid |

Failure policy: client fails **open** to registry defaults (a network blip never
hard-blocks a page); server user-reads fail **closed** (last cached verdict,
then "not premium") — the server is the real enforcement.

## Adding a NEW feature — checklist

1. **Add ONE entry to `FEATURES`** in `utils/features.js`:
   ```js
   {
     id: "my-feature",            // kebab-case, stable forever
     label: "My Feature",
     desc: "One line for the admin settings row",
     group: "Learning Labs",      // settings-page card grouping
     default: "premium",           // off | free | premium — ship-safe default
     paths: ["/my-feature"],      // URL prefixes for page-level gating ([] if inline/server-only)
     parts: [                      // OPTIONAL sub-settings ("check all or some")
       { id: "sub-a", label: "Sub A", path: "/my-feature/sub-a" }, // path optional
     ],
     usesAiGenerate: true,         // OPTIONAL: may call POST /api/ai/generate
     usesImageGen: true,           // OPTIONAL: may call POST /api/ai/image
   }
   ```
2. **Page-gated?** Every page under `paths` must include
   `<script type="module" src="/utils/auth/premium-guard.js"></script>`. Done.
3. **Inline UI gate?** Copy the PrepBot pattern: `resolveUserAccess({ featureId, partId, profile })` from `utils/features.js`.
4. **Server route?** `const access = require("../lib/access");` then either
   `access.requireFeature("my-feature", "part?")` as middleware, or
   `await access.canUse(req, "my-feature")` when you need a custom response shape
   (e.g. PrepBot's in-band chat text).
5. **Nothing else.** The admin Settings page, the per-user override editor, and
   `/api/config` validation all render/derive from the registry automatically.
6. Run the verification matrix (bottom of this doc) for the new id, then update
   the table in this doc.

## Adding a PART to an existing feature

1. Add `{ id, label, path? }` to the feature's `parts` array in `utils/features.js`.
2. Pass the `partId` at the enforcement point(s) that belong to that part
   (page path is automatic if the part has a `path`).
3. Both admin UIs pick it up automatically. New parts default to **enabled**.

## Current catalogue

| Feature id | Default | Parts | Enforced at |
|---|---|---|---|
| virtual-lab | premium | — | page guard |
| theory | premium | — | `/api/ai/generate` only — the page itself is a deliberately PUBLIC, crawlable SEO landing page (see the comment in `theory-page/index.html`); do not add a page guard there |
| writing | premium | — | page guard (AI via proxy, see caveat) |
| activities | premium | author, attempt | page guard + `/api/activities` |
| flashcards | premium | — | page guard + `/api/ai/image` (card art) |
| prep-math-activities | premium | cartesian-art, equivalent-fractions, polygon-angles, surface-area, transversals | page guard (per sub-app) |
| games-3d | premium | aliens, chess, free-throw, drone, maze, rubiks-cube | page guard (per game) |
| prepbot | premium | chat, voice, images | inline + `/api/ai/chat`, `/api/tts/elevenlabs`, `/api/ai/image` (`images` = the avatar picker's "PrepBot draws your character" tile) |
| cbt-written | premium | short, theory | inline (quiz-engine, per format) |
| classroom | premium | — | `/api/classroom` |
| calendar | free | — | `/api/calendar` (reads; writes stay admin-only) |

## Settings beyond features

- **AI quota** (`config/site.aiQuota`): `windowTokens` (rolling 5-hour window)
  and `monthTokens` (UTC calendar month), editable in admin Settings. Consumed
  by `server/routes/ai.js` usage tracking (display-only, never blocks); admins
  are unlimited. Defaults 10 000 / 300 000.
- **archiveEnabled / hideOriginals**: verbatim past-paper controls, unchanged.
- **Plan pricing**: deliberately NOT admin-editable (tied to Paystack plan codes
  in `payment-manager.js` + `server/routes/payments.js`).

## Caveats & known trade-offs

- **Admin identity is duplicated in three places**: `firestore.rules` `isAdmin()`
  (hard-coded email), `home/js/dashboard/users.js` (hard-coded email), and
  `ADMIN_EMAIL` env on the server. Keep them in sync.
- **Global "off" blocks admins too** (kill switch); a per-user **grant** is the
  way to test an off feature (grant it to the admin's own account).
- **`/api/ai/gemini` + `/api/ai/groq` proxies are quota-gated, not feature-gated.**
  Writing/theory/flashcards AI rides these shared proxies; the server cannot
  attribute a proxy call to a feature, so per-feature enforcement there is the
  page guard (UX) plus the shared token quota (hard resource cap).
  `/api/ai/generate` (one-shot jobs) IS feature-gated via a registry-validated
  `feature` body param (allowlist = entries with `usesAiGenerate`).
  `/api/ai/image` works the same way (allowlist = `usesImageGen`: `flashcards`
  for card art, `prepbot`/`images` for the avatar picker's character drawings).
  It draws on Cloudflare's neuron allocation, NOT the LLM token pool.
- **Firestore rules deploys are manual**: `firebase deploy --only firestore:rules`.
- **`vercel.json` `includeFiles` must keep `utils/features.js`** or the server's
  dynamic import of the registry breaks on Vercel (verify `/api/config` on a
  preview deploy after touching bundling config).

## Verification matrix (run per release / new feature)

| Scenario | Expected |
|---|---|
| Feature `free`, free user | page reveals; feature's server route 200 |
| Feature `premium`, free user | page → subscribe; server route 402 `premium_required` |
| Feature `off`, premium user + admin | disabled screen; server route 403 `feature_disabled` |
| Grant to free user (incl. under global `off`) | allowed everywhere within ~5 min |
| Block for premium user | denied everywhere within ~5 min |
| Global part unchecked | that part blocked for everyone; sibling parts unaffected |
| Per-user `parts` subset | only listed-true parts open for that user |
| Quota edit | `GET /api/ai/usage` reports the new allocation |
| Self-write `featureOverrides` from console | Firestore permission denied |
| `/api/config` unreachable | client falls back to registry defaults (fail open) |
