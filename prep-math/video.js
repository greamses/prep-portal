// video.js - Math-Specific YouTube Video Search
// Handles YouTube API integration and Gemini topic planning for math resources

import { state } from './script.js';
import { geminiGenerate, geminiText } from '/utils/ai-client.js';

const _videoCache = {};

// ============================================
// MATH-SPECIFIC CHANNEL MAP
// ============================================
function _getMathChannels(level, topic) {
  const isLowerPrim = /primary [123]|pry [123]/i.test(level);
  const isUpperPrim = /primary [456]|pry [456]/i.test(level);
  const isPrimary = isLowerPrim || isUpperPrim;
  const isJSS = /jss/i.test(level);
  const isSS = /ss[1-3]|senior/i.test(level);
  
  // Topic-based channel selection
  const isAlgebra = /algebra/i.test(topic);
  const isGeometry = /geometry/i.test(topic);
  const isCalculus = /calculus/i.test(topic);
  const isTrig = /trig/i.test(topic);
  const isStats = /statistics|probability/i.test(topic);
  const isArithmetic = /arithmetic/i.test(topic);
  
  // Primary Level Math Channels
  if (isPrimary) {
    if (isArithmetic || isAlgebra) {
      return [
        { name: 'Math Antics', handle: 'mathantics', type: 'core' },
        { name: 'Numberblocks', handle: 'learningblocks', type: 'fun' },
        { name: 'Miacademy Learning', handle: 'miacademy', type: 'lesson' },
        { name: 'Smile and Learn', handle: 'smileandlearn', type: 'educational' },
        { name: 'Onlock Learning', handle: 'onlocklearning', type: 'nigerian' }
      ];
    }
    return [
      { name: 'Math Antics', handle: 'mathantics', type: 'core' },
      { name: 'Scratch Garden', handle: 'scratchgarden', type: 'fun' },
      { name: 'Miacademy Learning', handle: 'miacademy', type: 'lesson' }
    ];
  }
  
  // Junior Secondary Math Channels
  if (isJSS) {
    return [
      { name: 'Math Antics', handle: 'mathantics', type: 'foundation' },
      { name: 'Khan Academy', handle: 'khanacademy', type: 'comprehensive' },
      { name: 'Eddie Woo', handle: 'misterwootube', type: 'detailed' },
      { name: 'Onlock Learning', handle: 'onlocklearning', type: 'nigerian' },
      { name: 'TabletClass Math', handle: 'tabletclassmath', type: 'structured' }
    ];
  }
  
  // Senior Secondary / Advanced Math Channels
  if (isSS) {
    if (isCalculus) {
      return [
        { name: '3Blue1Brown', handle: '3blue1brown', type: 'visual' },
        { name: 'Professor Leonard', handle: 'professorleonard', type: 'lecture' },
        { name: 'blackpenredpen', handle: 'blackpenredpen', type: 'problems' },
        { name: 'The Organic Chemistry Tutor', handle: 'theorganicchemistrytutorm', type: 'review' }
      ];
    }
    if (isTrig || isGeometry) {
      return [
        { name: 'Eddie Woo', handle: 'misterwootube', type: 'explanation' },
        { name: 'Khan Academy', handle: 'khanacademy', type: 'comprehensive' },
        { name: 'Professor Leonard', handle: 'professorleonard', type: 'lecture' }
      ];
    }
    return [
      { name: '3Blue1Brown', handle: '3blue1brown', type: 'visual' },
      { name: 'blackpenredpen', handle: 'blackpenredpen', type: 'problems' },
      { name: 'Khan Academy', handle: 'khanacademy', type: 'comprehensive' },
      { name: 'Eddie Woo', handle: 'misterwootube', type: 'explanation' },
      { name: 'The Organic Chemistry Tutor', handle: 'theorganicchemistrytutorm', type: 'review' }
    ];
  }
  
  // Default channels
  return [
    { name: 'Khan Academy', handle: 'khanacademy', type: 'comprehensive' },
    { name: 'Math Antics', handle: 'mathantics', type: 'foundation' },
    { name: 'Eddie Woo', handle: 'misterwootube', type: 'explanation' }
  ];
}

