import * as T from 'three';
import { buildVenue } from './venue.js';
import { ORIGIN, BALL_RADIUS } from './simulation.js';
import { ConcertLens } from './lens.js';
export const loadingManager=T.DefaultLoadingManager;

const material = (color, metalness = 0, roughness = .72) =>
  new T.MeshStandardMaterial({ color, metalness, roughness });
function mesh(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(geo, mat); m.position.set(x,y,z); parent.add(m); return m;
}
const boxGeo = new T.BoxGeometry(1,1,1);
function box(parent, mat, x,y,z,w,h,d) {
  const m = mesh(parent,boxGeo,mat,x,y,z); m.scale.set(w,h,d);
  m.castShadow = m.receiveShadow = true; return m;
}
function sign(text, fg, bg, width, height) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0,0,512,128);
  ctx.strokeStyle = fg; ctx.lineWidth=3; ctx.strokeRect(8,8,496,112);
  ctx.textBaseline='middle';ctx.textAlign='center';ctx.font='bold 57px Arial';
  ctx.fillStyle=fg;ctx.fillText(text,256,66,460);
  const map=new T.CanvasTexture(canvas); map.colorSpace=T.SRGBColorSpace;
  return new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map}));
}
function grainTexture(tint) {
  const data=new Uint8Array(64*64*4);
  let seed=1981;
  for(let i=0;i<data.length;i+=4){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const n=.68+.32*(seed/4294967296);
    for(let ch=0;ch<3;ch++)data[i+ch]=n*tint[ch];
    data[i+3]=255;
  }
  const map=new T.DataTexture(data,64,64);
  map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
  map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.needsUpdate=true;return map;
}
function tennisBall() {
  const group = new T.Group(), r = BALL_RADIUS;
  const fuzz = material(0xeaff45,0,.96); fuzz.emissive.setHex(0x323500);
  fuzz.map=grainTexture([246,255,198]);fuzz.bumpMap=fuzz.map;fuzz.bumpScale=.0015;
  const ball = mesh(group,new T.SphereGeometry(r,32,20),fuzz);
  ball.castShadow=true;
  const points=[];
  for (let i=0;i<96;i++) {
    const a=2*Math.PI*i/96, lat=.69*Math.cos(2*a);
    points.push(new T.Vector3(Math.cos(a)*Math.cos(lat),Math.sin(lat),Math.sin(a)*Math.cos(lat)).multiplyScalar(r*1.001));
  }
  mesh(group,new T.TubeGeometry(new T.CatmullRomCurve3(points,true),96,r*.031,5,true),material(0xf7f3c2));
  return group;
}
function throwingHand() {
  const hand=new T.Group(),skin=material(0xae745a,.01,.88);
  const knuckle=material(0xba816a,.01,.79),cloth=material(0x313329,0,.96);
  function segment(a,b,r,m){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),diff=end.clone().sub(start);
    const part=mesh(hand,new T.CapsuleGeometry(r,Math.max(.001,diff.length()-r),4,10),m);
    part.position.copy(start.lerp(end,.5));part.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),diff.normalize());
  }
  segment([-.41,-.52,.20],[-.10,-.17,.09],.086,skin);
  segment([-.23,-.32,.14],[-.19,-.27,.13],.092,cloth);
  const palm=mesh(hand,new T.SphereGeometry(1,18,12),skin,-.076,-.11,.07);
  palm.scale.set(.095,.145,.052);palm.rotation.z=-.55;
  for(let i=0;i<4;i++){
    const x=-.09+i*.037, y=-.053-Math.abs(i-1)*.012,z=-.03+i*.01;
    segment([x-.026,-.13,.033],[x,y,z],.023-i*.001,skin);
    segment([x,y,z],[x+.016,y+.05,z-.004],.019-i*.001,knuckle);
  }
  segment([-.15,-.10,.075],[-.09,-.005,.07],.032,skin);
  segment([-.09,-.005,.07],[-.048,.014,.054],.024,knuckle);
  hand.position.set(ORIGIN.x,ORIGIN.y,0);return hand;
}
const tiers = ['low','medium','high','ultra'];
const scales=[.68,.9,1.35,2], shadows=[0,512,1024,2048];

