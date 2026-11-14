import test from 'node:test';
import assert from 'node:assert/strict';
import {ROOF,ROOF_PLATFORMS,ROOF_STARS,ROOF_CHECKPOINTS,ROOF_BOXES,ROOF_ENEMIES,createRooftop,jumpRooftop,shootRooftop,releaseRoofJump,clearRoofInput,stepRooftop,roofPercent,normalizeRoofProgress,awardRoofProgress} from '../dist/rooftop-engine.mjs';

const play=progress=>{const game=createRooftop(progress);game.status='playing';return game;};
const advance=(game,seconds)=>{for(let i=0;i<Math.round(seconds*120);i++)stepRooftop(game);};

test('a new rooftop adventure has three unique stars and safe checkpoints',()=>{
  const game=createRooftop();assert.equal(game.status,'ready');assert.equal(jumpRooftop(game),false);assert.equal(ROOF_STARS.length,3);assert.equal(new Set(ROOF_STARS.map(s=>s.id)).size,3);
  for(const checkpoint of ROOF_CHECKPOINTS)assert.ok(ROOF_PLATFORMS.some(p=>checkpoint.x>=p.x&&checkpoint.x+ROOF.catWidth<=p.x+p.width&&checkpoint.y+ROOF.catHeight===p.y));
});

test('running accelerates, stops when released, faces the movement direction, and respects the left edge',()=>{
  const game=play();game.input.right=true;advance(game,.4);assert.equal(game.player.vx,ROOF.speed);assert.ok(game.player.x>100);
  clearRoofInput(game);advance(game,.2);assert.equal(game.player.vx,0);
  game.input.left=true;advance(game,1.3);assert.equal(game.player.facing,-1);assert.equal(game.player.x,0);
});

test('chimney sides block walking and a real jump clears them',()=>{
  const game=play();game.player.x=330;game.input.right=true;advance(game,.5);
  assert.equal(game.player.x,370-ROOF.catWidth);assert.equal(game.player.vx,0);
  jumpRooftop(game);advance(game,.7);assert.ok(game.player.x>416);assert.equal(game.falls,0);
});

test('holding a jump gives a higher arc than releasing early; midair jumps cannot stack',()=>{
  const high=play(),low=play();jumpRooftop(high);jumpRooftop(low);stepRooftop(high);stepRooftop(low);releaseRoofJump(low);
  advance(high,.2);advance(low,.2);assert.ok(high.player.y<low.player.y-30);
  const before=high.player.vy;jumpRooftop(high);stepRooftop(high);assert.ok(high.player.vy>before);
});

test('coyote time and a buffered jump make edges and landings forgiving',()=>{
  const edge=play();edge.player.x=622;edge.player.grounded=false;edge.coyote=.06;jumpRooftop(edge);assert.equal(stepRooftop(edge).jumped,true);
  const landing=play();landing.player.y=365;landing.player.vy=200;landing.player.grounded=false;landing.coyote=0;jumpRooftop(landing);
  let jumped=false;for(let i=0;i<12;i++)jumped ||= stepRooftop(landing).jumped;
  assert.equal(jumped,true);
});

test('stars are collected by identity and do not reappear after falling or replaying',()=>{
  const game=play();const star=ROOF_STARS[1];game.player.x=star.x;game.player.y=star.y;game.player.grounded=false;
  assert.deepEqual(stepRooftop(game).stars,[1]);assert.deepEqual(stepRooftop(game).stars,[]);
  const saved=awardRoofProgress({},game.starIds,50).progress;assert.equal(saved.stars,1);assert.equal(saved.completed,false);
  const replay=play(saved);replay.player.x=star.x;replay.player.y=star.y;assert.deepEqual(stepRooftop(replay).stars,[]);
  assert.equal(awardRoofProgress(saved,[1],50).coinsEarned,0);assert.equal(awardRoofProgress(saved,[0],50).coinsEarned,10);
});

test('falls cost one heart and respawn at the latest checkpoint; the third fall ends the run',()=>{
  const game=play({starIds:[0]});game.player.x=ROOF_CHECKPOINTS[1].x;game.player.y=ROOF_CHECKPOINTS[1].y;
  assert.equal(stepRooftop(game).checkpoint,true);assert.equal(game.checkpoint,1);
  for(let fall=0;fall<2;fall++){
    game.player.y=600;assert.equal(stepRooftop(game).fell,true);advance(game,.7);
    assert.equal(game.player.x,ROOF_CHECKPOINTS[1].x);assert.equal(game.falls,fall+1);assert.equal(game.hearts,2-fall);assert.deepEqual(game.starIds,[0]);
  }
  game.player.y=600;const final=stepRooftop(game);assert.equal(final.lost,true);assert.equal(game.hearts,0);assert.equal(game.status,'lost');
  const before=JSON.stringify(game);advance(game,1);assert.equal(JSON.stringify(game),before);
});

