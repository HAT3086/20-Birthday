import { ARCADE_KEY, LEGACY_SNAKE_KEY, loadArcade, playerCatName } from './progress.mjs';
import { COSTUMES, costumeFor } from './costumes.mjs';
import { changeCostume, changeBreed } from './wardrobe.mjs';
import { BREEDS, breedFor } from './breeds.mjs';
import { drawSittingCat } from './art.mjs';

const $ = id => document.getElementById(id);
let storage;
try { storage = window.localStorage; } catch { storage = null; }
let state = loadArcade(storage);
let selected = costumeFor(state.skins.equipped).id;
let busy = false;
const cards = new Map();
const breedButtons = new Map();

for (const breed of BREEDS) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'breed-button';
  button.textContent = breed.name; button.style.setProperty('--breed-color', breed.fur);
  button.setAttribute('aria-label', `${breed.name} breed, free`);
  button.addEventListener('click', () => selectBreed(breed.id));
  breedButtons.set(breed.id, button); $('breed-options').append(button);
}

for (const costume of COSTUMES.filter(item => item.price)) {
  const card = document.createElement('button');
  card.type = 'button'; card.className = 'costume-card'; card.setAttribute('aria-label', `Preview ${costume.name}`);
  card.innerHTML = `<div class="costume-art" style="background:${costume.color}"><canvas width="180" height="150" aria-hidden="true"></canvas><span class="costume-badge" hidden></span></div><div class="costume-card-footer"><h2>${costume.name}</h2><span class="costume-price"><svg class="icon" aria-hidden="true"><use href="#icon-coin"/></svg>${costume.price}</span></div>`;
  drawSittingCat(card.querySelector('canvas').getContext('2d'), 180, 150, costume.id);
  card.addEventListener('click', () => { selected = costume.id; message(''); render(); });
  cards.set(costume.id, card); $('costume-grid').append(card);
}

function message(text, error = false) {
  $('shop-message').textContent = text;
  $('shop-message').classList.toggle('error', error);
}

function render() {
  const catTitle = playerCatName(state);
  const costume = costumeFor(selected);
  const breed = breedFor(state.appearance.breed);
  const owned = state.skins.owned.includes(costume.id);
  const equipped = state.skins.equipped === costume.id;
  const missing = Math.max(0, costume.price - state.wallet.coins);
  $('shop-coins').textContent = state.wallet.coins;
  $('owned-count').textContent = COSTUMES.filter(item => state.skins.owned.includes(item.id)).length;
  $('preview-name').textContent = costume.name;
  $('preview-description').textContent = costume.id === 'original' ? `${catTitle}, without a costume.` : costume.description;
  $('preview-scene').style.background = costume.color;
  $('preview-cat').setAttribute('aria-label', `${catTitle} wearing ${costume.name}${breed.id === 'original' ? '' : ` · ${breed.name}`}`);
  drawSittingCat($('preview-cat').getContext('2d'), 288, 240, costume.id, breed.id);
  const button = $('costume-action');
  button.textContent = busy ? 'Saving…' : equipped ? 'Equipped ✓' : owned ? 'Equip outfit' : `Buy & equip · ${costume.price} coins`;
  button.disabled = busy || equipped || (!owned && missing > 0);
  $('costume-hint').textContent = equipped ? 'Ready to play.' : owned ? 'Owned · free to equip.' : missing ? `Collect ${missing} more coins to bring this one home.` : 'Buy once. Wear anytime.';
  $('original-button').hidden = selected === 'original';
  for (const [id, card] of cards) {
    card.setAttribute('aria-pressed', String(selected === id));
    const badge = card.querySelector('.costume-badge');
    badge.hidden = !state.skins.owned.includes(id);
    badge.textContent = state.skins.equipped === id ? 'Equipped ✓' : 'Owned';
    drawSittingCat(card.querySelector('canvas').getContext('2d'), 180, 150, id, breed.id);
  }
  for (const [id, button] of breedButtons) {
    button.setAttribute('aria-pressed', String(id === breed.id));
    button.disabled = busy;
  }
}

const commitAppearance = commit => window.navigator?.locks ? window.navigator.locks.request('twenty-costume-purchase', commit) : commit();

async function selectBreed(id) {
  if (busy) return;
  busy = true; render();
  try {
    const result = await commitAppearance(() => changeBreed(storage, id));
    state = result.state;
    message(result.ok ? `${breedFor(id).name} selected. All breeds are free.` : 'Your breed could not be saved. Enable browser storage and try again.', !result.ok);
  } catch { message('Your breed could not be saved. Please try again.', true); }
  finally { busy = false; render(); }
}

$('original-button').addEventListener('click', () => { selected = 'original'; message(''); render(); });
$('costume-action').addEventListener('click', async () => {
  if (busy) return;
  const id = selected;
  busy = true; render();
  try {
    const commit = () => changeCostume(storage, id, true);
    const result = await commitAppearance(commit);
    state = result.state;
    const name = costumeFor(id).name;
    if (result.ok) message(result.reason === 'purchased' ? `${name} is yours! Equipped for your next adventure.` : `${name} equipped.`);
    else message(({ coins: 'Your coin balance changed. Collect a few more stars.', saving: 'Saving is unavailable. No coins were spent. Enable browser storage and try again.', unknown: 'This outfit is unavailable.', unowned: 'Choose an owned outfit first.' })[result.reason], true);
  } catch { message('The outfit could not be saved. Please try again.', true); }
  finally { busy = false; render(); }
});

function refresh() { state = loadArcade(storage); render(); }
window.addEventListener('pageshow', refresh);
window.addEventListener('storage', event => { if ([ARCADE_KEY, LEGACY_SNAKE_KEY].includes(event.key)) refresh(); });
render();
