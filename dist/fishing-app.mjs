import { LAKE, FISHING_STARS, createFishing, castFishing, stepFishing, awardFishingProgress } from './fishing-engine.mjs';
import { ARCADE_KEY, LEGACY_SNAKE_KEY, loadArcade, saveArcade, mergeArcade, normalizeArcade, playerCatName } from './progress.mjs';
import { drawSittingCat } from './art.mjs';
import { drawFishing, drawLakeItem } from './fishing-art.mjs';
import { costumeFor } from './costumes.mjs';
import { breedFor } from './breeds.mjs';
import { ArcadeAudio } from './arcade-audio.mjs';

const $ = id => document.getElementById(id);
const canvas = $('game-canvas'), context = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage;
try { storage = window.localStorage; } catch { storage = null; }
let state = loadArcade(storage), game = createFishing();
let runStars = 0, runCoins = 0, starting = false, lastTime = null, accumulator = 0, toastTimer, celebrationUntil = 0;
let appearanceKey = '';
const audio = new ArcadeAudio(() => state.settings, 'mining');
const announce = message => { $('live-announcement').textContent = message; };

function persist() {
  const ok = saveArcade(storage, state);
  if (ok) state = loadArcade(storage);
  $('save-status').hidden = ok;
  $('save-status').textContent = ok ? '' : 'Saving unavailable. Rewards stay in this tab until you leave.';
  return ok;
}

function updateHUD() {
  const catTitle = playerCatName(state);
  $('cat-name').textContent = catTitle;
  const progress = state.games.mining;
  $('point-count').textContent = String(game.score).padStart(2, '0');
  $('best-count').textContent = String(progress.best).padStart(2, '0');
  $('wallet-count').textContent = state.wallet.coins;
  $('star-count').textContent = progress.stars;
  $('collection-stars').textContent = `${progress.stars} / 3`;
  $('collection-coins').textContent = `${progress.stars * 10} / 30`;
  document.querySelectorAll('[data-milestone]').forEach((row, index) => {
    const collected = index < progress.stars;
    row.classList.toggle('collected', collected);
    row.classList.toggle('current', index === progress.stars);
    row.querySelector('.milestone-reward').innerHTML = collected ? 'Collected ✓' : '+10 <svg class="icon"><use href="#icon-coin"/></svg>';
    row.setAttribute('aria-label', `${FISHING_STARS[index]} points: ${collected ? 'star collected' : 'star not yet collected'}`);
  });
  const target = FISHING_STARS[progress.stars], previous = FISHING_STARS[progress.stars - 1] || 0;
  $('next-label').textContent = target ? 'Next star' : 'All stars collected';
  $('next-progress').textContent = target ? `${game.score} / ${target} points` : '3 / 3';
  $('milestone-fill').style.width = `${target ? Math.max(0, Math.min(100, (game.score - previous) / (target - previous) * 100)) : 100}%`;
  $('sound-button').setAttribute('aria-pressed', String(state.settings.sound));
  $('sound-button').setAttribute('aria-label', state.settings.sound ? 'Mute sound effects' : 'Enable sound effects');
  $('sound-button').querySelector('.mute-slash').hidden = state.settings.sound;
  $('music-button').setAttribute('aria-pressed', String(state.settings.music));
  $('pause-button').hidden = game.status !== 'playing';
  const outfit = costumeFor(state.skins.equipped), breed = breedFor(state.appearance.breed);
  const key = `${outfit.id}:${breed.id}:${catTitle}`;
  if (key !== appearanceKey) {
    appearanceKey = key;
    drawSittingCat($('portrait-canvas').getContext('2d'), 240, 180, outfit.id, breed.id);
    drawSittingCat($('overlay-cat').getContext('2d'), 120, 120, outfit.id, breed.id);
    $('portrait-canvas').setAttribute('aria-label', `${catTitle} wearing ${outfit.name}${breed.id === 'original' ? '' : ` · ${breed.name}`}`);
  }
}

