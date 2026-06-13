// ============================================================
//  Math Flappy Bird — Unified script.js
//  Shared by all four subfolders. Operation is auto-detected
//  from the URL path — no changes needed to HTML buttons.
//
//  URL detection:
//    …/flappy-bird-addition/…      → 'add'
//    …/flappy-bird-subtraction/…   → 'sub'
//    …/flappy-bird-multiplication/… → 'mul'  (default)
//    …/flappy-bird-division/…      → 'div'
//
//  Buttons only need: data-table="N"
// ============================================================

// ── Detect operation from URL ────────────────────────────────
function detectOperation() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('addition'))       return 'add';
  if (path.includes('subtraction'))    return 'sub';
  if (path.includes('division'))       return 'div';
  if (path.includes('multiplication')) return 'mul';
  return 'mul'; // safe default
}

// ── State ────────────────────────────────────────────────────
let currentProblem    = {};
let selectedTable     = null;
let currentOperation  = detectOperation(); // auto-set from URL
let score             = 0;
let gameOver          = false;
let problemCount      = 0;
let isGeneratingProblem = false;

// ── DOM ──────────────────────────────────────────────────────
const mathProblemElement = document.getElementById('mathProblem');
const gameContainer      = document.querySelector('.game-container');
const choicesElement     = document.getElementById('choices');
const scoreElement       = document.getElementById('score');
const startScreen        = document.getElementById('startScreen');
const gameOverScreen     = document.getElementById('gameOver');
const restartButton      = document.getElementById('restartButton');
const canvas             = document.getElementById('gameCanvas');

// ── Canvas setup ─────────────────────────────────────────────
const gameWidth  = gameContainer.clientWidth;
const gameHeight = gameContainer.clientHeight;
canvas.setAttribute('width',  gameWidth);
canvas.setAttribute('height', gameHeight);
const ctx = canvas.getContext('2d');

// ── Bird & physics ───────────────────────────────────────────
let bird = { x: 50, y: 300, velocity: 0, radius: 25 };
let pipes = [];

const gravity     = 0.25;
const jump        = -3;
const pipeWidth   = 50;
let   pipeSpeed   = 2;
let   pipeGap     = 250;

// ── Assets ───────────────────────────────────────────────────
const birdImg       = new Image(); birdImg.src       = 'https://i.imgur.com/2yb0xZ8.png';
const pipeImg       = new Image(); pipeImg.src       = 'https://i.imgur.com/RO8uSQq.png';
const cloudImg      = new Image(); cloudImg.src      = 'https://i.imgur.com/c6t2Ve3.png';
const backgroundImg = new Image(); backgroundImg.src = 'https://i.imgur.com/pxSF3t6.png';

let clouds = [
  { x: -100, y:  50, width: 120, height: 80, speed: 0.5 },
  { x: -200, y: 150, width: 100, height: 70, speed: 0.3 },
];

// ── Audio ────────────────────────────────────────────────────
const jumpSound    = new Audio('audio/flap.mp3');
const hitSound     = new Audio('audio/hit.mp3');
const wrongSound   = new Audio('audio/die.mp3');
const correctSound = new Audio('audio/point.mp3');
const swooshSound  = new Audio('audio/swoosh.mp3');
const backgroundMusic = document.getElementById('backgroundMusic');

function startMusic() { backgroundMusic.play(); }
function stopMusic()  { backgroundMusic.pause(); backgroundMusic.currentTime = 0; }

function preloadSounds() {
  [jumpSound, hitSound, wrongSound, correctSound, swooshSound].forEach(s => s.load());
}

// ── Event listeners ──────────────────────────────────────────
document.addEventListener('keydown',   handleKeyboardInput);
document.addEventListener('keydown',   handleJump);
document.addEventListener('touchstart', handleJump);
canvas.addEventListener('click',       handleJump);
restartButton.addEventListener('click', resetGame);

// ── Game lifecycle ───────────────────────────────────────────
function startGame(table) {
  selectedTable    = table;
  // currentOperation already set from URL at boot
  startScreen.style.display = 'none';
  generateProblem();
  startMusic();
  preloadSounds();
  canvas.setAttribute('height', gameHeight - 70);
}

function resetGame() {
  bird.y      = 300;
  bird.velocity = 0;
  pipes         = [];
  score         = 0;
  problemCount  = 0;
  gameOver      = false;
  isGeneratingProblem = false;
  gameOverScreen.style.display = 'none';
  updateScore();
  enableChoices();
  removeHighlight();
  generateProblem();
  startMusic();
}

