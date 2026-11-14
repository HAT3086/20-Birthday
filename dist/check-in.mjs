import { loadArcade, saveArcade } from './progress.mjs';
import { drawSittingCat } from './art.mjs';
import { createCatCheck, observeCat, findCat, completeCheckIn, arcadeDestination, cameraMessage } from './cat-check-engine.mjs';
import { loadCatDetector } from './cat-detector.mjs';
import { beginArcadeVisit, clearArcadeVisit } from './entry-session.mjs';

const $ = id => document.getElementById(id);
let storage, session;
try { storage = window.localStorage; } catch {}
try { session = window.sessionStorage; } catch {}
clearArcadeVisit(session);
let state = loadArcade(storage);
const destination = arcadeDestination(new URL(window.location.href).searchParams.get('next'));
let stream, timer, generation = 0, busy = false, verified = false, cameraMode = false;
let check = createCatCheck();
const video = $('cat-video');
const preview = $('photo-preview');
drawSittingCat($('entry-cat').getContext('2d'), 240, 180, state.skins.equipped, state.appearance.breed);
$('entry-name').value = state.profile.name;
if (state.profile.name) {
  $('camera-step').textContent = '';
  $('entry-returning').textContent = `Welcome back, ${state.profile.name}.`;
  $('entry-returning').hidden = false;
  $('welcome-reward-title').textContent = state.bonuses.welcome ? 'Welcome star collected ✓' : 'Your first cat check earns 1 star.';
  status('Camera off.');
}

