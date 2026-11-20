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
const auburn = pbr(0x3c1c14, .48);
const ochre = pbr(0x775438, .53);
const black = pbr(0x111319, .8);
const vintage = pbr(0xdeb67a, .62);
const red = pbr(0x963a24);
export const chrome = pbr(0xbac2cc, .26, .88);
export const gold = pbr(0xbc9149, .33, .78);

function buildHair(head, style) {
  const hair = group(head);
  if (style === 'drums') {
    const cap = pbr(0x313a39, .99);
    oval(hair, 0, .169, -.001, .118, .087, .117, cap);
    const band = mesh(hair, new T.CylinderGeometry(.117, .117, .032, 24), cap, 0, .153, 0);
    band.scale.z = .95;
  } else {
    const base = style === 'bass' ? black : auburn;
    oval(hair, 0, .168, -.012, .109, .078, .107, base);
    // Tapered individual locks sweep outward from a side part, leaving the face open.
    for (let n = 0; n < 37; n++) {
      const a = (n / 36) * Math.PI * 1.67 + .52;
      const s = Math.sin(a), c = Math.cos(a);
      const length = .13 + (1 - c) * .085 + .04 * Math.sin(n * 17);
      const lock = new T.CatmullRomCurve3([
        xyz(.03, .233, -.009), xyz(s * .095, .202, c * .10),
        xyz(s * .119, .105, c * .115 - .005),
        xyz(s * (.119 + .014 * Math.sin(n)), .12 - length, c * .115 - .023)
      ]);
      const pts = [], indices = [];
      for (let j = 0; j <= 7; j++) {
        const t = j / 7, p = lock.getPoint(t);
        const w = (.002 + .027 * Math.sin(Math.PI * Math.pow(t, .74))) * (style === 'bass' ? .9 : 1);
        pts.push(p.x - c * w, p.y, p.z + s * w, p.x + c * w, p.y, p.z - s * w);
        if (j < 7) indices.push(j*2, j*2+1, j*2+2, j*2+1, j*2+3, j*2+2);
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
      g.setIndex(indices); g.computeVertexNormals();
      const mat = n % 6 === 0 && style !== 'bass' ? ochre : base;
      mat.side = T.DoubleSide;
      mesh(hair, g, mat);
    }
  }
  bake(hair);
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
  const head = group(torso,0,1.811,.005);
  buildHair(head,role);
  const accessories=group(head);
  if(role==='lead'){
    const lenses=pbr(0x302024,.23,.41);
    for(const side of [-1,1]){
      oval(accessories,side*.052,.095,.111,.048,.029,.012,lenses).rotation.y=side*.25;
      shaft(accessories,[side*.089,.098,.099],[side*.111,.083,-.035],.0038,gold);
    }
    shaft(accessories,[-.011,.102,.115],[.011,.102,.115],.0045,gold);
  }else if(role==='bass'){
    oval(accessories,0,.026,.13,.051,.012,.008,black);
    oval(accessories,0,-.013,.109,.038,.024,.012,black);
  }
  bake(accessories);
  const wardrobe=group(torso);
  if(role==='lead'){
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
      shaft(joint,wrist.toArray(),wrist.clone().add(xyz(side*.041,.03,.346)).toArray(),.008,vintage,.0055);
    }
    if(role==='lead'&&i){
      shaft(joint,wrist.toArray(),wrist.clone().add(xyz(-.053,.074,.016)).toArray(),.018,black,.022);
      oval(joint,wrist.x-.062,wrist.y+.083,wrist.z+.021,.029,.036,.029,chrome);
    }
  }
  bake(wardrobe);
  return {root,torso,head,arms,legs,wrists,role};
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
        vec3 base=vec3(.019,.019,.027);
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
        vec3 hide=vec3(.025,.019,.023);
        float lapel=(1.-smoothstep(.006,.02,abs(abs(body.x)-openEdge)))*smoothstep(.02,.10,body.z);
        hide+=vec3(.035,.027,.022)*lapel;
        diffuseColor.rgb=mix(skinTone,hide,vest);
      `;
    }else{
      const shirt=role==='bass'?'vec3(.033,.085,.08)':'vec3(.109,.032,.034)';
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
      'vec3 body=vec3(vColor.r-.55,vColor.g/.49,vColor.b-.24);vec3 skinTone=vec3(.365,.155,.087);'+fabric);
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
