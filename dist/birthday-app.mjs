import { loadArcade, saveArcade, totalStars, ARCADE_KEY, LEGACY_SNAKE_KEY } from './progress.mjs';
import { drawBirthdayCake } from './birthday-art.mjs';
import { ArcadeAudio } from './arcade-audio.mjs';
import { canOpenBirthday } from './birthday-access.mjs';

export function mountBirthday(storage) {
const $ = id => document.getElementById(id);
let state = loadArcade(storage);
let lit = true, frame = 0, wishFrame = 45, flameTimer, musicTimer, burstTimer, unlocked = false, interaction = 0;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const audio = new ArcadeAudio(() => state.settings);
const musicVoices = new Set();
const wishVoices = new Set();
const catCanvas = document.createElement('canvas');
const visible = () => !document.hidden && window.innerWidth >= 1000;
// A short instrumental birthday tune. Sound starts only with a visitor's click.
const melody = [[392,.75],[392,.25],[440,1],[392,1],[523,1],[494,2],[392,.75],[392,.25],[440,1],[392,1],[587,1],[523,2],[392,.75],[392,.25],[784,1],[659,1],[523,1],[494,1],[440,2],[698,.75],[698,.25],[659,1],[523,1],[587,1],[523,2]];
function stopMusic() {
  clearTimeout(musicTimer); musicTimer = null;
  for (const voice of musicVoices) { try { voice.stop(); } catch {} }
  musicVoices.clear();
}
function stopWishSound() {
  for (const voice of wishVoices) { try { voice.stop(); } catch {} }
  wishVoices.clear();
}
function wishSound() {
  stopWishSound();
  if (!state.settings.sound) return;
  [523,659,784,1047].forEach((note,i) => {
    const voice = audio.tone(note,.25,.022,i*.09);
    if (voice) { wishVoices.add(voice); voice.onended = () => wishVoices.delete(voice); }
  });
}
function startMusic() {
  stopMusic();
  if (!unlocked || !state.settings.music || document.hidden || window.innerWidth < 1000 || audio.context?.state !== 'running') return;
  let offset = 0;
  for (const [note, beats] of melody) {
    const voice = audio.tone(note, beats * .28, .018, offset);
    if (voice) { musicVoices.add(voice); voice.onended = () => musicVoices.delete(voice); }
    offset += beats * .34;
  }
  musicTimer = setTimeout(startMusic, (offset + 2) * 1000);
}
function draw() {
  drawBirthdayCake($('birthday-cake').getContext('2d'), {
    lit, frame: reduced.matches ? 0 : frame++, celebration: reduced.matches ? 1 : wishFrame / 45,
    costume: state.skins.equipped, breed: state.appearance.breed, createCanvas: () => catCanvas,
  });
}
function animate() {
  clearTimeout(flameTimer); flameTimer = null;
  if (!unlocked || !visible()) return;
  draw();
  if (reduced.matches) return;
  if (!lit && wishFrame < 45) flameTimer = setTimeout(() => { wishFrame++; animate(); }, 40);
  else if (lit) flameTimer = setTimeout(animate, 180);
}
function confetti() {
  clearTimeout(burstTimer);
  const colors = ['#9cae8c','#baa4ba','#c4a064','#bd8f79','#86aaa7'];
  $('birthday-confetti').replaceChildren(...Array.from({length:reduced.matches?32:64},(_,i)=>{
    const piece=document.createElement('i');
    piece.style.cssText=`--x:${(i*31)%100}%;--size:${4+i%5}px;--color:${colors[i%5]};--duration:${3.6+i%5*.4}s;--delay:${i%8*.09}s;--drift:${i%2?-65:65}px;--spin:${(i%2?1:-1)*(180+i*17)}deg;--rest:${10+(i*37)%80}%`;
    return piece;
  }));
  burstTimer = setTimeout(() => $('birthday-confetti').replaceChildren(), 7000);
}
function render() {
  unlocked = canOpenBirthday(totalStars(state));
  $('birthday-stamp-label').textContent = totalStars(state) < 20 && unlocked ? 'Birthday preview' : '20 / 20 BIRTHDAY STARS';
  $('birthday-locked').hidden = unlocked;
  $('birthday-party').hidden = !unlocked;
  $('birthday-music').hidden = !unlocked;
  $('birthday-remaining').textContent = `${20-totalStars(state)} birthday ${20-totalStars(state) === 1 ? 'star' : 'stars'} to go. Your progress is safe in the arcade.`;
  $('birthday-heading').textContent = state.profile.name ? `Happy 20th, ${state.profile.name}.` : 'Happy 20th birthday.';
  $('birthday-party').setAttribute('data-long-name', String(state.profile.name.length > 16));
  $('birthday-party').setAttribute('data-paused', String(!visible()));
  $('birthday-party').setAttribute('data-wished', String(!lit));
  $('birthday-cake-button').disabled = !unlocked;
  $('make-wish').disabled = !unlocked;
  $('birthday-cake-button').setAttribute('aria-label', lit ? 'Make a wish and blow out the candles' : 'Light the birthday candles again');
  $('birthday-cake').setAttribute('aria-label', `A birthday cake with ${lit ? 'lit' : 'blown-out'} number twenty candles and two happy cats`);
  $('make-wish').textContent = lit ? 'Make a wish & blow out the candles ✧' : 'Light the candles again ↺';
  $('birthday-wish-title').textContent = lit ? 'Close your eyes. Make a wish.' : 'May this year be kind to you.';
  $('birthday-wish-copy').textContent = lit ? 'Take a quiet breath and think of something you truly hope for. This moment is just for you.' : `${state.profile.name || 'Birthday Cat'}, may twenty bring you people who love you as you are, days that feel peaceful, and the courage to follow what matters to you. I hope you feel heard, supported, and loved, even on the days you doubt yourself.`;
  $('birthday-wish-extra').hidden = lit;
  $('birthday-wish-extra').textContent = lit ? '' : 'You don’t need to have everything figured out. Grow at your own pace, make room for small joys, and be gentle with yourself along the way. I’m glad you’re here. Happy birthday.';
  $('birthday-status').textContent = lit ? '' : 'Happy birthday! Here’s to everything ahead. ✦';
  $('birthday-music').textContent = state.settings.music ? (audio.context?.state === 'running' ? '♪ Music on' : '♪ Play music') : '♪ Music off';
  $('birthday-music').setAttribute('aria-pressed', String(state.settings.music));
  animate();
  if (!unlocked) { stopMusic(); stopWishSound(); clearTimeout(burstTimer); $('birthday-confetti').replaceChildren(); audio.context?.suspend(); }
}
$('birthday-music').addEventListener('click', async () => {
  const ticket = ++interaction;
  state = loadArcade(storage);
  if (!canOpenBirthday(totalStars(state))) { render(); return; }
  state.settings.music = !(state.settings.music && audio.context?.state === 'running');
  const saved = saveArcade(storage, state);
  if (!saved) $('birthday-status').textContent = 'Music changed for this visit. Browser saving is unavailable.';
  await audio.unlock();
  if (ticket !== interaction || !visible() || !unlocked) { if (!visible()) audio.context?.suspend(); return; }
  render();
  if (state.settings.music) startMusic(); else { stopMusic(); await audio.context?.suspend(); }
});
async function makeWish() {
  const ticket = ++interaction;
  const latest = loadArcade(storage);
  if (!canOpenBirthday(totalStars(latest))) { state = latest; render(); return; }
  state = latest; lit = !lit; wishFrame = lit ? 45 : 0;
  clearTimeout(burstTimer); $('birthday-confetti').replaceChildren(); stopWishSound();
  if (!lit) confetti();
  render();
  await audio.unlock();
  if (ticket !== interaction || !visible() || !unlocked) { if (!visible()) audio.context?.suspend(); return; }
  if (!lit) wishSound();
  if (state.settings.music) startMusic();
}
$('make-wish').addEventListener('click', makeWish);
$('birthday-cake-button').addEventListener('click', makeWish);
function pause() {
  interaction++; clearTimeout(flameTimer); flameTimer = null; stopMusic(); stopWishSound();
  clearTimeout(burstTimer); $('birthday-confetti').replaceChildren();
  $('birthday-party').setAttribute('data-paused','true'); audio.context?.suspend();
}
function refresh() {
  const ticket = ++interaction;
  state = loadArcade(storage); render();
  if (unlocked && state.settings.music && audio.context && visible()) audio.unlock().then(() => {
    if (ticket !== interaction || !visible() || !unlocked) { if (!visible()) audio.context?.suspend(); return; }
    render(); startMusic();
  });
  else if (!state.settings.music) { stopMusic(); audio.context?.suspend(); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else refresh(); });
window.addEventListener('pagehide', () => { pause(); clearTimeout(burstTimer); $('birthday-confetti').replaceChildren(); });
window.addEventListener('pageshow', refresh);
window.addEventListener('storage', event => { if ([ARCADE_KEY, LEGACY_SNAKE_KEY].includes(event.key)) refresh(); });
window.addEventListener('resize', () => { if (window.innerWidth < 1000) pause(); else refresh(); });
reduced.addEventListener('change', animate);
render();

return { stop: pause };
}
