import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import * as engine from '../dist/engine.mjs';
import * as arcade from '../dist/progress.mjs';
import * as art from '../dist/art.mjs';
import * as costumes from '../dist/costumes.mjs';
import * as breeds from '../dist/breeds.mjs';
import { BackgroundMusic as MusicPlayer } from '../dist/background-music.mjs';
import { changeCostume, changeBreed } from '../dist/wardrobe.mjs';

// Run the actual application against an isolated DOM fixture. No live browser
// saves are changed, and the real movement/reward engine remains in use.
function appFixture(saved = null, storageWorks = true) {
  const values = new Map(saved ? [[engine.STORAGE_KEY, JSON.stringify(saved)]] : []);
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { if (!storageWorks) throw new Error('storage unavailable'); values.set(key, value); },
  };
  const drawContext = new Proxy({}, { get: (target, key) => target[key] ?? (() => {}), set: (target, key, value) => { target[key] = value; return true; } });
  const nodes = new Map();
  const node = id => {
    if (nodes.has(id)) return nodes.get(id);
    const events = new Map(); const attributes = new Map(); const classes = new Set();
    const element = {
      id, textContent: '', innerHTML: '', hidden: false, width: 800, height: 800, offsetWidth: 200,
      dataset: {}, style: {}, events, attributes,
      classList: { add: name => classes.add(name), remove: name => classes.delete(name), toggle: (name, value) => value ? classes.add(name) : classes.delete(name), contains: name => classes.has(name) },
      getContext: () => drawContext, setAttribute: (key, value) => attributes.set(key, value),
      addEventListener: (name, fn) => events.set(name, fn), querySelector: selector => node(`${id}:${selector}`),
      focus: () => {}, showModal: () => { element.open = true; }, close: () => { element.open = false; },
      setPointerCapture: () => {}, getBoundingClientRect: () => ({ left: 0, top: 0, right: 400, bottom: 400 }),
    };
    nodes.set(id, element); return element;
  };
  const milestones = [0, 1, 2].map(i => node(`milestone-${i}`));
  const dialogs = [node('help-dialog'), node('collection-dialog')];
  const documentEvents = new Map(); const windowEvents = new Map();
  const document = {
    hidden: false, getElementById: node,
    querySelector: selector => selector === 'dialog[open]' ? dialogs.find(item => item.open) : null,
    querySelectorAll: selector => ({ '[data-milestone]': milestones, '[data-close]': [], dialog: dialogs })[selector] || [],
    addEventListener: (name, fn) => documentEvents.set(name, fn),
  };
  const context = vm.createContext({
    ...engine, ...arcade, ...art, ...costumes, ...breeds, BackgroundMusic: class extends MusicPlayer {
      constructor(context, enabled, track) { super(context, enabled, track, { document, window: {} }); }
    }, document, window: { location: { href: '' }, localStorage: storage, addEventListener: (name, fn) => windowEvents.set(name, fn) },
    matchMedia: () => ({ matches: true }), performance: { now: () => 1000 },
    requestAnimationFrame: () => {}, setTimeout: () => 1, clearTimeout: () => {}, setInterval: () => 1, clearInterval: () => {}, console,
  });
  const source = readFileSync(new URL('../dist/app.mjs', import.meta.url), 'utf8').replace(/^import .*?;\r?\n/gm, '');
  vm.runInContext(source, context);
  const run = expression => vm.runInContext(expression, context);
  const click = id => node(id).events.get('click')();
  return { node, storage, run, click, context, document, documentEvents, windowEvents };
}

const feedPath = (app, count = 30) => {
  const path = [];
  for (let x = 8; x < 20; x++) path.push({ x, y: 10 });
  path.push({ x: 19, y: 9 });
  for (let x = 18; x >= 0; x--) path.push({ x, y: 9 });
  path.push({ x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 });
  for (const fish of path.slice(0, count)) {
    app.context.nextFish = fish;
    app.run(`{ const head = game.body[0]; const direction = nextFish.x > head.x ? 'right' : nextFish.x < head.x ? 'left' : nextFish.y > head.y ? 'down' : 'up'; queueTurn(game, direction); game.fish = nextFish; tick(); }`);
  }
};

