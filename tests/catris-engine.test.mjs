import test from 'node:test';
import assert from 'node:assert/strict';
import {CATRIS,CATRIS_PIECES,CATRIS_STARS,createCatris,catrisCells,catrisFits,catrisGhostY,catrisInterval,catrisLevel,moveCatris,rotateCatris,setCatrisInput,clearCatrisInput,hardDropCatris,stepCatris,awardCatrisProgress,normalizeCatrisProgress} from '../dist/catris-engine.mjs';
const seeded=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const empty=()=>Array.from({length:20},()=>Array(10).fill(null));
const play=(seed=1)=>{const game=createCatris({random:seeded(seed)});game.status='playing';return game;};
const advance=(game,seconds)=>{const events=[];for(let i=0;i<Math.ceil(seconds*120);i++)events.push(stepCatris(game,1/120));return events;};
export function prepareCatrisClear(game,count=1){
  game.board=empty();for(let y=20-count;y<20;y++)game.board[y]=Array.from({length:10},(_,x)=>x===5?null:'O');
  game.active={id:game.nextId++,type:'I',rotation:1,x:3,y:-1};game.phase='active';game.gravity=0;game.lock=0;
}
test('Catris opens on an empty 10 by 20 board with all seven shapes in each shuffled bag',()=>{
  assert.deepEqual(CATRIS_STARS,[5,10,15]);const game=createCatris({random:()=>.4});assert.equal(game.board.length,20);assert.ok(game.board.every(r=>r.length===10&&r.every(v=>v===null)));assert.equal(game.status,'ready');
  game.status='playing';const sequence=[];for(let i=0;i<28;i++){sequence.push(game.active.type);game.board=empty();hardDropCatris(game);}
  for(let i=0;i<4;i++)assert.deepEqual(sequence.slice(i*7,i*7+7).sort(),[...CATRIS_PIECES].sort());
  for(const type of CATRIS_PIECES){const cells=catrisCells({type,rotation:0});assert.equal(cells.length,4);assert.equal(new Set(cells.map(c=>c.join(','))).size,4);}
});
test('gravity starts gently, soft drop is faster, and the speed remains capped',()=>{
  const normal=play(),soft=play(),start=normal.active.y;advance(normal,.8);assert.equal(normal.active.y,start);advance(normal,.1);assert.equal(normal.active.y,start+1);
  setCatrisInput(soft,{down:true});advance(soft,.3);assert.ok(soft.active.y>=start+6);
  setCatrisInput(normal,{down:true});assert.equal(normal.gravity,0);assert.equal(catrisInterval(play()),.85);
  const late=play();late.lines=29;assert.equal(catrisInterval(late),.35);assert.equal(catrisLevel(late),6);
});
test('horizontal input moves immediately, repeats after a delay, stops on release, and respects both walls',()=>{
  const game=play();const initial=game.active.x;assert.equal(setCatrisInput(game,{left:true}),true);assert.equal(game.active.x,initial-1);advance(game,.12);assert.equal(game.active.x,initial-1);
  advance(game,.4);assert.ok(game.active.x<initial-1);clearCatrisInput(game);const at=game.active.x;advance(game,.3);assert.equal(game.active.x,at);
  for(let i=0;i<20;i++)moveCatris(game,-1);assert.ok(catrisCells(game.active).every(([x])=>x+game.active.x>=0));
  for(let i=0;i<30;i++)moveCatris(game,1);assert.ok(catrisCells(game.active).every(([x])=>x+game.active.x<10));
});
test('rotations return to the original shape and can nudge away from a wall or floor',()=>{
  const game=play();game.active={id:1,type:'T',x:3,y:3,rotation:0};const original=JSON.stringify(catrisCells(game.active));
  for(let i=0;i<4;i++)assert.equal(rotateCatris(game),true);assert.equal(JSON.stringify(catrisCells(game.active)),original);
  rotateCatris(game,-1);assert.equal(game.active.rotation,3);
  game.active={id:2,type:'I',x:-2,y:3,rotation:1};assert.equal(catrisFits(game,game.active),true);assert.equal(rotateCatris(game),true);assert.ok(game.active.x>=0);
  game.active={id:3,type:'I',x:3,y:18,rotation:0};assert.equal(rotateCatris(game),true);assert.ok(catrisCells(game.active).every(([,y])=>y+game.active.y<20));
  game.active={id:4,type:'O',x:3,y:5,rotation:0};assert.equal(rotateCatris(game),false);
});
test('a blocked rotation leaves the piece intact, and squares and stacks never overlap',()=>{
  const game=play();game.active={id:1,type:'T',x:3,y:6,rotation:0};game.board=Array.from({length:20},()=>Array(10).fill('O'));
  for(const [x,y]of catrisCells(game.active))game.board[y+6][x+3]=null;
  const before=JSON.stringify(game.active);assert.equal(rotateCatris(game),false);assert.equal(JSON.stringify(game.active),before);assert.equal(moveCatris(game,1),false);
});
test('the ghost predicts the hard drop exactly, which locks one piece and advances the next preview',()=>{
  const game=play(),type=game.active.type,next=game.next,y=catrisGhostY(game),cells=catrisCells(game.active).map(([x,dy])=>[x+game.active.x,y+dy]);
  const event=hardDropCatris(game);assert.equal(event.locked,true);assert.equal(game.pieces,1);assert.equal(game.active.type,next);
  for(const [x,y]of cells)assert.equal(game.board[y][x],type);assert.equal(game.board.flat().filter(Boolean).length,4);
});
test('the landing delay allows adjustments but its reset cap prevents holding a piece forever',()=>{
  const game=play();game.active={id:1,type:'O',x:3,y:18,rotation:0};advance(game,.3);assert.equal(game.pieces,0);
  moveCatris(game,1);assert.equal(game.lock,0);advance(game,.3);assert.equal(game.pieces,0);
  game.resets=CATRIS.lockResets;game.lock=.4;moveCatris(game,-1);assert.equal(game.lock,.4);advance(game,.06);assert.equal(game.pieces,1);
});
test('single, double, triple, and four-line clears animate before collapsing and award the expected score',()=>{
  for(const count of [1,2,3,4]){
    const game=play();prepareCatrisClear(game,count);const drop=hardDropCatris(game);assert.equal(drop.clearStarted,count);assert.equal(game.phase,'clearing');assert.equal(game.lines,0);
    assert.equal(hardDropCatris(game).locked,false);assert.equal(rotateCatris(game),false);advance(game,.2);assert.equal(game.lines,0);
    const events=advance(game,.11);assert.equal(game.lines,count);assert.equal(game.phase,'active');assert.equal(game.board.length,20);assert.equal(game.score,[0,100,300,500,800][count]);assert.ok(events.some(e=>e.cleared===count));
  }
});
test('fifteen lines caps an overshooting clear at victory and no more input can change the run',()=>{
  const game=play();game.lines=14;prepareCatrisClear(game,4);hardDropCatris(game);const events=advance(game,.31);assert.equal(game.status,'won');assert.equal(game.lines,15);assert.ok(events.some(e=>e.won));
  const before=JSON.stringify(game);hardDropCatris(game);rotateCatris(game);moveCatris(game,1);advance(game,2);assert.equal(JSON.stringify(game),before);
});
test('locking above the top or a blocked spawn ends the run without erasing previous lines',()=>{
  const game=play();game.lines=5;game.active={id:1,type:'O',x:3,y:-1,rotation:0};game.board[1][4]='L';game.board[1][5]='L';assert.equal(catrisFits(game,game.active),true);
  assert.equal(hardDropCatris(game).lost,true);assert.equal(game.status,'lost');assert.equal(game.lines,5);assert.equal(game.board.flat().filter(Boolean).length,2);
  const spawn=play();spawn.active={id:1,type:'I',x:0,y:10,rotation:0};spawn.next='O';spawn.board[0][4]='L';assert.equal(hardDropCatris(spawn).lost,true);assert.equal(spawn.status,'lost');
});
test('pause freezes gravity, repeats, lock delay, and line clear timers',()=>{
  for(const clearing of [false,true]){
    const game=play();if(clearing){prepareCatrisClear(game,2);hardDropCatris(game);}game.status='paused';const before=JSON.stringify(game);
    advance(game,3);hardDropCatris(game);rotateCatris(game);moveCatris(game,1);setCatrisInput(game,{left:true});assert.equal(JSON.stringify(game),before);
  }
});
function placement(game){
  let best=null;
  for(let rotation=0;rotation<(game.active.type==='O'?1:4);rotation++)for(let x=-3;x<10;x++){
    const piece={...game.active,x,rotation};if(!catrisFits(game,piece))continue;
    const y=catrisGhostY({...game,active:piece}),cells=catrisCells(piece).map(([dx,dy])=>[x+dx,y+dy]);if(cells.some(([,y])=>y<0))continue;
    let board=game.board.map(row=>[...row]);for(const [cx,cy]of cells)board[cy][cx]=piece.type;
    const cleared=board.filter(row=>row.every(Boolean)).length;board=board.filter(row=>!row.every(Boolean));while(board.length<20)board.unshift(Array(10).fill(null));
    let holes=0;const heights=Array.from({length:10},(_,x)=>{let top=20;for(let y=0;y<20;y++){if(board[y][x]&&top===20)top=y;if(!board[y][x]&&top<20)holes++;}return 20-top;});
    const bump=heights.slice(1).reduce((sum,h,i)=>sum+Math.abs(h-heights[i]),0),cost=holes*8+heights.reduce((a,b)=>a+b,0)*.5+bump*.35+Math.max(...heights)*.7-cleared*8;
    if(!best||cost<best.cost)best={rotation,x,cost};
  }
  return best;
}
test('real rotations, sideways moves, and hard drops can reach all three stars across seeded runs',()=>{
  for(const seed of [1,7,20]){
    const game=play(seed);
    for(let turn=0;turn<500&&game.status==='playing';turn++){
      const choice=placement(game);assert.ok(choice,'a safe placement should exist');
      for(let turn=0;turn<choice.rotation;turn++)rotateCatris(game);
      for(let moves=0;moves<15&&game.active.x!==choice.x;moves++)assert.equal(moveCatris(game,Math.sign(choice.x-game.active.x)),true);
      hardDropCatris(game);if(game.phase==='clearing')advance(game,.31);
    }
    assert.equal(game.status,'won',`seed ${seed}: ${game.lines} lines in ${game.pieces} pieces`);assert.equal(game.lines,15);
  }
});
test('line rewards are monotonic, bounded, and never repay a collected star',()=>{
  assert.equal(awardCatrisProgress({},4).coinsEarned,0);const first=awardCatrisProgress({},5);assert.equal(first.coinsEarned,10);assert.equal(awardCatrisProgress(first.progress,5).coinsEarned,0);
  assert.equal(awardCatrisProgress(first.progress,10).coinsEarned,10);assert.equal(awardCatrisProgress(first.progress,15).coinsEarned,20);
  assert.deepEqual(normalizeCatrisProgress({stars:2,best:9999}),{stars:2,best:15,completed:true});assert.equal(normalizeCatrisProgress({stars:2}).best,10);assert.equal(awardCatrisProgress({stars:3},0).coinsEarned,0);
});
