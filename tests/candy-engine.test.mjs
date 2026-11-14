import test from 'node:test';
import assert from 'node:assert/strict';
import {CANDY,CANDY_STARS,createCandy,findCandyMatches,findCandyMoves,swapCandy,stepCandy,ensureCandyMoves,awardCandyProgress,normalizeCandyProgress} from '../dist/candy-engine.mjs';

export const seeded=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const play=(seed=42)=>{const game=createCandy({random:seeded(seed)});game.status='playing';return game;};
const base=()=>Array.from({length:64},(_,i)=>({id:i+1,color:(Math.floor(i/8)*2+i%8)%6,special:null}));
const set=(game,indices,color)=>indices.forEach(i=>game.board[i].color=color);
export function settleCandy(game){
  const events=[];for(let frame=0;frame<20000&&game.phase!=='idle';frame++)events.push(stepCandy(game,.1));
  assert.equal(game.phase,'idle','cascade must finish');return events;
}
export function playCandyRound(game){
  while(game.status==='playing'){
    const moves=findCandyMoves(game.board);assert.ok(moves.length,'every live board must have a move');
    const rainbow=moves.find(([a,b])=>game.board[a].special==='rainbow'||game.board[b].special==='rainbow');
    assert.equal(swapCandy(game,...(rainbow||moves[0])).valid,true);settleCandy(game);
  }
  return game;
}

