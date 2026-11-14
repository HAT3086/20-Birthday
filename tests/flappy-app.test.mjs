import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import * as flight from '../dist/flappy-engine.mjs';
import * as arcade from '../dist/progress.mjs';
import * as art from '../dist/art.mjs';
import * as scene from '../dist/flight-art.mjs';
import * as costumes from '../dist/costumes.mjs';
import * as breeds from '../dist/breeds.mjs';
import { changeBreed, changeCostume } from '../dist/wardrobe.mjs';

function fixture(saved = {}, storageWorks = true) {
  const values = new Map([[arcade.ARCADE_KEY, JSON.stringify(arcade.normalizeArcade(saved))]]);
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => { if (!storageWorks) throw new Error('unavailable'); values.set(key, value); } };
  const drawContext = new Proxy({}, { get: (target, key) => target[key] ?? (() => {}), set: (target, key, value) => { target[key] = value; return true; } });
  const nodes = new Map();
  const node = id => {
    if (nodes.has(id)) return nodes.get(id);
    const element = { id, textContent: '', innerHTML: '', hidden: false, open: false, style: {}, dataset: {}, events: new Map(), attributes: new Map(),
      getContext: () => drawContext, focus: () => {}, setAttribute: (name, value) => element.attributes.set(name, value),
      addEventListener: (name, fn) => element.events.set(name, fn), querySelector: selector => node(`${id}:${selector}`), classList: { toggle: () => {} },
      showModal: () => { element.open = true; }, close: () => { element.open = false; },
    }; nodes.set(id, element); return element;
  };
  const milestones = [0, 1, 2].map(i => node(`milestone-${i}`));
  const dialogs = [node('help-dialog'), node('collection-dialog')], documentEvents = new Map(), windowEvents = new Map();
  const document = { hidden: false, getElementById: node,
    querySelector: selector => selector === 'dialog[open]' ? dialogs.find(dialog => dialog.open) : null,
    querySelectorAll: selector => ({ '[data-milestone]': milestones, '[data-close]': [], dialog: dialogs })[selector] || [],
    addEventListener: (name, fn) => documentEvents.set(name, fn),
  };
  const window = { innerWidth: 1366, localStorage: storage, location: { href: '' }, addEventListener: (name, fn) => windowEvents.set(name, fn) };
  const context = vm.createContext({ ...flight, ...arcade, ...art, ...scene, ...costumes, ...breeds, document, window,
    ArcadeAudio: class { async unlock() {} effect() {} updateMusic() {} },
    matchMedia: () => ({ matches: true }), performance: { now: () => 1000 }, requestAnimationFrame: () => {}, setTimeout: () => 1, clearTimeout: () => {}, console,
  });
  vm.runInContext(readFileSync(new URL('../dist/flappy-app.mjs', import.meta.url), 'utf8').replace(/^import .*?;\r?\n/gm, ''), context);
  const run = expression => vm.runInContext(expression, context);
  const pass = count => { for (let i = 0; i < count; i++) run("game.y = game.gates[0].center; game.velocity = 0; game.gates[0].x = FLIGHT.catX - FLIGHT.pipeWidth - FLIGHT.cap - FLIGHT.radius - 1; game.gates[0].passed = false; tick(1/120);"); };
  const click = id => node(id).events.get('click')();
  return { node, storage, document, window, documentEvents, windowEvents, run, pass, click };
}

test('the application reaches victory at 30 with three stars and thirty shared coins', async () => {
  const app = fixture(); await app.click('play-button'); app.pass(30);
  assert.equal(app.run('game.status'), 'won'); assert.equal(app.node('gate-count').textContent, '30');
  assert.equal(app.node('star-count').textContent, 3); assert.equal(app.node('wallet-count').textContent, 30);
  assert.match(app.node('result-rewards').innerHTML, /\+30 coins/);
  const saved = arcade.loadArcade(app.storage);
  assert.equal(saved.games.flappy.best, 30); assert.equal(saved.games.flappy.stars, 3); assert.equal(saved.wallet.coins, 30);
  assert.equal(arcade.totalStars(saved), 3); assert.equal(saved.games.snake.stars, 0);
});

test('a fully collected replay still ends at 30 and reports zero extra rewards', async () => {
  const app = fixture({ games: { flappy: { stars: 3 } } }); await app.click('play-button'); app.pass(30);
  assert.equal(app.run('game.status'), 'won'); assert.equal(app.node('wallet-count').textContent, 30);
  assert.match(app.node('result-rewards').innerHTML, /All rewards collected/);
});

test('a crash after a milestone keeps its reward and a retry cannot collect it twice', async () => {
  const app = fixture(); await app.click('play-button'); app.pass(5);
  app.run('game.y = FLIGHT.ground; tick(1/120);');
  assert.equal(app.run('game.status'), 'lost'); assert.equal(arcade.loadArcade(app.storage).wallet.coins, 10);
  await app.click('play-button'); app.pass(5);
  assert.equal(arcade.loadArcade(app.storage).wallet.coins, 10); assert.equal(app.run('runStars'), 0);
  app.pass(10); assert.equal(arcade.loadArcade(app.storage).wallet.coins, 20);
});

