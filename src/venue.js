import * as T from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneRig } from 'three/addons/utils/SkeletonUtils.js';
import { bake, box, cable, chrome, drumKit, fitBody, group, label, mesh, musician, oval, pbr, shaft, xyz } from './venue-models.js';

const folder = import.meta.env.BASE_URL + 'venue/';
const dark = pbr(0x201c21, .86);
const iron = pbr(0x34333b, .42, .75);
const bronze = pbr(0x9f7351, .51, .64);
const crimson = pbr(0x662139, .90);
const canvas = pbr(0x17151b,.9);
const black = pbr(0x14161a,.72);
const tau = Math.PI * 2;

function contactShadow(parent,x,z,w,d) {
  // A baked contact term grounds feet and stands even on Low without a shadow atlas.
  const surface=document.createElement('canvas');
  surface.width=surface.height=64;
  const ctx=surface.getContext('2d');
  const gradient=ctx.createRadialGradient(32,32,0,32,32,31);
  gradient.addColorStop(0,'rgba(12,8,11,.92)');
  gradient.addColorStop(.38,'rgba(12,8,11,.68)');
  gradient.addColorStop(1,'rgba(12,8,11,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const map=new T.CanvasTexture(surface);
  const shadow=mesh(parent,new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false}),x,-.014,z);
  shadow.rotation.x=-Math.PI/2;
  shadow.castShadow=shadow.receiveShadow=false;
  return shadow;
}

function velvet(parent, x, y, z, w, h, drawn = 0) {
  const geom = new T.PlaneGeometry(w,h,Math.round(w*20),20);
  const p = geom.attributes.position;
  for (let i=0;i<p.count;i++) {
    const u=p.getX(i)/w+.5, v=p.getY(i)/h+.5;
    const phase = u * w * 11.5 + Math.sin(v*3.25)*drawn*1.4;
    const hem = .035*Math.cos(phase) * (1-v);
    p.setXYZ(i,p.getX(i) + drawn * Math.sin(Math.PI*v)*.53,p.getY(i)+hem,.20*Math.sin(phase)+.025*Math.sin(phase*2));
  }
  geom.computeVertexNormals();
  return mesh(parent,geom,crimson,x,y,z);
}

function glowMap() {
  const surface=document.createElement('canvas');surface.width=surface.height=128;
  const ctx=surface.getContext('2d'),light=ctx.createRadialGradient(64,64,0,64,64,63);
  light.addColorStop(0,'rgba(255,255,248,1)');
  light.addColorStop(.055,'rgba(255,249,229,.99)');
  light.addColorStop(.17,'rgba(255,236,207,.36)');
  light.addColorStop(.40,'rgba(255,219,186,.085)');
  light.addColorStop(1,'rgba(255,203,173,0)');
  ctx.fillStyle=light;ctx.fillRect(0,0,128,128);
  const map=new T.CanvasTexture(surface);map.colorSpace=T.SRGBColorSpace;
  return map;
}

function cabinet(parent,x,y,z,w,h) {
  box(parent,x,y+h/2,z,w,h,.46,black);
  box(parent,x,y+h/2,z+.237,w*.92,h*.90,.015,iron);
  for (const sign of [-1,1]) {
    for (const yy of [.075,h-.075]) box(parent,x+sign*(w/2-.052),y+yy,z+.235,.065,.09,.024,chrome);
    for (const dy of [.28,.72]) {
      const d=mesh(parent,new T.CylinderGeometry(w*.19,w*.19,.025,24),dark,x+sign*w*.21,y+h*dy,z+.255);
      d.rotation.x=Math.PI/2;
      oval(parent,x+sign*w*.21,y+h*dy,z+.272,w*.067,w*.067,.014,black);
    }
  }
  for(let n=0;n<15;n++) box(parent,x,y+.07+n*(h-.14)/14,z+.281,w*.88,.009,.008,iron);
}

