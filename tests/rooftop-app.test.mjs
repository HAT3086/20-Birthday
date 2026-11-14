import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import * as rooftop from '../dist/rooftop-engine.mjs';
import * as arcade from '../dist/progress.mjs';
import * as art from '../dist/art.mjs';
import * as scene from '../dist/rooftop-art.mjs';
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
  const context = vm.createContext({ ...rooftop, ...arcade, ...art, ...scene, ...costumes, ...breeds, document, window,
    ArcadeAudio: class { async unlock() {} effect() {} updateMusic() {} },
    matchMedia: () => ({ matches: true }), performance: { now: () => 1000 }, requestAnimationFrame: () => {}, setTimeout: () => 1, clearTimeout: () => {}, console,
  });
  vm.runInContext(readFileSync(new URL('../dist/rooftop-app.mjs', import.meta.url), 'utf8').replace(/^import .*?;\r?\n/gm, ''), context);
  const run = expression => vm.runInContext(expression, context);
  const collect = id => run(`game.player.x=ROOF_STARS[${id}].x;game.player.y=ROOF_STARS[${id}].y;game.player.vy=0;game.player.grounded=false;tick(1/120);`);
  const click = id => node(id).events.get('click')();
  return { node, storage, document, window, documentEvents, windowEvents, run, collect, click };
}

test('collecting three unique stars saves thirty coins; the finish flag completes the run',async()=>{
  const app=fixture();await app.click('play-button');app.collect(0);app.collect(1);app.collect(2);
  let saved=arcade.loadArcade(app.storage);assert.equal(saved.games.platformer.stars,3);assert.equal(saved.wallet.coins,30);assert.equal(saved.games.platformer.completed,false);
  app.run('game.player.x=ROOF.finish;game.player.y=375-ROOF.catHeight;game.player.vy=0;tick(1/120);');
  saved=arcade.loadArcade(app.storage);assert.equal(saved.games.platformer.completed,true);assert.equal(saved.games.platformer.best,100);
  assert.equal(app.run('game.status'),'won');assert.match(app.node('result-rewards').innerHTML,/\+30 coins/);assert.equal(app.node('course-count').textContent,'100');
});

test('stars save by identity when collected out of order and cannot pay again on retries or reloads',async()=>{
  const app=fixture();await app.click('play-button');app.collect(2);
  assert.deepEqual(arcade.loadArcade(app.storage).games.platformer.starIds,[2]);assert.equal(app.node('wallet-count').textContent,10);
  await app.run('start()');assert.equal(app.run('game.starIds.includes(2)'),true);app.collect(2);assert.equal(app.run('runStars'),0);
  app.collect(0);assert.equal(app.node('wallet-count').textContent,20);
  const reload=fixture(arcade.loadArcade(app.storage));assert.equal(reload.node('star-count').textContent,2);assert.equal(reload.run('game.starIds.includes(2)'),true);
});

test('fully collected replays win without respawning stars or awarding coins',async()=>{
  const app=fixture({games:{platformer:{starIds:[0,1,2],completed:true,best:100}}});await app.click('play-button');
  for(const id of [0,1,2])app.collect(id);
  app.run('game.player.x=ROOF.finish;game.player.y=375-ROOF.catHeight;game.player.vy=0;tick(1/120);');
  assert.equal(app.run('game.status'),'won');assert.match(app.node('result-rewards').innerHTML,/All rewards collected/);assert.equal(arcade.loadArcade(app.storage).wallet.coins,30);
});

test('held movement keys, release, jumping, and pause controls work without sticky movement',async()=>{
  const app=fixture();await app.click('play-button');
  const key=(name,key,repeat=false)=>app.documentEvents.get(name)({key,repeat,preventDefault(){}});
  key('keydown','ArrowRight');key('keydown','d');app.run('tick(1/120)');assert.ok(app.run('game.player.vx')>0);
  key('keyup','ArrowRight');assert.equal(app.run('game.input.right'),true);key('keyup','d');assert.equal(app.run('game.input.right'),false);
  key('keydown',' ');app.run('tick(1/120)');assert.ok(app.run('game.player.vy')<0);
  key('keyup',' ');assert.equal(app.run('game.player.vy'),-260);
  key('keydown','p');assert.equal(app.run('game.status'),'paused');assert.equal(app.run('heldKeys.size'),0);
  await key('keydown','Escape');await Promise.resolve();assert.equal(app.run('game.status'),'playing');
});

