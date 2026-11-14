import { SIZE, GOAL, MILESTONES, STORAGE_KEY, createGame, queueTurn, step, stepDuration, loadProgress, saveProgress, normalizeProgress, awardProgress } from './engine.mjs';
import { ARCADE_KEY, loadArcade, playerCatName } from './progress.mjs';
import { drawCat, drawSittingCat } from './art.mjs';
import { costumeFor } from './costumes.mjs';
import { breedFor } from './breeds.mjs';
import { BackgroundMusic } from './background-music.mjs';

const $ = id => document.getElementById(id);
const canvas = $('game-canvas');
const ctx = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage;
try { storage = window.localStorage; } catch { storage = null; }
let saveAvailable = true;
let progress = loadProgress(storage);
let lastCatName = null;
let costume = null;
let breed = null;
let game = createGame();
let runCoins = 0;
let runStars = 0;
let lastStep = 0;
let lastFrame = 0;
let toastTimer;
let effectUntil = 0;

class GardenAudio {
  context = null;
  music = new BackgroundMusic(() => this.context, () => progress.music, 'snake');
  async unlock() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      this.context ||= new Audio();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { /* The game also works when audio is unavailable. */ }
  }
  tone(frequency, duration = .1, volume = .04, delay = 0, type = 'sine') {
    const ac = this.context;
    if (!ac || ac.state !== 'running') return;
    const oscillator = ac.createOscillator();
    const envelope = ac.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const start = ac.currentTime + delay;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + .008);
    envelope.gain.exponentialRampToValueAtTime(.001, start + duration);
    oscillator.connect(envelope); envelope.connect(ac.destination);
    oscillator.start(start); oscillator.stop(start + duration + .02);
  }
  effect(name) {
    if (!progress.sound) return;
    if (name === 'fish') { this.tone(660, .08, .025); this.tone(880, .09, .018, .045); }
    if (name === 'star') [523, 659, 784, 1047].forEach((n, i) => this.tone(n, .2, .04, i * .075, 'triangle'));
    if (name === 'lost') { this.tone(220, .15, .035, 0, 'triangle'); this.tone(147, .25, .025, .12, 'triangle'); }
    if (name === 'won') [523, 659, 784, 1047, 988, 1047].forEach((n, i) => this.tone(n, .27, .04, i * .11, 'triangle'));
    if (name === 'start') { this.tone(440, .12, .03); this.tone(659, .14, .03, .09); }
  }
  updateMusic() {
    return this.music.update();
  }
}
const audio = new GardenAudio();

function persist() {
  const saved = loadProgress(storage);
  progress = normalizeProgress({ ...progress, stars: Math.max(progress.stars, saved.stars), best: Math.max(progress.best, saved.best) });
  const ok = saveProgress(storage, progress);
  saveAvailable = ok;
  $('save-status').innerHTML = ok ? '<span class="saved-dot"></span> Progress saved on this device' : 'Saving unavailable · keep this tab open';
}

function announce(message) { $('live-announcement').textContent = message; }

