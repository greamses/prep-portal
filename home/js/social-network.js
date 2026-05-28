// ─── DiceBear avatar URL ──────────────────────────────────────────────────────
function avatarUrl(name, role) {
  const seed = encodeURIComponent(name.replace(/[^a-zA-Z0-9 ]/g, '').trim());
  const bg   = role === 'tutor' ? 'bbf7d0' : role === 'student' ? 'bfdbfe' : 'fde68a';
  // avataaars + mood=happy ensures no angry expressions
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${bg}&mood=happy&size=200`;
}

// Skeleton bg colour — shown while avatar SVG loads, matches DiceBear bg
const SKELETON_BG = { tutor: '#bbf7d0', student: '#bfdbfe', parent: '#fde68a' };

// ─── City → lat/lon (Africa + global) ────────────────────────────────────────
const CITY_COORDS = {
  Lagos:      [3.3792,  6.5244],
  Abuja:      [7.4004,  9.0579],
  Port Harcourt: [4.7774, 6.9984],
  Kano:       [8.5139, 12.0022],
  Enugu:      [7.4989,  6.4584],
  Ibadan:     [3.3804,  7.3775],
  Owerri:     [7.0333,  5.4833],
  Kaduna:     [7.6401, 10.5105],
  Benin City: [5.6254,  6.3197],
  Jos:        [8.9997,  9.8965],
  Anambra:    [6.2134,  7.6320],
  Aba:        [7.3667,  5.0167],
  Accra:      [-0.1875, 5.6036],
  London:     [-0.1276, 51.5074],
};

// ─── People dataset (100 nodes) ───────────────────────────────────────────────
const TUTORS = [
  ['Ada Nwosu',          'Mathematics · 4.9★'],
  ['Dr. Ibrahim Sule',   'Sciences · 4.8★'],
  ['Miss Grace Eze',     'English · 5.0★'],
  ['Mr. Taiwo Adeleke',  'Economics · 4.7★'],
  ['Prof. Adeola Bello', 'JAMB Prep · 5.0★'],
  ['Mrs. Chioma Okafor', 'Biology · 4.8★'],
  ['Mr. Emeka Eze',      'Physics · 4.9★'],
  ['Dr. Fatima Musa',    'Chemistry · 4.7★'],
  ['Mr. Segun Adeyemi',  'Literature · 4.8★'],
  ['Mrs. Amaka Obi',     'History · 4.6★'],
  ['Mr. Yusuf Hassan',   'Geography · 4.7★'],
  ['Dr. Ngozi Chukwu',   'Further Maths · 5.0★'],
  ['Miss Temi Olawale',  'Computer Sci · 4.8★'],
  ['Mr. Bayo Salami',    'Commerce · 4.6★'],
  ['Mrs. Kemi Adesanya', 'Government · 4.7★'],
];

const STUDENTS = [
  ['Chidi Kalu',         'Lagos'],
  ['Amina Yusuf',        'Abuja'],
  ['Tunde Okonkwo',      'Port Harcourt'],
  ['Fatima Abdullahi',   'Kano'],
  ['Emeka Obi',          'Enugu'],
  ['Kemi Johnson',       'Ibadan'],
  ['Ngozi Eze',          'Owerri'],
  ['Abubakar Musa',      'Kaduna'],
  ['Chidinma Okafor',    'Lagos'],
  ['Seun Adeyemi',       'Lagos'],
  ['Halima Ibrahim',     'Abuja'],
  ['Obinna Chukwu',      'Enugu'],
  ['Tobi Salami',        'Ibadan'],
  ['Zara Mohammed',      'Abuja'],
  ['Ifeoma Nwosu',       'Owerri'],
  ['Samuel Osei',        'Accra'],
  ['Ayasha Williams',    'London'],
  ['Kofi Mensah',        'Accra'],
  ['Aisha Garba',         'Kano'],
  ['Taiwo Oluwaseun',    'Lagos'],
  ['Chukwuemeka Nnaji',  'Anambra'],
  ['Blessing Otuboh',    'Benin City'],
  ['Rashida Usman',      'Abuja'],
  ['Victor Okonkwo',     'Port Harcourt'],
  ['Adaeze Okeke',       'Lagos'],
  ['Musa Tanko',         'Jos'],
  ['Yetunde Adedeji',    'Ibadan'],
  ['Ifeanyi Ejike',      'Enugu'],
  ['Nkechi Alozie',      'Aba'],
  ['Emmanuel Bello',    'Abuja'],
  ['Sophia Okoye',       'Lagos'],
  ['Daniel Madu',        'Enugu'],
  ['Amara Chibueze',     'Owerri'],
  ['Ibrahim Yahaya',     'Kano'],
  ['Priscilla Eze',      'Abuja'],
  ['Ahmed Lawal',        'Kaduna'],
  ['Obiageli Nze',       'Anambra'],
  ['Oluwafemi Adesanya', 'Lagos'],
  ['Hauwa Bello',        'Abuja'],
  ['Michael Ugwu',       'Enugu'],
  ['Chiamaka Osei',      'Accra'],
  ['Kabir Shuaibu',      'Kano'],
  ['Adunola Fasanya',    'Lagos'],
  ['Chizaram Ndukwe',    'Owerri'],
  ['Leke Afolabi',       'Ibadan'],
  ['Precious Okwu',      'Port Harcourt'],
  ['Sulaiman Aliyu',     'Abuja'],
  ['Joy Okafor',         'Lagos'],
  ['Ikenna Obiora',      'Enugu'],
  ['Funmi Adeniyi',      'Ibadan'],
  ['Abdulrahman Musa',   'Kano'],
  ['Chioma Ezeh',        'Owerri'],
  ['Bola Oluwaseun',     'Lagos'],
  ['Gbenga Adeleke',     'Ibadan'],
  ['Rita Egwu',          'Benin City'],
];

const PARENTS = [
  ['Mrs. Ngozi Okon',       '2 children enrolled'],
  ['Mr. Abiodun Alade',     '1 child enrolled'],
  ['Mrs. Hauwa Bello',      '2 children enrolled'],
  ['Chief Nwosu',           '3 children enrolled'],
  ['Mrs. Adaeze Okafor',    '2 children enrolled'],
  ['Mr. Emeka Chukwu',      '1 child enrolled'],
  ['Mrs. Ramatu Ibrahim',   '2 children enrolled'],
  ['Dr. Segun Adeyemi Sr.', '1 child enrolled'],
  ['Mrs. Bisi Salami',      '2 children enrolled'],
  ['Mr. Chidi Madu',        '1 child enrolled'],
  ['Mrs. Yetunde Johnson',  '2 children enrolled'],
  ['Mr. Musa Tanko Sr.',    '1 child enrolled'],
  ['Mrs. Funke Adesanya',   '3 children enrolled'],
  ['Mr. Ikenna Obi Sr.',    '1 child enrolled'],
  ['Mrs. Chidinma Eze',     '2 children enrolled'],
  ['Mr. Aminu Lawal',       '2 children enrolled'],
  ['Mrs. Ngozi Obiora',     '1 child enrolled'],
  ['Dr. Taiwo Adeleke Sr.', '2 children enrolled'],
  ['Mrs. Kemi Olawole',     '1 child enrolled'],
  ['Mr. Biodun Fasanya',    '2 children enrolled'],
  ['Mrs. Ifeoma Ndukwe',    '1 child enrolled'],
  ['Mr. Samuel Osei Sr.',   '1 child enrolled'],
  ['Mrs. Grace Mensah',     '2 children enrolled'],
  ['Mr. Kabiru Shuaibu Sr.','1 child enrolled'],
  ['Mrs. Ezeoke',           '2 children enrolled'],
  ['Mr. Chukwudi Ugwu',     '1 child enrolled'],
  ['Mrs. Aminat Aliyu',     '2 children enrolled'],
  ['Mr. Femi Adeniyi',      '1 child enrolled'],
  ['Mrs. Rita Egwu Sr.',    '1 child enrolled'],
  ['Mr. Gbenga Oluwaseun',  '2 children enrolled'],
];

function buildPeopleList() {
  const sizes        = { tutor: 88, student: 66, parent: 56 };
  const borderColors = { tutor: '#16a34a', student: '#2563eb', parent: '#d97706' };
  const people = [];

  TUTORS.forEach(([name, detail], i) => people.push({
    id: `t${i + 1}`, role: 'tutor', name, detail,
    size: sizes.tutor, borderColor: borderColors.tutor,
    bgColor: SKELETON_BG.tutor,
    avatar: undefined,
    avatarUrl: avatarUrl(name, 'tutor'),
  }));

  STUDENTS.forEach(([name, city], i) => {
    const coords  = CITY_COORDS[city] ?? [Math.random() * 360 - 180, Math.random() * 140 - 70];
    const [px, py] = projectCity(coords[0], coords[1]);
    people.push({
      id: `s${i + 1}`, role: 'student', name,
      detail: city,
      size: sizes.student, borderColor: borderColors.student,
      bgColor: SKELETON_BG.student,
      avatar: undefined,
      avatarUrl: avatarUrl(name, 'student'),
      position: { x: px, y: py },
    });
  });

  PARENTS.forEach(([name, detail], i) => people.push({
    id: `p${i + 1}`, role: 'parent', name, detail,
    size: sizes.parent, borderColor: borderColors.parent,
    bgColor: SKELETON_BG.parent,
    avatar: undefined,
    avatarUrl: avatarUrl(name, 'parent'),
  }));

  return people;
}

// ─── Generate links ───────────────────────────────────────────────────────────
function generateLinks(people) {
  const links = [];
  const tIds  = people.filter(p => p.role === 'tutor').map(p => p.id);
  const sIds  = people.filter(p => p.role === 'student').map(p => p.id);
  const pIds  = people.filter(p => p.role === 'parent').map(p => p.id);

  sIds.forEach((sid, i) => {
    links.push({ source: sid, target: tIds[i % tIds.length], type: 'study' });
    if (i % 3 === 0) {
      const t2 = tIds[(i + 7) % tIds.length];
      if (t2 !== tIds[i % tIds.length]) links.push({ source: sid, target: t2, type: 'study' });
    }
  });
  sIds.forEach((sid, i) => {
    links.push({ source: sid, target: pIds[Math.floor(i * pIds.length / sIds.length)], type: 'family' });
  });
  for (let i = 0; i < sIds.length - 2; i += 4) {
    links.push({ source: sIds[i],     target: sIds[i + 1], type: 'peer' });
    links.push({ source: sIds[i + 1], target: sIds[i + 2], type: 'peer' });
  }
  for (let i = 0; i < tIds.length - 1; i += 2) {
    links.push({ source: tIds[i], target: tIds[i + 1], type: 'colleague' });
  }
  return links;
}

const EDGE_COLORS = {
  study: '#60a5fa', family: '#fbbf24', peer: '#c4b5fd', colleague: '#4ade80',
};

// ─── Cytoscape elements ───────────────────────────────────────────────────────
function buildElements(people, links) {
  const nodes = people.map(p => {
    const node = {
      data: {
        id: p.id, name: p.name, role: p.role, detail: p.detail,
        borderColor: p.borderColor, size: p.size,
        bgColor: p.bgColor,
        avatar: p.avatar,
        avatarLoaded: false,
      },
    };
    if (p.position) node.position = p.position;
    return node;
  });
  const edges = links.map((l, i) => ({
    data: { id: `e${i}`, source: l.source, target: l.target, type: l.type, color: EDGE_COLORS[l.type] || '#60a5fa' },
  }));
  return [...nodes, ...edges];
}

// ─── Cytoscape stylesheet ─────────────────────────────────────────────────────
function buildStyle() {
  return [
    {
      selector: 'node',
      style: {
        shape: 'ellipse',
        width: 'data(size)', height: 'data(size)',
        // Skeleton colour shows immediately; avatar fills it when loaded
        'background-color': 'data(bgColor)',
        'background-image': 'data(avatar)',
        'background-fit': 'cover',
        'background-clip': 'node',
        'background-image-crossorigin': 'anonymous',
        // Remove all label rendering
        label: '',
        'border-width': 2.5,
        'border-color': 'data(borderColor)',
        'transition-property': 'opacity, border-width',
        'transition-duration': '200ms',
      },
    },
    { selector: 'node[role = "tutor"]',   style: { 'border-width': 3.5 } },
    {
      selector: 'edge',
      style: {
        width: 1, 'line-color': 'data(color)', opacity: 0.28,
        'curve-style': 'bezier', 'target-arrow-shape': 'none',
        'transition-property': 'opacity, width', 'transition-duration': '180ms',
      },
    },
    { selector: 'node.sn-hi',  style: { 'border-width': 7, opacity: 1 } },
    { selector: 'node.sn-dim', style: { opacity: 0.07 } },
    { selector: 'edge.sn-hi',  style: { opacity: 0.9, width: 2.5 } },
    { selector: 'edge.sn-dim', style: { opacity: 0.02 } },
  ];
}

// ─── Progressive avatar loading: skeleton → face ─────────────────────────────
function loadAvatarsProgressively(cy, people) {
  const BATCH = 8;
  let idx = 0;

  function loadBatch() {
    const slice = people.slice(idx, idx + BATCH);
    if (!slice.length) return;

    slice.forEach(p => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const node = cy.$(`#${p.id}`);
        if (node.length) node.data({ avatar: p.avatarUrl, avatarLoaded: true });
        if (REAL_IMAGES_MODE && _avatarCallbacks[p.id]) {
          _avatarCallbacks[p.id]();
          delete _avatarCallbacks[p.id];
        }
      };
      img.src = p.avatarUrl;
    });

    idx += BATCH;
    if (idx < people.length) setTimeout(loadBatch, 200);
  }

  loadBatch();
}

