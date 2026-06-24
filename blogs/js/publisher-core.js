// publisher-core.js - 100% reusable across all subjects
import { db } from "./config.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
// THE single AI route — same authenticated server proxy (/api/ai/*) every other
// feature uses. The server holds the provider keys, so there is no CORS proxy
// and no per-user "bring your own key" to expire.
import {
  groqGenerate,
  geminiGenerate,
  groqText,
  geminiText,
} from "/utils/ai-client.js";

// ─── STATE ─────────────────────────────────────────────────
let currentUser = null;
let subjectConfig = null;
let subjectData = null;

// ─── INITIALIZATION ────────────────────────────────────────
export function initPublisher(config, dataModule) {
  subjectConfig = config;
  subjectData = dataModule;
}

export function setCurrentUser(user) {
  currentUser = user;
}

// Provider keys live on the server; the publisher just needs a signed-in user
// (ai-client attaches the Firebase ID token to the /api/ai/* proxy calls).
export async function loadApiKeys(user) {
  return !!user;
}

// ─── MARKDOWN → HTML ───────────────────────────────────────
// Converts markdown patterns to HTML.
// If 6+ block-level HTML tags are already present, skips conversion
// (assumes the model returned proper HTML).
export function markdownToHtml(text) {
  if (!text) return text;

  const tagCount = (
    text.match(/<(h[1-6]|p|ul|ol|li|blockquote|table|pre|div)\b/gi) || []
  ).length;
  if (tagCount >= 6) return text;

  let html = text;

  // Strip leftover code fences
  html = html.replace(/```[\w]*\n?/g, "").replace(/```/g, "");

  // Headings
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // Horizontal rules
  html = html.replace(/^[-*_]{3,}\s*$/gm, "<hr>");

  // Bold + italic combined
  html = html.replace(/\*\*\*(.+?)\*\*\*/gs, "<strong><em>$1</em></strong>");
  html = html.replace(/___(.+?)___/gs, "<strong><em>$1</em></strong>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/gs, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/gs, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/gs, "<em>$1</em>");
  html = html.replace(/_(.+?)_/gs, "<em>$1</em>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");

  // Unordered list items — group consecutive <li>s into <ul>
  html = html.replace(/^[-*+]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>[^]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);

  // Ordered list items — use temp tag to avoid re-matching
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<oli>$1</oli>");
  html = html.replace(
    /(<oli>[^]*?<\/oli>\n?)+/g,
    (m) =>
      "<ol>" +
      m.replace(/<oli>/g, "<li>").replace(/<\/oli>/g, "</li>") +
      "</ol>",
  );
  // Clean up any stragglers
  html = html.replace(/<oli>/g, "<li>").replace(/<\/oli>/g, "</li>");

  // Paragraphs — split on blank lines, wrap bare text blocks
  const BLOCK = /^<(h[1-6]|p|ul|ol|blockquote|hr|table|pre|div|figure)/i;
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      if (BLOCK.test(block)) return block;
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return html;
}

// ─── AI GENERATION (via the ONE server route, /api/ai/*) ────
// No CORS proxy, no per-user keys: ai-client posts to the authenticated
// /api/ai/groq and /api/ai/gemini proxies, which use the server's app keys —
// exactly the same path PrepBot, the writing evaluator and the math tutor use.

const PUBLISHER_SYSTEM = `You are an expert educator for Nigerian students. Output only clean HTML. No markdown, no <img> tags. Use clear, practical examples relevant to Nigerian students.`;

export async function healthCheck() {
  const checks = { firestore: false, apiKeys: true, config: false };
  try {
    const testQuery = query(
      collection(db, subjectConfig.collectionName),
      limit(1),
    );
    await getDocs(testQuery);
    checks.firestore = true;
  } catch (e) {
    console.error("Firestore check failed:", e);
  }
  // Provider keys live on the server now, so there is nothing for the client to
  // check — the backend route is always available to a signed-in user.
  checks.apiKeys = true;
  checks.config = !!subjectConfig;
  return checks;
}

// Shape a raw model answer into a publishable post.
function shapePost(raw, topic, modelUsed) {
  raw = (raw || "")
    .trim()
    .replace(/```html\n?/gi, "")
    .replace(/```\n?/g, "")
    .replace(/<img[^>]*>/gi, "");
  raw = markdownToHtml(raw);

  const titleMatch = raw.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].trim() : topic.text;
  const excerpt = raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 160);
  return {
    title,
    content: raw,
    excerpt,
    subject: topic.subject,
    classLevel: topic.classLevel,
    modelUsed,
  };
}

export async function generateWithFallback(topic, onModelChange) {
  if (!subjectData || !subjectData.buildSubjectPrompt) {
    throw new Error("Subject data not loaded. Call initPublisher first.");
  }

  const prompt = subjectData.buildSubjectPrompt(topic);
  const complex = topic.complexity || "standard";
  // "deep" topics start on Gemini (longer context); everything else on Groq.
  const providers = complex === "deep" ? ["gemini", "groq"] : ["groq", "gemini"];

  let lastErr = null;
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    if (onModelChange)
      onModelChange(
        provider === "groq" ? "Server AI (Groq)" : "Server AI (Gemini)",
        provider,
        i > 0,
      );
    try {
      if (provider === "groq") {
        const data = await groqGenerate({
          system: PUBLISHER_SYSTEM,
          prompt,
          temperature: 0.72,
          maxTokens: 3500,
        });
        const text = groqText(data);
        if (!text) throw new Error("Groq returned empty response");
        return shapePost(text, topic, "Groq (server)");
      } else {
        const data = await geminiGenerate({
          body: {
            contents: [{ parts: [{ text: `${PUBLISHER_SYSTEM}\n\n${prompt}` }] }],
            generationConfig: { temperature: 0.72, maxOutputTokens: 3200 },
          },
        });
        const text = geminiText(data);
        if (!text) throw new Error("Gemini returned empty response");
        return shapePost(text, topic, "Gemini (server)");
      }
    } catch (e) {
      lastErr = e;
      console.error(`Failed with ${provider}:`, e.message);
    }
  }
  throw lastErr || new Error("All models exhausted");
}

