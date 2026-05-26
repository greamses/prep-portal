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
 *   POST /api/ai/chat    — PrepBot (Groq first → Claude fallback)
 *   POST /api/ai/claude  — Direct Claude access
 *   POST /api/ai/gemini  — Gemini proxy (user's key, fetched server-side)
 *   POST /api/ai/groq    — Groq proxy   (user's key, fetched server-side)
 *   POST /api/admin/sync-users
 *   GET  /api/admin/users
 */

require("dotenv").config();

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

admin.initializeApp({ credential });

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
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "4mb" }));

// ── Routes ────────────────────────────────────────────────────────
app.use("/api/ai", require("./routes/ai")(db));
app.use("/api/admin", require("./routes/admin")(db, auth));

// Health check
app.get("/health", (_, res) => res.json({ status: "ok" }));

// ── Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`[Prep Portal] Server running on http://localhost:${PORT}`)
);