export class Stage {
  constructor(canvas,sim) {
    this.canvas=canvas; this.sim=sim;
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.15;
    this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.lens=new ConcertLens(this.renderer);
    this.gpu=this.renderer.getContext();
    this.timer=this.gpu.getExtension('EXT_disjoint_timer_query_webgl2');
    this.renderCount=0;this.gpuMs=0;this.query=null;
    canvas.addEventListener('webglcontextrestored',()=>{
      this.query=null;this.gpuMs=0;this.timer=this.gpu.getExtension('EXT_disjoint_timer_query_webgl2');
    });
    this.scene=new T.Scene(); this.camera=new T.PerspectiveCamera(38,1,.08,100);
    this.venue=buildVenue(this.scene,this.renderer);
    this.ready=this.venue.ready || Promise.resolve();
    this.props=new T.Group(); this.scene.add(this.props);
    const chrome=material(0xc9c2b6,.78,.27), caseMat=material(0x342e2e,.38,.78);
    caseMat.map=grainTexture([239,232,224]);caseMat.bumpMap=caseMat.map;caseMat.bumpScale=.0035;
    const caseW=.94, caseDepth=.68, base=sim.glass.bottom;
    const x=sim.glass.x;
    box(this.props,caseMat,x,base/2,0,caseW,base,caseDepth);
    for (const y of [.04,base-.08,base-.018]) box(this.props,chrome,x,y,0,caseW+.018,.022,caseDepth+.014);
    for(const side of [-1,1]) box(this.props,chrome,x+side*(caseW/2-.035),base/2,caseDepth/2,.025,base,.024);
    const latchMat=material(0x716c63,.85,.34);
    for(const side of [-1,1]){
      box(this.props,latchMat,x+side*.32,base-.13,caseDepth/2+.014,.085,.13,.022);
      box(this.props,chrome,x+side*.32,base-.126,caseDepth/2+.027,.045,.053,.011);
    }
    const label=sign("DRUMMER'S PINT",'#272020','#e6d9b7',.76,.17);
    label.position.set(x,base*.57,caseDepth/2+.005);label.rotation.z=-.025;this.props.add(label);
    this.pint=new T.Group();this.pint.position.set(x,base,.005);this.props.add(this.pint);
    const h=sim.glass.y-base;
    const glassMat=new T.MeshPhysicalMaterial({color:0xe6fbff,roughness:.09,metalness:.05,transparent:true,opacity:.16,depthWrite:false,clearcoat:1});
    // End the inner wall above the liquid. Coplanar glass and beer produced
    // a jagged white band around the pint at mobile rendering resolutions.
    const profile=[[.70,0],[.76,.025],[.82,h*.36],[1,h],[.955,h],[.898,h*.71]].map(([a,b])=>new T.Vector2(a,b));
    const shell=mesh(this.pint,new T.LatheGeometry(profile,48),glassMat);shell.renderOrder=3;
    const lipMat=new T.MeshStandardMaterial({color:0xf9fcf2,emissive:0x777345,roughness:.12,metalness:.58});
    const lip=mesh(this.pint,new T.TorusGeometry(1,.025,10,64),lipMat,0,h,0);lip.rotation.x=Math.PI/2;
    const amber=material(0xffe5b0,.02,.22), liquid=new T.CylinderGeometry(.85,.68,h*.62,48,6);
    const levels=liquid.attributes.position, tint=[],shade=new T.Color();
    const darkBeer=new T.Color(0x8e3005), brightBeer=new T.Color(0xfbb830);
    for(let i=0;i<levels.count;i++){
      const depth=T.MathUtils.clamp(levels.getY(i)/(h*.62)+.5,0,1);
      shade.copy(darkBeer).lerp(brightBeer,depth**1.5);tint.push(shade.r,shade.g,shade.b);
    }
    liquid.setAttribute('color',new T.Float32BufferAttribute(tint,3));amber.vertexColors=true;
    this.drink=mesh(this.pint,liquid,amber,0,h*.33,0);
    const froth=material(0xffe2b0,0,.92);froth.map=grainTexture([255,242,190]);
    const foam=mesh(this.pint,new T.CylinderGeometry(.865,.855,.014,40),froth,0,h*.65,0);
    this.foam=foam;this.foamBase=foam.position.y;
    this.gearMat=material(0x19191c,.31,.72);this.grille=material(0x454144,.72,.56);
    this.gear=new T.Group();this.props.add(this.gear);this.level=-1;
    this.ball=tennisBall();this.hand=throwingHand();this.scene.add(this.ball,this.hand);
    // The lost-property flight case opens after a miss, revealing where the rest went.
    const lost=new T.Group();lost.position.set(-1.87,.01,-.78);this.props.add(lost);
    box(lost,caseMat,0,.12,0,.64,.24,.36);
    const lostLabel=sign('LOST PROPERTY','#e4dfba','#24251f',.51,.11);
    lostLabel.position.set(0,.13,.186);lost.add(lostLabel);
    this.lostLid=new T.Group();this.lostLid.position.set(0,.26,-.18);lost.add(this.lostLid);
    box(this.lostLid,caseMat,0,0,.18,.65,.045,.37);
    const spare=new T.InstancedMesh(new T.SphereGeometry(.073,14,10),this.ball.children[0].material,7);
    const transform=new T.Matrix4();
    for(let i=0;i<7;i++) {
      transform.makeTranslation((i%4-1.5)*.145,.215+(i>3?.014:0),i>3?-.075:.06);
      spare.setMatrixAt(i,transform);
    }
    lost.add(spare);
    this.bob=this.ball.clone();this.bob.scale.setScalar(.89);this.scene.add(this.bob);
    this.dots=new T.InstancedMesh(new T.SphereGeometry(.02,8,6),new T.MeshBasicMaterial({color:0xfaffaa}),24);
    this.dots.frustumCulled=false;this.dots.count=0;this.scene.add(this.dots);
    // Keep the last missed approach in world space, so the next drag can be compared against it.
    this.missedArc=new T.InstancedMesh(new T.RingGeometry(.022,.032,12),
      new T.MeshBasicMaterial({color:0xa3d9e8,transparent:true,opacity:.57,depthWrite:false}),22);
    this.missedArc.frustumCulled=false;this.missedArc.count=0;this.scene.add(this.missedArc);
    this.flightSamples=new Float32Array(44);this.sampleCount=0;this.recordApproach=false;
    this.trail=new T.InstancedMesh(new T.SphereGeometry(.02,6,4),new T.MeshBasicMaterial({color:0xe2ee82,transparent:true,opacity:.35}),8);
    this.trail.frustumCulled=false;this.trail.count=0;this.scene.add(this.trail);
    this.path=new Float32Array(16);this.pathCount=0;this.dummy=new T.Object3D();
    this.previewPoints=Array.from({length:18},()=>({x:0,y:0}));
    this.aiming=false;this.aimAngle=60;this.aimPower=70;this.lastSurge=NaN;
    this.splash=new T.InstancedMesh(new T.SphereGeometry(.017,6,4),material(0xffd792,.36,.22),18);
    this.splash.frustumCulled=false;this.splash.count=0;this.scene.add(this.splash);
    this.reaction='idle';this.reactTime=0;this.ripple=0;this.entryX=0;this.clock=0;this.mode='auto';this.autoTier=1;
    this.cameraAccent=0;this.handRecoil=0;
    this.setTier(1);this.resize();
    this.frameSamples=[];this.benchmark=0;this.slow=0;this.fast=0;this.age=0;
  }
  setTier(index) {
    this.tier=index;
    const r=this.renderer; r.setPixelRatio(Math.min(2,devicePixelRatio,scales[index]));
    r.shadowMap.enabled=index>0;
    this.scene.traverse(o=>{
      if (o.isDirectionalLight || o.isSpotLight) {
        if (o.castShadow && shadows[index] && o.shadow.mapSize.x!==shadows[index]) {
          o.shadow.map?.dispose();o.shadow.map=null;o.shadow.mapSize.setScalar(shadows[index]);
        }
      }
    });
    r.shadowMap.needsUpdate=true;this.resize();
  }
  settings(settings) {
    this.needsDraw=true;
    this.mode=settings.quality;this.reduced=settings.reduced;this.battery=settings.battery;
    const tier=this.mode==='auto'?this.autoTier:tiers.indexOf(this.mode);
    if (tier!==this.tier && tier>=0) this.setTier(tier);
  }
  observe(dt) {
    if(this.mode!=='auto'||dt<=0||dt>.5)return;
    this.frameSamples.push(dt);
    if(this.frameSamples.length<35)return;
    const ordered=this.frameSamples.sort((a,b)=>a-b), frame=ordered[Math.floor(ordered.length*.75)];
    this.frameSamples=[];const target=this.battery?1/30:1/60;
    if(!this.benchmark) {
      this.benchmark=1;this.autoTier=frame<=.018 && this.gpuMs<12?2:frame<.030&&this.gpuMs<24?1:0;
    } else {
      this.slow=frame>target*1.34 || this.gpuMs>target*1000*.94?this.slow+1:0;
      this.fast=frame<target*1.09 && this.gpuMs<target*1000*.70?this.fast+1:0;
      if(this.slow>=2){this.autoTier=Math.max(0,this.autoTier-1);this.slow=0;this.fast=0;}
      if(this.fast>=16){this.autoTier=Math.min(3,this.autoTier+1);this.fast=0;}
    }
    if(this.tier!==this.autoTier)this.setTier(this.autoTier);
  }
  resize() {
    this.needsDraw=true;
    const w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight);
    this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
  }
  levelProps() {
    const s=this.sim;this.level=s.levelIndex;this.pint.scale.set(s.glass.radius,1,s.glass.radius);
    this.gear.clear();
    for(const g of s.gear) {
      const d=.50;
      box(this.gear,this.gearMat,g.x,g.y,0,g.width,g.height,d);
      box(this.gear,this.grille,g.x,g.y,d*.51,g.width*.91,g.height*.8,.013);
      for(let i=1;i<7;i++)box(this.gear,this.gearMat,g.x,g.y-g.height*.37+i*g.height*.105,d*.53,g.width*.87,.009,.012);
    }
    this.bob.visible=false;
  }
  aim(angle,power) {
    const surge=this.sim.surge.amount*this.sim.surge.direction;
    if(this.aiming && angle===this.aimAngle && power===this.aimPower && surge===this.lastSurge)return;
    this.aiming=true;this.aimAngle=angle;this.aimPower=power;this.lastSurge=surge;
    const points=this.sim.preview(angle,power,18,this.previewPoints);
    this.dots.count=Math.min(24,points.length);
    for(let i=0;i<this.dots.count;i++) {
      this.dummy.position.set(points[i].x,points[i].y,.025);
      this.dummy.scale.setScalar(1.1-i*.033);this.dummy.updateMatrix();this.dots.setMatrixAt(i,this.dummy.matrix);
    }
    this.dots.instanceMatrix.needsUpdate=true;
  }
  cancelAim(){this.aiming=false;this.dots.count=0;}
  event(type) {
    if(type==='level'){
      this.level=-1;this.missedArc.count=0;this.ripple=0;this.reactTime=0;this.cameraAccent=0;
    }
    if(type==='launch'){
      this.cancelAim();this.pathCount=0;this.sampleCount=0;this.recordApproach=true;
      this.handRecoil=1;
    }
    if(type==='bank'||type==='rim'||type==='singer')this.recordApproach=false;
    if(type==='miss'){
      this.missedArc.count=this.sampleCount;
      for(let i=0;i<this.sampleCount;i++){
        this.dummy.position.set(this.flightSamples[2*i],this.flightSamples[2*i+1],-.016);
        this.dummy.scale.setScalar(.85);this.dummy.updateMatrix();this.missedArc.setMatrixAt(i,this.dummy.matrix);
      }
      this.missedArc.instanceMatrix.needsUpdate=true;
    }
    if(type==='make'||type==='miss'||type==='rim'||type==='singer'){
      this.reaction=type;this.reactTime=type==='rim'?.30:.8;
    }
    if(type==='make'){
      this.ripple=.7;this.bob.visible=true;this.entryX=this.sim.ball.x;
      this.missedArc.count=0;
    }
  }
  draw(dt,songTime) {
    const s=this.sim, paused=s.phase==='paused';
    if(paused && this.lastPhase==='paused' && !this.needsDraw)return;
    this.lastPhase=s.phase;this.needsDraw=false;
    if(this.level!==s.levelIndex)this.levelProps();
    if(!paused){
      this.clock+=dt;this.reactTime=Math.max(0,this.reactTime-dt);this.ripple=Math.max(0,this.ripple-dt);
      this.handRecoil=Math.max(0,this.handRecoil-dt*3.5);
      const accent=!this.reduced && !this.sim.ball.active && this.ripple>.18 ? 1 : 0;
      this.cameraAccent=T.MathUtils.damp(this.cameraAccent,accent,accent?10:8,dt);
    }
    const time=this.clock, menu=s.phase==='title', aspect=this.camera.aspect;
    const wide=aspect>1.05;
    const drift=menu && !this.reduced?Math.sin(time*.24)*.075:0;
    const intro=menu&&!this.reduced?Math.max(0,1-time/2.65)**2:0;
    const centerX=menu?(wide?-1.56:.02)+drift+.47*intro:-.04;
    const centerY=menu?(wide?1.37:1.49):1.65;
    const visibleHeight=menu?Math.max(wide?3.03:3.5,(wide?5.05:3.62)/aspect):
      Math.max(wide?4.3:4.25,(wide?6.2:s.levelIndex<2?4.52:5.45)/aspect);
    const dist=visibleHeight/(2*Math.tan(T.MathUtils.degToRad(this.camera.fov/2)))*(1-.12*intro);
    const punch=!menu&&!this.reduced?this.cameraAccent:0;
    this.camera.position.set(centerX+.42+punch*.20,centerY+dist*.15,dist*(1-punch*.115));
    this.camera.lookAt(centerX+punch*.27,centerY-punch*.04,0);
    const reaction=this.reactTime>0?this.reaction:'idle';
    this.venue.update(paused?0:dt,time,s.singer.x,reaction,tiers[this.tier],s.singer.y,s.phase,s.surge,menu?time:songTime,s.levelIndex,s.singer);
    if(!paused)this.lostLid.rotation.x=T.MathUtils.damp(this.lostLid.rotation.x,reaction==='miss'?-1.82:0,8,dt);
    this.ball.visible=!menu && (s.phase==='ready'||s.phase==='flight'||paused);
    const active=s.ball.active;
    this.hand.visible=this.ball.visible;
    const handTarget=this.reduced?0:this.handRecoil*.78-(this.aiming ? .22*this.aimPower/100 : 0);
    if(!paused)this.hand.rotation.z+=(handTarget-this.hand.rotation.z)*Math.min(1,dt*14);
    this.ball.position.set(active?s.ball.x:ORIGIN.x,active?s.ball.y:ORIGIN.y,0);
    if(!paused)this.ball.rotation.z-=dt*(active?7:.4);
    if(active && this.recordApproach && this.sampleCount<22 && s.ball.age>=this.sampleCount*.055){
      const i=this.sampleCount++*2;this.flightSamples[i]=s.ball.x;this.flightSamples[i+1]=s.ball.y;
    }
    this.dots.visible=s.phase==='ready' && !!this.aiming;
    this.missedArc.visible=this.dots.visible;
    if(this.dots.visible)this.aim(this.aimAngle,this.aimPower);
    if(active && !paused) {
      this.path.copyWithin(2,0,14);
      this.path[0]=s.ball.x;this.path[1]=s.ball.y;this.pathCount=Math.min(8,this.pathCount+1);
    }
    this.trail.count=active&&!this.reduced&&this.tier>0?this.pathCount:0;
    for(let i=0;i<this.trail.count;i++){
      this.dummy.position.set(this.path[i*2],this.path[i*2+1],0);this.dummy.scale.setScalar((8-i)*.18);this.dummy.updateMatrix();
      this.trail.setMatrixAt(i,this.dummy.matrix);
    }
    if(this.trail.count)this.trail.instanceMatrix.needsUpdate=true;
    const lift=s.levelIndex>=4 && s.phase==='settling' && s.lastShot?.made?
      .14*Math.sin(Math.PI*Math.min(1,Math.max(0,(s.until-s.time)/.62))):0;
    this.pint.position.y=s.glass.bottom+lift;
    const age=.7-this.ripple;
    const entry=Math.min(1,age/.13),surface=this.foamBase+this.pint.position.y+.042;
    const bounce=entry===1?Math.sin((age-.13)*24)*Math.exp(-Math.max(0,age-.13)*7)*this.ripple*.044:0;
    const lateral=Math.min(1,age*2.6);
    this.bob.position.set(T.MathUtils.lerp(this.entryX,s.glass.x+.01,lateral),
      T.MathUtils.lerp(s.glass.y,surface,entry)+bounce+Math.sin(time*5)*.003,.005);
    const slosh=this.ripple*Math.sin(age*29);
    this.foam.rotation.z=slosh*.055;this.foam.position.y=this.foamBase+slosh*.019;
    this.splash.count=this.ripple>0&&!this.reduced?18:0;
    for(let i=0;i<this.splash.count;i++){
      const a=i*2.4,v=.3+(i%4)*.16;
      this.dummy.position.set(s.glass.x+Math.cos(a)*age*v,s.glass.y+age*(1.4+i%3*.26)-3.9*age*age,Math.sin(a)*age*v);
      this.dummy.scale.setScalar(this.ripple);this.dummy.updateMatrix();this.splash.setMatrixAt(i,this.dummy.matrix);
    }
    if(this.splash.count)this.splash.instanceMatrix.needsUpdate=true;
    const gl=this.gpu,ext=this.timer;
    if(ext && this.query && gl.getQueryParameter(this.query,gl.QUERY_RESULT_AVAILABLE)){
      if(!gl.getParameter(ext.GPU_DISJOINT_EXT))this.gpuMs=gl.getQueryParameter(this.query,gl.QUERY_RESULT)/1e6;
      gl.deleteQuery(this.query);this.query=null;
    }
    const measure=ext && !this.query && (++this.renderCount%12===1);
    if(measure){this.query=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,this.query);}
    this.lens.render(this.scene,this.camera,{enabled:this.tier>=2&&!this.battery&&!this.reduced,
      opening:menu?1:0,focus:dist+intro*1.9,strength:this.tier===3?1:.65});
    if(measure)gl.endQuery(ext.TIME_ELAPSED_EXT);
  }
}