// ============================================
// GEMINI TOPIC PLANNING
// ============================================
async function _fetchMathTopicData(questionText, level, topic) {
  const channels = _getMathChannels(level, topic);
  const chNames = channels.slice(0, 4).map(c => c.name);
  const chList = chNames.map((n, i) => `Channel ${i + 1}: ${n}`).join('\n');
  
  const prompt = `You are a mathematics education expert helping Nigerian students.
LEVEL: ${level}
TOPIC: ${topic}
QUESTION: "${questionText}"

CRITICAL: All content must be in ENGLISH. Recommend only English-language resources.

TASK 1: Identify the single precise mathematical concept being tested.
TASK 2: Extract 4-6 must-match keywords for searching.
TASK 3: Write one search query per suggested channel that will find the best explanation.

Suggested channels:
${chList}

Return ONLY valid JSON:
{
  "topicLabel": "<precise concept>",
  "mustMatchTerms": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "searches": [
    { "query": "<Channel Name> <concept> explained", "channel": "<Channel Name>", "angle": "<what this video teaches>" }
  ],
  "interactive": [
    { "name": "<tool name>", "url": "<url>", "type": "practice|visualiser|game", "description": "<one sentence>" }
  ],
  "manipulative": "<hands-on activity description>"
}`;
  
  try {
    const data = await geminiGenerate({
      key: state.GEMINI_KEY,
      body: {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 800 }
      },
    });
    const text = geminiText(data);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.warn('Video topic plan failed:', e);
  }
  return null;
}

// ============================================
// YOUTUBE SEARCH WITH RELEVANCE SCORING
// ============================================
function _scoreTitle(title, keywords, topic) {
  const t = title.toLowerCase();
  
  // Hard reject for non-English or irrelevant content
  const blacklist = ['hindi', 'urdu', 'tamil', 'malayalam', 'telugu', 'cbse', 'ncert', 'jee', 'neet', 'bangla'];
  if (blacklist.some(word => t.includes(word))) return -100;
  
  let score = 0;
  
  // Topic match (high weight)
  if (topic && t.includes(topic.toLowerCase())) score += 5;
  
  // Keyword matches
  if (keywords?.length) {
    keywords.forEach(kw => {
      if (t.includes(kw.toLowerCase())) score += 2;
    });
  }
  
  // Prefer educational channels
  const preferredChannels = ['khan academy', 'math antics', 'eddie woo', '3blue1brown', 'professor leonard', 'blackpenredpen'];
  preferredChannels.forEach(ch => {
    if (t.includes(ch)) score += 3;
  });
  
  // Lesson/explanation indicators
  if (t.includes('lesson') || t.includes('explained') || t.includes('tutorial')) score += 2;
  
  return score;
}

