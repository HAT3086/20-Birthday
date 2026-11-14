import { drawSittingCat } from './art.mjs';

const clamp = value => Math.max(0, Math.min(1, value));
const idlePose = () => ({ scale: .9, lift: 0, tilt: 0, tail: 0, stretchX: 1, stretchY: 1, pawLeft: 0, pawRight: 0, expression: 'neutral' });
export function candyCatReaction(result) {
  if (!result?.points) return null;
  const special = result.created?.[0]?.special || result.activated?.[0]?.special;
  if (special) return { kind: 'special', special, duration: 1180, label: result.created?.length ? 'A little magic!' : 'Treat magic!' };
  if (result.cascade > 1) return { kind: 'combo', duration: 1020, level: result.cascade, label: `Purrfect combo ×${Math.min(3, result.cascade)}!` };
  return { kind: 'match', duration: 700, label: 'Sweet match!' };
}
export function catrisCatReaction(result) {
  const count = result?.cleared || 0;
  if (!count) return null;
  return { kind: count === 4 ? 'four-lines' : count > 1 ? 'multi-line' : 'line', count,
    duration: count === 4 ? 1350 : count > 1 ? 1050 : 780,
    label: ['','One neat line!','Double clear!','Triple clear!','Four lines! Purrfect.'][count] };
}

function reactionPose(event, progress, reducedMotion) {
  const pose = idlePose();
  pose.expression = ['special','four-lines'].includes(event.kind) ? 'sparkle' : 'happy';
  if (reducedMotion) return pose;
  const envelope = Math.sin(Math.PI * progress);
  const dance = ['combo','multi-line','four-lines'].includes(event.kind);
  const jump = dance ? Math.abs(Math.sin(Math.PI * 2 * progress)) : envelope;
  const big = event.kind === 'four-lines' || event.kind === 'special';
  pose.lift = jump * (big ? 3.4 : dance ? 2.8 : 2);
  pose.tilt = Math.sin(progress * Math.PI * (dance ? 4 : 2)) * envelope * (dance ? .16 : .07);
  pose.tail = Math.sin(progress * Math.PI * 6) * envelope * .45;
  pose.stretchX = 1 + Math.sin(progress * Math.PI * 4) * envelope * .06;
  pose.stretchY = 1 - Math.sin(progress * Math.PI * 4) * envelope * .05;
  pose.pawLeft = envelope * (dance || big ? .85 : .45);
  pose.pawRight = envelope * (dance ? .65 + Math.sin(progress * Math.PI * 6) * .3 : big ? .9 : 0);
  return pose;
}

