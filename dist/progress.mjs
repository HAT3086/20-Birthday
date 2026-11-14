import { breedFor } from './breeds.mjs';
import { normalizeRoofProgress } from './rooftop-engine.mjs';
import { normalizeCandyProgress } from './candy-engine.mjs';
import { normalizeCatrisProgress } from './catris-engine.mjs';

export const ARCADE_KEY = 'twenty.arcade.v1';
export const LEGACY_SNAKE_KEY = 'twenty.cat-snake.v1';
// Keep game IDs stable for existing browser saves when titles or future concepts change.
export const GAMES = Object.freeze([
  { id: 'snake', title: 'Cake', available: true, theme: 'sage' },
  { id: 'flappy', title: 'Flappy Cat', available: true, theme: 'blue' },
  { id: 'platformer', title: 'Rooftop Run', available: true, theme: 'rose' },
  { id: 'mining', title: 'Cat Fishing', available: true, theme: 'sand' },
  { id: 'slingshot', title: 'Candy Cat', available: true, theme: 'clay' },
  { id: 'tetris', title: 'Catris', available: true, theme: 'lavender' },
]);
const integer = (value, maximum) => Number.isFinite(value) ? Math.max(0, Math.min(maximum, Math.floor(value))) : 0;
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const cleanName = value => typeof value === 'string' ? Array.from(value.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()).slice(0, 24).join('') : '';
export const playerCatName = state => cleanName(state?.profile?.name) || 'Mochi';

export function normalizeArcade(raw = {}) {
  raw = object(raw);
  const games = Object.fromEntries(GAMES.map(({ id }) => {
    const saved = object(raw.games?.[id]);
    if (id === 'platformer') return [id, normalizeRoofProgress(saved)];
    if (id === 'slingshot') return [id, normalizeCandyProgress(saved)];
    if (id === 'tetris') return [id, normalizeCatrisProgress(saved)];
    const stars = integer(saved.stars, 3);
    const bounded = id === 'snake' || id === 'flappy' || id === 'mining';
    const minimumBest = bounded && stars ? [5, 15, 30][stars - 1] : 0;
    return [id, { stars, best: Math.max(minimumBest, integer(saved.best, bounded ? 30 : 999999)), completed: saved.completed === true || stars > 0 }];
  }));
  const earned = Object.values(games).reduce((sum, game) => sum + game.stars * 10, 0);
  const spent = integer(raw.wallet?.spent, earned);
  const owned = [...new Set(['original', ...(Array.isArray(raw.skins?.owned) ? raw.skins.owned.filter(id => typeof id === 'string' && /^[a-z][a-z0-9-]{0,31}$/.test(id)).slice(0, 30) : [])])];
  return {
    version: 1,
    profile: { name: cleanName(raw.profile?.name) },
    appearance: { breed: breedFor(raw.appearance?.breed).id },
    games,
    bonuses: { welcome: raw.bonuses?.welcome === true, completion: GAMES.every(({ id }) => games[id].completed) },
    wallet: { earned, spent, coins: earned - spent },
    skins: { owned, equipped: owned.includes(raw.skins?.equipped) ? raw.skins.equipped : 'original' },
    settings: { sound: raw.settings?.sound !== false, music: raw.settings?.music === true },
  };
}

function readJSON(storage, key) {
  try { return object(JSON.parse(storage.getItem(key) || 'null')); }
  catch { return {}; }
}

export function loadArcade(storage) {
  const canonical = readJSON(storage, ARCADE_KEY);
  const legacy = readJSON(storage, LEGACY_SNAKE_KEY);
  const hasCanonical = canonical.version === 1;
  let state = normalizeArcade(hasCanonical ? canonical : { games: { snake: legacy }, settings: legacy });
  // Older open Snake tabs may still write the original key. Import only new
  // achievements; the shared profile, preferences, and wallet remain canonical.
  if (Object.keys(legacy).length) {
    const oldSnake = normalizeArcade({ games: { snake: legacy } }).games.snake;
    state.games.snake.stars = Math.max(state.games.snake.stars, oldSnake.stars);
    state.games.snake.best = Math.max(state.games.snake.best, oldSnake.best);
    state.games.snake.completed ||= oldSnake.completed;
    state = normalizeArcade(state);
  }
  return state;
}

export function mergeArcade(current, incoming) {
  const a = normalizeArcade(current);
  const b = normalizeArcade(incoming);
  for (const { id } of GAMES) {
    b.games[id].stars = Math.max(a.games[id].stars, b.games[id].stars);
    b.games[id].best = Math.max(a.games[id].best, b.games[id].best);
    b.games[id].completed ||= a.games[id].completed;
    if (id === 'platformer') b.games[id].starIds = [...new Set([...a.games[id].starIds, ...b.games[id].starIds])];
  }
  b.bonuses.welcome ||= a.bonuses.welcome;
  b.wallet.spent = Math.max(a.wallet.spent, b.wallet.spent);
  b.skins.owned = [...new Set([...a.skins.owned, ...b.skins.owned])];
  return normalizeArcade(b);
}

export function saveArcade(storage, state, { profile = false } = {}) {
  try {
    const current = loadArcade(storage);
    const next = mergeArcade(current, state);
    // Equipment changes are committed by the wardrobe. Ordinary progress saves
    // must not put back a costume remembered by an older game or hub tab.
    if (readJSON(storage, ARCADE_KEY).version === 1) {
      next.skins.equipped = current.skins.equipped;
      next.appearance = current.appearance;
      if (!profile && current.profile.name) next.profile = current.profile;
    }
    storage.setItem(ARCADE_KEY, JSON.stringify(next));
    // Keep earlier Snake versions compatible without making this backup the
    // source of truth for profile data, the shared wallet, or future purchases.
    try { storage.setItem(LEGACY_SNAKE_KEY, JSON.stringify({ version: 1, stars: next.games.snake.stars, best: next.games.snake.best, coins: next.games.snake.stars * 10, ...next.settings })); } catch {}
    return true;
  } catch { return false; }
}

export function readSnakeProgress(storage) {
  const state = loadArcade(storage);
  return { ...state.games.snake, ...state.settings };
}

export function saveSnakeProgress(storage, progress) {
  const state = loadArcade(storage);
  state.games.snake = { ...state.games.snake, stars: progress.stars, best: progress.best };
  state.settings = { sound: progress.sound, music: progress.music };
  return saveArcade(storage, state);
}

export function totalStars(state) {
  const normalized = normalizeArcade(state);
  return GAMES.reduce((sum, { id }) => sum + normalized.games[id].stars, 0) + Number(normalized.bonuses.welcome) + Number(normalized.bonuses.completion);
}

export function starSlots(state) {
  state = normalizeArcade(state);
  return [
    { id: 'welcome', label: 'Cat-check welcome star', earned: state.bonuses.welcome, special: true },
    ...GAMES.flatMap(game => [1, 2, 3].map(number => ({ id: `${game.id}-${number}`, label: `${game.title}: star ${number}`, earned: state.games[game.id].stars >= number, special: false }))),
    { id: 'completion', label: 'Complete all six games', earned: state.bonuses.completion, special: true },
  ];
}