test('pause freezes physics, jump requests, and respawn timers',()=>{
  const game=play();game.respawn=.5;game.status='paused';const before=JSON.stringify(game);advance(game,1);
  assert.equal(JSON.stringify(game),before);assert.equal(jumpRooftop(game),false);
});

test('reaching the flag completes the course independently of the optional stars',()=>{
  const game=play();game.player.x=ROOF.finish;game.player.y=375-ROOF.catHeight;
  assert.equal(stepRooftop(game).won,true);assert.equal(roofPercent(game),100);
  const result=awardRoofProgress({},game.starIds,100,true);assert.equal(result.progress.completed,true);assert.equal(result.coinsEarned,0);
  const before=JSON.stringify(game);stepRooftop(game);assert.equal(JSON.stringify(game),before);
});

test('legacy counts migrate to identities and malformed saves cannot inflate rewards',()=>{
  assert.deepEqual(normalizeRoofProgress({stars:2}).starIds,[0,1]);assert.deepEqual(normalizeRoofProgress({starIds:[2,2,-1,'0',8]}).starIds,[2]);
  const full=awardRoofProgress(null,[0,1,2,2,99],100,true);assert.equal(full.coinsEarned,30);assert.equal(awardRoofProgress(full.progress,[0,1,2],100,true).coinsEarned,0);
});

// Use only running and timed jump input: no position changes during this route.
export function traverseRooftop(game){
  let target=null,stompWait=0;
  for(let frame=0;frame<120*240&&game.status==='playing';frame++){
    const p=game.player;
    game.input.right=true;
    if(target?.cleared||target?.stunned<=0)target=null;
    const enemy=game.enemies.find(e=>!e.cleared&&e.x+e.width>p.x&&e.x-(p.x+ROOF.catWidth)<220);
    if(enemy&&game.energy>0&&p.y+19>enemy.y&&p.y+19<enemy.y+enemy.height)shootRooftop(game);
    if(enemy?.stunned>0&&enemy.x-(p.x+ROOF.catWidth)<85)target=enemy;
    if(target){
      if(p.grounded)jumpRooftop(game);
      if(p.x+14>=target.x+12)game.input.right=false;
    }
    if(p.grounded&&game.respawn===0){
      const roof=ROOF_PLATFORMS.find(r=>r.kind==='roof'&&p.x+ROOF.catWidth>r.x&&p.x<r.x+r.width&&Math.abs(p.y+ROOF.catHeight-r.y)<1);
      const obstacle=ROOF_PLATFORMS.find(r=>r.kind!=='roof'&&r.x>=p.x+ROOF.catWidth-1&&r.x-(p.x+ROOF.catWidth)<70);
      const star=ROOF_STARS.find(s=>!game.starIds.includes(s.id)&&s.y<p.y-10&&s.x-(p.x+14)>0&&s.x-(p.x+14)<65);
      const box=game.boxes.find(b=>!b.used&&b.x-p.x>-5&&b.x-p.x<26&&p.y>b.y+32);
      const evade=enemy&&enemy.stunned<=0&&enemy.x-(p.x+ROOF.catWidth)<70;
      if(obstacle||star||box||evade||roof&&roof.x+roof.width-(p.x+ROOF.catWidth)<32)jumpRooftop(game);
    }
    if(stompWait>0){game.input.right=false;stompWait-=1/120;}
    const result=stepRooftop(game);if(result.stomped.length)stompWait=.6;
  }
  return game;
}

test('a complete run can collect all three stars and reach the finish using real movement',()=>{
  const game=createRooftop({}, {random:()=>.25});game.status='playing';traverseRooftop(game);
  assert.equal(game.status,'won',`stopped at ${game.player.x}, ${game.player.y}, falls ${game.falls}, hearts ${game.hearts}, energy ${game.energy}`);
  assert.deepEqual([...game.starIds].sort(),[0,1,2]);assert.equal(game.checkpoint,ROOF_CHECKPOINTS.length-1);assert.ok(game.hearts>0);assert.ok(game.elapsed>40);
  assert.ok(game.enemies.filter(enemy=>enemy.cleared).length>=5);assert.ok(game.boxes.filter(box=>box.used).length>=5);
});

function bumpFirstBox(random,hearts=3){
  const game=createRooftop({}, {random});game.status='playing';game.hearts=hearts;
  game.player.x=ROOF_BOXES[0].x+2;jumpRooftop(game);let result;
  for(let i=0;i<100;i++){result=stepRooftop(game);if(result.boxRewards.length)break;}
  return {game,result};
}

test('the expanded route has fifteen rooftops, four safe flags, varied obstacles, boxes, and patrols',()=>{
  assert.equal(ROOF_PLATFORMS.filter(p=>p.kind==='roof').length,15);assert.equal(ROOF_CHECKPOINTS.length,4);assert.ok(ROOF.finish>3920*2.5);
  for(const kind of ['crate','vent','tank','skylight'])assert.ok(ROOF_PLATFORMS.some(p=>p.kind===kind));
  assert.equal(ROOF_BOXES.length,15);assert.equal(ROOF_ENEMIES.length,14);
});