function theatre(scene) {
  const stage = group(scene), set = group(stage);
  const floorMat = new T.MeshPhysicalMaterial({color:0xb49e83,roughness:.94,metalness:0,specularIntensity:.12});
  const deck = mesh(set,new T.PlaneGeometry(17,9),floorMat,0,-.018,-2.32);
  deck.rotation.x=-Math.PI/2;
  box(set,0,-.38,1.94,17,.72,.2,dark);
  box(set,0,-.048,2.04,17,.055,.045,bronze);
  box(set,0,-.18,2.048,17,.026,.035,iron);
  const pit=new T.MeshBasicMaterial({color:0x0f0d10});
  box(set,0,-.87,10,24,.22,16,pit);
  box(set,0,-.59,2.081,18,.42,.05,pit);
  box(set,0,3.7,-5.62,18,9,.12,canvas);
  velvet(set,0,3.9,-5.39,16.8,8.7,.04);
  // Art deco proscenium, with a fluted radial shell at the centre.
  const archX=-.5, archY=2.19;
  for(const r of [1.07,1.12,1.84,2.48,3.10]){
    const arch=mesh(set,new T.TorusGeometry(r,.016,6,76,Math.PI),bronze,archX,archY,-5.04);
    arch.castShadow=false;
  }
  const houseBulb=new T.MeshStandardMaterial({color:0xffcc85,emissive:0xf4a259,emissiveIntensity:.82,roughness:.28});
  for(let n=0;n<=26;n++){
    const a=Math.PI*n/26;
    oval(set,archX+Math.cos(a)*2.48,archY+Math.sin(a)*2.48,-5.006,.025,.025,.019,houseBulb);
  }
  for(let i=1;i<16;i++){
    const a=Math.PI*i/16;
    shaft(set,[archX+Math.cos(a)*1.13,archY+Math.sin(a)*1.13,-5.045],[archX+Math.cos(a)*3.09,archY+Math.sin(a)*3.09,-5.045],.0075,bronze);
  }
  label(set,'BALLROOM',2.25,.31,[archX,2.16,-4.984],'#b28555');
  // Panelled side walls and velvet wings with real folds.
  for(const sign of [-1,1]){
    velvet(set,sign*4.33,3.02,-3.94,3.3,6.32,sign);
    velvet(set,sign*6.72,3,-2.8,1.75,6.6,sign);
    for(let p=0;p<3;p++) box(set,sign*(3.12+p*.1),3.35,-4.99,.029,6.8,.092,bronze);
    box(set,sign*5.8,3.43,-4.9,.42,7,.28,dark);
    cabinet(set,sign*2.64,0,-2.62,.93,1.42);
    cabinet(set,sign*2.62,1.43,-2.66,.9,.38);
  }
  const riserMat=pbr(0x322d2b,.72);
  box(set,1.08,.061,-1.9,2.28,.13,1.48,riserMat);
  box(set,1.08,.115,-1.15,2.29,.023,.033,chrome);
  for(let n=0;n<6;n++){
    const a=n*.86;
    cable(set,[[-3.5+a,.008,-1.8],[-3.07+a*.45,.012,-.7],[-2.89+a,.013,.33],[-3.7+a*.65,.012,1.58]],.0055,black);
  }
  const tape=pbr(0xb7ad93,.98);
  for(const [x,z,angle] of [[-2.04,.65,.18],[-1.29,-.62,-.21],[.65,-.89,.06],[-2.67,1.02,-.25],[2.41,-1.1,-.24]]) {
    box(set,x,-.010,z,.22,.006,.063,tape).rotation.y=angle;
  }
  // Front of house rig, X-braced flight truss, and suspended par cans.
  for(const z of [-3.36,.35]){
    for(const y of [4.4,4.68]) shaft(set,[-8,y,z],[8,y,z],.036,iron);
    for(let i=0;i<24;i++){
      const x=-8+i*.67;
      shaft(set,[x,4.4,z],[x+.33,4.68,z],.017,iron);
      shaft(set,[x+.33,4.68,z],[x+.66,4.4,z],.017,iron);
    }
  }
  const fixtures=[
    {a:[-3.55,4.29,-2.13],b:[-.57,-.03,-.03],color:0xffa259},
    {a:[-1.89,4.28,-3.30],b:[-.94,-.03,-1.45],color:0xfb814b},
    {a:[.23,4.28,-3.3],b:[1.18,-.03,-1.84],color:0xffdfa6},
    {a:[2.21,4.28,-3.32],b:[.69,-.03,-1.33],color:0x68bff3},
    {a:[3.52,4.26,-2.11],b:[1.45,-.03,-.24],color:0xb9a0f2}
  ];
  const haze = group(stage), mists = [],bloom=glowMap();
  function lightBloom(position, colour, size){
    const glow=new T.Sprite(new T.SpriteMaterial({map:bloom,color:colour,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));
    glow.position.copy(position);glow.scale.set(size,size,1);haze.add(glow);
  }
  for(const {a,b,color} of fixtures) {
    const direction=xyz(...b).sub(xyz(...a)).normalize();
    const lens=xyz(...a).addScaledVector(direction,.27);
    shaft(set,a,lens.toArray(),.126,iron,.149,18);
    shaft(set,lens.toArray(),lens.clone().addScaledVector(direction,.011).toArray(),.125,new T.MeshBasicMaterial({color}),.125,20);
    lightBloom(lens.clone().addScaledVector(direction,.115),color,1.38);
    const distance=xyz(...b).distanceTo(lens);
    const geom=new T.CylinderGeometry(.081,.68,distance,20,1,true);
    const mat=new T.ShaderMaterial({
      uniforms:{tint:{value:new T.Color(color)}},
      transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
      vertexShader:'varying vec2 beamUV; varying vec3 N; varying vec3 V; void main(){beamUV=uv; vec4 mv=modelViewMatrix*vec4(position,1.); V=normalize(-mv.xyz);N=normalize(normalMatrix*normal);gl_Position=projectionMatrix*mv;}',
      fragmentShader:'varying vec2 beamUV;varying vec3 N;varying vec3 V;uniform vec3 tint; void main(){float edge=abs(dot(normalize(N),normalize(V))); float strength=mix(.002,.064,pow(beamUV.y,1.6))*smoothstep(.09,.65,edge);gl_FragColor=vec4(tint,strength);}'
    });
    const cone=mesh(haze,geom,mat,...lens.clone().addScaledVector(direction,distance*.5).toArray());
    cone.quaternion.setFromUnitVectors(xyz(0,-1,0),direction);
    cone.castShadow=cone.receiveShadow=false;
    cone.renderOrder=1;
    mists.push(cone);
  }
  const lamp=new T.MeshBasicMaterial({color:0xffcc89,toneMapped:false});
  for(const sign of [-1,1]) {
    const location=sign<0?-1.86:2.60;
    box(set,location,1.14,-3.81,.81,.28,.22,black);
    for(let n=-1;n<=1;n++){
      const lampPos=xyz(location+n*.238,1.14,-3.68);
      oval(set,...lampPos.toArray(),.073,.073,.024,lamp);
      lightBloom(lampPos.add(xyz(0,0,.029)),0xffad66,.68);
    }
  }
  bake(set);
  return {stage,floorMat,haze,mists};
}

function houseLights(scene) {
  scene.background=new T.Color(0x110d11);
  scene.fog=new T.FogExp2(0x20151b,.021);
  const house = new T.HemisphereLight(0xf1d4b5,0x61364f,.42);
  scene.add(house);
  const key = new T.DirectionalLight(0xffd1a5,1.48);
  key.position.set(-3.4,5.12,3.81);
  key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{left:-4.4,right:4.4,top:3.7,bottom:-2.6,near:.1,far:13});
  key.shadow.normalBias=.016;
  key.shadow.bias=-.00017;
  scene.add(key);
  const rim = new T.DirectionalLight(0xff7849,1.79);
  rim.position.set(-2,3.1,-3.34);
  scene.add(rim);
  const cool = new T.DirectionalLight(0x68baf0,1.1);
  cool.position.set(2.4,2.4,-1.6);
  scene.add(cool);
  const amber = new T.PointLight(0xff7735,8,6);
  amber.position.set(-2.5,1.15,-3.62);
  scene.add(amber);
  const blue=new T.PointLight(0x70a3ee,18,5.9);
  blue.position.set(2.15,2.1,-4.0);scene.add(blue);
  const pool=new T.SpotLight(0xffcc99,35,9,.44,.85,2);
  pool.position.set(-1.85,3.72,2.22);
  pool.target.position.set(-.74,.39,0);
  scene.add(pool,pool.target);
  return {house,cool};
}

