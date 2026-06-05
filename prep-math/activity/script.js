// ─────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────
const MODES = {
  fractions: {
    label: 'Fraction',
    placeholder: 'e.g. 3/4',
    hint: 'Type as numerator/denominator — e.g. 3/4',
    modalQ: 'What fraction does the shape show?',
    unit: '',
  },
  percents: {
    label: 'Percent',
    placeholder: 'e.g. 75%',
    hint: 'Type the percentage — e.g. 75 or 75%',
    modalQ: 'What percentage does the shape show?',
    unit: '%',
  },
  degrees: {
    label: 'Degrees',
    placeholder: 'e.g. 270°',
    hint: 'Type the angle in degrees — e.g. 270 or 270°',
    modalQ: 'How many degrees does the shaded sector represent?',
    unit: '°',
  },
  decimals: {
    label: 'Decimal',
    placeholder: 'e.g. 0.75',
    hint: 'Type as a decimal — e.g. 0.75',
    modalQ: 'What decimal does the shape show?',
    unit: '',
  },
  time: {
    label: 'Time',
    placeholder: 'e.g. 45',
    hint: 'Type minutes (e.g. 45)',
    modalQ: 'How many minutes does the shaded part represent?',
    unit: 'min',
  },
  'random-total': {
    label: 'Random Total',
    placeholder: 'e.g. 15',
    hint: 'Type the number of shaded parts',
    modalQ: 'How many parts are shaded?',
    unit: '',
  },
  'different-parts': {
    label: 'Different Parts',
    placeholder: 'e.g. 3/4',
    hint: 'Type the combined fraction',
    modalQ: 'What is the combined fraction of all shaded parts?',
    unit: '',
  },
  compare: {
    label: 'Compare',
    placeholder: '<, >, or =',
    hint: 'Type <, >, or =',
    modalQ: 'Which is greater? Left or right?',
    unit: '',
  },
  mixed: {
    label: 'Answer',
    placeholder: 'Type your answer',
    hint: 'Answer in the format shown',
    modalQ: 'What value does the shape show?',
    unit: '',
  },
};

// Modes that should disable parts dropdown
const DISABLE_PARTS_MODES = ['random-total', 'different-parts', 'compare', 'mixed'];

// ─────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────
let streak = 0;
let totalSolved = 0;
let currentQ = null;
let isLoading = false;

const settings = { 
  mode: 'fractions', 
  parts: 2, 
  type: 'fraction-circle',
  hideLines: false,
  hideUnshaded: false,
  showTickMarks: true,
  showLabels: true,
  sameSplitCompare: false
};

// ─────────────────────────────────────────────────────────
// TICKER
// ─────────────────────────────────────────────────────────
(function buildTicker() {
  const words = [
    'Fraction Explorer', 'Maths Practice', 'Visual Fractions',
    'Prep Portal 2026', 'Circles · Bars', 'Endless Practice',
  ];
  const track = document.getElementById('ticker-track');
  if (track) {
    [...words, ...words].forEach(t => {
      const s = document.createElement('span');
      s.className = 'ticker-item';
      s.textContent = t;
      track.appendChild(s);
    });
  }
})();

// ─────────────────────────────────────────────────────────
// DROPDOWN LOGIC
// ─────────────────────────────────────────────────────────
function toggleDropdown(id) {
  const dd = document.getElementById(id);
  const isOpen = dd.classList.contains('open');
  document.querySelectorAll('.pp-dropdown.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) dd.classList.add('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.pp-dropdown'))
    document.querySelectorAll('.pp-dropdown.open').forEach(el => el.classList.remove('open'));
});

