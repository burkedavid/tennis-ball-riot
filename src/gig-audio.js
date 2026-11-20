// A small original garage-band arrangement. All sounds are synthesised locally.
export class GigAudio {
  constructor() { this.muted = false; this.live = false; this.beat = 0; this.next = 0; }
  unlock() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    if (!this.ctx) {
      try {
        this.ctx = new Audio();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
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
    if (this.master) this.master.gain.setTargetAtTime(value ? 0 : .32, this.ctx.currentTime, .025);
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
  tick(dt, playing, nearGoal) {
    if (!playing || this.muted || this.ctx?.state !== 'running') return;
    this.next -= dt;
    this.hush=Math.max(0,(this.hush||0)-dt);
    if (this.next > 0) return;
    this.next = .24;
    const step = this.beat++ % 32, root = [82.41, 82.41, 98, 73.42][step >> 3];
    if(this.hush>0)return;
    this.note(6700, .055, .035, 'noise');
    if (step % 4 === 0) this.note(96, .16, .19, 'sine', 0, 38);
    if (step % 4 === 2) this.note(1750, .12, .16, 'noise');
    if (step % 2 === 0 || step % 8 === 7) this.note(root * (step % 8 === 6 ? 1.5 : 1), .19, .14, 'triangle');
    if ((step % 8 === 1 || step % 8 === 4) || (nearGoal && step % 4 === 3)) {
      this.note(root * 2, .15, .042, 'sawtooth');
      this.note(root * 3, .16, .028, 'triangle');
    }
  }
  event(type, e) {
    if (type === 'launch') this.note(900, .14, .16, 'noise');
    if (type === 'bank' || type === 'singer') this.note(143, .09, .32, 'sine', 0, 76);
    if (type === 'rim' || type === 'make') {
      this.hush=.22;
      this.note(1450, .28, .23); this.note(3310, .17, .07);
    }
    if (type === 'make') {
      this.note(1800, .16, .25, 'noise', .12);
      this.note(840,.32,.09,'noise',.19);
      if (e.banks) this.note(1900, .13, .18, 'noise', .23);
    }
    if (type === 'miss') this.note(182, .23, .14, 'triangle', 0, 81);
    if (type === 'result' && (e.phase === 'clear' || e.phase === 'victory'))
      [330,392,494,659].forEach((n,i) => this.note(n, .24, .19, 'triangle', i * .075));
  }
}
