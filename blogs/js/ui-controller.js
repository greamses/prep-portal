// ui-controller.js - 100% reusable across all subjects
import { CONFIG } from '/blogs/js/path-config.js'; // Changed to absolute path to resolve 404
import { auth } from '/firebase-init.js'; // Standardized to use central init file

import { onAuthStateChanged } from 'firebase/auth';
import {
  initPublisher,
  setCurrentUser,
  loadApiKeys,
  executePublishCycle,
  loadRecentPosts,
  updatePostMeta,
  updatePostImages,
  updatePostLinks,
  updatePostContent,
  updatePostVideos,
  deletePost,
  getPost,
  hasApiKeys,
  getSubjectName
} from './publisher-core.js';

// This module expects subjectConfig and subjectData to be passed in
let subjectConfig = null;
let subjectData = null;
let subjectLabels = null;
let subjectStyles = null;
let classLabels = null;
let classStyles = null;

// ─── DOM ELEMENTS (assumed to exist in HTML) ───────────────
const authStatusSpan = document.getElementById('authStatus');
const statusDot = document.getElementById('statusDot');
const publishCountSpan = document.getElementById('publishCount');
const nextRunMinutesSpan = document.getElementById('nextRunMinutes');
const nextRunDetailSpan = document.getElementById('nextRunDetail');
const routingIndicator = document.getElementById('routingIndicator');
const logContainer = document.getElementById('logContainer');
const forceBtn = document.getElementById('forcePublishBtn');
const restartBtn = document.getElementById('restartSchedulerBtn');
const testBtn = document.getElementById('testWriteBtn');
const refreshPostsBtn = document.getElementById('refreshPostsBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmPostTitle = document.getElementById('confirmPostTitle');
const metaModal = document.getElementById('metaModal');
const saveMetaBtn = document.getElementById('saveMetaBtn');
const cancelMetaBtn = document.getElementById('cancelMetaBtn');
const linksModal = document.getElementById('linksModal');
const saveLinksBtn = document.getElementById('saveLinksBtn');
const cancelLinksBtn = document.getElementById('cancelLinksBtn');
const imgModal = document.getElementById('imgModal');
const saveImgBtn = document.getElementById('saveImgBtn');
const cancelImgBtn = document.getElementById('cancelImgBtn');
const paraBlocksList = document.getElementById('paraBlocksList');
const featuredImgInput = document.getElementById('featuredImgInput');
const featuredImgThumb = document.getElementById('featuredImgThumb');
const imgPendingBanner = document.getElementById('imgPendingBanner');
const videoUrlInput = document.getElementById('videoUrlInput');
const practiceUrlInput = document.getElementById('practiceUrlInput');
const videoThumbImg = document.getElementById('videoThumbImg');
const videoPlayBadge = document.getElementById('videoPlayBadge');
const practicePreviewCard = document.getElementById('practicePreviewCard');
const practiceFavicon = document.getElementById('practiceFavicon');
const practiceDomain = document.getElementById('practiceDomain');
const contentModal = document.getElementById('contentModal');
const saveContentBtn = document.getElementById('saveContentBtn');
const cancelContentBtn = document.getElementById('cancelContentBtn');
const contentEditorTextarea = document.getElementById('contentEditorTextarea');
const contentPreviewPane = document.getElementById('contentPreviewPane');
const videosModal = document.getElementById('videosModal');
const saveVideosBtn = document.getElementById('saveVideosBtn');
const cancelVideosBtn = document.getElementById('cancelVideosBtn');
const videoThumbnailsList = document.getElementById('videoThumbnailsList');
const addVideoBtn = document.getElementById('addVideoBtn');

// ─── STATE ─────────────────────────────────────────────────
let activeTimeout = null;
let publishCount = 0;
let pendingDeleteId = null;
let pendingMetaId = null;
let pendingImgId = null;
let pendingImgContent = '';
let pendingLinksId = null;
let pendingContentId = null;
let pendingVideosId = null;
let currentUser = null;

// Helper function to safely get short ID (prevents null substring error)
function getShortId(id) {
  if (!id || typeof id !== 'string') return 'unknown';
  return id.substring(0, 8);
}

// ─── INITIALIZATION ────────────────────────────────────────
export function initUI(config, dataModule) {
  subjectConfig = config;
  subjectData = dataModule;
  subjectLabels = dataModule.SUBJECT_LABELS;
  subjectStyles = dataModule.SUBJECT_STYLES;
  classLabels = dataModule.CLASS_LABELS;
  classStyles = dataModule.CLASS_STYLES;
  
  initPublisher(config, dataModule);
  
  // Update UI with subject name
  document.title = `${config.name} Publisher | Prep Portal 2026`;
  const headerTitle = document.querySelector('.app-header h1');
  if (headerTitle) headerTitle.textContent = `${config.name} Auto-Publisher`;
  
  addLog(`[BOOT] ${config.name} Publisher v1.0 loaded`, 'success');
}

// ─── UTILITIES ─────────────────────────────────────────────
function addLog(msg, type = 'info') {
  const t = new Date().toLocaleTimeString();
  const el = document.createElement('div');
  el.className = 'log-entry';
  const cls = { success: 'log-success', error: 'log-error', warn: 'log-warn' } [type] || 'log-info';
  el.innerHTML = `<span class="log-time">[${t}]</span> <span class="${cls}">${escapeHtml(msg)}</span>`;
  if (logContainer) {
    logContainer.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

const escapeHtml = s => { if (!s) return ''; return s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } [m])); };
const formatDate = ts => { if (!ts) return '--'; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); };