document.querySelectorAll('.pp-dropdown-list').forEach(list => {
  list.addEventListener('click', e => {
    const item = e.target.closest('.pp-dropdown-item');
    if (!item) return;
    const dd = item.closest('.pp-dropdown');
    const value = item.dataset.value;
    
    list.querySelectorAll('.pp-dropdown-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    dd.querySelector('.dd-selected').textContent = item.textContent.trim();
    dd.classList.remove('open');
    
    if (dd.id === 'dd-mode') {
      settings.mode = value;
      updatePartsDropdownState();
    }
    if (dd.id === 'dd-parts') {
      settings.parts = value === 'mixed' ? 'mixed' : parseInt(value, 10);
    }
    if (dd.id === 'dd-type') settings.type = value;
  });
});

function updatePartsDropdownState() {
  const partsDropdown = document.getElementById('dd-parts');
  if (DISABLE_PARTS_MODES.includes(settings.mode)) {
    partsDropdown.classList.add('disabled');
    partsDropdown.style.opacity = '0.5';
    partsDropdown.style.pointerEvents = 'none';
  } else {
    partsDropdown.classList.remove('disabled');
    partsDropdown.style.opacity = '1';
    partsDropdown.style.pointerEvents = 'auto';
  }
}

// ─────────────────────────────────────────────────────────
// CHECKBOX LISTENERS
// ─────────────────────────────────────────────────────────
document.getElementById('hide-lines')?.addEventListener('change', (e) => {
  settings.hideLines = e.target.checked;
  if (currentQ && document.getElementById('polypad-modal').classList.contains('active')) {
    refreshSVG();
  }
});

document.getElementById('hide-unshaded')?.addEventListener('change', (e) => {
  settings.hideUnshaded = e.target.checked;
  if (currentQ && document.getElementById('polypad-modal').classList.contains('active')) {
    refreshSVG();
  }
});

document.getElementById('show-ticks-modal')?.addEventListener('change', (e) => {
  settings.showTickMarks = e.target.checked;
  if (currentQ && document.getElementById('polypad-modal').classList.contains('active')) {
    const modeForDisplay = currentQ.mode || settings.mode;
    if (modeForDisplay === 'time') {
      refreshSVG();
    }
  }
});

document.getElementById('show-labels-modal')?.addEventListener('change', (e) => {
  settings.showLabels = e.target.checked;
  if (currentQ && document.getElementById('polypad-modal').classList.contains('active')) {
    refreshSVG();
  }
});

document.getElementById('same-split-toggle')?.addEventListener('change', (e) => {
  settings.sameSplitCompare = e.target.checked;
  if (currentQ && currentQ.mode === 'compare' && document.getElementById('polypad-modal').classList.contains('active')) {
    refreshSVG();
  }
});

function updateCheckboxesState() {
  const checkboxContainer = document.querySelector('.settings-checkboxes');
  if (checkboxContainer) {
    checkboxContainer.style.opacity = '1';
    checkboxContainer.style.pointerEvents = 'auto';
  }
}

function refreshSVG() {
  if (!currentQ) return;
  const wrap = document.getElementById('polypad-wrap');
  const oldSvg = wrap.querySelector('svg');
  if (oldSvg) oldSvg.remove();
  const svg = createFractionSVG(settings.type, currentQ, currentQ.mode || settings.mode);
  wrap.appendChild(svg);
}

// ─────────────────────────────────────────────────────────
// KEYPAD FUNCTIONS
// ─────────────────────────────────────────────────────────
function toggleKeypad() {
  const container = document.getElementById('numpad-container');
  const btn = document.getElementById('keypad-toggle');
  container.classList.toggle('hidden');
  btn.classList.toggle('active');
}

function numpadInput(char) {
  const input = document.getElementById('answer-input');
  input.focus();
  
  const selection = window.getSelection();
  if (selection.rangeCount === 0) {
    input.textContent += char;
    return;
  }
  
  const range = selection.getRangeAt(0);
  range.deleteContents();
  
  const textNode = document.createTextNode(char);
  range.insertNode(textNode);
  
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  selection.removeAllRanges();
  selection.addRange(range);
}

function numpadBackspace() {
  const input = document.getElementById('answer-input');
  input.focus();
  
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  
  if (!range.collapsed) {
    range.deleteContents();
  } else {
    const container = range.startContainer;
    const offset = range.startOffset;
    
    if (container.nodeType === Node.TEXT_NODE) {
      if (offset > 0) {
        const text = container.textContent;
        container.textContent = text.slice(0, offset - 1) + text.slice(offset);
        range.setStart(container, offset - 1);
        range.setEnd(container, offset - 1);
      } else if (container.previousSibling) {
        const prev = container.previousSibling;
        prev.remove();
      }
    } else if (container.nodeType === Node.ELEMENT_NODE) {
      const children = Array.from(container.childNodes);
      const childAtIndex = children[offset - 1];
      if (childAtIndex) {
        childAtIndex.remove();
      }
    }
  }
  
  selection.removeAllRanges();
  selection.addRange(range);
}

// ─────────────────────────────────────────────────────────
// COLOR UTILITIES
// ─────────────────────────────────────────────────────────
const MUTED_COLORS = [
  '#7b9cae', '#8fbc94', '#d9b48b', '#c9a0c9', '#8fcbcb',
  '#e3b58a', '#b7a9a9', '#94c9b4', '#c9ae8a', '#8faec9',
  '#b7ae8f', '#8fbfbf', '#aa94c9', '#94c9aa', '#dbb778',
];

const PASTEL_COLORS = [
  '#a8c9e5', '#b8e0b8', '#f5d6b3', '#e0b8e0', '#b8e0e0',
  '#f5c6b3', '#d4c4c4', '#b8e0cc', '#e0ccb8', '#b8cce0',
  '#e0d4b8', '#b8d4d4', '#ccb8e0', '#b8e0d4', '#f5d4a8',
];

const DIFFERENT_PARTS_COLORS = [
  '#8fb0c9', '#a8c9a3', '#e0b88a', '#d4a0d4', '#a0d4d4',
  '#e8c49a', '#b0a0a0', '#9ed1bb', '#dcb89e', '#9eb5dc',
  '#c7bc9e', '#9ebcbc', '#b9a3dc', '#a3dcb9', '#e6c48a',
];

function generateRandomColorSet() {
  const isPastel = Math.random() > 0.5;
  const palette = isPastel ? PASTEL_COLORS : MUTED_COLORS;
  const randomColor = palette[Math.floor(Math.random() * palette.length)];
  
  return {
    shadedColor: randomColor,
    unshaded: isPastel ? '#e8e4dc' : '#e0d8cc',
    ink: '#1a1a1a',
  };
}

let currentColorSet = generateRandomColorSet();

// ─────────────────────────────────────────────────────────
// MATH UTILITIES
// ─────────────────────────────────────────────────────────
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function leastCommonMultiple(a, b) {
  return (a * b) / gcd(a, b);
}

// ─────────────────────────────────────────────────────────
// SVG CANVAS RENDERER
// ─────────────────────────────────────────────────────────
function createFractionSVG(type, q, mode) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  
  const INK = currentColorSet.ink;
  const SHADED = currentColorSet.shadedColor;
  const UNSHADED = settings.hideUnshaded ? 'transparent' : currentColorSet.unshaded;
  const isTimeMode = mode === 'time';
  const isDifferentParts = mode === 'different-parts';
  const isCompare = mode === 'compare';
  const isRandomTotal = mode === 'random-total';
  
  if (type === 'fraction-circle') {
    if (isCompare && q) {
      svg.setAttribute("viewBox", "0 0 800 500");
      
      const leftCx = 220;
      const rightCx = 580;
      const cy = 250;
      const r = 160;
      
      let leftActive = q.leftActive;
      let leftDenom = q.leftDenom;
      let rightActive = q.rightActive;
      let rightDenom = q.rightDenom;
      let useLcmSplit = false;
      
      if (settings.sameSplitCompare && leftDenom !== rightDenom) {
        useLcmSplit = true;
        const lcm = leastCommonMultiple(leftDenom, rightDenom);
        const leftMultiplier = lcm / leftDenom;
        const rightMultiplier = lcm / rightDenom;
        leftActive = q.leftActive * leftMultiplier;
        leftDenom = lcm;
        rightActive = q.rightActive * rightMultiplier;
        rightDenom = lcm;
      }
      
      if (useLcmSplit) {
        drawCircle(svg, leftCx, cy, r, leftActive, leftDenom, INK, SHADED, UNSHADED);
        drawCircle(svg, rightCx, cy, r, rightActive, rightDenom, INK, SHADED, UNSHADED);
      } else {
        drawCircle(svg, leftCx, cy, r, q.leftActive, q.leftDenom, INK, SHADED, UNSHADED);
        drawCircle(svg, rightCx, cy, r, q.rightActive, q.rightDenom, INK, SHADED, UNSHADED);
      }
      
      if (settings.showLabels) {
        // Show scaled fractions if LCM split is active, otherwise show original
        const leftLabelText = useLcmSplit ? `${leftActive}/${leftDenom}` : `${q.leftActive}/${q.leftDenom}`;
        const rightLabelText = useLcmSplit ? `${rightActive}/${rightDenom}` : `${q.rightActive}/${q.rightDenom}`;
        
        addCenterLabel(svg, leftCx, cy, leftLabelText, INK);
        addCenterLabel(svg, rightCx, cy, rightLabelText, INK);
      }
      
      const vsText = document.createElementNS(svgNS, "text");
      vsText.setAttribute("x", "400");
      vsText.setAttribute("y", "250");
      vsText.setAttribute("text-anchor", "middle");
      vsText.setAttribute("dominant-baseline", "middle");
      vsText.setAttribute("font-family", "'JetBrains Mono', monospace");
      vsText.setAttribute("font-size", "36");
      vsText.setAttribute("font-weight", "900");
      vsText.setAttribute("fill", INK);
      vsText.textContent = "?";
      svg.appendChild(vsText);
      
    } else if (isRandomTotal && q) {
      svg.setAttribute("viewBox", "0 0 800 800");
      const cx = 400;
      const cy = 400;
      const r = 280;
      
      drawCircle(svg, cx, cy, r, q.shaded, q.totalParts, INK, SHADED, UNSHADED);
      
      const outlineCircle = document.createElementNS(svgNS, "circle");
      outlineCircle.setAttribute("cx", cx);
      outlineCircle.setAttribute("cy", cy);
      outlineCircle.setAttribute("r", r);
      outlineCircle.setAttribute("fill", "none");
      outlineCircle.setAttribute("stroke", INK);
      outlineCircle.setAttribute("stroke-width", "4");
      svg.appendChild(outlineCircle);
      
      if (settings.showLabels) {
        addCenterLabel(svg, cx, cy, `Total: ${q.total}`, INK, true);
      }
      
    } else if (isDifferentParts && q) {
      svg.setAttribute("viewBox", "0 0 800 800");
      const cx = 400;
      const cy = 400;
      const r = 280;
      
      const colorMap = buildColorMap(q.sectors);
      
      drawDifferentPartsCircleVarying(svg, cx, cy, r, q.sectors, colorMap, INK, UNSHADED);
      
      const outlineCircle = document.createElementNS(svgNS, "circle");
      outlineCircle.setAttribute("cx", cx);
      outlineCircle.setAttribute("cy", cy);
      outlineCircle.setAttribute("r", r);
      outlineCircle.setAttribute("fill", "none");
      outlineCircle.setAttribute("stroke", INK);
      outlineCircle.setAttribute("stroke-width", "4");
      svg.appendChild(outlineCircle);
      
      if (settings.showLabels) {
        addSectorLabels(svg, cx, cy, r, q.sectors, INK);
      }
      
    } else {
      svg.setAttribute("viewBox", "0 0 800 800");
      const cx = 400;
      const cy = 400;
      const r = 280;
      
      drawCircle(svg, cx, cy, r, q.active, q.denominator, INK, SHADED, UNSHADED);
      
      if (isTimeMode && settings.showTickMarks) {
        drawTickMarks(svg, cx, cy, r, INK);
      }
      
      const outlineCircle = document.createElementNS(svgNS, "circle");
      outlineCircle.setAttribute("cx", cx);
      outlineCircle.setAttribute("cy", cy);
      outlineCircle.setAttribute("r", r);
      outlineCircle.setAttribute("fill", "none");
      outlineCircle.setAttribute("stroke", INK);
      outlineCircle.setAttribute("stroke-width", "4");
      svg.appendChild(outlineCircle);
      
      if (isTimeMode && settings.showLabels) {
        const fraction = q.active / q.denominator;
        let displayText = formatTimeDisplay(fraction, q.active, q.denominator);
        addCenterLabel(svg, cx, cy, displayText, INK, true);
      }
    }
    
  } else { // fraction-bar
    svg.setAttribute("viewBox", "0 0 800 500");
    const totalW = 680;
    const h = 120;
    const x = (800 - totalW) / 2;
    
    if (isCompare && q) {
      const leftY = 100;
      const rightY = 280;
      
      let leftActive = q.leftActive;
      let leftDenom = q.leftDenom;
      let rightActive = q.rightActive;
      let rightDenom = q.rightDenom;
      let useLcmSplit = false;
      
      if (settings.sameSplitCompare && leftDenom !== rightDenom) {
        useLcmSplit = true;
        const lcm = leastCommonMultiple(leftDenom, rightDenom);
        const leftMultiplier = lcm / leftDenom;
        const rightMultiplier = lcm / rightDenom;
        leftActive = q.leftActive * leftMultiplier;
        leftDenom = lcm;
        rightActive = q.rightActive * rightMultiplier;
        rightDenom = lcm;
      }
      
      if (useLcmSplit) {
        drawBar(svg, x, leftY, totalW, h, leftActive, leftDenom, INK, SHADED, UNSHADED);
        drawBar(svg, x, rightY, totalW, h, rightActive, rightDenom, INK, SHADED, UNSHADED);
      } else {
        drawBar(svg, x, leftY, totalW, h, q.leftActive, q.leftDenom, INK, SHADED, UNSHADED);
        drawBar(svg, x, rightY, totalW, h, q.rightActive, q.rightDenom, INK, SHADED, UNSHADED);
      }
      
      if (settings.showLabels) {
        const leftLabel = document.createElementNS(svgNS, "text");
        leftLabel.setAttribute("x", "400");
        leftLabel.setAttribute("y", "80");
        leftLabel.setAttribute("text-anchor", "middle");
        leftLabel.setAttribute("font-family", "'JetBrains Mono', monospace");
        leftLabel.setAttribute("font-size", "22");
        leftLabel.setAttribute("font-weight", "700");
        leftLabel.setAttribute("fill", INK);
        // Show scaled fractions if LCM split is active
        leftLabel.textContent = useLcmSplit ? `${leftActive}/${leftDenom}` : `${q.leftActive}/${q.leftDenom}`;
        svg.appendChild(leftLabel);
        
        const rightLabel = document.createElementNS(svgNS, "text");
        rightLabel.setAttribute("x", "400");
        rightLabel.setAttribute("y", "260");
        rightLabel.setAttribute("text-anchor", "middle");
        rightLabel.setAttribute("font-family", "'JetBrains Mono', monospace");
        rightLabel.setAttribute("font-size", "22");
        rightLabel.setAttribute("font-weight", "700");
        rightLabel.setAttribute("fill", INK);
        // Show scaled fractions if LCM split is active
        rightLabel.textContent = useLcmSplit ? `${rightActive}/${rightDenom}` : `${q.rightActive}/${q.rightDenom}`;
        svg.appendChild(rightLabel);
      }
      
      const vsText = document.createElementNS(svgNS, "text");
      vsText.setAttribute("x", "400");
      vsText.setAttribute("y", "220");
      vsText.setAttribute("text-anchor", "middle");
      vsText.setAttribute("font-family", "'JetBrains Mono', monospace");
      vsText.setAttribute("font-size", "32");
      vsText.setAttribute("font-weight", "900");
      vsText.setAttribute("fill", INK);
      vsText.textContent = "?";
      svg.appendChild(vsText);
      
    } else if (isRandomTotal && q) {
      const y = (500 - h) / 2;
      drawBar(svg, x, y, totalW, h, q.shaded, q.totalParts, INK, SHADED, UNSHADED);
      
      const frame = document.createElementNS(svgNS, "rect");
      frame.setAttribute("x", x - 10);
      frame.setAttribute("y", y - 10);
      frame.setAttribute("width", totalW + 20);
      frame.setAttribute("height", h + 20);
      frame.setAttribute("fill", "none");
      frame.setAttribute("stroke", INK);
      frame.setAttribute("stroke-width", "4");
      svg.appendChild(frame);
      
      if (settings.showLabels) {
        const totalText = document.createElementNS(svgNS, "text");
        totalText.setAttribute("x", "400");
        totalText.setAttribute("y", (y + h + 45).toString());
        totalText.setAttribute("text-anchor", "middle");
        totalText.setAttribute("font-family", "'JetBrains Mono', monospace");
        totalText.setAttribute("font-size", "24");
        totalText.setAttribute("font-weight", "700");
        totalText.setAttribute("fill", INK);
        totalText.textContent = `Total: ${q.total}`;
        svg.appendChild(totalText);
      }
      
    } else if (isDifferentParts && q) {
      const y = (500 - h) / 2;
      
      const colorMap = buildColorMap(q.sectors);
      
      drawDifferentPartsBarVarying(svg, x, y, totalW, h, q.sectors, colorMap, INK, UNSHADED);
      
      const frame = document.createElementNS(svgNS, "rect");
      frame.setAttribute("x", x - 10);
      frame.setAttribute("y", y - 10);
      frame.setAttribute("width", totalW + 20);
      frame.setAttribute("height", h + 20);
      frame.setAttribute("fill", "none");
      frame.setAttribute("stroke", INK);
      frame.setAttribute("stroke-width", "4");
      svg.appendChild(frame);
      
      if (settings.showLabels) {
        addBarSegmentLabels(svg, x, y, totalW, h, q.sectors, INK);
      }
      
    } else {
      const y = (500 - h) / 2;
      drawBar(svg, x, y, totalW, h, q.active, q.denominator, INK, SHADED, UNSHADED);
      
      const frame = document.createElementNS(svgNS, "rect");
      frame.setAttribute("x", x - 10);
      frame.setAttribute("y", y - 10);
      frame.setAttribute("width", totalW + 20);
      frame.setAttribute("height", h + 20);
      frame.setAttribute("fill", "none");
      frame.setAttribute("stroke", INK);
      frame.setAttribute("stroke-width", "4");
      svg.appendChild(frame);
      
      if (isTimeMode && settings.showLabels) {
        const fraction = q.active / q.denominator;
        let displayText = formatTimeDisplay(fraction, q.active, q.denominator);
        
        const textElement = document.createElementNS(svgNS, "text");
        textElement.setAttribute("x", "400");
        textElement.setAttribute("y", (y + h + 45).toString());
        textElement.setAttribute("text-anchor", "middle");
        textElement.setAttribute("font-family", "'JetBrains Mono', monospace");
        textElement.setAttribute("font-size", "24");
        textElement.setAttribute("font-weight", "700");
        textElement.setAttribute("fill", INK);
        textElement.textContent = displayText;
        svg.appendChild(textElement);
      }
    }
  }
  
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return svg;
}

