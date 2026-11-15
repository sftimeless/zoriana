// Zoriana map client. Written with AI coding assistance (OpenAI Codex, Anthropic Claude Code)
// under human direction during NASA Space Apps 2026. See README.md for sources and limits.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { DAY, sampleAt, visibleHours, nextCrossing, coordinatesToVector, skyDirection } from './ephemeris.mjs';
import { segments, span, gaps, longest, landingDays, bestLandingDay } from './windows.mjs';
import { horizonAt, clearanceSeries, RADIUS } from './terrain-math.mjs';
import { createRenderDiagnostics } from './performance.mjs';
import { createTerrainShadows } from './terrain-shadows.mjs';
import { createSurfacePatch } from './surface-patch.mjs';
import { quickMapUrl, moonTrekUrl } from './links.mjs';
import './style.css';

const $=s=>document.querySelector(s);
const HOUR=3600000;
const SUN_COLOR='#ffd60a',EARTH_COLOR='#0a84ff';
const icon=(name,cls='')=>`<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

// Coordinates: Apollo from NASA SP-4029 mission summaries; IM-1 and Blue Ghost from NASA/LROC
// published site locations; Chandrayaan-3 from the IAU Statio Shiv Shakti entry; SLIM from the
// JAXA target point. Future targets are announced regions, not landing points: each uses the centre
// of the named feature (or a published candidate point) and says so in its note. See REFERENCES.md.
const categories={
 pole:{label:'South Pole',icon:'crater'},
 future:{label:'Future',icon:'target'},
 clps:{label:'CLPS',icon:'lander'},
 intl:{label:'International',icon:'flag'},
 apollo:{label:'Apollo',icon:'lm'},
 pin:{label:'Dropped pin',icon:'pin'}
};
// A site may carry its own icon; otherwise it takes its category's.
const siteIcon=s=>s.icon??categories[s.cat].icon;
const sites=[
 {id:'shackleton',name:'Shackleton region',lat:-89.5,lon:0,cat:'pole',type:'Exploration point',description:'Near the lunar south pole'},
 {id:'malapert',name:'Malapert region',lat:-85.95,lon:0,cat:'pole',type:'Exploration point',description:'Southern highlands'},
 {id:'bluemoon1',name:'Blue Moon Pathfinder 1',lat:-89.45,lon:-137.31,cat:'future',icon:'bluemoon',type:'Planned landing · 2027',description:'Shackleton connecting ridge · Blue Origin',note:'Approximate. The mission names the Shackleton connecting ridge; this is candidate point “Site 001” on that ridge (89.45°S, 222.69°E), not an announced landing point.'},
 {id:'griffin1',name:'Griffin Mission One',lat:-85.28,lon:53.27,cat:'future',icon:'griffin',type:'Planned CLPS landing · early 2027',description:'Nobile region · Astrobotic',note:'Approximate. The mission names the Nobile region near Mons Mouton; this is the centre of Nobile crater, not an announced landing point.'},
 {id:'im4',name:'IM-4',lat:-84.6,lon:31,cat:'future',icon:'novac',type:'Planned CLPS landing · 2027',description:'Mons Mouton plateau · Intuitive Machines',note:'Approximate. The mission names the Mons Mouton plateau; this is the centre of Mons Mouton, not an announced landing point.'},
 {id:'im3',name:'IM-3 Trinity',lat:7.5,lon:-59,cat:'future',icon:'novac',type:'Planned CLPS landing · early 2027',description:'Reiner Gamma swirl · Intuitive Machines',note:'Approximate. The mission names the Reiner Gamma region; this is the centre of the swirl, not an announced landing point.'},
 {id:'blueghost3',name:'Blue Ghost Mission 3',lat:36.56,lon:-40.72,cat:'future',icon:'blueghost',type:'Planned CLPS landing · 2028',description:'Mons Gruithuisen Gamma · Firefly Aerospace',note:'Approximate. The mission names Mons Gruithuisen Gamma; this is the centre of the dome, not an announced landing point.'},
 {id:'im2',name:'IM-2 Athena',lat:-84.7906,lon:29.1957,cat:'clps',icon:'novac',type:'CLPS landing site · 2025',description:'Mons Mouton · Intuitive Machines'},
 {id:'im1',name:'IM-1 Odysseus',lat:-80.13,lon:1.44,cat:'clps',icon:'novac',type:'CLPS landing site · 2024',description:'Malapert A · Intuitive Machines'},
 {id:'blueghost1',name:'Blue Ghost M1',lat:18.56,lon:61.81,cat:'clps',icon:'blueghost',type:'CLPS landing site · 2025',description:'Mare Crisium · Firefly Aerospace'},
 {id:'chandrayaan3',name:'Chandrayaan-3',lat:-69.373,lon:32.319,cat:'intl',icon:'vikram',type:'ISRO landing site · 2023',description:'Statio Shiv Shakti · ISRO'},
 {id:'slim',name:'SLIM',lat:-13.316,lon:25.251,cat:'intl',icon:'slim',type:'JAXA landing site · 2024',description:'Near Shioli crater · JAXA'},
 {id:'apollo11',name:'Apollo 11',lat:0.67408,lon:23.47297,cat:'apollo',type:'Apollo landing site · 1969',description:'Sea of Tranquility · Near side'},
 {id:'apollo17',name:'Apollo 17',lat:20.1908,lon:30.7717,cat:'apollo',type:'Apollo landing site · 1972',description:'Taurus–Littrow · Near side'}
];

let selected=null,mode='explore',pinning=false,data=null,selectedRequest=0,playing=false,flight=null,compared=[],playTimer=null;
let terrainEnabled=true,duration=72,filter='all';
let surface=null; // landing view state: {site,frame,north,east,target,radius,info,distance,controls}
const clientCache=new Map();
const visibilityRows=(d,name)=>terrainEnabled&&d.terrain?d.adjusted[name]:d[name];
const startDate=()=>Date.parse($('#date').value+'T00:00:00Z');
const observationTime=()=>startDate()+Number($('#time').value)*HOUR;
const number=n=>Number(n).toFixed(1);
const deg=n=>`${n<0?'−':''}${Math.abs(n).toFixed(1)}°`;
const signedDeg=n=>`${n<0?'−':'+'}${Math.abs(n).toFixed(1)}°`;
const coord=s=>`${Math.abs(s.lat).toFixed(4)}° ${s.lat<0?'S':'N'}   ${Math.abs(s.lon).toFixed(4)}° ${s.lon<0?'W':'E'}`;
const shortCoord=s=>`${Math.abs(s.lat).toFixed(1)}°${s.lat<0?'S':'N'}`;
const shortLon=s=>`${Math.abs(s.lon).toFixed(1)}°${s.lon<0?'W':'E'}`;
const fullDay=date=>new Date(date+'T00:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
const stayLabel=()=>duration===24?'24 h':`${duration/24} d`;
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=t=>new Date(t).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
const stamp=t=>`${day(t)}, ${new Date(t).toISOString().slice(11,16)} UTC`;

$('#date').value=new Date().toISOString().slice(0,10);
let lastValidDate=$('#date').value;
let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3800);}

// ---- Site list ----
const siteRow=s=>`<button class="row cat-${s.cat}" data-site="${s.id}"><span class="badge">${icon(siteIcon(s))}</span><span class="row-text"><strong>${safe(s.name)}</strong><small>${safe(s.description)}</small></span><span class="row-meta mono">${shortCoord(s)}</span>${icon('chevron','chev')}</button>`;
function renderBrowse(){
 const chips=[['all','All'],...Object.entries(categories).filter(([k])=>k!=='pin').map(([k,c])=>[k,c.label])];
 $('#chips').innerHTML=chips.map(([k,label])=>`<button class="chip-btn cat-${k}${k===filter?' active':''}" data-filter="${k}" aria-pressed="${k===filter}">${k==='all'?'':icon(categories[k].icon)}${label}</button>`).join('');
 $('#destinations').innerHTML=sites.filter(s=>filter==='all'||s.cat===filter).map(siteRow).join('');
}
$('#chips').onclick=e=>{const k=e.target.closest('[data-filter]')?.dataset.filter;if(k){filter=k;renderBrowse();}};
renderBrowse();

// ---- Globe ----
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.005,100);
const homePosition=()=>new THREE.Vector3(...coordinatesToVector(-15,45)).multiplyScalar(4.2);
camera.position.copy(homePosition());
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch(e){$('#map-status').textContent='WebGL is unavailable in this browser';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;$('#globe').appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.12;controls.minDistance=1.12;controls.maxDistance=7;controls.rotateSpeed=.55;controls.zoomSpeed=.65;
const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,metalness:0,bumpScale:.006});
const satelliteMaterial=new THREE.MeshBasicMaterial({color:0xffffff});
const moon=new THREE.Mesh(new THREE.SphereGeometry(1,256,128),material);scene.add(moon);
scene.add(new THREE.AmbientLight(0xdfe6ff,.22));
const sun=new THREE.DirectionalLight(0xffffff,2.65);sun.position.set(-2,.2,-4);scene.add(sun);
let sunlightEnabled=true;
const shadows=createTerrainShadows(renderer,material,invalidate,text=>{if(sunlightEnabled)$('#map-status').textContent=text;});
const patch=createSurfacePatch(scene,shadows);
function setSunlight(value){sunlightEnabled=value;$('#sunlight').setAttribute('aria-pressed',String(value));shadows.setEnabled(value);moon.material=value?material:satelliteMaterial;patch.setLit(value);}
$('#sunlight').onclick=()=>{setSunlight(!sunlightEnabled);$('#map-status').textContent=sunlightEnabled?'Sunlight · updating':'NASA / LRO · imagery';invalidate();};
const loader=new THREE.TextureLoader();
loader.load('/assets/moon-lroc-8k.jpg',texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());material.map=texture;satelliteMaterial.map=texture;patch.setMap(texture);material.needsUpdate=true;satelliteMaterial.needsUpdate=true;$('#map-status').textContent='NASA / LRO · 8K lunar mosaic';invalidate();},undefined,()=>{$('#map-status').textContent='NASA imagery failed to load';});
fetch('/assets/terrain-visual.f32').then(r=>{if(!r.ok)throw new Error('Terrain texture unavailable');return r.arrayBuffer();}).then(buffer=>{
 const texture=new THREE.DataTexture(new Float32Array(buffer),720,360,THREE.RedFormat,THREE.FloatType);texture.flipY=true;const linear=renderer.extensions.has('OES_texture_float_linear');texture.minFilter=linear?THREE.LinearFilter:THREE.NearestFilter;texture.magFilter=linear?THREE.LinearFilter:THREE.NearestFilter;texture.wrapS=THREE.RepeatWrapping;texture.needsUpdate=true;
 material.displacementMap=texture;material.displacementScale=1/RADIUS;material.displacementBias=0;material.bumpMap=texture;material.bumpScale=1/RADIUS;material.needsUpdate=true;invalidate();
}).catch(()=>toast('Visual relief unavailable. Site calculations use the full terrain grids.'));
const starsGeometry=new THREE.BufferGeometry();const positions=[];
let seed=763;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
for(let i=0;i<750;i++){const v=new THREE.Vector3(random()*2-1,random()*2-1,random()*2-1).normalize().multiplyScalar(30);positions.push(...v.toArray());}
starsGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));scene.add(new THREE.Points(starsGeometry,new THREE.PointsMaterial({color:0x8a95af,size:.022,sizeAttenuation:true,transparent:true,opacity:.45})));

// ---- Sight lines from the selected site toward the Sun and Earth ----
// Line length follows the zoom level so both ends stay on screen; it carries no physical meaning.
const beamLength=()=>surface?THREE.MathUtils.clamp(camera.position.distanceTo(surface.target)*.42,.006,.3):THREE.MathUtils.clamp((camera.position.length()-1)*.26,.05,.5);
function makeBeam(name,color,label){
 const geometry=new LineGeometry();geometry.setPositions([0,0,0,0,0,0]);
 const beamMaterial=new LineMaterial({color,linewidth:4,transparent:true,opacity:.95,dashSize:.022,gapSize:.016});
 const line=new Line2(geometry,beamMaterial);line.visible=false;line.frustumCulled=false;line.renderOrder=2;scene.add(line);
 const chip=document.createElement('div');chip.className=`sky-chip ${name}`;chip.hidden=true;$('#labels').appendChild(chip);
 return {name,label,line,chip,base:new THREE.Vector3(),direction:new THREE.Vector3(),end:new THREE.Vector3(),length:0,active:false};
}
const beams={sun:makeBeam('sun',SUN_COLOR,'Sun'),earth:makeBeam('earth',EARTH_COLOR,'Earth')};
function updateBeams(){
 const time=observationTime(),profile=terrainEnabled?data?.terrain:null;
 for(const beam of Object.values(beams)){
  const s=selected&&data?sampleAt(data[beam.name],time):null;
  beam.active=Boolean(s);beam.line.visible=beam.active;
  if(!s){beam.chip.hidden=true;continue;}
  beam.base.fromArray(coordinatesToVector(data.lat,data.lon)).multiplyScalar(surface&&surface.site.id===selected.id?surface.radius+.0004:Math.max(1.004,1+(data.terrain?.elevationMeters??0)/RADIUS+.002));
  beam.direction.fromArray(skyDirection(data.lat,data.lon,s.az,s.el));beam.length=0;
  const clear=s.el-(profile?horizonAt(profile,s.az):0)>0;
  beam.line.material.dashed=!clear;beam.line.material.opacity=clear?.95:.55;
  beam.chip.classList.toggle('blocked',!clear);
  beam.chip.innerHTML=`${icon(beam.name==='sun'?'sun':'globe')}${beam.label} ${deg(s.el)}`;
 }
 invalidate();
}
function layoutBeams(){
 const length=beamLength();
 for(const beam of Object.values(beams)){
  if(!beam.active||Math.abs(length-beam.length)<length*.02)continue;
  beam.length=length;beam.end.copy(beam.direction).multiplyScalar(length).add(beam.base);
  beam.line.geometry.setPositions([...beam.base.toArray(),...beam.end.toArray()]);beam.line.computeLineDistances();
  beam.line.material.dashSize=length*.055;beam.line.material.gapSize=length*.04;
 }
}

// ---- Pins ----
const labels=[];
function addLabel(site){const el=document.createElement('button');el.className=`place-label cat-${site.cat}`;el.innerHTML=`<span class="marker">${icon(siteIcon(site))}</span><span class="name">${safe(site.name)}</span>`;el.setAttribute('aria-label',`Select ${site.name}`);el.onclick=()=>selectSite(site);$('#labels').appendChild(el);labels.push({site,el,point:new THREE.Vector3()});placeLabels();}
// Pins float just above the coarse globe; in landing view they sit on the true-scale surface.
function placeLabels(){const sampler=surface?shadows.sampler():null;for(const {site,point} of labels)point.fromArray(coordinatesToVector(site.lat,site.lon)).multiplyScalar(sampler?1+sampler(site.lat,site.lon)/1737.4+.0003:1.003);}
sites.forEach(addLabel);
let previousAltitude='',previousCompass='';
const projected=new THREE.Vector3(),towardCamera=new THREE.Vector3(),segment=new THREE.Vector3();
function hiddenByMoon(point){ // true when the Moon is between the camera and the point
 if(point.lengthSq()<1)return true;
 segment.copy(point).sub(camera.position);
 const t=-camera.position.dot(segment)/segment.lengthSq();
 return t>0&&t<1&&towardCamera.copy(camera.position).addScaledVector(segment,t).lengthSq()<.994;
}
function updateLabels(){
 const occupied=[];
 const ordered=selected?[...labels].sort((a,b)=>(b.site.id===selected.id)-(a.site.id===selected.id)):labels;
 for(const {point,el,site} of ordered){
  const visible=point.dot(towardCamera.copy(camera.position).sub(point))>0;
  const p=projected.copy(point).project(camera);const x=(p.x+1)*innerWidth/2,y=(1-p.y)*innerHeight/2;
  const collision=occupied.some(q=>Math.abs(q[0]-x)<92&&Math.abs(q[1]-y)<42);
  const hidden=!visible||Math.abs(p.x)>1||Math.abs(p.y)>1||collision;el.hidden=hidden;if(hidden)continue;
  occupied.push([x,y]);el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%)`;el.classList.toggle('selected',site.id===selected?.id);
 }
 for(const beam of Object.values(beams)){
  if(!beam.active){beam.chip.hidden=true;continue;}
  const p=projected.copy(beam.end).project(camera);
  const hidden=hiddenByMoon(beam.end)||Math.abs(p.x)>1||Math.abs(p.y)>1||p.z>1;beam.chip.hidden=hidden;if(hidden)continue;
  beam.chip.style.transform=`translate3d(${((p.x+1)*innerWidth/2).toFixed(1)}px,${((1-p.y)*innerHeight/2).toFixed(1)}px,0) translate(-50%,-135%)`;
 }
}

