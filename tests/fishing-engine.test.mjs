import test from 'node:test';
import assert from 'node:assert/strict';
import { LAKE, FISH, ORBS, createFishing, makeCatch, castFishing, stepFishing, hookPosition, awardFishingProgress } from '../dist/fishing-engine.mjs';

const seeded = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const play = (seed = 42) => { const game = createFishing({ random: seeded(seed) }); game.status = 'playing'; return game; };
function deliver(game, kind, type) {
  game.hook.phase = 'reel'; game.hook.length = LAKE.rest + .1;
  game.hook.payload = makeCatch(game, kind, { type });
  return stepFishing(game, 1 / 120);
}
function advance(game, seconds) { for (let i = 0; i < Math.ceil(seconds * 120); i++) stepFishing(game, 1 / 120); }

test('the lake starts with three fish types, equally represented orbs, and more fish than orbs', () => {
  const game = createFishing();
  assert.equal(game.status, 'ready'); assert.equal(game.entities.filter(i => i.kind === 'fish').length, 9);
  assert.deepEqual(game.entities.filter(i => i.kind === 'orb').map(i => i.type), ORBS);
  assert.ok(FISH.small.width < FISH.medium.width && FISH.medium.width < FISH.big.width);
  assert.equal(LAKE.orbSize, FISH.medium.width);
  assert.equal(castFishing(game), false);
});

test('orb respawns use three equal probability intervals', () => {
  for (const [sample, type] of [[.05, 'speed'], [.32, 'speed'], [.34, 'double'], [.65, 'double'], [.67, 'freeze'], [.99, 'freeze']]) {
    const game = createFishing({ random: () => sample });
    assert.equal(makeCatch(game, 'orb').type, type);
  }
});

test('casting locks the angle and catches the first item along the hook path only once', () => {
  const game = play(); game.hook.angle = 0;
  const close = makeCatch(game, 'fish', { type: 'small', x: LAKE.pivotX, y: 215 });
  const far = makeCatch(game, 'fish', { type: 'big', x: LAKE.pivotX, y: 330 }); close.speed = far.speed = 0;
  game.entities = [far, close]; castFishing(game); assert.equal(castFishing(game), false);
  let catches = 0, points = 0;
  for (let i = 0; i < 500 && game.hook.phase !== 'aim'; i++) { const result = stepFishing(game); if (result.caught) catches++; points += result.points; }
  assert.equal(catches, 1); assert.equal(points, 1); assert.equal(game.score, 1);
  assert.equal(game.entities.includes(far), true); assert.equal(game.hook.angle, 0);
});

test('an empty cast reels back from the lake boundary without awarding points', () => {
  const game = play(); game.entities = []; castFishing(game);
  for (let i = 0; i < 900 && game.hook.phase !== 'aim'; i++) stepFishing(game);
  assert.equal(game.hook.phase, 'aim'); assert.equal(game.score, 0); assert.equal(game.hook.length, LAKE.rest);
});

test('fish score 1, 2, and 3 only after returning to the dock', () => {
  const game = play();
  for (const type of ['small', 'medium', 'big']) { const before = game.score; assert.equal(deliver(game, 'fish', type).points, FISH[type].points); assert.equal(game.score - before, FISH[type].points); }
  assert.equal(game.fishCaught, 3);
  deliver(game, 'debris', 'boot'); assert.equal(game.score, 6);
});

test('each green orb doubles one fish; charges queue without multiplying each other', () => {
  const game = play(); deliver(game, 'orb', 'double'); deliver(game, 'orb', 'double');
  assert.equal(game.boosts.double, 2);
  deliver(game, 'debris', 'boot'); deliver(game, 'orb', 'freeze'); assert.equal(game.boosts.double, 2);
  assert.equal(deliver(game, 'fish', 'big').points, 6); assert.equal(game.boosts.double, 1);
  assert.equal(deliver(game, 'fish', 'medium').points, 4); assert.equal(game.boosts.double, 0);
  assert.equal(deliver(game, 'fish', 'small').points, 1);
});

test('small fish reel in fastest, medium next, and big slowest, also with the speed boost', () => {
  const durations = boosted => ['small', 'medium', 'big'].map(type => {
    const game = play(); game.entities = [];
    game.hook.phase = 'reel'; game.hook.length = 350;
    game.hook.payload = makeCatch(game, 'fish', { type });
    game.boosts.speed = boosted ? 10 : 0;
    let frames = 0;
    while (game.hook.phase === 'reel' && frames < 1200) { stepFishing(game); frames++; }
    assert.equal(game.hook.phase, 'aim'); assert.equal(game.score, FISH[type].points);
    return frames / 120;
  });
  const normal = durations(false), boosted = durations(true);
  // The size differences should be clearly felt, even from the same depth.
  assert.ok(normal[1] > normal[0] * 1.5 && normal[2] > normal[1] * 1.3);
  assert.ok(boosted[1] > boosted[0] * 1.5 && boosted[2] > boosted[1] * 1.3);
  normal.forEach((seconds, index) => assert.ok(Math.abs(boosted[index] * 2 - seconds) <= 1 / 120));
});

