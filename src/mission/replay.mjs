// The Apollo 11 replay: a full-screen 3D view of the flight from the pad to the Moon and back.
//
// It runs in its own canvas and is loaded only when asked for, so the planning app is untouched by it.
// Where each vehicle is comes from apollo11.mjs (real times, Moon, Sun and third-stage path; the rest
// rebuilt between them). Distances are true: the scene is in kilometers, in the ICRF frame, with the
// origin moved to whatever the camera is watching so that a 3 m cabin and a 384,000 km route both draw
// cleanly. Vehicles are at true size close up, and enlarged (with a note saying so) when seen from far away.
import * as THREE from 'three';
import { add, sub, scale, dot, cross, norm, unit, lerp, smooth } from './orbit.mjs';
import { createMission, LAUNCH, T, END, START, R_EARTH, R_MOON, PAD, SITE, SPLASH } from './apollo11.mjs';
import { STEPS, SEGMENTS, GUIDED_TOTAL, guidedOf, timeOf, stepAt, cameraOf, elapsed } from './steps.mjs';
import * as models from './models.mjs';
import { capeCanvas } from './ground.mjs';
import './replay.css';

const RAD=Math.PI/180,m=x=>x/1000,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const sphere=(lat,lon)=>[Math.cos(lat*RAD)*Math.cos(lon*RAD),Math.cos(lat*RAD)*Math.sin(lon*RAD),Math.sin(lat*RAD)];
// ICRF (x, y, z with z north) to the scene (y up), and back. Body-fixed vectors map to mesh coordinates the same way.
const toScene=(v,out=new THREE.Vector3())=>out.set(v[0],v[2],-v[1]);
const fromScene=v=>[v.x,-v.z,v.y];
const SPEEDS=[['guided','Guided'],[1,'Real time'],[10,'10×'],[100,'100×'],[1000,'1,000×'],[10000,'10,000×']];
const VIEWS=[['guided','Guided'],['follow','Follow'],['onboard','Window'],['route','Whole route']];
const svg=d=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const ICON={play:svg('M8 5v14l11-7z'),pause:svg('M6 5h4v14H6zM14 5h4v14h-4z'),prev:svg('M6 6h2v12H6zM9.5 12l8.5 6V6z'),next:svg('M16 6h2v12h-2zM6 18l8.5-6L6 6z'),close:svg('M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z'),list:svg('M4 6h16v2H4zM4 11h16v2H4zM4 16h16v2H4z')};
const stamp=t=>{const d=new Date(LAUNCH+Math.round(t)*1000);   // rounded like the T+ clock, so the two never differ by a second
 return `${d.toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})}, 1969 · ${d.toISOString().slice(11,19)} UTC`;};
const round=x=>{const a=Math.abs(x),step=a>=100000?1000:a>=10000?100:a>=1000?10:1;return (a<10?Math.round(x*10)/10:Math.round(x/step)*step).toLocaleString('en-US');};

const TEMPLATE=`
 <canvas aria-label="3D view of the Apollo 11 flight. Drag to look around, scroll or pinch to zoom."></canvas>
 <div class="rp-labels" aria-hidden="true"></div>
 <svg class="rp-window" hidden viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="rp-window-wall" fill-rule="evenodd"/><path class="rp-window-edge"/></svg>
 <header class="rp-top">
  <div class="rp-title"><strong>Apollo 11</strong><span>July 16 to 24, 1969 · Earth to the Moon and back</span></div>
  <button class="rp-chip rp-about-btn" aria-expanded="false">What is real here?</button>
  <button class="rp-round rp-close" aria-label="Close the replay">${ICON.close}</button>
 </header>
 <section class="rp-panel rp-about" hidden>
  <p><b>Real.</b> The time of every event (NASA’s Apollo 11 timeline), the positions of the Moon and the Sun, and the path of the rocket’s third stage after its burn toward the Moon (JPL Horizons), which the spacecraft shared until it pulled away. The launch pad, landing site and splashdown point are the recorded ones.</p>
  <p><b>Rebuilt.</b> The paths between those anchors are calculated here as unpowered flight that passes through them at the published times. The speeds and heights on screen come from that reconstruction, so they are close, not exact.</p>
  <p><b>Drawn.</b> The vehicles are simplified original drawings made for this app with AI coding assistance. They are at true size close up, and enlarged when seen from far away; a note says when. The small thrusters fire where each maneuver calls for them, in a simplified pattern; the window frame, the sea and the splash are drawn too. Launch Complex 39A and the ground around it are drawn the same way, from the pad’s published layout, and are not a survey. The United States flag appears at the recorded time; its exact spot and the way it faces are chosen for the picture. No NASA footage, logos or markings are used.</p>
 </section>
 <p class="rp-scale" hidden></p>
 <p class="rp-loading">Loading the flight…</p>
 <aside class="rp-panel rp-steps" hidden><ol></ol></aside>
 <footer class="rp-bottom">
  <div class="rp-panel rp-caption" aria-live="polite">
   <div class="rp-step"><strong class="rp-step-title"></strong><span class="rp-count"></span></div>
   <p class="rp-text"></p>
   <p class="rp-numbers" title="From the reconstructed flight path"></p>
  </div>
  <div class="rp-panel rp-bar">
   <div class="rp-track"><div class="rp-ticks"></div><input class="rp-seek" type="range" min="0" max="${GUIDED_TOTAL}" step="0.01" value="0" aria-label="Position in the flight"></div>
   <div class="rp-row">
    <button class="rp-round rp-prev" aria-label="Previous step">${ICON.prev}</button>
    <button class="rp-round rp-play" aria-label="Play">${ICON.play}</button>
    <button class="rp-round rp-next" aria-label="Next step">${ICON.next}</button>
    <div class="rp-clock"><b class="rp-get"></b><span class="rp-utc"></span></div>
    <button class="rp-chip rp-list" aria-expanded="false" aria-label="List of steps">${ICON.list}<span>Steps</span></button>
    <label class="rp-select"><span>Speed</span><select class="rp-speed" aria-label="Playback speed">${SPEEDS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>
    <label class="rp-select"><span>Camera</span><select class="rp-view" aria-label="Camera">${VIEWS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>
    <label class="rp-check" title="Stop at the start of each step until you press play"><input type="checkbox" class="rp-stop"><span>Stop at each step</span></label>
   </div>
  </div>
 </footer>`;

// A finely divided patch of a globe around one point, so that things standing on the surface really touch
// it (the facets of the whole globe sag as much as 2 km below a true sphere). Built around its own center
// to keep the numbers small, and given the globe's texture coordinates so it carries the same picture.
function cap(center,R,spread,material,rings=48,around=64,local=0){
 const c=unit(center),e=unit(cross(Math.abs(c[2])<.9?[0,0,1]:[1,0,0],c)),n=cross(c,e),pos=[],uv=[],nor=[],idx=[];
 for(let i=0;i<=rings;i++){
  const rho=spread*(i/rings)**2;
  for(let j=0;j<=around;j++){
   const a=j/around*2*Math.PI,d=add(scale(c,Math.cos(rho)),scale(add(scale(e,Math.cos(a)),scale(n,Math.sin(a))),Math.sin(rho))),p=scale(sub(d,c),R);
   pos.push(p[0],p[2],-p[1]);nor.push(d[0],d[2],-d[1]);
   // Either the globe's own picture coordinates, or a flat picture local km across with east to the right and north up.
   if(local)uv.push(.5+R*Math.sin(rho)*Math.cos(a)/local,.5+R*Math.sin(rho)*Math.sin(a)/local);else uv.push((Math.atan2(d[1],d[0])/Math.PI+1)/2,Math.asin(clamp(d[2],-1,1))/Math.PI+.5);
  }
 }
 for(let i=0;i<rings;i++)for(let j=0;j<around;j++){const a=i*(around+1)+j,b=a+around+1;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
 const mesh=new THREE.Mesh(g,material);toScene(scale(c,R),mesh.position);return mesh;
}
// Small craters and speckle to lay over the ground around the landing site, where the Moon picture runs out of detail. Illustrative.
function groundDetail(){
 const size=1024,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const c=canvas.getContext('2d');
 let seed=11;const rand=()=>(seed=(seed*1664525+1013904223)%4294967296)/4294967296;
 for(let i=0;i<5200;i++){c.fillStyle=`rgba(${rand()<.5?'0,0,0':'255,255,255'},${.03+rand()*.07})`;c.fillRect(rand()*size,rand()*size,1+rand()*2.5,1+rand()*2.5);}
 for(let i=0;i<420;i++){
  const x=rand()*size,y=rand()*size,r=1.5+rand()**3*34;
  c.fillStyle=`rgba(0,0,0,${.1+rand()*.12})`;c.beginPath();c.arc(x,y,r,0,7);c.fill();
  c.strokeStyle='rgba(255,255,255,.13)';c.lineWidth=Math.max(1,r*.16);c.beginPath();c.arc(x,y,r,-.4,2.2);c.stroke();
 }
 const fade=c.createRadialGradient(size/2,size/2,size*.2,size/2,size/2,size/2);fade.addColorStop(0,'#000');fade.addColorStop(1,'rgba(0,0,0,0)');
 c.globalCompositeOperation='destination-in';c.fillStyle=fade;c.fillRect(0,0,size,size);
 return models.keptTexture(canvas);
}

// A patch of open sea that repeats without a seam: swell and ripples as lighter and darker blue, with a few whitecaps.
function waveTexture(){
 const size=256,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const c=canvas.getContext('2d'),image=c.createImageData(size,size);
 const waves=[[1,2,1,.3],[2,-1,.8,1.7],[3,1,.55,4.1],[1,-3,.5,2.2],[4,2,.38,.9],[5,-3,.3,5.3],[7,1,.22,3.3],[2,6,.2,1.1],[9,-4,.14,2.9],[6,8,.12,.4]],total=waves.reduce((sum,w)=>sum+w[2],0);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let h=0;for(const [kx,ky,a,ph] of waves)h+=a*Math.sin(2*Math.PI*(kx*x+ky*y)/size+ph);
  h/=total*.62;const k=clamp(.5+.5*h,0,1),foam=smooth((h-.93)/.07)*.7,i=(y*size+x)*4;
  image.data[i]=29+34*k+170*foam;image.data[i+1]=76+52*k+140*foam;image.data[i+2]=124+54*k+100*foam;image.data[i+3]=255;
 }
 c.putImageData(image,0,0);
 const texture=models.keptTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;return texture;
}

