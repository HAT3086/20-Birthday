import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import * as progress from '../dist/progress.mjs';
import * as costumes from '../dist/costumes.mjs';
import * as breeds from '../dist/breeds.mjs';
import * as art from '../dist/art.mjs';
import { changeCostume, changeBreed } from '../dist/wardrobe.mjs';

function fixture(saved = {}, failStorage = false) {
  const values = new Map([[progress.ARCADE_KEY, JSON.stringify(progress.normalizeArcade(saved))]]);
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => { if (failStorage) throw new Error('full'); values.set(key, value); } };
  const context2d = new Proxy({}, { get: (target, key) => target[key] ?? (() => {}), set: (target, key, value) => { target[key] = value; return true; } });
  const nodes = new Map(); let serial = 0;
  const node = id => {
    if (nodes.has(id)) return nodes.get(id);
    const classes = new Set();
    const item = { textContent: '', innerHTML: '', hidden: false, disabled: false, style: { setProperty: () => {} }, children: [], events: new Map(), attributes: new Map(),
      setAttribute: (key, value) => item.attributes.set(key, value), addEventListener: (key, fn) => item.events.set(key, fn),
      getContext: () => context2d, querySelector: selector => node(`${id}:${selector}`), append: child => item.children.push(child),
      classList: { toggle: (key, on) => on ? classes.add(key) : classes.delete(key), contains: key => classes.has(key) },
    };
    nodes.set(id, item); return item;
  };
  const events = new Map();
  const context = vm.createContext({ ...progress, ...costumes, ...breeds, ...art, changeCostume, changeBreed,
    document: { getElementById: node, createElement: () => node(`created-${serial++}`) },
    window: { localStorage: storage, navigator: { locks: { request: async (_key, callback) => callback() } }, addEventListener: (key, callback) => events.set(key, callback) },
  });
  vm.runInContext(readFileSync(new URL('../dist/shop.mjs', import.meta.url), 'utf8').replace(/^import .*?;\r?\n/gm, ''), context);
  const preview = id => node('costume-grid').children[costumes.COSTUMES.filter(item => item.price).findIndex(item => item.id === id)].events.get('click')();
  return { node, preview, storage, events, click: id => node(id).events.get('click')() };
}

test('the shop renders all six outfits and previews a locked outfit without spending', () => {
  const app = fixture(); assert.equal(app.node('costume-grid').children.length, 6);
  assert.equal(app.node('owned-count').textContent, 1);
  const before = app.storage.getItem(progress.ARCADE_KEY);
  app.preview('wizard');
  assert.equal(app.node('preview-name').textContent, 'Moon Wizard');
  assert.equal(app.node('preview-cat').attributes.get('aria-label'), 'Mochi wearing Moon Wizard');
  assert.equal(app.node('costume-action').disabled, true);
  assert.match(app.node('costume-hint').textContent, /30 more coins/);
  assert.equal(app.storage.getItem(progress.ARCADE_KEY), before);
});

test('buying through the shop updates coins, equipped state, badges, and a later reload', async () => {
  const app = fixture({ games: { snake: { stars: 3 } } });
  app.preview('sailor'); assert.equal(app.node('costume-action').disabled, false);
  await app.click('costume-action');
  assert.equal(app.node('shop-coins').textContent, 10); assert.equal(app.node('owned-count').textContent, 2);
  assert.equal(app.node('costume-action').textContent, 'Equipped ✓');
  assert.match(app.node('shop-message').textContent, /Little Sailor is yours/);
  assert.equal(app.node('costume-grid').children[1].querySelector('.costume-badge').textContent, 'Equipped ✓');
  const reload = fixture(progress.loadArcade(app.storage));
  assert.equal(reload.node('preview-name').textContent, 'Little Sailor'); assert.equal(reload.node('shop-coins').textContent, 10);
  await app.click('costume-action'); assert.equal(app.node('shop-coins').textContent, 10);
  app.click('original-button'); await app.click('costume-action');
  assert.equal(progress.loadArcade(app.storage).skins.equipped, 'original'); assert.equal(app.node('shop-coins').textContent, 10);
});

test('returning from a game or another shop tab refreshes affordability and equipment', async () => {
  const app = fixture(); app.preview('gardener');
  progress.saveArcade(app.storage, progress.normalizeArcade({ games: { snake: { stars: 3 } } }));
  app.events.get('pageshow')(); assert.equal(app.node('costume-action').disabled, false);
  changeCostume(app.storage, 'sailor', true);
  app.events.get('storage')({ key: progress.ARCADE_KEY }); assert.equal(app.node('shop-coins').textContent, 10);
  await app.click('costume-action'); assert.equal(app.node('shop-coins').textContent, 0);
  app.preview('bee'); assert.equal(app.node('costume-action').disabled, true);
});

test('a failed shop purchase displays an error without spending or granting an outfit', async () => {
  const app = fixture({ games: { snake: { stars: 3 } } }, true);
  app.preview('gardener'); await app.click('costume-action');
  assert.equal(app.node('shop-coins').textContent, 30); assert.equal(app.node('owned-count').textContent, 1);
  assert.match(app.node('shop-message').textContent, /No coins were spent/);
  assert.equal(app.node('shop-message').classList.contains('error'), true);
});

test('the free breed selector keeps the chosen costume preview and survives reloading', async () => {
  const app = fixture(); app.preview('wizard');
  const buttons = app.node('breed-options').children;
  assert.equal(buttons.length, 5);
  await buttons[2].events.get('click')();
  assert.equal(progress.loadArcade(app.storage).appearance.breed, 'siamese');
  assert.equal(app.node('preview-name').textContent, 'Moon Wizard');
  assert.equal(app.node('preview-cat').attributes.get('aria-label'), 'Mochi wearing Moon Wizard · Siamese');
  assert.equal(app.node('shop-coins').textContent, 0); assert.equal(app.node('owned-count').textContent, 1);
  assert.equal(buttons[2].attributes.get('aria-pressed'), 'true');
  const reload = fixture(progress.loadArcade(app.storage));
  assert.equal(reload.node('breed-options').children[2].attributes.get('aria-pressed'), 'true');
});

test('a breed write failure leaves the selector on the saved breed and shows an error', async () => {
  const app = fixture({}, true);
  await app.node('breed-options').children[1].events.get('click')();
  assert.equal(app.node('breed-options').children[0].attributes.get('aria-pressed'), 'true');
  assert.match(app.node('shop-message').textContent, /breed could not be saved/);
});


test('the fitting room uses the player name while keeping costume names and prices intact',()=>{
  const app=fixture({profile:{name:'Nova'}});assert.equal(app.node('preview-description').textContent,'Nova, without a costume.');assert.equal(app.node('preview-cat').attributes.get('aria-label'),'Nova wearing Original');app.preview('astronaut');assert.equal(app.node('preview-name').textContent,'Space Mochi');assert.equal(app.node('preview-cat').attributes.get('aria-label'),'Nova wearing Space Mochi');
});
