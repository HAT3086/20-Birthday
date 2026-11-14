import test from 'node:test';
import assert from 'node:assert/strict';
import { ARCADE_KEY, LEGACY_SNAKE_KEY, GAMES, normalizeArcade, loadArcade, saveArcade, mergeArcade, totalStars, starSlots } from '../dist/progress.mjs';
import { awardProgress, loadProgress, saveProgress } from '../dist/engine.mjs';

const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };

test('a new arcade has six games, twenty unique star slots, and an original cat', () => {
  const state = normalizeArcade();
  assert.equal(Object.keys(state.games).length, 6);
  assert.equal(starSlots(state).length, 20); assert.equal(new Set(starSlots(state).map(slot => slot.id)).size, 20);
  assert.equal(totalStars(state), 0); assert.equal(state.wallet.coins, 0);
  assert.deepEqual(state.skins, { owned: ['original'], equipped: 'original' });
  assert.equal(GAMES.filter(game => game.available).length, 6);
});
test('existing Snake progress migrates without losing coins, stars, best score, or preferences', () => {
  const storage = memory(); storage.setItem(LEGACY_SNAKE_KEY, JSON.stringify({ stars: 2, coins: 20, best: 35, sound: false, music: true }));
  const state = loadArcade(storage);
  assert.deepEqual(state.games.snake, { stars: 2, best: 30, completed: true });
  assert.equal(state.wallet.coins, 20); assert.deepEqual(state.settings, { sound: false, music: true });
  assert.equal(saveArcade(storage, state), true);
  assert.equal(JSON.parse(storage.getItem(ARCADE_KEY)).games.snake.stars, 2);
  assert.equal(awardProgress(loadProgress(storage), 15).coinsEarned, 0);
});
test('choosing or changing a name never grants the reserved cat-check star', () => {
  const storage = memory(); const state = normalizeArcade({ profile: { name: '  Birthday   Cat  ' } });
  saveArcade(storage, state);
  assert.equal(loadArcade(storage).profile.name, 'Birthday Cat');
  assert.equal(loadArcade(storage).bonuses.welcome, false); assert.equal(totalStars(loadArcade(storage)), 0);
  assert.equal(loadArcade(storage).wallet.coins, 0);
});
test('Snake rewards reach the shared wallet once and preserve player identity', () => {
  const storage = memory(); saveArcade(storage, normalizeArcade({ profile: { name: 'Player' } }));
  const first = awardProgress(loadProgress(storage), 5); saveProgress(storage, first.progress);
  let state = loadArcade(storage);
  assert.equal(state.wallet.coins, 10); assert.equal(totalStars(state), 1); assert.equal(state.profile.name, 'Player');
  assert.equal(state.games.snake.completed, true); assert.equal(state.bonuses.completion, false);
  const repeat = awardProgress(loadProgress(storage), 5); saveProgress(storage, repeat.progress);
  assert.equal(repeat.coinsEarned, 0); assert.equal(loadArcade(storage).wallet.coins, 10);
  const finish = awardProgress(loadProgress(storage), 30); saveProgress(storage, finish.progress);
  state = loadArcade(storage); assert.equal(state.wallet.coins, 30); assert.equal(totalStars(state), 3);
});
test('all six basic completions grant the completion star once, without bonus coins', () => {
  const storage = memory(); let state = normalizeArcade({ games: Object.fromEntries(GAMES.map(({ id }) => [id, { stars: 1, completed: true }])) });
  saveArcade(storage, state); state = loadArcade(storage);
  assert.equal(totalStars(state), 7); assert.equal(state.bonuses.completion, true); assert.equal(state.wallet.coins, 60);
  saveArcade(storage, state); assert.equal(totalStars(loadArcade(storage)), 7);
});
test('eighteen game stars and the two special stars yield exactly twenty and 180 coins', () => {
  const state = normalizeArcade({ games: Object.fromEntries(GAMES.map(({ id }) => [id, { stars: 3, completed: true }])), bonuses: { welcome: true } });
  assert.equal(totalStars(state), 20); assert.equal(state.wallet.coins, 180);
  assert.equal(starSlots(state).filter(slot => slot.earned).length, 20);
});
test('a stale page cannot erase newer rewards or costume ownership', () => {
  const old = normalizeArcade({ profile: { name: 'Player' } });
  const current = normalizeArcade({ profile: { name: 'Player' }, games: { snake: { stars: 3 } }, skins: { owned: ['original', 'astronaut'], equipped: 'astronaut' }, wallet: { spent: 10 } });
  const merged = mergeArcade(current, old);
  assert.equal(merged.games.snake.stars, 3); assert.equal(merged.wallet.coins, 20);
  assert.ok(merged.skins.owned.includes('astronaut'));
});
test('Snake saves preserve other games, wallet spending, profile, and the equipped costume', () => {
  const storage = memory();
  saveArcade(storage, normalizeArcade({ profile: { name: 'Player' }, games: { flappy: { stars: 2 } }, skins: { owned: ['original', 'astronaut'], equipped: 'astronaut' }, wallet: { spent: 10 } }));
  saveProgress(storage, awardProgress(loadProgress(storage), 5).progress);
  const state = loadArcade(storage);
  assert.equal(state.games.flappy.stars, 2); assert.equal(state.wallet.earned, 30); assert.equal(state.wallet.spent, 10); assert.equal(state.wallet.coins, 20);
  assert.equal(state.profile.name, 'Player'); assert.equal(state.skins.equipped, 'astronaut');
});
test('an older open Snake tab can contribute new rewards without replacing the shared profile', () => {
  const storage = memory(); saveArcade(storage, normalizeArcade({ profile: { name: 'Player' }, settings: { sound: false } }));
  storage.setItem(LEGACY_SNAKE_KEY, JSON.stringify({ stars: 2, best: 20, sound: true }));
  const state = loadArcade(storage);
  assert.equal(state.games.snake.stars, 2); assert.equal(state.wallet.coins, 20); assert.equal(state.profile.name, 'Player'); assert.equal(state.settings.sound, false);
});
test('invalid saves, unavailable storage, and malformed profiles are handled safely', () => {
  assert.equal(totalStars(loadArcade(null)), 0); assert.equal(saveArcade(null, {}), false);
  const storage = memory(); storage.setItem(ARCADE_KEY, '{broken');
  assert.equal(loadArcade(storage).wallet.coins, 0);
  const state = normalizeArcade({ profile: { name: 'x'.repeat(80) }, games: { snake: { stars: 99, best: 999 } }, wallet: { spent: 1000 }, skins: { owned: [null, '<script>'], equipped: 'missing' } });
  assert.equal(state.profile.name.length, 24); assert.equal(state.games.snake.stars, 3); assert.equal(state.games.snake.best, 30);
  assert.equal(state.wallet.coins, 0); assert.equal(state.skins.equipped, 'original');
  assert.deepEqual(normalizeArcade(null), normalizeArcade());
});