function getClassLabel(classLevel) {
  if (!classLevel || !classLabels) return '--';
  const [type, num] = classLevel.split('-');
  if (classLabels[type]) return classLabels[type](num);
  return classLevel;
}

function getClassStyle(classLevel) {
  if (!classLevel || !classStyles) return 'cls-primary';
  if (classLevel.startsWith('primary')) return classStyles.primary;
  if (classLevel.startsWith('jss')) return classStyles.jss;
  return classStyles.ss;
}

function getSubjectLabel(subject) {
  return subjectLabels?.[subject] || subjectConfig?.name || subject;
}

function getSubjectStyle(subject) {
  return subjectStyles?.[subject] || 'sci-default';
}

function updateNextDisplay(ms) {
  if (!ms || !nextRunMinutesSpan || !nextRunDetailSpan) {
    if (nextRunMinutesSpan) nextRunMinutesSpan.innerText = '--';
    if (nextRunDetailSpan) nextRunDetailSpan.innerText = 'Next: idle';
    return;
  }
  const m = Math.round(ms / 60000);
  nextRunMinutesSpan.innerText = m;
  nextRunDetailSpan.innerText = `Next: in ${m} min`;
}

function clearScheduler() {
  if (activeTimeout) {
    clearTimeout(activeTimeout);
    activeTimeout = null;
  }
}

function scheduleNextRun(ms) {
  clearScheduler();
  if (!hasApiKeys()) { addLog('[SCHED] No API keys', 'warn'); return; }
  addLog(`[SCHED] Next ${subjectConfig?.name} post in ${Math.round(ms/60000)} min`, 'info');
  updateNextDisplay(ms);
  activeTimeout = setTimeout(async () => {
    activeTimeout = null;
    await runPublishCycle();
  }, ms);
}

function showRoutingBadge(provider, isFallback) {
  if (!routingIndicator) return;
  const cls = isFallback ? 'fallback' : provider.toLowerCase();
  const lbl = (isFallback ? `Fallback: ${provider}` : provider).toUpperCase();
  routingIndicator.innerHTML = `<div class="routing-badge ${cls}"><svg style="width:11px;height:11px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> ${lbl}</div>`;
}

async function runPublishCycle() {
  await executePublishCycle(addLog, scheduleNextRun, (topic) => {
    // Topic selected callback
  }, (modelLabel, provider, isFallback) => {
    showRoutingBadge(provider, isFallback);
    addLog(`[MODEL] Using ${modelLabel}${isFallback ? ' (fallback)' : ''}`, 'info');
  });
}

// ─── CSS CLEANING UTILITY ──────────────────────────────────
function cleanDuplicateCssLinks(html) {
  if (!html || typeof html !== 'string') return '';
  
  // Remove all CSS links first
  const cssLinkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi;
  let cleaned = html.replace(cssLinkRegex, '');
  
  // Add CSS link once at the top if content has educational structure
  const cssLink = `<link rel="stylesheet" href="${window.CONFIG?.paths?.renderCss || '../../../../css/render.css'}">`;
  
  if (cleaned.includes('<div class="lesson-note">') ||
    cleaned.includes('<div class="ln-') ||
    cleaned.includes('<div class="science-note">')) {
    cleaned = cssLink + '\n' + cleaned;
  }
  
  return cleaned;
}

// ─── VIDEO & PRACTICE PREVIEW ──────────────────────────────
function getYouTubeThumbnail(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|shorts\/)([^&\n?#]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|shorts\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (_) {
    return url;
  }
}

if (videoUrlInput) {
  videoUrlInput.addEventListener('input', () => {
    let input = videoUrlInput.value.trim();
    if (input.includes('<iframe')) {
      const srcMatch = input.match(/src=["']([^"']+)["']/);
      input = srcMatch ? srcMatch[1] : input;
    }
    const thumb = getYouTubeThumbnail(input);
    if (thumb && videoThumbImg && videoPlayBadge) {
      videoThumbImg.src = thumb;
      videoThumbImg.classList.add('visible');
      videoPlayBadge.style.display = 'flex';
    } else if (videoThumbImg && videoPlayBadge) {
      videoThumbImg.classList.remove('visible');
      videoPlayBadge.style.display = 'none';
    }
  });
}