async function _ytSearch(query, keywords, topic) {
  if (!state.YT_KEY_VERIFIED || !state.YT_KEY) return null;
  
  const searchQuery = `${query} English lesson`;
  
  const url = [
    'https://www.googleapis.com/youtube/v3/search',
    '?part=snippet',
    '&type=video',
    '&maxResults=10',
    '&videoEmbeddable=true',
    '&safeSearch=strict',
    '&videoDuration=medium',
    '&relevanceLanguage=en',
    '&regionCode=NG',
    `&q=${encodeURIComponent(searchQuery)}`,
    `&key=${encodeURIComponent(state.YT_KEY)}`
  ].join('');
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube API ${res.status}`);
    const data = await res.json();
    if (!data.items?.length) return null;
    
    const scored = data.items.map(item => ({
      item,
      score: _scoreTitle(item.snippet.title, keywords, topic)
    }));
    
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    
    if (best.score < 1) return null;
    
    const item = best.item;
    return {
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      score: best.score
    };
  } catch (error) {
    console.warn('YouTube search failed:', error);
    return null;
  }
}

// ============================================
// MAIN RESOURCE FETCH FUNCTION
// ============================================
async function _fetchMathResources(questionText, level, topic) {
  const cacheKey = `${level}::${topic}::${questionText.slice(0, 80)}`;
  if (_videoCache[cacheKey]) return _videoCache[cacheKey];
  
  const channels = _getMathChannels(level, topic);
  const topChannels = channels.slice(0, 4);
  
  let topicData = null;
  try {
    topicData = await _fetchMathTopicData(questionText, level, topic);
  } catch (e) {
    console.warn('Gemini planning failed:', e);
  }
  
  const topicLabel = topicData?.topicLabel || topic;
  const mustMatchTerms = topicData?.mustMatchTerms?.length 
    ? topicData.mustMatchTerms 
    : topicLabel.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  const searches = topicData?.searches?.length >= 4
    ? topicData.searches.slice(0, 4)
    : topChannels.map((ch, i) => ({
        query: `${ch.name} ${topicLabel}`,
        channel: ch.name,
        angle: `${topicLabel} explanation`
      }));
  
  let videos = [];
  
  if (state.YT_KEY_VERIFIED && state.YT_KEY) {
    for (let i = 0; i < Math.min(searches.length, 4); i++) {
      try {
        const result = await _ytSearch(searches[i].query, mustMatchTerms, topicLabel);
        if (result && !videos.some(v => v.videoId === result.videoId)) {
          videos.push({
            mode: 'embed',
            videoId: result.videoId,
            title: result.title,
            channel: result.channel,
            angle: searches[i].angle,
            thumb: result.thumbnail,
            watchUrl: `https://www.youtube.com/watch?v=${result.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${result.videoId}?rel=0&modestbranding=1&autoplay=0`
          });
        }
      } catch (e) {
        console.warn('Video fetch failed for search:', e);
      }
    }
  }
  
  if (!videos.length) {
    videos = searches.map(s => ({
      mode: 'search',
      channel: s.channel,
      handle: channels.find(c => c.name === s.channel)?.handle || '',
      angle: s.angle,
      searchUrl: channels.find(c => c.name === s.channel)?.handle
        ? `https://www.youtube.com/@${channels.find(c => c.name === s.channel).handle}/search?query=${encodeURIComponent(s.query)}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(s.query)}`,
      query: s.query
    }));
  }
  
  const interactive = topicData?.interactive || [
    { name: 'Khan Academy', url: 'https://www.khanacademy.org/math', type: 'practice', description: 'Practice problems with step-by-step solutions' },
    { name: 'GeoGebra', url: 'https://www.geogebra.org/math', type: 'visualiser', description: 'Interactive math visualizations and tools' },
    { name: 'Desmos', url: 'https://www.desmos.com/calculator', type: 'visualiser', description: 'Free graphing calculator' }
  ];
  
  const result = {
    topicLabel,
    videos,
    interactive: interactive.slice(0, 3),
    manipulative: topicData?.manipulative || `Use physical objects like coins, counters, or a whiteboard to practice ${topicLabel} concepts.`
  };
  
  _videoCache[cacheKey] = result;
  return result;
}

