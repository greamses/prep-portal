/**
 * Prep Portal — Express API Server
 *
 * Secures all AI and payment API keys server-side so they are never
 * exposed to the browser.
 *
 * Setup:
 *   1. cp .env.example .env  and fill in your values
 *   2. Download Firebase service account key → save as serviceAccountKey.json
 *      (Firebase Console → Project Settings → Service Accounts → Generate key)
 *   3. npm install
 *   4. npm start  (or: npm run dev  for auto-reload with nodemon)
 *
 * Endpoints:
 *   POST /api/ai/chat         — PrepBot (Groq first → Claude fallback)
 *   POST /api/ai/claude       — Direct Claude access
 *   POST /api/ai/gemini       — Gemini proxy (app key)
 *   POST /api/ai/groq         — Groq proxy   (app key)
 *   POST /api/tts/synthesize  — Google Cloud TTS → base64 MP3
 *   GET  /api/tts/voices      — List available TTS voices
 *   POST /api/admin/sync-users
 *   GET  /api/admin/users
 */

// Load .env from this file's own directory so the keys load no matter what
// the current working directory is (e.g. `node server/index.js` from the repo root).
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// ── Firebase Admin init ───────────────────────────────────────────
let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  credential = admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  );
} else {
  // Falls back to local file for development
  const serviceAccount = require("./serviceAccountKey.json");
  credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({
  credential,
  storageBucket: process.env.STORAGE_BUCKET || "prep-portal-2026.appspot.com",
});

const db = admin.firestore();
const auth = admin.auth();

// ── Express app ───────────────────────────────────────────────────
const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : "*";

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Paystack webhook must read the RAW request body to verify its HMAC signature,
// so it has to be registered BEFORE the JSON body parser consumes the stream.
const payments = require("./routes/payments")();
app.post("/api/payments/webhook", express.raw({ type: "*/*" }), payments.webhook);

app.use(express.json({ limit: "4mb" }));

// ── Firestore daily quota guard ───────────────────────────────────
// Caps usage at 45k reads / 15k writes a day so we never hit the hard free-tier
// limit (50k/20k) that blocks the DB. `quota.guard` blocks the data/panel routes
// once over cap (429); the public usage route lets the browser check + report.
const quota = require("./lib/quota");
app.use("/api/usage", require("./routes/usage")());

// ── Routes ────────────────────────────────────────────────────────
app.use("/api/payments", payments.router);
app.use("/api/partner", quota.guard, require("./routes/partner")());
app.use("/api/auth",  require("./routes/auth")());
app.use("/api/ai",    require("./routes/ai")());
app.use("/api/activities", quota.guard, require("./routes/activities")());
app.use("/api/classroom", quota.guard, require("./routes/classroom")());
app.use("/api/calendar", quota.guard, require("./routes/calendar")());
app.use("/api/questions", require("./routes/questions")());
app.use("/api/config", require("./routes/config")());
app.use("/api/cbt", quota.guard, require("./routes/cbt")());
app.use("/api/tts",   require("./routes/tts")());
app.use("/api/admin",   quota.guard, require("./routes/admin")(db, auth));
app.use("/api/magazine", require("./routes/magazine")(db));
app.use("/api/youtube",  require("./routes/youtube")());
app.use("/api/grammar",  require("./routes/grammar")());

// Health check
app.get("/health", (_, res) => res.json({ status: "ok" }));

// ── Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`[Prep Portal] Server running on http://localhost:${PORT}`)
  );
}

module.exports = app;
