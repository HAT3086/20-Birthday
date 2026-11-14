import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import * as progress from '../dist/progress.mjs';
import * as art from '../dist/art.mjs';
import * as costumes from '../dist/costumes.mjs';
import * as breeds from '../dist/breeds.mjs';
import * as candyArt from '../dist/candy-art.mjs';
import * as catrisArt from '../dist/catris-art.mjs';
import * as birthdayAccess from '../dist/birthday-access.mjs';
import { awardProgress, loadProgress, saveProgress } from '../dist/engine.mjs';

function fixture(saved = {}, failStorage = false, preview = birthdayAccess.BIRTHDAY_PREVIEW_ENABLED) {
  const values = new Map([[progress.ARCADE_KEY, JSON.stringify(progress.normalizeArcade(saved))]]);
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => { if (failStorage) throw new Error('unavailable'); values.set(key, value); } };
  const context2d = new Proxy({}, { get: (target, key) => target[key] ?? (() => {}), set: (target, key, value) => { target[key] = value; return true; } });
  const nodes = new Map();
  const node = id => {
    if (nodes.has(id)) return nodes.get(id);
    const item = { textContent: '', innerHTML: '', hidden: false, open: false, value: '', style: {}, dataset: {}, events: new Map(), attributes: new Map(),
      addEventListener: (name, fn) => item.events.set(name, fn), setAttribute: (name, value) => item.attributes.set(name, value),
      classList: { toggle: () => {} }, focus: () => {}, showModal: () => { item.open = true; }, close: () => { item.open = false; }, getContext: () => context2d,
    }; nodes.set(id, item); return item;
  };
  const rows = progress.GAMES.map(({ id }) => { const row = node(`row-${id}`); row.dataset.gameStars = id; return row; });
  const events = new Map();
  const destinations=[];
  const context = vm.createContext({ ...progress, ...art, ...costumes, ...breeds, ...candyArt, ...catrisArt,
    canOpenBirthday: stars => birthdayAccess.canOpenBirthday(stars,preview),
    document: { getElementById: node, createElement: tag => { assert.equal(tag, 'canvas'); return { getContext: () => context2d }; }, querySelectorAll: selector => selector === '[data-game-stars]' ? rows : [] },
    window: { innerWidth: 1366, localStorage: storage, location:{assign:url=>destinations.push(url)}, addEventListener: (name, fn) => events.set(name, fn) },
  });
  vm.runInContext(readFileSync(new URL('../dist/hub.mjs', import.meta.url), 'utf8').replace(/^import .*?;\r?\n/gm, ''), context);
  const submit = value => { node('name-input').value = value; node('profile-form').events.get('submit')({ preventDefault: () => {} }); };
  return { node, submit, events, storage, destinations };
}
test('first entry asks for a name and displays twenty unearned birthday slots', () => {
  const app = fixture(); assert.equal(app.node('profile-dialog').open, true);
  assert.equal((app.node('birthday-star-grid').innerHTML.match(/role="listitem"/g) || []).length, 20);
  assert.equal(app.node('total-stars').textContent, 0);
  assert.equal(app.node('celebrate-button').disabled, true);
});
test('name entry persists identity and leaves special login rewards reserved', () => {
  const app = fixture(); app.submit('  Birthday Cat  ');
  assert.equal(app.node('profile-dialog').open, false);
  assert.match(app.node('hub-greeting').textContent, /Birthday Cat/);
  assert.equal(progress.loadArcade(app.storage).profile.name, 'Birthday Cat');
  assert.equal(app.node('total-stars').textContent, 0); assert.equal(app.node('hub-coins').textContent, 0);
});
test('blank names are rejected without closing the welcome dialog', () => {
  const app = fixture(); app.submit('   ');
  assert.equal(app.node('profile-error').hidden, false); assert.equal(app.node('profile-dialog').open, true);
});
test('returning from Snake refreshes the shared wallet, game completion, and birthday stars', () => {
  const app = fixture({ profile: { name: 'Player' } });
  saveProgress(app.storage, awardProgress(loadProgress(app.storage), 5).progress);
  app.events.get('pageshow')();
  assert.equal(app.node('hub-coins').textContent, 10); assert.equal(app.node('total-stars').textContent, 1); assert.equal(app.node('completed-count').textContent, 1);
  assert.equal(app.node('birthday-progress').attributes.get('aria-valuenow'), '1');
  assert.equal(app.node('gift-message').textContent, '19 stars to go.');
  assert.match(app.node('row-snake').innerHTML, /earned/);
  assert.equal(progress.loadArcade(app.storage).profile.name, 'Player');
});
test('profile edits and refreshes do not duplicate already earned coins', () => {
  const app = fixture({ profile: { name: 'Player' }, games: { snake: { stars: 3 } } });
  app.submit('New name'); app.events.get('pageshow')();
  assert.equal(app.node('hub-coins').textContent, 30); assert.equal(app.node('total-stars').textContent, 3);
  assert.equal(progress.loadArcade(app.storage).profile.name, 'New name');
});
test('storage failures are visible and the hub still accepts a player name', () => {
  const app = fixture({}, true); app.submit('Player');
  assert.match(app.node('hub-save-status').textContent, /Saving unavailable/);
  assert.equal(app.node('profile-dialog').open, false);
  assert.match(app.node('hub-greeting').textContent, /Player/);
});