export async function openReplay(onClose){
 if(document.getElementById('replay'))return;
 const root=document.createElement('div');root.id='replay';root.className='replay';root.setAttribute('role','dialog');root.setAttribute('aria-label','Apollo 11 mission replay');root.innerHTML=TEMPLATE;document.body.appendChild(root);
 const $=s=>root.querySelector(s),cleanups=[];
 let closed=false,raf=0,renderer=null,scene=null;
 function close(){
  if(closed)return;closed=true;cancelAnimationFrame(raf);cleanups.forEach(f=>f());
  if(renderer){scene?.traverse(o=>{o.geometry?.dispose();for(const mt of [].concat(o.material||[])){mt.map?.dispose();mt.dispose();}});renderer.dispose();renderer.forceContextLoss?.();}
  root.remove();onClose?.();
 }
 $('.rp-close').onclick=close;
 const fail=text=>{$('.rp-loading').textContent=text;$('.rp-bottom').hidden=true;};
 let data;
 try{const r=await fetch('/assets/apollo11.json');if(!r.ok)throw new Error(String(r.status));data=await r.json();}
 catch{fail('The flight data did not load. Check the connection, close this and try again.');return;}
 if(closed)return;
 const canvas=$('canvas');
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,logarithmicDepthBuffer:true,powerPreference:'high-performance'});}
 catch{fail('This browser could not start 3D graphics, so the replay cannot be shown here.');return;}
 const mission=createMission(data);
 const moonVel=t=>scale(sub(mission.moon(t+30),mission.moon(t-30)),1/60);
 const spin=X=>norm(X)<20000?[-7.2921e-5*X[1],7.2921e-5*X[0],0]:[0,0,0];           // how fast the turning Earth carries a point near it
 const A_TLI=unit(mission.craftVelocity(T.tliOff)),D_TEI=unit(sub(mission.craftVelocity(T.teiOff+600),moonVel(T.teiOff+600)));

 // ---------- Scene ----------
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 scene=new THREE.Scene();scene.background=new THREE.Color(0);
 const camera=new THREE.PerspectiveCamera(45,1,.0003,3e7);
 const sunLight=new THREE.DirectionalLight(0xffffff,4.2);scene.add(sunLight,sunLight.target,new THREE.AmbientLight(0xffffff,.45));
 const loader=new THREE.TextureLoader();
 let awakeUntil=0;const wake=()=>{awakeUntil=performance.now()+2500;};

 const starPoints=new Float32Array(2600*3);{let seed=7;const rand=()=>(seed=(seed*1664525+1013904223)%4294967296)/4294967296;for(let i=0;i<2600;i++){const z=rand()*2-1,a=rand()*2*Math.PI,r=Math.sqrt(1-z*z);starPoints.set([r*Math.cos(a),z,r*Math.sin(a)],i*3);}}
 const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(starPoints,3));
 const stars=new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0xffffff,size:1.5,sizeAttenuation:false,depthTest:false,depthWrite:false}));stars.renderOrder=-10;stars.frustumCulled=false;stars.scale.setScalar(1e6);scene.add(stars);

 const earth=new THREE.Group(),earthMaterial=new THREE.MeshStandardMaterial({color:0x27466f,roughness:1,metalness:0});
 earth.add(new THREE.Mesh(new THREE.SphereGeometry(R_EARTH,128,64),earthMaterial));
 loader.load('/assets/earth-blue-marble-2k.jpg',texture=>{if(closed)return texture.dispose();texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;earthMaterial.map=texture;earthMaterial.color.set(0xffffff);earthMaterial.needsUpdate=true;wake();});
 const padUnit=sphere(PAD.lat,PAD.lon),splashUnit=sphere(SPLASH.lat,SPLASH.lon),siteUnit=sphere(SITE.lat,SITE.lon),UP=new THREE.Vector3(0,1,0);
 const seaMaterial=new THREE.MeshStandardMaterial({color:0x2a5f93,roughness:.55,metalness:0,emissive:0x16446f,emissiveIntensity:0});
 earth.add(cap(padUnit,R_EARTH,3*RAD,earthMaterial),cap(splashUnit,R_EARTH,3*RAD,seaMaterial));
 // Launch Complex 39A: the pad and tower, set with east, up and south along its own axes, on drawn ground laid over
 // the globe at three sizes (200, 24 and 3.2 km across) so it is sharp from the pad and still fits the coast from high up.
 // Open sea at the splashdown point: a repeating picture of swell that drifts slowly, shown from low down.
 const waves=waveTexture(),waveMaterial=new THREE.MeshStandardMaterial({map:waves,bumpMap:waves,bumpScale:.7,roughness:.32,metalness:0,emissive:0x12395e,emissiveIntensity:0,transparent:true,depthWrite:false});
 const swell=cap(splashUnit,R_EARTH+.0003,14/R_EARTH,waveMaterial,44,72,.13);swell.renderOrder=-2;earth.add(swell);
 const padEast=unit(cross([0,0,1],padUnit)),padNorth=cross(padUnit,padEast);
 const padFrame=new THREE.Group();toScene(scale(padUnit,R_EARTH),padFrame.position);padFrame.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(toScene(padEast),toScene(padUnit),toScene(scale(padNorth,-1))));
 const complex=models.launchComplex();complex.scale.setScalar(.001);padFrame.add(complex);earth.add(padFrame);
 const padGround=[200,24,3.2].map((size,i)=>{
  const material=new THREE.MeshStandardMaterial({map:models.keptTexture(capeCanvas(size)),roughness:1,metalness:0,transparent:true,depthWrite:false}),patch=cap(padUnit,R_EARTH+.0008*(i+1),size/2/R_EARTH,material,40,64,size);
  patch.renderOrder=i-3;earth.add(patch);return patch;   // before flames and other see-through things, so they show in front of the ground
 });
 // A thin blue rim of air, seen from space.
 const air=new THREE.Mesh(new THREE.SphereGeometry(R_EARTH*1.015,96,48),new THREE.ShaderMaterial({side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{sunDir:{value:new THREE.Vector3(1,0,0)},strength:{value:1}},
  vertexShader:`#include <common>\n#include <logdepthbuf_pars_vertex>\nvarying vec3 vWorld;varying vec3 vNormalView;varying vec3 vToCamera;\nvoid main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vWorld=normalize(mat3(modelMatrix)*normal);vNormalView=normalize(normalMatrix*normal);vToCamera=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;\n#include <logdepthbuf_vertex>\n}`,
  fragmentShader:`#include <common>\n#include <logdepthbuf_pars_fragment>\nuniform vec3 sunDir;uniform float strength;varying vec3 vWorld;varying vec3 vNormalView;varying vec3 vToCamera;\nvoid main(){\n#include <logdepthbuf_fragment>\nfloat rim=smoothstep(0.0,0.19,-dot(normalize(vNormalView),normalize(vToCamera)));float day=clamp(dot(normalize(vWorld),sunDir)*1.6+0.35,0.0,1.0);gl_FragColor=vec4(vec3(0.32,0.58,1.0)*rim*day*strength,1.0);}`}));
 earth.add(air);
 // The same air seen from above: a faint blue cast over the daylit side, strongest toward the edge.
 const haze=new THREE.Mesh(new THREE.SphereGeometry(R_EARTH*1.004,96,48),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:air.material.uniforms,vertexShader:air.material.vertexShader,
  fragmentShader:`#include <common>\n#include <logdepthbuf_pars_fragment>\nuniform vec3 sunDir;uniform float strength;varying vec3 vWorld;varying vec3 vNormalView;varying vec3 vToCamera;\nvoid main(){\n#include <logdepthbuf_fragment>\nfloat edge=1.0-clamp(dot(normalize(vNormalView),normalize(vToCamera)),0.0,1.0);float day=clamp(dot(normalize(vWorld),sunDir)*1.4+0.15,0.0,1.0);gl_FragColor=vec4(vec3(0.20,0.42,0.85)*(0.16+0.75*edge*edge*edge)*day*strength,1.0);}`}));
 earth.add(haze);scene.add(earth);

 const moon=new THREE.Group(),moonMaterial=new THREE.MeshStandardMaterial({color:0x77767a,roughness:1,metalness:0});
 moon.add(new THREE.Mesh(new THREE.SphereGeometry(R_MOON,192,96),moonMaterial),cap(siteUnit,R_MOON,4*RAD,moonMaterial));
 loader.load('/assets/moon-lroc-8k.jpg',texture=>{
  if(closed)return texture.dispose();
  // Phones get a half-size copy: the planning app already holds the full picture in graphics memory.
  if(Math.min(window.innerWidth,window.innerHeight)<700&&texture.image.width>4096){const c=document.createElement('canvas'),image=texture.image;c.width=4096;c.height=2048;c.getContext('2d').drawImage(image,0,0,4096,2048);texture.dispose();texture=new THREE.CanvasTexture(c);
   const smaller=texture;canvas.addEventListener('webglcontextrestored',()=>{c.getContext('2d').drawImage(image,0,0,4096,2048);smaller.needsUpdate=true;});}   // the copy is redrawn if the browser resets its graphics
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;moonMaterial.map=texture;moonMaterial.color.set(0xffffff);moonMaterial.needsUpdate=true;wake();});
 const siteFrame=new THREE.Group();toScene(scale(siteUnit,R_MOON),siteFrame.position);siteFrame.quaternion.setFromUnitVectors(UP,toScene(siteUnit));
 const detail=new THREE.Mesh(new THREE.CircleGeometry(1.2,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:groundDetail(),transparent:true,depthWrite:false}));detail.position.y=.0002;detail.renderOrder=-1;siteFrame.add(detail);moon.add(siteFrame);
 scene.add(moon);

 // ---------- Route lines ----------
 const inertial=new THREE.Group();scene.add(inertial);const lines=[];
 function path(points,color,opacity,parent){
  const a=new Float32Array(points.length*3);points.forEach((p,i)=>{a[i*3]=p[0];a[i*3+1]=p[2];a[i*3+2]=-p[1];});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));
  const line=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false}));line.frustumCulled=false;line.userData.base=opacity;parent.add(line);lines.push(line);return line;
 }
 const range=(a,b,step)=>{const out=[];for(let x=a;x<b;x+=step)out.push(x);return out;};
 const outTimes=[...range(0,T.orbit,6),...range(T.orbit,3*3600,40),...range(3*3600,T.loiOn-7200,900),...range(T.loiOn-7200,T.loiOn,60),T.loiOn];
 const backTimes=[...range(T.teiOn,T.teiOn+7200,60),...range(T.teiOn+7200,T.entry-7200,900),...range(T.entry-7200,T.entry,40),...range(T.entry,T.splash,5),T.splash];
 const outPoints=outTimes.map(mission.craft),backPoints=backTimes.map(mission.craft);
 path(outPoints,0x4da3ff,.3,inertial);path(backPoints,0xff9f0a,.3,inertial);
 const outDone=path(outPoints,0x6db4ff,1,inertial),backDone=path(backPoints,0xffb340,1,inertial);
 // The Moon's own orbit: one whole lap around the Earth, as a single even ring (a second, brighter line over the days of the
 // flight read as two orbits). It belongs to the wide views only; close to the Moon it would read as a stray line running out of it.
 const lap=(data.orbit?.length?data.orbit:data.moon).map(r=>r.slice(1,4));
 // The Moon's path is not a closed curve: after one lap it misses its starting point by about 7,600 km. The two ends are eased
 // together over the far side of the ring, away from the days of the flight, where the line stays exactly on the Moon's path.
 if(data.orbit?.length){const N=lap.length,gap=sub(lap[N-1],lap[0]),k=Math.floor(N*.15);for(let i=0;i<k;i++){const w=.5*(1-smooth(i/k));lap[i]=add(lap[i],scale(gap,w));lap[N-1-i]=sub(lap[N-1-i],scale(gap,w));}}
 const moonLap=[path(lap,0xb4b4ba,.6,inertial)];
 // Around the Moon the lines are fixed to the Moon, which turns and travels while the ships circle it.
 const west=scale(unit(cross([0,0,1],siteUnit)),-1),moonFixed=(X,t)=>{const M=mission.moonToIcrf(t),v=sub(X,mission.moon(t));return [0,1,2].map(i=>M[0][i]*v[0]+M[1][i]*v[1]+M[2][i]*v[2]);};
 path(range(0,2*Math.PI+.01,Math.PI/90).map(a=>scale(add(scale(siteUnit,Math.cos(a)),scale(west,Math.sin(a))),R_MOON+111)),0xffffff,.32,moon);
 path(range(T.doi,T.landing+1,20).map(t=>moonFixed(mission.lander(t),t)),0x64d2ff,.75,moon);
 path(range(T.lmLiftoff,T.redock,60).map(t=>moonFixed(mission.lander(t),t)),0x30d158,.6,moon);

 // ---------- Vehicles ----------
 const V={sIC:models.firstStage(),sII:models.secondStage(),sIVB:models.thirdStage(),tower:models.escapeTower(),sm:new THREE.Group(),cm:new THREE.Group(),lmD:new THREE.Group(),lmA:new THREE.Group(),crew:models.astronauts()};
 const ship=models.commandShip();ship.userData.service.position.y=-models.CSM_LENGTH/2;V.sm.add(ship.userData.service);ship.userData.command.position.y=0;V.cm.add(ship.userData.command);
 const chutes=models.parachutes();chutes.position.y=models.SIZE.command;V.cm.add(chutes);
 const glow=ship.userData.command.userData.glow;glow.material.side=THREE.DoubleSide;
 const trail=models.plume(2.5,36,0xff8a3c);trail.rotation.x=Math.PI;trail.position.y=.3;V.cm.add(trail);
 const lm=models.lunarModule();V.lmD.add(lm.userData.descent);V.lmA.add(lm.userData.ascent);
 const shipJets=ship.userData.jets,cabinJets=ship.userData.cabinJets,lmJets=lm.userData.jets,stageJets=V.sIVB.userData.aps,bags=ship.userData.command.userData.bags;
 // The splash: two rings of foam spreading on the water and a short column of spray.
 // The flag planted during the moonwalk, a few meters from the lander; it stays when the crew leave.
 V.flag=new THREE.Group();{const planted=models.flag();planted.position.set(5.6,0,5);planted.rotation.y=-.88;V.flag.add(planted);}   // turned to face the guided camera
 V.sea=new THREE.Group();
 const foam=[0,1].map(()=>{const ring=new THREE.Mesh(new THREE.RingGeometry(.8,1,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));ring.position.y=.15;V.sea.add(ring);return ring;});
 const spray=models.plume(2.4,8,0xffffff);spray.rotation.x=Math.PI;V.sea.add(spray);
 for(const o of Object.values(V)){o.userData.p=[0,0,0];scene.add(o);}
 const flames=[];
 const burn=(plume,on)=>{plume.visible=on;if(on)flames.push(plume);};

 // ---------- State ----------
 let t=START,playing=false,speed='guided',view='guided',stopAtSteps=false,stepIndex=-1,seeking=false,last=performance.now(),jumped=true;
 const cam={az:78,el:3,dist:.4},user={az:0,el:0,zoom:1};
 let castOff=null,camPos=null,camTrack='craft',camRel=[0,0,0],frameDt=0;const scales={};
 let lastFocus=null,lastKey='',lag0=[0,0,0],lagClock=9,frameUp=null,frameFwd=null,origin=[0,0,0];
 const held=new Map(),basisMatrix=new THREE.Matrix4(),bx=new THREE.Vector3(),by=new THREE.Vector3(),bz=new THREE.Vector3(),tq=new THREE.Quaternion(),tv=new THREE.Vector3();
 const FLIP=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI),XAXIS=new THREE.Vector3(1,0,0),YAXIS=new THREE.Vector3(0,1,0);
 // A turn that points the model's nose (+y) along `nose` and its front (+x) as near to `hint` as it can.
 function basis(nose,hint,alt){
  let x=sub(hint,scale(nose,dot(hint,nose)));
  if(norm(x)<.15){x=sub(alt,scale(nose,dot(alt,nose)));if(norm(x)<.15){x=cross(nose,[0,0,1]);if(norm(x)<.1)x=cross(nose,[1,0,0]);}}
  x=unit(x);const z=cross(x,nose);
  basisMatrix.makeBasis(toScene(x,bx),toScene(nose,by),toScene(z,bz));return new THREE.Quaternion().setFromRotationMatrix(basisMatrix);
 }
 // Vehicles turn at a believable rate instead of snapping: about twelve seconds of mission time to settle.
 let dtm=0;
 function settle(key,target){
  let q=held.get(key);
  if(!q||jumped||Math.abs(dtm)>90){if(!q){q=new THREE.Quaternion();held.set(key,q);}q.copy(target);return q;}
  q.slerp(target,1-Math.exp(-Math.abs(dtm)/12));return q;
 }
 const keep=(key,q)=>{let h=held.get(key);if(!h){h=new THREE.Quaternion();held.set(key,h);}h.copy(q);return h;};
 const axis=(q,i)=>fromScene(tv.set(i===0?1:0,i===1?1:0,i===2?1:0).applyQuaternion(q));
 const tumble=(q,angle)=>q.clone().multiply(tq.setFromAxisAngle(XAXIS,angle));
 function set(obj,pos,q,s,visible=true){obj.visible=visible;if(!visible)return;obj.userData.p=pos;obj.quaternion.copy(q);obj.scale.setScalar(s/1000);}

 // Where everything is at time t. Positions are km in the ICRF frame; they are moved to the camera's origin afterward.
 function layout(){
  flames.length=0;
  const P=mission.craft(t),Vc=mission.craftVelocity(t),mo=mission.moon(t),mv=moonVel(t),M=mission.moonToIcrf(t),north=[M[0][2],M[1][2],M[2][2]];
  const wM=smooth((100000-norm(sub(P,mo)))/60000);
  // Local up, the direction of travel over the ground, and velocity relative to the body nearby.
  const frameAt=(X,Vx)=>{
   const up=unit(lerp(unit(X),unit(sub(X,mo)),wM)),rel=sub(Vx,add(scale(mv,wM),scale(spin(X),1-wM)));
   const flat=sub(rel,scale(up,dot(rel,up))),fallback=wM>.5?unit(cross(up,north)):unit(cross([0,0,1],up)),k=clamp(norm(flat)/.05,0,1);
   const mixed=add(scale(fallback,1-k),scale(unit(flat),k));
   return {up,rel,fwd:unit(sub(mixed,scale(up,dot(mixed,up))))};
  };
  const fc=frameAt(P,Vc),site=mission.site(t),upS=unit(sub(site,mo)),westS=unit(cross(upS,north));
  const Lr=mission.lander(t),fl=Lr?frameAt(Lr,mission.landerVelocity(t)):null;
  // How much larger than life to draw a vehicle so it can be seen from where the camera is. The camera rides with
  // whatever it watches, so its place this frame is that thing's new position plus last frame's offset; measuring from
  // last frame's position instead would count the distance the vehicle has flown since, which at speed is far more
  // than the camera's own distance. The factor is eased so it never jumps, and capped so nothing pokes into the ground.
  const anchors={craft:P,lander:Lr??P,site},eye=!camPos?null:camTrack==='fixed'?camPos:add(anchors[camTrack],camRel);
  const enlarge=(key,X,len)=>{
   const alt=Math.min(norm(X)-R_EARTH,norm(sub(X,mo))-R_MOON),cap=Math.max(1,Math.min(.5*alt,2500)/len),want=eye?clamp(norm(sub(X,eye))*.04/len,1,cap):1;
   const was=scales[key],now=jumped||!was?want:Math.exp(Math.log(was)+(Math.log(want)-Math.log(was))*(1-Math.exp(-frameDt/.3)));
   scales[key]=now;return Math.min(now,cap);
  };
  const lenC=t<T.sicSep?.11:t<T.siiSep?.07:t<T.csmSep?.036:t<T.cmSep?.021:t>T.drogue+48&&t<T.splash?.04:.008;
  const sC=enlarge('craft',P,lenC),sL=Lr?enlarge('lander',Lr,.01):sC;

  // The launch vehicle points the way it is moving through the air: straight up off the pad, leaning over as the path
  // curves, level by the time it reaches orbit. After the burn toward the Moon it holds that direction. Every stage is
  // placed and turned along this one line, so the stack stays straight while it leans.
  const vhat=unit(Vc),upP=unit(P),air=sub(Vc,spin(P)),climb=norm(air)>.003?unit(air):upP;
  const A=t<=0?upP:t<T.orbit?unit(lerp(unit(lerp(upP,climb,smooth(t/4))),vhat,smooth((t-(T.orbit-120))/120))):t<T.tliOff?vhat:A_TLI,Q=unit(cross(A,[0,0,1]));
  const stackQ=keep('stack',basis(A,[0,0,1],[1,0,0]));
  const vMoon=unit(sub(Vc,mv));
  // The command ship: hC is its center, in meters up the stack; after the turnaround it is nose to nose with the lander.
  let hC,nose;
  if(t<T.csmSep){hC=97.2;nose=A;}
  else if(t<T.dock){const u=(t-T.csmSep)/(T.dock-T.csmSep),turn=Math.PI*smooth((u-.2)/.4);hC=u<.2?97.2+30*smooth(u/.2):u<.6?127.2:127.2-29.65*smooth((u-.6)/.4);nose=add(scale(A,Math.cos(turn)),scale(Q,Math.sin(turn)));}
  else{hC=97.55+(t<T.lmEject?0:150*smooth((t-T.lmEject)/900));nose=t<T.loiOn-3600?scale(A_TLI,-1):t<T.undock+600?scale(vMoon,-1):t<T.teiOff+600?vMoon:D_TEI;}
  // The point the flight path describes moves from 60 m up the stack to the command ship itself once the two part from the third stage.
  const kRef=t<T.lmEject?0:smooth((t-T.lmEject)/(T.evade-T.lmEject)),offC=(hC-60)*(1-kRef),hS=offC-(hC-72.6);
  const along=h=>add(P,scale(A,m(h)*sC)),Cc=along(offC);
  const drop=(obj,when,h,life,v,a)=>{const tau=t-when;if(tau>life){obj.visible=false;return;}set(obj,tau>0?add(along(h-60),scale(A,-(v*tau+a*tau*tau)*sC)):along(h-60),tau>0?tumble(stackQ,.025*tau):stackQ,sC);};
  drop(V.sIC,T.sicSep,0,110,.02,.004);drop(V.sII,T.siiSep,42.1,100,.015,.003);
  {const tau=t-T.tower;if(tau>30)V.tower.visible=false;else set(V.tower,tau>0?add(along(40.8),scale(add(scale(A,.12*tau),scale(Q,.07*tau)),sC)):along(40.8),tau>0?tumble(stackQ,.2*tau):stackQ,sC);}
  if(t<T.evade)set(V.sIVB,along(hS),stackQ,sC);
  else{const SV=mission.stage(t),gone=smooth((t-T.evade-3600)/1800);if(!SV||gone>=1)V.sIVB.visible=false;else{const sS=enlarge('stage',SV,.02)*(1-.999*gone);set(V.sIVB,add(SV,scale(A_TLI,m(-174.95)*Math.min(sS,40)*(1-smooth((t-T.evade)/1800)))),stackQ,sS);}}
  {const tau=t-T.csmSep;for(const p of V.sIVB.userData.panels){const a=p.userData.angle,fly=Math.max(0,tau-12);p.visible=tau<70;p.quaternion.setFromAxisAngle(tv.set(Math.cos(a),0,-Math.sin(a)),clamp(tau*.06,0,1.1));p.position.set(Math.sin(a)*fly*1.5,models.SIZE.sIVB+fly*.8,Math.cos(a)*fly*1.5);}}
  burn(V.sIC.userData.plume,t>-5&&t<T.sicCutoff);burn(V.sII.userData.plume,t>T.sicSep+1.2&&t<T.siiCutoff);burn(V.sIVB.userData.plume,(t>T.siiSep+2&&t<T.orbit)||(t>=T.tliOn&&t<T.tliOff));

  const csmQ=t<T.csmSep?keep('csm',stackQ):settle('csm',basis(nose,fc.up,[0,0,1])),yC=axis(csmQ,1);
  {const tau=t-T.cmSep;set(V.sm,tau>0?add(Cc,scale(D_TEI,-(.0004*tau+.000004*tau*tau)*sC)):Cc,csmQ,sC,tau<400);}
  burn(ship.userData.plume,(t>=T.loiOn&&t<T.loiOff)||(t>=T.circular&&t<T.circular+17)||(t>=T.teiOn&&t<T.teiOff));
  let cmQ,cmPos;
  if(t<T.cmSep){cmQ=keep('cm',csmQ);cmPos=add(Cc,scale(yC,m(3.6)*sC));}
  else if(t<T.splash){cmQ=settle('cm',basis(t<T.drogue?scale(unit(sub(Vc,spin(P))),-1):fc.up,fc.up,[0,0,1]));cmPos=add(Cc,scale(yC,m(3.6)*sC*(1-smooth((t-T.cmSep)/200))));}
  else{const w=t-T.splash,side=cross(fc.fwd,fc.up);   // afloat: rocking and bobbing on the swell
   cmQ=keep('cm',basis(unit(add(fc.up,add(scale(fc.fwd,.08*Math.sin(1.1*w)),scale(side,.06*Math.cos(.8*w))))),fc.fwd,[0,0,1]));cmPos=add(Cc,scale(fc.up,m(.14*Math.sin(1.4*w)-.25)));}
  set(V.cm,cmPos,cmQ,sC);
  // The parachutes open in ten seconds; at splashdown they fall over into the water and are let go.
  const wet=t-T.splash;
  chutes.visible=t>T.drogue+48&&wet<40;
  if(chutes.visible){const open=Math.max(.05,smooth((t-T.drogue-48)/10));const sunk=smooth((wet-14)/24);chutes.scale.set(open*(1-.45*sunk),open*(1-.82*smooth(wet/9)),open*(1-.45*sunk));chutes.rotation.x=-1.46*smooth(wet/7);}   // they fall over away from the guided camera, flatten and sink
  bags.visible=wet>12;
  set(V.sea,mission.splashPoint(t),basis(fc.up,fc.fwd,[0,0,1]),1,wet>0&&wet<26);
  if(V.sea.visible){foam.forEach((ring,i)=>{const age=wet-i*1.2;ring.visible=age>0;ring.scale.setScalar(3+(22-6*i)*smooth(age/(7+3*i)));ring.material.opacity=.75*(1-smooth(age/(10+4*i)));});spray.scale.set(1,Math.max(.05,1-wet/1.8),1);burn(spray,wet<1.8);}
  glow.material.opacity=.85*smooth((t-T.entry-15)/40)*(1-smooth((t-(T.drogue-170))/60));glow.visible=glow.material.opacity>.01;trail.material.opacity=.8*glow.material.opacity;burn(trail,glow.visible);

  // The lunar module: inside the adapter, docked to the command ship's nose, or flying its own path.
  const docked=(t>=T.dock&&t<T.undock)||(t>=T.redock&&t<T.lmJettison),split=t>=T.lmLiftoff,dockOff=scale(yC,m(12.65)*sC);
  // The camera aims a little forward of the command ship while the lander is on its nose. That aim point slides over two
  // minutes on either side of each docking and parting, so the pair never lurches on the screen.
  const span=(a,b)=>smooth((t-(a-120))/120)*(1-smooth((t-b)/120)),joined=Math.max(span(T.dock,T.undock),span(T.redock,T.lmJettison));
  if(t<T.lmJettison)castOff=null;
  let lmPos,lmQ,lmS=sC;
  if(t<T.dock){lmPos=along(hS+12.3);lmQ=keep('lm',stackQ);}
  else if(docked){lmPos=add(Cc,dockOff);lmQ=keep(split?'lmA':'lm',tq.copy(csmQ).multiply(FLIP));}
  else if(t<T.doi||!Lr){
   // Undocked: Eagle backs away a few meters still facing the way it was docked, turns once, slowly, in front of
   // Columbia's windows, then drifts off below, and only much later swings round, unhurried, to fly engine first
   // for the descent burn.
   const retro=scale(vMoon,-1),since=t-T.undock,back=10*smooth(since/90)*(1-smooth((t-(T.doi-900))/600));
   lmPos=add(Cc,scale(add(scale(retro,m(12.65+back)),scale(fc.up,-.03*smooth((since-480)/600))),sC));
   const hold=basis(retro,fc.up,[0,0,1]).multiply(FLIP).multiply(tq.setFromAxisAngle(YAXIS,2*Math.PI*smooth((since-90)/360)));
   lmQ=keep('lm',hold.slerp(basis(retro,scale(fc.up,-1),fc.fwd),smooth((since-900)/(T.doi-420-T.undock-900))));
  }
  else{
   const rel=unit(fl.rel),upL=fl.up;lmS=sL;
   if(t<T.pdi){lmPos=add(Lr,scale(add(scale(rel,-m(12.65)),scale(upL,-.03)),(1-smooth((t-T.doi)/900))*sL));lmQ=settle('lm',basis(scale(rel,-1),scale(upL,-1),fl.fwd));}
   else if(t<T.landing){const s=(t-T.pdi)/(T.landing-T.pdi);lmPos=Lr;lmQ=settle('lm',basis(unit(lerp(scale(rel,-1),upL,smooth(s)**1.5)),unit(lerp(scale(upL,-1),fl.fwd,smooth((s-.3)/.3))),fl.fwd));}
   else if(t<T.lmLiftoff){lmPos=Lr;lmQ=settle('lm',basis(upS,westS,north));}
   else if(t<T.lmOrbit){const s=(t-T.lmLiftoff)/(T.lmOrbit-T.lmLiftoff);lmPos=Lr;lmQ=settle('lmA',basis(unit(lerp(upL,rel,smooth(s*1.3))),fl.fwd,westS));}
   else if(t<T.redock){
    // The last stretch before docking: Eagle turns to face Columbia's nose and eases into the very spot and size it
    // holds once docked, so nothing snaps at the moment the two join.
    const far=add(Lr,scale(dockOff,smooth((t-(T.redock-1800))/1800))),w=smooth((t-(T.redock-180))/180);
    lmPos=w>0?lerp(far,add(Cc,dockOff),w):far;lmS=sL+(sC-sL)*w;
    lmQ=settle('lmA',w>0?tq.copy(csmQ).multiply(FLIP):basis(rel,upL,north));
   }
   else{
    // Cast off: springs push the lander off the nose at walking pace (about 0.6 m/s), along the way the ship was pointing then.
    if(!castOff)castOff=yC;
    lmPos=add(Lr,scale(castOff,m(12.65)*sC+m(.6*Math.min(t-T.lmJettison,900))));lmQ=held.get('lmA')??keep('lmA',tq.copy(csmQ).multiply(FLIP));
   }
  }
  if(!split)keep('lmA',lmQ);
  lmQ=lmQ.clone();
  set(V.lmA,lmPos,lmQ,lmS);
  if(split)set(V.lmD,site,settle('lm',basis(upS,westS,north)),1);else set(V.lmD,lmPos,lmQ,lmS);
  for(const leg of lm.userData.legs){leg.scale.x=.55+.45*smooth((t-T.lmEject-200)/200);if(leg.userData.probe)leg.userData.probe.visible=t>T.lmEject+400&&t<T.landing;}
  // The small thrusters. A steady firing where a ship moves off, closes in or settles its propellant before a burn;
  // short bursts, in a fixed pseudo-random pattern, where it is holding or changing its attitude.
  {const within=(a,b)=>t>=a&&t<b,slow=Math.abs(dtm)<40,chance=(n,i)=>{const x=Math.sin(n*12.9898+i*78.233)*43758.5453;return x-Math.floor(x);},burst=(i,period,share)=>slow&&share>0&&chance(Math.floor(t/period),i)<share;
   const u=(t-T.csmSep)/(T.dock-T.csmSep),turnOn=u>.2&&u<.25,turnOff=u>.55&&u<.6,closing=within(T.dock-40,T.dock)||within(T.redock-40,T.redock);
   const ahead=within(T.csmSep,T.csmSep+7)||(u>.6&&u<.66)||within(T.loiOn-16,T.loiOn)||within(T.circular-14,T.circular)||within(T.teiOn-16,T.teiOn);
   const astern=(u>.93&&u<1)||within(T.lmEject,T.lmEject+8)||within(T.evade,T.evade+3)||within(T.undock,T.undock+6)||within(T.lmJettison,T.lmJettison+5)||within(T.cmSep,T.cmSep+12);
   shipJets.up.forEach((j,i)=>burn(j,astern||(turnOn&&i===0)||(turnOff&&i===2)||(closing&&burst(i,2,.3))));
   shipJets.down.forEach((j,i)=>burn(j,ahead||(turnOn&&i===2)||(turnOff&&i===0)||(closing&&burst(i+4,2,.3))));
   shipJets.left.forEach((j,i)=>burn(j,closing&&burst(i+8,3,.2)));shipJets.right.forEach((j,i)=>burn(j,closing&&burst(i+12,3,.2)));
   cabinJets.forEach((j,i)=>burn(j,within(T.cmSep+15,T.drogue)&&burst(i+16,4,.22)));
   const flying=within(T.undock,T.redock),settling=within(T.doi-8,T.doi)||within(T.pdi-8,T.pdi);
   const busy=!flying||within(T.landing,T.lmLiftoff)?0:within(T.pdi,T.landing-60)?.14:within(T.landing-60,T.landing)?.32:within(T.lmLiftoff,T.lmOrbit)?.38:within(T.undock,T.undock+90)?.25:within(T.redock-120,T.redock)?.3:.03;
   lmJets.down.forEach((j,i)=>burn(j,settling||burst(i+20,1.6,busy)));lmJets.up.forEach((j,i)=>burn(j,burst(i+24,1.6,busy)));
   lmJets.left.forEach((j,i)=>burn(j,burst(i+28,1.6,busy*.7)));lmJets.right.forEach((j,i)=>burn(j,burst(i+32,1.6,busy*.7)));
   stageJets.forEach((j,i)=>burn(j,within(T.orbit,T.orbit+87)||within(T.tliOn-77,T.tliOn)||within(T.tliOff,T.tliOff+60)||(within(T.orbit,T.evade)&&burst(i+40,5,.06))));}
  burn(lm.userData.plumeDown,(t>=T.doi&&t<T.doi+30)||(t>=T.pdi&&t<T.landing));burn(lm.userData.plumeUp,t>=T.lmLiftoff&&t<T.lmOrbit);
  set(V.crew,site,basis(upS,westS,north),1,t>=T.firstStep&&t<T.evaEnd);
  set(V.flag,site,basis(upS,westS,north),1,t>=T.flag&&norm(sub(site,eye??site))<80);
  V.crew.children.forEach((c,i)=>{c.visible=i<3||(t>=T.firstStep+19*60&&t<T.evaEnd-600);});

  const yL=axis(lmQ,1),cmUp=axis(cmQ,1);
  return {P,Vc,mo,mv,wM,fc,fl,Lr,site,upS,westS,sC,lenC,lmS,Cc,lmPos,cmPos,yC,yL,cmUp,nose,
   focus:{craft:t<T.sicSep?along(-5):t<T.siiSep?along(22):t<T.csmSep?along(32):t<T.cmSep?add(Cc,scale(yC,m(4)*sC*joined)):add(cmPos,scale(cmUp,m(chutes.visible&&t<T.splash?22*(1-smooth((t-T.splash+25)/25)*.93):1.5)*sC)),lander:add(lmPos,scale(yL,m(3.4)*lmS)),site:add(site,scale(upS,m(2.6)))},
   pov:{craft:t<T.cmSep?add(Cc,add(scale(axis(csmQ,0),m(7)*sC),scale(yC,m(1)*sC))):add(cmPos,add(scale(axis(cmQ,0),m(4.5)*sC),scale(cmUp,m(2)*sC))),lander:add(lmPos,add(scale(yL,m(5.3)*lmS),scale(axis(lmQ,0),m(2.4)*lmS)))},
   lmFront:axis(lmQ,0),cmSide:axis(cmQ,0)};
 }

 // ---------- Camera ----------
 // The whole route: looking down on the plane of the Moon's orbit, centered halfway between Earth and Moon so both
 // stay in view while the Moon travels to meet the ship. The view does not turn, so the drawn paths hold still.
 const moonMid=mission.moon(T.landing),ROUTE_UP=unit(cross(moonMid,moonVel(T.landing))),ROUTE_FLAT=unit(sub(moonMid,scale(ROUTE_UP,dot(moonMid,ROUTE_UP))));
 const portrait=()=>root.clientHeight>root.clientWidth;
 // How much of the picture the caption and controls cover at the bottom (on phones the browser's own bar adds to it), and the title at the top.
 const covered=()=>Math.max(0,root.getBoundingClientRect().bottom-$('.rp-bottom').getBoundingClientRect().top),headroom=()=>portrait()?100:60;
 function placeCamera(L,dt){
  const step=STEPS[stepIndex],guide=cameraOf(step,t);
  const watch=view==='route'||(view==='guided'&&guide.f==='route')?'route':guide.f==='route'?'craft':guide.f;
  const vehicle=watch==='site'||watch==='lander'?'lander':'craft';
  let F,up,fwd;
  // Chosen by hand, the whole-route camera pulls back to take in the Moon's complete orbit around the Earth; inside the guided
  // tour it stays close on the stretch between the two.
  const lap=view==='route';
  if(watch==='route'){F=lap?[0,0,0]:scale(L.mo,.5);up=ROUTE_UP;fwd=ROUTE_FLAT;}
  else if(watch==='site'){F=L.focus.site;up=L.upS;fwd=L.westS;}
  else if(watch==='lander'){F=L.focus.lander;({up,fwd}=L.fl??L.fc);}
  else{F=L.focus.craft;({up,fwd}=L.fc);}
  const key=view+watch;
  if(jumped){lag0=[0,0,0];lagClock=9;frameUp=null;}
  else if(key!==lastKey&&lastFocus){lag0=add(scale(lag0,1-smooth(lagClock/1.6)),sub(lastFocus,F));lagClock=0;}
  lastKey=key;lastFocus=F;lagClock+=dt;
  const moving=lagClock<1.6;
  if(moving&&frameUp){const k=1-Math.exp(-dt/.3);up=unit(lerp(frameUp,up,k));fwd=lerp(frameFwd,fwd,k);fwd=unit(sub(fwd,scale(up,dot(fwd,up))));}
  frameUp=up;frameFwd=fwd;
  const focus=moving?add(F,scale(lag0,1-smooth(lagClock/1.6))):F,right=cross(fwd,up),tall=portrait();
  camera.fov=view==='onboard'?clamp(64*user.zoom,18,95):tall?58:45;
  if(view==='onboard'){
   // The view from a window. In the lander the eye is at its forward window. In the command ship it is beside the cabin, on
   // whichever side faces what there is to see, so the ship's own body is never in the way.
   const n=t<T.cmSep?L.yC:L.cmUp,cabin=add(L.cmPos,scale(n,m(1.6)*L.sC)),across=v=>sub(v,scale(n,dot(v,n)));
   let outward=across(scale(up,-1));if(norm(outward)<.25)outward=across(fwd);outward=unit(outward);
   const from=vehicle==='lander'?L.pov.lander:cabin;
   const look={back:unit(add(scale(n,-.25),scale(outward,.97))),nose:vehicle==='lander'?L.yL:n,ahead:unit(sub(scale(fwd,.85),scale(up,.35))),moon:unit(sub(L.mo,from)),earth:unit(scale(from,-1)),down:unit(sub(scale(fwd,.6),up)),lander:unit(sub(L.focus.lander,from)),craft:unit(sub(L.focus.craft,from)),window:unit(sub(scale(L.lmFront,.85),scale(up,t<T.landing?.6:.22)))};
   let b=vehicle==='lander'?(step.pov==='lander'||step.pov==='window'?look.window:look[step.pov]??look.window):look[step.pov==='window'?'ahead':step.pov]??fwd;
   if(vehicle==='craft'&&step.pov==='lander'&&norm(sub(L.focus.lander,from))<.02)b=look.nose;
   let side=across(b);if(norm(side)<.25)side=L.cmSide;
   const eye=vehicle==='lander'?L.pov.lander:add(cabin,scale(unit(side),m(2.25)*L.sC));
   const top=Math.abs(dot(b,up))>.95?fwd:up,r=unit(cross(b,top)),u=cross(r,b),yaw=user.az*RAD,pitch=clamp(user.el,-85,85)*RAD;
   const dir=add(add(scale(b,Math.cos(pitch)*Math.cos(yaw)),scale(r,Math.cos(pitch)*Math.sin(yaw))),scale(u,Math.sin(pitch)));
   origin=eye;camPos=eye;camTrack=vehicle;camRel=sub(eye,vehicle==='lander'?L.Lr??L.P:L.P);camera.position.set(0,0,0);toScene(top,camera.up);camera.lookAt(toScene(dir,tv));
   return {watch,vehicle};
  }
  const half=Math.tan(camera.fov*RAD/2),aspect=root.clientWidth/Math.max(1,root.clientHeight);
  const clear=clamp(1-(covered()+headroom()+30)/Math.max(1,root.clientHeight),.3,1),sin62=Math.sin(62*RAD);
  const routeDist=lap?Math.max((408000*sin62+50000)/(half*clear),438000/(half*aspect)):Math.max(((tall?192000:150000)*sin62+35000)/(half*clear),((tall?150000:192000)+45000)/(half*aspect));
  const base=watch==='route'?{az:tall?0:90,el:62,d:routeDist}:view==='guided'?guide:{az:150,el:14,d:(vehicle==='lander'?.01:t<T.sicSep?.11:t<T.siiSep?.07:t<T.csmSep?.036:t<T.cmSep?.021:.012)*5};
  const want={az:base.az+user.az,el:clamp(base.el+user.el,-89,89),dist:clamp(base.d*user.zoom,.006,4e6)};
  if(jumped||seekingCamera){cam.az=want.az;cam.el=want.el;cam.dist=want.dist;}
  else{const k=1-Math.exp(-dt/.55);cam.az+=((want.az-cam.az+540)%360-180)*k;cam.el+=(want.el-cam.el)*k;cam.dist=Math.exp(Math.log(cam.dist)+(Math.log(want.dist)-Math.log(cam.dist))*k);}
  const a=cam.az*RAD,e=cam.el*RAD,dir=add(scale(add(scale(fwd,-Math.cos(a)),scale(right,Math.sin(a))),Math.cos(e)),scale(up,Math.sin(e)));
  let C=add(focus,scale(dir,cam.dist));
  // Never under the ground.
  for(const [center,R] of [[[0,0,0],R_EARTH],[L.mo,R_MOON]]){const v=sub(C,center),r=norm(v);if(r<R+.004)C=add(center,scale(v,(R+.004)/r));}
  origin=focus;camPos=C;camTrack=watch==='route'?'fixed':watch;camRel=watch==='route'?[0,0,0]:sub(C,watch==='site'?L.site:watch==='lander'?L.Lr??L.P:L.P);
  toScene(sub(C,origin),camera.position);toScene(up,camera.up);camera.lookAt(0,0,0);
  return {watch,vehicle};
 }
 let seekingCamera=false;
 // The window's frame, drawn over the picture in the window view: the wall of the cabin with an opening the shape of the
 // command ship's forward window or the lander's triangular one, fitted to the space above the caption and controls.
 let framed='';
 function frameWindow(vehicle){
  const pane=$('.rp-window'),on=view==='onboard';pane.toggleAttribute('hidden',!on);if(!on){framed='';return;}
  const H=Math.max(1,root.clientHeight),top=portrait()?13:10,bottom=clamp(100*(1-(covered()+14)/H),top+20,96),key=`${vehicle}|${top}|${bottom.toFixed(1)}`;
  if(key===framed)return;framed=key;
  const mid=(top+bottom)/2,shape=vehicle==='lander'?[[14,top],[86,top],[91,top+(bottom-top)*.38],[60,bottom],[40,bottom],[9,top+(bottom-top)*.38]]:[[25,top],[75,top],[81,top+2.5],[88,bottom-3],[84,bottom],[16,bottom],[12,bottom-3],[19,top+2.5]];
  const outline='M'+shape.map(p=>`${p[0]} ${p[1].toFixed(2)}`).join('L')+'Z';
  pane.querySelector('.rp-window-wall').setAttribute('d','M0 0H100V100H0Z'+outline);pane.querySelector('.rp-window-edge').setAttribute('d',outline);
 }

 // ---------- Labels ----------
 const labelBox=$('.rp-labels'),labels={};
 for(const [key,css] of [['earth',''],['moon',''],['craft','rp-ship'],['lander','rp-ship'],['orbit','rp-dim']]){const el=document.createElement('span');el.className=`rp-label ${css}`;el.hidden=true;labelBox.appendChild(el);labels[key]=el;}
 labels.earth.textContent='Earth';labels.moon.textContent='Moon';labels.orbit.textContent='The Moon’s orbit';
 const orbitMark=(data.orbit??[])[Math.floor((data.orbit?.length??0)*.12)]?.slice(1,4);
 const blocked=(X,center,R)=>{const d=sub(X,camPos),len=norm(d),along=dot(sub(center,camPos),d)/len;if(along<=0||along>=len)return false;const c=sub(center,camPos);return dot(c,c)-along*along<R*R;};
 function label(key,X,show,body){
  const el=labels[key];
  if(show&&X&&!(body!=='earth'&&blocked(X,[0,0,0],R_EARTH*.995))&&!(body!=='moon'&&blocked(X,moonNow,R_MOON*.995))){
   toScene(sub(X,origin),tv).project(camera);
   if(tv.z<1&&Math.abs(tv.x)<1.05&&Math.abs(tv.y)<1.05){el.hidden=false;el.style.transform=`translate(${((tv.x+1)/2*root.clientWidth).toFixed(1)}px,${((1-tv.y)/2*root.clientHeight).toFixed(1)}px) translate(-50%,-135%)`;return;}
  }
  el.hidden=true;
 }
 let moonNow=[0,0,0];

 // ---------- One frame ----------
 const sky=new THREE.Color(),SKY=new THREE.Color(0x5d9be0),BLACK=new THREE.Color(0),WHITE=new THREE.Color(0xffffff);
 function draw(dt,now){
  const index=stepAt(t);
  if(index!==stepIndex){stepIndex=index;user.az=user.el=0;user.zoom=1;showStep();}
  frameDt=dt;const L=layout();moonNow=L.mo;
  const {watch,vehicle}=placeCamera(L,dt);frameWindow(vehicle);
  camera.aspect=root.clientWidth/Math.max(1,root.clientHeight);
  const lift=Math.min(root.clientHeight*.32,Math.max(0,(covered()-headroom())/2));
  camera.setViewOffset(root.clientWidth,root.clientHeight,0,lift,root.clientWidth,root.clientHeight);camera.updateProjectionMatrix();
  // Everything is drawn relative to the point the camera watches.
  for(const o of Object.values(V))if(o.visible)toScene(sub(o.userData.p,origin),o.position);
  toScene(scale(origin,-1),earth.position);earth.rotation.y=mission.earthAngle(t);inertial.position.copy(earth.position);
  toScene(sub(L.mo,origin),moon.position);
  {const M=mission.moonToIcrf(t);basisMatrix.makeBasis(toScene([M[0][0],M[1][0],M[2][0]],bx),toScene([M[0][2],M[1][2],M[2][2]],by),toScene([-M[0][1],-M[1][1],-M[2][1]],bz));moon.quaternion.setFromRotationMatrix(basisMatrix);}
  const sun=mission.sun(t);toScene(sun,sunLight.position).multiplyScalar(10);toScene(sun,air.material.uniforms.sunDir.value);
  stars.position.copy(camera.position);
  // Blue sky near the ground in daylight, black above the air.
  const height=norm(camPos)-R_EARTH,daylight=clamp(dot(unit(camPos),sun)*3+.4,0,1)*(1-smooth(height/70));
  sky.copy(BLACK).lerp(SKY,daylight);scene.background=sky;stars.material.color.copy(WHITE).lerp(SKY,Math.min(1,daylight*1.6));stars.visible=daylight<.6;
  // The launch site is drawn only from near enough to see it, fading out as the rocket leaves it behind.
  {const a=mission.earthAngle(t),c=Math.cos(a),sn=Math.sin(a),padNow=scale([padUnit[0]*c-padUnit[1]*sn,padUnit[0]*sn+padUnit[1]*c,padUnit[2]],R_EARTH),near=1-smooth((norm(sub(camPos,padNow))-60)/240);
   padFrame.visible=near>0;for(const patch of padGround){patch.visible=near>0;patch.material.opacity=near;}
   if(near>0)for(const arm of complex.userData.arms)arm.rotation.y=1.75*smooth((t+2)/5);}
  const nearSea=1-smooth((norm(sub(camPos,mission.splashPoint(t)))-40)/200);seaMaterial.visible=nearSea>0;seaMaterial.emissiveIntensity=.5*daylight;
  waveMaterial.opacity=nearSea>0?1-smooth((norm(camPos)-R_EARTH-1.2)/5):0;swell.visible=waveMaterial.opacity>.01;waveMaterial.emissiveIntensity=.35*daylight;waves.offset.set(now*.00002%1,now*.000013%1);air.material.uniforms.strength.value=smooth((height-60)/200);
  for(const f of flames)f.scale.set(1+.05*Math.sin(now*.031),1+.14*Math.sin(now*.047)+.08*Math.sin(now*.113),1+.05*Math.cos(now*.037));
  // Route lines mean nothing from a few hundred meters away, so they fade out close up.
  const reach=norm(sub(camPos,origin)),fade=view==='onboard'?.5*smooth((Math.min(norm(camPos)-R_EARTH,norm(sub(camPos,L.mo))-R_MOON)-50)/400):smooth((Math.log10(Math.max(reach,.001))-.7)/1.3);
  const wideOnly=smooth((Math.log10(Math.max(reach,.001))-4.6)/.6);
  for(const line of lines){const f=moonLap.includes(line)?fade*wideOnly:fade;line.material.opacity=line.userData.base*f;line.visible=f>.01;}
  let n=0;while(n<outTimes.length&&outTimes[n]<=t)n++;outDone.geometry.setDrawRange(0,n);n=0;while(n<backTimes.length&&backTimes[n]<=t)n++;backDone.geometry.setDrawRange(0,n);
  detail.visible=norm(sub(camPos,L.site))<60;
  renderer.render(scene,camera);

  // Labels for things too small to see.
  const far=X=>norm(sub(X,camPos)),tiny=(X,len,s)=>len*s/far(X)<.035;
  label('earth',[0,0,0],far([0,0,0])>R_EARTH*7,'earth');label('moon',L.mo,far(L.mo)>R_MOON*7,'moon');
  const apart=t>=T.undock&&t<T.redock;
  labels.craft.textContent=t<T.undock?'Apollo 11':'Columbia';
  label('craft',t<T.cmSep?L.Cc:L.cmPos,view!=='onboard'&&tiny(L.Cc,L.lenC,L.sC));
  labels.lander.textContent=t>=T.lmJettison?'Eagle (left behind)':'Eagle';
  label('lander',L.lmPos,(apart||t>=T.lmJettison)&&t<T.teiOn+1200&&tiny(L.lmPos,.008,L.lmS)&&norm(sub(L.lmPos,L.Cc))/far(L.lmPos)>.03);
  label('orbit',orbitMark,watch==='route'&&!!orbitMark);
  const size=watch==='lander'||watch==='site'?L.lmS:L.sC,note=$('.rp-scale');
  note.hidden=!(size>1.5&&view!=='onboard');if(!note.hidden)note.textContent=`Spacecraft drawn ${Number(size.toPrecision(2)).toLocaleString('en-US')}× larger than life`;

  // Clock, numbers, timeline.
  $('.rp-get').textContent=elapsed(t);$('.rp-utc').textContent=stamp(t);
  if(!seeking)$('.rp-seek').value=guidedOf(t);
  $('.rp-seek').style.setProperty('--done',`${(guidedOf(t)/GUIDED_TOTAL*100).toFixed(2)}%`);
  $('.rp-numbers').textContent=numbers(L,vehicle==='lander'&&L.Lr);
  jumped=false;
 }
 // Speed and height of the vehicle being watched, from the reconstructed path.
 function numbers(L,lander){
  const X=lander?L.Lr:L.P,Vx=lander?mission.landerVelocity(t):L.Vc;
  if(t<=0)return 'On the pad at Kennedy Space Center, Florida';
  if(t>=T.splash)return 'Afloat in the Pacific Ocean';
  const altE=norm(X)-R_EARTH,altM=norm(sub(X,L.mo))-R_MOON;
  if(t<T.orbit)return `${round(altE)} km above Earth`;
  if(L.wM>.5){
   if(lander&&t>=T.landing&&t<T.lmLiftoff)return 'On the Moon, in the Sea of Tranquility';
   return `${round(norm(sub(Vx,L.mv))*3600)} km/h relative to the Moon · ${altM<1?`${Math.round(Math.max(0,altM)*100)*10} m`:`${round(altM)} km`} above its surface`;
  }
  if(t>T.drogue)return `${round(Math.max(0,altE))} km above the Pacific`;
  const v=norm(t>T.entry?sub(Vx,spin(X)):Vx)*3600;
  return altE<3000?`${round(v)} km/h · ${round(Math.max(0,altE))} km above Earth`:`${round(v)} km/h · ${round(altE)} km from Earth · ${round(altM)} km from the Moon`;   // both measured to the surface, like every other height on this line
 }
 function showStep(){
  const step=STEPS[stepIndex];
  $('.rp-step-title').textContent=step.title;$('.rp-count').textContent=`Step ${stepIndex+1} of ${STEPS.length}`;$('.rp-text').textContent=step.text;
  root.querySelectorAll('.rp-steps button').forEach((b,i)=>b.classList.toggle('on',i===stepIndex));
 }
 function showPlay(){$('.rp-play').innerHTML=playing?ICON.pause:ICON.play;$('.rp-play').setAttribute('aria-label',playing?'Pause':t>=END?'Play again from liftoff':'Play');}
 // One step of the replay: move the clock on if playing, then draw. Kept apart from the browser's frame timer so it can be driven directly in checks.
 let failure=null;
 function advance(dt,now){
  dtm=0;
  if(playing){
   let next=speed==='guided'?timeOf(guidedOf(t)+dt):t+speed*dt;
   const ahead=STEPS[stepAt(t)+1];
   if(stopAtSteps&&ahead&&next>=ahead.at){next=ahead.at;playing=false;showPlay();}
   if(next>=END){next=END;playing=false;showPlay();}
   dtm=next-t;t=next;
  }
  if(!playing&&!jumped&&now>awakeUntil)return;
  // A moment that cannot be drawn must say so, not freeze the picture silently.
  try{draw(dt,now);}catch(e){console.error(e);failure=`${e.message} at ${Math.round(t)} s`;playing=false;jumped=false;showPlay();$('.rp-numbers').textContent=`This moment could not be drawn (${e.message}). Try another step.`;}
 }
 function frame(now){raf=requestAnimationFrame(frame);const dt=Math.min(.25,(now-last)/1000);last=now;advance(dt,now);}
 const go=(time,keepPlaying=playing)=>{t=clamp(time,START,END);jumped=true;playing=keepPlaying&&t<END;showPlay();wake();};

 // ---------- Controls ----------
 $('.rp-ticks').innerHTML=STEPS.map(s=>`<i style="left:${(guidedOf(s.at)/GUIDED_TOTAL*100).toFixed(2)}%"></i>`).join('');
 $('.rp-steps ol').innerHTML=STEPS.map((s,i)=>`<li><button data-step="${i}"><b>${s.title}</b><small>${elapsed(s.mark).replace(/^T. 0*(\d)/,'T+ $1')} · ${stamp(s.mark).replace(', 1969','')}</small></button></li>`).join('');
 $('.rp-steps').onclick=e=>{const b=e.target.closest('[data-step]');if(!b)return;go(STEPS[Number(b.dataset.step)].at);if(window.innerWidth<700)toggle('.rp-steps','.rp-list',false);};
 const toggle=(panel,button,on=$(panel).hidden)=>{$(panel).hidden=!on;$(button).setAttribute('aria-expanded',String(on));};
 $('.rp-list').onclick=()=>{toggle('.rp-about','.rp-about-btn',false);toggle('.rp-steps','.rp-list');};
 $('.rp-about-btn').onclick=()=>{toggle('.rp-steps','.rp-list',false);toggle('.rp-about','.rp-about-btn');};
 $('.rp-play').onclick=()=>{if(!playing&&t>=END)go(START,true);else{playing=!playing;last=performance.now();showPlay();wake();}};
 // The step is worked out from the time itself, so several taps before the next frame each count.
 $('.rp-prev').onclick=()=>{const i=stepAt(t),into=guidedOf(t)-guidedOf(STEPS[i].at);go(STEPS[into>1.2||i===0?i:i-1].at);};
 $('.rp-next').onclick=()=>{const i=stepAt(t);if(i<STEPS.length-1)go(STEPS[i+1].at);};
 $('.rp-speed').onchange=e=>{speed=e.target.value==='guided'?'guided':Number(e.target.value);wake();};
 $('.rp-view').onchange=e=>{view=e.target.value;user.az=user.el=0;user.zoom=1;wake();};
 $('.rp-stop').onchange=e=>{stopAtSteps=e.target.checked;};
 const seek=$('.rp-seek');
 seek.oninput=()=>{seeking=true;t=timeOf(Number(seek.value));jumped=true;wake();};
 seek.onchange=()=>{seeking=false;};
 // Drag to look around, pinch or scroll to zoom.
 const pointers=new Map();let pinch=0;
 const spread=()=>{const [a,b]=[...pointers.values()];return Math.hypot(a[0]-b[0],a[1]-b[1]);};
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2)pinch=spread();toggle('.rp-about','.rp-about-btn',false);wake();});
 canvas.addEventListener('pointermove',e=>{
  const p=pointers.get(e.pointerId);if(!p)return;const dx=e.clientX-p[0],dy=e.clientY-p[1];p[0]=e.clientX;p[1]=e.clientY;
  if(pointers.size===1){const k=view==='onboard'?.14:.3;user.az-=dx*k;user.el=clamp(user.el+dy*k,-170,170);seekingCamera=true;}
  else if(pointers.size===2){const now=spread();if(pinch>0&&now>0)user.zoom=clamp(user.zoom*pinch/now,1e-4,1e7);pinch=now;}
  wake();
 });
 const release=e=>{pointers.delete(e.pointerId);pinch=0;seekingCamera=false;};
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
 canvas.addEventListener('wheel',e=>{e.preventDefault();user.zoom=clamp(user.zoom*Math.exp(e.deltaY*.0015),1e-4,1e7);wake();},{passive:false});
 // Safari on phones zooms the page on a quick second tap, even on a button. Take the second tap ourselves instead.
 let lastTap=0,lastTarget=null;
 root.addEventListener('touchend',e=>{
  const now=performance.now(),button=e.target.closest('button'),again=now-lastTap<400&&button&&button===lastTarget;lastTap=now;lastTarget=button;
  if(!again||e.touches.length||e.target.closest('.rp-steps,.rp-about'))return;
  e.preventDefault();button.click();
 },{passive:false});
 const onKey=e=>{
  if(e.target.closest?.('select'))return;
  if(e.key==='Escape')close();else if(e.key===' '){e.preventDefault();$('.rp-play').click();}else if(e.key==='ArrowRight')$('.rp-next').click();else if(e.key==='ArrowLeft')$('.rp-prev').click();else return;
  e.stopPropagation();
 };
 window.addEventListener('keydown',onKey,true);cleanups.push(()=>window.removeEventListener('keydown',onKey,true));
 const resize=()=>{renderer.setSize(root.clientWidth,root.clientHeight,false);wake();};
 window.addEventListener('resize',resize);cleanups.push(()=>window.removeEventListener('resize',resize));
 // If the browser resets its graphics, draw again once it has them back.
 canvas.addEventListener('webglcontextrestored',wake);
 resize();$('.rp-loading').hidden=true;showPlay();
 // For checks from the console and automated tests.
 root.replay={get time(){return t;},get failure(){return failure;},advance:dt=>advance(dt,performance.now()),go,play:()=>{if(!playing)$('.rp-play').click();},state:()=>({t,playing,speed,view,step:stepIndex,title:STEPS[stepIndex]?.title,camera:camPos,origin,scales:{...scales}}),renderer,scene,camera,mission};
 raf=requestAnimationFrame(frame);
 return root.replay;
}