test('application shows three stars, thirty coins, and victory at the 30th fish', async () => {
  const app = appFixture(); await app.click('play-button'); feedPath(app);
  assert.equal(app.run('game.status'), 'won'); assert.equal(app.node('fish-count').textContent, '30');
  assert.equal(app.node('wallet-count').textContent, 30); assert.equal(app.node('star-count').textContent, 3);
  assert.equal(app.node('overlay-title').textContent, 'One very happy cat.');
  assert.match(app.node('result-rewards').innerHTML, /\+3 stars/); assert.match(app.node('result-rewards').innerHTML, /\+30 coins/);
  const save = engine.loadProgress(app.storage); assert.equal(save.stars, 3); assert.equal(save.coins, 30); assert.equal(save.best, 30);
});

test('fully rewarded application replay still wins at 30 without granting duplicate rewards', async () => {
  const app = appFixture({ stars: 3, best: 30 }); await app.click('play-button'); feedPath(app);
  assert.equal(app.run('game.status'), 'won'); assert.equal(app.node('wallet-count').textContent, 30);
  assert.match(app.node('result-rewards').innerHTML, /All rewards collected/);
  assert.equal(app.run('runStars'), 0); assert.equal(app.run('runCoins'), 0);
});
test('the application shows the next stage as ten and then fifteen additional fish', async () => {
  const app = appFixture(); await app.click('play-button');
  app.run("game.score = 4; game.fish = {x: 8, y: 10}; tick();");
  assert.equal(app.node('next-progress').textContent, '0 / 10 fish');
  app.run("game.score = 14; game.fish = {x: 9, y: 10}; tick();");
  assert.equal(app.node('next-progress').textContent, '0 / 15 fish');
  assert.equal(app.node('wallet-count').textContent, 20);
  app.run("game.score = 29; game.fish = {x: 10, y: 10}; tick();");
  assert.equal(app.run('game.status'), 'won');
  assert.match(app.node('overlay-copy').innerHTML, /All 30 fish/);
});

test('a wall collision preserves an earned star and the next run cannot pay it again', async () => {
  const app = appFixture(); await app.click('play-button'); feedPath(app, 5);
  assert.equal(app.node('wallet-count').textContent, 10);
  app.run("game.body = [{x: 19, y: 0}]; game.direction = 'right'; game.turns = []; game.fish = {x: 0, y: 1}; tick();");
  assert.equal(app.run('game.status'), 'lost'); assert.match(app.node('overlay-copy').innerHTML, /edge of the garden/);
  await app.click('play-button'); feedPath(app, 5);
  assert.equal(app.run('runCoins'), 0); assert.equal(app.node('wallet-count').textContent, 10);
  assert.equal(engine.loadProgress(app.storage).stars, 1);
});

test('pause, resume, auto-pause, help, and fresh-run controls keep state coherent', async () => {
  const app = appFixture(); await app.click('play-button'); app.click('pause-button');
  assert.equal(app.run('game.status'), 'paused'); assert.equal(app.node('play-button').innerHTML.includes('Resume'), true);
  await app.click('play-button'); assert.equal(app.run('game.status'), 'playing');
  app.windowEvents.get('blur')(); assert.equal(app.run('game.status'), 'paused');
  await app.click('overlay-secondary'); assert.equal(app.run('game.status'), 'playing'); assert.equal(app.run('game.score'), 0);
  app.click('help-button'); assert.equal(app.run('game.status'), 'paused'); assert.equal(app.node('help-dialog').open, true);
});

