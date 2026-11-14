import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as catris from '../dist/catris-engine.mjs';
import * as arcade from '../dist/progress.mjs';
import * as art from '../dist/art.mjs';
import * as reactions from '../dist/cat-reactions.mjs';
import * as scene from '../dist/catris-art.mjs';
import * as costumes from '../dist/costumes.mjs';
import * as breeds from '../dist/breeds.mjs';
import {changeBreed,changeCostume} from '../dist/wardrobe.mjs';
function fixture(saved={},storageWorks=true){
  const values=new Map([[arcade.ARCADE_KEY,JSON.stringify(arcade.normalizeArcade(saved))]]),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{if(!storageWorks)throw Error('full');values.set(key,value);}};
  const drawContext=new Proxy({},{get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}}),nodes=new Map();
  const node=id=>{
    if(nodes.has(id))return nodes.get(id);
    const element={id,textContent:'',innerHTML:'',hidden:false,open:false,style:{},dataset:{},events:new Map(),attributes:new Map(),
      getContext:()=>drawContext,focus:()=>{},setAttribute:(key,value)=>element.attributes.set(key,value),addEventListener:(type,fn)=>element.events.set(type,fn),
      querySelector:selector=>node(`${id}:${selector}`),classList:{toggle:()=>{}},showModal:()=>{element.open=true;},close:()=>{element.open=false;},
    };nodes.set(id,element);return element;
  };
  const rows=[0,1,2].map(i=>node(`milestone-${i}`)),dialogs=[node('help-dialog'),node('collection-dialog')],documentEvents=new Map(),windowEvents=new Map();
  const document={hidden:false,getElementById:node,querySelector:selector=>selector==='dialog[open]'?dialogs.find(d=>d.open):null,querySelectorAll:selector=>({'[data-milestone]':rows,dialog:dialogs})[selector]||[],addEventListener:(type,fn)=>documentEvents.set(type,fn)};
  const window={innerWidth:1366,localStorage:storage,location:{href:''},addEventListener:(type,fn)=>windowEvents.set(type,fn)};
  const context=vm.createContext({...catris,...arcade,...art,...reactions,...scene,...costumes,...breeds,document,window,ArcadeAudio:class{async unlock(){}effect(){}updateMusic(){}},matchMedia:()=>({matches:true}),performance:{now:()=>1000},setTimeout:()=>1,clearTimeout:()=>{},console});
  vm.runInContext(readFileSync(new URL('../dist/catris-app.mjs',import.meta.url),'utf8').replace(/^import .*?;\r?\n/gm,''),context);
  const run=expression=>vm.runInContext(expression,context),click=id=>node(id).events.get('click')();
  const clearLines=count=>{for(let i=0;i<count&&run('game.status')==='playing';i++)run(`game.board=Array.from({length:20},()=>Array(10).fill(null));game.board[19]=Array.from({length:10},(_,x)=>x===5?null:'O');game.active={id:game.nextId++,type:'I',rotation:1,x:3,y:-1};game.phase='active';handleResult(hardDropCatris(game),{hardDrop:true});for(let frame=0;frame<40;frame++)tick(1/120);`);};
  const key=(type,key,repeat=false)=>documentEvents.get(type)({key,repeat,preventDefault(){}});
  return {node,run,click,storage,document,window,documentEvents,windowEvents,clearLines,key};
}
test('Catris is the sixth playable game and exposes a working arcade link and next-piece preview',()=>{
  assert.equal(arcade.GAMES.filter(g=>g.available).length,6);assert.equal(arcade.GAMES.find(g=>g.id==='tetris').available,true);
  assert.match(readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),/href="\.\/catris.html" aria-label="Play Catris"/);
  const app=fixture();assert.match(app.node('next-canvas').attributes.get('aria-label'),/^Next piece: [IJLOSTZ]$/);assert.equal(app.node('line-count').textContent,'00');
});
test('line milestones pay thirty coins once and victory ends at fifteen lines',async()=>{
  const app=fixture();await app.click('play-button');app.clearLines(5);assert.equal(arcade.loadArcade(app.storage).wallet.coins,10);
  app.clearLines(5);assert.equal(arcade.loadArcade(app.storage).wallet.coins,20);app.clearLines(5);
  const saved=arcade.loadArcade(app.storage);assert.equal(app.run('game.status'),'won');assert.equal(app.node('line-count').textContent,'15');assert.equal(saved.games.tetris.stars,3);assert.equal(saved.games.tetris.best,15);assert.equal(saved.wallet.coins,30);assert.match(app.node('result-rewards').innerHTML,/\+30 coins/);
});
test('earned stars survive a loss, a fresh round, and reload; fully rewarded replays pay zero',async()=>{
  const app=fixture();await app.click('play-button');app.clearLines(5);
  app.run("game.active={id:1,type:'O',x:3,y:-1,rotation:0};game.board[1][4]='L';game.board[1][5]='L';handleResult(hardDropCatris(game));");assert.equal(app.run('game.status'),'lost');
  await app.click('play-button');app.clearLines(5);assert.equal(app.run('runCoins'),0);app.clearLines(10);assert.equal(app.run('runCoins'),20);assert.equal(arcade.loadArcade(app.storage).wallet.coins,30);
  await app.click('play-button');app.clearLines(15);assert.equal(app.run('runCoins'),0);assert.match(app.node('result-rewards').innerHTML,/All rewards collected/);
  const reloaded=fixture(arcade.loadArcade(app.storage));assert.equal(reloaded.node('star-count').textContent,3);assert.equal(reloaded.node('best-count').textContent,15);
  app.click('overlay-secondary');assert.equal(app.window.location.href,'./');
});
test('keyboard movement, rotation, soft drop, and a single hard drop work without operating-system repeat',async()=>{
  const app=fixture();await app.click('play-button');const x=app.run('game.active.x');app.key('keydown','ArrowLeft');assert.equal(app.run('game.active.x'),x-1);
  app.key('keydown','ArrowLeft',true);assert.equal(app.run('game.active.x'),x-1);app.key('keyup','ArrowLeft');assert.equal(app.run('game.input.left'),false);
  app.run("game.active={id:100,type:'T',x:3,y:3,rotation:0};");app.key('keydown','ArrowUp');assert.equal(app.run('game.active.rotation'),1);app.key('keydown','ArrowUp',true);assert.equal(app.run('game.active.rotation'),1);app.key('keydown','z');assert.equal(app.run('game.active.rotation'),0);
  app.key('keydown','ArrowDown');assert.equal(app.run('game.input.down'),true);app.key('keyup','ArrowDown');assert.equal(app.run('game.input.down'),false);
  app.key('keydown',' ');assert.equal(app.run('game.pieces'),1);app.key('keydown',' ',true);assert.equal(app.run('game.pieces'),1);
});
test('alternate movement keys aggregate correctly, and pausing clears all held input',async()=>{
  const app=fixture();await app.click('play-button');app.key('keydown','ArrowLeft');app.key('keydown','a');app.key('keyup','ArrowLeft');assert.equal(app.run('game.input.left'),true);
  app.key('keydown','p');assert.equal(app.run('game.status'),'paused');assert.equal(app.run('held.size'),0);assert.equal(app.run('game.input.left'),false);
  const before=app.run('JSON.stringify(game)');app.run('tick(.1)');assert.equal(app.run('JSON.stringify(game)'),before);
  await app.key('keydown','Escape');await Promise.resolve();assert.equal(app.run('game.status'),'playing');assert.equal(app.run('game.input.left'),false);
});
test('help, hiding, blur, narrow windows, and a delayed timer pause without dropping pieces',async()=>{
  const app=fixture();await app.click('play-button');app.click('help-button');assert.equal(app.run('game.status'),'paused');
  app.key('keydown','p');assert.equal(app.run('game.status'),'paused');app.node('help-dialog').close();await app.click('play-button');
  app.document.hidden=true;app.documentEvents.get('visibilitychange')();assert.equal(app.run('game.status'),'paused');app.document.hidden=false;await app.click('play-button');
  app.windowEvents.get('blur')();assert.equal(app.run('game.status'),'paused');await app.click('play-button');app.window.innerWidth=999;app.windowEvents.get('resize')();assert.equal(app.run('game.status'),'paused');app.window.innerWidth=1366;
  await app.click('play-button');app.run('lastTime=0;loop()');assert.equal(app.run('game.status'),'paused');
});
test('finishing the sixth game grants the all-six bonus without bonus coins or a cat-check star',async()=>{
  const games=Object.fromEntries(arcade.GAMES.filter(g=>g.id!=='tetris').map(({id})=>[id,{stars:3,completed:true}]));
  const app=fixture({profile:{name:'Player'},games,skins:{owned:['original','sailor'],equipped:'sailor'},wallet:{spent:20},appearance:{breed:'orange'}});await app.click('play-button');app.clearLines(5);
  const saved=arcade.loadArcade(app.storage);assert.equal(saved.bonuses.completion,true);assert.equal(saved.bonuses.welcome,false);assert.equal(saved.wallet.earned,160);assert.equal(saved.wallet.coins,140);assert.equal(arcade.totalStars(saved),17);
  assert.equal(saved.profile.name,'Player');assert.equal(saved.skins.equipped,'sailor');assert.equal(saved.appearance.breed,'orange');assert.equal(saved.games.platformer.stars,3);
  app.windowEvents.get('pageshow')();assert.equal(arcade.loadArcade(app.storage).wallet.coins,140);
});
test('save failures retain nonrepeatable rewards in the tab and show a visible warning',async()=>{
  const app=fixture({},false);await app.click('play-button');app.clearLines(5);assert.equal(app.node('save-status').hidden,false);assert.equal(app.node('wallet-count').textContent,10);
  app.click('pause-button');await app.click('overlay-secondary');app.clearLines(5);assert.equal(app.node('wallet-count').textContent,10);assert.equal(app.run('runCoins'),0);
});
test('wardrobe and newer saved progress refresh before a star can be paid again',async()=>{
  const app=fixture({games:{snake:{stars:3}}});changeCostume(app.storage,'gardener',true);changeBreed(app.storage,'ragdoll');app.windowEvents.get('pageshow')();
  assert.equal(app.node('portrait-canvas').attributes.get('aria-label'),'Mochi wearing Garden Paws · Ragdoll');await app.click('play-button');
  const newer=arcade.loadArcade(app.storage);newer.games.tetris={stars:3,best:30,completed:true};arcade.saveArcade(app.storage,newer);app.clearLines(5);assert.equal(app.run('runCoins'),0);assert.equal(arcade.loadArcade(app.storage).wallet.coins,50);
});

