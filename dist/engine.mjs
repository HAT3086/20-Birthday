import { readSnakeProgress, saveSnakeProgress } from './progress.mjs';

export const SIZE = 20;
export const GOAL = 30;
// Each star takes 5, then 10, then 15 more fish in the same run.
export const MILESTONES = Object.freeze([5, 15, 30]);
export const COINS_PER_STAR = 10;
export const STORAGE_KEY = 'twenty.cat-snake.v1';
const DIRECTIONS = Object.freeze({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] });
const clamp = (value, max) => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : 0;

export function normalizeProgress(raw = {}) {
  const stars = clamp(raw?.stars, 3);
  return {
    version: 1,
    stars,
    coins: stars * COINS_PER_STAR,
    best: Math.max(clamp(raw?.best, GOAL), stars ? MILESTONES[stars - 1] : 0),
    sound: raw?.sound !== false,
    music: raw?.music === true,
  };
}

export function loadProgress(storage) {
  return normalizeProgress(readSnakeProgress(storage));
}

export function saveProgress(storage, progress) {
  return saveSnakeProgress(storage, normalizeProgress(progress));
}

export function awardProgress(progress, score) {
  const current = normalizeProgress(progress);
  const stars = Math.max(current.stars, MILESTONES.filter(target => score >= target).length);
  const next = normalizeProgress({ ...current, stars, best: Math.max(current.best, clamp(score, GOAL)) });
  return { progress: next, starsEarned: stars - current.stars, coinsEarned: next.coins - current.coins };
}

export function spawnFish(body, random = Math.random) {
  const occupied = new Set(body.map(({ x, y }) => `${x},${y}`));
  const free = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    if (!occupied.has(`${x},${y}`)) free.push({ x, y });
  }
  if (!free.length) return null;
  return free[Math.min(free.length - 1, Math.floor(Math.max(0, random()) * free.length))];
}

export function createGame({ random = Math.random } = {}) {
  const body = [{ x: 7, y: 10 }, { x: 6, y: 10 }, { x: 5, y: 10 }, { x: 4, y: 10 }];
  return { body, direction: 'right', turns: [], fish: spawnFish(body, random), score: 0, status: 'ready', random, reason: null };
}

export function queueTurn(game, direction) {
  if (game.status !== 'playing' || !DIRECTIONS[direction] || game.turns.length >= 2) return false;
  const last = game.turns.at(-1) || game.direction;
  const [dx, dy] = DIRECTIONS[direction];
  const [lx, ly] = DIRECTIONS[last];
  if (last === direction || (dx + lx === 0 && dy + ly === 0)) return false;
  game.turns.push(direction);
  return true;
}

export function step(game) {
  if (game.status !== 'playing') return { ate: false, won: false, lost: false };
  game.direction = game.turns.shift() || game.direction;
  const [dx, dy] = DIRECTIONS[game.direction];
  const head = { x: game.body[0].x + dx, y: game.body[0].y + dy };
  const ate = game.fish !== null && head.x === game.fish.x && head.y === game.fish.y;
  const solidBody = ate ? game.body : game.body.slice(0, -1);
  const wall = head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE;
  if (wall || solidBody.some(segment => segment.x === head.x && segment.y === head.y)) {
    game.status = 'lost';
    game.reason = wall ? 'wall' : 'parade';
    return { ate: false, won: false, lost: true };
  }
  game.body.unshift(head);
  if (ate) game.score++;
  else game.body.pop();
  if (game.score >= GOAL) {
    game.status = 'won'; game.fish = null;
    return { ate, won: true, lost: false };
  }
  if (ate) game.fish = spawnFish(game.body, game.random);
  return { ate, won: false, lost: false };
}

export function stepDuration(score) {
  return Math.max(112, 190 - Math.floor(score / 5) * 11);
}
