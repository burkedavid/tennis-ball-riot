import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const pbr = (color, roughness = .65, metalness = 0) => new T.MeshStandardMaterial({ color, metalness, roughness });
const cuboid = new T.BoxGeometry(1, 1, 1);
const sphere = new T.SphereGeometry(1, 16, 12);
const up = new T.Vector3(0, 1, 0);
export const xyz = (x, y, z) => new T.Vector3(x, y, z);
export function group(parent, x = 0, y = 0, z = 0) {
  const node = new T.Group();
  node.position.set(x, y, z);
  parent.add(node);
  return node;
}
export function mesh(parent, geom, material, x = 0, y = 0, z = 0) {
  const node = new T.Mesh(geom, material);
  node.position.set(x, y, z);
  node.castShadow = true;
  node.receiveShadow = true;
  parent.add(node);
  return node;
}
export function box(parent, x, y, z, w, h, d, material) {
  const node = mesh(parent, cuboid, material, x, y, z);
  node.scale.set(w, h, d);
  return node;
}
export function oval(parent, x, y, z, w, h, d, material) {
  const node = mesh(parent, sphere, material, x, y, z);
  node.scale.set(w, h, d);
  return node;
}
export function shaft(parent, a, b, radius, mat, top = radius, segments = 10) {
  const start = xyz(...a), end = xyz(...b);
  const node = mesh(parent, new T.CylinderGeometry(top, radius, end.distanceTo(start), segments), mat);
  node.position.addVectors(start, end).multiplyScalar(.5);
  node.quaternion.setFromUnitVectors(up, end.sub(start).normalize());
  return node;
}
export function cable(parent, points, r, material, segments = 28) {
  return mesh(parent, new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => xyz(...p))), segments, r, 5, false), material);
}
export function label(parent, text, width, height, at, colour = '#e4d4af', background = null) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = Math.max(72, Math.round(768 * height / width));
  const ctx = canvas.getContext('2d');
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.font = '900 ' + Math.round(canvas.height * .8) + 'px Impact, Arial Black, sans-serif';
  ctx.fillStyle = colour;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height * .53, canvas.width * .96);
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  const node = mesh(parent, new T.PlaneGeometry(width, height), new T.MeshStandardMaterial({ map: tex, alphaTest: .4, roughness: .88 }), ...at);
  node.castShadow = false;
  return node;
}

// Join static parts that move together. E.g. every chrome lug on the kit
// shares a draw call; a drummer's forearm stays separate to preserve its pivot.
export function bake(node) {
  const batches = new Map();
  node.updateWorldMatrix(true, true);
  const inverse = node.matrixWorld.clone().invert();
  const old = [];
  node.traverse(child => {
    if (!child.isMesh || Array.isArray(child.material)) return;
    const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
    geometry.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse, child.matrixWorld));
    if (!geometry.attributes.uv) geometry.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
    if (!batches.has(child.material)) batches.set(child.material, []);
    batches.get(child.material).push(geometry);
    old.push(child);
  });
  for (const child of old) child.removeFromParent();
  for (const [material, geometries] of batches) {
    const merged = mergeGeometries(geometries);
    mesh(node, merged, material);
    for (const geometry of geometries) geometry.dispose();
  }
}

const leather = pbr(0x20191c, .36);
const ochre = pbr(0x775438, .53);
const black = pbr(0x111319, .8);
const vintage = pbr(0xdeb67a, .62);
const red = pbr(0xd95d3b,.27,.13);
export const chrome = pbr(0xbac2cc, .26, .88);
export const gold = pbr(0xbc9149, .33, .78);