function endGame() {
  if (gameOver) return;   // guard against double-trigger
  gameOver = true;
  hitSound.currentTime = 0;
  hitSound.play();
  gameOverScreen.style.display = 'block';
  document.getElementById('finalScore').textContent = `Final Score: ${score}`;
  disableChoices();
  highlightCorrectAnswer();
  stopMusic();
}

// ── Input handlers ───────────────────────────────────────────
function handleJump(e) {
  if (e.target.classList.contains('choice')) return;
  if (gameOver) {
    resetGame();
  } else if (selectedTable !== null) {
    bird.velocity = jump;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
}

function handleKeyboardInput(e) {
  if (gameOver) return;
  if (['1', '2', '3', '4'].includes(e.key)) {
    const index   = parseInt(e.key) - 1;
    const choices = document.querySelectorAll('.choice');
    if (choices[index]) handleChoice(parseInt(choices[index].textContent));
  } else if (e.key === ' ' || e.key === 'ArrowUp') {
    handleJump(e);
  }
}

function handleChoice(choice) {
  if (gameOver || isGeneratingProblem) return;
  disableChoices();

  if (choice === currentProblem.answer) {
    score++;
    correctSound.currentTime = 0;
    correctSound.play();
    updateScore();
    setTimeout(() => { enableChoices(); generateProblem(); }, 800);
  } else {
    wrongSound.currentTime = 0;
    wrongSound.play();
    endGame();
  }
}

// ── Problem dispatcher ───────────────────────────────────────
function generateProblem() {
  if (selectedTable === null || isGeneratingProblem) return;
  switch (currentOperation) {
    case 'add': generateAdditionProblem();       break;
    case 'sub': generateSubtractionProblem();    break;
    case 'mul': generateMultiplicationProblem(); break;
    case 'div': generateDivisionProblem();       break;
    default:    generateMultiplicationProblem();
  }
}

// ── Problem generators ───────────────────────────────────────
function generateAdditionProblem() {
  isGeneratingProblem = true;
  problemCount++;

  const num1          = selectedTable;
  const num2          = Math.floor(Math.random() * 9) + 1;
  const correctAnswer = num1 + num2;

  mathProblemElement.textContent = `${num1} + ${num2} = ?`;
  currentProblem = { answer: correctAnswer };

  let choices = [correctAnswer];
  while (choices.length < 4) {
    const offset      = Math.floor(Math.random() * 5) - 2;   // –2 to +2
    const randomChoice = correctAnswer + offset;
    if (randomChoice > 0 && !choices.includes(randomChoice)) choices.push(randomChoice);
  }
  renderChoices(choices);
  isGeneratingProblem = false;
}

function generateSubtractionProblem() {
  isGeneratingProblem = true;
  problemCount++;

  const minuend       = Math.max(selectedTable + 2, Math.floor(Math.random() * 15) + selectedTable + 1);
  const subtrahend    = minuend - selectedTable;   // correct answer
  const correctAnswer = subtrahend;

  mathProblemElement.textContent = `${minuend} - ? = ${selectedTable}`;
  currentProblem = { answer: correctAnswer };

  let choices = [correctAnswer];
  while (choices.length < 4) {
    const offset      = Math.floor(Math.random() * 5) - 2;
    const wrongChoice = Math.max(1, correctAnswer + offset);
    if (wrongChoice !== correctAnswer && !choices.includes(wrongChoice)) choices.push(wrongChoice);
  }
  renderChoices(choices);
  isGeneratingProblem = false;
}

function generateMultiplicationProblem() {
  isGeneratingProblem = true;
  problemCount++;

  const multiplier    = Math.floor(Math.random() * 12) + 1;
  const correctAnswer = selectedTable * multiplier;

  mathProblemElement.textContent = `${selectedTable} × ${multiplier} = ?`;
  currentProblem = { answer: correctAnswer };

  let choices = [correctAnswer];
  while (choices.length < 4) {
    const randomChoice = Math.floor(Math.random() * (selectedTable * 12)) + 1;
    if (!choices.includes(randomChoice)) choices.push(randomChoice);
  }
  renderChoices(choices);
  isGeneratingProblem = false;
}

function generateDivisionProblem() {
  isGeneratingProblem = true;
  problemCount++;

  // Build a clean division: (selectedTable × divisor) ÷ ? = selectedTable
  const divisor       = Math.floor(Math.random() * 10) + 1;   // 1–10
  const dividend      = selectedTable * divisor;
  const correctAnswer = divisor;

  mathProblemElement.textContent = `${dividend} ÷ ? = ${selectedTable}`;
  currentProblem = { answer: correctAnswer };

  let choices = [correctAnswer];
  while (choices.length < 4) {
    let wrongChoice = Math.random() > 0.5
      ? Math.max(1, correctAnswer + Math.floor(Math.random() * 3) - 1)
      : Math.max(1, Math.floor(Math.random() * 10) + 1);
    if (wrongChoice !== correctAnswer && !choices.includes(wrongChoice)) choices.push(wrongChoice);
  }
  renderChoices(choices);
  isGeneratingProblem = false;
}

// ── Choice rendering helper ──────────────────────────────────
function renderChoices(choices) {
  choicesElement.innerHTML = '';
  choices.sort(() => Math.random() - 0.5).forEach((choice, index) => {
    const button = document.createElement('button');
    button.textContent = choice;
    button.classList.add('choice');
    button.onclick = () => handleChoice(choice);
    button.setAttribute('data-number', index + 1);
    choicesElement.appendChild(button);
  });
}

// ── Score ────────────────────────────────────────────────────
function updateScore() {
  scoreElement.textContent = `Score: ${score}`;
}

// ── Pipe management ──────────────────────────────────────────
function createPipe() {
  const gapStart = Math.random() * (canvas.height - pipeGap - 100) + 50;
  pipes.push({
    x:            canvas.width,
    topHeight:    gapStart,
    bottomHeight: canvas.height - gapStart - pipeGap,
    passed:       false,
  });
}

// ── Physics update ───────────────────────────────────────────
function updateGame() {
  bird.velocity += gravity;
  bird.y        += bird.velocity;

  // Top boundary
  if (bird.y - bird.radius < 0) {
    bird.y        = bird.radius;
    bird.velocity = Math.abs(bird.velocity) * 0.8;
  }

  // Bottom boundary
  if (bird.y + bird.radius > canvas.height) { endGame(); return; }

  pipes.forEach(pipe => {
    pipe.x -= pipeSpeed;
    if (checkCollision(bird, pipe)) { endGame(); return; }
    if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
      pipe.passed = true;
      swooshSound.currentTime = 0;
      swooshSound.play();
    }
  });

  pipes = pipes.filter(pipe => pipe.x > -pipeWidth);
  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 300) createPipe();
}

