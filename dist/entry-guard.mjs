import { loadArcade } from './progress.mjs';
import { arcadeDestination } from './cat-check-engine.mjs';
import { continuesArcadeVisit, hasArcadeVisit, clearArcadeVisit } from './entry-session.mjs';

let storage, session;
try { storage = window.localStorage; } catch {}
try { session = window.sessionStorage; } catch {}
const state = loadArcade(storage);
function requireCheck() {
  clearArcadeVisit(session);
  const entry = new URL('./check-in.html', import.meta.url);
  entry.searchParams.set('next', arcadeDestination(window.location.pathname));
  window.location.replace(entry.href);
}
if (!state.profile.name || !continuesArcadeVisit(session, {
  href: window.location.href,
  referrer: document.referrer,
  navigationType: window.performance?.getEntriesByType('navigation')?.[0]?.type,
})) requireCheck();
window.addEventListener('pageshow', event => { if (event.persisted && !hasArcadeVisit(session)) requireCheck(); });