test('application reload restores stars, coins, best score, and audio settings', () => {
  const app = appFixture({ stars: 2, best: 32, sound: false, music: true });
  assert.equal(app.node('wallet-count').textContent, 20); assert.equal(app.node('best-count').textContent, '30');
  assert.equal(app.node('star-count').textContent, 2); assert.equal(app.node('sound-button').attributes.get('aria-pressed'), 'false');
  assert.equal(app.node('music-button').attributes.get('aria-pressed'), 'true');
  assert.equal(app.node('milestone-0').classList.contains('collected'), true);
  assert.equal(app.node('milestone-2').classList.contains('collected'), false);
});

test('keyboard controls steer the game and pause keys are ignored while a help dialog is open', async () => {
  const app = appFixture(); await app.click('play-button');
  app.documentEvents.get('keydown')({ key: 'ArrowUp', repeat: false, preventDefault: () => {} });
  assert.equal(app.run('game.turns[0]'), 'up');
  app.click('help-button');
  app.documentEvents.get('keydown')({ key: ' ', repeat: false, preventDefault: () => {} });
  assert.equal(app.run('game.status'), 'paused');
});

test('an unavailable save clearly shows its limitation and keeps earned rewards in memory', async () => {
  const app = appFixture(null, false); assert.match(app.node('save-status').innerHTML, /Saving unavailable/);
  await app.click('play-button'); feedPath(app, 5);
  assert.equal(app.node('wallet-count').textContent, 10); assert.equal(app.node('star-count').textContent, 1);
});

test('the results screen returns to the arcade after saving the run', async () => {
  const app = appFixture(); await app.click('play-button'); feedPath(app, 5);
  app.run("game.body = [{x: 19, y: 0}]; game.direction = 'right'; game.turns = []; tick();");
  assert.equal(app.run('game.status'), 'lost');
  assert.equal(app.node('overlay-secondary').textContent, 'Back to arcade');
  app.click('overlay-secondary');
  assert.equal(app.run('window.location.href'), './');
  assert.equal(arcade.loadArcade(app.storage).wallet.coins, 10);
  assert.equal(arcade.totalStars(arcade.loadArcade(app.storage)), 1);
});

test('equipping an outfit in the shop updates Cake on return and keeps it through game saves', () => {
  const app = appFixture({ stars: 3, best: 30 });
  assert.equal(changeCostume(app.storage, 'sailor', true).ok, true);
  app.windowEvents.get('pageshow')();
  assert.equal(app.node('portrait-canvas').attributes.get('aria-label'), 'Mochi wearing Little Sailor');
  assert.equal(app.run('costume'), 'sailor');
  app.run('drawBoard(1000); persist();');
  assert.equal(arcade.loadArcade(app.storage).skins.equipped, 'sailor');
  assert.equal(app.node('wallet-count').textContent, 10);
});

test('free breed changes update Cake portraits and the parade without changing its costume', () => {
  const app = appFixture({ stars: 3, best: 30 });
  changeCostume(app.storage, 'sailor', true); changeBreed(app.storage, 'orange');
  app.windowEvents.get('storage')({ key: arcade.ARCADE_KEY });
  assert.equal(app.node('portrait-canvas').attributes.get('aria-label'), 'Mochi wearing Little Sailor · Orange');
  assert.equal(app.run('breed'), 'orange'); assert.equal(app.run('costume'), 'sailor');
  app.run('drawBoard(1000); persist();');
  assert.equal(arcade.loadArcade(app.storage).appearance.breed, 'orange');
  assert.equal(arcade.loadArcade(app.storage).wallet.coins, 10);
});


test('Cake refreshes the cat name from the shared player profile',()=>{
  const app=appFixture();const saved=arcade.loadArcade(app.storage);saved.profile.name='Nova';arcade.saveArcade(app.storage,saved,{profile:true});app.windowEvents.get('pageshow')();
  assert.equal(app.node('cat-name').textContent,'Nova');assert.match(app.node('portrait-canvas').attributes.get('aria-label'),/^Nova wearing Original/);
});
