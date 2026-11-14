export const CATRIS=Object.freeze({width:10,height:20,goal:15,lockDelay:.45,lockResets:12,repeatDelay:.16,repeatRate:.065,softDrop:.045,clearTime:.3});
export const CATRIS_STARS=Object.freeze([5,10,15]);
export const CATRIS_PIECES=Object.freeze(['I','J','L','O','S','T','Z']);
const SHAPES={I:[[0,1],[1,1],[2,1],[3,1]],J:[[0,0],[0,1],[1,1],[2,1]],L:[[2,0],[0,1],[1,1],[2,1]],O:[[1,0],[2,0],[1,1],[2,1]],S:[[1,0],[2,0],[0,1],[1,1]],T:[[1,0],[0,1],[1,1],[2,1]],Z:[[0,0],[1,0],[1,1],[2,1]]};
const integer=(value,max)=>Number.isFinite(value)?Math.max(0,Math.min(max,Math.floor(value))):0;
export function normalizeCatrisProgress(raw={}){
  const stars=integer(raw?.stars,3);
  return {stars,best:Math.max(stars?CATRIS_STARS[stars-1]:0,integer(raw?.best,CATRIS.goal)),completed:raw?.completed===true||stars>0};
}
export function awardCatrisProgress(raw,lines){
  const before=normalizeCatrisProgress(raw),best=integer(lines,CATRIS.goal),stars=Math.max(before.stars,CATRIS_STARS.filter(n=>best>=n).length);
  return {progress:normalizeCatrisProgress({...before,stars,best:Math.max(before.best,best)}),starsEarned:stars-before.stars,coinsEarned:(stars-before.stars)*10};
}
export function catrisCells(piece){
  let cells=SHAPES[piece.type].map(([x,y])=>[x,y]);
  if(piece.type==='O')return cells;
  const size=piece.type==='I'?4:3;
  for(let turn=0;turn<((piece.rotation%4)+4)%4;turn++)cells=cells.map(([x,y])=>[size-1-y,x]);
  return cells;
}
export function catrisFits(game,piece){
  return catrisCells(piece).every(([x,y])=>{x+=piece.x;y+=piece.y;return x>=0&&x<10&&y<20&&(y<0||!game.board[y][x]);});
}
export function catrisInterval(game){return Math.max(.35,.85-Math.floor(game.lines/5)*.1);}
export function catrisLevel(game){return Math.min(6,1+Math.floor(game.lines/5));}
function nextType(game){
  if(!game.bag.length){
    game.bag=[...CATRIS_PIECES];
    for(let i=6;i>0;i--){const sample=game.random(),j=Math.floor((Number.isFinite(sample)?Math.max(0,Math.min(.999999,sample)):0)*(i+1));[game.bag[i],game.bag[j]]=[game.bag[j],game.bag[i]];}
  }
  return game.bag.shift();
}
function spawn(game){
  game.active={id:game.nextId++,type:game.next,x:3,y:-1,rotation:0};game.next=nextType(game);
  game.gravity=0;game.lock=0;game.resets=0;game.direction=0;game.holdTime=0;game.repeatTime=0;
  if(!catrisFits(game,game.active)){game.status='lost';game.active=null;}
}
export function createCatris({random=Math.random}={}){
  const game={status:'ready',phase:'active',board:Array.from({length:20},()=>Array(10).fill(null)),active:null,next:null,bag:[],random,nextId:1,
    lines:0,pieces:0,score:0,input:{left:false,right:false,down:false},direction:0,holdTime:0,repeatTime:0,gravity:0,lock:0,resets:0,clearing:[],clearTimer:0,elapsed:0};
  game.next=nextType(game);spawn(game);return game;
}
export function clearCatrisInput(game){game.input={left:false,right:false,down:false};game.direction=0;game.holdTime=0;game.repeatTime=0;}
function grounded(game){return !catrisFits(game,{...game.active,y:game.active.y+1});}
function adjustLock(game,wasGrounded){if(wasGrounded&&game.resets<CATRIS.lockResets){game.lock=0;game.resets++;}}
export function moveCatris(game,direction){
  if(game.status!=='playing'||game.phase!=='active'||!game.active||![1,-1].includes(direction))return false;
  const next={...game.active,x:game.active.x+direction};if(!catrisFits(game,next))return false;
  const wasGrounded=grounded(game);game.active=next;adjustLock(game,wasGrounded);return true;
}
export function rotateCatris(game,direction=1){
  if(game.status!=='playing'||game.phase!=='active'||!game.active||game.active.type==='O')return false;
  const rotation=(game.active.rotation+(direction<0?3:1))%4,wasGrounded=grounded(game);
  for(const [dx,dy]of [[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1],[-1,-1],[1,-1],[0,-2]]){
    const next={...game.active,rotation,x:game.active.x+dx,y:game.active.y+dy};
    if(catrisFits(game,next)){game.active=next;adjustLock(game,wasGrounded);return true;}
  }
  return false;
}
export function setCatrisInput(game,input){
  if(game.status!=='playing')return false;
  if('down'in input&&game.input.down!==(input.down===true))game.gravity=0;
  for(const key of ['left','right','down'])if(key in input)game.input[key]=input[key]===true;
  const direction=Number(game.input.right)-Number(game.input.left);
  if(direction===game.direction||game.phase!=='active')return false;
  game.direction=direction;game.holdTime=0;game.repeatTime=0;
  return direction?moveCatris(game,direction):false;
}
export function catrisGhostY(game){
  if(!game.active)return null;let y=game.active.y;
  while(catrisFits(game,{...game.active,y:y+1}))y++;
  return y;
}
function result(){return {moved:false,locked:false,clearStarted:0,cleared:0,spawned:false,won:false,lost:false};}
function lock(game,event){
  const cells=catrisCells(game.active).map(([x,y])=>[x+game.active.x,y+game.active.y]);
  if(cells.some(([,y])=>y<0)){game.status='lost';game.active=null;event.lost=true;return;}
  for(const [x,y]of cells)game.board[y][x]=game.active.type;
  game.active=null;game.pieces++;event.locked=true;
  game.clearing=game.board.flatMap((row,y)=>row.every(Boolean)?[y]:[]);
  if(game.clearing.length){game.phase='clearing';game.clearTimer=CATRIS.clearTime;event.clearStarted=game.clearing.length;}
  else{spawn(game);event.spawned=game.status==='playing';event.lost=game.status==='lost';}
}
export function hardDropCatris(game){
  const event=result();if(game.status!=='playing'||game.phase!=='active'||!game.active)return event;
  const y=catrisGhostY(game);game.active.y=y;lock(game,event);return event;
}
export function stepCatris(game,seconds=1/60){
  const event=result();if(game.status!=='playing'||!Number.isFinite(seconds)||seconds<=0)return event;
  const dt=Math.min(seconds,.1);game.elapsed+=dt;
  if(game.phase==='clearing'){
    game.clearTimer=Math.max(0,game.clearTimer-dt);if(game.clearTimer>1e-8)return event;
    const count=game.clearing.length,rows=new Set(game.clearing);
    game.board=game.board.filter((_,y)=>!rows.has(y));while(game.board.length<20)game.board.unshift(Array(10).fill(null));
    game.score+=[0,100,300,500,800][count]*catrisLevel(game);game.lines=Math.min(CATRIS.goal,game.lines+count);game.clearing=[];event.cleared=count;
    if(game.lines>=CATRIS.goal){game.phase='active';game.status='won';clearCatrisInput(game);event.won=true;return event;}
    game.phase='active';spawn(game);event.spawned=game.status==='playing';event.lost=game.status==='lost';return event;
  }
  if(!game.active)return event;
  const direction=Number(game.input.right)-Number(game.input.left);
  if(direction!==game.direction){game.direction=direction;game.holdTime=0;game.repeatTime=0;if(direction)event.moved=moveCatris(game,direction);}
  else if(direction){
    const before=game.holdTime;game.holdTime+=dt;
    if(game.holdTime>=CATRIS.repeatDelay){game.repeatTime+=Math.max(0,game.holdTime-CATRIS.repeatDelay)-Math.max(0,before-CATRIS.repeatDelay);while(game.repeatTime>=CATRIS.repeatRate){event.moved=moveCatris(game,direction)||event.moved;game.repeatTime-=CATRIS.repeatRate;}}
  }
  game.gravity+=dt;const interval=game.input.down?CATRIS.softDrop:catrisInterval(game);
  while(game.gravity>=interval){game.gravity-=interval;if(catrisFits(game,{...game.active,y:game.active.y+1})){game.active.y++;event.moved=true;}else{game.gravity=0;break;}}
  if(grounded(game)){game.lock+=dt;if(game.lock+1e-8>=CATRIS.lockDelay)lock(game,event);}else game.lock=0;
  return event;
}
