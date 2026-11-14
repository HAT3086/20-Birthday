import test from 'node:test';
import assert from 'node:assert/strict';
import {CandyMotion,CANDY_MOTION,planCandyMotion} from '../dist/candy-motion.mjs';
const board=()=>Array.from({length:64},(_,id)=>({id,color:id%6,special:null}));
function fixture(reducedMotion=false){
  const records=[];
  const cells=Array.from({length:64},(_,index)=>({
    getBoundingClientRect:()=>({left:index%8*54,top:Math.floor(index/8)*54}),
    querySelector:selector=>({animate:(frames,options)=>{
      const animation={playState:'running',cancel(){this.playState='idle';},pause(){this.playState='paused';},play(){this.playState='running';}};
      records.push({index,selector,frames,options,animation});return animation;
    }}),
  }));
  return {motion:new CandyMotion(cells,{reducedMotion}),records};
}
test('a swap slides the two identities from their previous cells and leaves all other treats still',()=>{
  const before=board(),after=[...before];[after[18],after[19]]=[after[19],after[18]];
  assert.deepEqual(planCandyMotion(before,after),[{id:19,to:18,dx:1,dy:0,fresh:false},{id:18,to:19,dx:-1,dy:0,fresh:false}]);
  const {motion,records}=fixture();motion.swapAndClear(before,after,{indices:[18,26,34]});
  const slides=records.filter(r=>r.selector==='.candy-piece');assert.equal(slides.length,2);assert.equal(slides[0].frames[0].transform,'translate(54px,0px)');assert.equal(slides[1].frames[0].transform,'translate(-54px,0px)');
  for(const clear of records.filter(r=>r.selector==='canvas'))assert.equal(clear.options.delay,CANDY_MOTION.swap);
});
test('gravity moves only affected columns, keeps each surviving identity, and spawns replacements above the board',()=>{
  const before=board(),after=[...before];after[0]={id:100,color:1};after[8]={id:101,color:2};after[16]=before[0];after[24]=before[8];
  const moves=planCandyMotion(before,after);assert.equal(moves.length,4);
  assert.deepEqual(moves.map(m=>[m.to,m.dy,m.fresh]),[[0,-2,true],[8,-2,true],[16,-2,false],[24,-2,false]]);
  const {motion,records}=fixture();const duration=motion.fall(before,after);assert.equal(records.length,4);assert.ok(duration>=Math.max(...records.map(r=>r.options.duration)));
  assert.ok(records.every(r=>r.frames[0].transform==='translate(0px,-108px)'));
  assert.ok(records.every(r=>r.frames.at(-1).transform==='translate(0,0)'));
});
test('invalid swaps glide out and back without changing either treat',()=>{
  const {motion,records}=fixture();assert.equal(motion.reject(2,10),CANDY_MOTION.reject);assert.equal(records.length,2);
  assert.equal(records[0].frames[1].transform,'translate(0px,54px)');assert.equal(records[1].frames[1].transform,'translate(0px,-54px)');assert.equal(records[0].frames.at(-1).transform,'translate(0,0)');
});
test('pause and resume preserve visual progress, while a new animation phase cancels all previous effects',()=>{
  const {motion,records}=fixture();motion.cascade({indices:[0,1,2]});motion.pause();assert.ok(records.every(r=>r.animation.playState==='paused'));
  motion.resume();assert.ok(records.every(r=>r.animation.playState==='running'));motion.fall(board(),board());assert.ok(records.every(r=>r.animation.playState==='idle'));assert.equal(motion.animations.size,0);
});
test('reduced motion removes sliding, popping, and bouncing while keeping the same final board',()=>{
  const {motion,records}=fixture(true),before=board(),after=[...before];[after[0],after[1]]=[after[1],after[0]];
  motion.swapAndClear(before,after,{indices:[0,1,2]});motion.fall(before,after);assert.equal(motion.swapDuration,0);assert.equal(records.length,0);assert.equal(motion.reject(0,1),0);
});
