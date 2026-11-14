export const CANDY = Object.freeze({size:8,colors:6,moves:25,goal:2000,clearTime:.24,fallTime:.22});
export const CANDY_STARS = Object.freeze([500,1200,2000]);
const integer=(value,max)=>Number.isFinite(value)?Math.max(0,Math.min(max,Math.floor(value))):0;
const colorOf=tile=>tile&&tile.special!=='rainbow'?tile.color:-1;
const adjacent=(a,b)=>Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<64&&b<64&&Math.abs(a%8-b%8)+Math.abs(Math.floor(a/8)-Math.floor(b/8))===1;
const sample=game=>{const n=game.random();return Number.isFinite(n)?Math.max(0,Math.min(.999999,n)):0;};
const tile=game=>( {id:game.nextId++,color:Math.floor(sample(game)*6),special:null} );

export function normalizeCandyProgress(raw={}){
  const stars=integer(raw?.stars,3);
  return {stars,best:Math.max(stars?CANDY_STARS[stars-1]:0,integer(raw?.best,CANDY.goal)),completed:raw?.completed===true||stars>0};
}
export function awardCandyProgress(raw,score){
  const before=normalizeCandyProgress(raw),best=integer(score,CANDY.goal);
  const stars=Math.max(before.stars,CANDY_STARS.filter(value=>best>=value).length);
  const progress=normalizeCandyProgress({...before,stars,best:Math.max(before.best,best)});
  return {progress,starsEarned:stars-before.stars,coinsEarned:(stars-before.stars)*10};
}

export function findCandyMatches(board){
  const groups=[];
  for(const axis of ['row','column'])for(let line=0;line<8;line++){
    let start=0;
    while(start<8){
      const index=offset=>axis==='row'?line*8+offset:offset*8+line;
      const color=colorOf(board[index(start)]);let end=start+1;
      while(color>=0&&end<8&&colorOf(board[index(end)])===color)end++;
      if(color>=0&&end-start>=3)groups.push({axis,indices:Array.from({length:end-start},(_,i)=>index(start+i))});
      start=end;
    }
  }
  return groups;
}

function swap(board,a,b){[board[a],board[b]]=[board[b],board[a]];}
export function findCandyMoves(board){
  const moves=[];
  for(let a=0;a<64;a++)for(const b of [a%8<7?a+1:-1,a+8<64?a+8:-1]){
    if(b<0||!board[a]||!board[b])continue;
    if(board[a].special==='rainbow'||board[b].special==='rainbow'){moves.push([a,b]);continue;}
    swap(board,a,b);const valid=findCandyMatches(board).some(group=>group.indices.includes(a)||group.indices.includes(b));swap(board,a,b);
    if(valid)moves.push([a,b]);
  }
  return moves;
}

function freshBoard(game){
  for(let attempt=0;attempt<80;attempt++){
    const board=[];
    for(let i=0;i<64;i++){
      const candy=tile(game);let tries=0;
      while((i%8>=2&&candy.color===board[i-1].color&&candy.color===board[i-2].color)||(i>=16&&candy.color===board[i-8].color&&candy.color===board[i-16].color)){
        candy.color=(candy.color+1)%6;if(++tries>6)break;
      }
      board.push(candy);
    }
    if(findCandyMoves(board).length)return board;
  }
  const board=Array.from({length:64},(_,i)=>({...tile(game),color:(Math.floor(i/8)*2+i%8)%6}));
  // A guaranteed opening swap, even for an unchanging random source.
  [0,1,10].forEach(i=>board[i].color=5);board[2].color=4;board[9].color=3;
  return board;
}

export function createCandy({random=Math.random}={}){
  const game={status:'ready',phase:'idle',board:[],score:0,moves:CANDY.moves,cascade:0,timer:0,wave:null,nextId:1,random,reshuffles:0};
  game.board=freshBoard(game);return game;
}

function planWave(board,groups,preferred=[],seed=[]){
  const components=[];
  for(const group of groups){
    const joins=components.filter(component=>group.indices.some(i=>component.indices.has(i)));
    const component={indices:new Set(group.indices),groups:[group]};
    for(const other of joins){other.indices.forEach(i=>component.indices.add(i));component.groups.push(...other.groups);components.splice(components.indexOf(other),1);}
    components.push(component);
  }
  const creations=[];
  for(const component of components){
    const longest=component.groups.reduce((a,b)=>a.indices.length>=b.indices.length?a:b);
    const special=longest.indices.length>=5?'rainbow':new Set(component.groups.map(g=>g.axis)).size>1?'wrapped':longest.indices.length===4?longest.axis:null;
    if(!special)continue;
    const candidates=[...component.indices].filter(i=>!board[i].special);
    const at=preferred.find(i=>candidates.includes(i))??candidates[Math.floor(candidates.length/2)];
    if(at!==undefined)creations.push({index:at,special});
  }
  const protectedCells=new Set(creations.map(c=>c.index));
  const clear=new Set([...groups.flatMap(group=>group.indices),...seed].filter(i=>!protectedCells.has(i)));
  const queue=[...clear],activated=[];
  const add=i=>{if(i>=0&&i<64&&!protectedCells.has(i)&&!clear.has(i)){clear.add(i);queue.push(i);}};
  for(let q=0;q<queue.length;q++){
    const index=queue[q],candy=board[index];if(!candy?.special)continue;
    activated.push({index,special:candy.special});const x=index%8,y=Math.floor(index/8);
    if(candy.special==='row')for(let col=0;col<8;col++)add(y*8+col);
    if(candy.special==='column')for(let row=0;row<8;row++)add(row*8+x);
    if(candy.special==='wrapped')for(let row=Math.max(0,y-1);row<=Math.min(7,y+1);row++)for(let col=Math.max(0,x-1);col<=Math.min(7,x+1);col++)add(row*8+col);
    if(candy.special==='rainbow'){
      const counts=Array.from({length:6},(_,color)=>board.filter(t=>t&&t.color===color&&t.special!=='rainbow').length);
      const color=counts.indexOf(Math.max(...counts));board.forEach((t,i)=>{if(t?.color===color)add(i);});
    }
  }
  return {indices:[...clear],creations,activated};
}

