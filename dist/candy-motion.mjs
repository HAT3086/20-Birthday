import { CANDY } from './candy-engine.mjs';
export const CANDY_MOTION = Object.freeze({swap:190,clear:CANDY.clearTime*1000,fall:390,reject:300});

// Tile identities connect the same treat before and after a swap or collapse.
export function planCandyMotion(before,after){
  const previous=new Map(before.flatMap((tile,index)=>tile?[[tile.id,index]]:[]));
  const incoming=Array.from({length:8},(_,x)=>after.filter((tile,index)=>index%8===x&&!previous.has(tile.id)).length);
  return after.map((tile,to)=>{
    const from=previous.get(tile.id),fresh=from===undefined;
    const x=to%8,y=Math.floor(to/8),fromX=fresh?x:from%8,fromY=fresh?y-incoming[x]:Math.floor(from/8);
    return {id:tile.id,to,dx:fromX-x,dy:fromY-y,fresh};
  }).filter(move=>move.dx!==0||move.dy!==0);
}

export class CandyMotion{
  constructor(cells,{reducedMotion=false}={}){this.cells=cells;this.reducedMotion=reducedMotion;this.animations=new Set();}
  get swapDuration(){return this.reducedMotion?0:CANDY_MOTION.swap;}
  reset(){for(const animation of this.animations)animation.cancel();this.animations.clear();}
  pause(){for(const animation of this.animations)animation.pause();}
  resume(){for(const animation of this.animations)if(animation.playState==='paused')animation.play();}
  animate(element,frames,options){
    if(this.reducedMotion||!element?.animate)return;
    const animation=element.animate(frames,{fill:'both',...options});this.animations.add(animation);
    return animation;
  }
  pitch(){
    if(!this.cells[0]?.getBoundingClientRect)return {x:0,y:0};
    const origin=this.cells[0].getBoundingClientRect();
    return {x:this.cells[1].getBoundingClientRect().left-origin.left,y:this.cells[8].getBoundingClientRect().top-origin.top};
  }
  move(before,after,{fall=false}={}){
    const pitch=this.pitch();
    for(const move of planCandyMotion(before,after)){
      const element=this.cells[move.to].querySelector('.candy-piece');
      const start=`translate(${move.dx*pitch.x}px,${move.dy*pitch.y}px)`;
      const frames=fall?[
        {transform:start,opacity:move.fresh ? .35 : 1},
        {transform:'translate(0,2px)',opacity:1,offset:.88},
        {transform:'translate(0,0)',opacity:1},
      ]:[{transform:start},{transform:'translate(0,0)'}];
      this.animate(element,frames,{duration:fall?Math.min(CANDY_MOTION.fall,270+Math.abs(move.dy)*18):CANDY_MOTION.swap,easing:fall?'cubic-bezier(.32,.02,.45,1)':'cubic-bezier(.2,.75,.25,1)'});
    }
  }
  clear(wave,{delay=0}={}){
    for(const index of wave?.indices||[])this.animate(this.cells[index].querySelector('canvas'),[
      {transform:'scale(1)',opacity:1},
      {transform:'scale(1.1)',opacity:1,offset:.3},
      {transform:'scale(.35)',opacity:0},
    ],{duration:CANDY_MOTION.clear,delay,easing:'cubic-bezier(.3,0,.5,1)'});
  }
  swapAndClear(before,after,wave){this.reset();this.move(before,after);this.clear(wave,{delay:this.swapDuration});}
  cascade(wave){this.reset();this.clear(wave);}
  fall(before,after,created=[]){
    this.reset();this.move(before,after,{fall:true});
    const specialIds=new Set(created.map(creation=>before[creation.index].id));
    after.forEach((tile,index)=>{if(specialIds.has(tile.id))this.animate(this.cells[index].querySelector('canvas'),[
      {transform:'scale(.75)',opacity:.6},{transform:'scale(1.1)',opacity:1,offset:.65},{transform:'scale(1)',opacity:1},
    ],{duration:300,easing:'ease-out'});});
    return this.reducedMotion?40:CANDY_MOTION.fall+20;
  }
  reject(a,b){
    this.reset();const pitch=this.pitch(),dx=(b%8-a%8)*pitch.x,dy=(Math.floor(b/8)-Math.floor(a/8))*pitch.y;
    for(const [index,direction]of [[a,1],[b,-1]])this.animate(this.cells[index].querySelector('.candy-piece'),[
      {transform:'translate(0,0)'},{transform:`translate(${dx*direction}px,${dy*direction}px)`,offset:.5},{transform:'translate(0,0)'},
    ],{duration:CANDY_MOTION.reject,easing:'ease-in-out'});
    return this.reducedMotion?0:CANDY_MOTION.reject;
  }
}
