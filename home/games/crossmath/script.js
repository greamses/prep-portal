// Game State
let numbers = [];
let selectedCell = null;
let startTime = Date.now();
let timerInterval;
let history = [];
let puzzleData = [];
let wins = 0;

// Settings State
let currentInputStyle = '?';

const EMOJIS = ['🍎', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥭', '🍍', '🥝', '🥥', '🍅'];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// --- Dropdown Logic ---
function toggleDropdown(id) {
    const el = document.getElementById(id);
    const wasOpen = el.classList.contains('open');
    document.querySelectorAll('.pp-dropdown').forEach(d => d.classList.remove('open'));
    if (!wasOpen) el.classList.add('open');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.pp-dropdown')) {
        document.querySelectorAll('.pp-dropdown').forEach(d => d.classList.remove('open'));
    }
});

document.querySelectorAll('.pp-dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const list = item.closest('.pp-dropdown-list');
        const headerText = item.closest('.pp-dropdown').querySelector('.dd-selected');
        
        list.querySelectorAll('.pp-dropdown-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        headerText.textContent = item.textContent;
        
        if (list.id === 'list-input') {
            currentInputStyle = item.dataset.value;
        }
    });
});

// --- Acyclic Generator Math Engine (Integers Only) ---
function getFactors(n) {
    let factors = [];
    for (let i = 1; i <= n; i++) {
        if (n % i === 0) factors.push(i);
    }
    return factors;
}

function generateTriple(knownIndex, knownValue, op) {
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    if (knownIndex === -1) {
        let A = rand(2, 12),
            B = rand(2, 12);
        if (op === '+') return [A, B, A + B];
        if (op === '-') { let C = rand(2, 12); return [C + B, B, C]; }
        if (op === '*') return [A, B, A * B];
        if (op === '/') { let C = rand(2, 12); return [B * C, B, C]; }
    }
    
    if (knownIndex === 0) {
        let A = knownValue;
        if (op === '+') { let B = rand(1, 20); return [A, B, A + B]; }
        if (op === '-') {
            if (A <= 1) return null;
            let B = rand(1, A - 1);
            return [A, B, A - B];
        }
        if (op === '*') {
            let B = rand(1, 10);
            return [A, B, A * B];
        }
        if (op === '/') {
            let factors = getFactors(A);
            if (factors.length === 0) return null;
            let B = factors[rand(0, factors.length - 1)];
            return [A, B, A / B];
        }
    }
    
    if (knownIndex === 1) {
        let B = knownValue;
        if (op === '+') { let A = rand(1, 20); return [A, B, A + B]; }
        if (op === '-') { let A = rand(B + 1, B + 20); return [A, B, A - B]; }
        if (op === '*') { let A = rand(1, 10); return [A, B, A * B]; }
        if (op === '/') { let C = rand(1, 10); return [B * C, B, C]; }
    }
    
    if (knownIndex === 2) {
        let C = knownValue;
        if (op === '+') {
            if (C <= 1) return null;
            let A = rand(1, C - 1);
            return [A, C - A, C];
        }
        if (op === '-') { let B = rand(1, 20); return [C + B, B, C]; }
        if (op === '*') {
            let factors = getFactors(C);
            if (factors.length === 0) return null;
            let A = factors[rand(0, factors.length - 1)];
            return [A, C / A, C];
        }
        if (op === '/') {
            let B = rand(1, 10);
            return [B * C, B, C];
        }
    }
    return null;
}

function getSlotCells(slot) {
    if (slot.type === 'H') return [
        [slot.r, slot.c],
        [slot.r, slot.c + 2],
        [slot.r, slot.c + 4]
    ];
    return [
        [slot.r, slot.c],
        [slot.r + 2, slot.c],
        [slot.r + 4, slot.c]
    ];
}

