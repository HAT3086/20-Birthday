import { ARCADE_KEY, LEGACY_SNAKE_KEY, GAMES, loadArcade, saveArcade, normalizeArcade, totalStars, starSlots, playerCatName } from './progress.mjs';
import { drawCat, drawSittingCat } from './art.mjs';
import { costumeFor } from './costumes.mjs';
import { breedFor } from './breeds.mjs';
import { drawTreat } from './candy-art.mjs';
import { drawCatrisBlock } from './catris-art.mjs';
import { canOpenBirthday } from './birthday-access.mjs';

const $ = id => document.getElementById(id);
let storage;
try { storage = window.localStorage; } catch { storage = null; }
let state = loadArcade(storage);
const profileDialog = $('profile-dialog');
const starIcon = earned => `<svg class="icon${earned ? ' earned' : ''}" aria-hidden="true"><use href="#icon-star"/></svg>`;

function persist(profile = false) {
  const ok = saveArcade(storage, state, { profile });
  if (ok) state = loadArcade(storage);
  $('hub-save-status').hidden = ok;
  $('hub-save-status').textContent = ok ? '' : 'Saving unavailable. Progress may be lost when you leave this page.';
  $('hub-save-status').classList.toggle('error', !ok);
  return ok;
}

function render() {
  const catTitle = playerCatName(state);
  $('hub-cat-name').textContent = catTitle;
  const count = totalStars(state);
  const name = state.profile.name;
  $('hub-greeting').textContent = name ? `Welcome back, ${name}.` : 'Your birthday arcade.';
  $('player-name').textContent = name || 'Your name';
  $('player-initial').textContent = name ? Array.from(name)[0].toLocaleUpperCase() : '?';
  $('profile-button').title = name ? `Edit ${name}'s profile` : 'Set your name';
  $('header-stars').textContent = count;
  $('total-stars').textContent = count;
  $('hub-coins').textContent = state.wallet.coins;
  $('wallet-total').textContent = state.wallet.coins;
  $('completed-count').textContent = GAMES.filter(({ id }) => state.games[id].completed).length;
  document.querySelectorAll('[data-game-stars]').forEach(row => {
    const stars = state.games[row.dataset.gameStars].stars;
    row.innerHTML = [1, 2, 3].map(number => starIcon(number <= stars)).join('');
    row.setAttribute('aria-label', `${stars} of 3 stars collected`);
  });
  $('birthday-star-grid').innerHTML = starSlots(state).map(slot => `<span class="birthday-slot${slot.special ? ' special' : ''}${slot.earned ? ' earned' : ''}" role="listitem" aria-label="${slot.label}: ${slot.earned ? 'collected' : 'not collected'}" title="${slot.label}${slot.id === 'welcome' && !slot.earned ? ' · Meet a cat to earn this star' : ''}">${starIcon(slot.earned)}</span>`).join('');
  $('birthday-progress').setAttribute('aria-valuenow', String(count));
  $('birthday-fill').style.width = `${count / 20 * 100}%`;
  const birthdayOpen = canOpenBirthday(count), preview = birthdayOpen && count < 20;
  $('gift-message').textContent = count === 20 ? 'Your cake is ready. Make a wish.' : preview ? 'No stars needed for this preview.' : `${20 - count} stars to go.`;
  $('gift-title').textContent = count === 20 ? 'Celebrate!' : preview ? 'Preview birthday cake' : 'A birthday surprise';
  $('celebrate-button').disabled = !birthdayOpen;
  $('celebrate-button').setAttribute('aria-label', preview ? 'Preview birthday cake' : 'Celebrate your twentieth birthday');
  $('celebrate-button').classList.toggle('unlocked', birthdayOpen);
  $('celebrate-button').classList.toggle('birthday-preview', preview);
  $('gift-symbol').setAttribute('href', birthdayOpen ? '#icon-arrow' : '#icon-lock');
  const outfit = costumeFor(state.skins.equipped);
  const breed = breedFor(state.appearance.breed);
  $('hub-costume').textContent = breed.id === 'original' ? `${outfit.name} costume` : `${outfit.name} · ${breed.name}`;
  $('hub-cat').setAttribute('aria-label', `${catTitle} wearing ${outfit.name}${breed.id === 'original' ? '' : ` · ${breed.name}`}`);
  drawSittingCat($('hub-cat').getContext('2d'), 240, 180, outfit.id, breed.id);
  drawScene('snake');
  drawScene('flappy');
  drawScene('mining');
  drawScene('platformer');
  drawScene('slingshot');
  drawScene('tetris');
}