// ---- Render loop (on demand) ----
let pending=false,rendering=false;
let diagnostics={beforeFrame(){},afterFrame(){},active:()=>false};
function invalidate(){if(!pending&&!rendering&&!document.hidden){pending=true;requestAnimationFrame(render);}}
function render(now){pending=false;rendering=true;const cpuStart=performance.now();
 if(flight)advanceFlight(now);
 diagnostics.beforeFrame(now);const changed=flight?false:(surface?.controls??controls).update();layoutBeams();patch.update(camera,Boolean(surface));renderer.render(scene,camera);updateLabels();
 const heading=surface?surfaceHeading():0,compass=surface?`rotate(${(-heading).toFixed(1)}deg)`:'';if(compass!==previousCompass){$('#north').style.transform=compass;previousCompass=compass;}
 const altitude=surface?`Landing view · range ≈ ${Math.round(camera.position.distanceTo(surface.target)*1737.4).toLocaleString()} km · heading ${Math.round(heading)%360}° · ${surface.info?`true-scale LOLA relief, ${surface.info.gridMeters<1000?surface.info.gridMeters+' m':surface.info.gridMeters/1000+' km'} grid`:'relief loading'}`:`View altitude ≈ ${Math.round((camera.position.length()-1)*1737.4).toLocaleString()} km`;if(altitude!==previousAltitude){$('#scale').textContent=altitude;previousAltitude=altitude;}
 diagnostics.afterFrame(now,cpuStart);rendering=false;
 if(changed||flight||diagnostics.active())invalidate();
}
controls.addEventListener('change',invalidate);
controls.addEventListener('start',()=>{flight=null;$('#hint').classList.add('gone');invalidate();});
function resize(){
 camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth>900?35:45;camera.clearViewOffset();
 // Keep the globe centred in the open map area beside the sidebar (or above the sheet on phones).
 if(innerWidth>900)camera.setViewOffset(innerWidth,innerHeight,-$('#planner').getBoundingClientRect().right/2,0,innerWidth,innerHeight);
 else camera.setViewOffset(innerWidth,innerHeight,0,innerHeight*.17,innerWidth,innerHeight);
 camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);invalidate();
}
addEventListener('resize',resize);resize();
diagnostics=createRenderDiagnostics(renderer,camera,invalidate);
// ---- Camera moves ----
// A flight swings the camera around the Moon (direction slerp + range lerp) so it never cuts
// through the surface. Landing-view flights also move the look target and the up axis.
const Y_UP=new THREE.Vector3(0,1,0),viewTarget=new THREE.Vector3();
const flightQ=new THREE.Quaternion(),stepQ=new THREE.Quaternion(),flightA=new THREE.Vector3(),flightB=new THREE.Vector3();
function slerpDirection(out,a,b,f){flightQ.setFromUnitVectors(a,b);stepQ.identity().slerp(flightQ,f);return out.copy(a).applyQuaternion(stepQ);}
function startFlight(spec){
 flight={from:camera.position.clone(),fromTarget:viewTarget.clone(),fromUp:camera.up.clone(),start:performance.now(),duration:700,...spec};
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)flight.start-=flight.duration;
 invalidate();
}
function advanceFlight(now){
 const t=Math.min(1,(now-flight.start)/flight.duration),f=1-Math.pow(1-t,3);
 if(flight.orbit){const o=flight.orbit;camera.position.copy(surfaceCameraPosition(surface.target,surface.frame,o.from+o.delta*f,o.distance,o.tilt));camera.lookAt(surface.target);}
 else{
  slerpDirection(camera.position,flightA.copy(flight.from).normalize(),flightB.copy(flight.to).normalize(),f).multiplyScalar(THREE.MathUtils.lerp(flight.from.length(),flight.to.length(),f));
  if(flight.toTarget){viewTarget.lerpVectors(flight.fromTarget,flight.toTarget,f);slerpDirection(camera.up,flight.fromUp,flight.toUp,f);}
  camera.lookAt(viewTarget);
 }
 if(t===1){const done=flight.done;flight=null;done?.();}
}
const siteVector=site=>new THREE.Vector3(...coordinatesToVector(THREE.MathUtils.clamp(site.lat,-89.95,89.95),site.lon));
function fly(site,distance=2.6){startFlight({to:siteVector(site).multiplyScalar(distance)});}