// One solid tapered lock, whisker or eyebrow. Elliptical cross-sections
// give broad, soft highlights at phone resolution.
function sculptLock(parent, path, width, depth, material, taper=.12) {
  const curve=new T.CatmullRomCurve3(path.map(p=>xyz(...p)));
  const positions=[],indices=[],sides=8,steps=8;
  const axis=xyz(0,0,1);
  for(let i=0;i<=steps;i++) {
    const t=i/steps, center=curve.getPoint(t), tangent=curve.getTangent(t);
    let lateral=axis.clone().cross(tangent);
    if(lateral.lengthSq()<.00001) lateral=xyz(1,0,0);
    lateral.normalize();
    const radial=tangent.clone().cross(lateral).normalize();
    const profile=(taper+(1-taper)*Math.pow(Math.sin(Math.PI*t),.65))*(1-.14*t);
    for(let j=0;j<sides;j++){
      const angle=j*Math.PI*2/sides;
      const p=center.clone().addScaledVector(lateral,Math.cos(angle)*width*profile).addScaledVector(radial,Math.sin(angle)*depth*profile);
      positions.push(p.x,p.y,p.z);
      if(i<steps){
        const a=i*sides+j,b=i*sides+(j+1)%sides;
        indices.push(a,b,a+sides,b,b+sides,a+sides);
      }
    }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
  return mesh(parent,g,material);
}

function sculptFace(actor) {
  const {head,role}=actor,lead=role==='lead',bass=role==='bass',drummer=role==='drums';
  const features=group(head),hair=group(head);
  const hairBase=pbr(lead?0x63301d:bass?0x231c32:0x49251e,.43);
  const hairLight=pbr(lead?0xb56739:bass?0x433650:0x70402b,.48);
  const hairGlint=pbr(lead?0xce8755:0x4b4552,.51);
  const earMat=pbr(lead?0xc87755:bass?0x955639:0xc07854,.66);
  const earBlush=pbr(lead?0xae5648:bass?0x724233:0xa95440,.73);
  const browMat=pbr(lead?0x70391f:0x362426,.68);
  const teeth=pbr(0xf0d9b0,.54),tongue=pbr(0xc67264,.64);
  const eyes=[],brows=[];
  // Paint the iris into a curved almond-shaped sclera. Its upper and lower
  // edges meet the sculpted lids and crop the iris as an eye would in a smile.
  const eyeAtlas=document.createElement('canvas');eyeAtlas.width=192;eyeAtlas.height=96;
  const ec=eyeAtlas.getContext('2d'),sclera=ec.createLinearGradient(0,0,0,96);
  sclera.addColorStop(0,'#b79982');sclera.addColorStop(.46,'#f6e8d1');sclera.addColorStop(1,'#dcc5af');
  ec.fillStyle=sclera;ec.fillRect(0,0,192,96);
  const pigment=ec.createRadialGradient(95,47,4,95,47,38);
  pigment.addColorStop(0,lead?'#606548':'#74513a');pigment.addColorStop(.73,lead?'#678167':'#8b6945');pigment.addColorStop(1,'#453b32');
  ec.fillStyle=pigment;ec.beginPath();ec.ellipse(95,47,34,42,0,0,Math.PI*2);ec.fill();
  ec.fillStyle='#241d21';ec.beginPath();ec.ellipse(95,47,21,27,0,0,Math.PI*2);ec.fill();
  ec.fillStyle='#fff7e4';ec.beginPath();ec.ellipse(87,33,5.1,6.3,0,0,Math.PI*2);ec.fill();
  const eyeMap=new T.CanvasTexture(eyeAtlas);eyeMap.colorSpace=T.SRGBColorSpace;
  const scleraMat=new T.MeshStandardMaterial({map:eyeMap,roughness:.43});
  for(const s of [-1,1]){
    oval(features,s*.103,.079,-.002,.035,.051,.025,earMat).rotation.z=-s*.19;
    oval(features,s*.114,.078,.016,.015,.030,.008,earBlush).rotation.z=-s*.19;
    const eye=group(head,s*.048,.093,.117);
    eye.rotation.z=s*(lead?.07:bass?.04:-.04);eye.rotation.y=s*.32;
    const width=lead?.035:drummer?.032:.030,height=bass?.016:.020;
    const pos=[],uv=[],idx=[];
    for(let j=0;j<=6;j++)for(let i=0;i<=16;i++){
      const u=i/8-1,v=j/3-1,bulge=Math.max(0,1-u*u);
      pos.push(u*width,v*Math.pow(bulge,.68)*height*(v>0?.97:.82),.002+bulge*(.008+.004*(1-v*v)));
      uv.push(i/16,j/6);
      if(i<16&&j<6){const k=j*17+i;idx.push(k,k+1,k+17,k+1,k+18,k+17);}
    }
    const eyeGeometry=new T.BufferGeometry();eyeGeometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));eyeGeometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));eyeGeometry.setIndex(idx);eyeGeometry.computeVertexNormals();mesh(eye,eyeGeometry,scleraMat);
    sculptLock(eye,[[-width,0,.001],[-width*.52,height*.76,.009],[0,height*.94,.011],[width*.52,height*.76,.009],[width,0,.001]],.0035,.0028,browMat,.20);
    bake(eye);eyes.push(eye);
    const brow=group(head,s*.048,.123,.115);
    brow.rotation.y=s*.30;
    sculptLock(brow,[[-.033,-s*.006,-.005],[-.012,.006,.004],[.012,.007,.004],[.035,s*.005,-.007]],bass?.010:.008,.008,browMat,.21);
    bake(brow);brows.push(brow);
  }
  if(lead){
    // One sweep of copper fringe, longer kick-out locks behind the ears and
    // a burnished hoop keep the outline recognisable during wide shots.
    const ring=mesh(features,new T.TorusGeometry(.019,.0039,7,22),gold,-.124,.027,.017);
    ring.rotation.y=.25;
    oval(hair,0,.157,-.024,.113,.092,.124,hairBase);
    for(let i=0;i<13;i++){
      const angle=.77+i*(Math.PI*2-1.52)/12,s=Math.sin(angle),c=Math.cos(angle);
      sculptLock(hair,[[s*.035,.223,c*.040],[s*.109,.172,c*.112],[s*.126,.071,c*.114],[s*(.137+.012*Math.sin(i)),.002+.018*Math.cos(i*4),c*.108-.022],[s*.141,-.039-.025*Math.sin(i*3),c*.106-.052]],
        .022,.018,i%4===1?hairLight:hairBase);
    }
    for(let i=0;i<5;i++){
      const d=i*.008;
      sculptLock(hair,[[-.101+d,.131,.059-d],[-.066+d,.223+d,.104-d],[.032+d,.240-d,.116-d],[.096+d*.4,.182-d,.102],[.103+d*.2,.137-d,.074]],
        .028,.018,i%3===1?hairGlint:i%2?hairBase:hairLight);
    }
  }else if(bass){
    // A tall blue-black quiff and split whiskers distinguish the bassist
    // from the lead even when their faces occupy a few dozen pixels.
    oval(hair,0,.174,-.021,.115,.089,.115,hairBase);
    for(let i=0;i<6;i++){
      const x=(i-2.5)*.031;
      sculptLock(hair,[[x*.84,.150,.093],[x*1.02,.212,.132],[x*.84,.268,.072],[x*.59,.202,-.083]],.030,.027,i%3===0?hairLight:hairBase);
    }
    for(const s of [-1,1]){
      sculptLock(features,[[s*.002,.031,.131],[s*.018,.036,.134],[s*.049,.035,.118],[s*.074,.047,.097]],.010,.0065,hairBase,.13);
    }
    sculptLock(features,[[-.027,-.017,.113],[.004,-.036,.113],[.020,-.051,.096]],.019,.009,hairBase);
  }else{
    const beanie=pbr(0x32677c,.85),rib=pbr(0x254655,.82);
    oval(hair,0,.175,-.005,.130,.094,.128,beanie).rotation.z=.14;
    const band=mesh(hair,new T.CylinderGeometry(.129,.125,.042,32),rib,0,.15,0);
    band.scale.z=.97;band.rotation.z=.06;
    for(let n=0;n<22;n++){
      const a=n*Math.PI/11,s=Math.sin(a),c=Math.cos(a);
      sculptLock(hair,[[s*.128,.137,c*.123],[s*.13,.152,c*.125],[s*.127,.171,c*.121]],.0019,.002,beanie,.45);
    }
    box(hair,.059,.150,.114,.043,.028,.005,vintage).rotation.y=.35;
  }
  // The curved mouth panel follows the scanned muzzle. An articulated
  // corner and the upper tooth edge read as a smile from the game camera.
  const mouth=group(head,0,.019,.120);
  const cavity=pbr(0x492326,.77);
  const curveMouth=(sx,y)=> .005-.029*Math.pow(Math.abs(sx),1.7)+y*.08;
  function ribbon(mat,upper,lower,z){
    const pos=[],index=[];
    for(let n=0;n<=20;n++){
      const u=n/10-1,xx=u*(bass?.044:.053);
      const top=upper(u),bottom=lower(u);
      pos.push(xx,top,curveMouth(u,top)+z,xx,bottom,curveMouth(u,bottom)+z);
      if(n<20)index.push(n*2,n*2+1,n*2+2,n*2+1,n*2+3,n*2+2);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(index);g.computeVertexNormals();
    mat.side=T.DoubleSide;mesh(mouth,g,mat);
  }
  const top=u=>.008+.009*u*u+.005*u;
  const floor=u=>top(u)-.029*(1-u*u);
  ribbon(cavity,top,floor,.008);
  ribbon(teeth,u=>top(u)-.001,u=>top(u)-.001-.009*(1-u*u),.010);
  ribbon(tongue,u=>floor(u)+.004*(1-u*u),floor,.009);
  bake(mouth);bake(features);bake(hair);
  actor.expression=(t,jubilation,suspense,miss)=>{
    const blinkTime=(t+(lead?.21:bass?1.27:1.98))%4.1;
    const blink=blinkTime<.15?Math.sin(Math.PI*blinkTime/.15):0;
    const open=1+.22*suspense+.12*miss-.15*jubilation;
    for(let n=0;n<2;n++){
      const s=n?1:-1;
      eyes[n].scale.y=Math.max(.08,(1-.93*blink)*open);
      brows[n].position.y=.122+.014*suspense+.009*miss+(n?.008:-.001)*(lead?.6:0);
      brows[n].rotation.z=s*(.13*miss-.13*jubilation)+(lead?-.08:0);
    }
    eyeMap.offset.x=-.045*suspense-.038*jubilation-.012*Math.sin(t*.78);
    mouth.scale.set(1+.19*jubilation-.28*suspense,(lead?.67:bass?.48:.45)+.85*jubilation+.78*suspense+.22*miss,1);
    mouth.rotation.z=-.08*miss;
  };
}
function guitar(parent) {
  const g = group(parent, -.02, 1.05, .24);
  g.rotation.z = -.48;
  const shape = new T.Shape();
  shape.moveTo(-.08, -.27);
  shape.bezierCurveTo(-.3,-.23,-.25,-.06,-.17,.035);
  shape.bezierCurveTo(-.12,.13,-.22,.24,-.11,.29);
  shape.bezierCurveTo(-.08,.17,-.02,.14,.06,.18);
  shape.bezierCurveTo(.19,.3,.16,.22,.145,.09);
  shape.bezierCurveTo(.12,-.01,.25,-.05,.22,-.16);
  shape.bezierCurveTo(.19,-.28,.05,-.32,-.08,-.27);
  mesh(g, new T.ExtrudeGeometry(shape,{depth:.044,bevelEnabled:true,bevelThickness:.012,bevelSize:.017,bevelSegments:2,steps:1,curveSegments:12}), red);
  const guard=new T.Shape();
  guard.moveTo(-.11,.17);guard.quadraticCurveTo(-.14,.035,-.065,-.103);
  guard.quadraticCurveTo(.025,-.175,.148,-.118);guard.quadraticCurveTo(.212,-.092,.111,.004);
  guard.quadraticCurveTo(.071,.11,.1,.167);guard.quadraticCurveTo(-.02,.118,-.11,.17);
  mesh(g,new T.ShapeGeometry(guard,12),pbr(0xe1c7a4,.38),0,0,.063);
  for(const [x,y] of [[.125,-.115],[.082,-.144]]){
    oval(g,x,y,.077,.015,.015,.012,gold);
  }
  box(g,-.01,.46,.05,.065,.78,.035,ochre);
  box(g,-.01,.47,.071,.06,.75,.01,leather);
  box(g,0,.87,.047,.082,.17,.055,vintage).rotation.z=-.13;
  for(const y of [-.13,-.03,.035]) box(g,-.005,y,.069,.095,.025,.016,chrome);
  for(let j=0;j<16;j++) box(g,-.01,.12+j*.042,.081,.065,.004,.003,chrome);
  for(let j=0;j<4;j++) shaft(g,[-.032+j*.015,-.14,.086],[-.032+j*.015,.9,.086],.0018,chrome);
  for(let j=0;j<4;j++) oval(g,(j%2?1:-1)*.055,.82+j*.035,.045,.023,.01,.018,chrome);
  cable(parent,[[-.22,1.65,0],[-.26,1.59,.15],[.11,1.01,.26]],.017,leather);
  bake(g);
}