// Generate an entire randomized interconnected path layout
function generateNewGame() {
    showMessage("Generating new puzzle...", "normal");
    
    const allSlots = [];
    for (let r of [0, 2, 4, 6, 8]) {
        for (let c of [0, 2, 4]) allSlots.push({ type: 'H', r, c });
    }
    for (let c of [0, 2, 4, 6, 8]) {
        for (let r of [0, 2, 4]) allSlots.push({ type: 'V', r, c });
    }
    
    let usedNumbers = new Map();
    let equations = [];
    let slotPool = [...allSlots];
    const ops = ['+', '-', '×', '÷'];
    const toInternal = op => op === '×' ? '*' : op === '÷' ? '/' : op;
    
    let startSlot = slotPool.splice(Math.floor(Math.random() * slotPool.length), 1)[0];
    let startOpVisual = ops[Math.floor(Math.random() * ops.length)];
    let startVals = generateTriple(-1, null, toInternal(startOpVisual));
    let startCells = getSlotCells(startSlot);
    
    usedNumbers.set(`${startCells[0][0]},${startCells[0][1]}`, startVals[0]);
    usedNumbers.set(`${startCells[1][0]},${startCells[1][1]}`, startVals[1]);
    usedNumbers.set(`${startCells[2][0]},${startCells[2][1]}`, startVals[2]);
    equations.push({ slot: startSlot, op: startOpVisual, vals: startVals });
    
    let targetEquations = 7 + Math.floor(Math.random() * 2);
    
    while (equations.length < targetEquations) {
        let candidates = [];
        for (let slot of slotPool) {
            let cells = getSlotCells(slot);
            let usedCount = cells.filter(c => usedNumbers.has(`${c[0]},${c[1]}`)).length;
            if (usedCount === 1) candidates.push(slot);
        }
        
        if (candidates.length === 0) break;
        candidates.sort(() => Math.random() - 0.5);
        let added = false;
        
        for (let candidate of candidates) {
            let cells = getSlotCells(candidate);
            let knownIndex = cells.findIndex(c => usedNumbers.has(`${c[0]},${c[1]}`));
            let knownValue = usedNumbers.get(`${cells[knownIndex][0]},${cells[knownIndex][1]}`);
            
            let shuffledOps = [...ops].sort(() => Math.random() - 0.5);
            for (let op of shuffledOps) {
                let vals = generateTriple(knownIndex, knownValue, toInternal(op));
                if (vals) {
                    usedNumbers.set(`${cells[0][0]},${cells[0][1]}`, vals[0]);
                    usedNumbers.set(`${cells[1][0]},${cells[1][1]}`, vals[1]);
                    usedNumbers.set(`${cells[2][0]},${cells[2][1]}`, vals[2]);
                    equations.push({ slot: candidate, op: op, vals: vals });
                    slotPool = slotPool.filter(s => s !== candidate);
                    added = true;
                    break;
                }
            }
            if (added) break;
        }
        if (!added) break;
    }
    
    let allNumKeys = Array.from(usedNumbers.keys());
    allNumKeys.sort(() => Math.random() - 0.5);
    let inputCount = Math.min(10, Math.floor(allNumKeys.length * 0.6));
    let inputSet = new Set(allNumKeys.slice(0, inputCount));
    
    puzzleData = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({ type: 'empty' })));
    
    for (let [key, val] of usedNumbers.entries()) {
        let [r, c] = key.split(',').map(Number);
        if (inputSet.has(key)) {
            puzzleData[r][c] = { type: 'input', rawAns: val };
        } else {
            puzzleData[r][c] = { type: 'result', rawVal: val };
        }
    }
    
    for (let eq of equations) {
        let slot = eq.slot;
        if (slot.type === 'H') {
            puzzleData[slot.r][slot.c + 1] = { type: 'operator', value: eq.op };
            puzzleData[slot.r][slot.c + 3] = { type: 'equals' };
        } else {
            puzzleData[slot.r + 1][slot.c] = { type: 'operator', value: eq.op };
            puzzleData[slot.r + 3][slot.c] = { type: 'equals' };
        }
    }
    
    numbers = [];
    for (let key of inputSet) {
        numbers.push(usedNumbers.get(key));
    }
    numbers.sort(() => Math.random() - 0.5);
    
    selectedCell = null;
    history.length = 0;
    
    // Reset Timer
    clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
    
    renderGrid();
    renderTiles();
    showMessage("Game ready! Good luck.", "normal");
}

// --- Modal Controls ---
function startGame() {
    document.getElementById('game-modal').classList.add('active');
    generateNewGame();
}

function closeGameModal() {
    document.getElementById('game-modal').classList.remove('active');
    clearInterval(timerInterval);
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `${m}:${s}`;
}