function checkCollision(bird, pipe) {
  if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipeWidth) {
    if (bird.y - bird.radius < pipe.topHeight - 10)              { hitSound.play(); return true; }
    if (bird.y + bird.radius > canvas.height - pipe.bottomHeight){ hitSound.play(); return true; }
  }
  return false;
}

// ── Draw routines ─────────────────────────────────────────────
function drawBird() {
  ctx.drawImage(birdImg, bird.x - bird.radius, bird.y - bird.radius, bird.radius * 2, bird.radius * 2);
}

function drawPipes() {
  pipes.forEach(pipe => {
    // Upper pipe (flipped)
    ctx.save();
    ctx.translate(pipe.x + pipeWidth / 2, pipe.topHeight / 2);
    ctx.rotate(Math.PI);
    ctx.drawImage(pipeImg, -pipeWidth / 2, -pipe.topHeight / 2, pipeWidth, pipe.topHeight);
    ctx.restore();
    // Lower pipe
    ctx.drawImage(pipeImg, pipe.x, canvas.height - pipe.bottomHeight, pipeWidth, pipe.bottomHeight);
  });
}

function drawClouds() {
  clouds.forEach(cloud => {
    cloud.x += cloud.speed;
    if (cloud.x > canvas.width) cloud.x = -cloud.width;
    ctx.drawImage(cloudImg, cloud.x, cloud.y, cloud.width, cloud.height);
  });
}

function drawGame() {
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  drawClouds();
  drawPipes();
  drawBird();
}

// ── Game loop ────────────────────────────────────────────────
function gameLoop() {
  if (!gameOver && selectedTable !== null) updateGame();
  drawGame();
  requestAnimationFrame(gameLoop);
}

// ── UI helpers ───────────────────────────────────────────────
function disableChoices()  { document.querySelectorAll('.choice').forEach(b => b.disabled = true);  }
function enableChoices()   { document.querySelectorAll('.choice').forEach(b => b.disabled = false); }
function removeHighlight() { document.querySelectorAll('.choice').forEach(b => b.classList.remove('correct-answer')); }

function highlightCorrectAnswer() {
  document.querySelectorAll('.choice').forEach(button => {
    if (parseInt(button.textContent) === currentProblem.answer) button.classList.add('correct-answer');
  });
}

document.querySelectorAll('.tableChoice').forEach(button => {
  button.addEventListener('click', () => {
    const table = parseInt(button.getAttribute('data-table'));
    startGame(table);
  });
});

// ── Boot ─────────────────────────────────────────────────────
updateScore();
gameLoop();