// Build color map where same size = same color
function buildColorMap(sectors) {
  const sizeMap = new Map();
  const colorMap = new Map();
  let colorIndex = 0;
  
  sectors.forEach(sector => {
    const key = sector.size;
    if (!sizeMap.has(key)) {
      sizeMap.set(key, DIFFERENT_PARTS_COLORS[colorIndex % DIFFERENT_PARTS_COLORS.length]);
      colorIndex++;
    }
    colorMap.set(sector, sizeMap.get(key));
  });
  
  return colorMap;
}

// Convert fraction to lowest terms string
function toLowestTerms(numerator, denominator) {
  const divisor = gcd(numerator, denominator);
  const num = numerator / divisor;
  const den = denominator / divisor;
  return `${num}/${den}`;
}

function addCenterLabel(svg, cx, cy, text, INK, isDarkBg = false) {
  const svgNS = "http://www.w3.org/2000/svg";
  
  const box = document.createElementNS(svgNS, "rect");
  box.setAttribute("x", (cx - 100).toString());
  box.setAttribute("y", (cy - 35).toString());
  box.setAttribute("width", "200");
  box.setAttribute("height", "70");
  box.setAttribute("fill", isDarkBg ? "#1a1a1a" : "#ffffff");
  box.setAttribute("stroke", INK);
  box.setAttribute("stroke-width", "3");
  svg.appendChild(box);
  
  const label = document.createElementNS(svgNS, "text");
  label.setAttribute("x", cx.toString());
  label.setAttribute("y", (cy + 8).toString());
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("dominant-baseline", "middle");
  label.setAttribute("font-family", "'JetBrains Mono', monospace");
  label.setAttribute("font-size", "26");
  label.setAttribute("font-weight", "700");
  label.setAttribute("fill", isDarkBg ? "#ffffff" : INK);
  label.textContent = text;
  svg.appendChild(label);
}