function status(text) { $('check-status').textContent = text; }
function error(text) { $('check-error').textContent = text; $('check-error').hidden = !text; }
function controls(working) {
  busy = working;
  $('start-camera').disabled = working;
  $('choose-photo').disabled = working && !cameraMode;
}
function stop() {
  generation++;
  clearTimeout(timer); timer = null;
  stream?.getTracks().forEach(track => track.stop()); stream = null;
  video.srcObject = null;
  cameraMode = false;
  $('stop-camera').hidden = true;
  $('resume-camera').hidden = true;
}
function pips() {
  Array.from($('check-pips').children).forEach((pip, i) => pip.classList.toggle('found', i < check.hits));
}
function approved() {
  verified = true;
  // Keep a still frame for the welcome step, then release the camera immediately.
  if (stream && video.videoWidth) {
    preview.width = video.videoWidth; preview.height = video.videoHeight;
    preview.getContext('2d').drawImage(video, 0, 0);
    preview.hidden = false;
  }
  stop(); controls(false);
  video.hidden = true; $('camera-placeholder').hidden = true;
  $('cat-verified').hidden = false; $('camera-stage').classList.add('approved');
  $('camera-label').textContent = 'Cat verified'; $('camera-step').textContent = '02 / 02';
  status('Cat verified. You’re ready to play.');
  check.hits = 3; pips();
  state = loadArcade(storage);
  $('detect-step').hidden = true; $('entry-form').hidden = false;
  if (state.bonuses.welcome) $('welcome-copy').textContent = 'Welcome star collected ✓';
  if (state.profile.name) {
    $('entry-name').value = state.profile.name;
    $('entry-name-fields').hidden = true;
    $('entry-name').disabled = true;
    $('entry-form-title').textContent = `Welcome back, ${state.profile.name}.`;
    $('enter-arcade').textContent = 'Continue to the arcade →';
    enter(state.profile.name);
    return;
  }
  $('entry-name').focus();
}
async function detect(model, token) {
  if (token !== generation || !stream || document.hidden || window.innerWidth < 1000) return;
  try {
    if (video.readyState >= 2 && video.videoWidth > 0) {
      const predictions = await model.detect(video, 10, .5);
      if (token !== generation) return;
      observeCat(check, predictions, video.videoWidth, video.videoHeight); pips();
      status(check.hits ? 'Cat spotted. Hold still for a moment…' : 'Looking for a cat… Keep your cat in view.');
      if (check.verified) { approved(); return; }
    }
    if (token === generation) timer = setTimeout(() => detect(model, token), 350);
  } catch {
    if (token !== generation) return;
    stop(); controls(false); video.hidden = true; $('camera-placeholder').hidden = false;
    error('The cat detector couldn’t read the camera. Try again, or choose a cat photo.'); status('Ready when you are.');
  }
}
function cameraFailed(e, phase, token) {
  if (token !== generation) return;
  console.warn(`[Twenty camera] ${phase}: ${e?.name || 'Error'}: ${e?.message || 'No details supplied by the browser'}`);
  stop(); controls(false); video.hidden = true; $('camera-placeholder').hidden = false;
  error(phase === 'access' ? cameraMessage(e) : phase === 'model' ? 'The cat detector couldn’t load. Check your connection, or choose a cat photo.' : 'Camera access was allowed, but the preview couldn’t start. Try again, or choose a cat photo.');
  status('Your check-in is still waiting.');
}
async function startCameraPreview(token) {
  if (token !== generation || !stream) return;
  $('resume-camera').disabled = true;
  try {
    video.muted = true; video.defaultMuted = true; video.playsInline = true;
    await video.play();
  } catch (e) {
    if (token !== generation) return;
    if (e?.name === 'NotAllowedError') {
      // Camera permission and video playback permission are separate. Keep
      // the approved stream and resume playback from a fresh button click.
      $('resume-camera').disabled = false; $('resume-camera').hidden = false;
      status('Camera allowed. Tap Start preview to continue.');
      error('Your browser needs one more click to show the camera.');
    } else cameraFailed(e, 'preview', token);
    return;
  }
  if (token !== generation) return;
  $('resume-camera').hidden = true; error('');
  status('Camera ready. Loading the cat detector…');
  try {
    const model = await loadCatDetector();
    if (token !== generation) return;
    status('Looking for a cat… Keep your cat in view.');
    await detect(model, token);
  } catch (e) { cameraFailed(e, 'model', token); }
}
$('resume-camera').addEventListener('click', () => startCameraPreview(generation));
$('start-camera').addEventListener('click', async () => {
  if (busy || verified || document.hidden || window.innerWidth < 1000) return;
  stop(); error(''); check = createCatCheck(); pips(); cameraMode = true; controls(true);
  $('stop-camera').hidden = false;
  const token = generation;
  status('Allow your camera when the browser asks.');
  try {
    if (!navigator.mediaDevices?.getUserMedia) { const e = new Error(); e.name = 'NotFoundError'; throw e; }
    // Request access directly from the click, before any model download can
    // consume the browser's temporary user activation.
    const camera = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 400 }, facingMode: 'user' }, audio: false });
    if (token !== generation || document.hidden || window.innerWidth < 1000) { camera.getTracks().forEach(track => track.stop()); return; }
    stream = camera; video.srcObject = camera;
    video.hidden = false; preview.hidden = true; $('camera-placeholder').hidden = true;
    await startCameraPreview(token);
  } catch (e) { cameraFailed(e, 'access', token); }
});
function exitCamera() {
  stop(); controls(false); error(''); check = createCatCheck(); pips();
  video.hidden = true; preview.hidden = true; $('camera-placeholder').hidden = false;
  status('Camera off. Choose a photo or try again.');
}
$('stop-camera').addEventListener('click', exitCamera);
$('choose-photo').addEventListener('click', () => {
  if (verified || (busy && !cameraMode)) return;
  if (cameraMode) exitCamera();
  $('cat-photo').click();
});
$('cat-photo').addEventListener('change', async () => {
  const file = $('cat-photo').files?.[0]; $('cat-photo').value = '';
  if (!file || verified) return;
  stop(); error(''); controls(true); check = createCatCheck(); pips();
  const token = generation;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
    error('Choose a JPG, PNG, or WebP photo smaller than 15 MB.'); controls(false); return;
  }
  status('Looking for a cat in your photo…');
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { resizeWidth: 640, resizeQuality: 'high' });
    if (token !== generation) return;
    const scale = Math.min(1, 800 / bitmap.height);
    preview.width = Math.round(bitmap.width * scale); preview.height = Math.round(bitmap.height * scale);
    preview.getContext('2d').drawImage(bitmap, 0, 0, preview.width, preview.height);
    bitmap.close(); bitmap = null;
    preview.hidden = false; video.hidden = true; $('camera-placeholder').hidden = true;
    const model = await loadCatDetector();
    if (token !== generation) return;
    const predictions = await model.detect(preview, 10, .5);
    if (token !== generation) return;
    if (findCat(predictions, preview.width, preview.height)) approved();
    else { controls(false); status('No cat spotted yet. Try a clearer photo, or use your camera.'); }
  } catch {
    if (token !== generation) return;
    controls(false); error('We couldn’t check that photo. Try a different image, or check your connection.'); status('Your welcome star is still waiting.');
  } finally { bitmap?.close(); }
});
function enter(name) {
  const result = completeCheckIn(loadArcade(storage), name, verified);
  if (!result.ok) { $('name-error').textContent = result.error; $('name-error').hidden = false; return; }
  if (!saveArcade(storage, result.state, { profile: true })) {
    $('name-error').textContent = 'We couldn’t save your check-in. Allow browser storage, then try again. Your cat is already approved.';
    $('name-error').hidden = false; return;
  }
  if (!beginArcadeVisit(session)) {
    $('name-error').textContent = 'Allow browser session storage, then continue. Your cat is already approved.';
    $('name-error').hidden = false; return;
  }
  stop(); window.location.replace(destination);
}
$('entry-form').addEventListener('submit', event => {
  event.preventDefault(); enter($('entry-name').value);
});
function suspend() {
  const wasActive = !!stream || busy;
  stop(); controls(false);
  if (!verified && wasActive) {
    check = createCatCheck(); pips(); video.hidden = true; $('camera-placeholder').hidden = false;
    status('Camera paused. Turn it on when you’re ready.');
  }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
window.addEventListener('pagehide', suspend);
window.addEventListener('resize', () => { if (window.innerWidth < 1000) suspend(); });