export async function executePublishCycle(
  onLog,
  onSchedule,
  onTopicSelected,
  onModelChange,
) {
  if (!subjectData || !subjectData.SUBJECT_TOPICS) {
    if (onLog) onLog("[CYCLE] Subject topics not loaded", "error");
    return false;
  }

  if (!currentUser) {
    if (onLog) onLog("[CYCLE] No user signed in", "error");
    if (onSchedule) onSchedule(5 * 60 * 1000);
    return false;
  }

  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const topic = rand(subjectData.SUBJECT_TOPICS);
  if (onTopicSelected) onTopicSelected(topic);
  if (onLog)
    onLog(
      `[RUN] "${topic.text}" [${topic.subject} / ${topic.classLevel}]`,
      "info",
    );

  try {
    const post = await generateWithFallback(topic, onModelChange);
    const postId = await publishPost(post);
    if (onLog)
      onLog(
        `[DONE] Published post ID: ${postId.substring(0, 10)}...`,
        "success",
      );
    if (onSchedule)
      onSchedule(Math.floor(Math.random() * 5 * 60 * 1000 + 10 * 60 * 1000));
    return postId;
  } catch (e) {
    if (onLog) onLog(`[ERR] ${e.message}`, "error");
    if (onSchedule) onSchedule(5 * 60 * 1000);
    return null;
  }
}

// ─── GENERIC CRUD OPERATIONS ──────────────────────────────
export async function loadRecentPosts(limitCount = 30) {
  if (!subjectConfig) throw new Error("Subject config not loaded");
  const q = query(
    collection(db, subjectConfig.collectionName),
    orderBy("publishedAt", "desc"),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function updatePostMeta(postId, updates) {
  if (!subjectConfig) throw new Error("Subject config not loaded");
  await updateDoc(doc(db, subjectConfig.collectionName, postId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function updatePostContent(postId, content) {
  if (!subjectConfig) throw new Error("Subject config not loaded");
  await updateDoc(doc(db, subjectConfig.collectionName, postId), {
    content,
    updatedAt: serverTimestamp(),
  });
}

export async function updatePostImages(
  postId,
  content,
  featuredImage,
  imagesAdded,
) {
  if (!subjectConfig) throw new Error("Subject config not loaded");
  await updateDoc(doc(db, subjectConfig.collectionName, postId), {
    content,
    featuredImage,
    imagesAdded,
    updatedAt: serverTimestamp(),
  });
}

export async function updatePostLinks(
  postId,
  videoLink,
  practiceLink,
  linksAdded,
) {
  if (!subjectConfig) throw new Error("Subject config not loaded");
  await updateDoc(doc(db, subjectConfig.collectionName, postId), {
    videoLink,
    practiceLink,
    linksAdded,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(postId) {
  if (!subjectConfig) throw new Error("Subject config not loaded");
  await deleteDoc(doc(db, subjectConfig.collectionName, postId));
}

export async function getPost(postId) {
  if (!subjectConfig) throw new Error("Subject config not loaded");
  const snap = await getDoc(doc(db, subjectConfig.collectionName, postId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Keys are server-side now; a signed-in user is all the publisher needs.
export function hasApiKeys() {
  return !!currentUser;
}

export function getSubjectName() {
  return subjectConfig?.name || "Unknown Subject";
}

// Add to publisher-core.js
export function validateAndCleanContent(html) {
  if (!html) return "";

  // Remove empty paragraphs
  let cleaned = html.replace(/<p>\s*<\/p>/g, "");

  // Ensure lesson-note wrapper exists
  if (!cleaned.includes('class="lesson-note"')) {
    cleaned = `<div class="lesson-note">${cleaned}</div>`;
  }

  // Fix common markdown artifacts
  cleaned = cleaned.replace(/```html/g, "");
  cleaned = cleaned.replace(/```/g, "");

  // Remove empty headings
  cleaned = cleaned.replace(/<h[1-6]>\s*<\/h[1-6]>/g, "");

  return cleaned;
}

export async function updatePostVideos(postId, videos, videoThumbnailsAdded) {
  if (!subjectConfig) throw new Error("Subject config not loaded");
  await updateDoc(doc(db, subjectConfig.collectionName, postId), {
    videos: videos || [],
    videoThumbnailsAdded: videoThumbnailsAdded || false,
    updatedAt: serverTimestamp(),
  });
}

export async function publishPost(post) {
  if (!currentUser) throw new Error("Not signed in");
  if (!subjectConfig) throw new Error("Subject config not loaded");

  const cleanedContent = validateAndCleanContent(post.content);

  const ref = await addDoc(collection(db, subjectConfig.collectionName), {
    title: post.title,
    content: cleanedContent,
    excerpt: post.excerpt,
    featuredImage: "",
    videos: [], // Array of video objects
    practiceLink: "",
    subject: post.subject,
    classLevel: post.classLevel,
    status: "published",
    authorId: currentUser.uid,
    authorEmail: currentUser.email,
    publishedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    views: 0,
    likes: [],
    imagesAdded: false,
    videoThumbnailsAdded: false,
    linksAdded: false,
    modelUsed: post.modelUsed,
    source: subjectConfig.source,
  });
  return ref.id;
}