test('Cat Fishing uses the stable mining save slot with points bounded at thirty', () => {
  const state=normalizeArcade({games:{mining:{stars:2,best:999}}});
  assert.equal(state.games.mining.best,30); assert.equal(state.wallet.coins,20);
  assert.equal(normalizeArcade({games:{mining:{stars:1}}}).games.mining.best,5);
});

test('rooftop stars merge by identity across stale pages and do not duplicate reward coins',()=>{
  const storage=memory();saveArcade(storage,normalizeArcade({games:{platformer:{starIds:[2]}}}));
  const stale=normalizeArcade({games:{platformer:{starIds:[0]}}});saveArcade(storage,stale);
  const saved=loadArcade(storage);assert.deepEqual(saved.games.platformer.starIds,[0,2]);assert.equal(saved.games.platformer.stars,2);assert.equal(saved.wallet.coins,20);
  saveArcade(storage,stale);assert.equal(loadArcade(storage).wallet.coins,20);
});

test('rooftop stars alone do not mark the course complete; finishing can complete it without stars',()=>{
  assert.equal(normalizeArcade({games:{platformer:{starIds:[0,1,2]}}}).games.platformer.completed,false);
  const state=normalizeArcade({games:{platformer:{completed:true,best:100}}});assert.equal(state.games.platformer.completed,true);assert.equal(state.wallet.coins,0);
});

test('Candy Cat keeps the planned slingshot save slot, caps its score, and merges stars without repeat payment',()=>{
  const state=normalizeArcade({games:{slingshot:{stars:2,best:999999}},wallet:{spent:10}});
  assert.equal(state.games.slingshot.best,2000);assert.equal(state.wallet.coins,10);assert.equal(normalizeArcade({games:{slingshot:{stars:2}}}).games.slingshot.best,1200);
  const merged=mergeArcade(state,{games:{slingshot:{stars:1,best:500}}});assert.equal(merged.games.slingshot.stars,2);assert.equal(merged.wallet.earned,20);assert.equal(merged.wallet.spent,10);
  assert.equal(GAMES.find(game=>game.id==='slingshot').title,'Candy Cat');
});

test('Catris uses the tetris save slot with line milestones and a fifteen-line reward cap',()=>{
  const saved=normalizeArcade({games:{tetris:{stars:2,best:9999}}});assert.equal(saved.games.tetris.best,15);assert.equal(saved.wallet.coins,20);assert.equal(normalizeArcade({games:{tetris:{stars:2}}}).games.tetris.best,10);
  const merged=mergeArcade(saved,{games:{tetris:{stars:3,best:30}}});assert.equal(merged.games.tetris.stars,3);assert.equal(merged.wallet.coins,30);assert.equal(mergeArcade(merged,saved).wallet.coins,30);assert.ok(GAMES.every(game=>game.available));
});
