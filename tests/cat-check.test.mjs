import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, readdirSync } from 'node:fs';
import * as progress from '../dist/progress.mjs';
import * as check from '../dist/cat-check-engine.mjs';
import * as art from '../dist/art.mjs';
import * as visit from '../dist/entry-session.mjs';

const cat = { class:'cat', score:.9, bbox:[50,50,300,240] };
const memory = saved => {
  const data=new Map([[progress.ARCADE_KEY,JSON.stringify(progress.normalizeArcade(saved))]]);
  return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
};
test('camera verification needs three consecutive clear cat frames; a miss resets the streak',()=>{
  const state=check.createCatCheck();check.observeCat(state,[cat],640,400);assert.equal(state.hits,1);assert.equal(state.verified,false);
  check.observeCat(state,[],640,400);assert.equal(state.hits,0);
  for(let i=0;i<3;i++)check.observeCat(state,[cat],640,400);
  assert.equal(state.verified,true);check.observeCat(state,[],640,400);assert.equal(state.verified,true);
});
test('dogs, low confidence, tiny cats, invalid boxes, and malformed results cannot verify a cat',()=>{
  for(const value of [{...cat,class:'dog'},{...cat,score:.59},{...cat,score:Infinity},{...cat,score:2},{...cat,bbox:[0,0,2,2]},{...cat,bbox:[0,0,-40,80]},{...cat,bbox:[0,0,NaN,80]},null])assert.equal(check.findCat([value],640,400),null);
  assert.equal(check.findCat([cat],0,400),null);assert.equal(check.findCat(null,640,400),null);assert.equal(check.findCat([cat],640,400),cat);
});
test('a name alone cannot grant the welcome star, and empty names cannot complete verification',()=>{
  assert.equal(check.completeCheckIn({},'Player',false).ok,false);
  assert.equal(check.completeCheckIn({},'   ',true).ok,false);
  const result=check.completeCheckIn({},'  Birthday   Cat  ',true);
  assert.equal(result.ok,true);assert.equal(result.state.profile.name,'Birthday Cat');assert.equal(result.starEarned,true);assert.equal(progress.totalStars(result.state),1);assert.equal(result.state.wallet.coins,0);
});
test('check-in preserves all game rewards, purchases, equipment, and breed; repeating it pays nothing',()=>{
  const saved=progress.normalizeArcade({games:Object.fromEntries(progress.GAMES.map(({id})=>[id,{stars:3,completed:true}])),wallet:{spent:50},skins:{owned:['birthday'],equipped:'birthday'},appearance:{breed:'orange'}});
  const first=check.completeCheckIn(saved,'Mochi',true);assert.equal(progress.totalStars(first.state),20);assert.equal(first.state.wallet.coins,130);assert.equal(first.state.skins.equipped,'birthday');assert.equal(first.state.appearance.breed,'orange');
  const again=check.completeCheckIn(first.state,'Mochi',true);assert.equal(again.ok,true);assert.equal(again.starEarned,false);assert.deepEqual(again.state,first.state);
});
test('return destinations are restricted to arcade pages and never accept external or injected URLs',()=>{
  for(const id of ['snake','flappy','rooftop','fishing','candy','catris','shop','birthday'])assert.equal(check.arcadeDestination(`/${id}`),`./${id}.html`);
  assert.equal(check.arcadeDestination('./catris.html'),'./catris.html');
  for(const value of ['https://evil.test','//evil.test','javascript:alert(1)','../shop.html','shop.html?next=https://evil.test','/missing',null])assert.equal(check.arcadeDestination(value),'./');
});
test('permission, absent-camera, and busy-camera errors all offer a cat-photo alternative',()=>{
  assert.match(check.cameraMessage({name:'NotAllowedError'}),/browser or device/);assert.match(check.cameraMessage({name:'NotFoundError'}),/No camera/);assert.match(check.cameraMessage({name:'NotReadableError'}),/busy/);
  for(const name of ['NotAllowedError','NotFoundError','NotReadableError','Unknown'])assert.match(check.cameraMessage({name}),/photo/);
});
test('stale game tabs preserve a newly checked-in name, welcome star, spending, and equipment',()=>{
  const storage=memory({profile:{name:'Old name'},games:{snake:{stars:2}},wallet:{spent:10},skins:{owned:['sailor'],equipped:'sailor'}});
  const stale=progress.loadArcade(storage);
  const result=check.completeCheckIn(stale,'New name',true);assert.equal(progress.saveArcade(storage,result.state,{profile:true}),true);
  stale.games.flappy.stars=1;progress.saveArcade(storage,stale);
  const saved=progress.loadArcade(storage);assert.equal(saved.profile.name,'New name');assert.equal(saved.bonuses.welcome,true);assert.equal(saved.wallet.coins,20);assert.equal(saved.skins.equipped,'sailor');
});