function updateBoosts() {
  for (const [id, text] of [['speed', `⚡ 2× reel · ${Math.ceil(game.boosts.speed)}s`], ['double', `×2 · ${game.boosts.double} fish`], ['freeze', `❄ Freeze · ${Math.ceil(game.boosts.freeze)}s`]]) {
    $(`boost-${id}`).hidden = game.boosts[id] <= 0;
    if ($(`boost-${id}`).textContent !== text) $(`boost-${id}`).textContent = text;
  }
}

function showToast(message) {
  clearTimeout(toastTimer); $('board-toast').textContent = message; $('board-toast').hidden = false;
  toastTimer = setTimeout(() => { $('board-toast').hidden = true; }, 2200);
  announce(message);
}

function setOverlay(title, copy, action, { secondary = false, results = false } = {}) {
  $('game-overlay').hidden = false;
  $('overlay-title').textContent = title; $('overlay-copy').textContent = copy;
  $('play-button').innerHTML = `${action} <svg class="icon"><use href="#icon-arrow"/></svg>`;
  $('overlay-secondary').hidden = !secondary;
  $('overlay-secondary').textContent = game.status === 'paused' ? 'Start a fresh round' : 'Back to arcade';
  $('result-rewards').hidden = !results;
  if (results) $('result-rewards').innerHTML = runStars
    ? `<span class="reward-chip"><svg class="icon"><use href="#icon-star"/></svg> +${runStars} ${runStars === 1 ? 'star' : 'stars'}</span><span class="reward-chip"><svg class="icon"><use href="#icon-coin"/></svg> +${runCoins} coins</span>`
    : `<span class="reward-chip replay">${state.games.mining.stars === 3 ? 'All rewards collected' : 'No new rewards this round'}</span>`;
}

function refresh() { state = mergeArcade(state, loadArcade(storage)); updateHUD(); audio.updateMusic(); }

async function start() {
  if (starting || window.innerWidth < 1000) return;
  starting = true;
  try {
    await audio.unlock();
    if (document.hidden || window.innerWidth < 1000) return;
    refresh(); game = createFishing(); game.status = 'playing';
    runStars = 0; runCoins = 0; accumulator = 0; lastTime = performance.now(); celebrationUntil = 0;
    clearTimeout(toastTimer); $('board-toast').hidden = true; $('game-overlay').hidden = true;
    audio.effect('start'); audio.updateMusic(); updateHUD(); updateBoosts(); canvas.focus({ preventScroll: true });
    announce('Fishing started. Press Space to cast the swinging hook. P or Escape pauses.');
  } finally { starting = false; }
}

function pause(reason = 'manual') {
  if (game.status !== 'playing') return;
  game.status = 'paused'; accumulator = 0; lastTime = null;
  setOverlay('Paused', reason === 'away' ? 'Paused while you were away.' : 'Continue when you’re ready.', 'Resume', { secondary: true });
  updateHUD(); $('play-button').focus({ preventScroll: true });
}

async function resume() {
  if (game.status !== 'paused') return;
  await audio.unlock();
  if (document.hidden || window.innerWidth < 1000) return;
  game.status = 'playing'; accumulator = 0; lastTime = performance.now();
  $('game-overlay').hidden = true; updateHUD(); audio.updateMusic(); canvas.focus({ preventScroll: true });
}

function recordScore() {
  const settings = state.settings;
  state = mergeArcade(state, loadArcade(storage)); state.settings = settings;
  const reward = awardFishingProgress(state.games.mining, game.score);
  state.games.mining = reward.progress; state = normalizeArcade(state);
  runStars += reward.starsEarned; runCoins += reward.coinsEarned;
  persist(); updateHUD();
  return reward;
}

function finish() {
  persist(); audio.effect('won'); celebrationUntil = performance.now() + 2500;
  setOverlay('Quite the catch!', `30 points. ${game.fishCaught} fish. One happy cat.`, 'Fish again', { secondary: true, results: true });
  announce(`Victory. 30 points. ${runStars} new stars and ${runCoins} coins.`);
  updateHUD(); $('play-button').focus({ preventScroll: true });
}

