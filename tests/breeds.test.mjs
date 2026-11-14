import test from 'node:test';
import assert from 'node:assert/strict';
import { BREEDS } from '../dist/breeds.mjs';
import { ARCADE_KEY, LEGACY_SNAKE_KEY, normalizeArcade, loadArcade, saveArcade } from '../dist/progress.mjs';
import { changeBreed, changeCostume } from '../dist/wardrobe.mjs';
import { awardProgress, loadProgress, saveProgress } from '../dist/engine.mjs';

const memory = state => {
  const values = new Map([[ARCADE_KEY, JSON.stringify(normalizeArcade(state))]]);
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('all four additional breeds and the original are freely selectable at zero coins', () => {
  const storage = memory({ profile: { name: 'Player' } });
  assert.equal(BREEDS.length, 5);
  for (const breed of [...BREEDS.slice(1), BREEDS[0]]) {
    assert.equal(changeBreed(storage, breed.id).ok, true);
    const state = loadArcade(storage);
    assert.equal(state.appearance.breed, breed.id);
    assert.deepEqual(state.wallet, { earned: 0, spent: 0, coins: 0 });
    assert.deepEqual(state.skins, { owned: ['original'], equipped: 'original' });
    assert.equal(state.profile.name, 'Player');
  }
});

test('changing breeds preserves paid outfits, spending, stars, and all purchase concepts', () => {
  const storage = memory({ games: { snake: { stars: 3 } } });
  changeCostume(storage, 'sailor', true);
  const before = loadArcade(storage);
  for (const breed of BREEDS) {
    changeBreed(storage, breed.id);
    const state = loadArcade(storage);
    assert.deepEqual(state.skins, before.skins); assert.deepEqual(state.wallet, before.wallet);
    assert.deepEqual(state.games, before.games);
  }
  changeBreed(storage, 'siamese'); changeCostume(storage, 'gardener', true);
  assert.equal(loadArcade(storage).appearance.breed, 'siamese');
  assert.equal(loadArcade(storage).wallet.spent, 30);
});

test('a breed persists through stale page saves, earned rewards, and legacy migration', () => {
  const storage = memory(); const stale = loadArcade(storage);
  changeBreed(storage, 'british'); saveArcade(storage, stale);
  assert.equal(loadArcade(storage).appearance.breed, 'british');
  saveProgress(storage, awardProgress(loadProgress(storage), 5).progress);
  storage.setItem(LEGACY_SNAKE_KEY, JSON.stringify({ stars: 2, best: 15 }));
  assert.equal(loadArcade(storage).appearance.breed, 'british');
  assert.equal(loadArcade(storage).wallet.coins, 20);
});

test('older or malformed saves default to original and failed writes keep the current breed', () => {
  assert.equal(normalizeArcade({}).appearance.breed, 'original');
  assert.equal(normalizeArcade({ appearance: { breed: '<script>' } }).appearance.breed, 'original');
  const storage = memory({ appearance: { breed: 'orange' } });
  const before = storage.getItem(ARCADE_KEY);
  assert.equal(changeBreed(storage, 'missing').reason, 'unknown');
  storage.setItem = () => { throw new Error('full'); };
  assert.equal(changeBreed(storage, 'ragdoll').reason, 'saving');
  assert.equal(storage.getItem(ARCADE_KEY), before);
});

test('a saved Bengal selection becomes Orange while keeping coins and the owned costume', () => {
  const storage = memory({ games: { snake: { stars: 3 } } });
  changeCostume(storage, 'sailor', true);
  const raw = loadArcade(storage); raw.appearance.breed = 'bengal';
  storage.setItem(ARCADE_KEY, JSON.stringify(raw));
  const state = loadArcade(storage);
  assert.equal(state.appearance.breed, 'orange');
  assert.equal(state.skins.equipped, 'sailor'); assert.equal(state.wallet.coins, 10);
});