test('opening boards have 64 distinct treats, no free matches, and a legal swap, including a constant RNG',()=>{
  assert.deepEqual(CANDY_STARS,[500,1200,2000]);assert.equal(CANDY.moves,25);
  for(const random of [seeded(1),seeded(50),seeded(100),()=>0,()=>.999999,()=>NaN]){
    const game=createCandy({random});assert.equal(game.board.length,64);assert.equal(new Set(game.board.map(t=>t.id)).size,64);
    assert.equal(findCandyMatches(game.board).length,0);assert.ok(findCandyMoves(game.board).length);assert.equal(game.score,0);assert.equal(game.moves,25);
  }
});
test('invalid, diagonal, wrapped-edge, paused, and rapid swaps cannot spend moves or alter the board',()=>{
  const game=play(),before=JSON.stringify(game.board);
  const legal=findCandyMoves(game.board);let invalid;
  for(let i=0;i<63;i++)if(i%8<7&&!legal.some(([a,b])=>a===i&&b===i+1)){invalid=[i,i+1];break;}
  assert.equal(swapCandy(game,...invalid).reason,'no-match');
  for(const pair of [[0,9],[7,8],[-1,0],[1,64],[0,0]])assert.equal(swapCandy(game,...pair).valid,false);
  assert.equal(JSON.stringify(game.board),before);assert.equal(game.moves,25);
  game.status='paused';assert.equal(swapCandy(game,...legal[0]).valid,false);game.status='playing';
  assert.equal(swapCandy(game,...legal[0]).valid,true);assert.equal(game.moves,24);const busy=JSON.stringify(game.board);
  assert.equal(swapCandy(game,...legal[0]).valid,false);assert.equal(JSON.stringify(game.board),busy);assert.equal(game.moves,24);
});
test('a straight four creates the appropriate stripe at the swapped treat, and a five creates a rainbow',()=>{
  for(const [indices,from,to,special]of [[[24,25,27],18,26,'row'],[[11,19,35],26,27,'column'],[[24,25,27,28],18,26,'rainbow']]){
    const game=play();game.board=base();const color=special==='column'?2:0;set(game,indices,color);game.board[to].color=1;game.board[from].color=color;
    assert.equal(findCandyMatches(game.board).length,0);assert.equal(swapCandy(game,from,to).valid,true);
    const result=stepCandy(game,.1);assert.equal(result.points,0);stepCandy(game,.1);const cleared=stepCandy(game,.1);
    assert.ok(cleared.created.some(c=>c.index===to&&c.special===special));
    assert.ok(game.board.some(t=>t.id===to+1||t.special===special));assert.ok(game.board.some(t=>t.special===special));
    assert.equal(cleared.points,special==='rainbow'?40:30);
  }
});
test('an intersecting T match creates one wrapped treat and does not count the shared cell twice',()=>{
  const game=play();game.board=base();set(game,[25,27,34,42,18],0);game.board[26].color=1;game.board[24].color=5;
  assert.equal(findCandyMatches(game.board).length,0);assert.equal(swapCandy(game,18,26).valid,true);
  stepCandy(game,.1);stepCandy(game,.1);const event=stepCandy(game,.1);
  assert.deepEqual(event.created,[{index:26,special:'wrapped'}]);assert.equal(event.points,40);assert.ok(game.board.some(t=>t.special==='wrapped'));
});
test('a matched stripe clears its entire line and chains into a wrapped 3 by 3 burst',()=>{
  const game=play();game.board=base();set(game,[16,17,10],4);game.board[18].color=3;game.board[16].special='row';game.board[21].special='wrapped';
  assert.equal(swapCandy(game,10,18).valid,true);
  const expected=new Set([...Array.from({length:8},(_,i)=>16+i),12,13,14,28,29,30]);
  assert.deepEqual(new Set(game.wave.indices),expected);
  stepCandy(game,.1);stepCandy(game,.1);const event=stepCandy(game,.1);assert.equal(event.points,140);
  assert.deepEqual(event.activated.map(a=>a.special).sort(),['row','wrapped']);
});
test('a swapped rainbow clears exactly the chosen color, and two rainbows clear the board',()=>{
  const game=play();game.board=base();game.board[0].special='rainbow';const color=game.board[1].color;
  const count=game.board.filter((t,i)=>i!==0&&t.color===color).length+1;
  assert.equal(swapCandy(game,0,1).valid,true);assert.equal(game.wave.indices.length,count);
  const pair=play();pair.board=base();pair.board[0].special='rainbow';pair.board[1].special='rainbow';
  assert.equal(swapCandy(pair,0,1).valid,true);assert.equal(pair.wave.indices.length,64);
  stepCandy(pair,.1);stepCandy(pair,.1);const event=stepCandy(pair,.1);assert.equal(event.points,640);assert.equal(pair.moves,24);
});
test('gravity keeps surviving treats in their column and fills every hole with a fresh ID',()=>{
  const game=play();game.board=base();set(game,[24,25,18],0);game.board[26].color=1;
  const bottom=game.board[56],above=game.board[16];assert.equal(swapCandy(game,18,26).valid,true);
  stepCandy(game,.1);stepCandy(game,.1);stepCandy(game,.1);
  assert.equal(game.board[56],bottom);assert.equal(game.board[24],above);assert.equal(game.board.length,64);assert.ok(game.board.every(Boolean));assert.equal(new Set(game.board.map(t=>t.id)).size,64);
});
test('cascades multiply by two and then three, cost no extra moves, and reset on the next swap',()=>{
  const game=play(13);swapCandy(game,...findCandyMoves(game.board)[0]);const events=settleCandy(game).filter(e=>e.points);
  assert.equal(game.moves,24);assert.ok(events.some(e=>e.cascade>1));
  for(const event of events)assert.equal(event.points%(10*Math.min(event.cascade,3)),0);
  swapCandy(game,...findCandyMoves(game.board)[0]);assert.equal(game.cascade,1);assert.equal(game.moves,23);
});
test('the final move resolves all its cascades before the round ends; a win caps at 2000 immediately',()=>{
  const game=play(13);game.moves=1;swapCandy(game,...findCandyMoves(game.board)[0]);assert.equal(game.moves,0);assert.equal(game.status,'playing');
  const events=settleCandy(game);assert.equal(game.status,'finished');assert.ok(events.filter(e=>e.points).length>1);
  const winner=play();winner.score=1990;winner.moves=1;swapCandy(winner,...findCandyMoves(winner.board)[0]);const win=settleCandy(winner).at(-1);
  assert.equal(winner.score,2000);assert.equal(winner.status,'won');assert.equal(win.won,true);assert.equal(win.ended,true);
  const before=JSON.stringify(winner);stepCandy(winner,1);assert.equal(JSON.stringify(winner),before);
});
test('pausing freezes clearing, falling, points, moves, and special activation',()=>{
  const game=play();swapCandy(game,...findCandyMoves(game.board)[0]);game.status='paused';const before=JSON.stringify(game);
  for(let i=0;i<20;i++)stepCandy(game,.1);assert.equal(JSON.stringify(game),before);
  game.status='playing';stepCandy(game,.1);stepCandy(game,.1);stepCandy(game,.1);game.status='paused';const falling=JSON.stringify(game);stepCandy(game,.1);assert.equal(JSON.stringify(game),falling);
});
test('a dead board reshuffles for free without losing special treats or changing score and moves',()=>{
  const game=play();game.board=base();game.board[40].special='wrapped';const special=game.board[40];
  assert.equal(findCandyMoves(game.board).length,0);const score=game.score,moves=game.moves;
  assert.equal(ensureCandyMoves(game),true);assert.equal(game.score,score);assert.equal(game.moves,moves);assert.equal(findCandyMatches(game.board).length,0);assert.ok(findCandyMoves(game.board).length);
  assert.ok(game.board.includes(special));assert.equal(ensureCandyMoves(game),false);
});
test('real swaps can finish full rounds, reach victory, and grant each milestone only once',()=>{
  let victories=0;
  for(let seed=1;seed<=12;seed++){
    const game=playCandyRound(play(seed));assert.ok(['won','finished'].includes(game.status));assert.ok(game.moves>=0&&game.moves<25);assert.ok(game.score<=2000);
    if(game.status==='won')victories++;
    const first=awardCandyProgress({},game.score);assert.equal(first.coinsEarned,first.starsEarned*10);assert.equal(awardCandyProgress(first.progress,game.score).coinsEarned,0);
  }
  assert.ok(victories>=1,'the 2000 point goal should be reachable through ordinary swaps');
  assert.deepEqual(awardCandyProgress({},2000),{progress:{stars:3,best:2000,completed:true},starsEarned:3,coinsEarned:30});
  assert.equal(awardCandyProgress({stars:1,best:500},1200).coinsEarned,10);
  assert.deepEqual(normalizeCandyProgress({stars:2,best:Infinity}),{stars:2,best:1200,completed:true});
  assert.equal(awardCandyProgress({stars:3},0).coinsEarned,0);assert.equal(normalizeCandyProgress({stars:99,best:99999}).best,2000);
});

