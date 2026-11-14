export const LAKE = Object.freeze({ width: 800, height: 500, surface: 156, bottom: 470, pivotX: 345, pivotY: 94, rest: 66, swing: 1.04, swingSpeed: .68, castSpeed: 225, reelSpeed: 165, orbSize: 36 });
export const FISHING_GOAL = 30;
export const FISHING_STARS = Object.freeze([5, 15, 30]);
export const FISH = Object.freeze({
  small: Object.freeze({ name: 'Small fish', points: 1, width: 28, height: 16, speed: 37, weight: 1, color: '#e5bb7b', shade: '#b78b51' }),
  medium: Object.freeze({ name: 'Medium fish', points: 2, width: 36, height: 26, speed: 28, weight: 1.65, color: '#d79580', shade: '#a96456' }),
  big: Object.freeze({ name: 'Big fish', points: 3, width: 54, height: 32, speed: 19, weight: 2.25, color: '#a8bed4', shade: '#688ca9' }),
});
export const ORBS = Object.freeze(['speed', 'double', 'freeze']);
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const integer = (n, max = 30) => Number.isFinite(n) ? clamp(Math.floor(n), 0, max) : 0;
const unit = game => { const n = game.random(); return Number.isFinite(n) ? clamp(n, 0, .999999) : .5; };

export function makeCatch(game, kind, { x, y, type } = {}) {
  const sample = unit(game);
  type ||= kind === 'fish' ? (sample < .5 ? 'small' : sample < .82 ? 'medium' : 'big') : kind === 'orb' ? ORBS[Math.floor(sample * 3)] : 'boot';
  const definition = FISH[type];
  const direction = unit(game) < .5 ? -1 : 1;
  const depth = type === 'small' ? 215 : type === 'medium' ? 300 : type === 'big' ? 390 : 230 + unit(game) * 180;
  const baseY = y ?? depth + (unit(game) - .5) * 52;
  return { id: game.nextId++, kind, type, x: x ?? 54 + unit(game) * 692, y: baseY,
    baseY, phase: unit(game) * Math.PI * 2, direction, speed: (definition?.speed || (kind === 'orb' ? 17 : 9)) * (.85 + unit(game) * .3),
    width: definition?.width || (kind === 'orb' ? LAKE.orbSize : 32), height: definition?.height || (kind === 'orb' ? LAKE.orbSize : 28) };
}

export function createFishing({ random = Math.random } = {}) {
  const game = { status: 'ready', score: 0, fishCaught: 0, elapsed: 0, random, nextId: 0, entities: [],
    hook: { phase: 'aim', angle: .2, direction: 1, length: LAKE.rest, payload: null }, boosts: { speed: 0, freeze: 0, double: 0 } };
  for (let i = 0; i < 9; i++) game.entities.push(makeCatch(game, 'fish', { x: 75 + i * 77, y: 215 + i % 3 * 92, type: ['small', 'medium', 'big'][i % 3] }));
  // Fish outnumber orbs 3:1. Each orb has the same spawn probability.
  ORBS.forEach((type, i) => game.entities.push(makeCatch(game, 'orb', { x: [520, 165, 665][i], y: [235, 320, 400][i], type })));
  game.entities.push(makeCatch(game, 'debris', { x: 410, y: 438 }));
  return game;
}

export function hookPosition(hook) {
  return { x: LAKE.pivotX + Math.sin(hook.angle) * hook.length, y: LAKE.pivotY + Math.cos(hook.angle) * hook.length };
}

export function castFishing(game) {
  if (game.status !== 'playing' || game.hook.phase !== 'aim') return false;
  game.hook.phase = 'cast'; return true;
}