export function musician(parent, role) {
  const root = group(parent), torso = group(root);
  const head = group(torso,0,role==='lead'?1.746:1.731,.018);
  const width=role==='lead'?1.62:role==='bass'?1.57:1.72;
  head.scale.set(width,role==='lead'?1.47:1.45,1.48);
  const wardrobe=group(torso);
  if(role==='lead'){
    const scarf=pbr(0xc94731,.72);
    sculptLock(wardrobe,[[-.11,1.672,.05],[-.089,1.620,.101],[-.052,1.605,.123],[.056,1.606,.118],[.1,1.661,.05]],.023,.015,scarf,.45);
    sculptLock(wardrobe,[[.059,1.621,.119],[.083,1.545,.135],[.054,1.481,.149],[.09,1.412,.147]],.023,.007,scarf);
    for(const s of [-1,1]){
      for(const [x,y] of [[.132,1.59],[.118,1.55],[.105,1.51],[.098,1.47]]){
        oval(wardrobe,s*x,y,.134,.009,.009,.005,gold);
      }
    }
    cable(wardrobe,[[-.093,1.685,.07],[-.068,1.585,.124],[.012,1.506,.139],[.077,1.58,.127],[.098,1.683,.073]],.0046,gold);
    cable(wardrobe,[[-.116,1.63,.076],[-.074,1.46,.126],[.006,1.323,.129]],.0055,chrome);
    box(wardrobe,.005,1.004,.119,.081,.035,.016,chrome);
    for(let n=0;n<10;n++){
      const a=(n/9-.5)*Math.PI*.84;
      oval(wardrobe,.185*Math.sin(a),1.005,.117*Math.cos(a),.008,.007,.003,chrome);
    }
  }
  if(role==='bass') guitar(wardrobe);
  const arms=[],legs=[];
  const wrists=role==='lead'?[[-.336,1.105,.081],[.108,1.742,.175]]:role==='bass'?[[-.053,1.095,.269],[.277,1.52,.218]]:[[-.235,1.34,.405],[.26,1.34,.405]];
  for(let i=0;i<2;i++) {
    const side=i?1:-1,joint=group(torso,side*.20,1.61,0), wrist=xyz(...wrists[i]).sub(joint.position);
    arms.push(joint);legs.push(group(root));
    if(role==='drums'){
      shaft(joint,wrist.toArray(),wrist.clone().add(xyz(side*.041,.03,.388)).toArray(),.013,vintage,.008);
      oval(joint,wrist.x+side*.041,wrist.y+.030,wrist.z+.388,.013,.013,.021,vintage);
    }
    if(role==='lead'&&i){
      shaft(joint,wrist.toArray(),wrist.clone().add(xyz(-.053,.074,.016)).toArray(),.018,black,.022);
      oval(joint,wrist.x-.062,wrist.y+.083,wrist.z+.021,.029,.036,.029,chrome);
    }
  }
  bake(wardrobe);
  const actor={root,torso,head,arms,legs,wrists,role};
  sculptFace(actor);
  return actor;
}