// ─── Avatar-load callbacks (name reveal when avatar image is ready) ───────────
const _avatarCallbacks = {};

// Set to true only when real human photos (PNG/JPEG) replace the DiceBear avatar fillers
const REAL_IMAGES_MODE = false;

// ─── Shared projection (set by drawWorldMap, reused for node positions) ──────
let _sharedProjection = null;
let _mapW = 0, _mapH = 0;

function projectCity(lon, lat) {
  if (!_sharedProjection) return [Math.random() * 600, Math.random() * 400];
  const [x, y] = _sharedProjection([lon, lat]);
  return [x, y];
}

function startPulse(cy) {
  cy.nodes('[role = "tutor"]').forEach((node, i) => {
    function beat() {
      node.animate({ style: { 'border-width': 9, 'border-color': node.data('borderColor') } }, { duration: 700, easing: 'ease-in-out-sine' })
          .animate({ style: { 'border-width': 3.5, 'border-color': node.data('borderColor') } }, {
            duration: 700, easing: 'ease-in-out-sine',
            complete: () => setTimeout(beat, 2400 + Math.random() * 1800),
          });
    }
    setTimeout(beat, 500 + i * 350);
  });
}

// ─── World map background (D3 + topojson) ────────────────────────────────────
async function drawWorldMap(container) {
  if (!window.d3 || !window.topojson) return { projection: null, w: 0, h: 0 };
  const d3       = window.d3;
  const topojson = window.topojson;

  const rect   = container.getBoundingClientRect();
  const w      = rect.width  || 960;
  const h      = rect.height || 520;
  const isDark = document.documentElement.dataset.theme === 'dark';

  let world;
  try {
    world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
  } catch { return { projection: null, w, h }; }

  const projection = d3.geoNaturalEarth1().fitSize([w, h], { type: 'Sphere' });
  const path       = d3.geoPath(projection);

  const svg = d3.create('svg')
    .attr('width', '100%').attr('height', '100%')
    .attr('viewBox', `0 0 ${w} ${h}`)
    .attr('preserveAspectRatio', 'xMidYMid slice')
    .style('position', 'absolute').style('inset', '0')
    .style('pointer-events', 'none');

  svg.append('rect').attr('width', w).attr('height', h)
    .attr('fill', isDark ? '#0d1b2a' : '#d6eaf8');

  svg.append('path').datum({ type: 'Sphere' })
    .attr('d', path).attr('fill', isDark ? '#0d1b2a' : '#d6eaf8');

  svg.append('path').datum(d3.geoGraticule()())
    .attr('d', path).attr('fill', 'none')
    .attr('stroke', isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)')
    .attr('stroke-width', 0.5);

  svg.append('path')
    .datum(topojson.feature(world, world.objects.countries))
    .attr('d', path)
    .attr('fill',   isDark ? '#16291a' : '#c5dbb8')
    .attr('stroke', isDark ? '#1e3820' : '#9abf8a')
    .attr('stroke-width', 0.4);

  svg.append('path')
    .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
    .attr('d', path).attr('fill', 'none')
    .attr('stroke', isDark ? '#243d26' : '#7dab6d')
    .attr('stroke-width', 0.3);

  container.prepend(svg.node());
  return { projection, w, h };
}