test('the yellow orb gives ten seconds of twice-as-fast reeling and refreshes its duration', () => {
  const game = play(); deliver(game, 'orb', 'speed'); assert.equal(game.boosts.speed, 10);
  game.hook.phase = 'reel'; game.hook.length = 350;
  const before = game.hook.length; stepFishing(game, 1 / 30);
  assert.ok(Math.abs(before - game.hook.length - LAKE.reelSpeed * 2 / 30) < 1e-8);
  deliver(game, 'orb', 'speed'); assert.equal(game.boosts.speed, 10);
  advance(game, 10.1); assert.equal(game.boosts.speed, 0);
});

test('freeze stops fish and orbs for five seconds but the hook can still catch them', () => {
  const game = play(); deliver(game, 'orb', 'freeze');
  const fish = makeCatch(game, 'fish', { type: 'medium', x: LAKE.pivotX, y: 260 });
  const orb = makeCatch(game, 'orb', { type: 'speed', x: 600, y: 300 }); game.entities = [fish, orb];
  const snapshot = game.entities.map(i => [i.x, i.y, i.phase]); advance(game, 1);
  assert.deepEqual(game.entities.map(i => [i.x, i.y, i.phase]), snapshot);
  game.hook.angle = 0; castFishing(game); let caught = null;
  for (let i = 0; i < 160 && !caught; i++) caught = stepFishing(game).caught;
  assert.equal(caught, fish);
  const x = orb.x; advance(game, 5); assert.notEqual(orb.x, x); assert.equal(game.boosts.freeze, 0);
});

test('pause leaves every boost timer, entity, hook, and score unchanged', () => {
  const game = play(); deliver(game, 'orb', 'speed'); deliver(game, 'orb', 'freeze'); deliver(game, 'orb', 'double'); castFishing(game);
  game.status = 'paused'; const before = JSON.stringify(game); advance(game, 6); assert.equal(JSON.stringify(game), before);
});

test('a doubled big fish can cross milestones and win at thirty, including on replay', () => {
  const game = play(); game.score = 28; deliver(game, 'orb', 'double');
  const result = deliver(game, 'fish', 'big'); assert.equal(result.points, 6); assert.equal(result.won, true); assert.equal(game.score, 30);
  assert.equal(game.status, 'won'); const before = game.elapsed; stepFishing(game); assert.equal(game.elapsed, before);
  const reward = awardFishingProgress({}, game.score); assert.equal(reward.starsEarned, 3); assert.equal(reward.coinsEarned, 30);
  assert.equal(awardFishingProgress(reward.progress, 30).coinsEarned, 0);
  assert.equal(awardFishingProgress({}, 6).starsEarned, 1); assert.equal(awardFishingProgress({stars:1}, 18).starsEarned, 1);
});

test('saved rewards are monotonic and malformed scores cannot inflate the thirty coin limit', () => {
  const first = awardFishingProgress({ stars: 2, best: 18 }, 4); assert.equal(first.progress.best, 18); assert.equal(first.coinsEarned, 0);
  assert.deepEqual(awardFishingProgress(null, Infinity).progress, { stars: 0, best: 0, completed: false });
  assert.equal(awardFishingProgress({}, 999).coinsEarned, 30);
});

test('complete real casts can reach victory across seeded lakes without moving the hook or fish artificially', () => {
  for (const seed of [1,42,987]) {
    const game = play(seed); let casts = 0;
    for (let step = 0; step < 120 * 360 && game.status === 'playing'; step++) {
      if (game.hook.phase === 'aim') {
        const tip = hookPosition(game.hook), dx = Math.sin(game.hook.angle), dy = Math.cos(game.hook.angle);
        const target = game.entities.find(i => {
          if (i.kind === 'debris') return false;
          const travel = (i.y - LAKE.pivotY) / dy;
          const predictedX = i.x + (game.boosts.freeze > travel / LAKE.castSpeed ? 0 : i.direction * i.speed * (travel - LAKE.rest) / LAKE.castSpeed);
          return travel > LAKE.rest && Math.abs(LAKE.pivotX + dx * travel - predictedX) < i.width / 3 && tip.y < i.y;
        });
        if (target) { castFishing(game); casts++; }
      }
      stepFishing(game);
    }
    assert.equal(game.status, 'won', `seed ${seed}: ${game.score} points from ${casts} casts`); assert.equal(game.score,30);
  }
});
