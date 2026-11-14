import { ROOF, ROOF_SECTIONS, createRooftop, jumpRooftop, shootRooftop, releaseRoofJump, clearRoofInput, stepRooftop, roofPercent, awardRoofProgress } from './rooftop-engine.mjs';
import { ARCADE_KEY, LEGACY_SNAKE_KEY, loadArcade, saveArcade, mergeArcade, normalizeArcade, playerCatName } from './progress.mjs';
import { drawSittingCat } from './art.mjs';
import { drawRooftop } from './rooftop-art.mjs';
import { costumeFor } from './costumes.mjs';
import { breedFor } from './breeds.mjs';
import { ArcadeAudio } from './arcade-audio.mjs';

const $ = id => document.getElementById(id);
const canvas = $('game-canvas'), context = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage;
try { storage = window.localStorage; } catch { storage = null; }
let state = loadArcade(storage), game = createRooftop(state.games.platformer);
let runStars = 0, runCoins = 0, starting = false, lastTime = null, accumulator = 0, toastTimer, celebrationUntil = 0;
let appearanceKey = '';
const audio = new ArcadeAudio(() => state.settings, 'platformer');
const announce = message => { $('live-announcement').textContent = message; };

function persist() {
  const ok = saveArcade(storage, state);
  if (ok) state = loadArcade(storage);
  $('save-status').hidden = ok;
  $('save-status').textContent = ok ? '' : 'Saving unavailable. Rewards stay in this tab until you leave.';
  return ok;
}

function updateHUD() {
  const catTitle = playerCatName(state);
  $('cat-name').textContent = catTitle;
  const progress=state.games.platformer, percent=roofPercent(game);
  $('course-count').textContent=String(percent); $('fall-count').textContent=String(game.falls);
  $('heart-count').textContent='♥'.repeat(game.hearts)+'♡'.repeat(ROOF.maxHearts-game.hearts);
  $('heart-count').setAttribute('aria-label',`${game.hearts} of ${ROOF.maxHearts} hearts`);
  $('energy-count').textContent=String(game.energy);
  $('wallet-count').textContent=state.wallet.coins; $('star-count').textContent=progress.stars;
  $('collection-stars').textContent=`${progress.stars} / 3`; $('collection-coins').textContent=`${progress.stars*10} / 30`;
  document.querySelectorAll('[data-milestone]').forEach((row,index)=>{
    const collected=progress.starIds.includes(index); row.classList.toggle('collected',collected); row.classList.toggle('current',index===Math.min(2,Math.floor(game.player.x/ROOF.world*3)));
    row.querySelector('.milestone-reward').innerHTML=collected?'Collected ✓':'+10 <svg class="icon"><use href="#icon-coin"/></svg>';
    row.setAttribute('aria-label',`${ROOF_SECTIONS[index]}: ${collected?'star collected':'star not yet collected'}`);
  });
  $('next-label').textContent='To the finish'; $('next-progress').textContent=`${percent}%`; $('milestone-fill').style.width=`${percent}%`;
  $('sound-button').setAttribute('aria-pressed',String(state.settings.sound));
  $('sound-button').setAttribute('aria-label',state.settings.sound?'Mute sound effects':'Enable sound effects');
  $('sound-button').querySelector('.mute-slash').hidden=state.settings.sound;
  $('music-button').setAttribute('aria-pressed',String(state.settings.music)); $('pause-button').hidden=game.status!=='playing';
  const outfit = costumeFor(state.skins.equipped), breed = breedFor(state.appearance.breed);
  const key = `${outfit.id}:${breed.id}:${catTitle}`;
  if (key !== appearanceKey) {
    appearanceKey = key;
    drawSittingCat($('portrait-canvas').getContext('2d'), 240, 180, outfit.id, breed.id);
    drawSittingCat($('overlay-cat').getContext('2d'), 120, 120, outfit.id, breed.id);
    $('portrait-canvas').setAttribute('aria-label', `${catTitle} wearing ${outfit.name}${breed.id === 'original' ? '' : ` · ${breed.name}`}`);
  }
}

function showToast(message) {
  clearTimeout(toastTimer); $('board-toast').textContent = message; $('board-toast').hidden = false;
  toastTimer = setTimeout(() => { $('board-toast').hidden = true; }, 2200);
  announce(message);
}