function updateHUD() {
  const catTitle = playerCatName(loadArcade(storage));
  $('cat-name').textContent = catTitle;
  const appearance = loadArcade(storage);
  const outfit = costumeFor(appearance.skins.equipped);
  const selectedBreed = breedFor(appearance.appearance.breed);
  if (costume !== outfit.id || breed !== selectedBreed.id || lastCatName !== catTitle) {
    lastCatName = catTitle;
    costume = outfit.id;
    breed = selectedBreed.id;
    drawSittingCat($('portrait-canvas').getContext('2d'), 240, 180, costume, breed);
    drawSittingCat($('overlay-cat').getContext('2d'), 120, 120, costume, breed);
    $('portrait-canvas').setAttribute('aria-label', `${catTitle} wearing ${outfit.name}${breed === 'original' ? '' : ` · ${selectedBreed.name}`}`);
  }
  $('fish-count').textContent = String(game.score).padStart(2, '0');
  $('best-count').textContent = String(progress.best).padStart(2, '0');
  $('wallet-count').textContent = saveAvailable ? loadArcade(storage).wallet.coins : progress.coins;
  $('star-count').textContent = progress.stars;
  $('collection-stars').textContent = `${progress.stars} / 3`;
  $('collection-coins').textContent = `${progress.coins} / 30`;
  $('pace-label').textContent = game.score < 10 ? 'A GENTLE START' : game.score < 25 ? 'HAPPY LITTLE PAWS' : 'QUITE THE PARADE';
  const nextIndex = progress.stars;
  document.querySelectorAll('[data-milestone]').forEach((row, index) => {
    const collected = index < progress.stars;
    row.classList.toggle('collected', collected);
    row.classList.toggle('current', !collected && index === nextIndex);
    row.querySelector('.milestone-reward').innerHTML = collected ? 'Collected ✓' : '+10 <svg class="icon"><use href="#icon-coin"/></svg>';
    row.setAttribute('aria-label', `${MILESTONES[index]} fish: ${collected ? 'star collected' : 'star not yet collected'}`);
  });
  const target = MILESTONES[nextIndex];
  $('next-label').textContent = target ? 'Next star' : 'All stars collected';
  const previousTarget = MILESTONES[nextIndex - 1] || 0;
  const stageGoal = target - previousTarget;
  const stageFish = Math.max(0, game.score - previousTarget);
  $('next-progress').textContent = target ? `${stageFish} / ${stageGoal} fish` : '3 / 3';
  $('milestone-fill').style.width = `${target ? Math.min(100, stageFish / stageGoal * 100) : 100}%`;
  $('reward-note').innerHTML = progress.stars === 3 ? '<svg class="icon"><use href="#icon-star"/></svg> All rewards collected. Play for the joy.' : '<svg class="icon"><use href="#icon-coin"/></svg> Each star brings 10 coins, just once.';
  $('sound-button').setAttribute('aria-pressed', String(progress.sound));
  $('sound-button').setAttribute('aria-label', progress.sound ? 'Mute sound effects' : 'Enable sound effects');
  $('sound-button').querySelector('.mute-slash').hidden = progress.sound;
  $('music-button').setAttribute('aria-pressed', String(progress.music));
  $('music-label').textContent = 'Music';
  const labels = { ready: 'A LITTLE ADVENTURE AWAITS', playing: 'LITTLE PAWS, KEEP GOING', paused: 'TAKE YOUR TIME', lost: 'ANOTHER LITTLE CHANCE?', won: `${GOAL} FISH. ONE VERY HAPPY CAT.` };
  $('status-label').textContent = labels[game.status];
  $('pause-button').hidden = game.status !== 'playing';
}

function toast(message) {
  clearTimeout(toastTimer);
  $('board-toast').textContent = message;
  $('board-toast').hidden = false;
  toastTimer = setTimeout(() => { $('board-toast').hidden = true; }, 2400);
  announce(message);
}

function setOverlay({ tag, title, copy, action, hint = '', secondary = false, results = false }) {
  $('game-overlay').hidden = false;
  $('overlay-tag').textContent = tag;
  $('overlay-title').textContent = title;
  $('overlay-copy').innerHTML = copy;
  $('play-button').innerHTML = `${action} <svg class="icon"><use href="#icon-arrow"/></svg>`;
  $('overlay-hint').textContent = hint;
  $('overlay-hint').hidden = !hint;
  $('overlay-secondary').hidden = !secondary;
  $('result-rewards').hidden = !results;
  if (results) {
    $('result-rewards').innerHTML = runStars ? `<span class="reward-chip"><svg class="icon"><use href="#icon-star"/></svg> +${runStars} ${runStars === 1 ? 'star' : 'stars'}</span><span class="reward-chip"><svg class="icon"><use href="#icon-coin"/></svg> +${runCoins} coins</span>` : `<span class="reward-chip replay">${progress.stars === 3 ? 'All rewards collected' : 'No new rewards this round'}</span>`;
  }
}

async function start() {
  await audio.unlock();
  if (document.hidden) return;
  game = createGame();
  game.status = 'playing';
  runCoins = 0; runStars = 0;
  lastStep = performance.now();
  $('game-overlay').hidden = true;
  $('board-toast').hidden = true;
  clearTimeout(toastTimer);
  audio.effect('start');
  audio.updateMusic();
  updateHUD();
  canvas.focus({ preventScroll: true });
  announce('The fish chase has started. Use arrow keys or WASD to move.');
}

function pause(reason = 'manual') {
  if (game.status !== 'playing') return;
  game.status = 'paused';
  setOverlay({ tag: 'PAUSED', title: 'Paused', copy: reason === 'away' ? 'Paused while you were away.' : 'Press Space when you’re ready.', action: 'Resume', secondary: true, hint: 'SPACE TO RESUME' });
  $('overlay-secondary').textContent = 'Start a fresh run';
  updateHUD();
}

