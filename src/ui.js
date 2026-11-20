import { DEFAULT_AIM, LEVELS } from './simulation.js';

const byId = (id) => document.getElementById(id);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const format = (value) => (Number(value) || 0).toLocaleString();
const hidden = (id, hide) => { const el = byId(id); if (el.hidden !== hide) el.hidden = hide; };
const label = (id, value) => { const el = byId(id); const text = String(value); if (el.textContent !== text) el.textContent = text; };
const storage = {
  read(key, fallback) { try { return JSON.parse(localStorage.getItem('riot-v2-' + key)) ?? fallback; } catch { return fallback; } },
  write(key, value) { try { localStorage.setItem('riot-v2-' + key, JSON.stringify(value)); } catch { /* Private play remains available. */ } },
};

function readSettings() {
  const saved = storage.read('settings', {}) || {};
  return {
    quality: ['low','medium','high','ultra'].includes(saved.quality) ? saved.quality : 'auto',
    controls: saved.controls === 'aim' ? 'aim' : 'flick',
    battery: saved.battery === true,
    reduced: typeof saved.reduced === 'boolean' ? saved.reduced : matchMedia('(prefers-reduced-motion: reduce)').matches,
    muted: saved.muted === true,
  };
}

const button = (name, action, primary = false) =>
  '<button class="' + (primary ? 'primary' : 'secondary') + '" data-action="' + action + '">' + name + '</button>';
const buttons = (...items) => '<div class="panel-actions">' + items.join('') + '</div>';
const stats = (rows) => '<dl class="stats">' + rows.map(([name,value]) => '<dt>' + name + '</dt><dd>' + value + '</dd>').join('') + '</dl>';

