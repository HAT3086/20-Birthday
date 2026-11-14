import { ROOF, ROOF_PLATFORMS, ROOF_STARS, ROOF_CHECKPOINTS } from './rooftop-engine.mjs';
import { drawCat } from './art.mjs';
import { breedFor } from './breeds.mjs';

function drawRunner(context,p,{costume='original',breed='original',stride=0,enemy=false,stunned=false}={}){
  const palette=breedFor(breed),rect=(x,y,w,h,c)=>{context.fillStyle=c;context.fillRect(x,y,w,h);};
  context.save();context.translate(p.x+14,p.y+19);if(enemy)context.scale(.88,.88);context.scale(p.facing||1,1);
  rect(-18,5,9,5,palette.markings);rect(-22,0,5,9,palette.markings);rect(-9,6,22,12,palette.outline);
  const coats={gardener:'#89966c',sailor:'#708e9b',bee:'#c5a658',wizard:'#9185aa',astronaut:'#dbe3db',birthday:'#c18c82'};
  rect(-7,6,18,10,coats[costume]||palette.fur);if(costume==='bee')rect(-7,9,18,3,'#77684c');
  rect(-10+stride,15,8,5,palette.shade);rect(5-stride,15,8,5,palette.fur);
  drawCat(context,-17,-22,36,'down',true,stunned,costume,breed);
  if(enemy){rect(-8,5,18,4,stunned?'#82aeb5':'#b27470');rect(6,7,6,5,stunned?'#a6c7c8':'#cb9387');}
  context.restore();
}