test('falls keep stars, update the fall counter, and respawn safely',async()=>{
  const app=fixture();await app.click('play-button');app.collect(0);app.run('game.player.y=600;tick(1/120);');
  assert.equal(app.node('fall-count').textContent,'1');assert.equal(arcade.loadArcade(app.storage).wallet.coins,10);
  assert.equal(app.run('game.hearts'),2);assert.equal(app.node('heart-count').textContent,'♥♥♡');
  app.run('for(let i=0;i<90;i++)tick(1/120);');assert.equal(app.run('game.player.x'),app.run('ROOF_CHECKPOINTS[game.checkpoint].x'));assert.equal(app.node('star-count').textContent,1);
});

test('X spends one energy on a laser, does not repeat while held, and never spends when paused',async()=>{
  const app=fixture();await app.click('play-button');const press=(repeat=false)=>app.documentEvents.get('keydown')({key:'x',repeat,preventDefault(){}});
  press();assert.equal(app.run('game.lasers.length'),0);assert.match(app.node('board-toast').textContent,/Need energy/);
  app.run('game.energy=3;');press();assert.equal(app.run('game.energy'),2);assert.equal(app.node('energy-count').textContent,'2');
  press(true);assert.equal(app.run('game.energy'),2);app.click('pause-button');press();assert.equal(app.run('game.energy'),2);
});

test('a box updates energy in the HUD and a heart box restores one heart without awarding coins',async()=>{
  const energy=fixture();await energy.click('play-button');energy.run('game.random=()=>.25;game.player.x=ROOF_BOXES[0].x+2;jumpRooftop(game);for(let i=0;i<100;i++)tick(1/120);');
  assert.equal(energy.node('energy-count').textContent,'3');assert.equal(energy.node('wallet-count').textContent,0);
  const heart=fixture();await heart.click('play-button');heart.run('game.hearts=2;game.random=()=>.75;game.player.x=ROOF_BOXES[0].x+2;jumpRooftop(game);for(let i=0;i<100;i++)tick(1/120);');
  assert.equal(heart.node('heart-count').textContent,'♥♥♥');assert.equal(heart.run('game.energy'),0);assert.equal(heart.node('wallet-count').textContent,0);
});

test('three damaging falls end the run, preserve earned stars, and retry resets combat resources',async()=>{
  const app=fixture();await app.click('play-button');app.collect(1);
  app.run('game.energy=3;game.boxes[0].used=true;game.enemies[0].cleared=true;');
  for(let i=0;i<3;i++){app.run('game.player.y=600;tick(1/120);');if(i<2)app.run('for(let f=0;f<90;f++)tick(1/120);');}
  assert.equal(app.run('game.status'),'lost');assert.equal(app.node('heart-count').textContent,'♡♡♡');assert.match(app.node('overlay-copy').textContent,/Out of hearts/);
  assert.equal(arcade.loadArcade(app.storage).wallet.coins,10);await app.click('play-button');
  assert.equal(app.run('game.hearts'),3);assert.equal(app.run('game.energy'),0);assert.equal(app.run('game.boxes[0].used'),false);assert.equal(app.run('game.enemies[0].cleared'),false);
  assert.equal(app.run('game.starIds.includes(1)'),true);assert.equal(app.node('wallet-count').textContent,10);
});