async function resume() {
  await audio.unlock();
  if (document.hidden) return;
  game.status = 'playing';
  lastStep = performance.now();
  $('game-overlay').hidden = true;
  updateHUD();
  audio.updateMusic();
  canvas.focus({ preventScroll: true });
}

function finish(won) {
  persist();
  audio.effect(won ? 'won' : 'lost');
  if (won) {
    effectUntil = performance.now() + 2600;
    setOverlay({ tag: 'VICTORY', title: 'One very happy cat.', copy: `All ${GOAL} fish collected.`, action: 'Play again', secondary: true, results: true, hint: `${GOAL} / ${GOAL} FISH · GARDEN COMPLETE` });
    announce(`Victory! ${GOAL} fish collected. ${runStars} new stars and ${runCoins} coins earned.`);
  } else {
    if (!reducedMotion) {
      $('board-wrap').classList.add('shake');
      setTimeout(() => $('board-wrap').classList.remove('shake'), 300);
    }
    const reason = game.reason === 'wall' ? `${playerCatName(loadArcade(storage))} found the edge of the garden.` : 'Your little parade got a bit tangled.';
    setOverlay({ tag: 'RUN COMPLETE', title: 'Oops. Tiny detour.', copy: `${reason}<br>${game.score} fish collected.`, action: 'Try again', secondary: true, results: true, hint: 'EARNED STARS & COINS STAY YOURS' });
    announce(`Run ended: ${game.reason === 'wall' ? 'you hit a wall' : 'you hit your parade'}. ${game.score} fish. ${runStars} new stars, ${runCoins} coins.`);
  }
  $('overlay-secondary').textContent = 'Back to arcade';
  updateHUD();
}

function tick() {
  const result = step(game);
  if (result.ate) {
    const saved = loadProgress(storage);
    progress = normalizeProgress({ ...progress, stars: Math.max(progress.stars, saved.stars), best: Math.max(progress.best, saved.best) });
    const earned = awardProgress(progress, game.score);
    progress = earned.progress;
    runStars += earned.starsEarned;
    runCoins += earned.coinsEarned;
    persist();
    if (earned.starsEarned) {
      audio.effect('star');
      toast(`✦ A star for you! +${earned.coinsEarned} coins`);
      $('collection-button').classList.remove('coin-pop');
      void $('collection-button').offsetWidth;
      $('collection-button').classList.add('coin-pop');
    } else if (!result.won) audio.effect('fish');
    updateHUD();
  }
  if (result.lost || result.won) finish(result.won);
}

function backToGarden() {
  game = createGame();
  runCoins = 0; runStars = 0;
  setOverlay({ tag: 'CAKE', title: 'Ready, little cat?', copy: 'Eat fish. Avoid walls and your parade.', action: 'Play', hint: 'ARROW KEYS / WASD TO WANDER' });
  updateHUD();
}

function drawFish(x, y, t) {
  const cell = canvas.width / SIZE;
  const px = cell / 18;
  const bob = reducedMotion ? 0 : Math.sin(t / 300) * 1.7;
  ctx.save(); ctx.translate(x * cell + cell / 2, y * cell + cell / 2 + bob);
  const rect = (a, b, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(a * px, b * px, w * px, h * px); };
  // A forked tail, stepped oval body, two fins, gill, and a clear eye.
  rect(-6, 6, 13, 1, '#8d9b7b80');
  const outline = '#795235';
  rect(-8, -4, 2, 8, outline); rect(-6, -3, 1, 6, outline); rect(-5, -2, 2, 4, outline);
  rect(-7, -3, 1, 2, '#d7965c'); rect(-7, 1, 1, 2, '#d7965c'); rect(-6, -1, 3, 2, '#e9ad6a');
  rect(-1, -6, 3, 3, outline); rect(0, -5, 2, 2, '#e1a566');
  rect(0, 3, 3, 3, outline); rect(1, 4, 1, 1, '#dda064');
  rect(-3, -4, 8, 8, outline); rect(-5, -2, 2, 4, outline); rect(5, -2, 2, 4, outline);
  rect(-3, -3, 7, 6, '#e8b475'); rect(-4, -1, 9, 2, '#e8b475'); rect(4, -2, 2, 4, '#e8b475');
  rect(-2, -3, 5, 1, '#f5d39a'); rect(-3, 2, 6, 1, '#d19559');
  rect(1, 0, 1, 2, '#c58b52');
  rect(3, -2, 2, 2, '#fbebc6'); rect(4, -1, 1, 1, '#283a30');
  rect(6, 1, 1, 1, '#6e4a32');
  ctx.restore();
}