function addSectorLabels(svg, cx, cy, r, sectors, INK) {
  const svgNS = "http://www.w3.org/2000/svg";
  let currentAngle = -90;
  
  sectors.forEach((sector) => {
    const sectorAngle = (sector.size / sector.total) * 360;
    const midAngle = (currentAngle + sectorAngle / 2) * Math.PI / 180;
    const labelR = r * 0.65;
    
    const labelX = cx + labelR * Math.cos(midAngle);
    const labelY = cy + labelR * Math.sin(midAngle);
    
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", labelX.toFixed(1));
    text.setAttribute("y", labelY.toFixed(1));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", "'JetBrains Mono', monospace");
    text.setAttribute("font-size", "18");
    text.setAttribute("font-weight", "700");
    text.setAttribute("fill", sector.shaded ? "#ffffff" : INK);
    text.textContent = toLowestTerms(sector.size, sector.total);
    svg.appendChild(text);
    
    currentAngle += sectorAngle;
  });
}

function addBarSegmentLabels(svg, x, y, totalW, h, sectors, INK) {
  const svgNS = "http://www.w3.org/2000/svg";
  let currentX = x;
  
  sectors.forEach((sector) => {
    const width = (sector.size / sector.total) * totalW;
    const centerX = currentX + width / 2;
    
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", centerX.toFixed(1));
    text.setAttribute("y", (y + h / 2 + 6).toString());
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", "'JetBrains Mono', monospace");
    text.setAttribute("font-size", "14");
    text.setAttribute("font-weight", "700");
    text.setAttribute("fill", sector.shaded ? "#ffffff" : INK);
    text.textContent = toLowestTerms(sector.size, sector.total);
    svg.appendChild(text);
    
    currentX += width;
  });
}

