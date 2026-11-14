import * as THREE from 'three';
import { skyDirection } from './ephemeris.mjs';
import { makeVisualSampler,referenceShadow } from './shadow-reference.mjs';

// Kilometres keep ray/surface subtraction stable in WebGL highp floats.
export const projectionGLSL = `
const float PI = 3.141592653589793;
const float R = 1737.4;
vec3 fromUV(vec2 uv) {
 float lat=(uv.y-.5)*PI, lon=(uv.x-.5)*2.0*PI;
 return vec3(cos(lat)*cos(lon),sin(lat),-cos(lat)*sin(lon));
}
vec2 globeUV(vec3 p) { p=normalize(p);return vec2(atan(-p.z,p.x)/(2.0*PI)+.5,asin(clamp(p.y,-1.0,1.0))/PI+.5); }
vec2 polarUV(vec3 p) {
 vec2 uv=globeUV(p);float lat=(uv.y-.5)*PI,lon=(uv.x-.5)*2.0*PI;
 float rho=2.0*R*tan((PI*.5+lat)*.5);
 return vec2(rho*sin(lon),rho*cos(lon))/303.36+.5;
}
vec3 polarPoint(vec2 uv) {
 vec2 xy=(uv-.5)*303.36;float lat=-PI*.5+2.0*atan(length(xy)/(2.0*R));
 float lon=atan(xy.x,xy.y);return fromUV(vec2(lon/(2.0*PI)+.5,lat/PI+.5));
}`;

const fragmentShader=`precision highp float;
varying vec2 vUv;
uniform sampler2D globalHeight;
uniform sampler2D southHeight;
uniform vec3 sunDirection;
uniform bool polar;
uniform bool probe;
uniform vec2 probeUV;
${projectionGLSL}
float heightAt(vec3 p) {
 vec2 uv=globeUV(p);
 if(uv.y<5.0/180.0) return texture2D(southHeight,polarUV(p)).r*.001;
 return texture2D(globalHeight,uv).r*.001;
}
void main() {
 vec3 n=probe?fromUV(probeUV):(polar?polarPoint(vUv):fromUV(vUv));
 float elevation=dot(n,sunDirection);
 if(elevation<-.15){gl_FragColor=vec4(0.0,0.0,0.0,1.0);return;}
 float h=heightAt(n),bias=polar?.008:.05;
 vec3 origin=n*(R+h+bias);
 float distance=polar?.08:1.0;
 float visible=1.0;
 for(int i=0;i<128;i++) {
  vec3 ray=origin+sunDirection*distance;
  float altitude=length(ray)-R;
  if(altitude>11.0 && dot(ray,sunDirection)>0.0) break;
  if(altitude<heightAt(ray)){visible=0.0;break;}
  distance=distance*1.075+(polar?.08:.5);
  if(distance>500.0)break;
 }
 gl_FragColor=vec4(vec3(visible),1.0);
}`;