function drawBoard(t) {
  const cell = canvas.width / SIZE;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    ctx.fillStyle = (x + y) % 2 ? '#bdc8af' : '#c3cdb7';
    ctx.fillRect(x * cell, y * cell, cell, cell);
    if ((x * 17 + y * 7) % 43 === 0) {
      ctx.fillStyle = '#b0bc9f';
      ctx.fillRect(x * cell + 12, y * cell + 27, 2, 3);
      ctx.fillRect(x * cell + 16, y * cell + 25, 2, 5);
    }
  }
  if (game.fish) drawFish(game.fish.x, game.fish.y, t);
  for (let i = game.body.length - 1; i >= 0; i--) {
    const segment = game.body[i];
    let direction = game.direction;
    if (i > 0) {
      const preceding = game.body[i - 1];
      direction = preceding.x > segment.x ? 'right' : preceding.x < segment.x ? 'left' : preceding.y > segment.y ? 'down' : 'up';
    }
    ctx.fillStyle = '#9eab8b95'; ctx.fillRect(segment.x * cell + 7, segment.y * cell + 31, 27, 5);
    drawCat(ctx, segment.x * cell + 1, segment.y * cell, cell - 2, direction, i === 0, Math.floor(t / 3000) % 3 === 1 && t % 3000 < 130, costume, breed);
  }
  if (game.status === 'ready') {
    // A small dotted path gives the sleeping garden a sense of direction.
    ctx.fillStyle = '#8a997b99';
    for (let x = 9; x < 16; x++) ctx.fillRect(x * cell + 18, 10 * cell + 18, 4, 4);
  }
  if (!reducedMotion && t < effectUntil) {
    const colors = ['#d7af51', '#e0a38a', '#819d7b', '#81aaa5'];
    for (let i = 0; i < 55; i++) {
      const x = (i * 137.5) % canvas.width;
      const y = ((t / 5 + i * 53) % (canvas.height + 30)) - 15;
      ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(x, y, 6, 9);
    }
  }
}

function frame(time) {
  if (game.status === 'playing' && time - lastStep >= stepDuration(game.score)) {
    // One tick per frame avoids a burst of movement after an interrupted frame.
    lastStep = time; tick();
  }
  if (time - lastFrame > 32) { drawBoard(time); lastFrame = time; }
  requestAnimationFrame(frame);
}

$('play-button').addEventListener('click', () => game.status === 'paused' ? resume() : start());
$('overlay-secondary').addEventListener('click', () => { if (game.status === 'paused') start(); else { persist(); window.location.href = './'; } });
$('home-button').addEventListener('click', () => { persist(); });
$('shop-link').addEventListener('click', () => { pause(); persist(); });
$('pause-button').addEventListener('click', () => pause());
const keyDirections = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
document.addEventListener('keydown', event => {
  if (document.querySelector('dialog[open]')) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const direction = keyDirections[key];
  if (direction && game.status === 'playing') { event.preventDefault(); queueTurn(game, direction); }
  if ([' ', 'p', 'Escape'].includes(key) && ['playing', 'paused'].includes(game.status)) {
    if (event.repeat) return;
    event.preventDefault(); game.status === 'playing' ? pause() : resume();
  }
});
window.addEventListener('resize', () => { if (window.innerWidth < 1000) pause('away'); });

for (const [button, dialog] of [['help-button', 'help-dialog'], ['collection-button', 'collection-dialog']]) {
  $(button).addEventListener('click', () => { pause(); $(dialog).showModal(); });
}
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } }));
$('sound-button').addEventListener('click', async () => {
  await audio.unlock(); progress.sound = !progress.sound; persist(); updateHUD();
  if (progress.sound) audio.effect('fish');
});
$('music-button').addEventListener('click', async () => {
  await audio.unlock(); progress.music = !progress.music; persist(); updateHUD(); audio.updateMusic();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause('away'); audio.updateMusic(); });
window.addEventListener('blur', () => pause('away'));
window.addEventListener('pageshow', () => { progress = loadProgress(storage); updateHUD(); audio.updateMusic(); });
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== ARCADE_KEY) return;
  progress = loadProgress(storage); updateHUD(); audio.updateMusic();
});

persist();
updateHUD();
requestAnimationFrame(frame);
