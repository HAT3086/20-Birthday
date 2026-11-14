import test from 'node:test';
import assert from 'node:assert/strict';
import { SIZE, GOAL, MILESTONES, createGame, queueTurn, step, stepDuration, spawnFish, awardProgress, normalizeProgress, loadProgress, saveProgress, STORAGE_KEY } from '../dist/engine.mjs';

function playing() { const game = createGame({ random: () => .5 }); game.status = 'playing'; return game; }
function memoryStorage() { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; }

test('the garden is 20 by 20, with star milestones at 5, 15, 30 and victory at 30', () => {
  assert.equal(SIZE, 20); assert.equal(GOAL, 30); assert.deepEqual(MILESTONES, [5, 15, 30]);
});
test('a fresh run starts with a short cat parade and an unoccupied fish', () => {
  const game = createGame();
  assert.equal(game.score, 0); assert.equal(game.status, 'ready'); assert.equal(game.body.length, 4);
  assert.ok(!game.body.some(p => p.x === game.fish.x && p.y === game.fish.y));
});
test('moving without a fish preserves parade length', () => {
  const game = playing(); game.fish = { x: 0, y: 0 };
  step(game); assert.equal(game.body.length, 4); assert.deepEqual(game.body[0], { x: 8, y: 10 }); assert.equal(game.score, 0);
});
test('eating a fish adds one cat and one fish to the run score', () => {
  const game = playing(); game.fish = { x: 8, y: 10 };
  assert.equal(step(game).ate, true); assert.equal(game.body.length, 5); assert.equal(game.score, 1);
  assert.ok(!game.body.some(p => p.x === game.fish.x && p.y === game.fish.y));
});
test('all four walls stop the parade without wrapping', () => {
  for (const [head, direction] of [[{ x: 0, y: 5 }, 'left'], [{ x: 19, y: 5 }, 'right'], [{ x: 5, y: 0 }, 'up'], [{ x: 5, y: 19 }, 'down']]) {
    const game = playing(); game.body = [head]; game.direction = direction; game.fish = { x: 10, y: 10 };
    assert.equal(step(game).lost, true); assert.equal(game.reason, 'wall'); assert.deepEqual(game.body[0], head);
  }
});
test('touching the parade ends the run', () => {
  const game = playing(); game.body = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }, { x: 7, y: 5 }];
  assert.equal(step(game).lost, true); assert.equal(game.reason, 'parade');
});
test('moving onto the departing tail is legal when not growing', () => {
  const game = playing(); game.body = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }]; game.fish = { x: 1, y: 1 };
  assert.equal(step(game).lost, false); assert.equal(game.status, 'playing');
});
test('instant reversals are rejected and quick corner inputs are buffered safely', () => {
  const game = playing(); assert.equal(queueTurn(game, 'left'), false);
  assert.equal(queueTurn(game, 'up'), true); assert.equal(queueTurn(game, 'down'), false);
  assert.equal(queueTurn(game, 'left'), true); assert.equal(queueTurn(game, 'down'), false);
  step(game); assert.equal(game.direction, 'up'); step(game); assert.equal(game.direction, 'left');
});
test('pausing stops both movement and queued input', () => {
  const game = playing(); game.status = 'paused'; const before = structuredClone(game.body);
  assert.equal(queueTurn(game, 'up'), false); step(game); assert.deepEqual(game.body, before);
});
test('the 30th fish ends the run immediately and leaves no fish to collect', () => {
  const game = playing(); game.score = 29; game.fish = { x: 8, y: 10 };
  const result = step(game); assert.equal(result.won, true); assert.equal(game.status, 'won'); assert.equal(game.score, 30); assert.equal(game.fish, null);
  const before = structuredClone(game.body); step(game); assert.deepEqual(game.body, before); assert.equal(game.score, 30);
});
test('fish spawning remains valid even with a nearly full board', () => {
  const body = []; for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (x !== 19 || y !== 19) body.push({ x, y });
  assert.deepEqual(spawnFish(body, () => .999), { x: 19, y: 19 }); body.push({ x: 19, y: 19 }); assert.equal(spawnFish(body), null);
});
test('no stars or coins are awarded below a milestone', () => {
  for (const score of [0, 1, 4]) { const earned = awardProgress({}, score); assert.equal(earned.starsEarned, 0); assert.equal(earned.coinsEarned, 0); }
});
test('successive star stages take five, ten, and fifteen more fish', () => {
  for (const [score, stars] of [[4, 0], [5, 1], [14, 1], [15, 2], [29, 2], [30, 3]]) {
    const result = awardProgress({}, score);
    assert.equal(result.progress.stars, stars, `stars at ${score} fish`);
    assert.equal(result.progress.coins, stars * 10);
  }
});
test('existing saved stars and coins survive the shorter finish line', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, stars: 2, coins: 20, best: 35, sound: false }));
  const progress = loadProgress(storage);
  assert.equal(progress.stars, 2); assert.equal(progress.coins, 20); assert.equal(progress.best, 30);
  assert.equal(awardProgress(progress, 15).coinsEarned, 0);
  assert.equal(awardProgress(progress, 30).coinsEarned, 10);
});
test('each newly reached milestone awards exactly one star and ten coins', () => {
  let progress = normalizeProgress();
  for (const score of MILESTONES) {
    const result = awardProgress(progress, score);
    assert.equal(result.starsEarned, 1); assert.equal(result.coinsEarned, 10); progress = result.progress;
  }
  assert.equal(progress.stars, 3); assert.equal(progress.coins, 30); assert.equal(progress.best, 30);
});
test('reaching all milestones in a first run pays a total of thirty coins', () => {
  let progress = normalizeProgress(); let coins = 0;
  for (let score = 1; score <= GOAL; score++) { const result = awardProgress(progress, score); coins += result.coinsEarned; progress = result.progress; }
  assert.equal(coins, 30); assert.equal(progress.stars, 3);
});
test('retries only pay for previously uncollected stars', () => {
  const first = awardProgress({}, 5); assert.equal(first.coinsEarned, 10);
  const repeat = awardProgress(first.progress, 5); assert.equal(repeat.coinsEarned, 0);
  const second = awardProgress(repeat.progress, 15); assert.equal(second.coinsEarned, 10); assert.equal(second.progress.coins, 20);
  const last = awardProgress(second.progress, 30); assert.equal(last.coinsEarned, 10); assert.equal(last.progress.coins, 30);
});
test('a fully rewarded replay earns zero stars and zero coins through victory', () => {
  let progress = awardProgress({}, 30).progress;
  const game = playing(); game.score = 29; game.fish = { x: 8, y: 10 };
  assert.equal(step(game).won, true);
  for (let score = 0; score <= GOAL; score++) { const result = awardProgress(progress, score); assert.equal(result.coinsEarned, 0); assert.equal(result.starsEarned, 0); progress = result.progress; }
  assert.equal(progress.coins, 30);
});
test('earned rewards survive losing, a fresh run, and reloading storage', () => {
  const storage = memoryStorage(); const earned = awardProgress({}, 5).progress;
  assert.equal(saveProgress(storage, earned), true);
  const game = playing(); game.body = [{ x: 19, y: 10 }]; assert.equal(step(game).lost, true);
  const reloaded = loadProgress(storage); assert.equal(reloaded.stars, 1); assert.equal(reloaded.coins, 10); assert.equal(reloaded.best, 5);
  assert.equal(createGame().score, 0); assert.equal(awardProgress(reloaded, 5).coinsEarned, 0);
});
test('malformed or unavailable browser storage does not stop play', () => {
  assert.deepEqual(loadProgress(null), normalizeProgress());
  assert.deepEqual(loadProgress({ getItem: () => '{broken' }), normalizeProgress());
  assert.deepEqual(loadProgress({ getItem: () => 'null' }), normalizeProgress());
  assert.equal(saveProgress({ setItem: () => { throw new Error('full'); } }, {}), false);
});
test('saved progress normalizes invalid data and cannot exceed the reward cap', () => {
  const saved = normalizeProgress({ stars: 99, coins: 99999, best: 999, music: true, sound: false });
  assert.equal(saved.coins, 30); assert.equal(saved.stars, 3); assert.equal(saved.best, 30); assert.equal(saved.music, true); assert.equal(saved.sound, false);
  assert.equal(normalizeProgress({ stars: -2, best: -1 }).coins, 0);
  assert.equal(normalizeProgress({ stars: '3' }).stars, 0);
  const storage = memoryStorage(); storage.setItem(STORAGE_KEY, JSON.stringify(saved)); assert.deepEqual(loadProgress(storage), saved);
});
test('pace increases gently and has a comfortable cap', () => {
  assert.equal(stepDuration(0), 190); assert.ok(stepDuration(30) < stepDuration(5)); assert.equal(stepDuration(200), 112);
});

test('a complete real game can reach every star and 30-fish victory with a growing parade', () => {
  const game = playing(); let progress = normalizeProgress(); let totalCoins = 0;
  // Follow a serpentine loop; present each next fish on an empty square ahead.
  const path = [];
  for (let x = 8; x < 20; x++) path.push({ x, y: 10 });
  path.push({ x: 19, y: 9 });
  for (let x = 18; x >= 0; x--) path.push({ x, y: 9 });
  path.push({ x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 });
  for (const fish of path.slice(0, GOAL)) {
    const head = game.body[0]; const direction = fish.x > head.x ? 'right' : fish.x < head.x ? 'left' : fish.y > head.y ? 'down' : 'up';
    queueTurn(game, direction); game.fish = fish; const result = step(game); assert.equal(result.lost, false);
    const earned = awardProgress(progress, game.score); progress = earned.progress; totalCoins += earned.coinsEarned;
  }
  assert.equal(game.status, 'won'); assert.equal(game.score, 30); assert.equal(game.body.length, 4 + GOAL); assert.equal(progress.stars, 3); assert.equal(totalCoins, 30);
});