test('bumping a box from below rolls 50/50 for three energy or one capped heart, once per run',()=>{
  const energy=bumpFirstBox(()=>.499,2);assert.equal(energy.result.boxRewards[0].type,'energy');assert.equal(energy.game.energy,3);assert.equal(energy.game.hearts,2);
  const heart=bumpFirstBox(()=>.5,2);assert.equal(heart.result.boxRewards[0].type,'heart');assert.equal(heart.game.hearts,3);assert.equal(heart.game.energy,0);
  assert.equal(bumpFirstBox(()=>.9).game.hearts,3);
  const game=energy.game;advance(game,1);jumpRooftop(game);advance(game,1);assert.equal(game.energy,3);assert.equal(game.boxes[0].used,true);
  assert.equal(awardRoofProgress({},game.starIds,roofPercent(game)).coinsEarned,0);
});

test('standing on a box does not award its contents',()=>{
  const game=play(),box=game.boxes[0];game.player.x=box.x;game.player.y=box.y-ROOF.catHeight-2;game.player.vy=200;game.player.grounded=false;
  advance(game,.1);assert.equal(box.used,false);assert.equal(game.energy,0);assert.equal(game.player.y,box.y-ROOF.catHeight);
});

test('patrolling cats turn at their bounds, stop when stunned, then resume after five seconds',()=>{
  const game=play(),enemy=game.enemies[0];enemy.x=enemy.max-.01;enemy.direction=1;stepRooftop(game);assert.equal(enemy.direction,-1);
  enemy.stunned=ROOF.stunTime;const x=enemy.x;advance(game,1);assert.equal(enemy.x,x);advance(game,4.1);assert.ok(enemy.x<x);assert.equal(enemy.stunned,0);
});

test('one laser costs one energy, respects cooldown and pause, and never fires with an empty tank',()=>{
  const game=play();assert.equal(shootRooftop(game),false);game.energy=3;assert.equal(shootRooftop(game),true);assert.equal(game.energy,2);
  assert.equal(shootRooftop(game),false);advance(game,.31);assert.equal(shootRooftop(game),true);assert.equal(game.energy,1);
  game.status='paused';const before=JSON.stringify(game);assert.equal(shootRooftop(game),false);advance(game,1);assert.equal(JSON.stringify(game),before);
});

test('a rainbow laser stuns but only a downward jump on that cat clears it',()=>{
  const game=play();game.player.x=470;game.energy=3;const enemy=game.enemies[0];shootRooftop(game);advance(game,.15);
  assert.ok(enemy.stunned>0);assert.equal(enemy.cleared,false);assert.equal(game.energy,2);
  game.player.x=enemy.x;game.player.y=enemy.y;stepRooftop(game);assert.equal(enemy.cleared,false);assert.equal(game.hearts,3);
  game.player.y=enemy.y-ROOF.catHeight-1;game.player.vy=180;game.player.grounded=false;
  const result=stepRooftop(game);assert.deepEqual(result.stomped,[enemy.id]);assert.equal(enemy.cleared,true);assert.ok(game.player.vy<0);assert.equal(game.energy,2);
});

test('active cats hurt from any direction; damage sends the player to a flag and zero hearts ends the run',()=>{
  const game=play(),enemy=game.enemies[0];
  for(let heart=2;heart>=0;heart--){
    game.invulnerable=0;game.player.x=enemy.x;game.player.y=enemy.y;game.player.vy=0;
    const result=stepRooftop(game);assert.equal(result.damaged,true);assert.equal(game.hearts,heart);assert.equal(enemy.cleared,false);
    if(heart){advance(game,.7);assert.equal(game.player.x,80);assert.ok(game.invulnerable>0);}
    else{assert.equal(result.lost,true);assert.equal(game.status,'lost');assert.equal(shootRooftop(game),false);}
  }
});

test('respawn shielding prevents an immediate second hit and a fresh run resets combat resources',()=>{
  const game=play({starIds:[2]}),enemy=game.enemies[0];game.player.x=enemy.x;game.player.y=enemy.y;stepRooftop(game);advance(game,.7);
  game.player.x=enemy.x;game.player.y=enemy.y;advance(game,.2);assert.equal(game.hearts,2);
  const fresh=createRooftop({starIds:game.starIds});assert.equal(fresh.hearts,3);assert.equal(fresh.energy,0);assert.ok(fresh.boxes.every(box=>!box.used));assert.ok(fresh.enemies.every(e=>!e.cleared));assert.deepEqual(fresh.starIds,[2]);
});

test('solid obstacles block rainbow shots before they reach a cat',()=>{
  const game=play();game.player.x=335;game.energy=1;shootRooftop(game);advance(game,.4);assert.equal(game.enemies[0].stunned,0);assert.equal(game.lasers.length,0);
});
