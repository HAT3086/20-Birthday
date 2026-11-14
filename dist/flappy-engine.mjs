export const FLIGHT = Object.freeze({ width: 800, height: 500, ground: 466, catX: 190, radius: 15, gravity: 900, impulse: -305, maxFall: 460, pipeWidth: 70, cap: 5, spacing: 290, firstGate: 690 });
export const FLIGHT_GOAL = 30;
export const FLIGHT_STARS = Object.freeze([5, 15, 30]);
const integer = (value, max = 30) => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : 0;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function flightDifficulty(score) {
  const points = integer(score), stage = Math.floor(points / 5);
  return {
    speed: Math.min(165, 145 + stage * 4),
    gap: Math.max(180, 190 - stage * 2),
    centerSwing: Math.min(106, 58 + points * 1.8),
    gapVariation: Math.min(16, Math.max(0, points - 4) * .7),
  };
}

function nextGate(game, x, first = false) {
  const difficulty = flightDifficulty(game.score);
  const randomUnit = () => { const sample = game.random(); return Number.isFinite(sample) ? clamp(sample, 0, 1) : .5; };
  const unit = randomUnit();
  const variation = !first && difficulty.gapVariation ? (randomUnit() - .5) * 2 * difficulty.gapVariation : 0;
  const gap = clamp(difficulty.gap + variation, 170, 202);
  const center = first ? 250 : clamp(game.lastCenter + (unit - .5) * 2 * difficulty.centerSwing, gap / 2 + 56, FLIGHT.ground - gap / 2 - 56);
  game.lastCenter = center;
  return { id: game.nextId++, x, center, gap, passed: false };
}

export function createFlight({ random = Math.random } = {}) {
  const game = { status: 'ready', y: 250, velocity: 0, score: 0, elapsed: 0, distance: 0, reason: null, gates: [], random, lastCenter: 250, nextId: 0 };
  for (let i = 0; i < 3; i++) game.gates.push(nextGate(game, FLIGHT.firstGate + i * FLIGHT.spacing, i === 0));
  return game;
}

export function flapFlight(game) {
  if (game.status !== 'playing') return false;
  game.velocity = FLIGHT.impulse;
  return true;
}

function circleRect(x, y, radius, left, top, width, height) {
  if (height <= 0) return false;
  const dx = x - clamp(x, left, left + width);
  const dy = y - clamp(y, top, top + height);
  return dx * dx + dy * dy <= radius * radius;
}

export function touchesGate(y, gate) {
  const { catX: x, radius: r, pipeWidth: width, cap } = FLIGHT;
  const upper = gate.center - gate.gap / 2;
  const lower = gate.center + gate.gap / 2;
  return circleRect(x, y, r, gate.x, 0, width, upper - 20)
    || circleRect(x, y, r, gate.x - cap, upper - 20, width + cap * 2, 20)
    || circleRect(x, y, r, gate.x - cap, lower, width + cap * 2, 20)
    || circleRect(x, y, r, gate.x, lower + 20, width, FLIGHT.ground - lower - 20);
}

// The caller uses a fixed timestep. Bound individual steps to prevent tunneling
// if a slow or suspended frame reaches the engine.
export function stepFlight(game, seconds = 1 / 120) {
  const result = { passed: 0, lost: false, won: false };
  if (game.status !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return result;
  const dt = Math.min(seconds, 1 / 30);
  const travel = flightDifficulty(game.score).speed * dt;
  game.elapsed += dt; game.distance += travel;
  game.velocity = Math.min(FLIGHT.maxFall, game.velocity + FLIGHT.gravity * dt);
  game.y += game.velocity * dt;
  for (const gate of game.gates) gate.x -= travel;
  const boundary = game.y - FLIGHT.radius <= 0 ? 'ceiling' : game.y + FLIGHT.radius >= FLIGHT.ground ? 'ground' : null;
  if (boundary || game.gates.some(gate => touchesGate(game.y, gate))) {
    game.status = 'lost'; game.reason = boundary || 'gate'; result.lost = true;
    return result;
  }
  for (const gate of game.gates) {
    if (!gate.passed && gate.x + FLIGHT.pipeWidth + FLIGHT.cap < FLIGHT.catX - FLIGHT.radius) {
      gate.passed = true; game.score++; result.passed++;
      if (game.score === FLIGHT_GOAL) {
        game.status = 'won'; result.won = true; return result;
      }
    }
  }
  game.gates = game.gates.filter(gate => gate.x + FLIGHT.pipeWidth > -30);
  while (game.gates.at(-1).x < FLIGHT.width + FLIGHT.spacing) game.gates.push(nextGate(game, game.gates.at(-1).x + FLIGHT.spacing));
  return result;
}

export function normalizeFlightProgress(raw = {}) {
  const stars = integer(raw?.stars, 3);
  return { stars, best: Math.max(integer(raw?.best), stars ? FLIGHT_STARS[stars - 1] : 0), completed: raw?.completed === true || stars > 0 };
}

export function awardFlightProgress(raw, score) {
  const current = normalizeFlightProgress(raw);
  const stars = Math.max(current.stars, FLIGHT_STARS.filter(target => integer(score) >= target).length);
  const progress = normalizeFlightProgress({ ...current, stars, best: Math.max(current.best, integer(score)) });
  return { progress, starsEarned: stars - current.stars, coinsEarned: (stars - current.stars) * 10 };
}