function drawCircle(svg, cx, cy, r, active, denominator, INK, SHADED, UNSHADED) {
  const svgNS = "http://www.w3.org/2000/svg";
  const sectorAngle = 360 / denominator;
  
  for (let i = 0; i < denominator; i++) {
    const start = (i * sectorAngle - 90) * Math.PI / 180;
    const end = ((i + 1) * sectorAngle - 90) * Math.PI / 180;
    const isShaded = i < active;
    
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    
    const largeArc = sectorAngle > 180 ? 1 : 0;
    
    const pathData = `
      M ${cx},${cy}
      L ${x1.toFixed(1)},${y1.toFixed(1)}
      A ${r},${r} 0 ${largeArc},1 ${x2.toFixed(1)},${y2.toFixed(1)}
      Z
    `;
    
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", pathData.trim());
    path.setAttribute("fill", isShaded ? SHADED : UNSHADED);
    
    if (!settings.hideLines) {
      path.setAttribute("stroke", INK);
      path.setAttribute("stroke-width", "4");
      path.setAttribute("stroke-linejoin", "round");
    }
    
    svg.appendChild(path);
  }
}

function drawDifferentPartsCircleVarying(svg, cx, cy, r, sectors, colorMap, INK, UNSHADED) {
  const svgNS = "http://www.w3.org/2000/svg";
  let currentAngle = -90;
  
  sectors.forEach((sector) => {
    const sectorAngle = (sector.size / sector.total) * 360;
    const start = currentAngle * Math.PI / 180;
    const end = (currentAngle + sectorAngle) * Math.PI / 180;
    
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    
    const largeArc = sectorAngle > 180 ? 1 : 0;
    
    const pathData = `
      M ${cx},${cy}
      L ${x1.toFixed(1)},${y1.toFixed(1)}
      A ${r},${r} 0 ${largeArc},1 ${x2.toFixed(1)},${y2.toFixed(1)}
      Z
    `;
    
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", pathData.trim());
    
    if (sector.shaded) {
      path.setAttribute("fill", colorMap.get(sector));
    } else {
      path.setAttribute("fill", UNSHADED);
    }
    
    if (!settings.hideLines) {
      path.setAttribute("stroke", INK);
      path.setAttribute("stroke-width", "4");
      path.setAttribute("stroke-linejoin", "round");
    }
    
    svg.appendChild(path);
    
    currentAngle += sectorAngle;
  });
}

function drawBar(svg, x, y, totalW, h, active, denominator, INK, SHADED, UNSHADED) {
  const svgNS = "http://www.w3.org/2000/svg";
  const partW = totalW / denominator;
  
  for (let i = 0; i < denominator; i++) {
    const isShaded = i < active;
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", (x + i * partW).toFixed(1));
    rect.setAttribute("y", y);
    rect.setAttribute("width", partW.toFixed(1));
    rect.setAttribute("height", h);
    rect.setAttribute("fill", isShaded ? SHADED : UNSHADED);
    
    if (!settings.hideLines) {
      rect.setAttribute("stroke", INK);
      rect.setAttribute("stroke-width", "4");
    }
    
    svg.appendChild(rect);
  }
}

