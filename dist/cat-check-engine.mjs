import { normalizeArcade } from './progress.mjs';

export const CAT_CHECK = Object.freeze({ confidence: .6, frames: 3, minimumArea: .025 });
export const createCatCheck = () => ({ hits: 0, verified: false });

export function findCat(predictions, width, height) {
  if (!(width > 0 && height > 0) || !Array.isArray(predictions)) return null;
  return predictions.find(item => item?.class === 'cat' && Number.isFinite(item.score) && item.score >= CAT_CHECK.confidence && item.score <= 1
    && Array.isArray(item.bbox) && item.bbox.length === 4 && item.bbox.every(Number.isFinite)
    && item.bbox[2] > 0 && item.bbox[3] > 0 && item.bbox[2] * item.bbox[3] / (width * height) >= CAT_CHECK.minimumArea) || null;
}

export function observeCat(check, predictions, width, height) {
  if (check.verified) return check;
  check.hits = findCat(predictions, width, height) ? check.hits + 1 : 0;
  check.verified = check.hits >= CAT_CHECK.frames;
  return check;
}

export function completeCheckIn(raw, name, verified) {
  const state = normalizeArcade(raw);
  if (!verified) return { ok: false, error: 'Let’s meet your cat first.', state };
  const next = normalizeArcade({ ...state, profile: { name } });
  if (!next.profile.name) return { ok: false, error: 'Please enter your name.', state };
  const starEarned = !next.bonuses.welcome;
  next.bonuses.welcome = true;
  return { ok: true, starEarned, state: next };
}

const destinations = new Set(['snake', 'flappy', 'rooftop', 'fishing', 'candy', 'catris', 'shop', 'birthday']);
export function arcadeDestination(value = '') {
  const path = typeof value === 'string' ? value.replace(/^\.\//, '').replace(/^\//, '') : '';
  const name = path.replace(/\.html$/, '');
  return destinations.has(name) ? `./${name}.html` : './';
}

export function cameraMessage(error) {
  if (['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(error?.name)) {
    if (/system|operating system/i.test(error?.message || '')) return 'Your device is blocking the camera. Check Windows Settings → Privacy & security → Camera, or choose a cat photo.';
    return 'This browser or device couldn’t open the camera. If you clicked Allow, try the game in Chrome or Edge, or choose a cat photo.';
  }
  if (['NotFoundError', 'DevicesNotFoundError'].includes(error?.name)) return 'No camera found. You can use a cat photo instead.';
  if (['NotReadableError', 'TrackStartError'].includes(error?.name)) return 'Your camera may be busy. Close other camera apps and try again, or choose a cat photo.';
  return 'The camera couldn’t start. Try again, or choose a cat photo.';
}
