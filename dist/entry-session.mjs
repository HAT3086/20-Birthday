export const ENTRY_SESSION_KEY = 'twenty.cat-check.session.v1';

export function beginArcadeVisit(storage) {
  try { storage.setItem(ENTRY_SESSION_KEY, 'approved'); return storage.getItem(ENTRY_SESSION_KEY) === 'approved'; }
  catch { return false; }
}

export function clearArcadeVisit(storage) {
  try { storage.removeItem(ENTRY_SESSION_KEY); } catch {}
}

export function hasArcadeVisit(storage) {
  try { return storage.getItem(ENTRY_SESSION_KEY) === 'approved'; }
  catch { return false; }
}

// A checked-in tab can move around the arcade. Reloads and fresh arrivals
// must meet the cat again; the permanent welcome star is only a reward.
export function continuesArcadeVisit(storage, { href, referrer, navigationType } = {}) {
  if (!hasArcadeVisit(storage) || navigationType === 'reload' || !referrer) return false;
  try {
    const previous = new URL(referrer), current = new URL(href);
    return previous.origin === current.origin && /^\/(?:index(?:\.html)?|check-in(?:\.html)?|snake(?:\.html)?|flappy(?:\.html)?|rooftop(?:\.html)?|fishing(?:\.html)?|candy(?:\.html)?|catris(?:\.html)?|shop(?:\.html)?|birthday(?:\.html)?)?$/.test(previous.pathname);
  } catch { return false; }
}