function drawDifferentPartsBarVarying(svg, x, y, totalW, h, sectors, colorMap, INK, UNSHADED) {
  const svgNS = "http://www.w3.org/2000/svg";
  let currentX = x;
  
  sectors.forEach((sector) => {
    const width = (sector.size / sector.total) * totalW;
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", currentX.toFixed(1));
    rect.setAttribute("y", y);
    rect.setAttribute("width", width.toFixed(1));
    rect.setAttribute("height", h);
    
    if (sector.shaded) {
      rect.setAttribute("fill", colorMap.get(sector));
    } else {
      rect.setAttribute("fill", UNSHADED);
    }
    
    if (!settings.hideLines) {
      rect.setAttribute("stroke", INK);
      rect.setAttribute("stroke-width", "4");
    }
    
    svg.appendChild(rect);
    currentX += width;
  });
}

function drawTickMarks(svg, cx, cy, r, INK) {
  const svgNS = "http://www.w3.org/2000/svg";
  for (let i = 0; i < 60; i++) {
    const angle = (i * 6 - 90) * Math.PI / 180;
    const isHourMark = i % 5 === 0;
    const innerR = isHourMark ? r - 25 : r - 12;
    const outerR = r;
    
    const x1 = cx + innerR * Math.cos(angle);
    const y1 = cy + innerR * Math.sin(angle);
    const x2 = cx + outerR * Math.cos(angle);
    const y2 = cy + outerR * Math.sin(angle);
    
    const tick = document.createElementNS(svgNS, "line");
    tick.setAttribute("x1", x1.toFixed(1));
    tick.setAttribute("y1", y1.toFixed(1));
    tick.setAttribute("x2", x2.toFixed(1));
    tick.setAttribute("y2", y2.toFixed(1));
    tick.setAttribute("stroke", INK);
    tick.setAttribute("stroke-width", isHourMark ? "3" : "1.5");
    tick.setAttribute("stroke-linecap", "square");
    svg.appendChild(tick);
  }
}

function formatTimeDisplay(fraction, active, denominator) {
  if (fraction === 1) return '1 hour';
  if (fraction === 0.5) return '½ hour';
  if (fraction === 0.25) return '¼ hour';
  if (fraction === 0.75) return '¾ hour';
  return `${active}/${denominator} hour`;
}

// ─────────────────────────────────────────────────────────
// QUESTION GENERATION
// ─────────────────────────────────────────────────────────
const MIXED_DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12];
const ALL_MODES = ['fractions', 'percents', 'degrees', 'decimals', 'time', 'random-total', 'different-parts', 'compare'];

function generateQuestion() {
  let mode = settings.mode;
  
  if (settings.mode === 'mixed') {
    mode = ALL_MODES[Math.floor(Math.random() * ALL_MODES.length)];
  }
  
  if (mode === 'random-total') {
    const total = [12, 20, 24, 30, 36, 40, 48, 60][Math.floor(Math.random() * 8)];
    const denominators = [2, 3, 4, 5, 6, 8, 10, 12].filter(d => total % d === 0);
    const denominator = denominators[Math.floor(Math.random() * denominators.length)];
    const shaded = Math.floor(Math.random() * (denominator - 1)) + 1;
    return { shaded, totalParts: denominator, total, mode };
  }
  
  if (mode === 'different-parts') {
    const numSectors = Math.floor(Math.random() * 4) + 3;
    const sectors = [];
    let total = 0;
    
    const denominators = [8, 10, 12];
    const targetTotal = denominators[Math.floor(Math.random() * denominators.length)];
    
    for (let i = 0; i < numSectors; i++) {
      const remaining = targetTotal - total;
      const maxSize = remaining - (numSectors - i - 1);
      const size = i === numSectors - 1 ? remaining : Math.floor(Math.random() * (maxSize - 1)) + 1;
      const shaded = Math.random() > 0.4;
      sectors.push({ size, shaded, total: targetTotal });
      total += size;
    }
    
    let requestedMode = mode;
    if (settings.mode === 'mixed') {
      const formatModes = ['fractions', 'percents', 'degrees', 'decimals', 'time'];
      requestedMode = formatModes[Math.floor(Math.random() * formatModes.length)];
    }
    
    return { sectors, mode, requestedMode };
  }
  
  if (mode === 'compare') {
    let leftDenom, rightDenom;
    
    if (settings.sameSplitCompare) {
      leftDenom = MIXED_DENOMINATORS[Math.floor(Math.random() * MIXED_DENOMINATORS.length)];
      rightDenom = leftDenom;
    } else {
      leftDenom = MIXED_DENOMINATORS[Math.floor(Math.random() * MIXED_DENOMINATORS.length)];
      rightDenom = MIXED_DENOMINATORS[Math.floor(Math.random() * MIXED_DENOMINATORS.length)];
    }
    
    const leftActive = Math.floor(Math.random() * (leftDenom - 1)) + 1;
    const rightActive = Math.floor(Math.random() * (rightDenom - 1)) + 1;
    return { leftActive, leftDenom, rightActive, rightDenom, mode };
  }
  
  let denom = settings.parts;
  if (settings.mode === 'mixed') {
    denom = MIXED_DENOMINATORS[Math.floor(Math.random() * MIXED_DENOMINATORS.length)];
  }
  
  const active = Math.floor(Math.random() * (denom - 1)) + 1;
  return { active, denominator: denom, mode };
}

function getCorrectAnswer(q, mode) {
  if (mode === 'compare') {
    const leftVal = q.leftActive / q.leftDenom;
    const rightVal = q.rightActive / q.rightDenom;
    if (Math.abs(leftVal - rightVal) < 0.001) return '=';
    return leftVal > rightVal ? '>' : '<';
  }
  
  if (mode === 'random-total') {
    return Math.round((q.shaded / q.totalParts) * q.total).toString();
  }
  
  if (mode === 'different-parts') {
    const shadedTotal = q.sectors.filter(s => s.shaded).reduce((sum, s) => sum + s.size, 0);
    const total = q.sectors[0].total;
    const fraction = shadedTotal / total;
    const requestedMode = q.requestedMode || 'fractions';
    
    switch (requestedMode) {
      case 'percents': {
        const pct = fraction * 100;
        return Number.isInteger(pct) ? pct.toString() : (Math.round(pct * 10) / 10).toString();
      }
      case 'degrees': 
        return Math.round(fraction * 360).toString();
      case 'decimals': 
        return parseFloat(fraction.toFixed(4)).toString();
      case 'time': 
        return Math.round(fraction * 60).toString();
      default: 
        return `${shadedTotal}/${total}`;
    }
  }
  
  const active = q.active;
  const denominator = q.denominator;
  const fraction = active / denominator;
  
  switch (mode) {
    case 'fractions':
      return `${active}/${denominator}`;
    case 'percents': {
      const pct = fraction * 100;
      return Number.isInteger(pct) ? pct.toString() : (Math.round(pct * 10) / 10).toString();
    }
    case 'degrees': 
      return Math.round(fraction * 360).toString();
    case 'decimals': 
      return parseFloat(fraction.toFixed(4)).toString();
    case 'time': 
      return Math.round(fraction * 60).toString();
    default: 
      return `${active}/${denominator}`;
  }
}

