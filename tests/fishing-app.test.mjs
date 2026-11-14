import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import * as fishing from '../dist/fishing-engine.mjs';
import * as arcade from '../dist/progress.mjs';
import * as art from '../dist/art.mjs';
import * as scene from '../dist/fishing-art.mjs';
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
  const context = vm.createContext({ ...fishing, ...arcade, ...art, ...scene, ...costumes, ...breeds, document, window,
    ArcadeAudio: class { async unlock() {} effect() {} updateMusic() {} },
    matchMedia: () => ({ matches: true }), performance: { now: () => 1000 }, requestAnimationFrame: () => {}, setTimeout: () => 1, clearTimeout: () => {}, console,
  });
  vm.runInContext(readFileSync(new URL('../dist/fishing-app.mjs', import.meta.url), 'utf8').replace(/^import .*?;\r?\n/gm, ''), context);
  const run = expression => vm.runInContext(expression, context);
  const land = (kind, type) => run(`game.hook.phase = 'reel'; game.hook.length = LAKE.rest + .1; game.hook.payload = makeCatch(game, '${kind}', {type: '${type}'}); tick(1/120);`);
  const click = id => node(id).events.get('click')();
  return { node, storage, document, window, documentEvents, windowEvents, run, land, click };
}

test('fish points reach three stars, thirty coins, and victory in the shared save', async () => {
  const app = fixture(); await app.click('play-button');
  for(let i=0;i<10;i++) app.land('fish','big');
  assert.equal(app.run('game.status'),'won'); assert.equal(app.node('point-count').textContent,'30');
  const saved = arcade.loadArcade(app.storage);
  assert.equal(saved.games.mining.stars,3); assert.equal(saved.games.mining.best,30); assert.equal(saved.wallet.coins,30);
  assert.equal(saved.games.snake.stars,0); assert.equal(saved.games.flappy.stars,0); assert.match(app.node('result-rewards').innerHTML,/\+30 coins/);
});

test('replays still win and cannot collect more coins; rewards survive restarting midway', async () => {
  const app = fixture(); await app.click('play-button'); app.land('fish','big'); app.land('fish','big');
  assert.equal(arcade.loadArcade(app.storage).wallet.coins,10);
  await app.run('start()');
  for(let i=0;i<10;i++)app.land('fish','big');
  assert.equal(app.run('runCoins'),20); assert.equal(arcade.loadArcade(app.storage).wallet.coins,30);
  await app.click('play-button'); for(let i=0;i<10;i++)app.land('fish','big');
  assert.equal(app.run('game.status'),'won'); assert.match(app.node('result-rewards').innerHTML,/All rewards collected/);
});

test('boost badges and point rewards follow real orb delivery and single-fish charges', async () => {
  const app = fixture(); await app.click('play-button'); app.land('orb','double');
  assert.equal(app.node('boost-double').hidden,false); app.land('fish','big');
  assert.equal(app.node('point-count').textContent,'06'); assert.equal(app.node('boost-double').hidden,true);
  assert.equal(app.node('wallet-count').textContent,10);
  app.land('orb','speed'); assert.match(app.node('boost-speed').textContent,/10s/);
  app.land('orb','freeze'); assert.match(app.node('boost-freeze').textContent,/5s/);
});

test('Space casts once, held keys cannot recast, and P or Escape pauses all timers', async () => {
  const app = fixture(); await app.click('play-button'); app.land('orb','speed');
  const press=(key,repeat=false)=>app.documentEvents.get('keydown')({key,repeat,preventDefault(){}});
  press(' ',true); assert.equal(app.run('game.hook.phase'),'aim');
  press(' '); assert.equal(app.run('game.hook.phase'),'cast');
  press('p'); const before=app.run('game.boosts.speed'); app.run('tick(1/30)'); assert.equal(app.run('game.boosts.speed'),before);
  await press('Escape'); await Promise.resolve(); assert.equal(app.run('game.status'),'playing');
});

test('help, tab hiding, narrow screens, and delayed frames safely pause fishing', async () => {
  const app=fixture(); await app.click('play-button'); app.click('help-button'); assert.equal(app.run('game.status'),'paused');
  app.documentEvents.get('keydown')({key:' ',repeat:false,preventDefault(){}}); assert.equal(app.run('game.status'),'paused');
  app.node('help-dialog').close(); await app.click('play-button'); app.document.hidden=true; app.documentEvents.get('visibilitychange')();
  assert.equal(app.run('game.status'),'paused'); app.document.hidden=false; await app.click('play-button');
  app.run('frame(1400)'); assert.equal(app.run('game.status'),'paused');
  await app.click('play-button'); app.window.innerWidth=999; app.windowEvents.get('resize')(); assert.equal(app.run('game.status'),'paused');
});

test('fishing rewards preserve the other games, spending, name, breed, and costume', async () => {
  const app=fixture({profile:{name:'Player'},games:{snake:{stars:3},flappy:{stars:1}},appearance:{breed:'orange'},wallet:{spent:20},skins:{owned:['original','sailor'],equipped:'sailor'}});
  await app.click('play-button'); app.land('fish','big'); app.land('fish','big');
  const state=arcade.loadArcade(app.storage);
  assert.equal(state.wallet.coins,30); assert.equal(state.wallet.spent,20); assert.equal(state.games.snake.stars,3); assert.equal(state.games.flappy.stars,1);
  assert.equal(state.profile.name,'Player'); assert.equal(state.appearance.breed,'orange'); assert.equal(state.skins.equipped,'sailor');
  assert.equal(app.node('portrait-canvas').attributes.get('aria-label'),'Player wearing Little Sailor · Orange');
});

test('unavailable saving warns visibly and retains nonrepeatable rewards within the tab', async () => {
  const app=fixture({},false); await app.click('play-button'); app.land('fish','big'); app.land('fish','big');
  assert.equal(app.node('save-status').hidden,false); assert.equal(app.node('wallet-count').textContent,10);
  await app.run('start()'); app.land('fish','big'); app.land('fish','big'); assert.equal(app.node('wallet-count').textContent,10); assert.equal(app.run('runStars'),0);
});

test('returning from Wardrobe refreshes Mochi and winning can return to the arcade', async () => {
  const app=fixture({games:{snake:{stars:3}}}); changeCostume(app.storage,'gardener',true); changeBreed(app.storage,'british');
  app.windowEvents.get('pageshow')(); assert.equal(app.node('portrait-canvas').attributes.get('aria-label'),'Mochi wearing Garden Paws · British Shorthair');
  await app.click('play-button'); for(let i=0;i<10;i++)app.land('fish','big'); app.click('overlay-secondary');
  assert.equal(app.window.location.href,'./'); assert.equal(arcade.loadArcade(app.storage).skins.equipped,'gardener');
});



test('the cat shares the saved player name and refreshes after a profile rename without changing costumes',()=>{
  const app=fixture({profile:{name:'Nova'},skins:{owned:['sailor'],equipped:'sailor'}});
  assert.equal(app.node('cat-name').textContent,'Nova');assert.match(app.node('portrait-canvas').attributes.get('aria-label'),/^Nova wearing Little Sailor/);
  const saved=arcade.loadArcade(app.storage);saved.profile.name='Luna';arcade.saveArcade(app.storage,saved,{profile:true});app.windowEvents.get('pageshow')();
  assert.equal(app.node('cat-name').textContent,'Luna');assert.match(app.node('portrait-canvas').attributes.get('aria-label'),/^Luna wearing Little Sailor/);assert.equal(arcade.loadArcade(app.storage).skins.equipped,'sailor');
});
