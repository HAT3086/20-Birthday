import { CATRIS, catrisCells, catrisFits, catrisGhostY, catrisInterval } from './catris-engine.mjs';
export const BLOCK_COLORS=Object.freeze({
  I:['#85a9ad','#557a83','#bdd3cf'],J:['#8b9fb9','#5c708c','#bdc9da'],L:['#c39d78','#8e6f50','#e2c4a0'],
  O:['#c2ae6b','#8d7b43','#e1d39c'],S:['#94ab80','#637b56','#c4d2b0'],T:['#a597b7','#726585','#d0c4db'],Z:['#bd8e8b','#8b605e','#dfbdb1'],
});
export function drawCatrisBlock(context,x,y,size,type,{ghost=false,alpha=1}={}){
  const [color,dark,light]=BLOCK_COLORS[type];context.save();context.globalAlpha=alpha;
  if(ghost){context.strokeStyle=dark;context.lineWidth=1.4;context.strokeRect(x+3,y+3,size-6,size-6);context.restore();return;}
  const unit=size/32,rect=(a,b,w,h,c)=>{context.fillStyle=c;context.fillRect(x+a*unit,y+b*unit,w*unit,h*unit);};
  rect(1,1,30,30,dark);rect(3,3,26,25,color);rect(4,3,24,2,light);rect(3,5,2,21,light);rect(5,28,24,2,dark);
  // Two little ears and a quiet cat face keep the blocks readable at laptop scale.
  rect(8,7,4,4,light);rect(20,7,4,4,light);rect(8,15,3,3,dark);rect(21,15,3,3,dark);rect(15,20,2,2,dark);rect(13,22,6,1,dark);
  context.restore();
}
export function drawCatris(context,game,{reducedMotion=false}={}){
  const cell=32;context.clearRect(0,0,320,640);context.imageSmoothingEnabled=false;
  context.fillStyle='#d9d5df';context.fillRect(0,0,320,640);
  for(let y=0;y<20;y++)for(let x=0;x<10;x++){
    if((x+y)%2){context.fillStyle='#d3cfda';context.fillRect(x*cell,y*cell,cell,cell);}
    context.strokeStyle='#c6c0cf';context.lineWidth=.6;context.strokeRect(x*cell+.5,y*cell+.5,31,31);
    if(game.board[y][x])drawCatrisBlock(context,x*cell,y*cell,cell,game.board[y][x]);
  }
  if(game.phase==='clearing'){
    const progress=1-game.clearTimer/CATRIS.clearTime;
    for(const y of game.clearing){context.fillStyle=`rgba(246,237,211,${.25+progress*.65})`;context.fillRect(0,y*cell,320,cell);}
  }
  if(game.active){
    const ghost=catrisGhostY(game);
    for(const [x,y]of catrisCells(game.active))if(ghost+y>=0)drawCatrisBlock(context,(game.active.x+x)*cell,(ghost+y)*cell,cell,game.active.type,{ghost:true,alpha:.6});
    const canFall=catrisFits(game,{...game.active,y:game.active.y+1});
    const fraction=!reducedMotion&&canFall?Math.min(.99,game.gravity/(game.input.down?CATRIS.softDrop:catrisInterval(game))):0;
    for(const [x,y]of catrisCells(game.active))drawCatrisBlock(context,(game.active.x+x)*cell,(game.active.y+y+fraction)*cell,cell,game.active.type);
  }
}
export function drawCatrisPreview(context,type,width=128,height=112){
  context.clearRect(0,0,width,height);if(!type)return;
  const cells=catrisCells({type,rotation:0}),xs=cells.map(c=>c[0]),ys=cells.map(c=>c[1]);
  const minX=Math.min(...xs),minY=Math.min(...ys),size=24;
  const left=(width-(Math.max(...xs)-minX+1)*size)/2,top=(height-(Math.max(...ys)-minY+1)*size)/2;
  for(const [x,y]of cells)drawCatrisBlock(context,left+(x-minX)*size,top+(y-minY)*size,size,type);
}