// --- View Engine ---
function applyPlaceholders() {
    const inputs = document.querySelectorAll('.input-cell');
    inputs.forEach((cell, index) => {
        let char = '';
        if (currentInputStyle === 'letter') char = LETTERS[index % LETTERS.length];
        else if (currentInputStyle === 'emoji') char = EMOJIS[index % EMOJIS.length];
        else if (currentInputStyle === '?') char = '?';
        
        cell.setAttribute('data-placeholder', char);
    });
}

function renderGrid() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    
    puzzleData.forEach((row, rIndex) => {
        row.forEach((cell, cIndex) => {
            const div = document.createElement("div");
            div.classList.add("cell");
            
            if (cell.type === "input") {
                div.classList.add("input-cell");
                div.dataset.rawAns = cell.rawAns;
                div.id = `c${rIndex}-${cIndex}`;
                div.onclick = () => {
                    document.querySelectorAll(".input-cell").forEach(c => c.classList.remove("selected"));
                    div.classList.add("selected");
                    selectedCell = div;
                };
            } else if (cell.type === "operator") {
                div.classList.add("operator");
                div.textContent = cell.value;
            } else if (cell.type === "equals") {
                div.classList.add("equals");
                div.textContent = "=";
            } else if (cell.type === "result") {
                div.classList.add("result");
                div.dataset.rawVal = cell.rawVal;
                div.textContent = cell.rawVal;
            } else {
                div.classList.add("empty");
            }
            grid.appendChild(div);
        });
    });
    
    applyPlaceholders();
}

function renderTiles() {
    const tilesContainer = document.getElementById('tiles');
    tilesContainer.innerHTML = '';
    
    numbers.forEach((num, index) => {
        const t = document.createElement('div');
        t.className = 'tile';
        t.dataset.rawVal = num;
        t.dataset.tileId = index;
        t.textContent = num;
        t.onclick = () => selectTile(t);
        tilesContainer.appendChild(t);
    });
}

function selectTile(tileElem) {
    if (!selectedCell) {
        showMessage("Select a box on the grid first!", "error");
        return;
    }
    
    const rawVal = tileElem.dataset.rawVal;
    
    // Reverse tile if slot already filled
    if (selectedCell.dataset.userRaw) {
        const oldId = selectedCell.dataset.tileId;
        const oldTile = document.querySelector(`.tile[data-tile-id="${oldId}"]`);
        if (oldTile) oldTile.classList.remove('used');
    }
    
    selectedCell.textContent = rawVal;
    selectedCell.dataset.userRaw = rawVal;
    selectedCell.dataset.tileId = tileElem.dataset.tileId;
    selectedCell.classList.add('has-val');
    tileElem.classList.add('used');
    
    history.push({ cell: selectedCell, tile: tileElem });
    
    checkWin();
}

function checkWin() {
    const cells = document.querySelectorAll('.input-cell');
    let allFilled = true;
    let allCorrect = true;
    
    cells.forEach(c => {
        if (!c.dataset.userRaw) allFilled = false;
        
        // Ensure robust numerical match
        if (Number(c.dataset.userRaw) !== Number(c.dataset.rawAns)) {
            allCorrect = false;
        }
    });
    
    if (allFilled && allCorrect) {
        showMessage("🎉 Perfect! Puzzle Solved!", "success");
        wins++;
        document.getElementById('stat-wins').textContent = wins;
        clearInterval(timerInterval);
    } else if (allFilled) {
        showMessage("Something is not quite right...", "error");
    }
}

document.getElementById('undoBtn').onclick = () => {
    const last = history.pop();
    if (last) {
        last.cell.textContent = '';
        delete last.cell.dataset.userRaw;
        delete last.cell.dataset.tileId;
        last.cell.classList.remove('has-val');
        last.tile.classList.remove('used');
    }
};

document.getElementById('hintBtn').onclick = () => {
    if (!selectedCell) {
        showMessage("Select a box for a hint!", "error");
        return;
    }
    const correctRaw = selectedCell.dataset.rawAns;
    const targetTile = Array.from(document.querySelectorAll('.tile'))
        .find(t => Number(t.dataset.rawVal) === Number(correctRaw) && !t.classList.contains('used'));
    
    if (targetTile) selectTile(targetTile);
};

function showMessage(text, type) {
    const m = document.getElementById('game-feedback');
    m.textContent = text;
    m.className = 'gp-feedback-box';
    if (type) m.classList.add(type);
    
    setTimeout(() => {
        m.className = 'gp-feedback-box';
        m.textContent = "Select a cell in the grid, then click a tile to fill it!";
    }, 4000);
}