function fixture(saved={}, options={}) {
  const storage=memory(saved),session=memory();if(options.failSession)session.setItem=()=>{throw Error('blocked');};if(options.failSave)storage.setItem=()=>{throw Error('blocked');};
  const warnings=[];const nodes=new Map(),timers=new Map(),events=new Map(),docEvents=new Map();let id=0,stopped=0,detected=0,loads=0,redirect='';
  const ctx=new Proxy({}, {get:(t,k)=>t[k]??(()=>{}),set:(t,k,v)=>(t[k]=v,true)});
  const node=id=>{
    if(nodes.has(id))return nodes.get(id);
    const item={hidden:['entry-form','cat-video','photo-preview','cat-verified','stop-camera','check-error','name-error','resume-camera'].includes(id),disabled:false,textContent:'',value:'',width:640,height:400,videoWidth:640,videoHeight:400,readyState:2,srcObject:null,files:[],events:new Map(),children:[],classList:{add:()=>{},toggle:()=>{}},
      addEventListener:(name,fn)=>item.events.set(name,fn),getContext:()=>ctx,focus:()=>{},click:()=>{},play:options.playCamera??(async()=>{}),};nodes.set(id,item);return item;
  };
  node('check-pips').children=Array.from({length:3},()=>({classList:{toggle:()=>{}}}));
  const stream={getTracks:()=>[{stop:()=>stopped++}]};
  const document={hidden:false,getElementById:node,addEventListener:(name,fn)=>docEvents.set(name,fn)};
  const window={localStorage:storage,sessionStorage:session,innerWidth:1366,location:{href:'http://test/check-in.html?next=catris',replace:value=>{redirect=value;}},addEventListener:(name,fn)=>events.set(name,fn)};
  const model={detect:async()=>{detected++;return options.predictions??[cat];}};
  const context=vm.createContext({...progress,...check,...art,...visit,document,window,URL,console:{warn:message=>warnings.push(message)},
    navigator:{mediaDevices:{getUserMedia:options.getCamera??(async()=>stream)}},
    loadCatDetector:options.loadDetector??(async()=>{loads++;return model;}),
    createImageBitmap:async()=>({width:640,height:400,close:()=>{}}),
    setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimeout:key=>timers.delete(key),
  });
  vm.runInContext(readFileSync(new URL('../dist/check-in.mjs',import.meta.url),'utf8').replace(/^import .*?;\r?\n/gm,''),context);
  const click=async(id)=>{await node(id).events.get('click')();};
  const submit=()=>node('entry-form').events.get('submit')({preventDefault:()=>{}});
  const tick=async()=>{const [key,timer]=timers.entries().next().value??[];if(timer){timers.delete(key);await timer.fn();}};
  return {node,storage,session,warnings,click,submit,tick,events,docEvents,timers,document,window,counts:()=>({stopped,detected,loads}),redirect:()=>redirect};
}
test('check-in asks before opening any camera and does not load a detector on an idle page',()=>{
  const app=fixture({profile:{name:'Existing Player'}});assert.equal(app.counts().loads,0);assert.equal(app.node('entry-form').hidden,true);assert.equal(progress.loadArcade(app.storage).bonuses.welcome,false);
});
test('three live detections release the camera, open the name step, and save only one welcome star',async()=>{
  const app=fixture({games:{snake:{stars:2}}});await app.click('start-camera');assert.equal(app.node('entry-form').hidden,true);
  await app.tick();await app.tick();assert.equal(app.node('entry-form').hidden,false);assert.equal(app.counts().stopped,1);assert.equal(app.node('cat-video').srcObject,null);assert.equal(app.timers.size,0);
  app.node('entry-name').value='Player';app.submit();assert.equal(app.redirect(),'./catris.html');const saved=progress.loadArcade(app.storage);assert.equal(saved.bonuses.welcome,true);assert.equal(saved.wallet.coins,20);assert.equal(progress.totalStars(saved),3);
});
test('a dog photo does not unlock the name form, while a genuine cat photo does',async()=>{
  for(const [predictions,approved] of [[[cat],true],[[{...cat,class:'dog'}],false]]){
    const app=fixture({}, {predictions});app.node('cat-photo').files=[{type:'image/jpeg',size:2000}];await app.node('cat-photo').events.get('change')();
    assert.equal(app.node('entry-form').hidden,!approved);assert.equal(progress.loadArcade(app.storage).bonuses.welcome,false);assert.equal(app.counts().stopped,0);
  }
});
test('a blocked camera provides recovery without granting a star or leaving controls disabled',async()=>{
  const app=fixture({}, {getCamera:async()=>{const error=Error();error.name='NotAllowedError';throw error;}});await app.click('start-camera');
  assert.match(app.node('check-error').textContent,/browser or device/);assert.equal(app.node('choose-photo').disabled,false);assert.equal(app.node('entry-form').hidden,true);assert.equal(progress.loadArcade(app.storage).bonuses.welcome,false);
});
test('hiding a tab, leaving it, stopping manually, or shrinking the window releases live camera tracks',async()=>{
  for(const event of ['hidden','pagehide','resize','stop']){
    const app=fixture();await app.click('start-camera');
    if(event==='hidden'){app.document.hidden=true;app.docEvents.get('visibilitychange')();}
    else if(event==='resize'){app.window.innerWidth=900;app.events.get('resize')();}
    else if(event==='stop')await app.click('stop-camera');else app.events.get('pagehide')();
    assert.equal(app.counts().stopped,1);assert.equal(app.timers.size,0);assert.equal(app.node('choose-photo').disabled,false);
  }
});
test('a camera permission response arriving after departure is stopped and cannot verify the visitor',async()=>{
  let answer,entered;const requested=new Promise(resolve=>{entered=resolve;});const app=fixture({}, {getCamera:()=>{entered();return new Promise(resolve=>{answer=resolve;});}});const starting=app.click('start-camera');
  await requested;let stopped=0;app.events.get('pagehide')();answer({getTracks:()=>[{stop:()=>stopped++}]});await starting;
  assert.equal(stopped,1);assert.equal(app.node('entry-form').hidden,true);assert.equal(app.counts().detected,0);
});
test('invalid photos are rejected before detection and failed saves keep the approved name step available',async()=>{
  const invalid=fixture();invalid.node('cat-photo').files=[{type:'image/svg+xml',size:10}];await invalid.node('cat-photo').events.get('change')();assert.equal(invalid.counts().loads,0);assert.match(invalid.node('check-error').textContent,/JPG/);
  const app=fixture({}, {failSave:true});app.node('cat-photo').files=[{type:'image/png',size:100}];await app.node('cat-photo').events.get('change')();app.node('entry-name').value='Player';app.submit();
  assert.equal(app.redirect(),'');assert.equal(app.node('entry-form').hidden,false);assert.match(app.node('name-error').textContent,/couldn’t save/);
});
test('saved names skip the name form only after a fresh successful cat check',async()=>{
  const app=fixture({profile:{name:'Player'},bonuses:{welcome:true},games:{snake:{stars:2}}});
  assert.equal(app.redirect(),'');assert.equal(app.counts().loads,0);assert.equal(visit.hasArcadeVisit(app.session),false);
  app.node('cat-photo').files=[{type:'image/jpeg',size:100}];await app.node('cat-photo').events.get('change')();
  assert.equal(app.redirect(),'./catris.html');assert.equal(app.node('entry-name').disabled,true);assert.equal(visit.hasArcadeVisit(app.session),true);
  assert.equal(progress.loadArcade(app.storage).profile.name,'Player');assert.equal(progress.loadArcade(app.storage).wallet.coins,20);assert.equal(progress.totalStars(progress.loadArcade(app.storage)),3);
});
test('a previously collected welcome star never bypasses the current cat check',()=>{
  const saved=progress.normalizeArcade({profile:{name:'Player'},bonuses:{welcome:true}});
  assert.equal(check.completeCheckIn(saved,'Player',false).ok,false);
  const app=fixture(saved);app.submit();assert.equal(app.redirect(),'');assert.match(app.node('name-error').textContent,/meet your cat/);
});
test('Exit camera is available during model loading and cancels a late detector response',async()=>{
  let resolve,entered;const requested=new Promise(answer=>{entered=answer;});const app=fixture({}, {loadDetector:()=>{entered();return new Promise(answer=>{resolve=answer;});}});
  const starting=app.click('start-camera');await requested;assert.equal(app.node('stop-camera').hidden,false);assert.equal(app.node('choose-photo').disabled,false);
  await app.click('stop-camera');assert.equal(app.node('stop-camera').hidden,true);assert.equal(app.node('choose-photo').disabled,false);assert.match(app.node('check-status').textContent,/Choose a photo/);
  resolve({detect:async()=>[cat]});await starting;assert.equal(app.counts().detected,0);assert.equal(app.node('cat-video').srcObject,null);
});
test('choosing a photo from camera mode releases the stream and leaves the file picker available',async()=>{
  const app=fixture({}, {predictions:[]});await app.click('start-camera');assert.equal(app.node('choose-photo').disabled,false);
  await app.click('choose-photo');assert.equal(app.counts().stopped,1);assert.equal(app.node('cat-video').srcObject,null);assert.equal(app.node('stop-camera').hidden,true);assert.equal(app.node('choose-photo').disabled,false);
});
test('a missing visit store cannot cause a redirect loop after approval',async()=>{
  const app=fixture({profile:{name:'Player'},bonuses:{welcome:true}}, {failSession:true});app.node('cat-photo').files=[{type:'image/jpeg',size:100}];await app.node('cat-photo').events.get('change')();
  assert.equal(app.redirect(),'');assert.equal(app.node('entry-form').hidden,false);assert.match(app.node('name-error').textContent,/session storage/);
});
test('all protected pages require a fresh visit and retain their safe return destination',()=>{
  const script=readFileSync(new URL('../dist/entry-guard.mjs',import.meta.url),'utf8').replace(/^import .*?;\r?\n/gm,'').replace('import.meta.url',"'http://test/entry-guard.mjs'");
  for(const scenario of [
    {saved:{},approved:false,referrer:''},
    {saved:{profile:{name:'Player'},bonuses:{welcome:true}},approved:false,referrer:'http://test/'},
    {saved:{profile:{name:'Player'},bonuses:{welcome:true}},approved:true,referrer:''},
    {saved:{profile:{name:'Player'},bonuses:{welcome:true}},approved:true,referrer:'https://other.test/'},
    {saved:{profile:{name:'Player'},bonuses:{welcome:true}},approved:true,referrer:'http://test/',type:'reload'},
    {saved:{profile:{name:'Player'},bonuses:{welcome:true}},approved:true,referrer:'http://test/check-in.html',allowed:true},
    {saved:{profile:{name:'Player'},bonuses:{welcome:true}},approved:true,referrer:'http://test/candy',allowed:true},
  ]){
    const session=memory();if(scenario.approved)visit.beginArcadeVisit(session);let redirected='';
    vm.runInNewContext(script,{...progress,...check,...visit,URL,document:{referrer:scenario.referrer},window:{localStorage:memory(scenario.saved),sessionStorage:session,performance:{getEntriesByType:()=>[{type:scenario.type||'navigate'}]},location:{pathname:'/shop',href:'http://test/shop',replace:value=>redirected=value},addEventListener:()=>{}}});
    if(scenario.allowed)assert.equal(redirected,'');else assert.match(redirected,/check-in\.html\?next=.%2Fshop.html$/);
  }
  for(const file of readdirSync(new URL('../dist/',import.meta.url)).filter(name=>name.endsWith('.html')&&name!=='check-in.html'))assert.match(readFileSync(new URL(`../dist/${file}`,import.meta.url),'utf8'),/src="\.\/entry-guard.mjs"/);
});


