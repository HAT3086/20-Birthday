import { CatReactions, candyCatReaction } from './cat-reactions.mjs';
import { CANDY, CANDY_STARS, createCandy, swapCandy, stepCandy, awardCandyProgress } from './candy-engine.mjs';
import { ARCADE_KEY, LEGACY_SNAKE_KEY, loadArcade, saveArcade, mergeArcade, normalizeArcade, playerCatName } from './progress.mjs';
import { drawTreat, treatLabel } from './candy-art.mjs';
import { drawSittingCat } from './art.mjs';
import { costumeFor } from './costumes.mjs';
import { breedFor } from './breeds.mjs';
import { ArcadeAudio } from './arcade-audio.mjs';
import { CandyMotion } from './candy-motion.mjs';

const $=id=>document.getElementById(id),grid=$('candy-grid');
const catReactions = new CatReactions($('portrait-canvas'), { label: $('cat-reaction'), profile: $('cat-companion'), idleLabel: 'A little sweet tooth.',
  mediaQuery: typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null,
  now: () => performance.now(), schedule: (fn, ms) => setTimeout(fn, ms), cancel: id => clearTimeout(id) });
let storage;try{storage=window.localStorage;}catch{storage=null;}
let state=loadArcade(storage),game=createCandy(),selected=null,cursor=0,dragStart=null,suppressClickUntil=0;
let runStars=0,runCoins=0,starting=false,toastTimer,invalidTimer,appearanceKey='',keyboardFocus=false,resolutionTimer=null,resolveAt=0,rejecting=false;
const audio=new ArcadeAudio(()=>state.settings,'slingshot');
const announce=message=>{$('live-announcement').textContent=message;};
grid.innerHTML=Array.from({length:64},(_,i)=>`<button type="button" class="candy-cell${(Math.floor(i/8)+i%8)%2?' shade':''}" data-cell="${i}" aria-pressed="false" tabindex="${i===0?0:-1}"><span class="candy-piece"><canvas width="64" height="64" aria-hidden="true"></canvas></span></button>`).join('');
const cells=[...document.querySelectorAll('[data-cell]')];
const motion=new CandyMotion(cells,{reducedMotion:typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches});
const painted=[];