function openProfile() {
  $('name-input').value = state.profile.name;
  $('profile-submit').textContent = state.profile.name ? 'Save name' : 'Enter the arcade';
  $('profile-close').hidden = !state.profile.name;
  $('profile-error').hidden = true;
  if (!profileDialog.open) profileDialog.showModal();
  $('name-input').focus();
}

$('celebrate-button').addEventListener('click', () => {
  state = loadArcade(storage); render();
  if (canOpenBirthday(totalStars(state))) window.location.assign('./birthday.html');
});
$('profile-button').addEventListener('click', openProfile);
$('profile-close').addEventListener('click', () => { if (state.profile.name) profileDialog.close(); });
profileDialog.addEventListener('cancel', event => { if (!state.profile.name) event.preventDefault(); });
$('profile-form').addEventListener('submit', event => {
  event.preventDefault();
  const next = normalizeArcade({ ...state, profile: { name: $('name-input').value } });
  if (!next.profile.name) {
    $('profile-error').textContent = 'Please enter a name.';
    $('profile-error').hidden = false;
    $('name-input').focus();
    return;
  }
  state = next;
  persist(true); render(); profileDialog.close();
  $('hub-announcement').textContent = `Welcome, ${state.profile.name}. Your arcade is ready.`;
});
$('wallet-button').addEventListener('click', () => { render(); $('wallet-dialog').showModal(); });
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
$('wallet-dialog').addEventListener('click', event => {
  if (event.target !== $('wallet-dialog')) return;
  const r = event.target.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close();
});
function refresh() { state = loadArcade(storage); render(); }
window.addEventListener('pageshow', refresh);
window.addEventListener('storage', event => { if ([ARCADE_KEY, LEGACY_SNAKE_KEY].includes(event.key)) refresh(); });
window.addEventListener('resize', () => {
  if (window.innerWidth >= 1000 && !state.profile.name) openProfile();
  else if (window.innerWidth < 1000 && profileDialog.open) profileDialog.close();
});

