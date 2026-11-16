// Landing view terrain: a true-scale mesh of the ground around one site, built from the same
// LOLA-derived visual height grids the shadow tracer uses (160 m south of 85°S, 3.8 km elsewhere),
// replaced by a finer grid fetched from the server for that site when it arrives (/api/terrain-patch).
// It is a visual aid only. Site metrics still come from the finer server-side horizon model.
import * as THREE from 'three';
import { coordinatesToVector, skyDirection } from './ephemeris.mjs';
import { projectionGLSL } from './terrain-shadows.mjs';
import { patchHeight } from './patch-grid.mjs';

const R_KM=1737.4,DEG=180/Math.PI;
// Sharper imagery for the ground near a site: NASA Moon Trek's tiles of the LRO WAC global mosaic
// (about 100 m per pixel at full resolution). Zoom level 8 is about 83 m per pixel at the equator;
// a 9 x 9 block of 256-pixel tiles covers roughly 190 km around the site. Fetched from NASA when
// the landing view opens; if any tile fails, the view simply keeps the 8K mosaic.
const TREK='https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm';
const DETAIL_ZOOM=8,DETAIL_TILES=9,TILE_PIXELS=256,DETAIL_MAX_LATITUDE=78;

export function createSurfacePatch(scene,shadows){
 const own={surfaceLit:{value:1},surfaceFill:{value:.12},detailMap:{value:null},detailBounds:{value:new THREE.Vector4(0,0,1,1)},detailReady:{value:0}};
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
uniform sampler2D detailMap;
uniform vec4 detailBounds;
uniform float detailReady;
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
 #endif
 // Fine detail near the site, blended in with a soft edge. detailBounds is (west u, south v, width, height).
 // Only the fine texture is taken from the detailed mosaic: its brightness relative to a blurred
 // copy of itself (about 5 km) multiplies the 8K mosaic. Broad tone and tint therefore stay those
 // of the 8K mosaic, so the detailed area does not stand out as a patch.
 float detailX=(fract(surfaceU-detailBounds.x+.5)-.5)/detailBounds.z,detailY=(surfaceV-detailBounds.y)/detailBounds.w;
 float detailMix=detailReady*smoothstep(0.0,.22,min(min(detailX,1.0-detailX),min(detailY,1.0-detailY)));
 float detailFine=dot(texture2D(detailMap,vec2(detailX,detailY)).rgb,vec3(.3333)),detailBroad=dot(textureLod(detailMap,vec2(detailX,detailY),5.0).rgb,vec3(.3333));
 diffuseColor.rgb*=mix(1.0,clamp(detailFine/max(detailBroad,.004),.3,3.0),detailMix);`).replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
 float surfaceVisibility=surfaceV<5.0/180.0?texture2D(terrainSouthShadow,polarUV(surfaceUnit)).r:texture2D(terrainGlobalShadow,vec2(surfaceU,surfaceV)).r;
 surfaceVisibility=mix(1.0,surfaceVisibility,terrainShadowsReady)*surfaceLit;
 reflectedLight.directDiffuse*=surfaceVisibility;
 reflectedLight.directSpecular*=surfaceVisibility;
 // Faint camera-side fill so relief stays readable in shadow. It is not sunlight.
 reflectedLight.indirectDiffuse+=diffuseColor.rgb*surfaceFill*max(dot(normal,normalize(vViewPosition)),0.0);`);
 };
 material.customProgramCacheKey=()=>'zoriana-surface-patch-v4';

 const mesh=new THREE.Mesh(new THREE.BufferGeometry(),material);
 mesh.visible=false;mesh.frustumCulled=false;mesh.renderOrder=1;
 // The globe's relief is much coarser than this mesh and can poke through it, so the patch is
 // drawn over the globe with a fresh depth buffer. It is only shown from above its own site.
 mesh.onBeforeRender=renderer=>{renderer.state.buffers.depth.setMask(true);renderer.clearDepth();};
 scene.add(mesh);

 let built=null,detailToken=0,detailKey=null,detailStatus='off';
 const center=new THREE.Vector3();
 // Loads the block of tiles around a site into one texture. Nothing is shown until every tile has arrived.
 function loadDetail(site,key,onChange){
  if(key===detailKey)return;
  detailKey=key;own.detailReady.value=0;detailStatus='off';const token=++detailToken;
  if(Math.abs(site.lat)>DETAIL_MAX_LATITUDE)return;                 // the equirectangular mosaic is stretched and mostly shadow near the poles
  const columns=2**(DETAIL_ZOOM+1),rows=2**DETAIL_ZOOM,degrees=360/columns,half=(DETAIL_TILES-1)/2;
  const column0=Math.floor((site.lon+180)/degrees)-half,row0=Math.min(rows-DETAIL_TILES,Math.max(0,Math.floor((90-site.lat)/degrees)-half));
  const tiles=[];
  for(let r=0;r<DETAIL_TILES;r++)for(let c=0;c<DETAIL_TILES;c++)tiles.push(new Promise((resolve,reject)=>{
   const image=new Image();image.crossOrigin='anonymous';image.onload=()=>resolve({image,r,c});image.onerror=reject;
   image.src=`${TREK}/${DETAIL_ZOOM}/${row0+r}/${((column0+c)%columns+columns)%columns}.jpg`;
  }));
  detailStatus='loading';
  Promise.all(tiles).then(loaded=>{
   if(token!==detailToken)return;
   const canvas=document.createElement('canvas');canvas.width=canvas.height=DETAIL_TILES*TILE_PIXELS;const ctx=canvas.getContext('2d');
   for(const {image,r,c} of loaded)ctx.drawImage(image,c*TILE_PIXELS,r*TILE_PIXELS);
   own.detailMap.value?.dispose();
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
   own.detailBounds.value.set(column0*degrees/360,1-(row0+DETAIL_TILES)*degrees/180,DETAIL_TILES*degrees/360,DETAIL_TILES*degrees/180);
   own.detailMap.value=texture;
   own.detailReady.value=1;detailStatus='ready';onChange?.();
  }).catch(()=>{if(token===detailToken){detailStatus='failed';onChange?.();}});
 }
 // Finer heights for one site, from the server: about 590 m between points over 300 km, or about
 // 270 m over 140 km within 10° of a pole. The mesh is rebuilt when they arrive. The far south
 // already has a 160 m grid in the browser, so nothing is fetched there.
 let fine=null,fineKey=null,fineToken=0,fineStatus='off';
 function loadFine(site,key,onReady){
  if(key===fineKey)return;
  fineKey=key;fine=null;fineStatus='off';const token=++fineToken;
  if(site.lat< -86.6)return;
  fineStatus='loading';
  fetch(`/api/terrain-patch?lat=${site.lat.toFixed(4)}&lon=${site.lon.toFixed(4)}`).then(async r=>{
   if(!r.ok)throw new Error('no patch');
   const n=Number(r.headers.get('X-Patch-N')),halfKm=Number(r.headers.get('X-Patch-Half-Km')),heights=new Int16Array(await r.arrayBuffer());
   if(token!==fineToken)return;if(!n||!halfKm||heights.length!==n*n)throw new Error('bad patch');
   fine={key,n,halfKm,heights,spacing:Number(r.headers.get('X-Patch-Spacing-M'))||Math.round(2000*halfKm/(n-1)),finest:Number(r.headers.get('X-Patch-Finest-Grid-M'))||null};
   fineStatus='ready';built=null;onReady?.(build(site));
  }).catch(()=>{if(token===fineToken){fineStatus='failed';onReady?.(null);}});
 }
 const frame={up:new THREE.Vector3(),north:new THREE.Vector3(),east:new THREE.Vector3()};
 function build(site){
  const sampler=shadows.sampler();if(!sampler)return null;
  const key=`${site.lat.toFixed(5)}:${site.lon.toFixed(5)}`;if(built?.key===key)return built;
  const lat=THREE.MathUtils.clamp(site.lat,-89.95,89.95),lon=site.lon,useFine=fine?.key===key;
  const polar=!useFine&&lat< -86.6,halfKm=useFine?fine.halfKm:polar?48:260,n=useFine?fine.n:polar?481:241;
  const up=new THREE.Vector3(...coordinatesToVector(lat,lon)),north=new THREE.Vector3(...skyDirection(lat,lon,0,0)),east=new THREE.Vector3(...skyDirection(lat,lon,90,0));
  const positions=new Float32Array(n*n*3),colors=new Float32Array(n*n*4),indices=new Uint32Array((n-1)*(n-1)*6),point=new THREE.Vector3();
  for(let j=0,v=0;j<n;j++)for(let i=0;i<n;i++,v++){
   const x=(i/(n-1)*2-1)*halfKm,y=(j/(n-1)*2-1)*halfKm;
   point.copy(up).addScaledVector(east,x/R_KM).addScaledVector(north,y/R_KM).normalize();
   const height=useFine?fine.heights[v]/1000:sampler(Math.asin(point.y)*DEG,Math.atan2(-point.z,point.x)*DEG);
   point.multiplyScalar(1+height/R_KM);positions.set([point.x,point.y,point.z],v*3);
   // Circular footprint with a soft edge, so the detailed ground blends into the globe.
   colors.set([1,1,1,THREE.MathUtils.smoothstep(1-Math.hypot(x,y)/halfKm,0,.3)],v*4);
  }
  for(let j=0,k=0;j<n-1;j++)for(let i=0;i<n-1;i++){const a=j*n+i,b=a+1,c=a+n,d=c+1;indices.set([a,b,c,b,d,c],k);k+=6;}
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,4));geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeVertexNormals();
  mesh.geometry.dispose();mesh.geometry=geometry;
  const radius=1+(useFine?patchHeight(fine.heights,n,(n-1)/2,(n-1)/2)/1000:sampler(lat,lon))/R_KM;center.copy(up).multiplyScalar(radius);
  frame.up.copy(up);frame.north.copy(north);frame.east.copy(east);
  built={key,polar,halfKm,radius,gridMeters:useFine?fine.spacing:polar?160:3800,fine:useFine,sourceGridMeters:useFine?fine.finest:null};
  return built;
 }
 return {
  material,
  build,
  loadDetail,
  loadFine,
  fineStatus:()=>fineStatus,
  // Radius (in Moon radii) of the ground under a direction from the Moon's center, from the mesh's own heights.
  groundRadius(direction){
   const sampler=shadows.sampler(),d=direction;
   if(built?.fine&&fine){const along=d.dot(frame.up);if(along>.2){const x=d.dot(frame.east)/along*R_KM/fine.halfKm,y=d.dot(frame.north)/along*R_KM/fine.halfKm;
     if(Math.abs(x)<=1&&Math.abs(y)<=1)return 1+patchHeight(fine.heights,fine.n,(x+1)/2*(fine.n-1),(y+1)/2*(fine.n-1))/1000/R_KM;}}
   const l=d.length()||1;return sampler?1+sampler(Math.asin(d.y/l)*DEG,Math.atan2(-d.z,d.x)*DEG)/R_KM:1;
  },
  detailStatus:()=>detailStatus,
  setMap(texture){material.map=texture;material.needsUpdate=true;},
  setLit(value){own.surfaceLit.value=value?1:0;own.surfaceFill.value=value?.12:.85;},
  // Fades in as the camera arrives; hidden whenever the camera is not above this site.
  update(camera,active){
   if(!active||!built){mesh.visible=false;return;}
   const fade=1-THREE.MathUtils.smoothstep(camera.position.distanceTo(center),.5,.8);
   mesh.visible=fade>0&&camera.position.dot(center)>center.lengthSq();material.opacity=fade;
  }
 };
}
