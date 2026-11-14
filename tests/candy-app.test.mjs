import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as candy from '../dist/candy-engine.mjs';
import * as arcade from '../dist/progress.mjs';
import * as art from '../dist/art.mjs';
import * as reactions from '../dist/cat-reactions.mjs';
import * as treats from '../dist/candy-art.mjs';
import * as costumes from '../dist/costumes.mjs';
import * as breeds from '../dist/breeds.mjs';
import * as candyMotion from '../dist/candy-motion.mjs';
import {changeCostume,changeBreed} from '../dist/wardrobe.mjs';

const seeded=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function fixture(saved={},failStorage=false){
  const values=new Map([[arcade.ARCADE_KEY,JSON.stringify(arcade.normalizeArcade(saved))]]);
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{if(failStorage)throw Error('full');values.set(key,value);}};
  const context2d=new Proxy({},{get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}});
  const nodes=new Map();
  const node=id=>{
    if(nodes.has(id))return nodes.get(id);
    const classes=new Set(),item={textContent:'',innerHTML:'',hidden:false,open:false,disabled:false,value:'',style:{},dataset:{},attributes:new Map(),events:new Map(),offsetWidth:400,
      addEventListener:(type,fn)=>item.events.set(type,fn),setAttribute:(key,value)=>item.attributes.set(key,value),
      classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name),add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name)},
      querySelector:selector=>node(`${id}:${selector}`),getContext:()=>context2d,focus:()=>{},
      closest:selector=>selector==='[data-cell]'&&item.dataset.cell!==undefined?item:null,
      showModal:()=>{item.open=true;},close:()=>{item.open=false;},
    };nodes.set(id,item);return item;
  };
  node('move-count').parentElement=node('moves');
  const cells=Array.from({length:64},(_,i)=>{const cell=node(`cell-${i}`);cell.dataset.cell=String(i);return cell;});
  const rows=[0,1,2].map(i=>node(`milestone-${i}`)),dialogs=[node('help-dialog'),node('collection-dialog')],documentEvents=new Map(),windowEvents=new Map();
  let pointerTarget=null;
  const document={hidden:false,getElementById:node,elementFromPoint:()=>pointerTarget,
    querySelector:selector=>selector==='dialog[open]'?dialogs.find(d=>d.open):null,
    querySelectorAll:selector=>({'[data-cell]':cells,'[data-milestone]':rows,'dialog':dialogs})[selector]||[],
    addEventListener:(type,fn)=>documentEvents.set(type,fn),
  };
  const window={innerWidth:1366,localStorage:storage,location:{href:''},addEventListener:(type,fn)=>windowEvents.set(type,fn)};
  let nextSeed=1,now=1000,nextTimer=1;const timers=new Map();
  const context=vm.createContext({...candy,...arcade,...art,...reactions,...treats,...costumes,...breeds,...candyMotion,createCandy:()=>candy.createCandy({random:seeded(nextSeed++)}),document,window,
    ArcadeAudio:class{async unlock(){}effect(){}updateMusic(){}},performance:{now:()=>now},setTimeout:(fn,delay)=>{const id=nextTimer++;timers.set(id,{fn,when:now+delay});return id;},clearTimeout:id=>timers.delete(id),console,
  });
  vm.runInContext(readFileSync(new URL('../dist/candy-app.mjs',import.meta.url),'utf8').replace(/^import .*?;\r?\n/gm,''),context);
  const run=expression=>vm.runInContext(expression,context),click=id=>node(id).events.get('click')();
  const playMove=()=>run(`{const move=findCandyMoves(game.board)[0];choose(move[0]);choose(move[1]);for(let i=0;i<20000&&game.phase!=='idle';i++)tick(.1);}`);
  const fullRound=()=>{for(let move=0;move<25&&run('game.status')==='playing';move++)playMove();};
  const elapse=ms=>{const end=now+ms;for(let i=0;i<1000;i++){const entry=[...timers].filter(([,t])=>t.when<=end).sort((a,b)=>a[1].when-b[1].when)[0];if(!entry)break;now=entry[1].when;timers.delete(entry[0]);entry[1].fn();}now=end;};
  return {node,cells,storage,document,window,documentEvents,windowEvents,run,click,playMove,fullRound,elapse,setPointerTarget:value=>{pointerTarget=value;}};
}
test('Candy Cat is playable from the arcade and uses the stable six-game save structure',()=>{
  const entry=arcade.GAMES.find(g=>g.id==='slingshot');assert.equal(entry.title,'Candy Cat');assert.equal(entry.available,true);
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert.match(html,/href="\.\/candy.html" aria-label="Play Candy Cat"/);assert.doesNotMatch(html,/Catapult Cats/);
  const app=fixture();assert.equal(app.cells.length,64);assert.equal(app.cells[0].disabled,true);assert.equal(app.node('move-count').textContent,25);
});
test('clicking neighboring treats plays a full real round, saves stars, and pays ten coins per new star',async()=>{
  const app=fixture();await app.click('play-button');app.fullRound();
  assert.ok(['won','finished'].includes(app.run('game.status')));const saved=arcade.loadArcade(app.storage),stars=saved.games.slingshot.stars;
  assert.ok(stars>=1);assert.equal(saved.wallet.coins,stars*10);assert.equal(saved.games.slingshot.best,app.run('game.score'));
  assert.equal(app.node('result-rewards').hidden,false);assert.match(app.node('result-rewards').innerHTML,new RegExp(`\\+${stars*10} coins`));
  const reloaded=fixture(saved);assert.equal(reloaded.node('star-count').textContent,stars);assert.equal(reloaded.node('wallet-count').textContent,stars*10);
});
test('fully collected replays still use 25 moves and cannot repay stars or coins',async()=>{
  const app=fixture({games:{slingshot:{stars:3}}});await app.click('play-button');assert.equal(app.run('game.moves'),25);app.fullRound();
  assert.equal(app.run('runStars'),0);assert.equal(app.run('runCoins'),0);assert.equal(arcade.loadArcade(app.storage).wallet.coins,30);assert.match(app.node('result-rewards').innerHTML,/All rewards collected/);
  app.click('overlay-secondary');assert.equal(app.window.location.href,'./');
});
test('an invalid click swap costs nothing, and selection, dragging, and keyboard input share the same rules',async()=>{
  const app=fixture();await app.click('play-button');
  app.run(`{const moves=findCandyMoves(game.board);let invalid;for(let a=0;a<63;a++)if(a%8<7&&!moves.some(([x,y])=>x===a&&y===a+1)){invalid=[a,a+1];break;}choose(invalid[0]);choose(invalid[1]);}`);
  assert.equal(app.run('game.moves'),25);assert.match(app.node('board-toast').textContent,/no move used/);app.elapse(300);
  const move=app.run('findCandyMoves(game.board)[0]');app.cells[move[0]].events.get('pointerdown')({button:0});app.setPointerTarget(app.cells[move[1]]);app.windowEvents.get('pointerup')({clientX:1,clientY:1});
  assert.equal(app.run('game.moves'),24);assert.equal(app.run('game.phase'),'clearing');
  app.run("for(let i=0;i<20000&&game.phase!=='idle';i++)tick(.1)");
  const press=(key,target,repeat=false)=>app.documentEvents.get('keydown')({key,target,repeat,preventDefault(){}});
  press('Enter',app.cells[0]);assert.equal(app.run('selected'),0);press('Enter',app.cells[0],true);assert.equal(app.run('selected'),0);
  press('ArrowRight',app.cells[0]);assert.equal(app.run('cursor'),1);press(' ',app.cells[0]);assert.equal(app.run('selected'),null);
});
test('pause, help, hidden tabs, blur, and narrow windows freeze a pending cascade',async()=>{
  const app=fixture();await app.click('play-button');app.run('trySwap(...findCandyMoves(game.board)[0])');
  app.click('pause-button');const before=app.run('JSON.stringify(game)');app.run('tick(.1)');assert.equal(app.run('JSON.stringify(game)'),before);
  await app.click('play-button');assert.equal(app.run('game.phase'),'clearing');
  app.click('help-button');assert.equal(app.run('game.status'),'paused');assert.equal(app.node('help-dialog').open,true);
  app.documentEvents.get('keydown')({key:'p',preventDefault(){}});assert.equal(app.run('game.status'),'paused');app.node('help-dialog').close();
  await app.click('play-button');app.document.hidden=true;app.documentEvents.get('visibilitychange')();assert.equal(app.run('game.status'),'paused');app.document.hidden=false;
  await app.click('play-button');app.windowEvents.get('blur')();assert.equal(app.run('game.status'),'paused');
  await app.click('play-button');app.window.innerWidth=999;app.windowEvents.get('resize')();assert.equal(app.run('game.status'),'paused');app.window.innerWidth=1366;
  await app.click('play-button');assert.equal(app.run('game.status'),'playing');
});
test('stars save before the round ends and survive a fresh round, preserving wardrobe and other games',async()=>{
  const app=fixture({profile:{name:'Player'},games:{snake:{stars:3},flappy:{stars:1}},wallet:{spent:20},skins:{owned:['original','sailor'],equipped:'sailor'},appearance:{breed:'orange'}});
  await app.click('play-button');for(let i=0;i<25&&app.run('state.games.slingshot.stars')===0;i++)app.playMove();
  const earned=app.run('state.games.slingshot.stars');assert.ok(earned>0);const saved=arcade.loadArcade(app.storage);assert.equal(saved.wallet.coins,20+earned*10);
  assert.equal(saved.profile.name,'Player');assert.equal(saved.appearance.breed,'orange');assert.equal(saved.skins.equipped,'sailor');assert.equal(saved.games.snake.stars,3);assert.equal(saved.games.flappy.stars,1);
  app.run('pause()');await app.click('overlay-secondary');assert.equal(app.run('game.score'),0);assert.equal(app.run('state.games.slingshot.stars'),earned);assert.equal(app.run('runCoins'),0);
});
test('failed saving is visible, retains rewards in memory, and cannot repay them on a retry',async()=>{
  const app=fixture({},true);await app.click('play-button');app.fullRound();const coins=app.run('state.wallet.coins');assert.ok(coins>0);assert.equal(app.node('save-status').hidden,false);
  await app.click('play-button');app.fullRound();assert.ok(app.run('state.wallet.coins')<=30);assert.equal(app.run('runCoins'),app.run('state.wallet.coins')-coins);
});
test('returning from the wardrobe refreshes the cat and newer stored rewards before paying a star',async()=>{
  const app=fixture({games:{snake:{stars:3}}});changeCostume(app.storage,'gardener',true);changeBreed(app.storage,'ragdoll');app.windowEvents.get('pageshow')();
  assert.equal(app.node('portrait-canvas').attributes.get('aria-label'),'Mochi wearing Garden Paws · Ragdoll');
  await app.click('play-button');const current=arcade.loadArcade(app.storage);current.games.slingshot={stars:3,best:2000,completed:true};arcade.saveArcade(app.storage,current);app.fullRound();
  assert.equal(app.run('runCoins'),0);assert.equal(arcade.loadArcade(app.storage).wallet.coins,50);assert.equal(arcade.loadArcade(app.storage).skins.equipped,'gardener');
});

