// "Last Orders", an original sixteen-bar garage-band instrumental.
// Generate the instrument attacks once. Playback only schedules short buffer voices.
export const TEMPO = 114;
const eighth = 30 / TEMPO;
const rootHz = 73.416; // D2
const bars = [
  0, 0, 5, 0, 0, 3, 10, 0,
  0, 7, 5, 0, 3, 10, 5, 0
];
function noiseSource(seed) {
  return () => { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; return seed/2147483648-1; };
}
function buffer(ctx, seconds, sample) {
  const rate=24000, out=ctx.createBuffer(1,Math.ceil(seconds*rate),rate);
  const data=out.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=sample(i/rate,i);
  return out;
}
// Excite a delay line with a pick impulse. Damping controls palm mute.
function string(hz,damping,random) {
  const size=Math.round(24000/hz-.5), line=new Float32Array(size);
  let index=0;
  for(let i=0;i<size;i++)line[i]=random()+.42*Math.sin(i*2*Math.PI/size);
  return () => {
    const value=line[index], next=(index+1)%size;
    line[index]=damping*(value+line[next])*.5;index=next;return value;
  };
}
function guitar(ctx,muted,detune,seed) {
  const rand=noiseSource(seed), pitches=[1,1.5,2];
  const strings=pitches.map(p=>string(rootHz*p*detune,muted?.971:.998,rand));
  let cabinet=0,dc=0;
  return buffer(ctx,muted?.29:1.15,(t,i)=>{
    // Slightly stagger the attack of the three strings in a downstroke.
    const chord=strings[0]()+ (i>54?strings[1]():0)*.84 + (i>117?strings[2]():0)*.58;
    dc+=.022*(chord-dc);
    const clipped=Math.tanh((chord-dc*.55)*5.8);
    cabinet+=.41*(clipped-cabinet);
    return cabinet*Math.min(1,t*380)*Math.exp(-t*(muted?11:2.25));
  });
}
function makeKit(c) {
  const random=noiseSource(8972), tau=Math.PI*2;
  let previous=0,snareLo=0;
  return {
    kick:buffer(c,.33,t=>Math.tanh(1.7*Math.sin(tau*(45*t+2.2*(1-Math.exp(-t*43)))))*Math.exp(-t*15)
      +random()*.16*Math.exp(-t*340)),
    snare:buffer(c,.31,t=>{
      const white=random();snareLo+=.27*(white-snareLo);
      return (white-snareLo)*.8*Math.exp(-t*21)+Math.sin(tau*182*t)*.53*Math.exp(-t*32);
    }),
    metal:buffer(c,.23,t=>{
      const n=random(),high=n-previous;previous=n;
      const rings=Math.sin(tau*3151*t+1.7*Math.sin(tau*2213*t))+Math.sin(tau*4873*t+Math.sin(tau*1616*t));
      return (high*.28+rings*.19)*Math.exp(-t*26);
    }),
    bass:buffer(c,1.1,t=>{
      const phase=tau*rootHz*.5*t;
      return Math.tanh(1.6*(Math.sin(phase)+.49*Math.sin(phase*2)+.24*Math.sin(phase*3)))
        *Math.min(1,t*220)*Math.exp(-t*2.7);
    }),
    keys:buffer(c,.87,t=>{
      const phase=tau*293.665*t;
      return (.49*Math.sin(phase)+.23*Math.sin(phase*2.003)+.17*Math.sin(phase*3.012)
        +.11*Math.sin(phase*5.019)*Math.exp(-t*10))*Math.min(1,t*270)*Math.exp(-t*4.6);
    })
  };
}
export class Backline {
  constructor(ctx,output) {
    this.ctx=ctx;this.bus=ctx.createGain();this.bus.gain.value=.77;this.bus.connect(output);
    // Short asymmetric room reflections put the instruments on the same stage.
    const echo=ctx.createDelay(.2);echo.delayTime.value=.079;
    const reflection=ctx.createGain();reflection.gain.value=.085;
    this.bus.connect(echo);echo.connect(reflection);reflection.connect(output);
    this.channels={};
    for(const [name,pan] of Object.entries({left:-.44,right:.46,center:0,metal:.23,keys:-.22})){
      const node=ctx.createStereoPanner();node.pan.value=pan;node.connect(this.bus);this.channels[name]=node;
    }
    this.kit=makeKit(ctx);
    this.strums=[guitar(ctx,false,.997,101),guitar(ctx,false,1.003,891)];
    this.chugs=[guitar(ctx,true,.997,173),guitar(ctx,true,1.003,764)];
    this.playing=false;this.step=0;this.clock=0;
  }
  hit(sample,when,gain,duration,semitones=0,channel='center') {
    const ctx=this.ctx,source=ctx.createBufferSource(),amp=ctx.createGain();
    source.buffer=sample;source.playbackRate.value=2**(semitones/12);
    const end=when+Math.min(sample.duration/source.playbackRate.value,duration);
    amp.gain.setValueAtTime(0,when);amp.gain.linearRampToValueAtTime(gain,when+.002);
    amp.gain.setValueAtTime(gain,Math.max(when+.003,end-.025));amp.gain.linearRampToValueAtTime(0,end);
    source.connect(amp);amp.connect(this.channels[channel]);source.start(when);source.stop(end);
    source.onended=()=>{source.disconnect();amp.disconnect();};
  }
  schedule(step,t,hot) {
    const bar=Math.floor(step/8)%16, beat=step%8;
    const root=bars[bar], turnaround=bar%4===3;
    const accents=beat===0 || beat===3 || (beat===6&&!turnaround);
    if(accents || (beat%2===0 && beat!==6) || beat===7 && (turnaround||hot)){
      const strum=accents?this.strums:this.chugs;
      const len=accents?eighth*1.68:eighth*.64;
      this.hit(strum[0],t,.255,len,root,'left');
      this.hit(strum[1],t+.012,.185,len,root,'right');
    }
    if(beat%2===0 || beat===7 && turnaround)
      this.hit(this.kit.bass,t+.005,.64,eighth*(beat===6?1.1:1.84),root+(beat===7?7:0));
    if(beat===0 || beat===4 || beat===(bar%2?7:3))this.hit(this.kit.kick,t,.71,.32);
    if(beat===2 || beat===6)this.hit(this.kit.snare,t+.009,.49,.30);
    if(turnaround && beat===7){
      this.hit(this.kit.snare,t,.22,.115,-3);
      this.hit(this.kit.snare,t+eighth*.53,.30,.14,-1);
    }
    this.hit(this.kit.metal,t+.003,beat%2?.16:.115,beat===7?.2:.093,beat%2?2:0,'metal');
    if(beat===1 || beat===5 || hot && beat===7)
      this.hit(this.kit.keys,t+.011,.18,eighth*1.5,bar%4===2?7:0,'keys');
  }
  update(active,hot) {
    if(!active){
      if(this.playing){this.bus.gain.setTargetAtTime(0,this.ctx.currentTime,.015);this.playing=false;}
      return;
    }
    const now=this.ctx.currentTime;
    if(!this.playing){
      this.playing=true;this.start=now+.018;this.next=this.start;this.step=0;
      this.bus.gain.cancelScheduledValues(now);this.bus.gain.setTargetAtTime(.77,now,.012);
    }
    // Catch up after a stalled render without firing a burst of overdue notes.
    if(this.next<now-.025){
      this.step=Math.ceil((now-this.start)/eighth);this.next=this.start+this.step*eighth;
    }
    while(this.next<now+.145){
      this.schedule(this.step,this.next,hot);this.step++;this.next=this.start+this.step*eighth;
    }
    this.clock=Math.max(0,now-this.start);
  }
  duck() {
    const t=this.ctx.currentTime,g=this.bus.gain;
    g.cancelScheduledValues(t);g.setTargetAtTime(.18,t,.012);g.setTargetAtTime(.77,t+.21,.09);
  }
}