// ---- Landing view: a tilted camera that orbits the site, like the driver's view in a car ----
const TILT=THREE.MathUtils.degToRad(62);
function surfaceCameraPosition(target,frame,azimuth,distance,tilt){ // behind the site, looking toward azimuth
 const ahead=flightB.fromArray(skyDirection(frame.lat,frame.lon,azimuth,0));
 return target.clone().addScaledVector(ahead,-Math.sin(tilt)*distance).addScaledVector(frame.up,Math.cos(tilt)*distance);
}
function surfaceHeading(){ // degrees east of north that the camera faces
 const forward=flightA.copy(surface.target).sub(camera.position);
 return (THREE.MathUtils.radToDeg(Math.atan2(forward.dot(surface.east),forward.dot(surface.north)))+360)%360;
}
function enterSurface(site){
 const lat=THREE.MathUtils.clamp(site.lat,-89.95,89.95),frame={lat,lon:site.lon,up:siteVector(site)};
 const info=patch.build(site),radius=info?.radius??1.0006,distance=(info?.polar??lat< -86.6)?.05:.2;
 const known=data&&Math.abs(data.lat-site.lat)<1e-5&&Math.abs(data.lon-site.lon)<1e-5?sampleAt(data.earth,observationTime()):null;
 surface?.controls?.dispose();controls.enabled=false;
 surface={site,frame,north:new THREE.Vector3(...skyDirection(lat,site.lon,0,0)),east:new THREE.Vector3(...skyDirection(lat,site.lon,90,0)),target:frame.up.clone().multiplyScalar(radius),radius,info,distance,controls:null};
 placeLabels();if(selected)updateBeams();camera.near=.0015;camera.updateProjectionMatrix();
 // Earth ahead by default, so the blue line runs up the screen like a route.
 startFlight({to:surfaceCameraPosition(surface.target,frame,known?.az??0,distance,TILT),toTarget:surface.target.clone(),toUp:frame.up.clone(),duration:1200,done:attachSurfaceControls});
 if(!info)setTimeout(()=>{if(surface?.site===site&&!surface.info){surface.info=patch.build(site);invalidate();}},1500);
}
function attachSurfaceControls(){
 if(!surface)return;
 const c=new OrbitControls(camera,renderer.domElement);c.target.copy(surface.target);c.enablePan=false;c.enableDamping=true;c.dampingFactor=.12;c.rotateSpeed=.5;c.zoomSpeed=.65;
 c.minDistance=surface.distance*.3;c.maxDistance=surface.distance*4.5;c.maxPolarAngle=THREE.MathUtils.degToRad(82);
 c.addEventListener('change',invalidate);c.addEventListener('start',()=>{flight=null;$('#hint').classList.add('gone');invalidate();});
 c.update();surface.controls=c;invalidate();
}
function exitSurface(to){
 if(!surface)return;
 surface.controls?.dispose();const site=surface.site;surface=null;placeLabels();if(selected)updateBeams();
 camera.near=.005;camera.updateProjectionMatrix();controls.enabled=false;
 startFlight({to:to??siteVector(site).multiplyScalar(2.6),toTarget:new THREE.Vector3(),toUp:Y_UP.clone(),duration:1000,done:()=>{camera.up.copy(Y_UP);controls.enabled=true;}});
}
function face(azimuth){
 if(!surface?.controls)return;
 const offset=camera.position.clone().sub(surface.target),distance=offset.length(),tilt=Math.max(.05,Math.acos(THREE.MathUtils.clamp(offset.dot(surface.frame.up)/distance,-1,1)));
 const from=surfaceHeading();startFlight({orbit:{from,delta:((azimuth-from+540)%360)-180,distance,tilt},duration:800});
}
function faceBody(name){const s=surface&&data?sampleAt(data[name],observationTime()):null;if(s)face(s.az);else toast(`${name==='sun'?'Sun':'Earth'} position is still loading.`);}
$('#face-sun').onclick=()=>faceBody('sun');$('#face-earth').onclick=()=>faceBody('earth');
function zoom(factor){
 if(surface?.controls){const c=surface.controls,offset=camera.position.clone().sub(c.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,c.minDistance,c.maxDistance));camera.position.copy(c.target).add(offset);}
 else if(!surface)camera.position.setLength(THREE.MathUtils.clamp(camera.position.length()*factor,controls.minDistance,controls.maxDistance));
 invalidate();
}
function goHome(){if(surface)setMode('explore',homePosition());else startFlight({to:homePosition()});}
$('#zoom-in').onclick=()=>zoom(.8);$('#zoom-out').onclick=()=>zoom(1.25);
$('#home').onclick=goHome;$('#rail-home').onclick=goHome;
$('#north').onclick=()=>{if(surface)face(0);else{camera.up.set(0,1,0);controls.update();invalidate();}};
$('#recenter').onclick=()=>{if(!selected)return;if(mode==='landing')enterSurface(selected);else fly(selected,2.2);};
function setPin(value){pinning=value;$('#pin').classList.toggle('active',value);$('#globe').classList.toggle('pinning',value);$('#hint').classList.toggle('gone',!value);$('#hint').textContent=value?'Click anywhere on the Moon to place your pin':'Drag to explore · Scroll to zoom';if(value)toast('Click the lunar surface to choose your location.');}
$('#pin').onclick=()=>setPin(!pinning);$('#pin-from-card').onclick=()=>setPin(true);
let pointerStart;
renderer.domElement.addEventListener('pointerdown',e=>pointerStart={x:e.clientX,y:e.clientY});
renderer.domElement.addEventListener('pointerup',e=>{if(!pinning||!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>6)return;const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);const hit=ray.intersectObject(moon)[0];if(!hit)return;const v=hit.point.normalize();const site={id:'pin-'+Date.now(),name:'Dropped pin',type:'Custom lunar coordinates',cat:'pin',lat:THREE.MathUtils.radToDeg(Math.asin(v.y)),lon:THREE.MathUtils.radToDeg(Math.atan2(-v.z,v.x))};addCustom(site);setPin(false);selectSite(site,false);});
function addCustom(site){for(let i=labels.length-1;i>=0;i--){if(labels[i].site.id.startsWith('pin-')&&!compared.some(s=>s.site.id===labels[i].site.id)){labels[i].el.remove();labels.splice(i,1);}}addLabel(site);}

