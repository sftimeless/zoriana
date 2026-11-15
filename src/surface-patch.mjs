// Landing view terrain: a true-scale mesh of the ground around one site, built from the same
// LOLA-derived visual height grids the shadow tracer uses (160 m south of 85°S, 3.8 km elsewhere).
// It is a visual aid only. Site metrics still come from the finer server-side horizon model.
import * as THREE from 'three';
import { coordinatesToVector, skyDirection } from './ephemeris.mjs';
import { projectionGLSL } from './terrain-shadows.mjs';

const R_KM=1737.4,DEG=180/Math.PI;

export function createSurfacePatch(scene,shadows){
 const own={surfaceLit:{value:1},surfaceFill:{value:.12}};
 const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,metalness:0,vertexColors:true,transparent:true});
 material.onBeforeCompile=program=>{
  Object.assign(program.uniforms,shadows.uniforms,own);
  program.vertexShader='varying vec3 surfaceDirection;\n'+program.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsurfaceDirection=position;');
  // Map and shadow lookups are derived per fragment from the surface direction, so the mesh
  // can straddle the pole and the ±180° seam without interpolated-UV artifacts.
  program.fragmentShader=`varying vec3 surfaceDirection;
uniform sampler2D terrainGlobalShadow;
uniform sampler2D terrainSouthShadow;
uniform float terrainShadowsReady;
uniform float surfaceLit;
uniform float surfaceFill;
${projectionGLSL}
`+program.fragmentShader.replace('#include <map_fragment>',`
 vec3 surfaceUnit=normalize(surfaceDirection);
 float surfaceV=asin(clamp(surfaceUnit.y,-1.0,1.0))/PI+.5;
 float surfaceU=atan(-surfaceUnit.z,surfaceUnit.x)/(2.0*PI)+.5;
 #ifdef USE_MAP
  float surfaceU2=fract(surfaceU+.5);
  vec2 surfaceDx=vec2(abs(dFdx(surfaceU))<abs(dFdx(surfaceU2))?dFdx(surfaceU):dFdx(surfaceU2),dFdx(surfaceV));
  vec2 surfaceDy=vec2(abs(dFdy(surfaceU))<abs(dFdy(surfaceU2))?dFdy(surfaceU):dFdy(surfaceU2),dFdy(surfaceV));
  diffuseColor*=textureGrad(map,vec2(surfaceU,surfaceV),surfaceDx,surfaceDy);
 #endif`).replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
 float surfaceVisibility=surfaceV<5.0/180.0?texture2D(terrainSouthShadow,polarUV(surfaceUnit)).r:texture2D(terrainGlobalShadow,vec2(surfaceU,surfaceV)).r;
 surfaceVisibility=mix(1.0,surfaceVisibility,terrainShadowsReady)*surfaceLit;
 reflectedLight.directDiffuse*=surfaceVisibility;
 reflectedLight.directSpecular*=surfaceVisibility;
 // Faint camera-side fill so relief stays readable in shadow. It is not sunlight.
 reflectedLight.indirectDiffuse+=diffuseColor.rgb*surfaceFill*max(dot(normal,normalize(vViewPosition)),0.0);`);
 };
 material.customProgramCacheKey=()=>'zoriana-surface-patch-v1';

 const mesh=new THREE.Mesh(new THREE.BufferGeometry(),material);
 mesh.visible=false;mesh.frustumCulled=false;mesh.renderOrder=1;
 // The globe's relief is much coarser than this mesh and can poke through it, so the patch is
 // drawn over the globe with a fresh depth buffer. It is only shown from above its own site.
 mesh.onBeforeRender=renderer=>{renderer.state.buffers.depth.setMask(true);renderer.clearDepth();};
 scene.add(mesh);

 let built=null;
 const centre=new THREE.Vector3();
 function build(site){
  const sampler=shadows.sampler();if(!sampler)return null;
  const key=`${site.lat.toFixed(5)}:${site.lon.toFixed(5)}`;if(built?.key===key)return built;
  const lat=THREE.MathUtils.clamp(site.lat,-89.95,89.95),lon=site.lon;
  const polar=lat< -86.6,halfKm=polar?48:260,n=polar?481:241;
  const up=new THREE.Vector3(...coordinatesToVector(lat,lon)),north=new THREE.Vector3(...skyDirection(lat,lon,0,0)),east=new THREE.Vector3(...skyDirection(lat,lon,90,0));
  const positions=new Float32Array(n*n*3),colors=new Float32Array(n*n*4),indices=new Uint32Array((n-1)*(n-1)*6),point=new THREE.Vector3();
  for(let j=0,v=0;j<n;j++)for(let i=0;i<n;i++,v++){
   const x=(i/(n-1)*2-1)*halfKm,y=(j/(n-1)*2-1)*halfKm;
   point.copy(up).addScaledVector(east,x/R_KM).addScaledVector(north,y/R_KM).normalize();
   const height=sampler(Math.asin(point.y)*DEG,Math.atan2(-point.z,point.x)*DEG);
   point.multiplyScalar(1+height/R_KM);positions.set([point.x,point.y,point.z],v*3);
   // Circular footprint with a soft edge, so the detailed ground blends into the globe.
   colors.set([1,1,1,THREE.MathUtils.smoothstep(1-Math.hypot(x,y)/halfKm,0,.3)],v*4);
  }
  for(let j=0,k=0;j<n-1;j++)for(let i=0;i<n-1;i++){const a=j*n+i,b=a+1,c=a+n,d=c+1;indices.set([a,b,c,b,d,c],k);k+=6;}
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,4));geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeVertexNormals();
  mesh.geometry.dispose();mesh.geometry=geometry;
  const radius=1+sampler(lat,lon)/R_KM;centre.copy(up).multiplyScalar(radius);
  built={key,polar,halfKm,radius,gridMeters:polar?160:3800};
  return built;
 }
 return {
  build,
  setMap(texture){material.map=texture;material.needsUpdate=true;},
  setLit(value){own.surfaceLit.value=value?1:0;own.surfaceFill.value=value?.12:.85;},
  // Fades in as the camera arrives; hidden whenever the camera is not above this site.
  update(camera,active){
   if(!active||!built){mesh.visible=false;return;}
   const fade=1-THREE.MathUtils.smoothstep(camera.position.distanceTo(centre),.5,.8);
   mesh.visible=fade>0&&camera.position.dot(centre)>centre.lengthSq();material.opacity=fade;
  }
 };
}