test('pause, resume, help, tab hiding, and a delayed animation frame do not jump the flight', async () => {
  const app = fixture(); await app.click('play-button'); app.click('pause-button');
  const before = app.run('game.y'); app.run('tick(1/120);'); assert.equal(app.run('game.y'), before);
  await app.click('play-button'); assert.equal(app.run('game.status'), 'playing');
  app.click('help-button'); assert.equal(app.run('game.status'), 'paused');
  const key = { key: ' ', repeat: false, preventDefault() {} }; app.documentEvents.get('keydown')(key);
  assert.equal(app.run('game.status'), 'paused');
  app.node('help-dialog').close(); await app.click('play-button');
  app.document.hidden = true; app.documentEvents.get('visibilitychange')(); assert.equal(app.run('game.status'), 'paused');
  app.document.hidden = false; await app.click('play-button');
  const y = app.run('game.y'); app.run('frame(1400);'); assert.equal(app.run('game.status'), 'paused'); assert.equal(app.run('game.y'), y);
});

test('Space and Up flap, repeat keys are ignored, and P or Escape pauses and resumes', async () => {
  const app = fixture(); await app.click('play-button');
  const press = (key, repeat = false) => app.documentEvents.get('keydown')({ key, repeat, preventDefault() {} });
  app.run('game.velocity=100;'); press('ArrowUp'); assert.equal(app.run('game.velocity'), flight.FLIGHT.impulse);
  app.run('game.velocity=100;'); press(' ', true); assert.equal(app.run('game.velocity'), 100);
  press('p'); assert.equal(app.run('game.status'), 'paused'); press('p', true); assert.equal(app.run('game.status'), 'paused');
  await press('Escape'); await Promise.resolve(); assert.equal(app.run('game.status'), 'playing');
});

test('flight rewards preserve Cake, wallet spending, profile, breed, and the selected costume', async () => {
  const app = fixture({ profile: { name: 'Player' }, appearance: { breed: 'orange' }, games: { snake: { stars: 3 } }, wallet: { spent: 20 }, skins: { owned: ['original', 'sailor'], equipped: 'sailor' } });
  await app.click('play-button'); app.pass(5);
  const saved = arcade.loadArcade(app.storage);
  assert.equal(saved.wallet.coins, 20); assert.equal(saved.wallet.spent, 20); assert.equal(saved.games.snake.stars, 3);
  assert.equal(saved.profile.name, 'Player'); assert.equal(saved.appearance.breed, 'orange'); assert.equal(saved.skins.equipped, 'sailor');
  assert.equal(app.node('portrait-canvas').attributes.get('aria-label'), 'Player wearing Little Sailor · Orange');
});

test('an unavailable save keeps rewards in memory, shows a warning, and does not pay them again', async () => {
  const app = fixture({}, false); await app.click('play-button'); app.pass(5);
  assert.equal(app.node('save-status').hidden, false); assert.match(app.node('save-status').textContent, /Saving unavailable/);
  assert.equal(app.node('wallet-count').textContent, 10);
  await app.run('start()'); app.pass(5); assert.equal(app.node('wallet-count').textContent, 10); assert.equal(app.run('runStars'), 0);
});

test('returning from wardrobe refreshes appearance, and results return to the arcade', async () => {
  const app = fixture({ games: { snake: { stars: 3 } } });
  changeCostume(app.storage, 'gardener', true); changeBreed(app.storage, 'british'); app.windowEvents.get('pageshow')();
  assert.equal(app.node('portrait-canvas').attributes.get('aria-label'), 'Mochi wearing Garden Paws · British Shorthair');
  await app.click('play-button'); app.run('game.y=FLIGHT.ground; tick(1/120);'); app.click('overlay-secondary');
  assert.equal(app.window.location.href, './'); assert.equal(arcade.loadArcade(app.storage).skins.equipped, 'gardener');
});


test('the cat shares the saved player name and refreshes after a profile rename without changing costumes',()=>{
  const app=fixture({profile:{name:'Nova'},skins:{owned:['sailor'],equipped:'sailor'}});
  assert.equal(app.node('cat-name').textContent,'Nova');assert.match(app.node('portrait-canvas').attributes.get('aria-label'),/^Nova wearing Little Sailor/);
  const saved=arcade.loadArcade(app.storage);saved.profile.name='Luna';arcade.saveArcade(app.storage,saved,{profile:true});app.windowEvents.get('pageshow')();
  assert.equal(app.node('cat-name').textContent,'Luna');assert.match(app.node('portrait-canvas').attributes.get('aria-label'),/^Luna wearing Little Sailor/);assert.equal(arcade.loadArcade(app.storage).skins.equipped,'sailor');
});