// ─── Tooltip helpers ──────────────────────────────────────────────────────────
function showTooltip(tooltip, node, containerRect) {
  const pos    = node.renderedPosition();
  const data  = node.data();
  const nameEl = tooltip.querySelector('.nt-name');

  tooltip.querySelector('.nt-avatar').style.backgroundImage =
    data.avatarLoaded ? `url("${data.avatar}")` : '';
  tooltip.querySelector('.nt-avatar').style.backgroundColor =
    data.avatarLoaded ? '' : data.bgColor;

  const roleEl = tooltip.querySelector('.nt-role');
  roleEl.textContent = data.role.charAt(0).toUpperCase() + data.role.slice(1);
  roleEl.className   = `nt-role nt-role--${data.role}`;
  tooltip.querySelector('.nt-detail').textContent = data.detail || '';
  tooltip.hidden = false;
  positionTooltip(tooltip, pos, containerRect);

  if (data.avatarLoaded && REAL_IMAGES_MODE) {
    // Avatar ready and real images mode active — show name immediately
    nameEl.classList.remove('nt-name--skeleton');
    nameEl.textContent = data.name;
  } else {
    // Wait for avatar to load before revealing name
    nameEl.classList.add('nt-name--skeleton');
    nameEl.textContent = '';
    if (_avatarCallbacks[data.id]) delete _avatarCallbacks[data.id];
    _avatarCallbacks[data.id] = () => {
      nameEl.classList.remove('nt-name--skeleton');
      nameEl.textContent = data.name;
    };
  }
}

