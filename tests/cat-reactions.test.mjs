import test from 'node:test';
import assert from 'node:assert/strict';
import { CatReactions, candyCatReaction, catrisCatReaction } from '../dist/cat-reactions.mjs';

function fixture({ reducedMotion = false } = {}) {
  let now = 0, nextId = 0, change;
  const timers = new Map(), colors = [], attributes = new Map(), label = { textContent: 'Ready' };
  const context = new Proxy({}, { get: (target, key) => target[key] ?? (() => {}), set: (target, key, value) => { target[key] = value; if (key === 'fillStyle') colors.push(value); return true; } });
  const canvas = { width: 240, height: 180, getContext: () => context, setAttribute: (key, value) => attributes.set(key, value) };
  const reactions = new CatReactions(canvas, { label, idleLabel: 'Ready', mediaQuery: { matches: reducedMotion, addEventListener: (_name, fn) => { change = fn; } },
    now: () => now, schedule: (fn, delay) => { timers.set(++nextId, { fn, when: now + delay }); return nextId; }, cancel: id => timers.delete(id) });
  reactions.setAppearance('birthday','orange');
  const advance = ms => {
    const end = now + ms;
    for (let i = 0; i < 1000; i++) {
      const next = [...timers].filter(([,timer]) => timer.when <= end).sort((a,b) => a[1].when - b[1].when)[0];
      if (!next) break; now = next[1].when; timers.delete(next[0]); next[1].fn();
    }
    now = end;
  };
  return { reactions, advance, label, timers, colors, attributes, reduce: value => change({matches:value}) };
}
test('Candy Cat distinguishes a match, a combo, special creation, and special activation; no points means no reaction',()=>{
  assert.equal(candyCatReaction({points:0,created:[],cascade:0}),null);
  assert.equal(candyCatReaction({points:30,cascade:1}).kind,'match');
  const combo=candyCatReaction({points:90,cascade:3});assert.equal(combo.kind,'combo');assert.match(combo.label,/×3/);
  const creation=candyCatReaction({points:60,cascade:2,created:[{special:'rainbow'}]});assert.equal(creation.kind,'special');assert.equal(creation.special,'rainbow');
  assert.equal(candyCatReaction({points:80,activated:[{special:'row'}]}).kind,'special');
});
test('Catris scales its reaction from a single line to a four-line celebration',()=>{
  assert.equal(catrisCatReaction({cleared:0}),null);
  assert.equal(catrisCatReaction({cleared:1}).kind,'line');assert.equal(catrisCatReaction({cleared:2}).kind,'multi-line');assert.equal(catrisCatReaction({cleared:3}).kind,'multi-line');
  const four=catrisCatReaction({cleared:4});assert.equal(four.kind,'four-lines');assert.match(four.label,/Four lines/);assert.ok(four.duration>catrisCatReaction({cleared:1}).duration);
});
test('a real animated pose hops, lifts a paw, smiles, and settles back to idle without a permanent timer',()=>{
  const f=fixture();f.reactions.react(candyCatReaction({points:30,cascade:1}));f.advance(240);
  assert.ok(f.reactions.pose.lift>1);assert.ok(f.reactions.pose.pawLeft>0);assert.equal(f.reactions.pose.expression,'happy');assert.equal(f.attributes.get('data-reaction'),'match');assert.equal(f.label.textContent,'Sweet match!');
  f.advance(1000);assert.equal(f.reactions.active,null);assert.equal(f.label.textContent,'Ready');assert.equal(f.reactions.pose.lift,0);assert.equal(f.timers.size,0);
});
test('pausing freezes an unfinished celebration and resuming continues its remaining duration',()=>{
  const f=fixture();f.reactions.react(catrisCatReaction({cleared:4}));f.advance(250);f.reactions.pause();const pose={...f.reactions.pose};
  f.advance(10000);assert.deepEqual(f.reactions.pose,pose);assert.equal(f.timers.size,0);assert.equal(f.reactions.active.kind,'four-lines');
  f.reactions.resume();f.advance(200);assert.notEqual(f.reactions.pose.lift,pose.lift);assert.equal(f.reactions.active.kind,'four-lines');f.advance(1500);assert.equal(f.timers.size,0);
});
test('rapid cascades blend from the current pose and cancel stale reaction timers',()=>{
  const f=fixture();f.reactions.react(candyCatReaction({points:30,cascade:1}));f.advance(240);const lift=f.reactions.pose.lift;
  f.reactions.react(candyCatReaction({points:50,created:[{special:'wrapped'}]}));assert.equal(f.reactions.pose.lift,lift);assert.equal(f.timers.size,1);
  f.advance(500);assert.equal(f.reactions.active.kind,'special');assert.equal(f.reactions.pose.expression,'sparkle');f.advance(1000);assert.equal(f.label.textContent,'Ready');assert.equal(f.timers.size,0);
});
test('reaction drawing preserves breed and costume, including an appearance change during a celebration',()=>{
  const f=fixture();f.reactions.react(candyCatReaction({points:50,created:[{special:'rainbow'}]}));f.advance(300);
  assert.ok(f.colors.includes('#e1a362'));assert.ok(f.colors.includes('#c18c82'));
  f.reactions.setAppearance('wizard','ragdoll');assert.equal(f.reactions.costume,'wizard');assert.equal(f.reactions.breed,'ragdoll');assert.equal(f.reactions.active.kind,'special');assert.ok(f.colors.includes('#9185aa'));assert.ok(f.colors.includes('#eeeade'));
});
test('reduced motion keeps expressive feedback but suppresses hops, swaying, moving particles, and frame loops',()=>{
  const f=fixture({reducedMotion:true});f.reactions.react(catrisCatReaction({cleared:4}));const pose={...f.reactions.pose};
  assert.equal(pose.lift,0);assert.equal(pose.tilt,0);assert.equal(pose.pawLeft,0);assert.equal(pose.expression,'sparkle');assert.equal(f.timers.size,1);
  assert.equal([...f.timers.values()][0].when,1350);f.advance(500);assert.deepEqual(f.reactions.pose,pose);f.advance(1000);assert.equal(f.timers.size,0);
});
test('changing reduced-motion preference takes effect during an animation; reset cancels all work',()=>{
  const f=fixture();f.reactions.react(candyCatReaction({points:90,cascade:3}));f.advance(250);assert.ok(f.reactions.pose.lift>0);
  f.reduce(true);assert.equal(f.reactions.pose.lift,0);assert.equal(f.timers.size,1);f.reactions.reset();assert.equal(f.reactions.active,null);assert.equal(f.timers.size,0);assert.equal(f.attributes.get('data-reaction'),'idle');
});