// The glTF colour channel carries the original anatomical coordinates.
// Garment edges and fading are evaluated per fragment in that pose, so cuffs
// and lapels bend with each arm without exposing triangle-shaped fabric edges.
function wardrobeMaterial(role, part) {
  const m=pbr(0xffffff,part==='jeans'?.87:role==='lead'?.61:.78);
  m.vertexColors=true;
  m.onBeforeCompile=shader=>{
    let fabric;
    if(part==='jeans'){
      fabric=`
        vec3 base=vec3(.014,.024,.041);
        float worn=exp(-pow((body.y-.54)/.117,2.))*smoothstep(-.023,.125,body.z);
        base+=vec3(.017,.018,.02)*worn;
        float seam=1.-smoothstep(.001,.004,abs(abs(body.x)-(.266-.085*body.y)));
        diffuseColor.rgb=base+vec3(.052,.039,.023)*seam;
      `;
    }else if(role==='lead'){
      fabric=`
        float openEdge=.022+.117*smoothstep(1.025,1.626,body.y);
        float outside=.197+.041*smoothstep(1.56,1.63,body.y)-.024*exp(-pow((body.y-1.51)/.066,2.));
        float chest=smoothstep(openEdge-.002,openEdge+.002,abs(body.x));
        float vest=(1.-smoothstep(outside-.002,outside+.002,abs(body.x)))*mix(1.,chest,smoothstep(-.003,.065,body.z))*(1.-smoothstep(1.62,1.655,body.y));
        vec3 hide=vec3(.026,.050,.061);
        float lapel=(1.-smoothstep(.006,.02,abs(abs(body.x)-openEdge)))*smoothstep(.02,.10,body.z);
        hide=mix(hide,vec3(.128,.071,.048),lapel);
        diffuseColor.rgb=mix(skinTone,hide,vest);
      `;
    }else{
      const shirt=role==='bass'?'vec3(.025,.157,.146)':'vec3(.411,.112,.044)';
      fabric=`
        float collar=1.-smoothstep(1.606,1.616,body.y-.81*abs(body.x));
        float sleeve=smoothstep(1.393,1.405,body.y)+(1.-smoothstep(.198,.206,abs(body.x)));
        float cloth=clamp(collar*min(1.,sleeve),0.,1.);
        vec3 dye=${shirt};
        float neckLine=1.-smoothstep(.004,.013,abs(body.y-.81*abs(body.x)-1.606));
        dye*=1.-.55*neckLine;
        float stripe=smoothstep(1.387,1.392,body.y)*(1.-smoothstep(1.412,1.418,body.y));
        dye=mix(dye,vec3(.39,.29,.17),stripe*.69);
        diffuseColor.rgb=mix(skinTone,dye,cloth);
      `;
    }
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      'vec3 body=vec3(vColor.r-.55,vColor.g/.49,vColor.b-.24);vec3 skinTone='+
      (role==='bass'?'vec3(.275,.105,.061)':role==='drums'?'vec3(.39,.183,.105)':'vec3(.47,.216,.121)')+';'+fabric);
  };
  m.customProgramCacheKey=()=>role+'-'+part;
  return m;
}
const sole=pbr(0x211e20,.86);
function boot(){
  const g=new T.Group();
  oval(g,0,-.018,.052,.068,.065,.136,leather);
  oval(g,0,.027,-.019,.056,.099,.064,leather);
  oval(g,0,-.065,.043,.072,.021,.139,sole);
  for(let i=0;i<4;i++){
    const z=.001+i*.017, y=.054-i*.006;
    shaft(g,[-.038,y,z],[.038,y+.002,z+.014],.0028,vintage);
  }
  bake(g);return g;
}

