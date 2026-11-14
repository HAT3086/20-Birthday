import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { BackgroundMusic } from '../dist/background-music.mjs';
import { MUSIC_TRACKS } from '../dist/music-tracks.mjs';
import { SCORES, scoreEvents } from '../scripts/music-scores.mjs';

function surface(extra = {}) {
  const events = new Map();
  return { ...extra, events,
    addEventListener(name, fn) { if (!events.has(name)) events.set(name, new Set()); events.get(name).add(fn); },
    removeEventListener(name, fn) { events.get(name)?.delete(fn); },
    emit(name) { for (const fn of events.get(name) || []) fn(); },
  };
}
function fixture() {
  let enabled = false, fetches = 0, decoding = 0;
  const document = surface({ hidden: false }), window = surface({ innerWidth: 1280 });
  const sources = [], gains = [], signals = [];
  const context = { state: 'running', currentTime: 0, destination: {},
    async decodeAudioData() { decoding++; return { duration: MUSIC_TRACKS.snake.duration }; },
    createBufferSource() {
      const source = { connect() {}, disconnect() { this.disconnected = true; },
        start(...args) { this.started = args; }, stop(time) { this.stopped = time; },
      };
      sources.push(source); return source;
    },
    createGain() {
      const gain = { gain: { value: .16, setValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {} },
        connect() {}, disconnect() { this.disconnected = true; },
      };
      gains.push(gain); return gain;
    },
  };
  const environment = { document, window, fetch: async (url, { signal }) => {
    fetches++; signals.push(signal); assert.match(url.pathname, /cake-[a-f0-9]{10}\.wav$/);
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  } };
  const player = new BackgroundMusic(() => context, () => enabled, 'snake', environment);
  return { player, context, document, window, sources, gains, signals,
    enable(value = true) { enabled = value; }, get fetches() { return fetches; }, get decoding() { return decoding; },
  };
}
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

test('music waits for both the player toggle and a browser-unlocked audio context', async () => {
  const f = fixture(); await f.player.update(); assert.equal(f.fetches, 0);
  f.enable(); f.context.state = 'suspended'; await f.player.update(); assert.equal(f.fetches, 0);
  f.context.state = 'running'; await f.player.update();
  assert.equal(f.fetches, 1); assert.equal(f.decoding, 1); assert.equal(f.sources[0].loop, true);
  assert.deepEqual(f.sources[0].started, [0, 0]);
});

test('refreshes share a download and never restart an already playing loop', async () => {
  const f = fixture(); f.enable();
  const first = f.player.update(); assert.equal(f.player.update(), first); await first;
  f.context.currentTime = 8; await f.player.update(); await f.player.update();
  assert.equal(f.fetches, 1); assert.equal(f.sources.length, 1); assert.equal(f.sources[0].stopped, undefined);
});

test('muting fades, releases both audio nodes, and resumes the cached track at its previous position', async () => {
  const f = fixture(); f.enable(); await f.player.update();
  f.context.currentTime = 8.25; f.enable(false); await f.player.update();
  assert.equal(f.sources[0].stopped, 8.30); assert.equal(f.player.voice, null);
  f.sources[0].onended(); assert.equal(f.sources[0].disconnected, true); assert.equal(f.gains[0].disconnected, true);
  f.context.currentTime = 20; f.enable(); await f.player.update();
  assert.deepEqual(f.sources[1].started, [20, 8.25]); assert.equal(f.fetches, 1); assert.equal(f.decoding, 1);
  assert.equal(f.player.pending, null);
});

test('hidden tabs, unsupported widths and page navigation stop music; returning starts only one voice', async () => {
  const f = fixture(); f.enable(); await f.player.update();
  f.document.hidden = true; f.document.emit('visibilitychange'); assert.equal(f.player.voice, null);
  f.document.hidden = false; f.document.emit('visibilitychange'); await flush(); assert.ok(f.player.voice);
  f.window.innerWidth = 900; f.window.emit('resize'); assert.equal(f.player.voice, null);
  f.window.innerWidth = 1280; f.window.emit('resize'); await flush(); assert.ok(f.player.voice);
  f.window.emit('pagehide'); assert.equal(f.player.voice, null); await f.player.update(); assert.equal(f.player.voice, null);
  f.window.emit('pageshow'); await flush(); assert.ok(f.player.voice);
  assert.equal(f.fetches, 1); assert.equal(f.sources.length, 4);
});

