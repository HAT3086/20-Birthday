import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import * as progress from '../dist/progress.mjs';
import * as art from '../dist/birthday-art.mjs';
import * as birthdayAccess from '../dist/birthday-access.mjs';

const full=()=>({profile:{name:'Mochi'},bonuses:{welcome:true},games:Object.fromEntries(progress.GAMES.map(({id})=>[id,{stars:3,completed:true}])),wallet:{spent:50},skins:{owned:['birthday'],equipped:'birthday'},appearance:{breed:'orange'}});
function fixture(saved={},reduced=false,delayAudio=false,preview=birthdayAccess.BIRTHDAY_PREVIEW_ENABLED){
  const values=new Map([[progress.ARCADE_KEY,JSON.stringify(progress.normalizeArcade(saved))]]),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const nodes=new Map(),timers=new Map(),events=new Map(),docEvents=new Map(),voices=[],audioWaiters=[];let timerId=0,audio;
  const draws=[];const ctx=new Proxy({}, {get:(t,k)=>t[k]??((...args)=>draws.push([k,...args])),set:(t,k,v)=>(t[k]=v,true)});
  const node=id=>{
    if(nodes.has(id))return nodes.get(id);
    const item={hidden:false,textContent:'',events:new Map(),attributes:new Map(),style:{},children:[],
      addEventListener:(name,fn)=>item.events.set(name,fn),setAttribute:(name,value)=>item.attributes.set(name,value),getContext:()=>ctx,replaceChildren:(...children)=>{item.children=children;}};
    nodes.set(id,item);return item;
  };
  const document={hidden:false,getElementById:node,createElement:tag=>tag==='canvas'?{getContext:()=>ctx}:{style:{}},addEventListener:(name,fn)=>docEvents.set(name,fn)};
  const window={innerWidth:1366,matchMedia:()=>({matches:reduced,addEventListener:()=>{}}),addEventListener:(name,fn)=>events.set(name,fn)};
  class Audio {
    constructor(settings){audio=this;this.settings=settings;this.context=null;this.effects=[];}
    async unlock(){this.context??={state:'running',suspend:async()=>{this.context.state='suspended';}};if(delayAudio)await new Promise(resolve=>audioWaiters.push(resolve));this.context.state='running';}
    tone(){const voice={stopped:false,stop(){this.stopped=true;}};voices.push(voice);return voice;}
    effect(name){if(this.settings().sound)this.effects.push(name);}
  }
  const context=vm.createContext({...progress,...art,canOpenBirthday:stars=>birthdayAccess.canOpenBirthday(stars,preview),document,window,ArcadeAudio:Audio,setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id)});
  const source=readFileSync(new URL('../dist/birthday-app.mjs',import.meta.url),'utf8').replace(/^import .*?;\r?\n/gm,'').replace('export function mountBirthday','function mountBirthday');
  vm.runInContext(source,context);context.mountBirthday(storage);
  return {node,storage,timers,events,docEvents,document,window,voices,draws,audio:()=>audio,releaseAudio:()=>audioWaiters.shift()?.(),click:async id=>node(id).events.get('click')()};
}
test('the birthday page remains locked at nineteen stars, including when opened directly',async()=>{
  const saved=full();saved.bonuses.welcome=false;const app=fixture(saved);assert.equal(app.node('birthday-party').hidden,true);assert.equal(app.node('birthday-locked').hidden,false);assert.match(app.node('birthday-remaining').textContent,/1 birthday star to go/);
  await app.click('make-wish');assert.equal(app.node('birthday-party').hidden,true);assert.equal(app.audio().context,null);assert.equal(app.voices.length,0);
});
test('twenty stars reveal the personalized cake and chosen outfit without changing progress or spending',()=>{
  const saved=full(),app=fixture(saved);assert.equal(app.node('birthday-party').hidden,false);assert.equal(app.node('birthday-locked').hidden,true);assert.equal(app.node('birthday-heading').textContent,'Happy 20th, Mochi.');assert.ok(app.draws.length>100);
  assert.deepEqual(progress.loadArcade(app.storage),progress.normalizeArcade(saved));assert.equal(app.audio().context,null);
});
test('making a wish blows out candles, reveals a personal message, and creates confetti; relighting is free',async()=>{
  const app=fixture(full());const before=progress.loadArcade(app.storage);await app.click('make-wish');
  assert.match(app.node('birthday-cake').attributes.get('aria-label'),/blown-out/);assert.match(app.node('birthday-wish-copy').textContent,/Mochi/);assert.equal(app.node('birthday-confetti').children.length,64);assert.match(app.node('make-wish').textContent,/Light the candles/);
  assert.equal(app.node('birthday-wish-extra').hidden,false);assert.match(app.node('birthday-wish-extra').textContent,/be gentle with yourself/);
  await app.click('make-wish');assert.match(app.node('birthday-cake').attributes.get('aria-label'),/lit/);assert.equal(app.node('birthday-wish-extra').hidden,true);assert.equal(app.node('birthday-wish-extra').textContent,'');assert.deepEqual(progress.loadArcade(app.storage),before);
});
test('music requires a click, persists its preference, and stopping it cancels every scheduled note',async()=>{
  const app=fixture(full());assert.equal(app.voices.length,0);await app.click('birthday-music');assert.equal(progress.loadArcade(app.storage).settings.music,true);assert.equal(app.voices.length,25);assert.equal(app.node('birthday-music').attributes.get('aria-pressed'),'true');
  await app.click('birthday-music');assert.equal(progress.loadArcade(app.storage).settings.music,false);assert.ok(app.voices.every(voice=>voice.stopped));assert.equal(app.audio().context.state,'suspended');
});
test('hiding the celebration or leaving it stops animations and music, and returning can resume an existing preference',async()=>{
  const app=fixture(full());await app.click('birthday-music');app.document.hidden=true;app.docEvents.get('visibilitychange')();
  assert.ok(app.voices.every(voice=>voice.stopped));assert.equal(app.audio().context.state,'suspended');assert.equal(app.timers.size,0);
  app.document.hidden=false;app.docEvents.get('visibilitychange')();await Promise.resolve();await Promise.resolve();assert.equal(app.audio().context.state,'running');assert.ok(app.voices.length>25);
  app.events.get('pagehide')();assert.ok(app.voices.every(voice=>voice.stopped));assert.equal(app.node('birthday-confetti').children.length,0);assert.equal(app.timers.size,0);
});
test('reduced motion draws a still cake without a repeating animation timer',async()=>{
  const app=fixture(full(),true);assert.equal(app.timers.size,0);await app.click('make-wish');assert.equal(app.node('birthday-confetti').children.length,32);assert.equal([...app.timers.values()].filter(timer=>timer.ms===180).length,0);
});
test('a storage refresh cannot unlock an incomplete save or keep a revoked celebration active',()=>{
  const app=fixture(full(),false,false,false);progress.saveArcade(app.storage,full());app.storage.setItem(progress.ARCADE_KEY,JSON.stringify(progress.normalizeArcade({bonuses:{welcome:true},profile:{name:'Player'}})));app.events.get('storage')({key:progress.ARCADE_KEY});assert.equal(app.node('birthday-party').hidden,true);assert.equal(app.timers.size,0);
});

