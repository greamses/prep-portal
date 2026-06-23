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

// Cloudinary photo, server-cropped to a consistent portrait card (g_auto keeps
// faces in frame). Pass the version + filename segment of the upload URL.
const CL = (path) =>
  `https://res.cloudinary.com/duvqnpvbu/image/upload/c_fill,g_auto,w_700,h_900/${path}`;

// cx/cy = the card's centre as a % of the stage; rot = fan angle; z = stack
// order (centre cards sit in front). Captions are little yearbook notes.
const CARDS = [
  { photo: CL("v1782015101/496216720_1782014294929759_nk8obu.jpg"),       name: "Arjun",  tag: "JAMB 320",   cx: 18, cy: 62, rot: -16, z: 1, note: "Scored 320 in JAMB on my first try!",     pad: "#bfe3ff" },
  { photo: CL("v1782015100/311502132_1782014135194463_mav2h7.jpg"),       name: "Amara",  tag: "WAEC A1",    cx: 29, cy: 52, rot: -11, z: 3, note: "Went from C's to straight A1's in WAEC.", pad: "#ffc9de" },
  { photo: CL("v1782015099/54024348_1782014016869533_vr5spb.jpg"),        name: "Daniel", tag: "Top 5%",     cx: 40, cy: 46, rot: -5,  z: 5, note: "Finished top 5% of my whole school.",     pad: "#c8f0c0" },
  { photo: CL("v1782015099/403814218_1781987988690441_vx8ufl.jpg"),       name: "Mei",    tag: "Maths whiz", cx: 50, cy: 44, rot: 0,   z: 7, note: "Maths finally clicked — now it's my best.", pad: "#fff39a" },
  { photo: CL("v1782015099/file_00000000e97471f4a454e0e691ff993e_ofxqhd.png"), name: "Kai",   tag: "Science", cx: 60, cy: 46, rot: 5,  z: 6, note: "Won my regional science fair this term!",  pad: "#e8d5ff" },
  { photo: CL("v1782015095/618842865_1782014454163681_ozpp2n.jpg"),       name: "Layla", tag: "Coding",     cx: 71, cy: 52, rot: 11,  z: 4, note: "Built and shipped my first app at 14.",    pad: "#ffd9a8" },
  { photo: CL("v1782015082/926169530_1781989517144905_av22gh.jpg"),       name: "Emeka", tag: "Reading",    cx: 82, cy: 62, rot: 16,  z: 2, note: "Reading is my favourite part of the day.", pad: "#bdeae6" },
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
