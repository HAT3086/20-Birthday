export const ROOF = Object.freeze({ width: 800, height: 500, world: 10540, finish: 10390, catWidth: 28, catHeight: 38, speed: 235, acceleration: 1700, friction: 2100, gravity: 1550, jump: -585, maxFall: 720, coyote: .1, jumpBuffer: .14, maxHearts: 3, stunTime: 5, laserSpeed: 620, laserLife: .85, shotCooldown: .3 });
export const ROOF_SECTIONS = Object.freeze(['Garden Roof', 'Lantern Lane', 'Home Stretch']);
export const ROOF_PLATFORMS = Object.freeze([
  [0, 412, 620, 140, 'roof'], [710, 380, 510, 172, 'roof'], [1320, 410, 580, 142, 'roof'],
  [2000, 365, 580, 187, 'roof'], [2680, 400, 500, 152, 'roof'], [3280, 375, 820, 177, 'roof'],
  [370, 364, 46, 48, 'chimney'], [930, 334, 42, 46, 'chimney'], [1660, 360, 44, 50, 'chimney'],
  [2150, 317, 48, 48, 'chimney'], [2990, 354, 50, 46, 'chimney'], [3460, 325, 52, 50, 'chimney'], [3800, 333, 48, 42, 'chimney'],
  [4200,410,560,142,'roof'],[4860,370,610,182,'roof'],[5570,400,610,152,'roof'],[6280,360,600,192,'roof'],
  [6980,390,610,162,'roof'],[7690,350,600,202,'roof'],[8390,395,590,157,'roof'],[9080,365,620,187,'roof'],[9800,375,740,177,'roof'],
  [4380,378,42,32,'crate'],[4680,366,52,44,'vent'],[4980,314,48,56,'chimney'],[5230,296,64,74,'tank'],
  [5780,372,40,28,'crate'],[5820,344,40,56,'crate'],[6040,358,54,42,'vent'],[6410,332,64,28,'skylight'],[6600,310,50,50,'chimney'],
  [7240,316,68,74,'tank'],[7410,358,42,32,'crate'],[7860,308,56,42,'vent'],[8050,322,38,28,'crate'],
  [8680,367,42,28,'crate'],[8750,339,48,56,'chimney'],[9230,311,50,54,'chimney'],[9440,323,60,42,'vent'],[10090,301,64,74,'tank'],
].map(([x,y,width,height,kind]) => Object.freeze({x,y,width,height,kind})));
export const ROOF_STARS = Object.freeze([
  Object.freeze({id:0,x:3670,y:285}), Object.freeze({id:1,x:7330,y:300}), Object.freeze({id:2,x:10310,y:280}),
]);
export const ROOF_CHECKPOINTS = Object.freeze([
  Object.freeze({x:80,y:374}), Object.freeze({x:2780,y:362}),
  Object.freeze({x:5670,y:362}), Object.freeze({x:8490,y:357}),
]);
export const ROOF_ENEMIES = Object.freeze([
  [530,510,560,412],[1080,1020,1160,380],[1790,1750,1830,410],[2380,2310,2480,365],[3660,3570,3740,375],
  [4600,4580,4625,410],[5160,5140,5190,370],[5940,5900,6000,400],[6740,6690,6810,360],
  [7340,7325,7370,390],[8150,8110,8210,350],[8890,8830,8910,395],[9570,9530,9620,365],[10190,10170,10210,375],
].map(([x,min,max,floor],id)=>Object.freeze({id,x,min,max,y:floor-32,width:30,height:32,speed:32+id%3*5,direction:id%2?-1:1,breed:['british','siamese','ragdoll'][id%3]})));
export const ROOF_BOXES = Object.freeze([
  [250,300],[815,268],[1510,298],[2250,253],[2860,288],[3350,263],[4300,298],[4900,258],
  [5920,288],[6500,248],[7140,278],[7990,238],[8600,283],[9380,253],[10010,263],
].map(([x,y],id)=>Object.freeze({id,x,y,width:32,height:32})));
const clamp = (value,low,high) => Math.max(low,Math.min(high,value));
const integer = (value,max) => Number.isFinite(value) ? clamp(Math.floor(value),0,max) : 0;
const approach = (value,target,amount) => value < target ? Math.min(target,value+amount) : Math.max(target,value-amount);
const overlap = (a,b) => a.x < b.x+b.width && a.x+ROOF.catWidth > b.x && a.y < b.y+b.height && a.y+ROOF.catHeight > b.y;

export function normalizeRoofProgress(raw = {}) {
  const starIds = Array.isArray(raw?.starIds) ? [...new Set(raw.starIds.filter(id => Number.isInteger(id) && id >= 0 && id < 3))].sort() : Array.from({length:integer(raw?.stars,3)},(_,id)=>id);
  return {stars:starIds.length,starIds,best:integer(raw?.best,100),completed:raw?.completed===true};
}