function setOverlay(title, copy, action, { secondary = false, results = false } = {}) {
  $('game-overlay').hidden = false;
  $('overlay-title').textContent = title; $('overlay-copy').textContent = copy;
  $('play-button').innerHTML = `${action} <svg class="icon"><use href="#icon-arrow"/></svg>`;
  $('overlay-secondary').hidden = !secondary;
  $('overlay-secondary').textContent = game.status === 'paused' ? 'Start a fresh run' : 'Back to arcade';
  $('result-rewards').hidden = !results;
  if (results) $('result-rewards').innerHTML = runStars
    ? `<span class="reward-chip"><svg class="icon"><use href="#icon-star"/></svg> +${runStars} ${runStars === 1 ? 'star' : 'stars'}</span><span class="reward-chip"><svg class="icon"><use href="#icon-coin"/></svg> +${runCoins} coins</span>`
    : `<span class="reward-chip replay">${state.games.platformer.stars === 3 ? 'All rewards collected' : 'No new rewards this round'}</span>`;
}

function refresh() { state=mergeArcade(state,loadArcade(storage)); game.starIds=[...new Set([...game.starIds,...state.games.platformer.starIds])]; updateHUD(); audio.updateMusic(); }

async function start() {
  if (starting || window.innerWidth < 1000) return;
  starting = true;
  try {
    await audio.unlock();
    if (document.hidden || window.innerWidth < 1000) return;
    refresh(); game = createRooftop(state.games.platformer); game.status = 'playing';
    runStars = 0; runCoins = 0; clearControls(); hudPercent=-1; accumulator = 0; lastTime = performance.now(); celebrationUntil = 0;
    clearTimeout(toastTimer); $('board-toast').hidden = true; $('game-overlay').hidden = true;
    audio.effect('start'); audio.updateMusic(); updateHUD();  canvas.focus({ preventScroll: true });
    announce('Rooftop Run started. Left or Right to run. Space to jump. P or Escape pauses.');
  } finally { starting = false; }
}

function pause(reason = 'manual') {
  if (game.status !== 'playing') return;
  game.status = 'paused'; clearControls(); recordProgress(); accumulator = 0; lastTime = null;
  setOverlay('Paused', reason === 'away' ? 'Paused while you were away.' : 'Continue when you’re ready.', 'Resume', { secondary: true });
  updateHUD(); $('play-button').focus({ preventScroll: true });
}

async function resume() {
  if (game.status !== 'paused') return;
  await audio.unlock();
  if (document.hidden || window.innerWidth < 1000) return;
  game.status = 'playing'; accumulator = 0; lastTime = performance.now();
  $('game-overlay').hidden = true; updateHUD(); audio.updateMusic(); canvas.focus({ preventScroll: true });
}

function recordProgress() {
  const settings=state.settings; state=mergeArcade(state,loadArcade(storage)); state.settings=settings;
  const reward=awardRoofProgress(state.games.platformer,game.starIds,roofPercent(game),game.status==='won');
  state.games.platformer=reward.progress; state=normalizeArcade(state);
  game.starIds=[...new Set([...game.starIds,...state.games.platformer.starIds])];
  runStars+=reward.starsEarned; runCoins+=reward.coinsEarned; persist(); updateHUD(); return reward;
}

function finish(won=true) {
  audio.effect(won?'won':'lost'); celebrationUntil=won?performance.now()+2500:0;
  const missing=3-state.games.platformer.stars;
  if(won)setOverlay('Home, sweet rooftop.',missing?`You made it! ${missing} ${missing===1?'star is':'stars are'} still waiting.`:'All three stars collected!','Run again',{secondary:true,results:true});
  else setOverlay('A brave little run.', 'Out of hearts. Your rewards are saved.', 'Try again', {secondary:true,results:true});
  announce(`${won?'Course complete':'Out of hearts'}. ${runStars} new stars and ${runCoins} coins.`); updateHUD(); $('play-button').focus({preventScroll:true});
}

let hudPercent=-1;
function tick(seconds) {
  const result=stepRooftop(game,seconds);
  if(result.jumped)audio.effect('jump');
  if(result.stars.length||result.checkpoint||result.fell||result.damaged||result.won){
    const reward=recordProgress();
    if(reward.starsEarned){showToast(`✦ A star for you! +${reward.coinsEarned} coins`);audio.effect('star');}
    else if(result.checkpoint){showToast('⚑ Checkpoint reached');audio.effect('checkpoint');}
    else if(result.fell&&!result.lost){showToast('−1 heart · back to your checkpoint');audio.effect('hurt');}
    else if(result.damaged&&!result.lost){showToast('−1 heart · back to your checkpoint');audio.effect('hurt');}
  }
  if(result.damaged)clearControls();
  if(result.boxRewards.length){
    const reward=result.boxRewards.at(-1);
    showToast(reward.type==='energy'?'+3 rainbow energy':reward.amount?'+1 heart':'Hearts already full');audio.effect('powerup');updateHUD();
  }else if(result.stomped.length){showToast('Cat cleared!');audio.effect('stomp');}
  else if(result.stunned.length){showToast('Cat stunned · jump on it!');audio.effect('stun');}
  const percent=roofPercent(game);if(percent!==hudPercent){hudPercent=percent;updateHUD();}
  if(result.won)finish();
  if(result.lost)finish(false);
}