// ---- Data ----
async function ephemeris(site,{reference=false,date=$('#date').value}={}){const key=[reference,site.lat,site.lon,date].join(':');if(clientCache.has(key))return clientCache.get(key);const promise=fetch(`/api/ephemeris?${new URLSearchParams({lat:site.lat.toFixed(6),lon:site.lon.toFixed(6),date,reference:reference?'1':'0'})}`).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load NASA data.');if(d.terrain)d.adjusted={sun:clearanceSeries(d.sun,d.terrain),earth:clearanceSeries(d.earth,d.terrain)};return d;});clientCache.set(key,promise);if(clientCache.size>40)clientCache.delete(clientCache.keys().next().value);try{return await promise;}catch(e){clientCache.delete(key);throw e;}}
async function selectSite(site,move=true){
 selected=site;$('#planner').scrollTop=0;$('#browse').hidden=true;$('#site-card').hidden=false;$('#search-results').innerHTML='';$('#search').value='';
 $('#site-name').textContent=site.name;$('#site-type').textContent=site.type;$('#site-coords').textContent=coord(site);
 $('#site-note').hidden=!site.note;$('#site-note').textContent=site.note||'';
 $('#site-badge').className=`badge big cat-${site.cat}`;$('#site-badge').innerHTML=icon(siteIcon(site));
 $('#link-quickmap').href=quickMapUrl(site.lat,site.lon);$('#link-trek').href=moonTrekUrl(site.lat,site.lon);
 if(mode==='landing')enterSurface(site);else if(move)fly(site,2.6);invalidate();await loadSelected();
}
async function loadSelected(){const token=++selectedRequest;data=null;refreshMetrics();$('#calculation-status').className='loading';$('#calculation-status').textContent='Checking terrain & NASA/JPL…';try{const result=await ephemeris(selected);if(token!==selectedRequest)return;data=result;$('#calculation-status').className='';$('#calculation-status').textContent='';refreshMetrics();updateLight();}catch(e){if(token!==selectedRequest)return;$('#calculation-status').className='error';$('#calculation-status').textContent=e.message;const retry=document.createElement('button');retry.className='text-button';retry.textContent='Retry';retry.onclick=loadSelected;$('#calculation-status').appendChild(retry);}}
function closeSite(){selected=null;data=null;++selectedRequest;$('#site-card').hidden=true;$('#browse').hidden=false;$('#search').value='';$('#search-results').innerHTML='';if(mode==='landing')setMode('explore');refreshMetrics();}
const pickSite=e=>{const id=e.target.closest('[data-site]')?.dataset.site;if(id)selectSite(sites.find(s=>s.id===id));};
$('#destinations').onclick=pickSite;$('#search-results').addEventListener('click',pickSite);
$('#close-card').onclick=closeSite;
$('#rail-search').onclick=()=>{if(selected)closeSite();$('#search').focus();};
$('#search').oninput=()=>{const q=$('#search').value.trim().toLowerCase();const results=$('#search-results');if(!q){results.innerHTML='';return;}const coords=q.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);if(coords){const lat=Number(coords[1]),lon=Number(coords[2]);if(Math.abs(lat)<=90&&Math.abs(lon)<=180){results.innerHTML=`<button id="coordinate-result" class="row cat-pin"><span class="badge">${icon('pin')}</span><span class="row-text"><strong>Go to ${safe(q)}</strong><small>Latitude, east longitude</small></span>${icon('chevron','chev')}</button>`;$('#coordinate-result').onclick=()=>{const s={id:'pin-'+Date.now(),name:'Dropped pin',lat,lon,cat:'pin',type:'Custom lunar coordinates'};addCustom(s);selectSite(s);};return;}}const found=sites.filter(s=>[s.name,s.description,s.type,categories[s.cat].label].join(' ').toLowerCase().includes(q));results.innerHTML=found.length?found.map(siteRow).join(''):'<p>No matching place. Try latitude, longitude (for example −85, 20), or drop a pin.</p>';};
$('#search').onkeydown=e=>{if(e.key==='Enter')$('#search-results button')?.click();};