test('the camera permission request starts directly from the click before any model download',async()=>{
  const order=[];const app=fixture({}, {getCamera:async()=>{order.push('permission');return {getTracks:()=>[{stop:()=>{}}]};},loadDetector:async()=>{order.push('model');return {detect:async()=>[]};}});
  const starting=app.click('start-camera');assert.deepEqual(order,['permission']);await starting;assert.deepEqual(order,['permission','model']);
});
test('a granted camera with blocked playback keeps its stream and offers Start preview instead of a permission error',async()=>{
  let plays=0;const app=fixture({}, {playCamera:async()=>{if(plays++===0){const e=Error('play() needs a user gesture');e.name='NotAllowedError';throw e;}}});
  await app.click('start-camera');assert.equal(app.node('resume-camera').hidden,false);assert.equal(app.counts().stopped,0);assert.equal(app.counts().loads,0);assert.match(app.node('check-status').textContent,/Camera allowed/);assert.doesNotMatch(app.node('check-error').textContent,/blocked|couldn’t open/);
  await app.click('resume-camera');assert.equal(app.node('resume-camera').hidden,true);assert.equal(app.counts().loads,1);assert.equal(app.counts().detected,1);assert.equal(app.node('cat-video').muted,true);
});
test('a preview error is distinguished from denied camera permission and releases the approved stream',async()=>{
  const app=fixture({}, {playCamera:async()=>{const e=Error('Unsupported preview');e.name='NotSupportedError';throw e;}});await app.click('start-camera');assert.match(app.node('check-error').textContent,/access was allowed/);assert.equal(app.counts().stopped,1);assert.equal(app.counts().loads,0);assert.match(app.warnings[0],/preview: NotSupportedError/);
});
test('a detector permission-like exception is not reported as denied camera access',async()=>{
  const app=fixture({}, {loadDetector:async()=>{const e=Error('model resource refused');e.name='NotAllowedError';throw e;}});await app.click('start-camera');assert.match(app.node('check-error').textContent,/detector couldn’t load/);assert.equal(app.counts().stopped,1);assert.match(app.warnings[0],/model: NotAllowedError/);
});
test('a system permission denial points to device privacy settings without downloading a detector or granting rewards',async()=>{
  const app=fixture({}, {getCamera:async()=>{const e=Error('Permission denied by system');e.name='NotAllowedError';throw e;}});await app.click('start-camera');assert.match(app.node('check-error').textContent,/Windows Settings/);assert.equal(app.counts().loads,0);assert.equal(progress.loadArcade(app.storage).bonuses.welcome,false);assert.match(app.warnings[0],/access: NotAllowedError/);
});
