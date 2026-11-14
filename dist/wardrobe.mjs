import { ARCADE_KEY, loadArcade, normalizeArcade } from './progress.mjs';
import { COSTUMES } from './costumes.mjs';
import { BREEDS } from './breeds.mjs';

// Read immediately before each action so a stale shop cannot spend an old balance.
// The UI serializes shop actions across tabs with Web Locks when supported.
export function changeCostume(storage, id, buy = false) {
  const state = loadArcade(storage);
  const costume = COSTUMES.find(item => item.id === id);
  if (!costume) return { ok: false, reason: 'unknown', state };
  const owned = state.skins.owned.includes(id);
  if (!owned && !buy) return { ok: false, reason: 'unowned', state };
  if (!owned && state.wallet.coins < costume.price) return { ok: false, reason: 'coins', state };
  if (owned && state.skins.equipped === id) return { ok: true, reason: 'equipped', state };
  if (!owned) {
    state.wallet.spent += costume.price;
    state.skins.owned.push(id);
  }
  state.skins.equipped = id;
  const next = normalizeArcade(state);
  try {
    storage.setItem(ARCADE_KEY, JSON.stringify(next));
    return { ok: true, reason: owned ? 'equipped' : 'purchased', state: next };
  } catch {
    return { ok: false, reason: 'saving', state: loadArcade(storage) };
  }
}

export function changeBreed(storage, id) {
  const state = loadArcade(storage);
  if (!BREEDS.some(breed => breed.id === id)) return { ok: false, reason: 'unknown', state };
  if (state.appearance.breed === id) return { ok: true, reason: 'equipped', state };
  const next = normalizeArcade({ ...state, appearance: { breed: id } });
  try {
    storage.setItem(ARCADE_KEY, JSON.stringify(next));
    return { ok: true, reason: 'equipped', state: next };
  } catch { return { ok: false, reason: 'saving', state }; }
}