test('old thirty-line saves keep their stars, coins, and costume after the shorter finish',async()=>{
  const app=fixture({games:{tetris:{stars:3,best:30}},skins:{owned:['original','sailor'],equipped:'sailor'},wallet:{spent:20}});
  assert.equal(app.node('best-count').textContent,15);assert.equal(app.node('star-count').textContent,3);assert.equal(app.node('wallet-count').textContent,10);
  await app.click('play-button');app.clearLines(15);const saved=arcade.loadArcade(app.storage);
  assert.equal(app.run('game.status'),'won');assert.equal(app.run('runCoins'),0);assert.equal(saved.games.tetris.best,15);assert.equal(saved.wallet.coins,10);assert.equal(saved.wallet.spent,20);assert.equal(saved.skins.equipped,'sailor');
});


test('the cat shares the saved player name and refreshes after a profile rename without changing costumes',()=>{
  const app=fixture({profile:{name:'Nova'},skins:{owned:['sailor'],equipped:'sailor'}});
  assert.equal(app.node('cat-name').textContent,'Nova');assert.match(app.node('portrait-canvas').attributes.get('aria-label'),/^Nova wearing Little Sailor/);
  const saved=arcade.loadArcade(app.storage);saved.profile.name='Luna';arcade.saveArcade(app.storage,saved,{profile:true});app.windowEvents.get('pageshow')();
  assert.equal(app.node('cat-name').textContent,'Luna');assert.match(app.node('portrait-canvas').attributes.get('aria-label'),/^Luna wearing Little Sailor/);assert.equal(arcade.loadArcade(app.storage).skins.equipped,'sailor');
});

