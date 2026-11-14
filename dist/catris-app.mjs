import { CatReactions, catrisCatReaction } from './cat-reactions.mjs';
import { CATRIS, CATRIS_STARS, createCatris, setCatrisInput, clearCatrisInput, rotateCatris, hardDropCatris, stepCatris, catrisLevel, awardCatrisProgress } from './catris-engine.mjs';
import { ARCADE_KEY, LEGACY_SNAKE_KEY, loadArcade, saveArcade, mergeArcade, normalizeArcade, playerCatName } from './progress.mjs';
import { drawCatris, drawCatrisPreview } from './catris-art.mjs';
import { drawSittingCat } from './art.mjs';
import { costumeFor } from './costumes.mjs';
import { breedFor } from './breeds.mjs';
import { ArcadeAudio } from './arcade-audio.mjs';

const $=id=>document.getElementById(id),canvas=$('game-canvas'),context=canvas.getContext('2d');
const catReactions = new CatReactions($('portrait-canvas'), { label: $('cat-reaction'), profile: $('cat-companion'), idleLabel: 'A tidy little stack.',
  mediaQuery: typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null,
  now: () => performance.now(), schedule: (fn, ms) => setTimeout(fn, ms), cancel: id => clearTimeout(id) });
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches,held=new Set();
let storage;try{storage=window.localStorage;}catch{storage=null;}
let state=loadArcade(storage),game=createCatris(),runStars=0,runCoins=0,starting=false,loopTimer=null,lastTime=null,toastTimer,appearanceKey='',previewType='';
const audio=new ArcadeAudio(()=>state.settings,'tetris'),announce=message=>{$('live-announcement').textContent=message;};
function persist(){
  const ok=saveArcade(storage,state);if(ok)state=loadArcade(storage);
  $('save-status').hidden=ok;$('save-status').textContent=ok?'':'Saving unavailable. Rewards stay in this tab until you leave.';return ok;
}
function updateHUD() {
  const catTitle = playerCatName(state);
  $('cat-name').textContent = catTitle;
  const progress=state.games.tetris;
  $('line-count').textContent=String(game.lines).padStart(2,'0');$('score-count').textContent=game.score.toLocaleString('en-US');$('level-count').textContent=catrisLevel(game);
  $('best-count').textContent=progress.best;$('wallet-count').textContent=state.wallet.coins;$('star-count').textContent=progress.stars;
  $('collection-stars').textContent=`${progress.stars} / 3`;$('collection-coins').textContent=`${progress.stars*10} / 30`;
  document.querySelectorAll('[data-milestone]').forEach((row,i)=>{
    const collected=i<progress.stars;row.classList.toggle('collected',collected);
    row.querySelector('.milestone-reward').innerHTML=collected?'Collected ✓':'+10 <svg class="icon"><use href="#icon-coin"/></svg>';
    row.setAttribute('aria-label',`${CATRIS_STARS[i]} lines: ${collected?'star collected':'star not yet collected'}`);
  });
  const target=CATRIS_STARS[progress.stars]||CATRIS.goal,previous=CATRIS_STARS[progress.stars-1]||0;
  $('next-label').textContent=progress.stars===3?'Round goal':'Next star';$('next-progress').textContent=`${game.lines} / ${target} lines`;
  $('milestone-fill').style.width=`${Math.max(0,Math.min(100,progress.stars===3?game.lines/CATRIS.goal*100:(game.lines-previous)/(target-previous)*100))}%`;
  $('pause-button').hidden=game.status!=='playing';$('sound-button').setAttribute('aria-pressed',String(state.settings.sound));
  $('sound-button').setAttribute('aria-label',state.settings.sound?'Mute sound effects':'Enable sound effects');$('sound-button').querySelector('.mute-slash').hidden=state.settings.sound;
  $('music-button').setAttribute('aria-pressed',String(state.settings.music));
  if(previewType!==game.next){previewType=game.next;drawCatrisPreview($('next-canvas').getContext('2d'),game.next);$('next-canvas').setAttribute('aria-label',`Next piece: ${game.next}`);}
  const outfit=costumeFor(state.skins.equipped),breed=breedFor(state.appearance.breed),key=`${outfit.id}:${breed.id}:${catTitle}`;
  if(key!==appearanceKey){appearanceKey=key;catReactions.setAppearance(outfit.id,breed.id);drawSittingCat($('overlay-cat').getContext('2d'),120,120,outfit.id,breed.id);$('portrait-canvas').setAttribute('aria-label',`${catTitle} wearing ${outfit.name}${breed.id==='original'?'':` · ${breed.name}`}`);}
  canvas.setAttribute('aria-label',`Catris board, ${game.lines} of ${CATRIS.goal} lines cleared. ${game.active?`Current piece ${game.active.type}. `:''}Left and right move, up rotates, down soft drops, and Space hard drops. P pauses.`);
}
function draw(){drawCatris(context,game,{reducedMotion});}
function showToast(message){clearTimeout(toastTimer);$('board-toast').textContent=message;$('board-toast').hidden=false;toastTimer=setTimeout(()=>{$('board-toast').hidden=true;},2000);announce(message);}
function overlay(title,copy,action,{secondary=false,results=false}={}){
  $('game-overlay').hidden=false;$('overlay-title').textContent=title;$('overlay-copy').textContent=copy;$('play-button').innerHTML=`${action} <svg class="icon"><use href="#icon-arrow"/></svg>`;
  $('overlay-secondary').hidden=!secondary;$('overlay-secondary').textContent=game.status==='paused'?'Start a fresh round':'Back to arcade';$('result-rewards').hidden=!results;
  if(results)$('result-rewards').innerHTML=runStars?`<span class="reward-chip">✦ +${runStars} ${runStars===1?'star':'stars'}</span><span class="reward-chip">+${runCoins} coins</span>`:`<span class="reward-chip replay">${state.games.tetris.stars===3?'All rewards collected':'No new rewards this round'}</span>`;
}
function stopLoop(){if(loopTimer!==null)clearTimeout(loopTimer);loopTimer=null;}
function startLoop(){stopLoop();lastTime=performance.now();loopTimer=setTimeout(loop,16);}
function clearInput(){held.clear();clearCatrisInput(game);}
function refresh(){state=mergeArcade(state,loadArcade(storage));updateHUD();draw();audio.updateMusic();}
async function start(){
  if(starting||window.innerWidth<1000)return;starting=true;
  try{
    await audio.unlock();if(document.hidden||window.innerWidth<1000)return;
    stopLoop();clearInput();refresh();game=createCatris();game.status='playing';runStars=0;runCoins=0;
    clearTimeout(toastTimer);$('board-toast').hidden=true;$('game-overlay').hidden=true;catReactions.reset();
    audio.effect('start');audio.updateMusic();updateHUD();draw();startLoop();canvas.focus({preventScroll:true});announce(`Catris started. Clear ${CATRIS.goal} lines. Arrow keys move and turn; Space hard drops.`);
  }finally{starting=false;}
}
function pause(reason='manual'){
  if(game.status!=='playing')return;catReactions.pause();stopLoop();clearInput();game.status='paused';lastTime=null;
  overlay('Paused',reason==='away'?'Paused while you were away.':'Continue when you’re ready.','Resume',{secondary:true});updateHUD();draw();$('play-button').focus({preventScroll:true});
}
async function resume(){
  if(game.status!=='paused')return;await audio.unlock();if(document.hidden||window.innerWidth<1000)return;
  clearInput();game.status='playing';catReactions.resume();$('game-overlay').hidden=true;updateHUD();draw();audio.updateMusic();startLoop();canvas.focus({preventScroll:true});
}
function recordLines(){
  const settings=state.settings;state=mergeArcade(state,loadArcade(storage));state.settings=settings;
  const reward=awardCatrisProgress(state.games.tetris,game.lines);state.games.tetris=reward.progress;state=normalizeArcade(state);
  runStars+=reward.starsEarned;runCoins+=reward.coinsEarned;persist();updateHUD();return reward;
}
function finish(won){
  stopLoop();clearInput();persist();audio.effect(won?'won':'lost');
  overlay(won?'A purrfect fit!':'A little too tall.',won?`${CATRIS.goal} lines. A lovely little finish.`:`${game.lines} ${game.lines===1?'line':'lines'} cleared. Your collected stars stay saved.`,'Play again',{secondary:true,results:true});
  updateHUD();draw();announce(`${won?'Victory':'Run ended'}. ${game.lines} lines, ${runStars} new stars and ${runCoins} coins.`);$('play-button').focus({preventScroll:true});
}
function handleResult(result,{hardDrop=false}={}){
  if(result.locked)audio.effect(hardDrop?'catris-drop':'catris-lock');
  if(result.cleared){
    const reward=recordLines();catReactions.react(catrisCatReaction(result));
    if(reward.starsEarned){showToast(`✦ +${reward.starsEarned} ${reward.starsEarned===1?'star':'stars'} · +${reward.coinsEarned} coins`);audio.effect('star');}
    else{showToast(`${result.cleared===4?'Purrfect! · ':''}${result.cleared} ${result.cleared===1?'line':'lines'} cleared`);audio.effect('catris-clear');}
  }
  if(result.locked||result.spawned||result.cleared)updateHUD();
  if(result.won||result.lost)finish(result.won);
}
function tick(seconds){const result=stepCatris(game,seconds);handleResult(result);draw();return result;}
function loop(){
  loopTimer=null;if(game.status!=='playing')return;
  const now=performance.now(),elapsed=lastTime===null?0:Math.max(0,(now-lastTime)/1000);lastTime=now;
  if(elapsed>.75){pause('away');return;}
  tick(Math.min(.1,elapsed));if(game.status==='playing')loopTimer=setTimeout(loop,16);
}
function syncInput(){return setCatrisInput(game,{left:held.has('ArrowLeft')||held.has('a'),right:held.has('ArrowRight')||held.has('d'),down:held.has('ArrowDown')||held.has('s')});}
document.addEventListener('keydown',event=>{
  if(document.querySelector('dialog[open]')||event.target?.closest?.('a,input,textarea,select'))return;
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  if(['p','Escape'].includes(key)&&['playing','paused'].includes(game.status)){event.preventDefault();if(!event.repeat)return game.status==='playing'?pause():resume();}
  if(game.status!=='playing')return;
  if(['ArrowLeft','ArrowRight','ArrowDown','a','d','s'].includes(key)){
    event.preventDefault();if(!event.repeat){held.add(key);if(syncInput())audio.effect('catris-move');draw();}
  }else if(['ArrowUp','x','z'].includes(key)){
    event.preventDefault();if(!event.repeat&&rotateCatris(game,key==='z'?-1:1)){audio.effect('catris-turn');draw();updateHUD();}
  }else if(key===' '&&!event.target?.closest?.('button')){
    event.preventDefault();if(!event.repeat){handleResult(hardDropCatris(game),{hardDrop:true});draw();}
  }
});
document.addEventListener('keyup',event=>{
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  if(held.has(key)){held.delete(key);syncInput();draw();}
});
canvas.addEventListener('pointerdown',()=>canvas.focus({preventScroll:true}));
$('play-button').addEventListener('click',()=>game.status==='paused'?resume():start());
$('overlay-secondary').addEventListener('click',()=>{if(game.status==='paused')return start();persist();window.location.href='./';});
$('pause-button').addEventListener('click',()=>pause());
for(const id of ['home-button','shop-link'])$(id).addEventListener('click',()=>{pause();persist();});
for(const [button,dialog]of [['help-button','help-dialog'],['collection-button','collection-dialog']])$(button).addEventListener('click',()=>{pause();$(dialog).showModal();});
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}));
for(const [id,setting]of [['sound-button','sound'],['music-button','music']])$(id).addEventListener('click',async()=>{await audio.unlock();state.settings[setting]=!state.settings[setting];persist();updateHUD();audio.updateMusic();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause('away');catReactions.pause();}else if(game.status!=='paused')catReactions.resume();audio.updateMusic();});
window.addEventListener('blur',()=>{pause('away');catReactions.pause();});window.addEventListener('focus',()=>{if(game.status!=='paused'&&!document.hidden)catReactions.resume();});window.addEventListener('resize',()=>{if(window.innerWidth<1000){pause('away');catReactions.pause();}else if(game.status!=='paused')catReactions.resume();});
window.addEventListener('pageshow',refresh);window.addEventListener('pagehide',()=>{pause('away');catReactions.reset();persist();});
window.addEventListener('storage',event=>{if([ARCADE_KEY,LEGACY_SNAKE_KEY].includes(event.key))refresh();});
persist();updateHUD();draw();
