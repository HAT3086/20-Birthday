import test from 'node:test';
import assert from 'node:assert/strict';
import { FLIGHT, FLIGHT_GOAL, FLIGHT_STARS, createFlight, flapFlight, stepFlight, touchesGate, flightDifficulty, awardFlightProgress } from '../dist/flappy-engine.mjs';

test('a flight starts ready with a clear approach and gates that leave room for the cat', () => {
  const game = createFlight({ random: () => .5 });
  assert.equal(game.status, 'ready'); assert.equal(game.score, 0);
  assert.ok(game.gates[0].x - FLIGHT.catX > 450);
  assert.ok(game.gates[1].x - game.gates[0].x > 250);
  for (const gate of game.gates) assert.ok(gate.center - gate.gap / 2 >= 56 && gate.center + gate.gap / 2 <= FLIGHT.ground - 56);
  assert.equal(flapFlight(game), false); stepFlight(game); assert.equal(game.elapsed, 0);
});

test('a tap gives a fixed upward impulse, gravity brings the cat down, and repeated taps never stack speed', () => {
  const game = createFlight(); game.status = 'playing'; flapFlight(game);
  const start = game.y; stepFlight(game); assert.ok(game.y < start);
  flapFlight(game); flapFlight(game); assert.equal(game.velocity, FLIGHT.impulse);
  for (let i = 0; i < 65; i++) stepFlight(game);
  assert.ok(game.velocity > 0);
});

test('the top, ground, and solid pillars end the run; the open gap stays clear', () => {
  for (const [y, reason] of [[FLIGHT.radius - 1, 'ceiling'], [FLIGHT.ground - FLIGHT.radius, 'ground']]) {
    const game = createFlight(); game.status = 'playing'; game.y = y;
    assert.equal(stepFlight(game).lost, true); assert.equal(game.reason, reason);
  }
  const gate = { x: FLIGHT.catX - 20, center: 250, gap: 190 };
  assert.equal(touchesGate(250, gate), false); assert.equal(touchesGate(110, gate), true); assert.equal(touchesGate(400, gate), true);
  const game = createFlight(); game.status = 'playing'; game.y = 110; game.gates[0] = { ...gate, passed: false };
  assert.equal(stepFlight(game).lost, true); assert.equal(game.reason, 'gate'); assert.equal(game.score, 0);
});

test('a gate counts once after the full hitbox clears its trailing edge', () => {
  const game = createFlight(); game.status = 'playing';
  const gate = game.gates[0]; gate.x = FLIGHT.catX - FLIGHT.pipeWidth - FLIGHT.cap - FLIGHT.radius - 1;
  assert.equal(stepFlight(game).passed, 1); assert.equal(game.score, 1);
  assert.equal(stepFlight(game).passed, 0); assert.equal(game.score, 1);
});

test('pausing freezes motion and inputs, terminal states cannot move, and slow steps are bounded', () => {
  const game = createFlight(); game.status = 'paused';
  const before = JSON.stringify(game); stepFlight(game, .1); assert.equal(flapFlight(game), false); assert.equal(JSON.stringify(game), before);
  game.status = 'playing'; stepFlight(game, 10); assert.ok(game.elapsed <= 1 / 30);
  for (const status of ['lost', 'won']) { game.status = status; const y = game.y; stepFlight(game); assert.equal(game.y, y); assert.equal(flapFlight(game), false); }
});

test('difficulty stays bounded and every generated gap remains reachable in full real flights', () => {
  assert.ok(flightDifficulty(999).speed <= 165); assert.ok(flightDifficulty(999).gap >= 170);
  for (const seed of [1, 42, 987]) {
    let value = seed;
    const game = createFlight({ random: () => { value = (Math.imul(1664525, value) + 1013904223) >>> 0; return value / 4294967296; } });
    game.status = 'playing'; flapFlight(game);
    for (let i = 0; i < 14400 && game.status === 'playing'; i++) {
      const target = game.gates.find(gate => !gate.passed);
      if (game.y > target.center + 10 && game.velocity > 0) flapFlight(game);
      stepFlight(game);
    }
    assert.equal(game.status, 'won', `seed ${seed}`); assert.equal(game.score, 30);
    stepFlight(game); assert.equal(game.score, 30);
  }
});

test('later gates make larger vertical jumps and vary their opening sizes within safe bounds', () => {
  const generated = (score, sample) => {
    const game = createFlight({ random: () => sample });
    game.status = 'playing'; game.score = score; game.lastCenter = 200;
    game.gates = [{ ...game.gates[0], x: FLIGHT.width, center: 200, passed: true }];
    stepFlight(game);
    return game.gates[1];
  };
  const earlyHigh = generated(0, 1), earlyLow = generated(0, 0);
  const lateHigh = generated(25, 1), lateLow = generated(25, 0);
  assert.ok(lateHigh.center - 200 > earlyHigh.center - 200);
  assert.equal(earlyHigh.gap, earlyLow.gap);
  assert.ok(lateHigh.gap > lateLow.gap);
  for (const gate of [earlyHigh, earlyLow, lateHigh, lateLow]) {
    assert.ok(gate.gap >= 170 && gate.gap <= 202);
    assert.ok(gate.center - gate.gap / 2 >= 56);
    assert.ok(gate.center + gate.gap / 2 <= FLIGHT.ground - 56);
  }
});

test('30 gates ends the flight immediately, independently of previously collected rewards', () => {
  const game = createFlight(); game.status = 'playing'; game.score = 29;
  game.gates[0].x = FLIGHT.catX - FLIGHT.pipeWidth - FLIGHT.cap - FLIGHT.radius - 1;
  const result = stepFlight(game); assert.equal(result.won, true); assert.equal(game.status, 'won'); assert.equal(game.score, FLIGHT_GOAL);
  assert.deepEqual(FLIGHT_STARS, [5, 15, 30]);
});

test('stars award at 5, 15, 30 once, keep the best score, and cannot be farmed on retries', () => {
  let progress = {}; let coins = 0;
  for (let score = 0; score <= 30; score++) {
    const reward = awardFlightProgress(progress, score); progress = reward.progress; coins += reward.coinsEarned;
    assert.equal(reward.starsEarned, FLIGHT_STARS.includes(score) ? 1 : 0);
  }
  assert.equal(coins, 30); assert.equal(progress.best, 30); assert.equal(progress.stars, 3);
  for (const score of [0, 5, 15, 30]) assert.equal(awardFlightProgress(progress, score).coinsEarned, 0);
  assert.equal(awardFlightProgress({ stars: 1, best: 7 }, 15).coinsEarned, 10);
  assert.equal(awardFlightProgress({ stars: 2 }, 5).progress.best, 15);
});
