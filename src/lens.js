import * as T from 'three';

// One render target and one full-screen pass for the upper quality tiers.
// Sample actual depth so the live target stays sharp during a throw.
export class ConcertLens {
  constructor(renderer) {
    this.renderer=renderer;
    this.supported=renderer.extensions.has('EXT_color_buffer_float');
    if(!this.supported)return;
    this.camera=new T.Camera();
    this.scene=new T.Scene();
    this.size=new T.Vector2();
    const material=new T.ShaderMaterial({
      depthTest:false,depthWrite:false,
      uniforms:{frame:{value:null},depthMap:{value:null},pixel:{value:new T.Vector2()},
        planes:{value:new T.Vector2()},focus:{value:1},opening:{value:0},strength:{value:1}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:`
        uniform sampler2D frame, depthMap;
        uniform vec2 pixel, planes;
        uniform float focus, opening, strength;
        varying vec2 vUv;
        void main() {
          float depth=texture2D(depthMap,vUv).r;
          float z=planes.x*planes.y/(planes.y-depth*(planes.y-planes.x));
          float blur=opening*smoothstep(.55,3.5,abs(z-focus))*1.65;
          vec2 d=pixel*(1.2+blur);
          vec3 source=texture2D(frame,vUv).rgb;
          vec3 nearby=(texture2D(frame,vUv+d).rgb+texture2D(frame,vUv-d).rgb+
            texture2D(frame,vUv+vec2(d.x,-d.y)).rgb+texture2D(frame,vUv+vec2(-d.x,d.y)).rgb)*.25;
          vec3 c=mix(source,nearby,blur*.36)+max(nearby-vec3(1.55),0.)*.065*strength;
          float luma=dot(c,vec3(.2126,.7152,.0722));
          c=mix(vec3(luma),c,1.045);
          c*=1.-strength*.12*smoothstep(.18,.73,distance(vUv,vec2(.5)));
          gl_FragColor=vec4(c,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    this.material=material;
    const tri=new T.BufferGeometry();
    tri.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
    tri.setAttribute('uv',new T.Float32BufferAttribute([0,0,2,0,0,2],2));
    const screen=new T.Mesh(tri,material);screen.frustumCulled=false;this.scene.add(screen);
  }
  render(scene,camera,{enabled,opening,focus,strength}) {
    const r=this.renderer;
    if(!enabled || !this.supported){
      if(this.target){this.target.dispose();this.target=null;}
      r.render(scene,camera);return;
    }
    r.getDrawingBufferSize(this.size);
    const w=this.size.x,h=this.size.y;
    if(!this.target){
      this.target=new T.WebGLRenderTarget(w,h,{type:T.HalfFloatType,minFilter:T.LinearFilter,magFilter:T.LinearFilter});
      this.target.depthTexture=new T.DepthTexture(w,h,T.UnsignedIntType);
    }else if(this.target.width!==w||this.target.height!==h)this.target.setSize(w,h);
    const u=this.material.uniforms;
    u.frame.value=this.target.texture;u.depthMap.value=this.target.depthTexture;
    u.pixel.value.set(1/w,1/h);u.planes.value.set(camera.near,camera.far);
    u.opening.value=opening;u.focus.value=focus;u.strength.value=strength;
    r.setRenderTarget(this.target);r.render(scene,camera);r.setRenderTarget(null);
    r.render(this.scene,this.camera);
  }
}