// ---- Visibility windows ----
function lanes(d,start,end){
 const length=end-start;
 const lane=(name,y,color)=>segments(visibilityRows(d,name),start,end).map(([a,b])=>`<rect x="${((a-start)/length*100).toFixed(2)}" y="${y}" width="${Math.max(.25,(b-a)/length*100).toFixed(2)}" height="4.4" fill="${color}"/>`).join('');
 return lane('sun',0,SUN_COLOR)+lane('earth',5.6,EARTH_COLOR);
}
function drawBands(){
 const start=startDate(),stay=duration/168*100;
 $('.scrub').classList.toggle('has-bands',Boolean(data));
 $('#bands').innerHTML=data?lanes(data,start,start+168*HOUR)+(duration<168?`<rect x="${stay}" y="0" width="${100-stay}" height="10" fill="#000" opacity=".55"/><rect x="${stay-.15}" y="0" width=".3" height="10" fill="#fff" opacity=".7"/>`:''):'';
}
function updateBanner(time){
 const banner=$('#event-banner');
 if(!data){banner.className='banner';$('#event-icon').innerHTML=icon('clock');$('#event-count').textContent='—';$('#event-label').textContent='Calculating Sun and Earth windows';$('#event-sub').textContent='';return;}
 const events=['sun','earth'].map(name=>{const rows=visibilityRows(data,name),now=sampleAt(rows,time);return {name,cross:nextCrossing(rows,time),up:now?now.el>0:false};});
 const word=e=>e.name==='sun'?(e.cross.rising?'sunrise':'sunset'):(e.cross.rising?'Earthrise':'Earthset');
 const until=day(data.sun.at(-1).time);
 const steady=e=>e.name==='sun'?(e.up?`Sun stays up through ${until}`:`No sunlight through ${until}`):(e.up?`Earth stays in view through ${until}`:`Earth stays out of view through ${until}`);
 const next=events.filter(e=>e.cross).sort((a,b)=>a.cross.time-b.cross.time)[0];
 if(!next){
  const [s,e]=events;banner.className=`banner steady${s.up?' lit':''}`;
  $('#event-icon').innerHTML=icon(s.up?'sun':'moon');$('#event-count').textContent=s.up?'Sunlit':'In shadow';$('#event-label').textContent=`No sunrise or sunset through ${until}`;$('#event-sub').textContent=steady(e);return;
 }
 const other=events.find(e=>e!==next);
 banner.className=`banner ${next.name}`;
 $('#event-icon').innerHTML=icon(next.name==='sun'?'sun':'globe')+icon(next.cross.rising?'up':'down','arrow');
 $('#event-count').textContent=span(next.cross.time-time);
 $('#event-label').textContent=`until ${word(next)} · ${stamp(next.cross.time)}`;
 $('#event-sub').innerHTML=other.cross?`<b>${word(other).replace(/^./,c=>c.toUpperCase())}</b> in ${span(other.cross.time-time)} · ${stamp(other.cross.time)}`:steady(other);
}
function drawSky(currents,profile){
 const L=8,R=312,T=8,B=108;
 const points=profile?[...profile.angles.filter((_,i)=>i%8===0),profile.angles[0]]:[0,0];
 const low=Math.min(-5,...points)-1,high=Math.max(12,...points,...Object.values(currents).filter(Boolean).map(s=>s.el))+4;
 const y=el=>B-(el-low)/(high-low)*(B-T),x=az=>L+az/360*(R-L);
 const terrainPath=points.map((el,i)=>`${i?'L':'M'}${x(i/(points.length-1)*360).toFixed(1)},${y(el).toFixed(1)}`).join(' ');
 const track=(rows,color)=>{if(!rows)return '';let d='',previous=null;for(let t=startDate();t<=startDate()+duration*HOUR;t+=HOUR){const s=sampleAt(rows,t);if(!s){previous=null;continue;}const px=x(s.az);d+=`${previous===null||Math.abs(px-previous)>(R-L)/2?'M':'L'}${px.toFixed(1)},${y(s.el).toFixed(1)} `;previous=px;}return `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.5" stroke-opacity=".6" stroke-dasharray=".1 3.4" stroke-linecap="round"/>`;};
 const body=(current,color,label)=>{if(!current)return '';const below=current.el<low,blocked=current.el<=(profile?horizonAt(profile,current.az):0);const cx=x(current.az),cy=below?B-5:y(current.el),right=cx>250;return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="9" fill="${color}" opacity="${blocked?.1:.22}"/><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.6" fill="${color}" stroke="#1c1c1e" stroke-width="1.2" opacity="${blocked?.5:1}"/><text x="${(cx+(right?-10:10)).toFixed(1)}" y="${Math.max(T+9,cy-7).toFixed(1)}" text-anchor="${right?'end':'start'}" fill="${color}" font-size="9.5" font-weight="600">${label}${below?' ↓':''}</text>`;};
 $('#horizon').innerHTML=`<defs><clipPath id="sky-clip"><rect x="${L}" y="${T-6}" width="${R-L}" height="${B-T+6}" rx="8"/></clipPath><linearGradient id="sky-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0b0d"/><stop offset="1" stop-color="#1b1d22"/></linearGradient><linearGradient id="ground-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e8e93" stop-opacity=".55"/><stop offset="1" stop-color="#8e8e93" stop-opacity=".16"/></linearGradient></defs>
 <rect x="${L}" y="${T-6}" width="${R-L}" height="${B-T+6}" rx="8" fill="url(#sky-fill)"/>
 <g clip-path="url(#sky-clip)"><path d="M${L} ${y(0).toFixed(1)}H${R}" stroke="#fff" stroke-opacity=".28" stroke-dasharray="2 4"/>${data?track(data.sun,SUN_COLOR)+track(data.earth,EARTH_COLOR):''}<path d="${terrainPath} L${R},${B} L${L},${B} Z" fill="url(#ground-fill)"/><path d="${terrainPath}" fill="none" stroke="#d1d1d6" stroke-width="1.2"/>${body(currents.earth,'#409cff','Earth')}${body(currents.sun,SUN_COLOR,'Sun')}</g>
 <text x="${R-4}" y="${(y(0)-3).toFixed(1)}" text-anchor="end" fill="#fff" fill-opacity=".45" font-size="8">0°</text><text x="${L+5}" y="${T+5}" fill="#fff" fill-opacity=".45" font-size="8">${Math.round(high)}°</text>
 ${['N','E','S','W','N'].map((t,i)=>`<text x="${(L+i*(R-L)/4).toFixed(1)}" y="${B+15}" text-anchor="${i===0?'start':i===4?'end':'middle'}" fill="#fff" fill-opacity=".5" font-size="9" font-weight="600">${t}</text>`).join('')}`;
}
function refreshMetrics(){
 const time=observationTime(),profile=terrainEnabled?data?.terrain:null;
 const currents={sun:sampleAt(data?.sun,time),earth:sampleAt(data?.earth,time)};
 const end=startDate()+duration*HOUR;
 for(const name of ['sun','earth']){
  const current=currents[name],h=current?(profile?horizonAt(profile,current.az):0):null,clear=current?current.el-h:null;
  const up=clear!==null&&clear>0,terrainBlocked=current&&!up&&current.el>0&&Boolean(profile);
  $(`#${name}-elevation`).textContent=current?deg(current.el):'—';
  $(`#${name}-az`).textContent=current?`${number(current.az)}°`:'—';
  $(`#${name}-clear`).textContent=current?signedDeg(clear):'—';
  const state=$(`#${name}-state`);state.className=`state${up?' ok':terrainBlocked?' blocked':''}`;
  state.textContent=current?(up?(name==='sun'?'Sunlit':'Earth in view'):(terrainBlocked?'Blocked by terrain':'Below horizon')):(selected?'Awaiting terrain & JPL':'No site selected');
  const hours=data?visibleHours(visibilityRows(data,name),startDate(),end):null;
  $(`#${name}-window`).textContent=hours===null?'—':`≈ ${number(hours)} h · ${Math.round(hours/duration*100)}%`;
  $(`#${name}-bar`).style.width=hours===null?'0':`${Math.min(100,hours/duration*100)}%`;
  const indicator=$(`#rail-${name}`);indicator.className=`rail-ind ${name}${current?(up?' on':' off'):''}`;
  indicator.title=current?`${selected.name}: ${name==='sun'?(up?'sunlit':'no direct sunlight'):(up?'Earth in view':'Earth not in view')} at ${stamp(time)}`:`Select a site to see ${name==='sun'?'sunlight':'Earth visibility'}`;
 }
 document.querySelectorAll('.clear-label').forEach(el=>el.textContent=profile?'Above terrain':'Above horizon');
 $('#terrain-source').textContent=data?.terrain?(terrainEnabled?`${data.terrain.source} · dotted paths show the next ${duration===24?'24 hours':duration/24+' days'}`:'Reference horizon only · terrain ignored'):'Loading terrain…';
 drawSky(currents,profile);
 updateBanner(time);
 $('#next-event').textContent=`From 00:00 UTC ${day(startDate())} to ${stamp(end)} · ${terrainEnabled?'terrain included':'reference horizon'}`;
 $('#site-elevation').textContent=data?.terrain?`${data.terrain.elevationMeters<0?'−':'+'}${Math.abs(Math.round(data.terrain.elevationMeters)).toLocaleString()} m`:'—';
 $('#site-grid').textContent=data?.terrain?data.terrain.source:'—';
 const slope=data?.terrain?.slopeDegrees,baseline=data?.terrain?.slopeBaselineMeters;
 $('#site-slope').innerHTML=Number.isFinite(slope)?`${slope.toFixed(1)}°<small>${baseline>=1000?`regional, over ${(baseline/1000).toFixed(1)} km`:`over ${baseline} m`}</small>`:'—';
 $('#compare').disabled=!data;$('#compare span').textContent=compared.some(s=>s.id===`${selected?.id}@${$('#date').value}`)?`Comparing (${compared.length})`:'Compare';
 $('#compare-count').hidden=!compared.length;$('#compare-count').textContent=compared.length;
 $('#terrain-toggle').setAttribute('aria-pressed',String(terrainEnabled));$('#terrain-toggle').textContent=terrainEnabled?'Terrain on':'Terrain off';
 if(data?.terrain)$('#terrain-detail').textContent=`${data.terrain.source}. Observer ${(data.terrain.elevationMeters+2).toFixed(1)} m above the 1,737.4 km reference radius (2 m above the DEM). Horizon sampled every 0.25° to 300 km; 40 m polar grid south of 85°S, 80 m grid from 80°S to 85°S, 1.9 km global background. Slope is a central difference across one grid cell either side of the site and is not a hazard assessment. Grid spacing is not an accuracy guarantee. Small obstacles and narrow ridges may be missed.`;
 drawBands();updateBeams();updateCursor();renderLunar();
}
$('#terrain-toggle').onclick=()=>{terrainEnabled=!terrainEnabled;refreshMetrics();renderComparison();};
$('#duration').onclick=e=>{const b=e.target.closest('[data-duration]');if(!b)return;duration=Number(b.dataset.duration);$('#duration').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));refreshMetrics();renderComparison();};