export function createTerrainShadows(renderer,material,invalidate,onStatus) {
 const scene=new THREE.Scene(),camera=new THREE.Camera();
 const makeTarget=(w,h)=>new THREE.WebGLRenderTarget(w,h,{depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
 const globalTarget=makeTarget(1024,512),southTarget=makeTarget(512,512);
 globalTarget.texture.wrapS=THREE.RepeatWrapping;
 const uniforms={globalHeight:{value:null},southHeight:{value:null},sunDirection:{value:new THREE.Vector3()},polar:{value:false},probe:{value:false},probeUV:{value:new THREE.Vector2()}};
 const shader=new THREE.ShaderMaterial({uniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader,depthTest:false,depthWrite:false});
 scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),shader));
 const globeUniforms={terrainGlobalShadow:{value:globalTarget.texture},terrainSouthShadow:{value:southTarget.texture},terrainShadowsReady:{value:0}};
 material.onBeforeCompile=program=>{
  Object.assign(program.uniforms,globeUniforms);
  program.vertexShader='varying vec2 terrainUv;\n'+program.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nterrainUv=uv;');
  program.fragmentShader='varying vec2 terrainUv;\nuniform sampler2D terrainGlobalShadow;\nuniform sampler2D terrainSouthShadow;\nuniform float terrainShadowsReady;\n'+projectionGLSL+'\n'+program.fragmentShader;
  program.fragmentShader=program.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
   float terrainVisibility=terrainUv.y<5.0/180.0?texture2D(terrainSouthShadow,polarUV(fromUV(terrainUv))).r:texture2D(terrainGlobalShadow,terrainUv).r;
   terrainVisibility=mix(1.0,terrainVisibility,terrainShadowsReady);
   reflectedLight.directDiffuse*=terrainVisibility;
   reflectedLight.directSpecular*=terrainVisibility;`);
 };
 material.customProgramCacheKey=()=> 'zoriana-terrain-shadows-v1';
 let loaded=false,enabled=true,available=false,previewTimer,refineTimer,version=0,heightSampler=null;
 const direction=new THREE.Vector3();
 async function load(path,width,height){
  const response=await fetch(path);if(!response.ok)throw new Error('Shadow terrain unavailable');
  const buffer=await response.arrayBuffer();if(buffer.byteLength!==width*height*4)throw new Error('Invalid shadow terrain');
  const texture=new THREE.DataTexture(new Float32Array(buffer),width,height,THREE.RedFormat,THREE.FloatType);
  texture.flipY=true;texture.wrapS=path.includes('global')?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping;
  const linear=renderer.extensions.has('OES_texture_float_linear');texture.minFilter=texture.magFilter=linear?THREE.LinearFilter:THREE.NearestFilter;
  texture.needsUpdate=true;return texture;
 }
 Promise.all([load('/assets/shadow-global.f32',2880,1440),load('/assets/shadow-south.f32',1896,1896)]).then(([g,s])=>{uniforms.globalHeight.value=g;uniforms.southHeight.value=s;loaded=true;addVerification(g.image.data,s.image.data);schedule();}).catch(()=>{onStatus('Shadow terrain unavailable');});

 function addVerification(global,south){
  if(!new URLSearchParams(location.search).has('diagnostics'))return;
  const box=document.querySelector('.render-diagnostics');if(!box)return;
  const button=document.createElement('button'),output=document.createElement('output');button.textContent='Check shadow geometry';output.setAttribute('aria-live','polite');box.append(button,output);
  button.onclick=()=>{
   const sampler=makeVisualSampler(global,south),target=makeTarget(1,1),pixel=new Uint8Array(4),previous=renderer.getRenderTarget(),oldDirection=uniforms.sunDirection.value.clone();
   const failures=[];let checked=0,blocked=0,lit=0;const start=performance.now();
   try{
    uniforms.probe.value=true;
    for(const [lat,lon] of [[-89.5,0],[-87,90],[-86,-45],[0,0]])for(const [az,el] of [[0,1],[90,1],[180,10],[270,60]]){
     const dir=skyDirection(lat,lon,az,el),expected=referenceShadow(lat,lon,dir,sampler);
     uniforms.polar.value=lat< -85;uniforms.probeUV.value.set(lon/360+.5,lat/180+.5);uniforms.sunDirection.value.fromArray(dir);
     renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,1,1,pixel);
     const actual=pixel[0]>127?1:0;checked++;actual?lit++:blocked++;if(actual!==expected)failures.push(`${lat},${lon}: ${az}/${el}`);
    }
    output.textContent=`Shadow geometry: ${checked-failures.length}/${checked} agree with independent CPU rays · ${blocked} blocked / ${lit} lit · ${Math.round(performance.now()-start)} ms${failures.length?' · mismatches '+failures.join('; '):''}`;
   }finally{uniforms.probe.value=false;uniforms.sunDirection.value.copy(oldDirection);renderer.setRenderTarget(previous);target.dispose();invalidate();}
  };
 }

 function draw(refined){
  if(!loaded||!enabled||!available||document.hidden)return;
  const previous=renderer.getRenderTarget(),auto=renderer.autoClear;
  try{
   renderer.autoClear=true;uniforms.sunDirection.value.copy(direction);
   globalTarget.setSize(refined?2048:1024,refined?1024:512);southTarget.setSize(refined?1024:512,refined?1024:512);
   uniforms.polar.value=false;renderer.setRenderTarget(globalTarget);renderer.render(scene,camera);
   uniforms.polar.value=true;renderer.setRenderTarget(southTarget);renderer.render(scene,camera);
   globeUniforms.terrainShadowsReady.value=1;
   onStatus(refined?'Terrain shadows · NASA LOLA':'Terrain shadows · updating');
  }finally{renderer.setRenderTarget(previous);renderer.autoClear=auto;}
  invalidate();
 }
 function schedule(){
  clearTimeout(refineTimer);
  if(!loaded||!enabled||!available)return;
  // Coalesce fast input without starving playback; dragging never recalculates masks.
  if(!previewTimer)previewTimer=setTimeout(()=>{previewTimer=null;draw(false);},60);
  const requested=version;refineTimer=setTimeout(()=>{if(requested===version)draw(true);},280);
 }
 return {
  // Read-only hooks for the landing-view terrain mesh: the shadow masks and a CPU height lookup (km).
  uniforms:globeUniforms,
  sampler(){if(!loaded)return null;return heightSampler||(heightSampler=makeVisualSampler(uniforms.globalHeight.value.image.data,uniforms.southHeight.value.image.data));},
  update(sun){available=true;direction.copy(sun).normalize();version++;schedule();},
  setEnabled(value){enabled=value;globeUniforms.terrainShadowsReady.value=0;clearTimeout(previewTimer);previewTimer=null;clearTimeout(refineTimer);if(value)schedule();invalidate();},
  pending(){available=false;version++;clearTimeout(previewTimer);previewTimer=null;clearTimeout(refineTimer);globeUniforms.terrainShadowsReady.value=0;onStatus('Sunlight · loading NASA/JPL');invalidate();}
 };
}