function drawScene(id) {
  const context = $(`art-${id}`).getContext('2d');
  context.clearRect(0, 0, 320, 128);
  context.imageSmoothingEnabled = false;
  const rect = (x, y, w, h, color) => { context.fillStyle = color; context.fillRect(x, y, w, h); };
  const line = (points, color, width = 3) => {
    context.strokeStyle = color; context.lineWidth = width; context.beginPath();
    points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y)); context.stroke();
  };
  const cloud = (x, y) => { rect(x, y + 7, 47, 8, '#edf0e3'); rect(x + 9, y, 27, 18, '#edf0e3'); };
  if (id === 'snake') {
    for (let y = 0; y < 128; y += 16) for (let x = 0; x < 320; x += 16) if ((x / 16 + y / 16) % 2) rect(x, y, 16, 16, '#b9c6a933');
    [93, 128, 163].forEach((x, index) => drawCat(context, x, 64, 38, 'right', index === 2, false, state.skins.equipped, state.appearance.breed));
    rect(240, 74, 21, 14, '#b08d56'); rect(235, 70, 5, 8, '#a17c49'); rect(235, 84, 5, 8, '#a17c49'); rect(241, 75, 17, 10, '#e2b77b'); rect(257, 77, 2, 2, '#4e513a');
  } else if (id === 'flappy') {
    cloud(105, 18); cloud(220, 76);
    rect(44, 77, 38, 51, '#879d79'); rect(39, 72, 48, 11, '#738b67'); rect(252, 0, 37, 49, '#879d79'); rect(247, 46, 47, 11, '#738b67');
    for (const [x, y, w, h] of [[16, 5, 15, 7], [22, -1, 13, 7]]) {
      rect(170 + x, 65 + y, w, h, '#eaf0df'); rect(170 - x - w, 65 + y, w, h, '#eaf0df');
    }
    drawCat(context, 148, 43, 44, 'down', true, false, state.skins.equipped, state.appearance.breed);
  } else if (id === 'platformer') {
    rect(0, 98, 84, 30, '#b5a18e'); rect(94, 70, 88, 58, '#a18f7d'); rect(200, 104, 120, 24, '#b5a18e');
    rect(0, 93, 84, 7, '#806e5c'); rect(94, 65, 88, 7, '#806e5c'); rect(200, 99, 120, 7, '#806e5c');
    [113, 143].forEach(x => rect(x, 90, 15, 21, '#dfc9a6'));
    drawCat(context, 127, 24, 43, 'down', true, false, state.skins.equipped, state.appearance.breed); cloud(230, 20);
  } else if (id === 'mining') {
    rect(0, 57, 320, 71, '#93b4b3'); rect(0, 57, 320, 5, '#b7cdbe');
    [[145, 77, 25], [250, 70, 31], [185, 114, 27], [288, 103, 20]].forEach(([x, y, w]) => rect(x, y, w, 2, '#c1d3c3'));
    rect(0, 59, 127, 10, '#9a7f5c'); rect(0, 69, 127, 5, '#7c6b51');
    [18, 65, 110].forEach(x => { rect(x, 74, 7, 29, '#857253'); rect(x, 74, 2, 29, '#aa8e65'); });
    [32, 64, 96].forEach(x => rect(x, 59, 2, 10, '#b59b73'));
    const cat = document.createElement('canvas'); cat.width = 74; cat.height = 59;
    drawSittingCat(cat.getContext('2d'), cat.width, cat.height, state.skins.equipped, state.appearance.breed); context.drawImage(cat, 48, 3);
    line([[107, 44], [150, 14], [178, 18]], '#756b4b', 3);
    line([[178, 18], [212, 49], [212, 76]], '#f3ead5', 1);
    rect(209, 73, 6, 5, '#c18370'); rect(209, 78, 6, 4, '#f2e6c9');
    [[175, 98], [261, 95]].forEach(([x, y]) => {
      rect(x, y, 17, 8, '#e1bc80'); rect(x - 5, y - 2, 5, 4, '#c69e6a'); rect(x - 5, y + 6, 5, 4, '#c69e6a');
      rect(x + 7, y - 3, 5, 3, '#c69e6a'); rect(x + 13, y + 2, 2, 2, '#52675b');
    });
  } else if (id === 'slingshot') {
    rect(121,9,181,112,'#afa58c');rect(125,13,173,104,'#d4c9b1');
    const treatCanvas=document.createElement('canvas');treatCanvas.width=40;treatCanvas.height=40;
    for(let row=0;row<3;row++)for(let col=0;col<5;col++){
      drawTreat(treatCanvas.getContext('2d'),{color:(row*2+col)%6,special:row===1&&col===2?'rainbow':null},40);
      context.drawImage(treatCanvas,127+col*34,13+row*34,34,34);
    }
    drawCat(context,44,59,58,'down',true,false,state.skins.equipped,state.appearance.breed);
  } else {
    const colors = ['#97ad8b', '#b0a3ba', '#c4a384', '#90acac'];
    const blocks = [[7, 0, 1], [8, 0, 1], [8, 1, 1], [9, 1, 1], [5, 5, 0], [6, 5, 0], [6, 4, 0], [7, 5, 0], [8, 5, 2], [8, 4, 2], [8, 3, 2], [9, 5, 2], [10, 5, 3], [10, 4, 3], [11, 5, 3], [11, 4, 3]];
    blocks.forEach(([x,y,color])=>drawCatrisBlock(context,40+x*16,17+y*16,16,['S','T','L','I'][color]));
    drawCat(context,49,76,42,'down',true,false,state.skins.equipped,state.appearance.breed);
  }
}

GAMES.forEach(({ id }) => drawScene(id));
drawSittingCat($('welcome-cat').getContext('2d'), 120, 120);
persist(); render();
if (!state.profile.name && window.innerWidth >= 1000) openProfile();