test('pausing freezes enemy patrols, stun time, lasers, and resource totals',async()=>{
  const app=fixture();await app.click('play-button');app.run('game.energy=3;shootRooftop(game);game.enemies[0].stunned=4;');app.click('help-button');
  const before=app.run('JSON.stringify({enemies:game.enemies,lasers:game.lasers,hearts:game.hearts,energy:game.energy})');app.run('for(let i=0;i<120;i++)tick(1/120);');
  assert.equal(app.run('JSON.stringify({enemies:game.enemies,lasers:game.lasers,hearts:game.hearts,energy:game.energy})'),before);
});

test('help, hiding, resizing, and long frames pause motion; fresh runs retain rewards',async()=>{
  const app=fixture();await app.click('play-button');app.collect(1);app.click('help-button');assert.equal(app.run('game.status'),'paused');
  app.documentEvents.get('keydown')({key:'ArrowRight',preventDefault(){}});assert.equal(app.run('game.input.right'),false);
  app.node('help-dialog').close();await app.click('play-button');app.document.hidden=true;app.documentEvents.get('visibilitychange')();assert.equal(app.run('game.status'),'paused');
  app.document.hidden=false;await app.click('play-button');app.run('frame(1400)');assert.equal(app.run('game.status'),'paused');
  await app.click('overlay-secondary');assert.equal(app.run('game.status'),'playing');assert.equal(app.node('wallet-count').textContent,10);
  app.window.innerWidth=999;app.windowEvents.get('resize')();assert.equal(app.run('game.status'),'paused');
});

test('rooftop rewards preserve other games, purchases, profile, and the equipped breed and costume',async()=>{
  const app=fixture({profile:{name:'Player'},appearance:{breed:'orange'},games:{snake:{stars:3},mining:{stars:3},flappy:{stars:3}},wallet:{spent:20},skins:{owned:['original','sailor'],equipped:'sailor'}});
  await app.click('play-button');app.collect(0);const state=arcade.loadArcade(app.storage);
  assert.equal(state.wallet.coins,80);assert.equal(state.wallet.spent,20);assert.equal(state.games.mining.stars,3);assert.equal(state.profile.name,'Player');
  assert.equal(state.appearance.breed,'orange');assert.equal(state.skins.equipped,'sailor');assert.equal(app.node('portrait-canvas').attributes.get('aria-label'),'Player wearing Little Sailor · Orange');
});

test('failed saving keeps rewards in memory, shows a warning, and cannot duplicate them',async()=>{
  const app=fixture({},false);await app.click('play-button');app.collect(1);assert.equal(app.node('save-status').hidden,false);
  await app.run('start()');app.collect(1);assert.equal(app.node('wallet-count').textContent,10);assert.equal(app.run('runStars'),0);
});

test('Wardrobe changes refresh on return, and the results link returns to the arcade',async()=>{
  const app=fixture({games:{snake:{stars:3}}});changeCostume(app.storage,'gardener',true);changeBreed(app.storage,'british');app.windowEvents.get('pageshow')();
  assert.equal(app.node('portrait-canvas').attributes.get('aria-label'),'Mochi wearing Garden Paws · British Shorthair');await app.click('play-button');
  app.run('game.player.x=ROOF.finish;game.player.y=375-ROOF.catHeight;tick(1/120);');app.click('overlay-secondary');assert.equal(app.window.location.href,'./');
});



test('the cat shares the saved player name and refreshes after a profile rename without changing costumes',()=>{
  const app=fixture({profile:{name:'Nova'},skins:{owned:['sailor'],equipped:'sailor'}});
  assert.equal(app.node('cat-name').textContent,'Nova');assert.match(app.node('portrait-canvas').attributes.get('aria-label'),/^Nova wearing Little Sailor/);
  const saved=arcade.loadArcade(app.storage);saved.profile.name='Luna';arcade.saveArcade(app.storage,saved,{profile:true});app.windowEvents.get('pageshow')();
  assert.equal(app.node('cat-name').textContent,'Luna');assert.match(app.node('portrait-canvas').attributes.get('aria-label'),/^Luna wearing Little Sailor/);assert.equal(arcade.loadArcade(app.storage).skins.equipped,'sailor');
});