export function awardRoofProgress(raw, ids = [], percent = 0, won = false) {
  const before=normalizeRoofProgress(raw);
  const progress=normalizeRoofProgress({...before,starIds:[...before.starIds,...ids],best:Math.max(before.best,integer(percent,100)),completed:before.completed||won});
  return {progress,starsEarned:progress.stars-before.stars,coinsEarned:(progress.stars-before.stars)*10};
}

export function createRooftop(progress = {}, {random=Math.random} = {}) {
  const spawn=ROOF_CHECKPOINTS[0];
  return {status:'ready',player:{x:spawn.x,y:spawn.y,vx:0,vy:0,grounded:true,facing:1},input:{left:false,right:false},starIds:normalizeRoofProgress(progress).starIds,
    checkpoint:0,falls:0,elapsed:0,furthest:spawn.x,camera:0,coyote:ROOF.coyote,jumpBuffer:0,respawn:0,
    hearts:ROOF.maxHearts,energy:0,shootCooldown:0,invulnerable:0,enemies:ROOF_ENEMIES.map(enemy=>({...enemy,stunned:0,cleared:false})),
    boxes:ROOF_BOXES.map(box=>({...box,used:false,bump:0})),lasers:[],pickups:[],random};
}

export function roofPercent(game) { return game.status==='won' ? 100 : clamp(Math.floor((game.furthest-80)/(ROOF.finish-80)*100),0,99); }
export function jumpRooftop(game) { if(game.status!=='playing'||game.respawn>0)return false;game.jumpBuffer=ROOF.jumpBuffer;return true; }
export function releaseRoofJump(game) { if(game.status==='playing'&&game.player.vy < -260)game.player.vy=-260; }
export function clearRoofInput(game) {game.input.left=false;game.input.right=false;game.jumpBuffer=0;}

export function shootRooftop(game){
  if(game.status!=='playing'||game.respawn>0||game.energy<1||game.shootCooldown>0)return false;
  const p=game.player;game.energy--;game.shootCooldown=ROOF.shotCooldown;
  game.lasers.push({x:p.x+ROOF.catWidth/2+p.facing*18,y:p.y+19,direction:p.facing,life:ROOF.laserLife});return true;
}

function openBox(game,box,result){
  if(box.used)return;
  box.used=true;box.bump=.22;const sample=game.random();
  const type=Number.isFinite(sample)&&sample<.5?'energy':'heart';
  const amount=type==='energy'?3:Number(game.hearts<ROOF.maxHearts);
  if(type==='energy')game.energy+=3;else game.hearts=Math.min(ROOF.maxHearts,game.hearts+1);
  result.boxRewards.push({id:box.id,type,amount});game.pickups.push({x:box.x+16,y:box.y-12,type,life:1.3});
}

function updateCombat(game,dt,result){
  game.shootCooldown=Math.max(0,game.shootCooldown-dt);game.invulnerable=Math.max(0,game.invulnerable-dt);
  for(const box of game.boxes)box.bump=Math.max(0,box.bump-dt);
  for(const pickup of game.pickups){pickup.life-=dt;pickup.y-=28*dt;}
  game.pickups=game.pickups.filter(pickup=>pickup.life>0);
  for(const enemy of game.enemies){
    if(enemy.cleared)continue;
    if(enemy.stunned>0){enemy.stunned=Math.max(0,enemy.stunned-dt);continue;}
    enemy.x+=enemy.direction*enemy.speed*dt;
    if(enemy.x<=enemy.min){enemy.x=enemy.min;enemy.direction=1;}else if(enemy.x>=enemy.max){enemy.x=enemy.max;enemy.direction=-1;}
  }
  for(const laser of game.lasers){
    const old=laser.x;laser.x+=laser.direction*ROOF.laserSpeed*dt;laser.life-=dt;
    const left=Math.min(old,laser.x)-12,right=Math.max(old,laser.x)+12;
    let target=null,nearest=Infinity;
    for(const item of [...ROOF_PLATFORMS,...game.boxes,...game.enemies.filter(enemy=>!enemy.cleared)]){
      if(laser.y<item.y-4||laser.y>item.y+item.height+4||right<item.x||left>item.x+item.width)continue;
      const distance=laser.direction>0?Math.max(0,item.x-old):Math.max(0,old-item.x-item.width);
      if(distance<nearest){nearest=distance;target=item;}
    }
    if(target){laser.life=0;if('stunned'in target){target.stunned=ROOF.stunTime;result.stunned.push(target.id);}}
  }
  game.lasers=game.lasers.filter(laser=>laser.life>0&&laser.x>=0&&laser.x<=ROOF.world);
}

