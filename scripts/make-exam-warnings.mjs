// Records the exam's spoken warnings, ONCE, with ElevenLabs.
//
//   node --env-file=<a file holding ELEVENLABS_API_KEY> scripts/make-exam-warnings.mjs
//   node scripts/make-exam-warnings.mjs --manifest-only     (no key needed: only writes data/exam-warnings.js)
//
// There are eight warnings (below). Each is synthesised a single time, saved as
// tts-cache/<sha1(voiceId|text)>.mp3 (the same name the site's own TTS route uses, so the route would find them
// too) and listed in data/exam-warnings.js, which is what the exam page reads. After that the exam only plays
// those files: ElevenLabs is never called while a student sits an exam, however many warnings there are.
//
// Re-running is free: a warning whose file is already there is left alone. To change the words, edit WARNINGS
// here and run it again; only the changed warnings are recorded (and billed).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VOICE = process.env.ELEVENLABS_VOICE_ID || "Xb7hH8MSUJpSbSDYk0k2";   // the site's PrepBot voice
const DIR = resolve(root, "tts-cache");

/* The eight. Short, calm, and each says what to do. */
const WARNINGS = {
  no_face: "Please keep your face in view of the camera.",
  extra_face: "Only you should be in view. Please ask anyone else to step away.",
  left_page: "You left the exam page. This is not allowed, and it has been recorded.",
  camera_off: "Your camera has stopped. Please turn it back on to continue.",
  leave_attempt: "Please do not leave or close the exam page. Finish your paper first.",
  second_warning: "This is your second warning. Leaving the exam page is not allowed.",
  final_warning: "This is your final warning. Your teacher will be told.",
  time_low: "One minute left. Please finish your answers.",
};

const key = process.env.ELEVENLABS_API_KEY;
const manifestOnly = process.argv.includes("--manifest-only");
if (!manifestOnly) mkdirSync(DIR, { recursive: true });
const manifest = {};
let made = 0, kept = 0;

for (const [name, text] of Object.entries(WARNINGS)) {
  const hash = createHash("sha1").update(`${VOICE}|${text}`).digest("hex");
  const file = resolve(DIR, `${hash}.mp3`);
  manifest[name] = { text, url: `/tts-cache/${hash}.mp3` };
  if (manifestOnly) continue;
  if (existsSync(file)) { kept++; console.log("kept   ", name); continue; }
  if (!key) { console.error("ELEVENLABS_API_KEY is not set, so", name, "cannot be recorded."); process.exitCode = 1; continue; }
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.45, similarity_boost: 0.75 } }),
  });
  if (!r.ok) { console.error("failed ", name, r.status, (await r.text().catch(() => "")).slice(0, 120)); process.exitCode = 1; continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(file, buf);
  made++;
  console.log("recorded", name, `${Math.round(buf.length / 1024)} KB`);
}

writeFileSync(resolve(root, "data/exam-warnings.js"),
  `/* The exam's eight spoken warnings: what each says, and the recording to play.\n   Written by scripts/make-exam-warnings.mjs; the page only plays these files and never calls ElevenLabs. */\nexport const WARNINGS = ${JSON.stringify(manifest, null, 2)};\n`);
console.log(`\n${made} recorded, ${kept} already there. Manifest: data/exam-warnings.js`);