// ---- Time ----
function updateClock(){
 const time=observationTime(),iso=new Date(time).toISOString(),hours=Number($('#time').value),d=Math.floor(hours/24),h=hours-d*24;
 $('#clock').textContent=iso.slice(11,16);$('#clock-date').textContent=day(time);$('#rail-clock').textContent=iso.slice(11,16);$('#rail-clock').dateTime=iso;
 $('#met').textContent=`T+${d?d+' d ':''}${Number.isInteger(h)?h:h.toFixed(2)} h`;
 $('#range-start').textContent=day(startDate());$('#date').title=`Observation: ${iso.replace('T',' ').slice(0,16)} UTC`;$('#clock').title=iso;
}
function updateCursor(){const hours=Number($('#time').value);$('#comparison-cards').style.setProperty('--cursor',hours<=duration?`${hours/duration*100}%`:'-10%');$('#lunar-plot').style.setProperty('--lunar-cursor',`${hours/(LUNAR_DAYS*24)*100}%`);}
let referenceData=null,referenceToken=0;
async function referenceLight(){const token=++referenceToken;try{const result=await ephemeris({lat:0,lon:0},{reference:true});if(token!==referenceToken)return;referenceData=result;updateLight();}catch(e){$('#map-status').textContent='NASA imagery · lighting unavailable';}}
function updateLight(){const d=data||referenceData;if(!d)return;const s=sampleAt(d.sun,observationTime());if(!s)return;sun.position.fromArray(skyDirection(d.lat,d.lon,s.az,s.el)).multiplyScalar(10);shadows.update(sun.position);invalidate();}
$('#time').oninput=()=>{updateClock();refreshMetrics();updateLight();};
function stop(){playing=false;clearInterval(playTimer);$('#play').innerHTML=icon('play');$('#play').setAttribute('aria-label','Play time animation');}
$('#play').onclick=()=>{if(playing){stop();return;}playing=true;$('#play').innerHTML=icon('pause');$('#play').setAttribute('aria-label','Pause time animation');playTimer=setInterval(()=>{let t=Number($('#time').value)+.25;if(t>168){stop();return;}$('#time').value=t;$('#time').oninput();},120);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else invalidate();});
function applyDate(value,load=true){$('#date').value=value;lastValidDate=value;stop();referenceData=null;shadows.pending();updateClock();if(!load)return;if(selected)loadSelected();else referenceLight();}
$('#date').onchange=()=>{if(!$('#date').validity.valid||!$('#date').value){toast('Choose a valid date between 2000 and 2099.');$('#date').value=lastValidDate;return;}applyDate($('#date').value);};
$('#today').onclick=()=>{$('#date').value=new Date().toISOString().slice(0,10);$('#time').value=new Date().getUTCHours();$('#date').onchange();};