test('returning from Flappy Cat refreshes both game totals and their shared birthday wallet', () => {
  const app = fixture({ profile: { name: 'Player' }, games: { snake: { stars: 1 } } });
  const state = progress.loadArcade(app.storage); state.games.flappy = { stars: 2, best: 15, completed: true };
  progress.saveArcade(app.storage, state); app.events.get('pageshow')();
  assert.equal(app.node('hub-coins').textContent, 30); assert.equal(app.node('total-stars').textContent, 3);
  assert.equal(app.node('completed-count').textContent, 2); assert.match(app.node('row-flappy').innerHTML, /earned/);
});

test('returning from Cat Fishing updates the third game and shared totals', () => {
  const app=fixture({profile:{name:'Player'},games:{snake:{stars:1},flappy:{stars:1}}});
  const state=progress.loadArcade(app.storage); state.games.mining={stars:3,best:30,completed:true}; progress.saveArcade(app.storage,state);
  app.events.get('pageshow')(); assert.equal(app.node('hub-coins').textContent,50); assert.equal(app.node('total-stars').textContent,5);
  assert.equal(app.node('completed-count').textContent,3); assert.match(app.node('row-mining').innerHTML,/earned/);
});

test('returning from Rooftop Run shows its stars and completed course',()=>{
  const app=fixture({profile:{name:'Player'}});const state=progress.loadArcade(app.storage);
  state.games.platformer={starIds:[0,2],completed:true,best:100};progress.saveArcade(app.storage,state);app.events.get('pageshow')();
  assert.equal(app.node('hub-coins').textContent,20);assert.equal(app.node('total-stars').textContent,2);assert.equal(app.node('completed-count').textContent,1);
  assert.match(app.node('row-platformer').innerHTML,/earned/);
});

test('returning from Candy Cat updates its stars, completed count, and shared coin wallet',()=>{
  const app=fixture({profile:{name:'Player'}});const state=progress.loadArcade(app.storage);state.games.slingshot={stars:2,best:1200,completed:true};progress.saveArcade(app.storage,state);app.events.get('pageshow')();
  assert.equal(app.node('hub-coins').textContent,20);assert.equal(app.node('total-stars').textContent,2);assert.equal(app.node('completed-count').textContent,1);assert.equal((app.node('row-slingshot').innerHTML.match(/earned/g)||[]).length,2);
});

test('returning from Catris updates the final game and grants the all-six completion star only once',()=>{
  const games=Object.fromEntries(progress.GAMES.filter(game=>game.id!=='tetris').map(({id})=>[id,{stars:1,completed:true}]));const app=fixture({profile:{name:'Player'},games});
  const state=progress.loadArcade(app.storage);state.games.tetris={stars:1,best:5,completed:true};progress.saveArcade(app.storage,state);app.events.get('pageshow')();
  assert.equal(app.node('hub-coins').textContent,60);assert.equal(app.node('total-stars').textContent,7);assert.equal(app.node('completed-count').textContent,6);assert.equal(progress.loadArcade(app.storage).bonuses.welcome,false);
  app.events.get('pageshow')();assert.equal(app.node('hub-coins').textContent,60);assert.equal(app.node('total-stars').textContent,7);
});

test('with preview disabled the celebration requires all eighteen game stars and both bonus stars',()=>{
  const games=Object.fromEntries(progress.GAMES.map(({id})=>[id,{stars:3,completed:true}]));
  const locked=fixture({profile:{name:'Player'},games},false,false);assert.equal(locked.node('celebrate-button').disabled,true);assert.equal(locked.node('total-stars').textContent,19);
  const unlocked=fixture({profile:{name:'Player'},games,bonuses:{welcome:true}},false,false);assert.equal(unlocked.node('celebrate-button').disabled,false);assert.equal(unlocked.node('gift-title').textContent,'Celebrate!');assert.equal(unlocked.node('total-stars').textContent,20);assert.equal(unlocked.node('hub-coins').textContent,180);
});

test('temporary birthday preview opens from zero stars without granting rewards',()=>{
  const app=fixture({profile:{name:'Player'}},false,true),before=progress.loadArcade(app.storage);
  assert.equal(app.node('celebrate-button').disabled,false);assert.equal(app.node('gift-title').textContent,'Preview birthday cake');
  app.node('celebrate-button').events.get('click')();
  assert.deepEqual(app.destinations,['./birthday.html']);assert.deepEqual(progress.loadArcade(app.storage),before);
  assert.equal(app.node('total-stars').textContent,0);assert.equal(app.node('hub-coins').textContent,0);
});


test('editing the player profile also renames the hub cat and its portrait',()=>{
  const app=fixture({profile:{name:'Nova'}});assert.equal(app.node('hub-cat-name').textContent,'Nova');app.submit('Luna');assert.equal(app.node('hub-cat-name').textContent,'Luna');assert.match(app.node('hub-cat').attributes.get('aria-label'),/^Luna wearing Original/);
});