test('rainbow color clears do not leave a new protected special when the swap also forms a line',()=>{
  const game=play();game.board=base();game.board[24].special='rainbow';set(game,[25,26,27,16],1);
  assert.equal(swapCandy(game,16,24).valid,true);
  assert.equal(game.wave.creations.length,0);for(const i of [24,25,26,27])assert.ok(game.wave.indices.includes(i));
});
test('a constant random source can reshuffle a dead board while retaining every special identity',()=>{
  const game=createCandy({random:()=>0});game.status='playing';game.board=base();game.board[40].special='row';game.board[20].special='wrapped';const specials=game.board.filter(t=>t.special);
  assert.equal(findCandyMoves(game.board).length,0);ensureCandyMoves(game);assert.ok(findCandyMoves(game.board).length);assert.equal(findCandyMatches(game.board).length,0);
  for(const special of specials)assert.ok(game.board.includes(special));
});

test('a winning match keeps input locked until its final falling animation has finished',()=>{
  const game=play();game.score=1990;swapCandy(game,...findCandyMoves(game.board)[0]);const clear=stepCandy(game,CANDY.clearTime);
  assert.equal(clear.points,10);assert.equal(clear.ended,false);assert.equal(game.score,2000);assert.equal(game.phase,'falling');assert.equal(swapCandy(game,...findCandyMoves(game.board)[0]).valid,false);
  const finish=stepCandy(game,CANDY.fallTime);assert.equal(finish.won,true);assert.equal(finish.points,0);assert.equal(game.status,'won');
});