test('scheduled animations resolve a swap on their own and pause preserves the remaining delay',async()=>{
  const app=fixture();await app.click('play-button');app.run('trySwap(...findCandyMoves(game.board)[0])');
  app.elapse(100);app.click('pause-button');const remaining=app.run('game.timer');assert.ok(remaining>.34&&remaining<.36);
  const before=app.run('JSON.stringify(game)');app.elapse(5000);assert.equal(app.run('JSON.stringify(game)'),before);
  await app.click('play-button');app.elapse(remaining*1000-10);assert.equal(app.run('game.score'),0);app.elapse(20);assert.ok(app.run('game.score')>0);
  app.elapse(15000);assert.equal(app.run('game.phase'),'idle');assert.equal(app.run('game.moves'),24);
});

test('a new round cancels an unfinished swap and an invalid swap cannot accept input during its return animation',async()=>{
  const app=fixture();await app.click('play-button');app.run('trySwap(...findCandyMoves(game.board)[0])');app.elapse(100);app.click('pause-button');await app.click('overlay-secondary');app.elapse(2000);
  assert.equal(app.run('game.score'),0);assert.equal(app.run('game.moves'),25);assert.equal(app.run('game.phase'),'idle');
  app.run(`{const moves=findCandyMoves(game.board);let pair;for(let a=0;a<63;a++)if(a%8<7&&!moves.some(([x,y])=>x===a&&y===a+1)){pair=[a,a+1];break;}trySwap(...pair);}`);
  assert.equal(app.run('rejecting'),true);app.run('trySwap(...findCandyMoves(game.board)[0])');assert.equal(app.run('game.moves'),25);app.elapse(300);assert.equal(app.run('rejecting'),false);app.run('trySwap(...findCandyMoves(game.board)[0])');assert.equal(app.run('game.moves'),24);
});