function positionTooltip(tooltip, pos, rect) {
  const tw = 220, th = 80;
  let x = rect.left + pos.x + 52;
  let y = rect.top  + pos.y - 24;
  if (x + tw > window.innerWidth  - 12) x = rect.left + pos.x - tw - 14;
  if (y + th > window.innerHeight - 12) y = window.innerHeight - th - 12;
  tooltip.style.left = Math.max(8, x) + 'px';
  tooltip.style.top  = Math.max(8, y) + 'px';
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function initSocialNetwork({
  containerId,
  tooltipId = 'network-tooltip',
  people,
  links,
}) {
  const container = document.getElementById(containerId);
  if (!container || !window.cytoscape) return null;

  const tooltip = document.getElementById(tooltipId);

  // World map SVG goes into DOM first so Cytoscape canvas layers on top.
  // After it resolves we have _sharedProjection, so student positions are accurate.
  drawWorldMap(container).then(({ projection, w, h }) => {
    if (projection) {
      _sharedProjection = projection;
      _mapW = w;
      _mapH = h;
    }

    // Build people list AFTER projection is set so student coords project correctly
    const resolvedPeople = people ?? buildPeopleList();
    const resolvedLinks  = links  ?? generateLinks(resolvedPeople);

    const cy = window.cytoscape({
      container,
      elements: buildElements(resolvedPeople, resolvedLinks),
      style: buildStyle(),
      layout: { name: 'preset' },
      userZoomingEnabled: true, userPanningEnabled: true,
      boxSelectionEnabled: false, minZoom: 0.25, maxZoom: 3.5,
    });

    cy.one('layoutstop', () => {
      startPulse(cy);
      loadAvatarsProgressively(cy, resolvedPeople);
    });

    cy.on('mouseover', 'node', e => {
      const node = e.target;
      const nbhd = node.closedNeighborhood();
      cy.batch(() => {
        cy.elements().not(nbhd).addClass('sn-dim');
        nbhd.nodes().addClass('sn-hi');
        nbhd.edges().addClass('sn-hi');
      });
      if (tooltip) showTooltip(tooltip, node, container.getBoundingClientRect());
    });

    cy.on('mousemove', 'node', e => {
      if (tooltip && !tooltip.hidden)
        positionTooltip(tooltip, e.target.renderedPosition(), container.getBoundingClientRect());
    });

    cy.on('mouseout', 'node', e => {
      cy.batch(() => cy.elements().removeClass('sn-dim sn-hi'));
      if (tooltip) tooltip.hidden = true;
      delete _avatarCallbacks[e.target.id()];
    });

    cy.on('tap', 'node', e =>
      cy.animate({ zoom: 2.2, center: { eles: e.target } }, { duration: 400, easing: 'ease-out-expo' })
    );

    cy.on('tap', e => {
      if (e.target === cy)
        cy.animate({ fit: { eles: cy.nodes(), padding: 60 } }, { duration: 400, easing: 'ease-out-expo' });
    });
  }).catch(() => {/* world map failed — network still renders */});
}