// ============================================
// RENDER VIDEO PANEL
// ============================================
function _renderVideoPanel(row, data) {
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  
  const videoItems = (data.videos || []).map(v => {
    if (v.mode === 'embed') {
      return `
        <div class="pvr-embed-block">
          <div class="pvr-embed-thumb-wrap" data-embedurl="${esc(v.embedUrl)}" tabindex="0" role="button">
            <img class="pvr-thumb" src="${esc(v.thumb)}" alt="${esc(v.title)}" loading="lazy">
            <div class="pvr-play-btn">▶</div>
          </div>
          <div class="pvr-embed-info">
            <div class="pvr-embed-title">${esc(v.title)}</div>
            <div class="pvr-embed-meta">
              <span class="pvr-embed-channel">${esc(v.channel)}</span>
              ${v.angle ? `<span class="pvr-embed-angle">${esc(v.angle)}</span>` : ''}
            </div>
            <a class="pvr-watch-link" href="${esc(v.watchUrl)}" target="_blank" rel="noopener">Watch on YouTube ↗</a>
          </div>
        </div>`;
    }
    return `
      <a class="pvr-search-card" href="${esc(v.searchUrl)}" target="_blank" rel="noopener">
        <div class="pvr-search-yt-icon">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        </div>
        <div class="pvr-search-info">
          <div class="pvr-search-channel">${esc(v.channel)}</div>
          <div class="pvr-search-query">${esc(v.angle || v.query)}</div>
          <div class="pvr-search-hint">Search this channel →</div>
        </div>
      </a>`;
  }).join('');
  
  const interactiveCards = (data.interactive || []).map(r => `
    <a class="pvr-tool-card" href="${esc(r.url)}" target="_blank" rel="noopener">
      <div class="pvr-tool-type pvr-type-${esc(r.type)}">${esc(r.type)}</div>
      <div class="pvr-tool-info">
        <div class="pvr-tool-name">${esc(r.name)}</div>
        <div class="pvr-tool-desc">${esc(r.description)}</div>
      </div>
      <div class="pvr-ext-icon">↗</div>
    </a>
  `).join('');
  
  const modeLabel = data.videos?.[0]?.mode === 'embed'
    ? '<span class="pvr-mode-badge pvr-mode-live">▶ Live Videos</span>'
    : '<span class="pvr-mode-badge pvr-mode-search">🔍 Channel Search</span>';
  
  row.innerHTML = `
    <div class="pvr-panel">
      <div class="pvr-header">
        <span class="pvr-topic">📐 ${esc(data.topicLabel)}</span>
        ${modeLabel}
        <button class="pvr-close-btn" type="button">✕</button>
      </div>
      <div class="pvr-section-label">📺 Recommended Videos</div>
      ${videoItems || '<div class="pvr-no-results">No videos found. Try searching directly on YouTube.</div>'}
      ${interactiveCards ? `<div class="pvr-section-label">🎮 Interactive Tools</div>${interactiveCards}` : ''}
      ${data.manipulative ? `
        <div class="pvr-manipulative">
          <div class="pvr-manip-icon">✋</div>
          <div class="pvr-manip-text"><strong>Hands-on Activity:</strong> ${esc(data.manipulative)}</div>
        </div>` : ''}
    </div>`;
  
  // Embed click handlers
  row.querySelectorAll('.pvr-embed-thumb-wrap').forEach(wrap => {
    const activate = () => {
      const iframe = document.createElement('div');
      iframe.className = 'pvr-iframe-wrap';
      iframe.innerHTML = `<iframe src="${wrap.dataset.embedurl}&autoplay=1"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen loading="lazy" frameborder="0"></iframe>`;
      wrap.replaceWith(iframe);
    };
    wrap.addEventListener('click', activate);
    wrap.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') activate(); });
  });
  
  row.querySelector('.pvr-close-btn').addEventListener('click', () => {
    row.innerHTML = `<button class="paper-video-btn" type="button">▶ Watch Video</button>`;
    const newBtn = row.querySelector('.paper-video-btn');
    newBtn.addEventListener('click', () => handleVideoBtn(newBtn));
  });
}

// ============================================
// PUBLIC ENTRY POINT
// ============================================
export async function handleVideoBtn(btn) {
  const row = btn.closest('.paper-video-row');
  if (!row) return;
  
  const qTextEl = row.closest('.paper-q-block')?.querySelector('.paper-q-text');
  const questionText = qTextEl?.textContent?.trim() || btn.dataset.qtext || state.currentQuestion || '';
  const level = state.currentClass || 'ss1';
  const topic = state.currentTopic || 'Algebra';
  
  row.innerHTML = `<div class="pvr-loading"><span class="pvr-spinner"></span>Finding math resources...</div>`;
  
  try {
    const data = await _fetchMathResources(questionText, level, topic);
    _renderVideoPanel(row, data);
  } catch (err) {
    row.innerHTML = `
      <div class="pvr-error">Could not load resources — ${err.message}.
        <button class="paper-video-btn pvr-retry-btn" type="button" style="margin-left:8px">Retry</button>
      </div>`;
    row.querySelector('.pvr-retry-btn').addEventListener('click', () => {
      row.innerHTML = `<button class="paper-video-btn" type="button">▶ Watch Video</button>`;
      const newBtn = row.querySelector('.paper-video-btn');
      if (questionText) newBtn.dataset.qtext = questionText;
      newBtn.addEventListener('click', () => handleVideoBtn(newBtn));
      handleVideoBtn(newBtn);
    });
  }
}