function frame(time) {
  if (game.status === 'playing') {
    const elapsed = lastTime === null ? 0 : Math.max(0, (time - lastTime) / 1000);
    lastTime = time;
    if (elapsed > .25) pause('away');
    else {
      accumulator += Math.min(.1, elapsed);
      while (accumulator >= 1 / 120 && game.status === 'playing') { tick(1 / 120); accumulator -= 1 / 120; }
    }
  } else lastTime = time;
  drawRooftop(context,game,{costume:state.skins.equipped,breed:state.appearance.breed,reducedMotion});
  if (!reducedMotion && time < celebrationUntil) {
    const colors = ['#c2a163', '#b28e86', '#8ca884', '#87a9b0'];
    for (let i = 0; i < 38; i++) { context.fillStyle = colors[i % colors.length]; context.fillRect(i * 173 % ROOF.width, (time / 6 + i * 47) % ROOF.height, 5, 7); }
  }
  requestAnimationFrame(frame);
}

const moveKeys={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'};
const jumpKeys=[' ','ArrowUp','w'];
const heldKeys=new Set();
function syncMovement(){game.input.left=heldKeys.has('ArrowLeft')||heldKeys.has('a');game.input.right=heldKeys.has('ArrowRight')||heldKeys.has('d');}
function clearControls(){heldKeys.clear();clearRoofInput(game);}

document.addEventListener('keydown',event=>{
  if(document.querySelector('dialog[open]'))return;
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  if(event.target?.closest?.('a,input,textarea,select'))return;
  if(key===' '&&event.target?.closest?.('button'))return;
  if(key in moveKeys){event.preventDefault();if(game.status==='playing'){heldKeys.add(key);syncMovement();}return;}
  if(jumpKeys.includes(key)){
    event.preventDefault();if(event.repeat)return;
    if(game.status==='paused')return resume();
    if(game.status!=='playing')return start();
    jumpRooftop(game);return;
  }
  if(key==='x'&&game.status==='playing'){
    event.preventDefault();if(event.repeat)return;
    if(shootRooftop(game)){audio.effect('laser');updateHUD();}
    else if(game.energy===0)showToast('Need energy · hit a ? box from below');
    return;
  }
  if(['p','Escape'].includes(key)&&['playing','paused'].includes(game.status)){
    event.preventDefault();if(!event.repeat)return game.status==='playing'?pause():resume();
  }
});
document.addEventListener('keyup',event=>{
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  if(key in moveKeys){heldKeys.delete(key);syncMovement();}
  if(jumpKeys.includes(key))releaseRoofJump(game);
});
$('play-button').addEventListener('click', () => game.status === 'paused' ? resume() : start());
$('overlay-secondary').addEventListener('click', () => {
  if (game.status === 'paused') return start();
  else { persist(); window.location.href = './'; }
});
$('pause-button').addEventListener('click', () => pause());
for (const id of ['home-button', 'shop-link']) $(id).addEventListener('click', () => { pause(); persist(); });
for (const [button, dialog] of [['help-button', 'help-dialog'], ['collection-button', 'collection-dialog']]) {
  $(button).addEventListener('click', () => { pause(); $(dialog).showModal(); });
}
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
}));
for (const [id, setting] of [['sound-button', 'sound'], ['music-button', 'music']]) $(id).addEventListener('click', async () => {
  await audio.unlock(); state.settings[setting] = !state.settings[setting]; persist(); updateHUD(); audio.updateMusic();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause('away'); audio.updateMusic(); });
window.addEventListener('blur', () => pause('away'));
window.addEventListener('resize', () => { if (window.innerWidth < 1000) pause('away'); });
window.addEventListener('pageshow', refresh);
window.addEventListener('pagehide', () => { pause('away'); persist(); });
window.addEventListener('storage', event => { if ([ARCADE_KEY, LEGACY_SNAKE_KEY].includes(event.key)) refresh(); });
persist(); updateHUD(); requestAnimationFrame(frame);