export function createUI(actions) {
  const settings = readSettings();
  const dialog = byId('panel');
  const area = byId('throw-area');
  let sim, lastPhase, panel = '', back = '', trigger = null;
  let gesture = null, angle = DEFAULT_AIM.angle, power = DEFAULT_AIM.power;
  let feedbackTime = 0, prevTime = performance.now(), firstShot = true;
  let best = Math.max(0, Number(storage.read('best',0)) || 0);
  let kbAim = false, renderValues = '';
  let wasReady = false;
  const describeAim = () => Math.round(angle) + '°  ·  ' + Math.round(power) + '% power';
  const controllable = () => sim?.phase === 'ready' && !panel;

  function refreshSettings() {
    byId('title-mute').setAttribute('aria-label',settings.muted ? 'Enable sound' : 'Mute sound');
    byId('title-mute').setAttribute('aria-pressed',String(settings.muted));
    byId('title-mute').querySelector('use').setAttribute('href',settings.muted ? '#i-muted' : '#i-audio');
    document.documentElement.classList.toggle('reduce',settings.reduced);
  }
  function applySettings() {
    refreshSettings();
    storage.write('settings',settings);
    actions.settings?.(settings);
  }
  function newAim(a,p,preview=true) {
    angle=clamp(a,15,85); power=clamp(p,0,100);
    byId('angle').value=angle;
    byId('power').value=power;
    label('angle-out',Math.round(angle)+'°');
    label('power-out',Math.round(power)+'%');
    label('aim-readout',describeAim());
    if(preview && controllable()) actions.aim?.(angle,power);
  }
  function cancelGesture() {
    const pointer = gesture?.id;
    gesture = null;
    if(pointer !== undefined && area.hasPointerCapture(pointer)) area.releasePointerCapture(pointer);
    actions.cancelAim?.();
    kbAim = false;
    hidden('aim-readout',true);
  }
  function closePanel(restore=true) {
    panel=''; back='';
    if(dialog.open) dialog.close();
    if(restore && trigger?.isConnected && trigger.getClientRects().length) trigger.focus({preventScroll:true});
    trigger=null;
  }
  function showPanel(id,title,html,canClose=true) {
    if(!dialog.open) trigger=document.activeElement;
    cancelGesture(); panel=id;
    label('panel-title',title);
    byId('panel-content').innerHTML=html;
    hidden('panel-close',!canClose);
    if(!dialog.open) dialog.showModal();
    const primary = dialog.querySelector('.primary') || dialog.querySelector('select');
    (primary || byId('panel-close')).focus({preventScroll:true});
  }
  function start() {
    if(!wasReady) return;
    actions.unlockAudio?.(); closePanel(false); firstShot=true;
    actions.start(); area.focus({preventScroll:true});
  }
  function closeCurrent() {
    if(panel==='error' || panel==='result') return;
    if(back==='pause') {back=''; showPause(); return;}
    const resume=sim?.phase==='paused';
    closePanel(); if(resume) {actions.resume(); area.focus({preventScroll:true});}
  }
  function showPause() {
    if(!['ready','flight','settling','paused'].includes(sim?.phase)) return;
    if(sim.phase!=='paused') actions.pause();
    showPanel('pause','Gig paused',buttons(button('Resume','resume',true),button('Retry level','retry')) +
      buttons(button('Settings','settings'),button('How to play','help'),button('Title screen','menu')));
  }
  function showHelp() {
    if(panel==='pause') back='pause';
    showPanel('help','How to play','<ol><li><b>Aim for the pint</b> beside the drummer. The ball has to drop through the rim from above.</li><li><b>Drag up and right</b> in the lower half of the screen, then release. A longer drag adds power. The dots show the start of the arc.</li><li><b>Watch the singer and crowd.</b> Time a clean shot or bounce off the stage gear. Consecutive makes build your score.</li></ol><p>For an alternative to dragging, select <b>Aim &amp; Throw</b> in Settings. On a keyboard, use ← → for angle, ↑ ↓ for power, Space to throw and Esc to pause.</p><p><a class="credits" href="./credits.txt" target="_blank" rel="noopener">Music, models and credits</a></p>' + buttons(button(back==='pause'?'Back':'Got it','close',true)));
  }
  function showSettings() {
    if(panel==='pause') back='pause';
    const select=(id,name,options)=>'<div class="setting"><label for="opt-'+id+'">'+name+'</label><select id="opt-'+id+'" data-option="'+id+'">'+options.map(([value,title])=>'<option value="'+value+'" '+(settings[id]===value?'selected':'')+'>'+title+'</option>').join('')+'</select></div>';
    const toggle=(id,name)=>'<div class="setting"><label for="opt-'+id+'">'+name+'</label><input type="checkbox" role="switch" id="opt-'+id+'" data-option="'+id+'" '+(settings[id]?'checked':'')+'></div>';
    showPanel('settings','Settings','<div class="settings-list">'+
      select('controls','Controls',[['flick','Drag & release'],['aim','Aim & Throw']])+
      select('quality','Graphics',['auto','low','medium','high','ultra'].map(k=>[k,k[0].toUpperCase()+k.slice(1)]))+
      toggle('battery','Battery saver (30 fps)')+toggle('reduced','Reduce effects')+toggle('muted','Mute sound')+'</div>'+buttons(button('Done','close',true)));
  }
  function showResult() {
    const {phase,score,makes,level,levelIndex,stats:runStats}=sim;
    const failed=phase==='failed', won=phase==='victory';
    const title=won?'House lights up!':failed?'Out of balls':'Song cleared!';
    const rows=[['Score',format(score)],['Pints hit',makes+' / '+level.goal],['Best streak',failed?sim.levelBest:runStats.bestCombo]];
    if(sim.earlyBonus) rows.push(['Quick-clear bonus','+'+sim.earlyBonus]);
    if(won) rows.push(['Accuracy',Math.round(sim.accuracy)+'%'],['Bank shots',runStats.banks]);
    const next = failed?'Retry level':won?'Play again':'Continue';
    const intro = won?'Ten songs. The drummer raises his glass.':failed?level.name:'Up next · '+LEVELS[levelIndex+1].name;
    showPanel('result',title,'<p>'+intro+'</p>'+stats(rows)+buttons(button(next,failed?'retry':won?'start':'next',true),button('Title screen','menu')),false);
    label('announce',title+'. Score '+score+'. '+intro+'.');
  }
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeCurrent();});
  byId('panel-close').onclick=closeCurrent;
  byId('panel-content').addEventListener('change',e=>{
    const key=e.target.dataset.option;
    if(!key || !(key in settings)) return;
    settings[key]=e.target.type==='checkbox'?e.target.checked:e.target.value;
    actions.unlockAudio?.(); applySettings();
  });
  byId('panel-content').addEventListener('click',e=>{
    const key=e.target.closest('[data-action]')?.dataset.action;
    if(!key)return;
    actions.unlockAudio?.();
    switch(key) {
      case 'close': case 'resume': closeCurrent(); break;
      case 'help': showHelp(); break;
      case 'settings': showSettings(); break;
      case 'start': start(); break;
      case 'menu': closePanel(false); actions.menu(); byId('play').focus({preventScroll:true}); break;
      case 'retry': case 'next': closePanel(false); actions[key](); area.focus({preventScroll:true}); break;
    }
  });
  byId('play').onclick=start;
  byId('help').onclick=showHelp;
  byId('title-settings').onclick=showSettings;
  byId('title-mute').onclick=()=>{settings.muted=!settings.muted;applySettings();actions.unlockAudio?.();};
  byId('pause').onclick=showPause;

  function touchAim(x,y) {
    if(!gesture) return false;
    const dx=(x-gesture.x)/gesture.scale,dy=(gesture.y-y)/gesture.scale;
    const distance=Math.hypot(dx,dy);
    if(dy<=0 || distance<10) {
      gesture.valid=false; actions.cancelAim?.(); hidden('aim-readout',true); return false;
    }
    gesture.valid=true;
    newAim(Math.atan2(dy,dx)*180/Math.PI,distance/120*100);
    hidden('aim-readout',false); hidden('teaching',true);
    return true;
  }
  area.addEventListener('pointerdown',e=>{
    if(!controllable() || settings.controls!=='flick' || gesture || !e.isPrimary || e.button!==0) return;
    e.preventDefault(); area.focus({preventScroll:true}); actions.unlockAudio?.();
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,scale:clamp(innerWidth/360,.86,1.35),valid:false};
    area.setPointerCapture(e.pointerId);
  });
  area.addEventListener('pointermove',e=>{if(e.pointerId===gesture?.id) touchAim(e.clientX,e.clientY);});
  function fire() {
    if(!controllable())return;
    actions.unlockAudio?.();
    actions.throw(angle,power); kbAim=false; hidden('aim-readout',true);
  }
  area.addEventListener('pointerup',e=>{
    if(e.pointerId!==gesture?.id)return;
    const valid=touchAim(e.clientX,e.clientY); cancelGesture(); if(valid) fire();
  });
  area.addEventListener('pointercancel',e=>{if(e.pointerId===gesture?.id) cancelGesture();});
  area.addEventListener('lostpointercapture',e=>{if(e.pointerId===gesture?.id) cancelGesture();});
  for(const id of ['angle','power']) byId(id).addEventListener('input',()=>newAim(+byId('angle').value,+byId('power').value));
  byId('throw').onclick=fire;
  document.addEventListener('keydown',e=>{
    if(panel || e.altKey || e.ctrlKey || e.metaKey)return;
    if(e.key==='Escape' && ['ready','flight','settling'].includes(sim?.phase)){e.preventDefault(); showPause();return;}
    if(!controllable())return;
    const onRange=e.target.matches?.('input[type=range]');
    if(e.key===' ' && (!e.target.closest?.('button,select,textarea') || onRange)) {e.preventDefault();if(!e.repeat) fire();return;}
    if(onRange || e.target.matches?.('select,textarea')) return;
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();
    const da=e.key==='ArrowLeft'?1:e.key==='ArrowRight'?-1:0;
    const dp=e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0;
    kbAim=true; newAim(angle+da,power+dp);
  });
  function interrupt() {
    cancelGesture();
    if(!panel && ['ready','flight','settling'].includes(sim?.phase)) showPause();
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden) interrupt();});
  window.addEventListener('blur',interrupt);
  window.addEventListener('resize',()=>{if(gesture) cancelGesture();});
  function flash(text,seconds=1.2) {
    label('feedback',text); hidden('feedback',false); feedbackTime=seconds;
  }
  function event(type,detail={}) {
    if(typeof type==='object') {detail=type;type=detail.type;}
    if(type==='make') flash((detail.banks===0?'Clean shot':detail.banks===1?'Bank shot':'Double bank')+' · '+detail.base+' + '+detail.bonus);
    if(type==='miss') flash(detail.rim?'Rim out!':'Missed the pint');
    if(type==='singer') flash('Singer deflection',.65);
    if(type==='rim') flash('On the rim!',.45);
    if(type==='launch') {firstShot=false;hidden('teaching',true);}
  }
  function render(state) {
    sim=state;
    const phase=state.phase, title=phase==='title';
    const now=performance.now(), dt=Math.min(.1,(now-prevTime)/1000);prevTime=now;
    if(phase!==lastPhase) {
      hidden('title',!title); hidden('hud',title);document.body.dataset.screen=title?'title':'game';
      if(['clear','failed','victory'].includes(phase)) showResult();
      else if(phase==='paused' && !panel) showPause();
      else if(phase==='ready'){
        if(lastPhase==='title'||['failed','clear','victory'].includes(lastPhase))newAim(DEFAULT_AIM.angle,DEFAULT_AIM.power,false);
        if(settings.controls==='aim' || (firstShot && !kbAim)) actions.aim?.(angle,power);
        if(lastPhase==='title') area.focus({preventScroll:true});
      }
      if(title && lastPhase && !panel) byId('play').focus({preventScroll:true});
      if(title || (phase==='ready' && lastPhase!=='settling')) {feedbackTime=0;hidden('feedback',true);}
      lastPhase=phase;
    }
    if(state.score>best){best=state.score;storage.write('best',best);label('title-best',format(best));}
    if(title)return;
    const values=[state.levelIndex,state.score,state.remaining,state.makes,phase].join(',');
    if(renderValues!==values){
      renderValues=values;
      label('song-count','Song '+String(state.levelIndex+1).padStart(2,'0')+' / '+LEVELS.length);
      label('song',state.level.name);label('points',format(state.score));label('stock',state.remaining);label('target',state.makes+' / '+state.level.goal);
      label('best-in-play','Best '+format(best)); label('streak',state.combo+' streak'); hidden('streak',state.combo<2);
      for(const id of ['throw','angle','power'])byId(id).disabled=phase!=='ready';
      if(phase==='ready')label('announce',state.level.name+'. '+state.remaining+' balls left. '+state.makes+' of '+state.level.goal+' in the pint.');
    }
    const aiming=settings.controls==='aim';
    hidden('aim-controls',!aiming);hidden('teaching',!(firstShot && !aiming && !kbAim && !gesture?.valid && phase==='ready'));
    hidden('aim-readout',!(phase==='ready' && !aiming && (kbAim || gesture?.valid)));
    if(state.surge){
      const {warning,active,direction}=state.surge;
      hidden('surge',!(warning || active));
      if(warning||active)label('surge',(active?'Crowd bump ':'Crowd surge coming ')+(direction>0?'→':'←'));
    }
    if(feedbackTime>0 && phase!=='paused'){feedbackTime-=dt;if(feedbackTime<=0)hidden('feedback',true);}
  }
  refreshSettings(); label('title-best',format(best));
  return {
    render,event,settings,get view(){return panel || sim?.phase || 'title';},
    ready(){wasReady=true;byId('play').disabled=false;hidden('load-line',true);},
    loading(percent){byId('load-meter').value=clamp(percent,0,100);label('load-label','Tuning up · '+Math.round(percent)+'%');},
    recover(){
      if(panel!=='error')return;
      closePanel(false);
      if(sim?.phase==='paused')showPause();
      else if(['clear','victory','failed'].includes(sim?.phase))showResult();
      else (sim?.phase==='title'?byId('play'):area).focus({preventScroll:true});
    },
    fail(message){
      showPanel('error','Stage unavailable','<p id="error-message"></p><div class="panel-actions"><button id="reload" class="primary">Try again</button></div>',false);
      label('error-message',message);byId('reload').onclick=()=>location.reload();
    },
  };
}