if (practiceUrlInput) {
  practiceUrlInput.addEventListener('input', () => {
    let input = practiceUrlInput.value.trim();
    if (input.includes('<iframe')) {
      const srcMatch = input.match(/src=["']([^"']+)["']/);
      input = srcMatch ? srcMatch[1] : input;
    }
    if (input && practicePreviewCard && practiceDomain && practiceFavicon) {
      const domain = getDomain(input);
      practiceDomain.textContent = domain;
      practiceFavicon.src = `https://image.thum.io/get/width/100/crop/100/${input}`;
      practiceFavicon.onerror = () => {
        practiceFavicon.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      };
      practicePreviewCard.classList.add('visible');
    } else if (practicePreviewCard) {
      practicePreviewCard.classList.remove('visible');
    }
  });
}

// ─── VIDEOS MODAL FUNCTIONS ────────────────────────────────
function openVideosModal(postId, postTitle, existingVideos = []) {
  if (!postId) return;
  pendingVideosId = postId;
  
  const subtitle = document.getElementById('videosModalSubtitle');
  if (subtitle) {
    subtitle.textContent = `"${postTitle || 'Untitled'}" — add video thumbnails for this lesson.`;
  }
  
  // Clear and populate the videos list
  if (videoThumbnailsList) {
    videoThumbnailsList.innerHTML = '';
    
    if (existingVideos && existingVideos.length > 0) {
      existingVideos.forEach(video => {
        addVideoRow(video.title || '', video.url || '', video.duration || '');
      });
    } else {
      // Add one empty row by default
      addVideoRow('', '', '');
    }
  }
  
  if (videosModal) videosModal.classList.add('active');
}

function addVideoRow(title = '', url = '', duration = '') {
  if (!videoThumbnailsList) return;
  
  const row = document.createElement('div');
  row.className = 'video-thumbnail-row';
  row.innerHTML = `
    <div class="video-row-fields">
      <input type="text" class="video-title-input" placeholder="Video title" value="${escapeHtml(title)}">
      <input type="url" class="video-url-input" placeholder="YouTube URL" value="${escapeHtml(url)}">
      <input type="text" class="video-duration-input" placeholder="Duration (e.g., 2:14)" value="${escapeHtml(duration)}">
    </div>
    <div class="video-row-preview">
      <div class="video-preview-thumb">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="#0a0a0a" stroke-width="2"/>
          <path d="M13 11L21 16L13 21V11Z" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="video-preview-info">
        <span class="video-preview-title">${escapeHtml(title) || 'Untitled video'}</span>
        <span class="video-preview-duration">${escapeHtml(duration) || '--:--'}</span>
      </div>
    </div>
    <button class="btn-remove-video" type="button" title="Remove video">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" y1="4" x2="12" y2="12"/>
        <line x1="12" y1="4" x2="4" y2="12"/>
      </svg>
    </button>
  `;
  
  // Add remove functionality
  const removeBtn = row.querySelector('.btn-remove-video');
  removeBtn.addEventListener('click', () => {
    row.remove();
    // If no rows left, add an empty one
    if (videoThumbnailsList.children.length === 0) {
      addVideoRow('', '', '');
    }
  });
  
  // Update preview when inputs change
  const titleInput = row.querySelector('.video-title-input');
  const urlInput = row.querySelector('.video-url-input');
  const durationInput = row.querySelector('.video-duration-input');
  const previewTitle = row.querySelector('.video-preview-title');
  const previewDuration = row.querySelector('.video-preview-duration');
  
  titleInput.addEventListener('input', () => {
    previewTitle.textContent = titleInput.value || 'Untitled video';
  });
  
  durationInput.addEventListener('input', () => {
    previewDuration.textContent = durationInput.value || '--:--';
  });
  
  // Extract video ID and update preview on URL input
  urlInput.addEventListener('input', () => {
    const videoId = extractYouTubeId(urlInput.value);
    if (videoId) {
      const thumbContainer = row.querySelector('.video-preview-thumb');
      thumbContainer.innerHTML = `<img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="Thumbnail" style="width:100%;height:100%;object-fit:cover;">`;
    }
  });
  
  // Trigger initial preview if URL exists
  if (url) {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      const thumbContainer = row.querySelector('.video-preview-thumb');
      thumbContainer.innerHTML = `<img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="Thumbnail" style="width:100%;height:100%;object-fit:cover;">`;
    }
  }
  
  videoThumbnailsList.appendChild(row);
}

