import { Backline } from './backline.js';

export class GigAudio {
  constructor() { this.muted = false; }
  unlock() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    if (!this.ctx) {
      try {
        this.ctx = new Audio();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : .65;
        const limiter=this.ctx.createDynamicsCompressor();
        limiter.threshold.value=-11;limiter.ratio.value=4;limiter.attack.value=.004;
        this.master.connect(limiter);limiter.connect(this.ctx.destination);
        this.band=new Backline(this.ctx,this.master);
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * .4, this.ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        this.noise = buffer;
      } catch { return; }
    }
    if (!document.hidden && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }
  mute(value) {
    this.muted = value;
    if (this.master) this.master.gain.setTargetAtTime(value ? 0 : .65, this.ctx.currentTime, .025);
  }
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); }
  note(hz, duration, gain, wave = 'sine', delay = 0, endHz = hz) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
    const c = this.ctx, start = c.currentTime + delay;
    const envelope = c.createGain();
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + .007);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    let voice;
    if (wave === 'noise') {
      voice = c.createBufferSource(); voice.buffer = this.noise;
      const filter = c.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = hz;
      voice.connect(filter); filter.connect(envelope);
      voice.onended = () => { voice.disconnect(); filter.disconnect(); envelope.disconnect(); };
    } else {
      voice = c.createOscillator(); voice.type = wave;
      voice.frequency.setValueAtTime(hz, start);
      voice.frequency.exponentialRampToValueAtTime(endHz, start + duration);
      voice.connect(envelope);
      voice.onended = () => { voice.disconnect(); envelope.disconnect(); };
    }
    envelope.connect(this.master); voice.start(start); voice.stop(start + duration + .01);
  }
  tick(playing, hot) {
    if(this.ctx?.state==='running')this.band?.update(playing && !this.muted,hot);
  }
  event(type, e) {
    if (type === 'launch') this.note(900, .14, .16, 'noise');
    if (type === 'bank' || type === 'singer') this.note(143, .09, .32, 'sine', 0, 76);
    if (type === 'rim' || type === 'make') {
      this.band?.duck();
      this.note(1450, .28, .23); this.note(3310, .17, .07);
    }
    if (type === 'make') {
      this.note(1800, .16, .25, 'noise', .12);
      const applause=e.priorCombo>=2 || e.banks>0 ? 14 : 7;
      // A scattering of close handclaps and the delayed answer from the back of the room.
      for(let i=0;i<applause;i++){
        const delay=.14+i*.045+.021*Math.sin(i*7.3);
        this.note(940+(i%5)*210,.045+(i%3)*.012,.12*(1-i/(applause+2)),'noise',delay);
      }
      if (e.banks) this.note(1900, .13, .18, 'noise', .23);
    }
    if (type === 'miss') this.note(182, .23, .14, 'triangle', 0, 81);
    if (type === 'result' && (e.phase === 'clear' || e.phase === 'victory'))
      [330,392,494,659].forEach((n,i) => this.note(n, .24, .19, 'triangle', i * .075));
  }
}