// ─────────────────────────────────────────────────────────
// FRACTION UTILITIES
// ─────────────────────────────────────────────────────────
function parseFraction(frac) {
  if (frac.includes(' ')) {
    const parts = frac.split(' ');
    const whole = parseInt(parts[0], 10);
    const fractionParts = parts[1].split('/');
    const num = parseInt(fractionParts[0], 10);
    const den = parseInt(fractionParts[1], 10);
    if (!isNaN(whole) && !isNaN(num) && !isNaN(den) && den !== 0) {
      return { numerator: whole * den + num, denominator: den };
    }
    return null;
  }
  
  const parts = frac.split('/');
  if (parts.length === 2) {
    const num = parseInt(parts[0], 10);
    const den = parseInt(parts[1], 10);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return { numerator: num, denominator: den };
    }
    return null;
  }
  
  const whole = parseInt(frac, 10);
  if (!isNaN(whole)) {
    return { numerator: whole, denominator: 1 };
  }
  
  return null;
}

function areFractionsEquivalent(frac1, frac2) {
  const f1 = parseFraction(frac1);
  const f2 = parseFraction(frac2);
  if (!f1 || !f2) return false;
  return f1.numerator * f2.denominator === f2.numerator * f1.denominator;
}

function simplifyFraction(frac) {
  const parsed = parseFraction(frac);
  if (!parsed) return frac;
  
  let { numerator, denominator } = parsed;
  let whole = 0;
  
  if (numerator >= denominator) {
    whole = Math.floor(numerator / denominator);
    numerator = numerator % denominator;
  }
  
  if (numerator > 0) {
    const divisor = gcd(numerator, denominator);
    numerator /= divisor;
    denominator /= divisor;
  }
  
  if (whole > 0 && numerator > 0) return `${whole} ${numerator}/${denominator}`;
  if (whole > 0) return whole.toString();
  if (numerator > 0) return `${numerator}/${denominator}`;
  return '0';
}

// ─────────────────────────────────────────────────────────
// ANSWER CHECKING
// ─────────────────────────────────────────────────────────
function isCorrect(raw, correctVal, mode) {
  const clean = raw.replace(/[°%\s]/g, '').toLowerCase();
  const target = correctVal.replace(/[°%\s]/g, '').toLowerCase();
  
  if (mode === 'compare') {
    return clean === target;
  }
  
  if (mode === 'fractions' || mode === 'different-parts') {
    if (clean === target) return true;
    return areFractionsEquivalent(clean, target);
  }
  
  if (mode === 'random-total') {
    const userNum = parseInt(clean, 10);
    const targNum = parseInt(target, 10);
    return userNum === targNum;
  }
  
  const userNum = parseFloat(clean);
  const targNum = parseFloat(target);
  if (isNaN(userNum) || isNaN(targNum)) return false;
  
  const tolerance = mode === 'decimals' ? 0.005 : 1;
  return Math.abs(userNum - targNum) <= tolerance;
}

function displayAnswer(val, mode, extraData = null) {
  if (mode === 'different-parts' && extraData && extraData.requestedMode) {
    switch (extraData.requestedMode) {
      case 'percents': return val + '%';
      case 'degrees': return val + '°';
      case 'time': return val + ' minutes';
      case 'decimals': return val;
      default: return simplifyFraction(val);
    }
  }
  
  switch (mode) {
    case 'percents': return val + '%';
    case 'degrees': return val + '°';
    case 'fractions': return simplifyFraction(val);
    case 'random-total': return val;
    case 'different-parts': return simplifyFraction(val);
    case 'time': return val + ' minutes';
    case 'compare': return val;
    default: return val;
  }
}