function crowd(parent) {
  const root=group(parent);
  const rows=Array.from({length:4},()=>group(root)),hands=[];
  const shadow=new T.MeshBasicMaterial({color:0x19131b}), rim=new T.MeshBasicMaterial({color:0x30202d});
  const wristbands=new T.MeshBasicMaterial({color:0xba6d54});
  for(let i=0;i<27;i++){
    const x=(i%14-6.5)*.57 + (i>=14?.23:0), front=i>=14;
    const z=(front?4.5:3.46)+.18*Math.sin(i*4.2), y=(front?-.60:-.62) + .1*Math.cos(i*1.9);
    const mat=i%3===0?rim:shadow;
    const wig=i%4===0?.05:0;
    const shape=new T.Shape();
    shape.moveTo(-.38,-1.62);
    shape.lineTo(-.33,-.4);
    shape.quadraticCurveTo(-.32,-.075,-.25,-.046);
    shape.quadraticCurveTo(-.089,.013,-.089,.047);
    shape.quadraticCurveTo(-.14-wig,.127,-.126-wig,.248);
    shape.quadraticCurveTo(-.153,.427,-.02,.416);
    shape.quadraticCurveTo(.143,.432,.144,.269);
    shape.quadraticCurveTo(.159,.107,.088,.039);
    shape.quadraticCurveTo(.098,-.007,.236,-.043);
    shape.quadraticCurveTo(.327,-.077,.35,-.4);
    shape.lineTo(.37,-1.62);
    shape.closePath();
    const row=rows[i%4];
    const person=mesh(row,new T.ShapeGeometry(shape,9),mat,x,y,z);
    person.rotation.z=.09*Math.sin(i*4);
    person.scale.setScalar(.9+(i%4)*.07);
    if(i%4===2){
      const hand=group(root,x+.16,y-.07,z),s=i%8===2?1:-1;
      shaft(hand,[0,0,0],[s*.17,.22,-.05],.061,mat,.045);
      shaft(hand,[s*.17,.22,-.05],[s*.15,.53,-.09],.049,mat,.028);
      shaft(hand,[s*.153,.46,-.08],[s*.151,.483,-.083],.038,wristbands,.035);
      oval(hand,s*.149,.55,-.092,.049,.069,.032,mat);
      for(const f of [-1,1])shaft(hand,[s*.15+f*.024,.583,-.094],[s*.15+f*.040,.658,-.099],.013,mat,.007);
      bake(hand);hands.push({hand,s});
    }
  }
  for(const row of rows)bake(row);
  return {root,respond(t,surge,joy,tension,miss){
    root.rotation.z=Math.sin(t*2.45)*(surge.warning?.025:.009);
    root.position.x=(surge.direction||0)*(surge.amount||0)*.21;
    for(let i=0;i<rows.length;i++) {
      const bob=Math.sin(t*3.22+i*.68);
      rows[i].position.y=.015*bob+(joy*(.19+.10*bob)) + tension*.072-miss*.073;
    }
    for(let i=0;i<hands.length;i++){
      const {hand,s}=hands[i];
      hand.rotation.z=s*(1.07+.09*Math.sin(t*3.3+i)-.99*joy-.33*tension+.13*miss);
    }
  }};
}