// Pose the articulated CC0 body with two-bone IK. Hands and instrument props
// use the same authored wrist targets, so the bass and sticks stay within reach.
export function fitBody(actor,model) {
  const {root,torso,role}=actor;
  torso.add(model);
  const outfit={skin:wardrobeMaterial(role,'skin'),jeans:wardrobeMaterial(role,'jeans')};
  model.traverse(node=>{
    if(!node.isMesh)return;
    if(node.material.name==='boots'){node.visible=false;return;}
    node.material=outfit[node.material.name]||outfit.skin;
    node.castShadow=node.receiveShadow=true;
    node.frustumCulled=false;
  });
  const bones={};
  model.traverse(n=>{if(n.isBone)bones[n.name]=n;});
  const coords=b=>model.worldToLocal(b.getWorldPosition(new T.Vector3()));
  function aim(b,child,v){
    const parentRotation=b.parent.getWorldQuaternion(new T.Quaternion());
    const modelRotation=model.getWorldQuaternion(new T.Quaternion());
    const target=v.clone().applyQuaternion(modelRotation).applyQuaternion(parentRotation.invert()).normalize();
    b.quaternion.setFromUnitVectors(child.position.clone().normalize(),target);
    b.updateWorldMatrix(false,true);
  }
  const posed=[],feet=[];
  function bend(first,second,end,target,pole,control) {
    const a=coords(first),b=coords(second),c=coords(end);
    const upper=a.distanceTo(b),lower=b.distanceTo(c),axis=target.clone().sub(a);
    const distance=T.MathUtils.clamp(axis.length(),Math.abs(upper-lower)+.0001,upper+lower-.0001);
    axis.normalize();
    const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
    const tangent=pole.clone().sub(a);
    tangent.addScaledVector(axis,-tangent.dot(axis)).normalize();
    const mid=a.clone().addScaledVector(axis,along).addScaledVector(tangent,Math.sqrt(Math.max(0,upper*upper-along*along)));
    aim(first,second,mid.clone().sub(a));
    aim(second,end,a.clone().addScaledVector(axis,distance).sub(mid));
    posed.push({bone:first,base:first.quaternion.clone(),control});
  }
  root.updateWorldMatrix(true,true);
  for(let i=0;i<2;i++){
    const side=i?1:-1,s=i?'l':'r';
    const pole=role==='lead'&&i?xyz(.49,1.32,.03):xyz(side*.42,1.29,-.08);
    bend(bones[s+'_arm'],bones[s+'_fore'],bones[s+'_hand'],xyz(...actor.wrists[i]),pole,actor.arms[i]);
    // Orient the fingers around the mic or stick after placing the wrist.
    const hand=bones[s+'_hand'], fingers=bones[s+'_fingers'];
    if(role==='drums')aim(hand,fingers,xyz(side*.2,-.2,1));
    else if(i||role==='bass')aim(hand,fingers,xyz(-.32,.79,.31));
    else aim(hand,fingers,xyz(.12,-1,.15));
    const target=role==='drums'?xyz(side*.29,.37,.38):xyz(side*(role==='lead'?.247:.216),.105,-side*.082);
    bend(bones[s+'_leg'],bones[s+'_calf'],bones[s+'_foot'],target,xyz(side*.25,.63,.53),actor.legs[i]);
    aim(bones[s+'_foot'],bones[s+'_toe'],xyz(side*.16,-.50,.86));
    const shoe=boot();root.add(shoe);shoe.rotation.y=side*.15;
    feet.push({shoe,ankle:bones[s+'_foot']});
  }
  actor.animateBody=()=>{
    for(const {bone,base,control} of posed){
      // The input rotation is in performer space, while the bone is local
      // to its unmoving parent at the base of the chain.
      bone.quaternion.copy(control.quaternion).multiply(base);
    }
    for(const {shoe,ankle} of feet){
      ankle.getWorldPosition(shoe.position);
      root.worldToLocal(shoe.position);
      shoe.position.y+=.008;
    }
  };
}
export function drumKit(parent) {
  const kit = group(parent, 1.04, .12, -1.91);
  const stand = group(kit);
  const lacquer = pbr(0x6d261c,.26,.38);
  const skinHead = pbr(0xc7bda2,.62);
  const kick = group(stand,0,.45,.12);
  kick.rotation.x = Math.PI/2;
  function shell(g,x,y,z,r,h,front) {
    shaft(g,[x,y-h*.5,z],[x,y+h*.5,z],r,lacquer,r,32);
    for(const sign of [-1,1]){
      shaft(g,[x,y+sign*h*.5-.014,z],[x,y+sign*h*.5+.014,z],r+.013,chrome,r+.013,32);
      shaft(g,[x,y+sign*(h*.5+.011),z],[x,y+sign*(h*.5+.021),z],r-.012,front || skinHead,r-.012,32);
    }
    for(let n=0;n<8;n++){
      const a = n*Math.PI/4, X=x+Math.sin(a)*(r+.009), Z=z+Math.cos(a)*(r+.009);
      shaft(g,[X,y-h*.43,Z],[X,y+h*.43,Z],.009,chrome);
    }
  }
  shell(kick,0,0,0,.43,.45,black);
  label(stand,'RIOT',.54,.2,[0,.45,.374], '#d8bc80');
  shell(stand,-.46,.76,.15,.247,.20);
  shell(stand,.48,.53,-.07,.28,.4);
  shell(stand,-.17,1.036,-.01,.20,.225);
  shell(stand,.24,1.02,-.13,.205,.25);
  const cymbals=[];
  for(const [x,y,z,r] of [[-.75,1.27,-.18,.31],[.76,1.48,-.19,.36],[-.54,1.04,.29,.19]]){
    shaft(stand,[x,.1,z],[x,y+.045,z],.013,chrome);
    for(let n=0;n<3;n++){
      const a=n*2.094;
      shaft(stand,[x,.26,z],[x+Math.cos(a)*.16,.016,z+Math.sin(a)*.16],.011,chrome);
    }
    const cymbal=group(kit,x,y,z);
    const pts=[[.012,.012],[.055,.057],[.088,.016],[r*.8,-.012],[r,-.02],[r,-.025],[r*.7,-.014],[.012,.007]];
    mesh(cymbal,new T.LatheGeometry(pts.map(p=>new T.Vector2(...p)),38),gold);
    cymbals.push(cymbal);
  }
  bake(stand);
  return cymbals;
}