function checkAnswer() {
  if (!currentQ || isLoading) return;
  
  const input = document.getElementById('answer-input');
  const raw = input.textContent.trim();
  const fb = document.getElementById('feedback-box');
  const mode = currentQ.mode || settings.mode;
  
  if (!raw) {
    fb.className = 'gp-feedback-box fb-error';
    fb.textContent = 'Type your answer first.';
    return;
  }
  
  const correct = getCorrectAnswer(currentQ, mode);
  
  if (isCorrect(raw, correct, mode)) {
    streak++;
    totalSolved++;
    syncStats();
    
    fb.className = 'gp-feedback-box fb-success';
    
    const cleanRaw = raw.replace(/[°%\s]/g, '').toLowerCase();
    if ((mode === 'fractions' || mode === 'different-parts') && cleanRaw !== correct && areFractionsEquivalent(cleanRaw, correct)) {
      const simplified = simplifyFraction(correct);
      fb.textContent = `✓ Correct! ${raw} is equivalent to ${simplified}. Next question…`;
    } else {
      fb.textContent = `✓ Correct! The answer is ${displayAnswer(correct, mode, currentQ)}. Next question…`;
    }
    
    const flash = document.getElementById('correct-flash');
    flash.classList.add('show');
    setTimeout(() => flash.classList.remove('show'), 300);
    
    setTimeout(() => {
      updateCheckboxesState();
      loadQuestion(generateQuestion());
    }, 850);
  } else {
    streak = 0;
    syncStats();
    fb.className = 'gp-feedback-box fb-error';
    
    if (mode === 'fractions' || mode === 'different-parts') {
      const simplified = simplifyFraction(correct);
      fb.textContent = `✗ Not quite. Try an equivalent fraction to ${simplified}.`;
    } else if (mode === 'compare') {
      fb.textContent = `✗ Not quite. Compare the shaded amounts carefully.`;
    } else if (mode === 'random-total') {
      fb.textContent = `✗ Not quite. The total is ${currentQ.total}. What portion is shaded?`;
    } else {
      fb.textContent = '✗ Not quite — count the shaded sections vs total sections carefully.';
    }
    
    input.focus();
    const range = document.createRange();
    range.selectNodeContents(input);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

// ─────────────────────────────────────────────────────────
// LOAD QUESTION
// ─────────────────────────────────────────────────────────
function loadQuestion(q) {
  if (isLoading) return;
  isLoading = true;
  currentQ = q;
  
  currentColorSet = generateRandomColorSet();
  updateCheckboxesState();

  const loader = document.getElementById('pp-loader');
  const loaderTxt = document.getElementById('pp-loader-text');
  const fb = document.getElementById('feedback-box');
  const input = document.getElementById('answer-input');
  const modeForDisplay = q.mode || settings.mode;
  
  let uiMode = modeForDisplay;
  if (modeForDisplay === 'different-parts' && q.requestedMode) {
    uiMode = q.requestedMode;
  }
  
  const m = MODES[uiMode] || MODES.fractions;
  const isTimeMode = uiMode === 'time';
  const isCompare = modeForDisplay === 'compare';
  const isRandomTotal = modeForDisplay === 'random-total';
  const isDifferentParts = modeForDisplay === 'different-parts';

  loader.classList.remove('hidden');
  loaderTxt.textContent = 'Rendering shape…';
  fb.className = 'gp-feedback-box';
  fb.textContent = 'Study the shape and type your answer below.';
  input.textContent = '';
  input.setAttribute('data-placeholder', m.placeholder);

  document.getElementById('modal-title').textContent = m.modalQ;
  document.getElementById('format-hint').textContent = m.hint;
  document.getElementById('answer-label').textContent = m.label;
  
  const sameSplitContainer = document.getElementById('same-split-checkbox-container');
  if (sameSplitContainer) {
    sameSplitContainer.style.display = isCompare ? 'flex' : 'none';
  }
  const sameSplitToggle = document.getElementById('same-split-toggle');
  if (sameSplitToggle) {
    sameSplitToggle.checked = settings.sameSplitCompare;
  }
  
  const ticksContainer = document.getElementById('ticks-checkbox-container');
  const ticksCheckbox = document.getElementById('show-ticks-modal');
  if (ticksContainer) {
    ticksContainer.style.display = isTimeMode ? 'flex' : 'none';
  }
  if (ticksCheckbox) {
    ticksCheckbox.checked = settings.showTickMarks;
  }
  
  const labelsContainer = document.getElementById('labels-checkbox-container');
  const labelsCheckbox = document.getElementById('show-labels-modal');
  if (labelsContainer) {
    const hasLabels = isTimeMode || isCompare || isRandomTotal || isDifferentParts;
    labelsContainer.style.display = hasLabels ? 'flex' : 'none';
  }
  if (labelsCheckbox) {
    labelsCheckbox.checked = settings.showLabels;
  }
  
  const standardNumpad = document.getElementById('standard-numpad');
  const compareNumpad = document.getElementById('compare-numpad');
  if (standardNumpad && compareNumpad) {
    if (isCompare) {
      standardNumpad.classList.add('hidden');
      compareNumpad.classList.remove('hidden');
    } else {
      standardNumpad.classList.remove('hidden');
      compareNumpad.classList.add('hidden');
    }
  }

  const wrap = document.getElementById('polypad-wrap');
  const oldSvg = wrap.querySelector('svg');
  if (oldSvg) oldSvg.remove();

  const svg = createFractionSVG(settings.type, q, modeForDisplay);
  wrap.appendChild(svg);

  setTimeout(() => {
    loader.classList.add('hidden');
    input.focus();
    isLoading = false;
  }, 80);
}

// ─────────────────────────────────────────────────────────
// SESSION OPEN / CLOSE
// ─────────────────────────────────────────────────────────
function startSession() {
  streak = 0;
  syncStats();
  updatePartsDropdownState();
  updateCheckboxesState();
  document.getElementById('polypad-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
  loadQuestion(generateQuestion());
}

function closeModal() {
  document.getElementById('polypad-modal').classList.remove('active');
  document.body.style.overflow = '';
  const wrap = document.getElementById('polypad-wrap');
  const oldSvg = wrap.querySelector('svg');
  if (oldSvg) oldSvg.remove();
}

function syncStats() {
  document.getElementById('modal-streak').textContent =
    streak === 0 ? '0 in a row' : `🔥 ${streak} in a row`;
  document.getElementById('stat-streak').textContent = streak;
  document.getElementById('stat-total').textContent = totalSolved;
}

// ─────────────────────────────────────────────────────────
// KEYBOARD EVENT HANDLERS
// ─────────────────────────────────────────────────────────
const answerInput = document.getElementById('answer-input');

answerInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    checkAnswer();
  }
});

answerInput.addEventListener('click', () => {
  const container = document.getElementById('numpad-container');
  if (container.classList.contains('hidden')) {
    container.classList.remove('hidden');
    document.getElementById('keypad-toggle').classList.add('active');
  }
});

answerInput.addEventListener('paste', e => {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  
  const selection = window.getSelection();
  if (selection.rangeCount === 0) {
    answerInput.textContent += text;
    return;
  }
  
  const range = selection.getRangeAt(0);
  range.deleteContents();
  
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  selection.removeAllRanges();
  selection.addRange(range);
});

answerInput.addEventListener('drop', e => {
  e.preventDefault();
});

answerInput.addEventListener('beforeinput', e => {
  if (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak') {
    e.preventDefault();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('polypad-modal').classList.contains('active')) {
    closeModal();
  }
});

updatePartsDropdownState();