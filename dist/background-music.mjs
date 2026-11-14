import { MUSIC_TRACKS } from './music-tracks.mjs';

// A decoded loop has no timer drift or silence between repetitions. Tracks are
// fetched only after the player enables music and unlocks browser audio.
export class BackgroundMusic {
  constructor(context, enabled, trackId, environment = {}) {
    this.context = context;
    this.enabled = enabled;
    this.track = MUSIC_TRACKS[trackId];
    this.document = environment.document ?? globalThis.document;
    this.window = environment.window ?? globalThis.window;
    this.fetch = environment.fetch ?? globalThis.fetch?.bind(globalThis);
    this.generation = 0;
    this.offset = 0;
    this.leaving = false;
    this.disposed = false;
    this.listeners = [];
    const listen = (target, name, callback) => {
      target?.addEventListener?.(name, callback);
      this.listeners.push(() => target?.removeEventListener?.(name, callback));
    };
    listen(this.document, 'visibilitychange', () => this.update());
    listen(this.window, 'resize', () => this.update());
    listen(this.window, 'pagehide', () => { this.leaving = true; this.stop(); });
    listen(this.window, 'pageshow', () => { this.leaving = false; this.update(); });
  }

  canPlay() {
    return !this.disposed && !this.leaving && !!this.track && this.enabled()
      && !this.document?.hidden && !(this.window?.innerWidth < 1000)
      && this.context()?.state === 'running';
  }

  update() {
    if (!this.canPlay()) { this.stop(); return; }
    if (this.voice) return;
    if (this.pending) return this.pending;
    const context = this.context(), generation = ++this.generation;
    const controller = new AbortController();
    this.controller = controller;
    this.pending = Promise.resolve().then(async () => {
      try {
        if (generation !== this.generation) return;
        if (this.bufferContext !== context) {
          const response = await this.fetch(new URL(this.track.src, import.meta.url), { signal: controller.signal });
          if (!response.ok) throw new Error('Music unavailable');
          const buffer = await context.decodeAudioData(await response.arrayBuffer());
          if (generation !== this.generation) return;
          this.buffer = buffer;
          this.bufferContext = context;
        }
        if (generation !== this.generation || !this.canPlay() || this.context() !== context) return;
        const source = context.createBufferSource(), gain = context.createGain();
        source.buffer = this.buffer;
        source.loop = true;
        source.connect(gain);
        gain.connect(context.destination);
        const start = context.currentTime;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(.16, start + .12);
        const voice = { source, gain, start, offset: this.offset % this.buffer.duration };
        source.onended = () => {
          source.disconnect(); gain.disconnect();
          if (this.voice === voice) this.voice = null;
        };
        this.voice = voice;
        try { source.start(start, voice.offset); }
        catch (error) {
          this.voice = null;
          source.disconnect(); gain.disconnect();
          throw error;
        }
      } catch {
        // Missing audio or an interrupted download never blocks gameplay.
        // A later gesture/toggle can retry without reloading the game.
      } finally {
        if (generation === this.generation) { this.pending = null; this.controller = null; }
      }
    });
    return this.pending;
  }

  stop() {
    ++this.generation;
    this.controller?.abort();
    this.controller = null;
    this.pending = null;
    if (!this.voice) return;
    const { source, gain, start, offset } = this.voice;
    this.voice = null;
    const now = this.bufferContext.currentTime;
    this.offset = (offset + Math.max(0, now - start)) % this.buffer.duration;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + .04);
    source.stop(now + .05);
  }

  dispose() {
    this.disposed = true;
    this.stop();
    for (const remove of this.listeners) remove();
    this.listeners = [];
  }
}