export function drawRooftop(context,game,{costume='original',breed='original',reducedMotion=false}={}){
  const rect=(x,y,w,h,color)=>{context.fillStyle=color;context.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
  const camera=game.camera;
  context.imageSmoothingEnabled=false;
  const section=Math.min(2,Math.floor((camera+300)/3500));
  const skies=[['#d7c9ba','#ced4c7','#d8d2bf'],['#d3bcb1','#d4c2b7','#ddc7b5'],['#aebdc3','#b9c6ce','#c1c8c8']][section];
  rect(0,0,800,500,skies[0]);rect(0,0,800,120,skies[1]);rect(0,120,800,100,skies[2]);
  rect(615-camera*.015,46,49,49,'#e3cc99');rect(609-camera*.015,54,61,33,'#e3cc99');
  if(section===2)rect(626-camera*.015,41,35,44,skies[1]);
  for(const [x,y]of [[35,62],[345,106],[732,48],[1030,82]]){
    const cx=((x-camera*.08)%1050+1050)%1050-75;
    rect(cx,y+9,79,11,'#eae8d6');rect(cx+14,y,42,22,'#eae8d6');
  }
  // Distant blocks move gently; the playable rooftops stay crisp in front.
  for(let i=-1;i<13;i++){
    const x=i*91-camera*.16%91,y=244+(i*37%70+70)%70;
    rect(x,y,75,500-y,'#b6b8aa');rect(x+10,y-10,53,12,'#b6b8aa');
    for(let wy=y+24;wy<500;wy+=32)for(let wx=12;wx<65;wx+=22)rect(x+wx,wy,8,13,'#cfccad');
  }
  for(let i=-1;i<10;i++){
    const x=i*128-camera*.32%128,y=300+(i*19%65+65)%65;
    rect(x,y,109,500-y,'#a7afa3');rect(x-3,y,115,7,'#929e91');
    for(let wy=y+24;wy<500;wy+=40)for(let wx=14;wx<100;wx+=27)rect(x+wx,wy,12,19,'#c8c8a6');
  }
  for(const [index,platform]of ROOF_PLATFORMS.entries()){
    const x=platform.x-camera,y=platform.y,w=platform.width;
    if(x+w<-20||x>820)continue;
    if(platform.kind==='chimney'){
      rect(x,y,w,platform.height,'#9c7969');rect(x-5,y-4,w+10,8,'#715f53');rect(x-2,y+2,w+4,5,'#bb9c82');
      for(let by=y+14;by<y+platform.height;by+=12){rect(x+3,by,w-6,2,'#ba9580');rect(x+(by%24<12?12:28),by-10,2,10,'#ba9580');}
    }else if(platform.kind==='roof'){
      const body=['#b9a18c','#aa9382','#baaa8e'][index%3];
      rect(x,y,w,500-y,body);rect(x-4,y-4,w+8,12,'#746955');rect(x,y+4,w,5,'#cfb895');rect(x,y+10,w,7,'#8e7e65');
      for(let wx=platform.x+32;wx<platform.x+w-20;wx+=65){
        const sx=wx-camera;rect(sx,y+39,29,48,'#8b8873');rect(sx+4,y+44,21,36,'#d0c7a2');rect(sx+13,y+43,3,40,'#a3977a');rect(sx+3,y+61,24,3,'#a3977a');
      }
      for(let bx=platform.x+18;bx<platform.x+w;bx+=43)rect(bx-camera,y+24,20,2,'#c8b29a');
      if(index%2===0){rect(x+78,y-32,34,27,'#879d83');rect(x+75,y-35,40,5,'#b0bea0');rect(x+84,y-27,8,14,'#c7d4b3');}
    }else if(platform.kind==='crate'){
      rect(x,y,w,platform.height,'#9f835d');rect(x+3,y+3,w-6,platform.height-6,'#c0a575');
      for(let j=8;j<w-3;j+=12)rect(x+j,y+4,3,platform.height-8,'#a48b61');rect(x,y+platform.height/2,w,4,'#8e7755');
    }else if(platform.kind==='vent'){
      rect(x,y,w,platform.height,'#7f9593');rect(x-3,y-3,w+6,7,'#a9b8ac');rect(x+5,y+8,w-10,platform.height-13,'#657c7b');
      for(let j=13;j<platform.height-3;j+=7)rect(x+8,y+j,w-16,2,'#a6b6a9');
    }else if(platform.kind==='tank'){
      rect(x+8,y+platform.height-16,5,16,'#766a57');rect(x+w-13,y+platform.height-16,5,16,'#766a57');
      rect(x,y+8,w,platform.height-22,'#88a5a5');rect(x+5,y+4,w-10,7,'#aec0b3');rect(x-3,y,w+6,6,'#647f80');
      rect(x+8,y+14,6,platform.height-34,'#afc4ba');rect(x,y+platform.height-25,w,4,'#5f7e7d');
    }else{
      rect(x,y,w,platform.height,'#72898c');rect(x+4,y+4,w-8,platform.height-8,'#a8c4c7');
      rect(x+w/2-2,y+2,4,platform.height-4,'#6f8788');rect(x+7,y+6,w/2-12,3,'#d2dfd4');
    }
  }
  // Plants and little laundry flags make the rooftops feel lived in.
  for(const [x,y]of [[152,412],[1140,380],[1510,410],[2485,365],[2870,400],[3970,375]]){
    const sx=x-camera;rect(sx,y-14,25,14,'#a47c61');rect(sx-2,y-17,29,5,'#be9577');
    rect(sx+10,y-36,5,20,'#6d8761');rect(sx+1,y-30,10,8,'#829569');rect(sx+15,y-39,10,9,'#829569');
  }
  for(const [x,y]of [[470,310],[1750,305],[3090,299]]){
    const sx=x-camera;context.strokeStyle='#8e8972';context.lineWidth=2;context.beginPath();context.moveTo(sx,y);context.quadraticCurveTo(sx+56,y+20,sx+110,y);context.stroke();
    ['#a1ac86','#c29480','#d2bb87','#9cafac'].forEach((c,i)=>{rect(sx+13+i*24,y+5+(i===1||i===2?7:0),15,18,c);});
  }
  for(const [index,roof]of ROOF_PLATFORMS.filter(p=>p.kind==='roof').entries()){
    const x=roof.x-camera,y=roof.y;
    if(x+roof.width<0||x>800)continue;
    if(index%3===0){rect(x+205,y-8,58,7,'#937d5e');rect(x+210,y-4,5,4,'#766950');rect(x+253,y-4,5,4,'#766950');rect(x+210,y-30,5,22,'#937d5e');rect(x+253,y-30,5,22,'#937d5e');rect(x+210,y-30,48,6,'#b29a72');}
    if(index%3===1){rect(x+165,y-75,3,75,'#7a7c69');rect(x+149,y-69,35,3,'#7a7c69');rect(x+153,y-82,25,3,'#7a7c69');}
    if(index>4){
      rect(x+45,y-16,30,16,'#aa8066');rect(x+41,y-19,38,5,'#bd977b');rect(x+57,y-44,5,25,'#718b63');rect(x+48,y-38,24,8,'#8ca174');
      context.strokeStyle='#85816b';context.lineWidth=2;context.beginPath();context.moveTo(x+270,y-88);context.quadraticCurveTo(x+325,y-62,x+390,y-88);context.stroke();
      for(let j=0;j<4;j++){const lx=x+283+j*27,ly=y-78+(j===1||j===2?9:0);rect(lx,ly,13,18,section===1?'#d8b57a':'#c4ac83');rect(lx+3,ly+3,7,11,'#ecd6a1');rect(lx+5,ly-3,3,3,'#8a7d5b');}
    }
  }
  for(const box of game.boxes){
    const x=box.x-camera,y=box.y-(reducedMotion?0:Math.sin(box.bump/.22*Math.PI)*6);
    if(x+32<0||x>800)continue;
    rect(x,y,32,32,box.used?'#8c8b76':'#9d793f');rect(x+3,y+3,26,26,box.used?'#b1ae95':'#d6b369');rect(x+5,y+5,22,3,box.used?'#c4c1a9':'#ecd18e');
    for(const [rx,ry]of [[5,5],[25,5],[5,25],[25,25]])rect(x+rx,y+ry,2,2,'#937a4b');
    if(!box.used){const pixels=['01110','10001','00001','00110','00100','00000','00100'];pixels.forEach((line,py)=>[...line].forEach((v,px)=>{if(v==='1')rect(x+9+px*3,y+6+py*3,3,3,'#765a34');}));}
  }
  for(const enemy of game.enemies){
    if(enemy.cleared||enemy.x-camera<-60||enemy.x-camera>850)continue;
    const x=enemy.x-camera,y=enemy.y,stunned=enemy.stunned>0;
    if(stunned){rect(x-7,y-7,44,3,'#a8d0cd');rect(x-7,y+32,44,3,'#a8d0cd');}
    drawRunner(context,{x,y,facing:enemy.direction},{enemy:true,breed:enemy.breed,stunned,stride:stunned||reducedMotion?0:Math.sin(game.elapsed*12+enemy.id)*2});
    if(stunned){for(let i=0;i<3;i++){const a=(reducedMotion?0:game.elapsed*3)+i*Math.PI*2/3,sx=x+15+Math.cos(a)*20,sy=y-9+Math.sin(a)*5;rect(sx-3,sy,7,2,'#e7cf83');rect(sx,sy-3,2,7,'#e7cf83');}}
  }
  const rainbow=['#c8838c','#d6a56e','#dbc575','#88ad8e','#83adb9','#aa95bc'];
  for(const laser of game.lasers){const x=laser.x-camera;rainbow.forEach((c,i)=>rect(x-15,laser.y-5+i*2,30,2,c));rect(x+(laser.direction>0?14:-17),laser.y-4,4,10,'#efe5c1');}
  for(const pickup of game.pickups){
    const x=pickup.x-camera,y=pickup.y;
    if(pickup.type==='heart'){rect(x-9,y-5,7,7,'#c88d88');rect(x+2,y-5,7,7,'#c88d88');rect(x-8,y+2,16,5,'#c88d88');rect(x-5,y+7,10,4,'#c88d88');rect(x-2,y+11,4,3,'#c88d88');}
    else{rainbow.forEach((c,i)=>rect(x-9,y-7+i*3,18,3,c));context.fillStyle='#3e5950';context.font='bold 12px Arial';context.textAlign='center';context.fillText('+3',x,y-12);}
  }
  for(const [id,at]of ROOF_CHECKPOINTS.entries()){
    const x=at.x-camera+12,y=at.y+ROOF.catHeight;
    rect(x,y-66,4,65,'#81765c');rect(x+4,y-65,32,20,id<=game.checkpoint?'#7c9771':'#b8b298');rect(x+8,y-61,20,4,'#cbd4ae');
    if(id===0){rect(x+46,y-19,40,3,'#807b61');rect(x+78,y-25,3,15,'#807b61');rect(x+74,y-22,4,9,'#807b61');}
  }
  const end=ROOF.finish-camera;
  rect(end+15,285,5,90,'#7f7258');rect(end+20,285,42,27,'#8ca078');rect(end+28,294,8,8,'#e8d7a1');rect(end+31,291,3,14,'#e8d7a1');
  rect(end+79,317,44,58,'#70816b');rect(end+84,322,34,53,'#92a181');rect(end+109,348,4,4,'#ddc38a');
  for(const star of ROOF_STARS){
    if(game.starIds.includes(star.id))continue;
    const x=star.x-camera,y=star.y+(reducedMotion?0:Math.sin(game.elapsed*3+star.id)*3);
    context.save();context.translate(x,y);context.fillStyle='#d7b65f';context.strokeStyle='#947635';context.lineWidth=2;context.beginPath();
    for(let i=0;i<10;i++){const angle=-Math.PI/2+i*Math.PI/5,r=i%2?8:17;const sx=Math.cos(angle)*r,sy=Math.sin(angle)*r;i?context.lineTo(sx,sy):context.moveTo(sx,sy);}
    context.closePath();context.fill();context.stroke();rect(-3,-9,4,5,'#f3d991');context.restore();
  }
  if(game.respawn<=0){
    const p=game.player,stride=p.grounded&&Math.abs(p.vx)>20&&!reducedMotion?Math.sin(game.elapsed*20)*3:0;
    context.save();if(game.invulnerable>0){context.globalAlpha=reducedMotion?.7:Math.floor(game.elapsed*12)%2?.4:1;}
    drawRunner(context,{...p,x:p.x-camera},{costume,breed,stride});context.restore();
    if(game.invulnerable>0){context.strokeStyle='#bcd6ce';context.lineWidth=2;context.strokeRect(p.x-camera-7,p.y-8,42,49);}
  }
}
