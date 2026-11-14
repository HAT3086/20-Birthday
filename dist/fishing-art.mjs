import { LAKE, FISH, hookPosition } from './fishing-engine.mjs';
import { t } from './i18n.mjs';

// Code-native pixel art keeps fish and orb silhouettes sharp at laptop sizes.
export function drawLakeItem(context, item) {
  const rect = (x, y, w, h, color) => { context.fillStyle = color; context.fillRect(x, y, w, h); };
  context.save(); context.translate(Math.round(item.x), Math.round(item.y));
  if (item.kind === 'orb') {
    const [shade, color, light, ink] = ({ speed: ['#9d7834', '#dfb755', '#f3d889', '#73571f'], freeze: ['#577d9c', '#82b9d7', '#b7dfeb', '#315b7d'], double: ['#55815d', '#88b68a', '#b8d7a2', '#305a3c'] })[item.type];
    rect(-12, -18, 24, 36, shade); rect(-18, -12, 36, 24, shade);
    rect(-11, -15, 22, 30, color); rect(-15, -11, 30, 22, color);
    rect(-10, -12, 7, 4, light); rect(-13, -8, 4, 7, light);
    if (item.type === 'speed') {
      context.fillStyle = ink; context.beginPath(); [[1,-11],[-8,2],[-1,2],[-4,12],[9,-3],[2,-3],[5,-11]].forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y)); context.closePath(); context.fill();
    } else if (item.type === 'freeze') {
      context.strokeStyle = ink; context.lineWidth = 2; context.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3, x = Math.cos(a), y = Math.sin(a);
        context.moveTo(0,0); context.lineTo(x*11,y*11);
        for (const sign of [-1,1]) { context.moveTo(x*7,y*7); context.lineTo(x*4 - y*sign*3,y*4+x*sign*3); }
      }
      context.stroke();
    } else { context.fillStyle = ink; context.font = 'bold 17px Arial'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText('×2',0,1); }
  } else if (item.kind === 'fish') {
    const fish = FISH[item.type], w = fish.width, h = fish.height;
    context.save(); context.scale(item.direction || 1, 1);
    // A forked tail, stepped oval, dorsal fin, eye, and gill distinguish each fish.
    rect(-w/2, -h*.4, w*.19, h*.28, fish.shade); rect(-w/2,-h*.4,w*.09,h*.8,fish.shade); rect(-w/2,h*.12,w*.19,h*.28,fish.shade);
    rect(-w*.32,-h*.31,w*.72,h*.62,fish.shade); rect(-w*.2,-h/2,w*.42,h,fish.shade);
    rect(-w*.24,-h*.29,w*.6,h*.58,fish.color); rect(-w*.16,-h*.4,w*.36,h*.8,fish.color);
    rect(-w*.1,-h*.65,w*.22,h*.2,fish.shade); rect(-w*.04,h*.27,w*.2,h*.23,fish.shade);
    rect(-w*.16,-h*.29,w*.29,Math.max(2,h*.12),'#f0dbc0');
    if (item.type === 'medium') { rect(-5,-6,3,12,fish.shade); rect(-11,-5,3,10,fish.shade); }
    if (item.type === 'big') { rect(-10,-7,4,4,'#d2dfdf'); rect(-2,-3,4,4,'#d2dfdf'); rect(-9,4,4,4,'#d2dfdf'); }
    rect(w*.24,-h*.17,3,3,'#304c50'); rect(w*.13,-h*.03,2,h*.23,fish.shade);
    context.restore();
  } else {
    rect(-8,-13,13,18,'#59665c'); rect(-7,4,21,9,'#59665c'); rect(-10,10,25,4,'#40554f'); rect(-5,-11,8,3,'#869482');
  }
  context.restore();
}

export function drawFishing(context, game, { catCanvas, reducedMotion = false } = {}) {
  const rect = (x,y,w,h,color) => { context.fillStyle=color; context.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h)); };
  context.imageSmoothingEnabled = false;
  rect(0,0,800,500,'#cfdbcd');
  rect(0,0,800,45,'#d7dfce');
  rect(680,27,36,36,'#dfcc96'); rect(674,33,48,24,'#dfcc96');
  [[24,78],[475,44],[605,105]].forEach(([x,y])=>{rect(x,y,64,9,'#e9e9d8');rect(x+13,y-9,36,18,'#e9e9d8');});
  [[0,131,100,28],[405,137,130,22],[550,128,95,31],[720,137,80,22]].forEach(([x,y,w,h])=>{rect(x,y,w,h,'#a6b69a');rect(x+19,y-11,w-38,16,'#a6b69a');});
  rect(0,156,800,344,'#789f9e'); rect(0,156,800,9,'#b0c8b3'); rect(0,166,800,65,'#8eafaa');
  rect(0,268,800,100,'#739a99'); rect(0,368,800,132,'#658f91');
  const drift = reducedMotion ? 0 : game.elapsed * 8;
  for(let i=0;i<15;i++){const x=(i*137+drift)%850-25,y=183+i%4*73;rect(x,y,24+i%3*10,2,'#b6cdc066');}
  rect(0,475,800,25,'#a9ab8a');rect(0,475,800,4,'#bfc19d');
  for(let i=0;i<13;i++){const x=i*69+11;rect(x,489,15,4,'#929d80');}
  [32,92,707,761].forEach((x,i)=>{for(let b=0;b<3;b++){rect(x+b*6,445-b%2*15,4,32+b%2*15,'#496f66');rect(x-4+b*6,453-b%2*15,5,4,'#496f66');}});
  if(game.boosts.freeze>0){context.fillStyle='#b6d6e715';context.fillRect(0,166,800,309);}
  for(const item of game.entities)drawLakeItem(context,item);
  // Dock and Mochi sit above the water; equipment comes from the shared wardrobe.
  for(const x of [35,132,235]){rect(x,164,12,77,'#756d55');rect(x+2,164,3,77,'#a28b63');}
  rect(0,145,266,14,'#b39a70');rect(0,159,266,7,'#807258');
  for(let x=18;x<260;x+=35)rect(x,146,2,12,'#8d7959');
  if(catCanvas) context.drawImage(catCanvas,108,54,136,102);
  context.strokeStyle='#695f42';context.lineWidth=5;context.beginPath();context.moveTo(213,130);context.lineTo(288,84);context.lineTo(LAKE.pivotX,LAKE.pivotY);context.stroke();
  context.strokeStyle='#b2a17a';context.lineWidth=2;context.beginPath();context.moveTo(221,124);context.lineTo(288,86);context.lineTo(LAKE.pivotX,LAKE.pivotY);context.stroke();
  const tip=hookPosition(game.hook);
  context.strokeStyle=game.boosts.speed>0?'#f5d478':'#f0e7cd';context.lineWidth=2;context.beginPath();context.moveTo(LAKE.pivotX,LAKE.pivotY);context.lineTo(tip.x,tip.y);context.stroke();
  context.strokeStyle='#ecedda';context.lineWidth=3;context.beginPath();context.moveTo(tip.x,tip.y-5);context.lineTo(tip.x,tip.y+6);context.lineTo(tip.x+6,tip.y+6);context.lineTo(tip.x+7,tip.y+1);context.stroke();
  if(game.hook.payload)drawLakeItem(context,{...game.hook.payload,x:tip.x,y:tip.y+11});
  if(game.status==='playing'&&game.hook.phase==='aim'){
    context.fillStyle='#365b50';context.font='bold 12px Arial';context.textAlign='left';context.fillText(t('SPACE to cast'),20,28);
  }
}