function persist(){
  const ok=saveArcade(storage,state);if(ok)state=loadArcade(storage);
  $('save-status').hidden=ok;$('save-status').textContent=ok?'':'Saving unavailable. Rewards stay in this tab until you leave.';
  return ok;
}
function renderBoard(){
  grid.setAttribute('aria-busy',String(game.phase!=='idle'||rejecting));
  grid.classList.toggle('falling',game.phase==='falling');
  const clearing=new Set(game.wave?.indices||[]);
  cells.forEach((button,i)=>{
    button.disabled=game.status!=='playing'||game.phase!=='idle'||rejecting;
    button.tabIndex=i===cursor?0:-1;button.setAttribute('aria-pressed',String(selected===i));
    button.setAttribute('aria-label',`${treatLabel(game.board[i])}, row ${Math.floor(i/8)+1}, column ${i%8+1}`);
    button.classList.toggle('clearing',clearing.has(i));
    const tile=game.board[i],signature=`${tile.id}:${tile.color}:${tile.special}`;
    if(painted[i]!==signature){drawTreat(button.querySelector('canvas').getContext('2d'),tile);painted[i]=signature;}
  });
}
function updateHUD() {
  const catTitle = playerCatName(state);
  $('cat-name').textContent = catTitle;
  const progress=state.games.slingshot;
  $('score-count').textContent=game.score.toLocaleString('en-US');$('move-count').textContent=game.moves;
  $('move-count').parentElement.classList.toggle('low',game.moves<=5);
  $('best-count').textContent=progress.best.toLocaleString('en-US');$('wallet-count').textContent=state.wallet.coins;
  $('star-count').textContent=progress.stars;$('collection-stars').textContent=`${progress.stars} / 3`;$('collection-coins').textContent=`${progress.stars*10} / 30`;
  document.querySelectorAll('[data-milestone]').forEach((row,i)=>{
    const collected=i<progress.stars;row.classList.toggle('collected',collected);
    row.querySelector('.milestone-reward').innerHTML=collected?'Collected ✓':'+10 <svg class="icon"><use href="#icon-coin"/></svg>';
    row.setAttribute('aria-label',`${CANDY_STARS[i]} points: ${collected?'star collected':'star not yet collected'}`);
  });
  const target=CANDY_STARS[progress.stars]||CANDY.goal,previous=CANDY_STARS[progress.stars-1]||0;
  $('next-label').textContent=progress.stars===3?'Round goal':'Next star';
  $('next-progress').textContent=`${game.score.toLocaleString('en-US')} / ${target.toLocaleString('en-US')}`;
  $('milestone-fill').style.width=`${Math.max(0,Math.min(100,progress.stars===3?game.score/target*100:(game.score-previous)/(target-previous)*100))}%`;
  $('pause-button').hidden=game.status!=='playing';
  $('sound-button').setAttribute('aria-pressed',String(state.settings.sound));$('sound-button').setAttribute('aria-label',state.settings.sound?'Mute sound effects':'Enable sound effects');
  $('sound-button').querySelector('.mute-slash').hidden=state.settings.sound;$('music-button').setAttribute('aria-pressed',String(state.settings.music));
  const outfit=costumeFor(state.skins.equipped),breed=breedFor(state.appearance.breed),key=`${outfit.id}:${breed.id}:${catTitle}`;
  if(key!==appearanceKey){
    appearanceKey=key;catReactions.setAppearance(outfit.id,breed.id);
    drawSittingCat($('overlay-cat').getContext('2d'),120,120,outfit.id,breed.id);
    $('portrait-canvas').setAttribute('aria-label',`${catTitle} wearing ${outfit.name}${breed.id==='original'?'':` · ${breed.name}`}`);
  }
}
function showToast(message){
  clearTimeout(toastTimer);$('board-toast').textContent=message;$('board-toast').hidden=false;
  toastTimer=setTimeout(()=>{$('board-toast').hidden=true;},1800);announce(message);
}
function overlay(title,copy,action,{secondary=false,results=false}={}){
  $('game-overlay').hidden=false;$('overlay-title').textContent=title;$('overlay-copy').textContent=copy;
  $('play-button').innerHTML=`${action} <svg class="icon"><use href="#icon-arrow"/></svg>`;
  $('overlay-secondary').hidden=!secondary;$('overlay-secondary').textContent=game.status==='paused'?'Start a fresh round':'Back to arcade';
  $('result-rewards').hidden=!results;
  if(results)$('result-rewards').innerHTML=runStars
    ?`<span class="reward-chip">✦ +${runStars} ${runStars===1?'star':'stars'}</span><span class="reward-chip">+${runCoins} coins</span>`
    :`<span class="reward-chip replay">${state.games.slingshot.stars===3?'All rewards collected':'No new rewards this round'}</span>`;
}
function refresh(){state=mergeArcade(state,loadArcade(storage));updateHUD();audio.updateMusic();}
function cancelResolution(preserve=false){
  if(resolutionTimer!==null){
    clearTimeout(resolutionTimer);resolutionTimer=null;
    if(preserve&&game.phase!=='idle')game.timer=Math.max(0,(resolveAt-performance.now())/1000);
  }
}
function scheduleResolution(){
  cancelResolution();if(game.status!=='playing'||game.phase==='idle')return;
  const round=game,phase=game.phase;resolveAt=performance.now()+game.timer*1000;
  resolutionTimer=setTimeout(()=>{resolutionTimer=null;if(game===round&&game.status==='playing'&&game.phase===phase)tick(game.timer+.001);},Math.max(1,game.timer*1000));
}
async function start(){
  if(starting||window.innerWidth<1000)return;starting=true;
  try{
    await audio.unlock();if(document.hidden||window.innerWidth<1000)return;
    cancelResolution();clearTimeout(invalidTimer);rejecting=false;motion.reset();refresh();game=createCandy();game.status='playing';runStars=0;runCoins=0;selected=null;cursor=0;dragStart=null;keyboardFocus=false;
    clearTimeout(toastTimer);$('board-toast').hidden=true;$('game-overlay').hidden=true;catReactions.reset();
    audio.effect('start');audio.updateMusic();updateHUD();renderBoard();cells[0].focus({preventScroll:true});
    announce(`Candy Cat started. ${CANDY.moves} moves. Swap neighboring treats to match three.`);
  }finally{starting=false;}
}
function pause(reason='manual'){
  if(game.status!=='playing')return;
  cancelResolution(true);motion.pause();catReactions.pause();
  if(rejecting){clearTimeout(invalidTimer);rejecting=false;motion.reset();}
  game.status='paused';dragStart=null;selected=null;
  overlay('Paused',reason==='away'?'Paused while you were away.':'Continue when you’re ready.','Resume',{secondary:true});
  updateHUD();renderBoard();$('play-button').focus({preventScroll:true});
}
async function resume(){
  if(game.status!=='paused')return;await audio.unlock();if(document.hidden||window.innerWidth<1000)return;
  game.status='playing';$('game-overlay').hidden=true;updateHUD();renderBoard();motion.resume();catReactions.resume();audio.updateMusic();scheduleResolution();
  if(game.phase==='idle')cells[cursor].focus({preventScroll:true});
}
function recordScore(){
  const settings=state.settings;state=mergeArcade(state,loadArcade(storage));state.settings=settings;
  const reward=awardCandyProgress(state.games.slingshot,game.score);state.games.slingshot=reward.progress;state=normalizeArcade(state);
  runStars+=reward.starsEarned;runCoins+=reward.coinsEarned;persist();updateHUD();return reward;
}
function finish(){
  motion.reset();persist();const won=game.status==='won';audio.effect(won?'won':'lost');
  overlay(won?'How sweet it is!':'A sweet little round.',won?'2,000 points. Well played!':`${game.score.toLocaleString('en-US')} points. Your collected stars are safely saved.`,'Play again',{secondary:true,results:true});
  updateHUD();renderBoard();announce(`${won?'Victory':'Round complete'}. ${game.score} points. ${runStars} new stars and ${runCoins} coins.`);$('play-button').focus({preventScroll:true});
}
function tick(seconds){
  cancelResolution();
  const phase=game.phase,before=game.board.map(tile=>({...tile})),result=stepCandy(game,seconds);
  if(result.points){
    const reward=recordScore();
    catReactions.react(candyCatReaction(result));
    if(reward.starsEarned){showToast(`✦ +${reward.starsEarned} ${reward.starsEarned===1?'star':'stars'} · +${reward.coinsEarned} coins`);audio.effect('star');}
    else if(result.created.length){showToast(({row:'Striped treat!',column:'Striped treat!',rainbow:'Rainbow treat!',wrapped:'Wrapped treat!'})[result.created[0].special]);audio.effect('candy-special');}
    else if(result.cascade>1){showToast(`Sweet cascade · ×${Math.min(3,result.cascade)}`);audio.effect('candy-match');}
    else audio.effect(result.activated.length?'candy-special':'candy-match');
  }
  if(result.shuffled)showToast('A fresh mix · no move used');
  if(phase!==game.phase||result.points||result.shuffled){
    renderBoard();
    if(result.points&&game.phase==='falling')game.timer=motion.fall(before,game.board,result.created)/1000;
    else if(game.phase==='clearing'){motion.cascade(game.wave);if(!motion.reducedMotion)game.timer+=.02;}
    else if(result.shuffled){game.timer=motion.fall(before,game.board)/1000;game.phase='falling';renderBoard();}
    else motion.reset();
    if(keyboardFocus&&game.status==='playing'&&game.phase==='idle')cells[cursor].focus({preventScroll:true});
  }
  if(result.ended)finish();else scheduleResolution();
}
function trySwap(a,b){
  if(rejecting)return {valid:false,reason:'blocked'};
  const before=game.board.map(tile=>({...tile})),result=swapCandy(game,a,b);selected=null;dragStart=null;
  if(!result.valid&&result.reason==='no-match'){
    clearTimeout(invalidTimer);const duration=motion.reject(a,b);rejecting=duration>0;
    if(rejecting)invalidTimer=setTimeout(()=>{rejecting=false;motion.reset();renderBoard();if(keyboardFocus&&game.status==='playing')cells[cursor].focus({preventScroll:true});},duration);
    showToast('Try a match of three · no move used');
  }
  if(result.valid){$('board-toast').hidden=true;audio.effect('candy-swap');game.timer+=(motion.swapDuration+(motion.reducedMotion?0:20))/1000;}
  updateHUD();renderBoard();if(result.valid){motion.swapAndClear(before,game.board,game.wave);scheduleResolution();}return result;
}
function choose(index){
  if(game.status!=='playing'||game.phase!=='idle'||rejecting)return;
  cursor=index;
  if(selected===index)selected=null;
  else if(selected!==null&&Math.abs(selected%8-index%8)+Math.abs(Math.floor(selected/8)-Math.floor(index/8))===1)return trySwap(selected,index);
  else selected=index;
  renderBoard();
}
cells.forEach((button,index)=>{
  button.addEventListener('click',()=>{if(performance.now()<suppressClickUntil)return;choose(index);});
  button.addEventListener('pointerdown',event=>{if(event.button===0&&game.status==='playing'&&game.phase==='idle'){keyboardFocus=false;dragStart=index;}});
});
window.addEventListener('pointerup',event=>{
  if(dragStart===null)return;const from=dragStart;dragStart=null;
  const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-cell]');
  if(!target)return;const to=Number(target.dataset.cell);
  if(from!==to){suppressClickUntil=performance.now()+300;trySwap(from,to);}
});
window.addEventListener('pointercancel',()=>{dragStart=null;});
document.addEventListener('keydown',event=>{
  if(document.querySelector('dialog[open]')||event.target?.closest?.('a,input,textarea,select'))return;
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  if(['p','Escape'].includes(key)&&['playing','paused'].includes(game.status)){event.preventDefault();if(!event.repeat)return game.status==='playing'?pause():resume();}
  const cell=event.target?.closest?.('[data-cell]');
  if(!cell||game.status!=='playing'||game.phase!=='idle')return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key)){
    event.preventDefault();keyboardFocus=true;const at=Number(cell.dataset.cell),x=at%8,y=Math.floor(at/8);
    cursor=key==='ArrowLeft'?y*8+Math.max(0,x-1):key==='ArrowRight'?y*8+Math.min(7,x+1):key==='ArrowUp'?Math.max(0,y-1)*8+x:Math.min(7,y+1)*8+x;
    renderBoard();cells[cursor].focus({preventScroll:true});
  }else if(key==='Enter'||key===' '){event.preventDefault();keyboardFocus=true;if(!event.repeat)choose(Number(cell.dataset.cell));}
});
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
document.querySelectorAll('[data-guide]').forEach(canvas=>drawTreat(canvas.getContext('2d'),{color:0,special:canvas.dataset.guide}));
persist();updateHUD();renderBoard();
