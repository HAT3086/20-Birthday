import { drawSittingCat } from './art.mjs';

export function drawBirthdayCake(context, { lit = true, frame = 0, celebration = 1, costume = 'original', breed = 'original', createCanvas = () => document.createElement('canvas') } = {}) {
  context.clearRect(0, 0, 640, 360);
  context.imageSmoothingEnabled = false;
  const rect = (x,y,w,h,color) => { context.fillStyle = color; context.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); };
  const star = (x,y,size,color) => { rect(x-size,y,size*3,size,color);rect(x,y-size,size,size*3,color); };
  const gift = (x,y,w,h,color,ribbon) => {
    rect(x,y,w,h,color);rect(x-2,y-3,w+4,6,color);rect(x+w/2-3,y-3,6,h+3,ribbon);rect(x,y+7,w,4,ribbon);
    rect(x+w/2-13,y-13,9,4,ribbon);rect(x+w/2-16,y-10,4,7,ribbon);rect(x+w/2-12,y-6,11,3,ribbon);
    rect(x+w/2+4,y-13,9,4,ribbon);rect(x+w/2+12,y-10,4,7,ribbon);rect(x+w/2+2,y-6,11,3,ribbon);
    rect(x+3,y+h-3,w-6,3,'#0000000d');
  };
  const balloon = (x,y,color,phase) => {
    const sway=Math.sin(frame*.24+phase)*2;
    for(let i=0;i<9;i++)rect(x+13+sway+Math.sin(i*.8+phase)*3,y+36+i*12,1,13,'#a4ac96');
    rect(x+6+sway,y,18,3,color);rect(x+2+sway,y+3,26,5,color);rect(x+sway,y+8,30,18,color);rect(x+3+sway,y+26,24,6,color);rect(x+8+sway,y+32,14,4,color);rect(x+12+sway,y+36,6,4,color);
    rect(x+6+sway,y+7,4,11,'#ffffff50');rect(x+10+sway,y+4,6,3,'#ffffff35');
  };
  // Bunting and fairy lights frame the cake without covering the candles.
  const partyColors=['#9cad8a','#c39b94','#aca2b9','#c6ad75','#8faeaa'];
  for(let i=0;i<58;i++){
    const x=30+i*10,y=14+Math.sin(i/57*Math.PI)*12;
    rect(x,y,11,2,'#9aa58a');
    if(i%5===2){rect(x+2,y+4,4,7,'#bfa773');rect(x+1,y+6,6,4,lit&&frame%3===i%3?'#ead4a1':'#d5bd85');}
  }
  for(let i=0;i<12;i++){
    const x=44+i*47,y=19+Math.sin((x-30)/580*Math.PI)*12,color=partyColors[i%5];
    rect(x,y,25,8,color);rect(x+3,y+8,19,7,color);rect(x+6,y+15,13,6,color);rect(x+9,y+21,7,5,color);rect(x+12,y+26,1,3,color);
  }
  balloon(38,109,'#b8c6a5',0);balloon(84,65,'#c8a5a0',2);
  balloon(526,70,'#b7adc5',1);balloon(574,117,'#9fbcb6',3);
  // Pixel stars and a softly lit table set the scene around the cake.
  [[95,58],[536,74],[160,115],[480,129],[220,34],[409,42]].forEach(([x,y],i) => {
    const s = 3 + (frame + i) % 2;
    rect(x,y-s,s,s*3,'#b99a61'); rect(x-s,y,s*3,s,'#b99a61');
  });
  rect(28,306,584,8,'#91a083');rect(40,314,560,31,'#c0c8ad');
  rect(48,318,544,3,'#cdd2b8');rect(246,314,148,35,'#ded1b5');
  for(let x=40;x<600;x+=20)rect(x,340,10,7,'#c0c8ad');
  for(let x=255;x<389;x+=14)rect(x,338,5,4,'#ba9e75');
  // Wrapped presents, a party hat, and flowers sit around the two cats.
  gift(53,281,31,26,'#b3a4bd','#e1d3ad');gift(85,294,38,26,'#91aaa0','#e0cfaa');
  gift(528,286,40,32,'#c49e90','#e0cda4');gift(576,275,26,31,'#acb98f','#e4d6b6');
  const flowers=(x,y)=>{
    rect(x+1,y,26,9,'#bc947b');rect(x+4,y+9,20,17,'#bc947b');rect(x+7,y+11,3,12,'#cea78a');
    for(let i=0;i<3;i++){const fx=x+5+i*9,fy=y-20-(i%2)*9;rect(fx,fy,2,y-fy,'#7f966c');rect(fx-4,fy+10,4,3,'#91a67a');rect(fx+2,fy+5,5,3,'#91a67a');star(fx-2,fy-2,3,i===1?'#c4ac78':'#c59c9d');rect(fx,fy,2,2,'#e3d2a1');}
  };
  flowers(23,257);flowers(592,252);
  rect(218,295,204,11,'#8c9e90');rect(204,287,232,9,'#dce0d0');rect(219,282,204,6,'#eef0df');
  // Bottom tier, buttercream, and little strawberry decorations.
  rect(234,205,172,77,'#ac7e69');rect(240,211,160,64,'#cfaa8b');
  rect(240,238,160,9,'#a77a63');rect(240,247,160,8,'#e4c99f');
  rect(227,196,186,21,'#b89570');rect(229,196,182,17,'#e4c99f');
  rect(234,213,17,16,'#e4c99f');rect(269,213,13,11,'#e4c99f');rect(308,213,14,19,'#e4c99f');rect(351,213,13,12,'#e4c99f');rect(389,213,17,16,'#e4c99f');
  rect(260,152,120,46,'#bc8d75');rect(266,160,108,33,'#dab490');rect(266,178,108,6,'#b78871');
  rect(260,194,120,4,'#a77a63');
  rect(254,140,132,21,'#b89570');rect(256,140,128,17,'#efd5a8');
  rect(260,157,12,14,'#efd5a8');rect(297,157,12,11,'#efd5a8');rect(341,157,12,15,'#efd5a8');rect(368,157,12,10,'#efd5a8');
  [246,282,357,393].forEach(x=>{rect(x,193,10,5,'#758d66');rect(x,198,11,8,'#ba776a');rect(x+3,206,5,3,'#ba776a');});
  [[260,259],[284,264],[353,263],[382,257]].forEach(([x,y])=>{rect(x,y,5,3,'#8b9d75');rect(x+10,y-2,4,3,'#b98188');});
  // The candles themselves form a pixel 2 and 0.
  rect(287,95,25,6,'#899c75');rect(306,101,6,13,'#899c75');rect(287,114,25,6,'#899c75');rect(287,120,6,14,'#899c75');rect(287,134,25,6,'#899c75');
  rect(329,95,25,6,'#a496b3');rect(329,101,6,33,'#a496b3');rect(348,101,6,33,'#a496b3');rect(329,134,25,6,'#a496b3');
  rect(298,89,3,6,'#6c6550');rect(340,89,3,6,'#6c6550');
  if (lit) [299,341].forEach((x,i)=>{
    const wobble=(frame+i)%3-1;
    context.save();context.globalAlpha=.11;
    rect(x-14,63,30,30,'#dfb76b');rect(x-8,68,18,25,'#ead29a');context.restore();
    rect(x-4+wobble,75,9,11,'#d6a150');rect(x-1+wobble,69,4,9,'#e8bf69');rect(x-1,80,4,7,'#f1db99');
  });
  else if (celebration < 1) [299,341].forEach((x,i)=>{
    context.save();context.globalAlpha=1-celebration;
    const rise=celebration*45,drift=Math.sin(celebration*6+i)*7;
    rect(x+drift,78-rise,3,7,'#b9bdad');rect(x+3+drift,70-rise,3,6,'#c7cbbd');
    context.restore();
  });
  // Brief radial sparkles and rising wish trails finish with the cat cheer.
  if (!lit && celebration > 0 && celebration < 1) {
    context.save();context.globalAlpha=Math.sin(celebration*Math.PI)*.85;
    [[165,112],[480,107],[320,55]].forEach(([x,y],group)=>{
      const radius=8+celebration*52;
      for(let i=0;i<10;i++){
        const angle=i*Math.PI/5+group*.3,px=x+Math.cos(angle)*radius,py=y+Math.sin(angle)*radius*.7;
        star(Math.round(px),Math.round(py),i%3===0?2:1,partyColors[(i+group)%5]);
      }
    });
    for(let i=0;i<6;i++){
      const x=320+Math.sin(i*2.4)*celebration*125,y=99-celebration*65+i%2*15;
      star(Math.round(x),Math.round(y),2,'#c6a15f');
    }
    context.restore();
  }
  const cat = createCanvas();cat.width=156;cat.height=117;
  const cheer=lit?0:Math.sin(celebration*Math.PI);
  drawSittingCat(cat.getContext('2d'),156,117,costume,breed,{
    expression:lit?'neutral':'happy',pawLeft:lit?0:.7,pawRight:lit?0:.7,
    lift:Math.abs(Math.sin(celebration*Math.PI*3))*cheer*2.2,
    tilt:Math.sin(celebration*Math.PI*4)*cheer*.045,tail:lit?0:Math.sin(celebration*Math.PI*6)*cheer*.2,
  });
  context.drawImage(cat,72,194);context.save();context.translate(568,194);context.scale(-1,1);context.drawImage(cat,0,0);context.restore();
  // Small party treats in front of the table, clear of the characters.
  rect(164,321,29,4,'#e7ddc4');rect(170,312,18,9,'#b59177');rect(167,307,24,6,'#e1c2ad');rect(176,304,6,4,'#bb8e88');
  for(let row=0;row<8;row++)rect(443-row*2,304+row*2,3+row*4,2,row%2?'#aaa0b7':'#c3b5cb');
  rect(423,320,39,3,'#a393ab');star(442,302,2,'#c6ad75');
}