test('single, double, triple, and four-line removals produce increasingly lively cat reactions',async()=>{
  for(const count of [1,2,3,4]){
    const app=fixture({profile:{name:'Nova'},skins:{owned:['sailor'],equipped:'sailor'},appearance:{breed:'ragdoll'}});await app.click('play-button');
    app.run(`game.board=Array.from({length:20},(_,y)=>Array.from({length:10},(_,x)=>y>=20-${count}&&x!==5?'J':null));game.active={id:game.nextId++,type:'I',rotation:1,x:3,y:-1};handleResult(hardDropCatris(game));for(let frame=0;frame<40;frame++)tick(1/120)`);
    assert.equal(app.run('game.lines'),count);assert.equal(app.run('catReactions.active.kind'),count===4?'four-lines':count>1?'multi-line':'line');assert.equal(app.run('catReactions.costume'),'sailor');assert.equal(app.run('catReactions.breed'),'ragdoll');assert.equal(arcade.loadArcade(app.storage).wallet.coins,0);
  }
});
test('Catris reactions pause and resume with play; the final clear can finish celebrating after victory',async()=>{
  const app=fixture();await app.click('play-button');app.clearLines(1);app.click('pause-button');assert.equal(app.run('catReactions.paused'),true);
  await app.click('play-button');assert.equal(app.run('catReactions.paused'),false);app.clearLines(14);assert.equal(app.run('game.status'),'won');assert.equal(app.run('catReactions.active.kind'),'line');assert.equal(arcade.loadArcade(app.storage).wallet.coins,30);
  app.document.hidden=true;app.documentEvents.get('visibilitychange')();assert.equal(app.run('catReactions.paused'),true);app.windowEvents.get('pagehide')();assert.equal(app.run('catReactions.active'),null);assert.equal(app.run('catReactions.timer'),null);
});