// ─── LOAD POSTS UI ─────────────────────────────────────────
async function renderRecentPosts() {
  const list = document.getElementById('managePostsList');
  if (!list) return;
  list.innerHTML = `<li class="manage-loading"><div class="spinner-ring"></div>Loading ${subjectConfig?.name} posts...</li>`;
  try {
    const posts = await loadRecentPosts(30);
    if (!posts.length) { list.innerHTML = `<li class="manage-empty">No ${subjectConfig?.name} posts yet.</li>`; return; }
    list.innerHTML = '';
    posts.forEach(post => {
      const subj = post.subject || Object.keys(subjectLabels || {})[0] || 'default';
      const cls = post.classLevel || 'ss-1';
      const sciCls = getSubjectStyle(subj);
      const clsCls = getClassStyle(cls);
      const subjLbl = getSubjectLabel(subj);
      const clsLbl = getClassLabel(cls);
      const hasImg = !!post.featuredImage || post.imagesAdded;
      const hasLinks = post.linksAdded || (post.videoLink || post.practiceLink);
      const hasVideos = post.videosAdded || (post.videos && post.videos.length > 0);
      
      const li = document.createElement('li');
      li.className = 'manage-post-item';
      li.innerHTML = `
        <div class="manage-post-info">
          <div class="manage-post-title" title="${escapeHtml(post.title || '')}">${escapeHtml(post.title || 'Untitled')}</div>
          <div class="manage-post-meta">
            <span>${formatDate(post.publishedAt)}</span>
            <span class="sci-badge ${sciCls}">${subjLbl}</span>
            <span class="cls-badge ${clsCls}">${clsLbl}</span>
            ${post.modelUsed ? `<span>${escapeHtml(post.modelUsed.split(' ').slice(0,2).join(' '))}</span>` : ''}
            ${post.views ? `<span>${post.views} views</span>` : ''}
            ${!hasImg ? `<span class="pill-pending"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>No imgs</span>` : ''}
            ${!hasLinks ? `<span class="pill-pending pill-links-missing"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>No links</span>` : ''}
            ${!hasVideos ? `<span class="pill-pending pill-videos-missing"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M10 9L15 12L10 15V9Z"></path></svg>No videos</span>` : ''}
          </div>
        </div>
        <div class="manage-post-actions">
          <button class="btn btn-sm btn-links links-btn" data-id="${post.id}" data-title="${escapeHtml(post.title || 'Untitled')}" data-video="${escapeHtml(post.videoLink || '')}" data-practice="${escapeHtml(post.practiceLink || '')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            <span class="btn-label">Links</span>
          </button>
          <button class="btn btn-sm btn-videos videos-btn" data-id="${post.id}" data-title="${escapeHtml(post.title || 'Untitled')}" data-videos='${JSON.stringify(post.videos || []).replace(/'/g, "&apos;")}'>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M10 9L15 12L10 15V9Z" fill="currentColor"></path></svg>
            <span class="btn-label">Videos</span>
          </button>
          <button class="btn btn-sm btn-edit img-btn" data-id="${post.id}" data-title="${escapeHtml(post.title || 'Untitled')}" data-featured="${escapeHtml(post.featuredImage || '')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span class="btn-label">Images</span>
          </button>
          <button class="btn btn-sm meta-btn" data-id="${post.id}" data-title="${escapeHtml(post.title || '')}" data-subject="${escapeHtml(subj)}" data-class="${escapeHtml(cls)}" data-excerpt="${escapeHtml(post.excerpt || '')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span class="btn-label">Edit</span>
          </button>
          <button class="btn btn-sm content-btn" data-id="${post.id}" data-title="${escapeHtml(post.title || 'Untitled')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span class="btn-label">Content</span>
          </button>
          <button class="btn btn-sm btn-danger del-btn" data-id="${post.id}" data-title="${escapeHtml(post.title || 'Untitled')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6M14 11v6"></path><path d="M9 6V4h6v2"></path></svg>
            <span class="btn-label">Delete</span>
          </button>
        </div>`;
      list.appendChild(li);
    });
    
    attachButtonListeners(list);
  } catch (e) {
    list.innerHTML = `<li class="manage-empty">Error: ${escapeHtml(e.message)}</li>`;
    addLog(`[ERR] ${e.message}`, 'error');
  }
}

function attachButtonListeners(container) {
  container.querySelectorAll('.links-btn').forEach(btn => {
    btn.addEventListener('click', () => openLinksModal(btn.dataset.id, btn.dataset.title, btn.dataset.video, btn.dataset.practice));
  });
  container.querySelectorAll('.videos-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      let videos = [];
      try {
        const videoData = btn.dataset.videos.replace(/&apos;/g, "'");
        videos = JSON.parse(videoData || '[]');
      } catch (e) {
        console.warn('Failed to parse videos:', e);
        videos = [];
      }
      openVideosModal(btn.dataset.id, btn.dataset.title, videos);
    });
  });
  container.querySelectorAll('.img-btn').forEach(btn => {
    btn.addEventListener('click', () => openImageEditor(btn.dataset.id, btn.dataset.title, btn.dataset.featured));
  });
  container.querySelectorAll('.meta-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingMetaId = btn.dataset.id;
      const metaTitle = document.getElementById('metaTitle');
      const metaSubject = document.getElementById('metaSubject');
      const metaClass = document.getElementById('metaClass');
      const metaExcerpt = document.getElementById('metaExcerpt');
      if (metaTitle) metaTitle.value = btn.dataset.title || '';
      if (metaSubject) metaSubject.value = btn.dataset.subject || Object.keys(subjectLabels || {})[0] || 'default';
      if (metaClass) metaClass.value = btn.dataset.class || 'ss-1';
      if (metaExcerpt) metaExcerpt.value = btn.dataset.excerpt || '';
      if (metaModal) metaModal.classList.add('active');
    });
  });
  container.querySelectorAll('.content-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const postId = btn.dataset.id;
      const postTitle = btn.dataset.title || 'Untitled';
      if (!postId) {
        addLog('[ERROR] Invalid post ID', 'error');
        return;
      }
      openContentEditor(postId, postTitle);
    });
  });
  container.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingDeleteId = btn.dataset.id;
      if (confirmPostTitle) confirmPostTitle.textContent = `"${btn.dataset.title}" — this cannot be undone.`;
      if (confirmModal) confirmModal.classList.add('active');
    });
  });
}

// ─── CONTENT EDITOR ─────────────────────────────────────────
async function openContentEditor(postId, postTitle) {
  if (!postId) {
    addLog('[CONTENT] Invalid post ID', 'error');
    return;
  }
  
  pendingContentId = postId;
  const subtitle = document.getElementById('contentModalSubtitle');
  if (subtitle) subtitle.textContent = `"${postTitle || 'Untitled'}"`;
  
  if (contentEditorTextarea) contentEditorTextarea.value = '';
  if (contentPreviewPane) contentPreviewPane.innerHTML = '';
  if (contentModal) contentModal.classList.add('active');
  
  try {
    const post = await getPost(postId);
    if (!post) {
      addLog('[CONTENT] Post not found', 'error');
      if (contentModal) contentModal.classList.remove('active');
      pendingContentId = null;
      return;
    }
    
    let existingContent = post.content || '';
    existingContent = cleanDuplicateCssLinks(existingContent);
    
    if (contentEditorTextarea) contentEditorTextarea.value = existingContent;
    if (contentPreviewPane) contentPreviewPane.innerHTML = existingContent;
    
    if (window.MathJax && contentPreviewPane) {
      await MathJax.typesetPromise([contentPreviewPane]);
    }
  } catch (e) {
    addLog(`[ERR] ${e.message}`, 'error');
    if (contentModal) contentModal.classList.remove('active');
    pendingContentId = null;
  }
}

// ─── MODAL HANDLERS ─────────────────────────────────────────
function openLinksModal(postId, postTitle, currentVideo, currentPractice) {
  if (!postId) return;
  pendingLinksId = postId;
  const subtitle = document.getElementById('linksModalSubtitle');
  if (subtitle) subtitle.textContent = `"${postTitle || 'Untitled'}" — add video and interactive practice link.`;
  if (videoUrlInput) videoUrlInput.value = currentVideo || '';
  if (practiceUrlInput) practiceUrlInput.value = currentPractice || '';
  if (videoThumbImg) videoThumbImg.classList.remove('visible');
  if (videoPlayBadge) videoPlayBadge.style.display = 'none';
  if (practicePreviewCard) practicePreviewCard.classList.remove('visible');
  if (currentVideo && videoUrlInput) videoUrlInput.dispatchEvent(new Event('input'));
  if (currentPractice && practiceUrlInput) practiceUrlInput.dispatchEvent(new Event('input'));
  if (linksModal) linksModal.classList.add('active');
}

async function openImageEditor(postId, postTitle, currentFeatured) {
  if (!postId) return;
  pendingImgId = postId;
  const subtitle = document.getElementById('imgModalSubtitle');
  if (subtitle) subtitle.textContent = `"${postTitle || 'Untitled'}" — paste image URLs per paragraph.`;
  if (paraBlocksList) paraBlocksList.innerHTML = `<div class="manage-loading"><div class="spinner-ring"></div>Loading...</div>`;
  if (imgPendingBanner) imgPendingBanner.style.display = 'none';
  if (featuredImgInput) featuredImgInput.value = currentFeatured || '';
  updateFeaturedThumb(currentFeatured || '');
  if (imgModal) imgModal.classList.add('active');
  try {
    const post = await getPost(postId);
    if (!post) { addLog('[IMG] Post not found', 'error'); return; }
    pendingImgContent = post.content || '';
    if (imgPendingBanner) imgPendingBanner.style.display = (!post.featuredImage && !post.imagesAdded) ? 'flex' : 'none';
    renderParaBlocks(pendingImgContent);
  } catch (e) {
    if (paraBlocksList) paraBlocksList.innerHTML = `<div class="manage-empty">Error: ${escapeHtml(e.message)}</div>`;
  }
}

function renderParaBlocks(html) {
  if (!paraBlocksList) return;
  const container = document.createElement('div');
  container.innerHTML = html;
  const BLOCK_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'P', 'UL', 'OL', 'BLOCKQUOTE', 'TABLE', 'PRE', 'DIV']);
  const blocks = [];
  container.childNodes.forEach(node => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === 'IMG') return;
    if (BLOCK_TAGS.has(node.tagName)) blocks.push(node);
  });
  if (!blocks.length) { paraBlocksList.innerHTML = '<div class="manage-empty">No paragraph blocks found.</div>'; return; }
  paraBlocksList.innerHTML = '';
  blocks.forEach((block, idx) => {
    const preview = block.textContent.trim().replace(/\s+/g, ' ').substring(0, 90);
    const row = document.createElement('div');
    row.className = 'para-block';
    row.dataset.idx = idx;
    row.innerHTML = `
      <div class="para-block-header">
        <span class="para-block-type">${block.tagName}</span>
        <span class="para-block-preview">${escapeHtml(preview) || '(empty)'}</span>
      </div>
      <div class="para-block-body">
        <div class="para-img-row">
          <input type="url" class="para-img-input" data-idx="${idx}" placeholder="Image URL (leave blank to skip)">
          <img class="para-img-preview" alt="" data-idx="${idx}">
        </div>
        <p class="para-void-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>Leave blank for no image on this paragraph.</p>
      </div>`;
    paraBlocksList.appendChild(row);
    const input = row.querySelector('.para-img-input');
    const prev = row.querySelector('.para-img-preview');
    if (input && prev) {
      input.addEventListener('input', () => {
        const u = input.value.trim();
        if (u) {
          input.classList.add('has-img');
          prev.src = u;
          prev.classList.add('visible');
          prev.onerror = () => {
            prev.src = '';
            prev.classList.remove('visible');
          };
        } else {
          input.classList.remove('has-img');
          prev.src = '';
          prev.classList.remove('visible');
        }
      });
    }
  });
  paraBlocksList._blocks = blocks;
}

function updateFeaturedThumb(url) {
  if (!featuredImgThumb) return;
  if (url) {
    featuredImgThumb.src = url;
    featuredImgThumb.classList.add('visible');
    featuredImgThumb.onerror = () => {
      featuredImgThumb.src = '';
      featuredImgThumb.classList.remove('visible');
    };
  } else {
    featuredImgThumb.src = '';
    featuredImgThumb.classList.remove('visible');
  }
}

// ─── CONTENT EDITOR LIVE PREVIEW ───────────────────────────
if (contentEditorTextarea && contentPreviewPane) {
  contentEditorTextarea.addEventListener('input', () => {
    contentPreviewPane.innerHTML = contentEditorTextarea.value;
    if (window.MathJax) MathJax.typesetPromise([contentPreviewPane]);
  });
}

// ─── SAVE HANDLERS ─────────────────────────────────────────
if (saveContentBtn) {
  saveContentBtn.addEventListener('click', async () => {
    if (!pendingContentId) {
      addLog('[CONTENT] No post selected for editing', 'warn');
      if (contentModal) contentModal.classList.remove('active');
      return;
    }
    
    if (!contentEditorTextarea) {
      addLog('[CONTENT] Editor not found', 'error');
      return;
    }
    
    let content = contentEditorTextarea.value.trim();
    if (!content) {
      addLog('[CONTENT] Content cannot be empty', 'warn');
      return;
    }
    
    content = cleanDuplicateCssLinks(content);
    
    saveContentBtn.disabled = true;
    const originalText = saveContentBtn.innerHTML;
    saveContentBtn.textContent = 'Saving...';
    
    try {
      await updatePostContent(pendingContentId, content);
      addLog(`[CONTENT] Saved for ${getShortId(pendingContentId)}...`, 'success');
      if (contentModal) contentModal.classList.remove('active');
      pendingContentId = null;
      await renderRecentPosts();
    } catch (e) {
      addLog(`[ERR] ${e.message}`, 'error');
    } finally {
      if (saveContentBtn) {
        saveContentBtn.disabled = false;
        saveContentBtn.innerHTML = originalText;
      }
    }
  });
}

if (saveLinksBtn) {
  saveLinksBtn.addEventListener('click', async () => {
    if (!pendingLinksId) {
      addLog('[LINKS] No post selected', 'warn');
      if (linksModal) linksModal.classList.remove('active');
      return;
    }
    const video = videoUrlInput ? videoUrlInput.value.trim() : '';
    const practice = practiceUrlInput ? practiceUrlInput.value.trim() : '';
    saveLinksBtn.disabled = true;
    const originalText = saveLinksBtn.innerHTML;
    saveLinksBtn.textContent = 'Saving...';
    try {
      await updatePostLinks(pendingLinksId, video, practice, !!(video || practice));
      addLog(`[LINKS] Saved for ${getShortId(pendingLinksId)}...`, 'success');
      if (linksModal) linksModal.classList.remove('active');
      pendingLinksId = null;
      await renderRecentPosts();
    } catch (e) { addLog(`[ERR] ${e.message}`, 'error'); }
    finally {
      if (saveLinksBtn) {
        saveLinksBtn.disabled = false;
        saveLinksBtn.innerHTML = originalText;
      }
    }
  });
}

if (saveVideosBtn) {
  saveVideosBtn.addEventListener('click', async () => {
    if (!pendingVideosId) {
      addLog('[VIDEOS] No post selected', 'warn');
      if (videosModal) videosModal.classList.remove('active');
      return;
    }
    
    // Collect all video data
    const videos = [];
    const rows = videoThumbnailsList ? videoThumbnailsList.querySelectorAll('.video-thumbnail-row') : [];
    
    rows.forEach(row => {
      const title = row.querySelector('.video-title-input')?.value.trim() || '';
      const url = row.querySelector('.video-url-input')?.value.trim() || '';
      const duration = row.querySelector('.video-duration-input')?.value.trim() || '';
      
      if (title && url) {
        videos.push({ title, url, duration });
      }
    });
    
    saveVideosBtn.disabled = true;
    const originalText = saveVideosBtn.innerHTML;
    saveVideosBtn.textContent = 'Saving...';
    
    try {
      await updatePostVideos(pendingVideosId, videos, videos.length > 0);
      addLog(`[VIDEOS] Saved ${videos.length} video(s) for ${getShortId(pendingVideosId)}...`, 'success');
      if (videosModal) videosModal.classList.remove('active');
      pendingVideosId = null;
      await renderRecentPosts();
    } catch (e) {
      addLog(`[ERR] ${e.message}`, 'error');
    } finally {
      if (saveVideosBtn) {
        saveVideosBtn.disabled = false;
        saveVideosBtn.innerHTML = originalText;
      }
    }
  });
}

if (saveImgBtn) {
  saveImgBtn.addEventListener('click', async () => {
    if (!pendingImgId) {
      addLog('[IMAGES] No post selected', 'warn');
      if (imgModal) imgModal.classList.remove('active');
      return;
    }
    const featured = featuredImgInput ? featuredImgInput.value.trim() : '';
    const blocks = paraBlocksList ? (paraBlocksList._blocks || []) : [];
    const inputs = paraBlocksList ? paraBlocksList.querySelectorAll('.para-img-input') : [];
    const IMG_STYLE = 'width:100%;max-width:100%;height:auto;border-radius:8px;margin:1.25rem 0;display:block;';
    let newContent = '';
    blocks.forEach((block, idx) => {
      newContent += block.outerHTML;
      if (inputs[idx] && inputs[idx].value.trim()) {
        newContent += `<img src="${escapeHtml(inputs[idx].value.trim())}" alt="${escapeHtml(block.textContent.trim().substring(0,40))}" style="${IMG_STYLE}">`;
      }
    });
    if (!newContent) newContent = pendingImgContent;
    const hasAnyImg = !!featured || [...inputs].some(i => i && i.value.trim());
    saveImgBtn.disabled = true;
    const originalText = saveImgBtn.innerHTML;
    saveImgBtn.textContent = 'Saving...';
    try {
      await updatePostImages(pendingImgId, newContent, featured, hasAnyImg);
      addLog(`[IMG] Images saved for ${getShortId(pendingImgId)}...`, 'success');
      if (imgModal) imgModal.classList.remove('active');
      pendingImgId = null;
      pendingImgContent = '';
      await renderRecentPosts();
    } catch (e) { addLog(`[ERR] ${e.message}`, 'error'); }
    finally {
      if (saveImgBtn) {
        saveImgBtn.disabled = false;
        saveImgBtn.innerHTML = originalText;
      }
    }
  });
}

if (saveMetaBtn) {
  saveMetaBtn.addEventListener('click', async () => {
    if (!pendingMetaId) {
      addLog('[META] No post selected', 'warn');
      if (metaModal) metaModal.classList.remove('active');
      return;
    }
    const titleInput = document.getElementById('metaTitle');
    const subjectInput = document.getElementById('metaSubject');
    const classInput = document.getElementById('metaClass');
    const excerptInput = document.getElementById('metaExcerpt');
    
    const title = titleInput ? titleInput.value.trim() : '';
    const subject = subjectInput ? subjectInput.value : '';
    const cls = classInput ? classInput.value : '';
    const excerpt = excerptInput ? excerptInput.value.trim() : '';
    
    if (!title) { addLog('[META] Title required', 'warn'); return; }
    saveMetaBtn.disabled = true;
    const originalText = saveMetaBtn.innerHTML;
    saveMetaBtn.textContent = 'Saving...';
    try {
      await updatePostMeta(pendingMetaId, { title, subject, classLevel: cls, excerpt });
      addLog(`[META] Updated: "${title}"`, 'success');
      if (metaModal) metaModal.classList.remove('active');
      pendingMetaId = null;
      await renderRecentPosts();
    } catch (e) { addLog(`[ERR] ${e.message}`, 'error'); }
    finally {
      if (saveMetaBtn) {
        saveMetaBtn.disabled = false;
        saveMetaBtn.innerHTML = originalText;
      }
    }
  });
}

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!pendingDeleteId) {
      addLog('[DELETE] No post selected', 'warn');
      if (confirmModal) confirmModal.classList.remove('active');
      return;
    }
    confirmDeleteBtn.disabled = true;
    const originalText = confirmDeleteBtn.innerHTML;
    confirmDeleteBtn.textContent = 'Deleting...';
    try {
      await deletePost(pendingDeleteId);
      addLog(`[DEL] ${getShortId(pendingDeleteId)}...`, 'success');
      if (confirmModal) confirmModal.classList.remove('active');
      pendingDeleteId = null;
      await renderRecentPosts();
    } catch (e) { addLog(`[ERR] ${e.message}`, 'error'); }
    finally {
      if (confirmDeleteBtn) {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = originalText;
      }
    }
  });
}

// ─── CLOSE MODALS ──────────────────────────────────────────
if (cancelContentBtn) {
  cancelContentBtn.addEventListener('click', () => {
    if (contentModal) contentModal.classList.remove('active');
    pendingContentId = null;
    if (contentEditorTextarea) contentEditorTextarea.value = '';
    if (contentPreviewPane) contentPreviewPane.innerHTML = '';
  });
}

if (cancelLinksBtn) {
  cancelLinksBtn.addEventListener('click', () => {
    if (linksModal) linksModal.classList.remove('active');
    pendingLinksId = null;
  });
}

if (cancelVideosBtn) {
  cancelVideosBtn.addEventListener('click', () => {
    if (videosModal) videosModal.classList.remove('active');
    pendingVideosId = null;
  });
}

if (cancelImgBtn) {
  cancelImgBtn.addEventListener('click', () => {
    if (imgModal) imgModal.classList.remove('active');
    pendingImgId = null;
    pendingImgContent = '';
  });
}

if (cancelMetaBtn) {
  cancelMetaBtn.addEventListener('click', () => {
    if (metaModal) metaModal.classList.remove('active');
    pendingMetaId = null;
  });
}

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener('click', () => {
    if (confirmModal) confirmModal.classList.remove('active');
    pendingDeleteId = null;
  });
}

// Add Video button handler
if (addVideoBtn) {
  addVideoBtn.addEventListener('click', () => {
    addVideoRow('', '', '');
  });
}

// Close modals when clicking outside
[confirmModal, metaModal, linksModal, imgModal, contentModal, videosModal].forEach(modal => {
  if (modal) {
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
  }
});

// Escape key closes modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    [confirmModal, metaModal, linksModal, imgModal, contentModal, videosModal].forEach(modal => {
      if (modal) modal.classList.remove('active');
    });
  }
});

// ─── FORCE PUBLISH & RESTART ───────────────────────────────
if (forceBtn) {
  forceBtn.addEventListener('click', async () => {
    if (!hasApiKeys()) {
      if (currentUser) await loadApiKeys(currentUser, subjectConfig);
      else { addLog('[MAN] No user signed in', 'error'); return; }
    }
    clearScheduler();
    addLog(`[MAN] Manual ${subjectConfig?.name} post publish`, 'info');
    await runPublishCycle();
  });
}

if (restartBtn) {
  restartBtn.addEventListener('click', () => {
    clearScheduler();
    if (hasApiKeys()) {
      scheduleNextRun(Math.floor(Math.random() * 5 * 60 * 1000 + 10 * 60 * 1000));
      addLog('[OK] Scheduler restarted', 'success');
    } else addLog('[WARN] No API keys available', 'error');
  });
}

if (testBtn) {
  testBtn.addEventListener('click', async () => {
    addLog('[TEST] Testing Firestore connection...', 'info');
    try {
      const posts = await loadRecentPosts(5);
      addLog(`[OK] Found ${posts.length} ${subjectConfig?.name} posts`, 'success');
    } catch (e) { addLog(`[ERR] ${e.message}`, 'error'); }
  });
}

if (refreshPostsBtn) {
  refreshPostsBtn.addEventListener('click', renderRecentPosts);
}

// ─── AUTH & INIT ───────────────────────────────────────────
const saved = localStorage.getItem(`${subjectConfig?.collectionName}Count`);
if (saved && publishCountSpan) {
  publishCount = parseInt(saved);
  publishCountSpan.innerText = publishCount;
}

onAuthStateChanged(auth, async user => {
  currentUser = user;
  if (user) {
    setCurrentUser(user);
    const short = user.email.length > 26 ? user.email.substring(0, 24) + '...' : user.email;
    if (statusDot) statusDot.classList.remove('red');
    if (authStatusSpan) authStatusSpan.innerHTML = `<span class="status-dot"></span>${escapeHtml(short)}`;
    addLog(`[AUTH] ${user.email}`, 'success');
    const ok = await loadApiKeys(user, subjectConfig);
    if (ok && !activeTimeout) {
      addLog(`[READY] Starting ${subjectConfig?.name} scheduler...`, 'success');
      scheduleNextRun(Math.floor(Math.random() * 5 * 60 * 1000 + 10 * 60 * 1000));
    }
    await renderRecentPosts();
  } else {
    if (statusDot) statusDot.classList.add('red');
    if (authStatusSpan) authStatusSpan.innerHTML = `<span class="status-dot red"></span>Waiting for sign-in...`;
    addLog('[AUTH] Waiting for sign-in...', 'info');
  }
});

setInterval(() => { if (currentUser && hasApiKeys()) console.log(`[ALIVE] ${subjectConfig?.name} publisher running`); }, 30000);
addLog(`[READY] ${subjectConfig?.name} Publisher — waiting for API keys...`, 'info');