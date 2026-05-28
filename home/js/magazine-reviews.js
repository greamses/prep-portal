// ─── Subject accent gradients ─────────────────────────────────────────────────
const SUBJECT_GRADIENTS = {
  'MATHEMATICS':      'linear-gradient(135deg, #0055ff 0%, #003db3 100%)',
  'CAMBRIDGE IGCSE':  'linear-gradient(135deg, #0891b2 0%, #164e63 100%)',
  'JAMB CBT':         'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
  'CONVINCING VALUE': 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
  'ENGLISH':          'linear-gradient(135deg, #16a34a 0%, #14532d 100%)',
  'ECONOMICS':        'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
  'BIOLOGY':          'linear-gradient(135deg, #059669 0%, #064e3b 100%)',
};

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #0055ff 0%, #003db3 100%)';

function subjectGradient(subject) {
  return SUBJECT_GRADIENTS[(subject || '').toUpperCase()] || DEFAULT_GRADIENT;
}

function avatarUrl(author) {
  const seed = encodeURIComponent((author || 'student').replace(/[^a-zA-Z0-9 ]/g, '').trim());
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

function stars(n = 5) {
  return '★'.repeat(Math.max(0, Math.min(5, n)));
}

// ─── Card renderers ───────────────────────────────────────────────────────────

function heroCard(review) {
  const bg = subjectGradient(review.subject);
  const av = avatarUrl(review.author);
  return `
    <article class="mag-hero">
      <div class="mag-hero-image" style="background: ${bg};">
        <span class="mag-hero-subject-badge">${review.subject || 'REVIEW'}</span>
        <span class="mag-hero-stars">${stars(review.stars)}</span>
        <div class="mag-hero-avatar" style="background-image: url('${av}');"></div>
      </div>
      <div class="mag-hero-body">
        <span class="mag-hero-label">Featured Review</span>
        <p class="mag-hero-quote">${review.quote || ''}</p>
        <div class="mag-hero-byline">
          <span class="mag-hero-author">${review.author || ''}</span>
          <span class="mag-hero-role">${review.role || ''}</span>
        </div>
      </div>
    </article>`;
}

function portraitCard(review) {
  const bg = subjectGradient(review.subject);
  const av = avatarUrl(review.author);
  return `
    <article class="mag-card">
      <div class="mag-card-image" style="background: ${bg};">
        <div class="mag-card-portrait" style="background-image: url('${av}');"></div>
        <span class="mag-card-subject-bar">${review.subject || 'REVIEW'}</span>
      </div>
      <div class="mag-card-body">
        <span class="mag-card-stars">${stars(review.stars)}</span>
        <p class="mag-card-quote">${review.quote || ''}</p>
        <div class="mag-card-author">
          <div class="mag-card-avatar" style="background-image: url('${av}');"></div>
          <span>${review.author || ''}</span>
        </div>
      </div>
    </article>`;
}

function pullQuoteCard(review) {
  return `
    <aside class="mag-pullquote">
      <p class="mag-pullquote-text">${review.quote || ''}</p>
      <span class="mag-pullquote-credit">— ${review.author || ''}&nbsp;&nbsp;·&nbsp;&nbsp;${review.role || ''}</span>
    </aside>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Renders a magazine-style testimonials layout into `containerId`.
 *
 * @param {object} config
 * @param {string} config.containerId - ID of the .mag-grid wrapper div
 * @param {Array}  config.data        - page objects (same shape as initTestimonialFlipbook)
 */
export function initMagazineReviews({ containerId, data }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const reviews = data.filter(p => p.type === 'testimonial');
  if (!reviews.length) return;

  const [hero, ...rest] = reviews;
  const tripleCards = rest.slice(0, 3);
  // Pull quote: prefer a student quote, otherwise fall back to last review
  const pullReview = rest.find(r => /student/i.test(r.role)) ?? rest[rest.length - 1] ?? hero;

  let html = heroCard(hero);

  if (tripleCards.length) {
    html += `<div class="mag-triple">`;
    tripleCards.forEach(r => { html += portraitCard(r); });
    html += `</div>`;
  }

  html += pullQuoteCard(pullReview);

  container.innerHTML = html;
}