export function swapCandy(game,a,b){
  if(game.status!=='playing'||game.phase!=='idle'||!adjacent(a,b)||game.moves<=0)return {valid:false,reason:'blocked'};
  swap(game.board,a,b);
  const groups=findCandyMatches(game.board),rainbows=[a,b].filter(i=>game.board[i].special==='rainbow');
  if(!rainbows.length&&!groups.some(group=>group.indices.includes(a)||group.indices.includes(b))){swap(game.board,a,b);return {valid:false,reason:'no-match'};}
  let seed=[];
  if(rainbows.length){
    const other=game.board[rainbows[0]===a?b:a];
    seed=rainbows.length===2?Array.from({length:64},(_,i)=>i):game.board.flatMap((t,i)=>t.color===other.color||rainbows.includes(i)?[i]:[]);
  }
  game.moves--;game.cascade=1;game.phase='clearing';game.timer=CANDY.clearTime;
  // A manually swapped rainbow clears its selected color, without a second random color blast.
  const rainbowSpecials=rainbows.map(i=>game.board[i].special);rainbows.forEach(i=>game.board[i].special=null);
  game.wave=planWave(game.board,rainbows.length?[]:groups,[b,a],seed);
  rainbows.forEach((i,j)=>{game.board[i].special=rainbowSpecials[j];game.wave.activated.push({index:i,special:'rainbow'});});
  return {valid:true};
}

function refill(game){
  for(let x=0;x<8;x++){
    const remaining=[];for(let y=7;y>=0;y--)if(game.board[y*8+x])remaining.push(game.board[y*8+x]);
    for(let y=7;y>=0;y--)game.board[y*8+x]=remaining[7-y]||tile(game);
  }
}

export function ensureCandyMoves(game){
  if(findCandyMoves(game.board).length)return false;
  const original=[...game.board];
  for(let attempt=0;attempt<80;attempt++){
    const board=[...original];
    for(let i=63;i>0;i--){const j=Math.floor(sample(game)*(i+1));swap(board,i,j);}
    if(!findCandyMatches(board).length&&findCandyMoves(board).length){game.board=board;game.reshuffles++;return true;}
  }
  // Use an independent deterministic shuffle if an unchanging RNG repeats a dead board.
  let fallbackSeed=game.nextId;
  for(let attempt=0;attempt<160;attempt++){
    const board=[...original];
    for(let i=63;i>0;i--){fallbackSeed=(Math.imul(fallbackSeed,1664525)+1013904223)>>>0;swap(board,i,Math.floor(fallbackSeed/4294967296*(i+1)));}
    if(!findCandyMatches(board).length&&findCandyMoves(board).length){game.board=board;game.reshuffles++;return true;}
  }
  // Recolor only ordinary treats in the exceptional fallback, preserving special identities.
  const specials=original.filter(t=>t.special);game.board=freshBoard(game);
  const occupied=new Set();
  for(const special of specials)for(let i=63;i>=0;i--){
    if(occupied.has(i))continue;const before=game.board[i];game.board[i]=special;
    if(!findCandyMatches(game.board).length&&findCandyMoves(game.board).length){occupied.add(i);break;}
    game.board[i]=before;
  }
  game.reshuffles++;return true;
}

export function stepCandy(game,seconds=1/60){
  const result={points:0,created:[],activated:[],cascade:0,shuffled:false,ended:false,won:false};
  if(game.status!=='playing'||game.phase==='idle'||!Number.isFinite(seconds)||seconds<=0)return result;
  game.timer=Math.max(0,game.timer-seconds);if(game.timer>1e-8)return result;
  if(game.phase==='clearing'){
    const wave=game.wave,multiplier=Math.min(3,game.cascade);
    const before=game.score;game.score=Math.min(CANDY.goal,game.score+wave.indices.length*10*multiplier);
    result.points=game.score-before;result.cascade=game.cascade;result.created=wave.creations;result.activated=wave.activated;
    wave.indices.forEach(i=>game.board[i]=null);
    wave.creations.forEach(({index,special})=>{game.board[index]={...game.board[index],special};});
    refill(game);game.wave=null;
    game.phase='falling';game.timer=CANDY.fallTime;return result;
  }
  if(game.score>=CANDY.goal){game.status='won';game.phase='idle';result.ended=true;result.won=true;return result;}
  const groups=findCandyMatches(game.board);
  if(groups.length){game.cascade++;game.wave=planWave(game.board,groups);game.phase='clearing';game.timer=CANDY.clearTime;}
  else{
    game.phase='idle';game.cascade=0;
    if(game.moves===0){game.status='finished';result.ended=true;}
    else result.shuffled=ensureCandyMoves(game);
  }
  return result;
}