// Earliest intersection of the hook's swept segment and an item's hit ellipse.
function hitTime(from, to, entity) {
  const rx = entity.width / 2 + 5, ry = entity.height / 2 + 5;
  const x = (from.x - entity.x) / rx, y = (from.y - entity.y) / ry;
  const dx = (to.x - from.x) / rx, dy = (to.y - from.y) / ry;
  const c = x * x + y * y - 1;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy, b = 2 * (x * dx + y * dy), d = b * b - 4 * a * c;
  if (!a || d < 0) return null;
  const t = (-b - Math.sqrt(d)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

function land(game, result) {
  const item = game.hook.payload;
  game.hook.phase = 'aim'; game.hook.length = LAKE.rest; game.hook.payload = null;
  if (!item) return;
  result.landed = item;
  if (item.kind === 'fish') {
    result.multiplier = game.boosts.double ? 2 : 1;
    if (game.boosts.double) game.boosts.double--;
    result.points = FISH[item.type].points * result.multiplier;
    game.score = Math.min(FISHING_GOAL, game.score + result.points); game.fishCaught++;
    if (game.score === FISHING_GOAL) { game.status = 'won'; result.won = true; }
  } else if (item.kind === 'orb') {
    if (item.type === 'double') game.boosts.double++;
    else game.boosts[item.type] = item.type === 'speed' ? 10 : 5;
  }
  if (!result.won) game.entities.push(makeCatch(game, item.kind));
}

export function stepFishing(game, seconds = 1 / 120) {
  const result = { caught: null, landed: null, points: 0, multiplier: 1, won: false };
  if (game.status !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return result;
  const dt = Math.min(seconds, 1 / 30), frozen = game.boosts.freeze > 0;
  game.elapsed += dt;
  game.boosts.speed = Math.max(0, game.boosts.speed - dt); game.boosts.freeze = Math.max(0, game.boosts.freeze - dt);
  for (const item of game.entities) {
    if (frozen && (item.kind === 'fish' || item.kind === 'orb')) continue;
    item.x += item.direction * item.speed * dt; item.phase += dt * 1.5;
    item.y = item.baseY + Math.sin(item.phase) * (item.kind === 'orb' ? 5 : 3);
    if (item.x < -item.width) item.x = LAKE.width + item.width;
    else if (item.x > LAKE.width + item.width) item.x = -item.width;
  }
  const hook = game.hook;
  if (hook.phase === 'aim') {
    hook.angle += hook.direction * LAKE.swingSpeed * dt;
    if (Math.abs(hook.angle) >= LAKE.swing) { hook.angle = clamp(hook.angle, -LAKE.swing, LAKE.swing); hook.direction *= -1; }
  } else if (hook.phase === 'cast') {
    const from = hookPosition(hook); hook.length += LAKE.castSpeed * dt;
    const to = hookPosition(hook);
    let first = null, earliest = Infinity;
    for (const item of game.entities) {
      const t = hitTime(from, to, item);
      if (t !== null && t < earliest) { first = item; earliest = t; }
    }
    if (first) {
      hook.length -= LAKE.castSpeed * dt * (1 - earliest);
      hook.payload = first; hook.phase = 'reel'; game.entities = game.entities.filter(item => item !== first); result.caught = first;
    } else if (to.y >= LAKE.bottom || to.x <= 22 || to.x >= LAKE.width - 22) hook.phase = 'reel';
  } else if (hook.phase === 'reel') {
    const weight = hook.payload?.kind === 'fish' ? FISH[hook.payload.type].weight : hook.payload?.kind === 'debris' ? 2.3 : 1;
    hook.length -= LAKE.reelSpeed * (game.boosts.speed > 0 ? 2 : 1) / weight * dt;
    if (hook.length <= LAKE.rest) land(game, result);
  }
  return result;
}

export function awardFishingProgress(raw = {}, score = 0) {
  const before = integer(raw?.stars, 3), best = Math.max(integer(raw?.best), before ? FISHING_STARS[before - 1] : 0, integer(score));
  const stars = Math.max(before, FISHING_STARS.filter(target => integer(score) >= target).length);
  return { progress: { stars, best, completed: raw?.completed === true || stars > 0 }, starsEarned: stars - before, coinsEarned: (stars - before) * 10 };
}
