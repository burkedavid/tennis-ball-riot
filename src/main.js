import { Simulation } from './simulation.js';

import { createUI } from './ui.js';
import { GigAudio } from './gig-audio.js';

const audio = new GigAudio();
let stage, ui, loaded = false, previous = 0, elapsed = 0, raf = 0;
const sim = new Simulation(event => {
  stage?.event(event.type);
  ui?.event(event.type,event);
  audio.event(event.type,event);
  if (event.type === 'make' && !ui.settings.reduced) navigator.vibrate?.(18);
});
ui = createUI({
  start: () => sim.start(),
  menu: () => { stage?.cancelAim(); sim.menu(); },
  next: () => sim.next(),
  retry: () => sim.retry(),
  pause: () => { sim.pause(); audio.suspend(); },
  resume: () => { audio.unlock(); sim.resume(); },
  throw: (angle,power) => sim.launch(angle,power),
  aim: (angle,power) => stage?.aim(angle,power),
  cancelAim: () => stage?.cancelAim(),
  settings: settings => { audio.mute(settings.muted); stage?.settings(settings); },
  unlockAudio: () => audio.unlock()
});
ui.render(sim);
const canvas = document.getElementById('stage');
function frame(now) {
  if (!loaded || document.hidden) return;
  raf = requestAnimationFrame(frame);
  const delta = previous ? (now - previous) / 1000 : 1/60;
  previous = now;
  const limit = ui.settings.battery ? 1/30 : 0;
  elapsed += delta;
  if (elapsed + .0005 < limit) return;
  const raw = elapsed;
  elapsed = limit ? Math.max(0, (elapsed + .0005) % limit - .0005) : 0;
  // Preserve the elapsed fraction when limiting display refresh without double ticking physics.
  const dt = Math.min(.12,raw - elapsed);
  sim.update(dt);
  audio.tick(['ready','flight','settling'].includes(sim.phase),sim.combo>=2 || sim.makes+1>=sim.level.goal);
  ui.render(sim);
  const songTime = audio.band?.playing ? audio.band.clock : undefined;
  stage.draw(dt,songTime);
  if(sim.phase!=='paused')stage.observe(raw);
}
function wake() {
  cancelAnimationFrame(raf); previous = 0; elapsed = 0;
  if (loaded && !document.hidden) raf = requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { audio.suspend(); cancelAnimationFrame(raf); }
  else wake();
});
window.addEventListener('resize', () => stage?.resize());
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault(); sim.pause(); loaded=false; cancelAnimationFrame(raf); audio.suspend();
  ui.fail('Graphics were interrupted. Try again to reopen the stage. Your personal best is saved.');
});
canvas.addEventListener('webglcontextrestored', () => {
  // Three restores its renderer first; wait until all context handlers have completed.
  requestAnimationFrame(() => {
    try {
      stage.resize(); stage.draw(0); loaded=true; ui.recover(); wake();
    } catch {
      ui.fail('The graphics device could not restore the stage. Try again to reload.');
    }
  });
});
async function load() {
  try {
    ui.loading(3);
    const { Stage, loadingManager } = await import('./stage.js');
    let progress=3;
    loadingManager.onProgress = (_url,done,total) => {
      progress=Math.max(progress,10 + 78 * done / total);ui.loading(progress);
    };
    stage = new Stage(canvas,sim);
    stage.settings(ui.settings); audio.mute(ui.settings.muted);
    await stage.ready;
    ui.loading(94);
    stage.draw(0);
    loaded = true; ui.ready(); wake();
    if (import.meta.env.PROD && 'serviceWorker' in navigator)
      navigator.serviceWorker.register('./sw.js').catch(() => {});
  } catch (e) {
    console.error('Unable to open the stage',e);
    ui.fail('The stage needs WebGL 2 and its local art files. Enable hardware acceleration and check your connection, then try again.');
  }
}
load();