test('a free reshuffle keeps controls locked only for its visual transition and cannot award points',async()=>{
  const app=fixture();await app.click('play-button');app.run(`game.board=Array.from({length:64},(_,i)=>({id:i+1,color:(Math.floor(i/8)*2+i%8)%6,special:null}));game.phase='falling';game.timer=0;tick(.1);`);
  assert.equal(app.run('game.phase'),'falling');assert.equal(app.run('game.reshuffles'),1);assert.equal(app.run('game.score'),0);assert.equal(app.run('game.moves'),25);
  app.elapse(1000);assert.equal(app.run('game.phase'),'idle');assert.equal(app.run('game.score'),0);assert.equal(app.run('game.moves'),25);
});


test('the cat shares the saved player name and refreshes after a profile rename without changing costumes',()=>{
  const app=fixture({profile:{name:'Nova'},skins:{owned:['sailor'],equipped:'sailor'}});
  assert.equal(app.node('cat-name').textContent,'Nova');assert.match(app.node('portrait-canvas').attributes.get('aria-label'),/^Nova wearing Little Sailor/);
  const saved=arcade.loadArcade(app.storage);saved.profile.name='Luna';arcade.saveArcade(app.storage,saved,{profile:true});app.windowEvents.get('pageshow')();
  assert.equal(app.node('cat-name').textContent,'Luna');assert.match(app.node('portrait-canvas').attributes.get('aria-label'),/^Luna wearing Little Sailor/);assert.equal(arcade.loadArcade(app.storage).skins.equipped,'sailor');
});