export function buildVenue(scene,renderer) {
  const {house,cool}=houseLights(scene);
  const {stage,floorMat,mists}=theatre(scene);
  const audience=crowd(stage);
  const lead=musician(stage,'lead'), bass=musician(stage,'bass'), drums=musician(stage,'drums');
  bass.root.position.set(-1.89,.015,-1.32);
  bass.root.rotation.y=.23;
  bass.root.scale.set(.99,.92,.99);
  drums.root.position.set(1.06,-.28,-2.31);
  drums.root.scale.set(1.11,1.03,1.06);
  const cymbals=drumKit(stage);
  const leadShadow=contactShadow(stage,0,0,1.12,.64);
  contactShadow(stage,-1.89,-1.31,1.15,.7);
  contactShadow(stage,1.25,.02,1.60,1.12);
  contactShadow(stage,-2.64,-2.6,1.35,.95);
  contactShadow(stage,2.64,-2.6,1.35,.95);
  const micLead=cable(stage,[[-.49,1.746,.176],[-.34,.89,.23],[-.32,.038,.19],[-.87,.013,.65],[-1.45,.012,.40],[-2.04,.012,-.41]],.006,black,35);
  const cord=micLead.geometry.attributes.position,spin=micLead.geometry.attributes.uv;
  const rest=cord.array.slice();
  cord.setUsage(T.DynamicDrawUsage);micLead.frustumCulled=false;
  const manager = T.DefaultLoadingManager;
  const ktx = new KTX2Loader(manager).setTranscoderPath(folder+'basis/').setWorkerLimit(1);
  if(renderer) ktx.detectSupport(renderer);
  const gltf = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
  const loading={
    env:new HDRLoader(manager).loadAsync(folder+'studio_small_03_1k.hdr'),
    face:gltf.loadAsync(folder+'face.glb'),
    body:gltf.loadAsync(folder+'performer.glb')
  };
  if(renderer) for(const name of ['face-colour','face-normal','deck-colour','deck-normal','deck-arm']) loading[name]=ktx.loadAsync(folder+name+'.ktx2');
  const ready=Promise.all(Object.values(loading)).then(values=>{
    const a=Object.fromEntries(Object.keys(loading).map((name,i)=>[name,values[i]]));
    a.env.mapping=T.EquirectangularReflectionMapping;
    scene.environment=a.env;
    scene.environmentIntensity=.24;
    const faceMat=new T.MeshPhysicalMaterial({color:0xffe3c7,roughness:.71,specularIntensity:.23});
    if(renderer){
      for(const name of ['face-colour','deck-colour']) a[name].colorSpace=T.SRGBColorSpace;
      for(const name of ['face-colour','face-normal']){
        // The original scan uses the vertically flipped image convention.
        a[name].repeat.set(1,-1);
        a[name].offset.set(0,1);
      }
      for(const name of ['deck-colour','deck-normal','deck-arm']){
        a[name].wrapS=a[name].wrapT=T.RepeatWrapping;
        a[name].repeat.set(8,4.2);
        a[name].anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      }
      Object.assign(floorMat,{map:a['deck-colour'],normalMap:a['deck-normal'],roughnessMap:a['deck-arm'],aoMap:a['deck-arm']});
      floorMat.normalScale.set(.53,.53);
      floorMat.needsUpdate=true;
      faceMat.map=a['face-colour'];
      faceMat.normalMap=a['face-normal'];
      faceMat.normalScale.set(.17,.17);
    }
    for(const actor of [lead,bass,drums]){
      fitBody(actor,cloneRig(a.body.scene));
      const model=a.face.scene.clone(true);
      const portrait=faceMat.clone();
      const skin=actor.role==='lead'?'vec3(.48,.214,.122)':actor.role==='bass'?'vec3(.281,.111,.067)':'vec3(.40,.18,.104)';
      portrait.onBeforeCompile=program=>{
        program.fragmentShader=program.fragmentShader.replace('#include <map_fragment>',
          '#include <map_fragment>\ndiffuseColor.rgb=mix('+skin+',diffuseColor.rgb,.38);');
      };
      portrait.customProgramCacheKey=()=>actor.role;
      model.traverse(node=>{if(node.isMesh){node.material=portrait;node.castShadow=true;node.receiveShadow=true;}});
      actor.head.add(model);
      model.scale.set(.058,.06,.057);
    }
    ktx.dispose();
  });
  let lastX=0, gait=0, lean=0, reactionAmount=0,joy=0,tension=0,miss=0;
  return {
    ready,
    update(dt,t,singerX,reaction,quality,singerY=0,phase='ready',surge={},musicTime=t,levelIndex=0,singer={}) {
      const dx=dt>0?(singerX-lastX)/dt:0;
      gait+=Math.min(3,Math.abs(dx))*dt*5.5;
      lastX=singerX;
      const walk=Math.min(1,Math.abs(dx)*1.6);
      lean=T.MathUtils.damp(lean,Math.min(.49,Math.max(-.49,dx*.46)),5.5,dt);
      const menu=phase==='title';
      reactionAmount=T.MathUtils.damp(reactionAmount,reaction==='idle'?0:1,7,dt);
      joy=T.MathUtils.damp(joy,reaction==='make'||phase==='victory'?1:0,reaction==='make'?9:4.8,dt);
      tension=T.MathUtils.damp(tension,reaction==='rim'?1:0,reaction==='rim'?14:5,dt);
      miss=T.MathUtils.damp(miss,reaction==='miss'?1:0,reaction==='miss'?9:5,dt);
      const crouch=singer.crouch||0,winding=singer.action==='anticipate';
      const windLean=(singer.direction||1)*(winding?.14:crouch*.08);
      lead.root.position.set(singerX,singerY+.014+.018*Math.abs(Math.sin(gait))*walk,0);
      lead.root.scale.y=1-.16*crouch-.056*tension;
      leadShadow.position.x=singerX;
      lead.root.rotation.y=lean+.09*Math.sin(t*.52);
      lead.torso.rotation.z=.046*Math.sin(gait)-.028+.11*joy-.095*miss+windLean;
      lead.torso.rotation.x=.045*tension+.09*miss;
      lead.head.rotation.set(-.05+.055*Math.cos(t*3.08)-.095*joy+.14*miss,.13*Math.sin(t*1.41)+reactionAmount*.26, .055*Math.sin(t)-.17*miss);
      lead.legs[0].rotation.x=.36*Math.sin(gait)*walk;
      lead.legs[1].rotation.x=-.36*Math.sin(gait)*walk;
      lead.arms[0].rotation.x=-.05-.18*Math.sin(gait)*walk-.12*Math.cos(t*2.8);
      lead.arms[1].rotation.x=-.1+.084*Math.sin(t*2.8);
      lead.arms[0].rotation.z=.06*Math.sin(t*2.8)-2.27*joy-.65*tension-.41*miss-reactionAmount*(reaction==='singer'?.87:0);
      lead.arms[1].rotation.z=.24*miss+.17*tension;
      for(let i=0;i<cord.count;i++){
        const u=spin.getX(i),w=1-T.MathUtils.smoothstep(u,.06,.89);
        cord.setX(i,rest[i*3]+(singerX+.6)*w+.022*Math.sin(t*3-u*5)*Math.sin(Math.PI*u));
        cord.setY(i,rest[i*3+1]+singerY*Math.max(0,1-u*2.6));
      }
      cord.needsUpdate=true;
      bass.torso.rotation.z=.055*Math.sin(t*3.66-.27)+.11*joy-.064*miss;
      bass.head.rotation.set(.13+.064*Math.sin(t*3.66)-.13*joy+.12*miss,.15+reactionAmount*.35,.04+.17*miss);
      bass.arms[0].rotation.x=.14*Math.sin(t*7.33);
      bass.arms[1].rotation.z=.06*Math.sin(Math.floor(t*1.84)*.9);
      const beat=musicTime*tau/(2*60/114);
      const playing=1-.93*tension;
      drums.arms[0].rotation.x=(.34-.74*Math.cos(beat))*playing-1.43*joy-.33*tension;
      drums.arms[1].rotation.x=(.34+.68*Math.cos(beat*2))*playing-1.38*joy-.33*tension-.66*miss;
      drums.arms[0].rotation.z=-.97*joy-.54*miss;
      drums.arms[1].rotation.z=.97*joy+.47*miss;
      drums.head.rotation.set(.045+Math.sin(beat)*.049-.12*joy+.21*miss,-.15+reactionAmount*.39,Math.sin(beat*.5)*.024-.13*miss);
      drums.torso.rotation.z=Math.sin(beat*.5)*.038-.10*tension;
      for(let n=0;n<cymbals.length;n++) cymbals[n].rotation.z=.06*Math.sin(beat*3+n)*Math.pow(Math.max(0,Math.sin(beat+n)),3)*playing;
      audience.respond(t,surge,joy,tension,miss);
      house.intensity=phase==='victory'?.97:.42+joy*.19;
      cool.intensity=1.10+levelIndex*.05+.25*tension;
      lead.expression(t,joy,tension,miss);bass.expression(t,joy,tension,miss);drums.expression(t,joy,tension,miss);
      lead.animateBody?.();bass.animateBody?.();drums.animateBody?.();
      for(let n=0;n<mists.length;n++) mists[n].visible=quality!=='low' || n===0 || n===3;
      if(menu)lead.head.rotation.y-=.05;
    }
  };
}
