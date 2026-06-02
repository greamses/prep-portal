/* =========================================================================
   STUDENT PHOTOCARDS — real photos, torn from the scrapbook, layered like a
   fanned deck of cards.
   -------------------------------------------------------------------------
   Each card is a real student photo on torn white paper (the ragged edge is
   an SVG displacement filter in index.html). Cards are absolutely positioned
   in an overlapping fan; GSAP "deals" them out of a centre pile on scroll.

   ▸ PHOTOS are remote placeholders (hotlinked Pexels) so nothing bloats the
     repo. To use your own, just replace each `photo` URL below — a remote link
     or a local path like "/home/img/students/amara.jpg" both work.
========================================================================= */

// Hotlinked Pexels photo, cropped to a portrait card.
const PX = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=700&h=900&fit=crop`;

// cx/cy = the card's centre as a % of the stage; rot = fan angle; z = stack
// order (centre cards sit in front). Captions are little yearbook notes.
const CARDS = [
  { photo: PX(13538613), name: "Arjun",  tag: "JAMB 320",   cx: 23, cy: 60, rot: -14, z: 1, note: "Scored 320 in JAMB on my first try!",     pad: "#bfe3ff" },
  { photo: PX(5538020),  name: "Amara",  tag: "WAEC A1",    cx: 35, cy: 50, rot: -8,  z: 3, note: "Went from C's to straight A1's in WAEC.", pad: "#ffc9de" },
  { photo: PX(36608621), name: "Mei",    tag: "Top 5%",     cx: 46, cy: 45, rot: -3,  z: 5, note: "Finished top 5% of my whole school.",     pad: "#c8f0c0" },
  { photo: PX(5940722),  name: "Daniel", tag: "Maths whiz", cx: 57, cy: 45, rot: 3,   z: 6, note: "Maths finally clicked — now it's my best.", pad: "#fff39a" },
  { photo: PX(3808849),  name: "Layla",  tag: "Science",    cx: 68, cy: 50, rot: 8,   z: 4, note: "Won my regional science fair this term!",  pad: "#e8d5ff" },
  { photo: PX(6238089),  name: "Kai",    tag: "Coding",     cx: 78, cy: 60, rot: 14,  z: 2, note: "Built and shipped my first app at 14.",    pad: "#ffd9a8" },
];

const stage = document.querySelector(".cards-stage");
const cardEls = [];

if (stage) {
  CARDS.forEach((c) => {
    const card = document.createElement("figure");
    card.className = "photocard";
    card.style.cssText = `--cx:${c.cx}%;--cy:${c.cy}%;--rot:${c.rot}deg;--z:${c.z};--pad:${c.pad}`;
    card.innerHTML =
      `<div class="photocard__rip">` +
      `<img class="photocard__photo" src="${c.photo}" alt="" loading="lazy">` +
      `</div>` +
      `<figcaption class="photocard__cap">${c.name}<span>${c.tag}</span></figcaption>` +
      `<div class="photocard__note">${c.note}</div>`;
    stage.appendChild(card);
    cardEls.push(card);
  });
}

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (stage && cardEls.length && !reduce) {
  import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm")
    .then(({ gsap }) => {
      // Resting state mirrors the CSS fan (centre origin + fan rotation).
      gsap.set(cardEls, {
        xPercent: -50,
        yPercent: -50,
        rotation: (i) => CARDS[i].rot,
        transformOrigin: "50% 50%",
      });

      // Hover: pull the card forward (above its neighbours) and zoom it,
      // straightening it so the face reads upright while focused.
      cardEls.forEach((card, i) => {
        card.style.cursor = "pointer";
        card.addEventListener("mouseenter", () => {
          card.style.zIndex = 20;
          gsap.to(card, {
            scale: 1.22,
            rotation: 0,
            y: -10,
            duration: 0.32,
            ease: "power3.out",
            overwrite: "auto",
          });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, {
            scale: 1,
            rotation: CARDS[i].rot,
            y: 0,
            duration: 0.42,
            ease: "power2.out",
            overwrite: "auto",
            onComplete: () => {
              card.style.zIndex = CARDS[i].z;
            },
          });
        });
      });

      let played = false;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting || played) return;
            played = true;
            io.disconnect();

            // Deal the cards: each starts collapsed at the centre of the stage,
            // unrotated and small, then springs out to its place in the fan.
            const stageW = stage.getBoundingClientRect().width || 1000;
            gsap.from(cardEls, {
              x: (i) => ((50 - CARDS[i].cx) / 100) * stageW,
              y: 28,
              rotation: 0,
              scale: 0.82,
              autoAlpha: 0,
              duration: 0.7,
              ease: "back.out(1.4)",
              stagger: { each: 0.1, from: "center" },
            });
          });
        },
        { threshold: 0.25 },
      );
      io.observe(stage);
    })
    .catch(() => {
      /* CSS already shows the fully fanned deck */
    });
}