test('real scoring waves trigger cat match, combo, and special reactions without changing reward rules',async()=>{
  const app=fixture({profile:{name:'Nova'},skins:{owned:['wizard'],equipped:'wizard'},appearance:{breed:'orange'}});await app.click('play-button');
  app.run("game.phase='clearing';game.timer=0;game.cascade=1;game.wave={indices:[0,1,2],creations:[],activated:[]};tick(.01)");assert.equal(app.run('catReactions.active.kind'),'match');
  app.run("game.phase='clearing';game.timer=0;game.cascade=2;game.wave={indices:[0,1,2],creations:[],activated:[]};tick(.01)");assert.equal(app.run('catReactions.active.kind'),'combo');assert.match(app.node('cat-reaction').textContent,/combo/);
  app.run("game.phase='clearing';game.timer=0;game.cascade=3;game.wave={indices:[0,1,2],creations:[{index:7,special:'rainbow'}],activated:[]};tick(.01)");assert.equal(app.run('catReactions.active.kind'),'special');assert.equal(app.run('catReactions.breed'),'orange');assert.equal(app.run('catReactions.costume'),'wizard');
  assert.equal(arcade.loadArcade(app.storage).wallet.coins,0);assert.equal(app.node('cat-name').textContent,'Nova');
});
test('cat reactions pause with Candy Cat, resume, and reset on a fresh round or departure',async()=>{
  const app=fixture();await app.click('play-button');app.playMove();assert.ok(app.run('catReactions.active'));
  app.click('pause-button');assert.equal(app.run('catReactions.paused'),true);const elapsed=app.run('catReactions.elapsed');app.elapse(500);assert.equal(app.run('catReactions.elapsed'),elapsed);
  await app.click('play-button');assert.equal(app.run('catReactions.paused'),false);app.windowEvents.get('pagehide')();assert.equal(app.run('catReactions.active'),null);assert.equal(app.run('catReactions.timer'),null);
  await app.click('overlay-secondary');assert.equal(app.run('catReactions.active'),null);assert.equal(app.node('cat-reaction').textContent,'A little sweet tooth.');
});
