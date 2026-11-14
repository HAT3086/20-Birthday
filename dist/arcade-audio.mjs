import { BackgroundMusic } from './background-music.mjs';

export class ArcadeAudio {
  constructor(settings, gameId) {
    this.settings = settings;
    this.context = null;
    this.music = new BackgroundMusic(() => this.context, () => this.settings().music, gameId);
  }
  async unlock() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      this.context ||= new Audio();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { /* Audio is optional; keyboard play remains available. */ }
  }
  tone(frequency, duration = .1, volume = .025, delay = 0) {
    const ac = this.context;
    if (!ac || ac.state !== 'running') return;
    const oscillator = ac.createOscillator(); const gain = ac.createGain();
    const start = ac.currentTime + delay;
    oscillator.type = 'triangle'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(volume, start + .008); gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    oscillator.connect(gain); gain.connect(ac.destination); oscillator.start(start); oscillator.stop(start + duration + .02);
    return oscillator;
  }
  effect(name) {
    if (!this.settings().sound) return;
    if (name === 'catris-move') this.tone(330,.035,.006);
    if (name === 'catris-turn') this.tone(480,.045,.009);
    if (name === 'catris-lock') this.tone(220,.07,.011);
    if (name === 'catris-drop') {this.tone(185,.07,.015);this.tone(310,.09,.01,.03);}
    if (name === 'catris-clear') [523,659,880].forEach((note,i)=>this.tone(note,.12,.017,i*.06));
    if (name === 'candy-swap') this.tone(420,.055,.012);
    if (name === 'candy-match') {this.tone(659,.08,.018);this.tone(880,.1,.014,.045);}
    if (name === 'candy-special') [523,784,1047].forEach((note,i)=>this.tone(note,.12,.018,i*.055));
    if (name === 'flap') this.tone(420, .055, .012);
    if (name === 'jump') { this.tone(350, .07, .014); this.tone(510, .09, .01, .035); }
    if (name === 'laser') [880,740,590,440].forEach((note,i)=>this.tone(note,.08,.015,i*.025));
    if (name === 'stun') {this.tone(980,.12,.018);this.tone(620,.16,.015,.06);}
    if (name === 'stomp') {this.tone(220,.08,.02);this.tone(520,.12,.015,.04);}
    if (name === 'powerup') [523,784,1047].forEach((note,i)=>this.tone(note,.16,.02,i*.08));
    if (name === 'hurt') {this.tone(250,.16,.02);this.tone(180,.2,.016,.08);}
    if (name === 'checkpoint') [440, 660, 880].forEach((note, i) => this.tone(note, .12, .018, i * .07));
    if (name === 'cast') { this.tone(370, .08, .012); this.tone(260, .12, .01, .05); }
    if (name === 'hook') this.tone(600, .06, .014);
    if (name === 'catch') { this.tone(660, .09, .02); this.tone(880, .13, .016, .07); }
    if (name === 'orb') [587, 784, 1175].forEach((note, i) => this.tone(note, .15, .02, i * .07));
    if (name === 'gate') { this.tone(740, .075, .02); this.tone(988, .1, .015, .04); }
    if (name === 'start') [523, 784].forEach((note, i) => this.tone(note, .13, .025, i * .08));
    if (name === 'star') [523, 659, 784, 1047].forEach((note, i) => this.tone(note, .2, .03, i * .075));
    if (name === 'won') [523, 659, 784, 1047, 988, 1047].forEach((note, i) => this.tone(note, .27, .03, i * .1));
    if (name === 'lost') { this.tone(220, .15, .025); this.tone(147, .22, .018, .12); }
  }
  updateMusic() {
    return this.music.update();
  }
}