test('muting during a download aborts it and ignores late data without cancelling a newer request', async () => {
  const f = fixture(); let finish;
  f.player.fetch = (_url, { signal }) => new Promise(resolve => { finish = resolve; f.signals.push(signal); });
  f.enable(); const pending = f.player.update(); await flush();
  f.enable(false); f.player.update(); assert.equal(f.signals[0].aborted, true);
  const response = { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  f.player.fetch = async () => response; f.enable(); const latest = f.player.update();
  finish(response); await pending; await latest;
  assert.equal(f.sources.length, 1); assert.equal(f.player.pending, null);
});

test('a decode finishing after the tab leaves cannot start music', async () => {
  const f = fixture(); let finish;
  f.context.decodeAudioData = () => new Promise(resolve => { finish = resolve; });
  f.enable(); const pending = f.player.update(); await flush();
  f.window.emit('pagehide'); finish({ duration: 10 }); await pending;
  assert.equal(f.sources.length, 0); assert.equal(f.player.buffer, undefined);
});

test('failed loads are optional and can be retried; disposing removes lifecycle listeners', async () => {
  const f = fixture(); f.enable(); const fetch = f.player.fetch;
  f.player.fetch = async () => ({ ok: false }); await f.player.update(); assert.equal(f.player.voice, undefined);
  f.player.fetch = fetch; await f.player.update(); assert.equal(f.sources.length, 1);
  f.player.dispose(); assert.equal(f.player.voice, null);
  for (const listeners of [...f.document.events.values(), ...f.window.events.values()]) assert.equal(listeners.size, 0);
  await f.player.update(); assert.equal(f.sources.length, 1);
});

test('each game has a distinct sixteen-bar original score and a matching unclipped WAV asset', () => {
  const hashes = new Set(), expected = ['snake', 'flappy', 'mining', 'platformer', 'slingshot', 'tetris'];
  assert.deepEqual(Object.keys(MUSIC_TRACKS), expected);
  for (const score of SCORES) {
    const track = MUSIC_TRACKS[score.id], events = scoreEvents(score);
    assert.equal(score.melody.length, 16); assert.ok(events.length > 150);
    const wav = readFileSync(new URL('../dist/' + track.src.slice(2), import.meta.url));
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF'); assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
    assert.equal(wav.readUInt16LE(20), 1); assert.equal(wav.readUInt16LE(22), 1);
    assert.equal(wav.readUInt32LE(24), 22050); assert.equal(wav.readUInt16LE(34), 16);
    const frames = (wav.length - 44) / 2, duration = frames / 22050;
    assert.ok(Math.abs(duration - 16 * score.meter * 60 / score.bpm) < 1 / 22050);
    assert.equal(duration, track.duration);
    let peak = 0, power = 0, mean = 0, maxStep = 0, previous = wav.readInt16LE(wav.length - 2) / 32768;
    for (let i = 44; i < wav.length; i += 2) {
      const sample = wav.readInt16LE(i) / 32768;
      peak = Math.max(peak, Math.abs(sample)); power += sample * sample; mean += sample;
      maxStep = Math.max(maxStep, Math.abs(sample - previous)); previous = sample;
    }
    assert.ok(peak < .35 && peak > .15, `${score.id} peak ${peak}`);
    assert.ok(Math.sqrt(power / frames) > .07 && Math.sqrt(power / frames) < .11);
    assert.ok(Math.abs(mean / frames) < .001, `${score.id} DC offset`);
    const seam = Math.abs(wav.readInt16LE(44) - wav.readInt16LE(wav.length - 2)) / 32768;
    assert.ok(seam < .04 && seam < maxStep, `${score.id} loop seam ${seam}`);
    const hash = createHash('sha256').update(wav).digest('hex').slice(0, 10);
    assert.ok(track.src.includes(hash)); hashes.add(hash);
  }
  assert.equal(hashes.size, 6);
});

test('all game entry points select their own theme while birthday keeps its separate melody', () => {
  for (const [file, id] of Object.entries({ 'flappy-app': 'flappy', 'fishing-app': 'mining', 'rooftop-app': 'platformer', 'candy-app': 'slingshot', 'catris-app': 'tetris' })) {
    const source = readFileSync(new URL(`../dist/${file}.mjs`, import.meta.url), 'utf8');
    assert.match(source, new RegExp(`new ArcadeAudio\\([^;\\n]*['"]${id}['"]`));
  }
  assert.match(readFileSync(new URL('../dist/app.mjs', import.meta.url), 'utf8'), /new BackgroundMusic\([^;\n]*'snake'/);
  const birthday = readFileSync(new URL('../dist/birthday-app.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(birthday, /audio\.updateMusic\(/);
});