// ---- Map chooser ----
function showPicker(value){$('#map-picker').hidden=!value;$('#map-mode').setAttribute('aria-expanded',String(value));}
$('#map-mode').onclick=()=>showPicker($('#map-picker').hidden);
$('#close-picker').onclick=()=>showPicker(false);
document.addEventListener('pointerdown',e=>{if(!$('#map-picker').hidden&&!e.target.closest('#map-picker,#map-mode'))showPicker(false);});
function setMode(name,exitTo){
 mode=name;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode===name));
 setSunlight(name!=='satellite');$('#heading-tools').hidden=name!=='landing';
 $('#map-status').textContent=name==='satellite'?'NASA / LRO mosaic · unlit reference imagery':name==='landing'?'Landing view · LOLA relief at true scale':'NASA / LRO · JPL-driven global illumination';
 if(name==='landing')selectSite(selected||sites[0]);else exitSurface(exitTo);
 showPicker(false);invalidate();
}
for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>setMode(b.dataset.mode);

// ---- Lunar day: the 30 days that follow the landing date ----
const LUNAR_DAYS=30;
let lunarMemo=null,lunarBest=null;
function renderLunar(){
 if(lunarMemo&&lunarMemo.data===data&&lunarMemo.duration===duration&&lunarMemo.terrain===terrainEnabled&&lunarMemo.selected===selected)return;
 lunarMemo={data,duration,terrain:terrainEnabled,selected};lunarBest=null;
 const chart=$('#lunar-chart'),facts=$('#lunar-facts'),status=$('#lunar-status');
 const idle=text=>{chart.hidden=true;facts.innerHTML='';status.textContent=text;$('#lunar-range').textContent='';};
 if(!data){idle(selected?'Loading 30 days of Sun and Earth positions…':'');return;}
 const start=data.sun[0].time,end=start+LUNAR_DAYS*DAY;
 if(data.sun.at(-1).time<end){idle('The running server returned fewer than 30 days. Restart Zoriana to load the full lunar day.');return;}
 status.textContent='';chart.hidden=false;$('#lunar-range').textContent=`${day(start)} – ${day(end)}`;
 const sunRows=visibilityRows(data,'sun'),earthRows=visibilityRows(data,'earth');
 const lit=segments(sunRows,start,end),dark=gaps(lit,start,end),seen=segments(earthRows,start,end);
 const total=list=>list.reduce((sum,[a,b])=>sum+b-a,0),share=list=>Math.round(total(list)/(end-start)*100);
 // A stretch that touches either edge of the window may continue beyond it, so it is a minimum.
 const stretch=list=>{const best=longest(list);if(!best)return 'None';return `${best[0]<=start||best[1]>=end?'≥ ':''}${span(best[1]-best[0])}<small>from ${day(best[0])}</small>`;};
 const peak=data.sun.reduce((best,r)=>r.time<=end&&r.el>best.el?r:best,data.sun[0]);
 const scores=landingDays(sunRows,earthRows,start,LUNAR_DAYS,duration),best=bestLandingDay(scores);lunarBest=best;
 $('#lunar-bars').innerHTML=scores.map(s=>{if(!s)return '';const h=Math.max(.4,s.sun/duration*10);return `<rect x="${s.day+.14}" y="${(10-h).toFixed(2)}" width=".72" height="${h.toFixed(2)}" fill="${SUN_COLOR}" opacity="${best&&best.sun>0&&s.day===best.day?1:s.sun>0?.5:.18}"/>`;}).join('');
 $('#lunar-bands').innerHTML=lanes(data,start,end);
 $('#lunar-window').style.width=`${duration/(LUNAR_DAYS*24)*100}%`;
 $('#lunar-days').innerHTML=scores.map((s,d)=>{const t=start+d*DAY,text=s?`${day(t)}: ${number(s.sun)} h sunlit and ${number(s.earth)} h Earth in view for a ${stayLabel()} stay`:`${day(t)}: a ${stayLabel()} stay runs past the 30-day window`;return `<button data-day="${d}" title="${text}" aria-label="Land ${text}"${d?'':' disabled'}></button>`;}).join('');
 $('#lunar-ticks').innerHTML=[0,7,14,21,28].map(d=>`<span style="left:${d/LUNAR_DAYS*100}%">${day(start+d*DAY)}</span>`).join('');
 $('#lunar-caption').textContent=`Bars: sunlit share of a ${stayLabel()} stay for each landing day. Select a day to land then.`;
 const row=(label,value)=>`<div><span>${label}</span><b>${value}</b></div>`;
 facts.innerHTML=row('Sunlit, next 30 days',`${share(lit)}% · ${(total(lit)/DAY).toFixed(1)} d`)+row('Longest sunlight',stretch(lit))+row('Longest darkness',stretch(dark))+row('Earth in view, next 30 days',`${share(seen)}%`)+row('Peak Sun elevation',`${deg(peak.el)}<small>${day(peak.time)}</small>`)+
  (best&&best.sun>0?`<div><span>Best landing day<br>for a ${stayLabel()} stay</span><b>${day(best.start)}${best.day?'':' (current)'}<small>${number(best.sun)} h sunlit · ${number(best.earth)} h Earth</small></b></div><div class="best-actions">${best.day?'<button id="lunar-use" class="mini-toggle">Use this date</button>':''}<button id="lunar-compare" class="mini-toggle">Add to compare</button></div>`:row(`Best landing day for a ${stayLabel()} stay`,'No sunlit stay in this window'));
}
$('#lunar-days').onclick=e=>{const d=e.target.closest('[data-day]')?.dataset.day;if(!d||!data)return;const date=shiftDate(data.date,Number(d));if(date)applyDate(date);else toast('That date is outside the supported range (2000–2099).');};
$('#lunar-facts').onclick=e=>{
 if(!lunarBest||!selected||!data)return;
 const date=shiftDate(data.date,lunarBest.day);if(!date)return;
 if(e.target.closest('#lunar-use'))applyDate(date);
 else if(e.target.closest('#lunar-compare')){addOption(selected,data.date);if(date!==data.date)addOption(selected,date);}
};