export class CatReactions {
  constructor(canvas, { label, profile, idleLabel = '', mediaQuery = null, reducedMotion = false,
    now = () => performance.now(), schedule = (fn, ms) => setTimeout(fn, ms), cancel = id => clearTimeout(id) } = {}) {
    this.canvas = canvas; this.context = canvas.getContext('2d'); this.label = label; this.profile = profile; this.idleLabel = idleLabel;
    this.mediaQuery = mediaQuery; this.reducedMotion = mediaQuery?.matches ?? reducedMotion;
    this.now = now; this.schedule = schedule; this.cancel = cancel;
    this.costume = 'original'; this.breed = 'original'; this.active = null; this.timer = null; this.paused = false; this.elapsed = 0; this.pose = idlePose();
    this.setKind('idle');
    mediaQuery?.addEventListener?.('change', event => { this.reducedMotion = event.matches; this.draw(); this.planFrame(); });
  }
  stopTimer() { if (this.timer !== null) this.cancel(this.timer); this.timer = null; }
  elapsedTime() { return this.active ? this.paused ? this.elapsed : Math.max(0, this.now() - this.started) : 0; }
  setAppearance(costume, breed) { this.costume = costume; this.breed = breed; this.draw(); }
  setKind(kind) { this.canvas.setAttribute('data-reaction', kind); this.profile?.setAttribute('data-reaction', kind); }
  react(event) {
    if (!event) return false;
    this.stopTimer(); this.fromPose = { ...this.pose }; this.active = { ...event }; this.started = this.now(); this.elapsed = 0; this.paused = false;
    this.setKind(event.kind); if (this.label) this.label.textContent = event.label;
    this.draw(); this.planFrame(); return true;
  }
  reset() {
    this.stopTimer(); this.active = null; this.paused = false; this.elapsed = 0; this.pose = idlePose(); this.setKind('idle');
    if (this.label) this.label.textContent = this.idleLabel; this.draw();
  }
  pause() { if (this.paused) return; this.elapsed = this.elapsedTime(); this.paused = true; this.stopTimer(); }
  resume() { if (!this.paused) return; this.paused = false; this.started = this.now() - this.elapsed; this.draw(); this.planFrame(); }
  planFrame() {
    this.stopTimer(); if (!this.active || this.paused) return;
    const remaining = Math.max(1, this.active.duration - this.elapsedTime());
    this.timer = this.schedule(() => { this.timer = null; this.draw(); this.planFrame(); }, this.reducedMotion ? remaining : Math.min(32, remaining));
  }
  draw() {
    let elapsed = this.elapsedTime();
    if (this.active && elapsed >= this.active.duration) { this.active = null; this.setKind('idle'); if (this.label) this.label.textContent = this.idleLabel; }
    const progress = this.active ? clamp(elapsed / this.active.duration) : 0;
    const pose = this.active ? reactionPose(this.active, progress, this.reducedMotion) : idlePose();
    // A new cascade can arrive during a hop. Blend into it without snapping
    // the cat's body back to the floor between reactions.
    if (this.active && !this.reducedMotion && elapsed < 110 && this.fromPose) {
      const blend = clamp(elapsed / 110);
      for (const key of ['lift','tilt','tail','stretchX','stretchY','pawLeft','pawRight']) pose[key] = this.fromPose[key] + (pose[key] - this.fromPose[key]) * blend;
    }
    this.pose = pose;
    const width = this.canvas.width || 240, height = this.canvas.height || 180;
    drawSittingCat(this.context, width, height, this.costume, this.breed, pose);
    if (this.active) this.drawParticles(width, height, progress);
  }
  drawParticles(width, height, progress) {
    const event = this.active, ctx = this.context;
    const magical = event.kind === 'special', big = event.kind === 'four-lines';
    const count = magical || big ? 6 : event.kind === 'combo' || event.kind === 'multi-line' ? 4 : 2;
    const colors = magical ? ['#b88c99','#c1a255','#8aa59c','#a394b5'] : big ? ['#b99a51','#a394b5','#89a18a'] : ['#bd8e91','#bc9b59'];
    const position = this.reducedMotion ? .4 : progress;
    ctx.save(); ctx.globalAlpha = this.reducedMotion ? .8 : Math.min(1, position * 5) * Math.min(1, (1-position) * 5);
    for (let i=0;i<count;i++) {
      const angle = -Math.PI + (i+.5) / count * Math.PI;
      const x = width*.5 + Math.cos(angle) * width*(.23 + position*.12);
      const y = height*.6 + Math.sin(angle)*height*.4 - position*height*.12 + (i%2)*7;
      const p = Math.max(1, Math.round(width/120)), px = Math.round(x), py = Math.round(y);
      ctx.fillStyle = colors[i%colors.length];
      if (magical || big || event.kind.includes('line')) {
        ctx.fillRect(px-3*p,py-p,7*p,2*p); ctx.fillRect(px-p,py-3*p,2*p,7*p);
        if (magical) ctx.fillRect(px-2*p,py-2*p,p,p);
      } else {
        ctx.fillRect(px-3*p,py-2*p,2*p,2*p); ctx.fillRect(px+p,py-2*p,2*p,2*p);
        ctx.fillRect(px-3*p,py,6*p,2*p); ctx.fillRect(px-2*p,py+2*p,4*p,p); ctx.fillRect(px-p,py+3*p,2*p,p);
      }
    }
    ctx.restore();
  }
}