function tick(seconds) {
  const result = stepFishing(game, seconds);
  if (result.caught) audio.effect('hook');
  if (result.points) {
    const reward = recordScore();
    if (reward.starsEarned) {
      showToast(`✦ ${reward.starsEarned === 1 ? 'A star for you!' : `${reward.starsEarned} new stars!`} +${reward.coinsEarned} coins`);
      audio.effect('star');
    } else { showToast(`+${result.points} points${result.multiplier === 2 ? ' · Double catch!' : ''}`); if (!result.won) audio.effect('catch'); }
  }
  if (result.landed?.kind === 'orb') {
    showToast(({ speed: '⚡ 2× reel speed · 10 seconds', double: '×2 ready for your next fish', freeze: '❄ Fish and orbs frozen · 5 seconds' })[result.landed.type]);
    audio.effect('orb');
  } else if (result.landed?.kind === 'debris') showToast('An old boot · no points');
  updateBoosts();
  if (result.won) finish();
}

function frame(time) {
  if (game.status === 'playing') {
    const elapsed = lastTime === null ? 0 : Math.max(0, (time - lastTime) / 1000);
    lastTime = time;
    if (elapsed > .25) pause('away');
    else {
      accumulator += Math.min(.1, elapsed);
      while (accumulator >= 1 / 120 && game.status === 'playing') { tick(1 / 120); accumulator -= 1 / 120; }
    }
  } else lastTime = time;
  drawFishing(context, game, { catCanvas: $('portrait-canvas'), reducedMotion });
  if (!reducedMotion && time < celebrationUntil) {
    const colors = ['#c2a163', '#b28e86', '#8ca884', '#87a9b0'];
    for (let i = 0; i < 38; i++) { context.fillStyle = colors[i % colors.length]; context.fillRect(i * 173 % LAKE.width, (time / 6 + i * 47) % LAKE.height, 5, 7); }
  }
  requestAnimationFrame(frame);
}

function castInput() {
  if (game.status === 'paused') return resume();
  if (game.status !== 'playing') return start();
  if (castFishing(game)) audio.effect('cast');
}

document.addEventListener('keydown', event => {
  if (document.querySelector('dialog[open]')) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (event.target?.closest?.('a,input,textarea,select')) return;
  if (key === ' ' && event.target?.closest?.('button')) return;
  if (key === ' ') { event.preventDefault(); if (!event.repeat) return castInput(); }
  if (['p', 'Escape'].includes(key) && ['playing', 'paused'].includes(game.status)) {
    event.preventDefault(); if (!event.repeat) return game.status === 'playing' ? pause() : resume();
  }
});
canvas.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse' && event.button === 0) castInput(); });
$('play-button').addEventListener('click', () => game.status === 'paused' ? resume() : start());
$('overlay-secondary').addEventListener('click', () => {
  if (game.status === 'paused') start();
  else { persist(); window.location.href = './'; }
});
$('pause-button').addEventListener('click', () => pause());
for (const id of ['home-button', 'shop-link']) $(id).addEventListener('click', () => { pause(); persist(); });
for (const [button, dialog] of [['help-button', 'help-dialog'], ['collection-button', 'collection-dialog']]) {
  $(button).addEventListener('click', () => { pause(); $(dialog).showModal(); });
}
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
}));
for (const [id, setting] of [['sound-button', 'sound'], ['music-button', 'music']]) $(id).addEventListener('click', async () => {
  await audio.unlock(); state.settings[setting] = !state.settings[setting]; persist(); updateHUD(); audio.updateMusic();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause('away'); audio.updateMusic(); });
window.addEventListener('blur', () => pause('away'));
window.addEventListener('resize', () => { if (window.innerWidth < 1000) pause('away'); });
window.addEventListener('pageshow', refresh);
window.addEventListener('pagehide', () => { pause('away'); persist(); });
window.addEventListener('storage', event => { if ([ARCADE_KEY, LEGACY_SNAKE_KEY].includes(event.key)) refresh(); });
document.querySelectorAll('[data-guide]').forEach(item => {
  const type = item.dataset.guide;
  drawLakeItem(item.getContext('2d'), { kind: ['small', 'medium', 'big'].includes(type) ? 'fish' : 'orb', type, x: 45, y: 30, direction: 1 });
});
persist(); updateHUD(); updateBoosts(); requestAnimationFrame(frame);