// ---- Comparison: each option is a site on a landing date, lined up by mission time ----
const MAX_OPTIONS=4,DATE_MIN='2000-01-01',DATE_MAX='2099-12-24';
let comparisonToken=0;
function shiftDate(date,days){const shifted=new Date(Date.parse(date+'T00:00:00Z')+days*DAY).toISOString().slice(0,10);return shifted>=DATE_MIN&&shifted<=DATE_MAX?shifted:null;}
function addOption(site,date){
 const id=`${site.id}@${date}`;
 if(!compared.some(s=>s.id===id)){
  if(compared.length>=MAX_OPTIONS){toast(`Compare up to ${MAX_OPTIONS} options. Remove one to add another.`);return;}
  compared.push({id,site:{...site},date});
 }
 $('#comparison').hidden=false;refreshMetrics();renderComparison();
}
function openOption(option){if($('#date').value!==option.date)applyDate(option.date,false);selectSite(option.site);}
$('#compare').onclick=()=>{if(selected)addOption(selected,$('#date').value);};
$('#rail-compare').onclick=()=>{if(!compared.length){toast('Open a site and choose Compare to line up sites and landing dates.');return;}$('#comparison').hidden=!$('#comparison').hidden;if(!$('#comparison').hidden)renderComparison();};
async function renderComparison(){
 if(!compared.length){$('#comparison').hidden=true;return;}
 $('#comparison-method').textContent=`${stayLabel()} stay from 00:00 UTC on each landing date · ${terrainEnabled?'terrain included':'reference horizon'}`;
 const token=++comparisonToken,totals=[];
 $('#comparison-cards').innerHTML=compared.map((s,i)=>`<article class="compare-card" data-compare="${safe(s.id)}"><div class="compare-head cat-${s.site.cat}"><span class="badge">${icon(siteIcon(s.site))}</span><strong>${safe(s.site.name)}</strong><button aria-label="Remove ${safe(s.site.name)}, ${fullDay(s.date)}" data-remove>${icon('x')}</button></div><small><b>Lands ${fullDay(s.date)}</b> · <span class="mono">${shortCoord(s.site)} ${shortLon(s.site)}</span></small><div class="tags">${i===0&&compared.length>1?'<span class="tag base">Baseline</span>':''}</div><div class="results"><p class="waiting">Loading NASA/JPL…</p></div><div class="card-actions"><button class="go" data-go>Open</button><span class="shift">Same site<button data-shift="1">+1 d</button><button data-shift="7">+7 d</button><button data-shift="14">+14 d</button><button data-shift="30">+30 d</button></span></div></article>`).join('');
 const cards=[...$('#comparison-cards').children];
 for(const [i,s] of compared.entries()){
  const card=cards[i];
  try{
   const d=await ephemeris(s.site,{date:s.date});if(token!==comparisonToken)return;
   const start=Date.parse(s.date+'T00:00:00Z'),end=start+duration*HOUR;
   const sunHours=visibleHours(visibilityRows(d,'sun'),start,end),earthHours=visibleHours(visibilityRows(d,'earth'),start,end);
   if(sunHours===null||earthHours===null)throw new Error('Series does not cover the stay.');
   totals.push({id:s.id,card,sun:sunHours,earth:earthHours});
   const lane=(name,y,hours)=>`<div class="lane"><div class="track"><svg viewBox="0 ${y} 100 4.4" preserveAspectRatio="none" aria-hidden="true">${lanes(d,start,end)}</svg></div><b data-total="${name}">${number(hours)} h</b></div>`;
   card.querySelector('.results').innerHTML=lane('sun',0,sunHours)+lane('earth',5.6,earthHours);
  }catch(e){if(token!==comparisonToken)return;card.querySelector('.results').innerHTML='<p class="waiting">JPL unavailable for this option. Reopen the panel to retry.</p>';}
 }
 if(totals.length<2)return;
 for(const [key,label] of [['sun','Most sunlight'],['earth','Longest Earth view']]){const best=Math.max(...totals.map(t=>t[key]));const winners=totals.filter(t=>t[key]===best);if(best>0&&winners.length===1)winners[0].card.querySelector('.tags').insertAdjacentHTML('beforeend',`<span class="tag ${key}">${label}</span>`);}
 // Differences against the first option, so a slipped date or a moved site reads at a glance.
 const base=totals.find(t=>t.id===compared[0].id);
 if(base)for(const t of totals){if(t===base)continue;for(const key of ['sun','earth']){const delta=t[key]-base[key];if(Math.abs(delta)>=.05)t.card.querySelector(`[data-total="${key}"]`).insertAdjacentHTML('beforeend',`<small class="${delta>0?'up':'down'}">${delta>0?'+':'−'}${number(Math.abs(delta))}</small>`);}}
}
$('#comparison-cards').onclick=e=>{
 const option=compared.find(s=>s.id===e.target.closest('[data-compare]')?.dataset.compare);if(!option)return;
 if(e.target.closest('[data-remove]')){compared=compared.filter(s=>s!==option);renderComparison();refreshMetrics();return;}
 if(e.target.closest('[data-go]')){openOption(option);return;}
 const shift=e.target.closest('[data-shift]');if(!shift)return;
 const date=shiftDate(option.date,Number(shift.dataset.shift));if(date)addOption(option.site,date);else toast('That date is outside the supported range (2000–2099).');
};
$('#close-compare').onclick=()=>{$('#comparison').hidden=true;};

for(const id of ['about','details','sources'])$('#'+id).onclick=()=>$('#info').showModal();$('#close-info').onclick=()=>$('#info').close();$('#info').onclick=e=>{if(e.target===$('#info')){const r=$('#info').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#info').close();}};
updateClock();refreshMetrics();referenceLight();invalidate();
