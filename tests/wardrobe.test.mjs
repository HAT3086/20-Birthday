import test from 'node:test';
import assert from 'node:assert/strict';
import { COSTUMES } from '../dist/costumes.mjs';
import { changeCostume } from '../dist/wardrobe.mjs';
import { ARCADE_KEY, GAMES, loadArcade, normalizeArcade, saveArcade } from '../dist/progress.mjs';
import { awardProgress, loadProgress, saveProgress } from '../dist/engine.mjs';

const memory = state => {
  const values = new Map([[ARCADE_KEY, JSON.stringify(normalizeArcade(state))]]);
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
const allStars = { games: Object.fromEntries(GAMES.map(({ id }) => [id, { stars: 3 }])) };

test('the six paid outfits cost exactly the 180 coins earned from all game stars', () => {
  assert.equal(COSTUMES.filter(item => item.price > 0).length, 6);
  assert.equal(COSTUMES.reduce((sum, item) => sum + item.price, 0), loadArcade(memory(allStars)).wallet.coins);
  const storage = memory(allStars);
  for (const costume of COSTUMES) assert.equal(changeCostume(storage, costume.id, true).ok, true);
  const state = loadArcade(storage);
  assert.equal(state.wallet.coins, 0); assert.equal(state.wallet.spent, 180);
  assert.equal(state.skins.owned.length, 7); assert.equal(state.skins.equipped, 'birthday');
});

test('a purchase deducts the price once, owns and equips the outfit, and survives reload', () => {
  const storage = memory({ profile: { name: 'Player' }, games: { snake: { stars: 3 } } });
  assert.equal(changeCostume(storage, 'sailor', true).reason, 'purchased');
  const saved = loadArcade(storage);
  assert.equal(saved.wallet.coins, 10); assert.equal(saved.wallet.spent, 20);
  assert.ok(saved.skins.owned.includes('sailor')); assert.equal(saved.skins.equipped, 'sailor');
  assert.equal(saved.profile.name, 'Player'); assert.equal(saved.games.snake.stars, 3);
  assert.equal(changeCostume(storage, 'sailor', true).reason, 'equipped');
  assert.deepEqual(loadArcade(storage), saved);
});

test('previewing is free and unowned or unaffordable outfits cannot be equipped', () => {
  const storage = memory({ games: { snake: { stars: 1 } } });
  const before = storage.getItem(ARCADE_KEY);
  assert.equal(changeCostume(storage, 'wizard').reason, 'unowned');
  assert.equal(changeCostume(storage, 'birthday', true).reason, 'coins');
  assert.equal(changeCostume(storage, 'invalid', true).reason, 'unknown');
  assert.equal(storage.getItem(ARCADE_KEY), before);
});

test('owned outfits and the free original can be equipped repeatedly without spending', () => {
  const storage = memory({ games: { snake: { stars: 3 } } });
  changeCostume(storage, 'gardener', true);
  changeCostume(storage, 'original'); changeCostume(storage, 'gardener');
  assert.equal(loadArcade(storage).wallet.spent, 10); assert.equal(loadArcade(storage).skins.equipped, 'gardener');
});

test('consecutive shop actions read the latest balance and cannot overspend a stale preview', () => {
  const storage = memory({ games: { snake: { stars: 3 } } });
  const stale = loadArcade(storage);
  assert.equal(changeCostume(storage, 'sailor', true).ok, true);
  assert.equal(changeCostume(storage, 'bee', true).reason, 'coins');
  assert.equal(changeCostume(storage, 'gardener', true).ok, true);
  saveArcade(storage, stale);
  const state = loadArcade(storage);
  assert.equal(state.wallet.coins, 0); assert.equal(state.wallet.spent, 30);
  assert.equal(state.skins.equipped, 'gardener'); assert.ok(state.skins.owned.includes('sailor'));
});

test('a failed purchase write leaves coins, ownership, and equipment unchanged', () => {
  const storage = memory({ games: { snake: { stars: 3 } } });
  const before = loadArcade(storage);
  storage.setItem = () => { throw new Error('storage full'); };
  const result = changeCostume(storage, 'sailor', true);
  assert.equal(result.reason, 'saving'); assert.equal(result.ok, false);
  assert.deepEqual(result.state, before); assert.deepEqual(loadArcade(storage), before);
  assert.equal(changeCostume(null, 'gardener', true).ok, false);
});

test('earning more stars after spending keeps the outfit and only adds new reward coins', () => {
  const storage = memory({ games: { snake: { stars: 1 } } });
  changeCostume(storage, 'gardener', true);
  saveProgress(storage, awardProgress(loadProgress(storage), 15).progress);
  let state = loadArcade(storage);
  assert.equal(state.wallet.coins, 10); assert.equal(state.wallet.spent, 10); assert.equal(state.skins.equipped, 'gardener');
  saveProgress(storage, awardProgress(loadProgress(storage), 15).progress);
  state = loadArcade(storage); assert.equal(state.wallet.coins, 10);
});