test('temporary birthday preview supports candles and music at zero stars without creating achievements',async()=>{
  const app=fixture({profile:{name:'Player'}},false,false,true),before=progress.loadArcade(app.storage);
  assert.equal(app.node('birthday-party').hidden,false);assert.equal(app.node('birthday-stamp-label').textContent,'Birthday preview');
  await app.click('birthday-cake-button');assert.equal(app.node('birthday-party').attributes.get('data-wished'),'true');
  assert.deepEqual(progress.loadArcade(app.storage),before);
  await app.click('birthday-music');const after=progress.loadArcade(app.storage);
  assert.equal(after.settings.music,true);assert.equal(progress.totalStars(after),0);assert.deepEqual(after.games,before.games);assert.deepEqual(after.wallet,before.wallet);assert.deepEqual(after.bonuses,before.bonuses);
});

test('the cake is an alternative wish control, and relighting clears the previous confetti without rewards',async()=>{
  const app=fixture(full()),before=progress.loadArcade(app.storage);
  await app.click('birthday-cake-button');
  assert.equal(app.node('birthday-party').attributes.get('data-wished'),'true');
  assert.match(app.node('birthday-cake-button').attributes.get('aria-label'),/Light/);
  assert.match(app.node('birthday-wish-copy').textContent,/Mochi/);
  await app.click('make-wish');
  assert.equal(app.node('birthday-party').attributes.get('data-wished'),'false');
  assert.match(app.node('birthday-cake-button').attributes.get('aria-label'),/blow out/);
  assert.equal(app.node('birthday-confetti').children.length,0);
  assert.deepEqual(progress.loadArcade(app.storage),before);
});

test('the cats finish their cheer and smoke animation rather than running a permanent loop',async()=>{
  const app=fixture(full());await app.click('make-wish');
  let frames=0;
  for(;;){
    const next=[...app.timers].find(([,timer])=>timer.ms===40);
    if(!next)break;
    assert.ok(frames++<60,'the celebration must settle');app.timers.delete(next[0]);next[1].fn();
  }
  assert.ok(frames>0);assert.equal([...app.timers.values()].some(timer=>timer.ms===180),false);
  const cleanup=[...app.timers].find(([,timer])=>timer.ms===7000);app.timers.delete(cleanup[0]);cleanup[1].fn();
  assert.equal(app.timers.size,0);assert.equal(app.node('birthday-confetti').children.length,0);
});

test('hiding the page stops the wish chime and cheer; reduced motion has no cheer timer',async()=>{
  const app=fixture(full());await app.click('birthday-cake-button');assert.equal(app.voices.length,4);
  app.document.hidden=true;app.docEvents.get('visibilitychange')();
  assert.ok(app.voices.every(voice=>voice.stopped));assert.equal(app.timers.size,0);
  assert.equal(app.node('birthday-party').attributes.get('data-paused'),'true');
  const still=fixture(full(),true);await still.click('birthday-cake-button');
  assert.equal([...still.timers.values()].some(timer=>timer.ms===40),false);
});

test('an audio permission resume finishing after the page is hidden cannot start celebration sounds',async()=>{
  const app=fixture(full(),false,true),click=app.click('make-wish');
  app.document.hidden=true;app.docEvents.get('visibilitychange')();app.releaseAudio();await click;
  assert.equal(app.audio().context.state,'suspended');assert.equal(app.voices.length,0);assert.equal(app.timers.size,0);
});
