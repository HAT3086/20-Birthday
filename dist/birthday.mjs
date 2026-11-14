import { mountBirthday } from './birthday-app.mjs';
let storage;
try { storage = window.localStorage; } catch {}
mountBirthday(storage);
