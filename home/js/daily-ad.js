/* ============================================================================
   PREPBOT'S ADVERT OF THE DAY — on the front page
   ----------------------------------------------------------------------------
   One of the thirty adverts (data/ads/prepbot-ads.js), chosen by the date, in
   a card under the hero: PrepBot, one line about one thing the site does, and
   a button that goes straight to it.

   WHY THE DATE AND NOT A SHUFFLE. A visitor who comes back on Tuesday should
   see Tuesday's advert, not a random one — if it changed on every reload it
   would read as noise rather than as something the site is saying today, and
   nobody could say "did you see the one about the toy shop?". The same day
   gives the same advert to everybody.

   It is only ever an advert for OUR OWN pages, so the link is an ordinary
   internal one and there is no tracking in it.
   ========================================================================== */

import { ADS, adOfDay } from "/data/ads/prepbot-ads.js";
import { ICON_PREPBOT } from "/prep-math/mental-math/shared/icons.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** Today's advert, or a named one. */
export const pick = (id) => (id && ADS.find((a) => a.id === id)) || adOfDay();

/** The card's markup, so it can be rendered anywhere this is wanted. */
export function adHtml(ad) {
  return `
    <article class="dad pp-receipt" data-ad="${esc(ad.id)}">
      <div class="pp-receipt__paper dad__paper">
        <span class="dad__bot" aria-hidden="true">${ICON_PREPBOT}</span>
        <div class="dad__words">
          <p class="dad__eyebrow">PrepBot says &middot; ${esc(ad.feature)}</p>
          <h3 class="dad__head">${esc(ad.headline)}</h3>
          <p class="dad__say">${esc(ad.say)}</p>
        </div>
        <a class="pp-btn dad__go" href="${esc(ad.href)}">${esc(ad.cta)}</a>
      </div>
    </article>`;
}

/**
 * Put today's advert in `host` (or in `#daily-ad`).
 * → the advert that was shown, or null if there was nowhere to put it
 */
export function mountDailyAd(host = document.getElementById("daily-ad")) {
  if (!host) return null;
  const ad = pick(host.dataset.ad);
  host.innerHTML = adHtml(ad);
  /* the heading is for people, so it says the day's subject out loud to a
     screen reader once rather than on every re-render */
  host.setAttribute("aria-label", `Today from PrepBot: ${ad.headline}`);
  return ad;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mountDailyAd());
  } else {
    mountDailyAd();
  }
}