function hurtRooftop(game,result,reason='enemy'){
  game.hearts=Math.max(0,game.hearts-1);game.lasers=[];clearRoofInput(game);result.damaged=true;result.damageReason=reason;
  if(!game.hearts){game.status='lost';game.player.vx=0;result.lost=true;}
  else game.respawn=.65;
}

function respawn(game) {
  const at=ROOF_CHECKPOINTS[game.checkpoint];
  Object.assign(game.player,{x:at.x,y:at.y,vx:0,vy:0,grounded:true});
  game.coyote=ROOF.coyote;game.jumpBuffer=0;game.respawn=0;
  game.invulnerable=1.5;game.lasers=[];
  game.camera=clamp(at.x-260,0,ROOF.world-ROOF.width);
}

export function stepRooftop(game, seconds=1/120) {
  const result={stars:[],jumped:false,checkpoint:false,fell:false,respawned:false,won:false,boxRewards:[],stunned:[],stomped:[],damaged:false,lost:false};
  if(game.status!=='playing'||!Number.isFinite(seconds)||seconds<=0)return result;
  const dt=Math.min(seconds,1/30),p=game.player;
  game.elapsed+=dt;
  if(game.respawn>0){game.respawn=Math.max(0,game.respawn-dt);if(!game.respawn){respawn(game);result.respawned=true;}return result;}
  updateCombat(game,dt,result);
  const direction=Number(game.input.right)-Number(game.input.left);
  p.vx=approach(p.vx,direction*ROOF.speed,(direction?ROOF.acceleration:ROOF.friction)*dt);
  if(direction)p.facing=direction;
  game.coyote=p.grounded?ROOF.coyote:Math.max(0,game.coyote-dt);
  game.jumpBuffer=Math.max(0,game.jumpBuffer-dt);
  if(game.jumpBuffer>0&&game.coyote>0){p.vy=ROOF.jump;p.grounded=false;game.coyote=0;game.jumpBuffer=0;result.jumped=true;}
  p.x=clamp(p.x+p.vx*dt,0,ROOF.world-ROOF.catWidth);
  for(const platform of [...ROOF_PLATFORMS,...game.boxes])if(overlap(p,platform)){
    if(p.vx>0)p.x=platform.x-ROOF.catWidth;else if(p.vx<0)p.x=platform.x+platform.width;p.vx=0;
  }
  const previousY=p.y;
  p.vy=Math.min(ROOF.maxFall,p.vy+ROOF.gravity*dt);p.y+=p.vy*dt;p.grounded=false;
  for(const platform of [...ROOF_PLATFORMS,...game.boxes]){
    if(!overlap(p,platform))continue;
    if(p.vy>=0&&previousY+ROOF.catHeight<=platform.y+.01){p.y=platform.y-ROOF.catHeight;p.vy=0;p.grounded=true;}
    else if(p.vy<0&&previousY>=platform.y+platform.height-.01){p.y=platform.y+platform.height;p.vy=0;if('used'in platform)openBox(game,platform,result);}
  }
  game.furthest=Math.max(game.furthest,p.x);
  for(const enemy of game.enemies){
    if(enemy.cleared||!overlap(p,enemy))continue;
    if(enemy.stunned>0){
      if(p.vy>=0&&previousY+ROOF.catHeight<=enemy.y+10){enemy.cleared=true;p.y=enemy.y-ROOF.catHeight;p.vy=-340;p.grounded=false;result.stomped.push(enemy.id);}
    }else if(game.invulnerable<=0){hurtRooftop(game,result);return result;}
  }
  for(let i=game.checkpoint+1;i<ROOF_CHECKPOINTS.length;i++){
    const at=ROOF_CHECKPOINTS[i];if(p.x>=at.x&&p.y<=at.y+60){game.checkpoint=i;result.checkpoint=true;}
  }
  for(const star of ROOF_STARS){
    if(game.starIds.includes(star.id))continue;
    const dx=star.x-clamp(star.x,p.x,p.x+ROOF.catWidth),dy=star.y-clamp(star.y,p.y,p.y+ROOF.catHeight);
    if(dx*dx+dy*dy<=15*15){game.starIds.push(star.id);result.stars.push(star.id);}
  }
  if(p.y>ROOF.height+55){game.falls++;result.fell=true;hurtRooftop(game,result,'fall');}
  else if(p.x>=ROOF.finish&&p.grounded){game.status='won';p.vx=0;clearRoofInput(game);result.won=true;}
  game.camera+=(clamp(p.x-260,0,ROOF.world-ROOF.width)-game.camera)*Math.min(1,dt*8);
  return result;
}
