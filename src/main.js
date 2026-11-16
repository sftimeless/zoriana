// Zoriana map client. Written with AI coding assistance (OpenAI Codex, Anthropic Claude Code)
// under human direction during NASA Space Apps 2026. See README.md for sources and limits.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { DAY, sampleAt, visibleHours, nextCrossing, coordinatesToVector, skyDirection, centeredPosition } from './ephemeris.mjs';
import { segments, span, gaps, longest, arrivalWindows, landingDays, bestLandingDay, bestLandingTime, crossingSpread, together, stayMetrics, compassPoint, staySentence } from './windows.mjs';
import { earthMeshRotation } from './earth-orientation.mjs';
import { horizonAt, obstructionAt, clearanceSeries, destination, RADIUS } from './terrain-math.mjs';
import { createRenderDiagnostics } from './performance.mjs';
import { createTerrainShadows } from './terrain-shadows.mjs';
import { createSurfacePatch } from './surface-patch.mjs';
import { quickMapUrl, moonTrekUrl } from './links.mjs';
import { toCsv } from './export.mjs';
import { parseCoordinates, formatCoordinates } from './coords.mjs';
import { sites } from './sites.mjs';
import { searchFeatures, placeName } from './features.mjs';
import { eclipseSeries, eclipseAt, eclipseEvents } from './eclipse.mjs';
import { nextListedEclipse } from './eclipse-catalog.mjs';
import { discSeries, discAt, discHours, limbEvents, SUN_RADIUS_KM, EARTH_RADIUS_KM } from './disc.mjs';
import { createGuide, explainName, EXPLAIN, AVATAR } from './guide.mjs';
import { POLAR, HEAT, poleOf, polarPixel, polarLatLon, shadowNear, topCells, addPolarOverlay } from './psr.mjs';
import './style.css';

const $=s=>document.querySelector(s);
const HOUR=3600000;
const SUN_COLOR='#ffd60a',EARTH_COLOR='#0a84ff',BOTH_COLOR='#30d158';
const icon=(name,cls='')=>`<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

// The curated sites and the sources of their coordinates are in sites.mjs.
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

const openedPlain=location.search==='';   // a first visit with nothing asked for: the guide may say hello
let guide=null;
let selected=null,mode='explore',pinning=false,data=null,selectedRequest=0,playing=false,flight=null,compared=[],playTimer=null;
let restoring=true; // true until the address has been read at start-up
let terrainEnabled=true,duration=72,filter='all',landingHour=0; // landing hour: UTC hour of day the stay begins
let tour=null,flybyWanted=0; // fly-by state: {t,speed,playing,last,heading,lowKm,clearKm}, and when one was asked for
let surface=null; // landing view state: {site,frame,north,east,target,radius,info,distance,controls}
const clientCache=new Map();
const visibilityRows=(d,name)=>terrainEnabled&&d.terrain?d.adjusted[name]:(name==='sun'&&d.level?d.level.sun:d[name]);
// Share of the Sun's or Earth's disk above the same horizon, worked out once per loaded site.
const discRows=(d,name)=>{const terrain=terrainEnabled&&d.terrain?d.terrain:null,key=(terrain?'terrain:':'flat:')+name;d.discMemo??={};return d.discMemo[key]??=(()=>{const series=discSeries(d[name],terrain,name==='sun'?SUN_RADIUS_KM:EARTH_RADIUS_KM);
 // During an eclipse, the part of the Sun's disk behind Earth does not count as showing.
 return name==='sun'&&d.eclipse&&series?.length===d.eclipse.length?series.map((r,i)=>({...r,fraction:r.fraction*(1-d.eclipse[i].coverage)})):series;})();};
// A stay as stretches of time: no sunlight, Earth out of view, and both available together.
const stayStretches=(d,start,end)=>{const sun=visibilityRows(d,'sun'),earth=visibilityRows(d,'earth'),lit=segments(sun,start,end),seen=segments(earth,start,end);return {lit,seen,dark:gaps(lit,start,end),outage:gaps(seen,start,end),both:segments(together(sun,earth),start,end)};};
const withDisc=(metrics,d,start,end)=>metrics&&{...metrics,sunDisc:discHours(discRows(d,'sun'),start,end),stretches:stayStretches(d,start,end)};
let appVersion='',requestInfo=null; // read from the server's answers, for the exports and the method sheet
const TIMELINE_HOURS=720; // the time slider spans the 30 days after landing
const dayStart=date=>Date.parse(date+'T00:00:00Z');
// The landing moment: the start of the stay and the zero of the timeline.
const startDate=()=>dayStart($('#date').value)+landingHour*HOUR;
const hourText=h=>`${String(h).padStart(2,'0')}:00`;
const observationTime=()=>startDate()+Number($('#time').value)*HOUR;
const number=n=>Number(n).toFixed(1);
const deg=n=>`${n<0?'−':''}${Math.abs(n).toFixed(1)}°`;
const signedDeg=n=>`${n<0?'−':'+'}${Math.abs(n).toFixed(1)}°`;
const coord=s=>`${Math.abs(s.lat).toFixed(4)}° ${s.lat<0?'S':'N'}   ${Math.abs(s.lon).toFixed(4)}° ${s.lon<0?'W':'E'}`;
const shortCoord=s=>`${Math.abs(s.lat).toFixed(1)}°${s.lat<0?'S':'N'}`;
const shortLon=s=>`${Math.abs(s.lon).toFixed(1)}°${s.lon<0?'W':'E'}`;
const fullDay=date=>new Date(date+'T00:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
const stayLabel=()=>duration<72?`${duration} h`:`${duration/24} d`;
// Pins the user makes are lettered in the order they first appear, so two of them can be told apart.
const pinNames=new Map();
const pinName=(lat,lon)=>{const key=`${lat.toFixed(4)},${lon.toFixed(4)}`;if(!pinNames.has(key)){const n=pinNames.size;pinNames.set(key,`Pin ${n<26?String.fromCharCode(65+n):n+1}`);}return pinNames.get(key);};
const coordText=s=>s.cat==='pin'?`${Math.abs(s.lat).toFixed(3)}°${s.lat<0?'S':'N'} ${Math.abs(s.lon).toFixed(3)}°${s.lon<0?'W':'E'}`:`${shortCoord(s)} ${shortLon(s)}`;
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=t=>new Date(t).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
const stamp=t=>`${day(t)}, ${new Date(t).toISOString().slice(11,16)} UTC`;
const shortStamp=t=>`${day(t)} ${new Date(t).toISOString().slice(11,16)}`;
// Whether a moment is behind us, happening, or still to come (within the hour counts as now).
const whenWord=t=>Math.abs(t-Date.now())<HOUR?'now':t<Date.now()?'past':'future';
// A list of time stretches in words, at most four of them.
const stretches=(items,none)=>items.length?items.slice(0,4).map(([a,b])=>`${shortStamp(a)} to ${shortStamp(b)} (${span(b-a)})`).join('; ')+(items.length>4?`; and ${items.length-4} more`:''):none;

$('#date').value=new Date().toISOString().slice(0,10);
let lastValidDate=$('#date').value;
let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,Math.max(3800,text.length*60));}

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
const camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.005,600);
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
const SUN_INTENSITY=2.65,sun=new THREE.DirectionalLight(0xffffff,SUN_INTENSITY);sun.position.set(-2,.2,-4);scene.add(sun);
let sunlightEnabled=true;
const shadows=createTerrainShadows(renderer,material,invalidate,text=>{if(sunlightEnabled)$('#map-status').textContent=text;});
const patch=createSurfacePatch(scene,shadows);
// NASA's polar maps, drawn on every Moon material: permanently shadowed regions (blue tint) and
// the long-term average visibility of the Sun and Earth (the "where to land" heat map).
const polarUniforms={psrSouth:{value:null},psrNorth:{value:null},heatSouth:{value:null},heatNorth:{value:null},slopeSouth:{value:null},slopeNorth:{value:null},psrVisible:{value:1},heatMode:{value:0},earthDirection:{value:new THREE.Vector3()}};
for(const m of [material,satelliteMaterial,patch.material])addPolarOverlay(m,polarUniforms);
const polarLoader=new THREE.TextureLoader(),polarImages={psr:{},heat:{},slope:{}},polarPending={};
let psrEnabled=true,heatMode='off';
// Loads one map once. Resolves to its image, or null if it could not be loaded.
function loadPolar(kind,pole){
 return polarPending[kind+pole]??=new Promise(resolve=>polarLoader.load(POLAR[kind].path(pole),texture=>{
  texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());polarUniforms[kind+pole[0].toUpperCase()+pole.slice(1)].value=texture;polarImages[kind][pole]=texture.image;
  if(selected){$('#site-shadow').innerHTML=psrFact(selected);$('#site-average').innerHTML=averageFact(selected);}
  invalidate();resolve(texture.image);
 },undefined,()=>resolve(null)));
}
function setPsr(value){psrEnabled=value;$('#psr').setAttribute('aria-pressed',String(value));polarUniforms.psrVisible.value=value?1:0;invalidate();}
$('#psr').onclick=()=>{setPsr(!psrEnabled);toast(psrEnabled?'Blue patches: ground that never gets direct sunlight. NASA LOLA maps, within 15° of each pole.':'Permanent shadow map hidden.');syncUrl();};
loadPolar('psr','south');loadPolar('psr','north');
// ---- Poles and grid: where north and south are. The Moon turns about the line through its poles; latitude is counted
// from the equator and longitude from the middle of the side that faces Earth. A layer for orientation and for teaching. ----
const grid=new THREE.Group();grid.visible=false;scene.add(grid);
let gridEnabled=false;
{
 const at=(lat,lon,r=1.0015)=>new THREE.Vector3(...coordinatesToVector(lat,lon)).multiplyScalar(r);
 const ring=(points,color,opacity)=>grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false})));
 for(const lat of [-60,-30,0,30,60])ring(Array.from({length:181},(_,i)=>at(lat,i*2-180)),lat?0xffffff:0xffd60a,lat?.2:.8);
 for(let lon=-180;lon<180;lon+=30)ring(Array.from({length:89},(_,i)=>at(i*2-88,lon)),0xffffff,lon?.2:.5);
 // The axis shows as a short pole standing out of each end: red for north, blue for south.
 for(const [sign,color] of [[1,0xff453a],[-1,0x64d2ff]]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.0035,.0035,.26,8),new THREE.MeshBasicMaterial({color}));pole.position.y=sign*1.13;grid.add(pole);}
}
const gridLabels=[['North Pole','north',new THREE.Vector3(0,1.3,0)],['South Pole','south',new THREE.Vector3(0,-1.3,0)],['Equator','equator',new THREE.Vector3()]].map(([text,kind,point])=>{const el=document.createElement('div');el.className=`feature-label grid-label ${kind}`;el.textContent=text;el.hidden=true;$('#labels').appendChild(el);return {el,kind,point};});
function setGrid(value){gridEnabled=value;$('#grid').setAttribute('aria-pressed',String(value));invalidate();}
$('#grid').onclick=()=>{setGrid(!gridEnabled);toast(gridEnabled?'Red pole: north. Blue pole: south. Yellow ring: the equator. Grid lines every 30°; the brighter one runs through the middle of the side facing Earth.':'Poles and grid hidden.');syncUrl();};
function placeGridLabels(){
 const show=gridEnabled&&!surface;grid.visible=show;
 for(const g of gridLabels){
  if(!show){g.el.hidden=true;continue;}
  // The equator's name sits on the equator a little to one side of where the camera is looking.
  if(g.kind==='equator'){const a=Math.atan2(camera.position.z,camera.position.x)+.95;g.point.set(Math.cos(a)*1.003,0,Math.sin(a)*1.003);}
  const p=projected.copy(g.point).project(camera);
  g.el.hidden=hiddenByMoon(g.point)||Math.abs(p.x)>1||Math.abs(p.y)>1||p.z>1;
  if(!g.el.hidden)g.el.style.transform=`translate3d(${((p.x+1)*innerWidth/2).toFixed(1)}px,${((1-p.y)*innerHeight/2).toFixed(1)}px,0) translate(-50%,-50%)`;
 }
}
// A square window of map pixels around a site, or null when the site is outside the maps or the
// map has not loaded yet.
const polarCanvas=document.createElement('canvas');
function polarWindow(kind,site,width){
 const pixel=polarPixel(site.lat,site.lon,POLAR[kind].size),image=pixel&&polarImages[kind][pixel.pole];if(!image)return null;
 polarCanvas.width=polarCanvas.height=width;const ctx=polarCanvas.getContext('2d',{willReadFrequently:true}),half=(width-1)/2;
 ctx.drawImage(image,Math.floor(pixel.x)-half,Math.floor(pixel.y)-half,width,width,0,0,width,width);
 return {pixel,rgba:ctx.getImageData(0,0,width,width).data};
}
const PSR_WINDOW=101,NOT_MAPPED='<small>NASA’s maps cover within 15° of each pole</small>';
const psrMemo=new Map(),siteKey=site=>`${site.lat.toFixed(4)}:${site.lon.toFixed(4)}`;
// Whether a place lies in permanent shadow, and how far the nearest one is.
function psrAt(site){
 if(!poleOf(site.lat))return {covered:false};if(psrMemo.has(siteKey(site)))return psrMemo.get(siteKey(site));
 const window=polarWindow('psr',site,PSR_WINDOW);if(!window)return null;
 const values=new Uint8Array(PSR_WINDOW*PSR_WINDOW);for(let i=0;i<values.length;i++)values[i]=window.rgba[i*4];
 const result={covered:true,...shadowNear(values,PSR_WINDOW)};psrMemo.set(siteKey(site),result);return result;
}
function psrFact(site){
 const r=site?psrAt(site):undefined;if(r===undefined)return '—';if(r===null)return 'Loading map';
 if(!r.covered)return 'Not mapped here'+NOT_MAPPED;
 if(r.inside)return 'Yes<small>NASA maps this spot as never sunlit</small>';
 return r.nearestMeters===null?`No<small>none within ${Math.round(r.reachMeters/1000)} km</small>`:`No<small>nearest is ${r.nearestMeters<1000?`${Math.round(r.nearestMeters/10)*10} m`:`${(r.nearestMeters/1000).toFixed(1)} km`} away</small>`;
}
// NASA's long-term average for a place: the share of time some of the Sun's, and of Earth's, disk
// is above the terrain. The heat maps are fetched the first time a polar site needs them.
function averageAt(site){
 const pole=poleOf(site.lat);if(!pole)return {covered:false};
 const window=polarWindow('heat',site,1);if(!window){loadPolar('heat',pole);return null;}
 return {covered:true,sun:window.rgba[0]/255,earth:window.rgba[1]/255};
}
const percent=v=>`${Math.round(v*100)}%`;
function averageFact(site){
 const r=site?averageAt(site):undefined;if(r===undefined)return '—';if(r===null)return 'Loading map';
 if(!r.covered)return 'Polar regions only'+NOT_MAPPED;
 return `Sun ${percent(r.sun)} · Earth ${percent(r.earth)}<small>of the time over many years, NASA model</small>`;
}
// Heat map: off, or one of the HEAT modes. The button and its legend both step through them.
function setHeat(name){
 heatMode=HEAT[name]?name:'off';const h=HEAT[heatMode];
 polarUniforms.heatMode.value=h?h.code:0;$('#heat').setAttribute('aria-pressed',String(Boolean(h)));$('#heat-legend').hidden=!h;
 if(h){const kind=heatMode==='slope'?'slope':'heat';loadPolar(kind,'south');loadPolar(kind,'north');$('#heat-legend').style.setProperty('--heat',h.color);$('#heat-legend').classList.toggle('caution-scale',heatMode==='slope');$('#heat-name').textContent=h.label;$('#heat-range').textContent=heatMode==='slope'?`amber: ${h.from}° to ${h.to}° · red: over ${h.to}°`:heatMode==='both'?'low → high':heatMode==='earth'?'poles: long-term · elsewhere: Earth up now · band: Earth rises and sets':`${percent(h.from)} → ${percent(h.to)}+ of the time`;}
 for(const b of document.querySelectorAll('#layer-picker [data-heat]'))b.setAttribute('aria-checked',String(b.dataset.heat===heatMode));
 invalidate();syncUrl();
}
// The layers are chosen by name from a small menu (the ring-shaped button, or the legend).
function showLayers(value){$('#layer-picker').hidden=!value;$('#heat').setAttribute('aria-expanded',String(value));if(value)showPicker(false);}
$('#heat').onclick=$('#heat-legend').onclick=()=>showLayers($('#layer-picker').hidden);
$('#close-layers').onclick=()=>showLayers(false);
document.addEventListener('pointerdown',e=>{if(!$('#layer-picker').hidden&&!e.target.closest('#layer-picker,#heat,#heat-legend'))showLayers(false);});
const heatNotes={
 sun:'Average sunlight: brighter is better. NASA’s long-term maps, within 15° of each pole.',
 earth:'Earth view. Near the poles: NASA’s long-term average. Elsewhere: blue where Earth is above level ground now, and a brighter band where Earth rises and sets over a month.',
 both:'Sun × Earth score: brighter is better. NASA’s long-term maps, within 15° of each pole.',
 slope:'Slope, measured over 160 m from NASA’s LOLA terrain within 10° of each pole: amber is 5° to 10°, red is steeper than 10°. It is not a hazard map: rocks and small craters are not resolved.'
};
$('#layer-picker').onclick=e=>{
 const choice=e.target.closest('[data-heat]');if(!choice)return;
 setHeat(choice.dataset.heat);
 if(heatMode==='off'){toast('Map layer hidden.');return;}
 toast(heatNotes[heatMode]);
 // From a view of the equator a polar layer shows nothing, so turn to the south pole.
 if(heatMode!=='earth'&&!surface&&!selected&&Math.abs(camera.position.y)/camera.position.length()<.8)startFlight({to:new THREE.Vector3(...coordinatesToVector(-84,15)).multiplyScalar(2.4)});
};
// Finds a better spot within 15 km of the selected site, in two steps: NASA's long-term maps pick
// a handful of promising, well-separated cells, then each one is run through the full calculation
// for the chosen landing time and stay, and the best of them for those dates gets a pin.
const BEST_RADIUS_KM=15,BEST_CANDIDATES=20,BEST_BATCH=5;
$('#best-nearby').onclick=async()=>{
 const site=selected,pole=site&&poleOf(site.lat),button=$('#best-nearby');if(!pole||button.disabled)return;
 button.disabled=true;
 try{
  if(!await loadPolar('heat',pole)){toast('The long-term maps could not be loaded. Please retry.');return;}
  const radius=Math.round(BEST_RADIUS_KM*1000/POLAR.heat.gridMeters),window=polarWindow('heat',site,2*radius+1);
  const cells=window?topCells(window.rgba,2*radius+1,radius,BEST_CANDIDATES,3).filter(c=>c.distance>=1.5):[];
  if(!cells.length){toast(`Nothing else within ${BEST_RADIUS_KM} km has both sunlight and a view of Earth on NASA’s long-term maps.`);return;}
  toast(`Checking the ${cells.length} most promising spots within ${BEST_RADIUS_KM} km for your dates…`);
  const date=$('#date').value,start=startDate(),end=start+duration*HOUR;
  const measure=d=>stayMetrics(visibilityRows(d,'sun'),visibilityRows(d,'earth'),d.sun,start,end);
  // A few at a time, so the terrain service is not flooded, with progress shown as it goes.
  const check=async cell=>{
   const place=polarLatLon(pole,Math.floor(window.pixel.x)+cell.dx+.5,Math.floor(window.pixel.y)+cell.dy+.5,POLAR.heat.size);
   const spot={id:`pin-${place.lat.toFixed(4)}_${place.lon.toFixed(4)}`,name:'Best nearby spot',type:`Best of ${cells.length} spots checked for ${day(start)}, near ${site.name}`,cat:'pin',lat:place.lat,lon:place.lon};
   const d=await ephemeris(spot,{date});
   return {cell,spot,metrics:measure(d),slope:d.terrain?.slopeDegrees};
  };
  const checked=[];
  for(let n=0;n<cells.length;n+=BEST_BATCH){
   const batch=await Promise.allSettled(cells.slice(n,n+BEST_BATCH).map(check));
   for(const r of batch)if(r.status==='fulfilled'&&r.value.metrics)checked.push(r.value);
   if(selected!==site||$('#date').value!==date)return; // the user moved on while this ran
   if(n+BEST_BATCH<cells.length)toast(`Checked ${Math.min(cells.length,n+BEST_BATCH)} of ${cells.length} spots for your dates…`);
  }
  if(selected!==site||$('#date').value!==date)return; // the user moved on while this ran
  if(!checked.length){toast('The candidate spots could not be calculated. Please retry.');return;}
  // Ground gentler than 10° comes first; among those, the most Sun and Earth together, then sunlight.
  const gentle=c=>Number.isFinite(c.slope)&&c.slope<=HEAT.slope.to?1:0;
  checked.sort((a,b)=>gentle(b)-gentle(a)||b.metrics.both-a.metrics.both||b.metrics.sun-a.metrics.sun||b.cell.score-a.cell.score);
  const best=checked[0],here=data?measure(data):null,km=(best.cell.distance*POLAR.heat.gridMeters/1000).toFixed(1);
  const summary=m=>`${number(m.both)} h of Sun and Earth together and ${number(m.sun)} h of sunlight`;
  if(here&&best.metrics.both<=here.both+.05&&best.metrics.sun<=here.sun+.05){toast(`None of the ${checked.length} spots checked beats this one for your ${stayLabel()} stay from ${day(start)}. The best of them has ${summary(best.metrics)}.`);return;}
  addCustom(best.spot);selectSite(best.spot);
  toast(`Checked ${checked.length} spots for your ${stayLabel()} stay from ${day(start)}. This one, ${km} km away, has ${summary(best.metrics)}${Number.isFinite(best.slope)?`, on a ${best.slope.toFixed(1)}° slope${gentle(best)?'':' (none of the candidates is gentler than 10°)'}`:''} (long-term: Sun ${percent(best.cell.sun)}, Earth ${percent(best.cell.earth)}).`);
 }finally{button.disabled=false;}
};
function setSunlight(value){sunlightEnabled=value;$('#sunlight').setAttribute('aria-pressed',String(value));shadows.setEnabled(value);moon.material=value?material:satelliteMaterial;patch.setLit(value);bodies.earth.mesh.material=value?earthLit:earthUnlit;}
$('#sunlight').onclick=()=>{setSunlight(!sunlightEnabled);$('#map-status').textContent=sunlightEnabled?'Calculated sunlight · updating':'NASA imagery · no lighting added';toast(sunlightEnabled?'Showing sunlight and shadows calculated for the chosen time, drawn over NASA’s imagery.':'Showing NASA’s imagery with no lighting added. Any shading left is in the photographs or is dark rock.');invalidate();};
const loader=new THREE.TextureLoader();
loader.load('/assets/moon-lroc-8k.jpg',texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());material.map=texture;satelliteMaterial.map=texture;patch.setMap(texture);material.needsUpdate=true;satelliteMaterial.needsUpdate=true;$('#map-status').textContent='NASA LRO · 8K lunar mosaic';invalidate();},undefined,()=>{$('#map-status').textContent='NASA imagery failed to load';});
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
 const chip=document.createElement('div');chip.className=`sky-chip ${name}`;chip.hidden=true;chip.title='What does this line show?';chip.onclick=()=>guide?.say(EXPLAIN[name]);$('#labels').appendChild(chip);
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

// ---- Where the Sun and Earth are ----
// Earth is drawn at its true size and its JPL distance for the selected time, lit by the same Sun as the
// Moon and turned to show the face that points at the Moon, so its direction, apparent size,
// phase and visible continents are right. The Sun is drawn at its true angular
// size but much closer than it really is. Each also marks the point on the Moon where it is overhead.
const MOON_KM=1737.4,EARTH_MEAN_KM=384400; // the mean is only a fallback for responses without a range
const EARTH_DISTANCE=EARTH_MEAN_KM/MOON_KM,EARTH_RADIUS=6371/MOON_KM,SUN_DISTANCE=500,SUN_RADIUS=SUN_DISTANCE*Math.tan(THREE.MathUtils.degToRad(.266));
function makeBody(name,label,mesh,distance,radius,overhead){
 mesh.visible=false;mesh.frustumCulled=false;scene.add(mesh);
 const mark=document.createElement('div');mark.className=`overhead ${name}`;mark.hidden=true;mark.innerHTML=`<span class="marker">${icon(name==='sun'?'sun':'globe')}</span><span class="name">${overhead}</span>`;
 const tag=document.createElement('div');tag.className=`body-tag ${name}`;tag.hidden=true;tag.textContent=label;
 $('#labels').append(mark,tag);
 return {name,label,mesh,distance,radius,mark,tag,direction:new THREE.Vector3(),point:new THREE.Vector3(),known:false};
}
// Like the Moon, Earth has two looks: lit by the modeled Sun (Explore and Landing), or the plain
// NASA imagery with no lighting (Satellite, or whenever the Sunlight layer is off).
const earthLit=new THREE.MeshStandardMaterial({color:0x3f7fd9,roughness:1,metalness:0,emissive:0x0b1c38}),earthUnlit=new THREE.MeshBasicMaterial({color:0x3f7fd9});
const bodies={
 sun:makeBody('sun','Sun',new THREE.Mesh(new THREE.SphereGeometry(SUN_RADIUS,24,12),new THREE.MeshBasicMaterial({color:0xfff3c4,toneMapped:false})),SUN_DISTANCE,SUN_RADIUS,'Sun overhead'),
 earth:makeBody('earth','Earth',new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS,48,24),earthLit),EARTH_DISTANCE,EARTH_RADIUS,'Earth overhead')
};
// NASA Blue Marble imagery for the Earth; it stays a plain blue globe if the image fails to load.
loader.load('/assets/earth-blue-marble-2k.jpg',texture=>{texture.colorSpace=THREE.SRGBColorSpace;const m=earthLit;m.map=texture;m.color.set(0xffffff);
 earthUnlit.map=texture;earthUnlit.color.set(0xffffff);earthUnlit.needsUpdate=true;
 // The night side is shown faintly (not physically) so the globe stays readable as a crescent.
 m.emissiveMap=texture;m.emissive.set(0xffffff);m.emissiveIntensity=.2;m.needsUpdate=true;invalidate();});
const earthTurn=new THREE.Matrix4();
// Where a body sits in the scene (Moon radii, Moon-centered). Earth goes at its real position:
// the site's view of it and the site's distance to it, shifted to the Moon's center. The Sun
// keeps its true direction at a fixed nearby distance.
function bodyPosition(name,d,s,out){
 if(name==='earth')return out.fromArray(centeredPosition(d.lat,d.lon,s.az,s.el,(s.range??EARTH_MEAN_KM)/MOON_KM));
 return out.fromArray(skyDirection(d.lat,d.lon,s.az,s.el)).multiplyScalar(SUN_DISTANCE);
}
function updateBodies(){
 const d=data||referenceData,time=observationTime();if(!d)return;
 for(const b of Object.values(bodies)){
  const s=sampleAt(d[b.name],time);if(!s)continue;
  bodyPosition(b.name,d,s,b.mesh.position);b.direction.copy(b.mesh.position).normalize();b.mesh.visible=true;b.known=true;
  if(b.name==='earth'){polarUniforms.earthDirection.value.copy(b.direction);const r=earthMeshRotation(time);earthTurn.set(r[0][0],r[0][1],r[0][2],0,r[1][0],r[1][1],r[1][2],0,r[2][0],r[2][1],r[2][2],0,0,0,0,1);b.mesh.quaternion.setFromRotationMatrix(earthTurn);}
  b.point.copy(b.direction).multiplyScalar(1.003);
  const lat=THREE.MathUtils.radToDeg(Math.asin(b.direction.y)),lon=THREE.MathUtils.radToDeg(Math.atan2(-b.direction.z,b.direction.x));
  b.mark.title=`${b.label} is directly overhead at ${Math.abs(lat).toFixed(1)}°${lat<0?'S':'N'} ${Math.abs(lon).toFixed(1)}°${lon<0?'W':'E'} at the selected time.`;
 }
 invalidate();
}

// ---- Pins ----
const labels=[];
function addLabel(site){const el=document.createElement('button');el.className=`place-label cat-${site.cat}`;el.innerHTML=`<span class="marker">${icon(siteIcon(site))}</span><span class="name">${safe(site.name)}</span>`;el.setAttribute('aria-label',`Select ${site.name}`);el.onclick=e=>{if(e.shiftKey||e.metaKey||e.ctrlKey)quickCompare(site);else selectSite(site);};el.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();quickCompare(site);};$('#labels').appendChild(el);labels.push({site,el,point:new THREE.Vector3()});placeLabels();}
// Pins float just above the coarse globe; in landing view they sit on the true-scale surface.
function placeLabels(){for(const {site,point} of labels){point.fromArray(coordinatesToVector(site.lat,site.lon));point.multiplyScalar(surface?patch.groundRadius(point)+.0003:1.003);}}
sites.forEach(addLabel);
// IAU names for craters, seas and mountains: used by search, to describe pins, and to name the
// terrain that hides the Sun or Earth. Loaded after the page is up; everything works without it.
let features=null;
fetch('/assets/features.json').then(r=>r.ok?r.json():null).then(list=>{
 features=list;
 if(list){featurePoints=new Float32Array(list.length*3);list.forEach((f,i)=>featurePoints.set(coordinatesToVector(f[1],f[2]),i*3));}
 // Pins opened from a link were created before the names arrived: describe them now.
 for(const {site} of labels)if(site.cat==='pin'&&site.type==='Custom lunar coordinates')site.type=describePlace(site.lat,site.lon);
 if(selected?.cat==='pin')$('#site-type').textContent=selected.type;
 if(selected)refreshMetrics();invalidate();
}).catch(()=>{});
// Place names on the map: the largest named features in view, more of them as you zoom in.
// A fixed pool of labels is reused every frame; they never take clicks, so dragging is unaffected.
let featurePoints=null;
const FEATURE_LABELS=22,featureLabels=Array.from({length:FEATURE_LABELS},()=>{const el=document.createElement('div');el.className='feature-label';el.hidden=true;$('#labels').appendChild(el);return el;});
const featurePoint=new THREE.Vector3();
function placeFeatureNames(occupied){
 let used=0;
 if(features&&featurePoints){
  const altitudeKm=(camera.position.length()-1)*1737.4,smallest=Math.max(5,altitudeKm/9),sampler=surface?shadows.sampler():null;
  const facing=towardCamera.copy(camera.position).normalize(),limit=1/camera.position.length(); // beyond the limb when the dot product is below this
  for(let i=0;i<features.length&&used<FEATURE_LABELS;i++){
   const f=features[i];if(f[3]<smallest)break;                       // sorted by size, so nothing further qualifies
   if(f[3]>altitudeKm*3&&f[3]>600)continue;                           // far larger than the view: its center says little
   const x=featurePoints[i*3],y=featurePoints[i*3+1],z=featurePoints[i*3+2];
   if(x*facing.x+y*facing.y+z*facing.z<limit+.02)continue;
   featurePoint.set(x,y,z).multiplyScalar(sampler?1+sampler(f[1],f[2])/1737.4+.0003:1.002);
   const p=projected.copy(featurePoint).project(camera);if(Math.abs(p.x)>.96||Math.abs(p.y)>.92||p.z>1)continue;
   const sx=(p.x+1)*innerWidth/2,sy=(1-p.y)*innerHeight/2;
   if(occupied.some(q=>Math.abs(q[0]-sx)<96&&sy-q[1]>-26&&sy-q[1]<48))continue;   // a site's name sits below its pin, so keep clear of that too
   occupied.push([sx,sy]);
   const el=featureLabels[used++];if(el.textContent!==f[0])el.textContent=f[0];
   el.hidden=false;el.classList.toggle('major',f[4]==='Mare'||f[4]==='Oceanus');el.style.transform=`translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0) translate(-50%,-50%)`;
  }
 }
 for(let i=used;i<FEATURE_LABELS;i++)featureLabels[i].hidden=true;
}
const describePlace=(lat,lon)=>{const place=features&&placeName(features,lat,lon);return place?`Custom lunar coordinates · ${place.text}`:'Custom lunar coordinates';};
// Small markers on the ground where terrain is hiding the Sun or Earth from the selected site.
const blockers={};
for(const [name,label] of [['sun','Sun'],['earth','Earth']]){
 const el=document.createElement('div');el.className=`blocker ${name}`;el.hidden=true;el.innerHTML=`<span class="marker"></span><span class="name">blocks ${label}</span>`;
 $('#labels').appendChild(el);blockers[name]={el,point:new THREE.Vector3(),active:false};
}
function setBlocker(name,place,title=''){
 const b=blockers[name];b.active=Boolean(place);if(!place){b.el.hidden=true;return;}
 const sampler=surface?shadows.sampler():null;
 b.point.fromArray(coordinatesToVector(place[0],place[1])).multiplyScalar(sampler?1+sampler(place[0],place[1])/1737.4+.0003:1.003);b.el.title=title;invalidate();
}
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
 placeFeatureNames(occupied);placeGridLabels();
 for(const b of Object.values(blockers)){
  if(!b.active){b.el.hidden=true;continue;}
  const p=projected.copy(b.point).project(camera),x=(p.x+1)*innerWidth/2,y=(1-p.y)*innerHeight/2;
  // Shown only when zoomed in far enough for it to stand apart from the site's own pin.
  const crowded=occupied.length&&Math.hypot(occupied[0][0]-x,occupied[0][1]-y)<26;
  b.el.hidden=b.point.dot(towardCamera.copy(camera.position).sub(b.point))<=0||Math.abs(p.x)>1||Math.abs(p.y)>1||crowded;
  if(!b.el.hidden)b.el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%)`;
 }
 for(const beam of Object.values(beams)){
  if(!beam.active){beam.chip.hidden=true;continue;}
  const p=projected.copy(beam.end).project(camera);
  const hidden=hiddenByMoon(beam.end)||Math.abs(p.x)>1||Math.abs(p.y)>1||p.z>1;beam.chip.hidden=hidden;if(hidden)continue;
  beam.chip.style.transform=`translate3d(${((p.x+1)*innerWidth/2).toFixed(1)}px,${((1-p.y)*innerHeight/2).toFixed(1)}px,0) translate(-50%,-135%)`;
 }
 const pixelsPerTangent=innerHeight/2/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
 for(const b of Object.values(bodies)){
  if(!b.known){b.mark.hidden=b.tag.hidden=true;continue;}
  // Overhead point on the surface: shown on the hemisphere facing the camera.
  let p=projected.copy(b.point).project(camera);
  b.mark.hidden=b.point.dot(towardCamera.copy(camera.position).sub(b.point))<=0||Math.abs(p.x)>1||Math.abs(p.y)>1;
  if(!b.mark.hidden)b.mark.style.transform=`translate3d(${((p.x+1)*innerWidth/2).toFixed(1)}px,${((1-p.y)*innerHeight/2).toFixed(1)}px,0) translate(-50%,-50%)`;
  // Name under the body itself, when it is in view and not behind the Moon.
  p=projected.copy(b.mesh.position).project(camera);
  b.tag.hidden=hiddenByMoon(b.mesh.position)||Math.abs(p.x)>1||Math.abs(p.y)>1||p.z>1;
  if(!b.tag.hidden){const radius=b.radius/camera.position.distanceTo(b.mesh.position)*pixelsPerTangent;b.tag.style.transform=`translate3d(${((p.x+1)*innerWidth/2).toFixed(1)}px,${((1-p.y)*innerHeight/2+radius+5).toFixed(1)}px,0) translate(-50%,0)`;}
 }
}

// ---- Render loop (on demand) ----
let pending=false,rendering=false;
let diagnostics={beforeFrame(){},afterFrame(){},active:()=>false};
function invalidate(){if(!pending&&!rendering&&!document.hidden){pending=true;requestAnimationFrame(render);}}
function render(now){pending=false;rendering=true;const cpuStart=performance.now();
 if(flight)advanceFlight(now);else if(tour?.playing)advanceTour(now);
 diagnostics.beforeFrame(now);const changed=flight||tour?.playing?false:(surface?.controls??controls).update();layoutBeams();patch.update(camera,Boolean(surface));renderer.render(scene,camera);updateLabels();
 const heading=surface?surfaceHeading():0,compass=surface?`rotate(${(-heading).toFixed(1)}deg)`:'';if(compass!==previousCompass){$('#north').style.transform=compass;previousCompass=compass;}
 const altitude=surface?`Landing view · range ≈ ${Math.round(camera.position.distanceTo(surface.target)*1737.4).toLocaleString()} km · heading ${Math.round(heading)%360}° · ${surface.info?`true-scale LOLA relief, ${surface.info.gridMeters<1000?surface.info.gridMeters+' m':surface.info.gridMeters/1000+' km'} mesh`:'relief loading'}`:`View altitude ≈ ${Math.round((camera.position.length()-1)*1737.4).toLocaleString()} km`;if(altitude!==previousAltitude){$('#scale').textContent=altitude;previousAltitude=altitude;}
 diagnostics.afterFrame(now,cpuStart);rendering=false;
 if(changed||flight||tour?.playing||diagnostics.active())invalidate();
}
controls.addEventListener('change',invalidate);
controls.addEventListener('start',()=>{flight=null;$('#hint').classList.add('gone');invalidate();});
function resize(){
 camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth>900?35:45;camera.clearViewOffset();
 // Keep the globe centered in the open map area beside the sidebar (or above the sheet on phones).
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
 if(flight.orbit){const o=flight.orbit;camera.position.copy(surfaceCameraPosition(surface.target,surface.frame,o.from+o.delta*f,o.distance,THREE.MathUtils.lerp(o.tilt,o.tiltTo??o.tilt,f)));camera.lookAt(surface.target);}
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
const TILT=THREE.MathUtils.degToRad(62),MAX_TILT=THREE.MathUtils.degToRad(85);
// Smallest tilt from vertical that brings a body in the sky into the frame above the site, or null
// when it sits too high to share the view with the ground. Uses a copy of the real camera so the
// answer respects the current window size and the space taken by the side panel.
function tiltToShow(position,target,frame,azimuth,distance){
 const probe=camera.clone();probe.up.copy(frame.up);
 let p;
 for(let tilt=TILT;tilt<=MAX_TILT+1e-6;tilt+=THREE.MathUtils.degToRad(1)){
  probe.position.copy(surfaceCameraPosition(target,frame,azimuth,distance,tilt));probe.lookAt(target);probe.updateMatrixWorld();
  p=projected.copy(position).project(probe);
  if(p.z<1&&p.y<.8)return tilt; // clear of the status pill at the top of the map
 }
 return p.z<1&&p.y<1?MAX_TILT:null; // at the steepest tilt it may still sit just inside the top edge
}
// Heading and tilt that face a body from a site: toward its azimuth, tilted up to it when it is
// above the selected horizon. Returns null until that site's data has loaded.
function framing(name,site,target,frame,distance){
 if(!data||Math.abs(data.lat-site.lat)>1e-5||Math.abs(data.lon-site.lon)>1e-5)return null;
 const s=sampleAt(data[name],observationTime());if(!s)return null;
 const profile=terrainEnabled?data.terrain:null,above=s.el-(profile?horizonAt(profile,s.az):0)>0,body=bodies[name];
 const position=bodyPosition(name,data,s,new THREE.Vector3());
 return {azimuth:s.az,tilt:above?tiltToShow(position,target,frame,s.az,distance):null};
}
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
 // Sharper NASA imagery for the ground near the site, fetched now and blended in when it has all arrived.
 patch.loadDetail(site,`${site.lat.toFixed(5)}:${site.lon.toFixed(5)}`,()=>{invalidate();if(surface?.site===site&&patch.detailStatus()==='ready')$('#map-status').textContent='Landing view · LOLA relief at true scale · LRO imagery at about 100 m';});
 if(tour){tour=null;showFlybyBar();}
 patch.loadFine(site,`${site.lat.toFixed(5)}:${site.lon.toFixed(5)}`,fineInfo=>{
  if(!fineInfo||surface?.site!==site)return;
  // The finer ground can sit a little higher or lower than the coarse one: move the look point, the pins and the lines onto it.
  surface.info=fineInfo;surface.radius=fineInfo.radius;surface.target.copy(surface.frame.up).multiplyScalar(fineInfo.radius);
  if(surface.controls){surface.controls.target.copy(surface.target);surface.controls.minDistance=closestRange();if(!tour?.playing)surface.controls.update();}
  placeLabels();if(selected)updateBeams();if(tour)renderFlybyCaption();invalidate();
 });
 surface?.controls?.dispose();controls.enabled=false;
 surface={site,frame,north:new THREE.Vector3(...skyDirection(lat,site.lon,0,0)),east:new THREE.Vector3(...skyDirection(lat,site.lon,90,0)),target:frame.up.clone().multiplyScalar(radius),radius,info,distance,controls:null,awaitingEarth:false};
 const view=framing('earth',site,surface.target,frame,distance);surface.awaitingEarth=!view;
 placeLabels();if(selected)updateBeams();camera.near=.0015;camera.updateProjectionMatrix();
 // Earth ahead by default, so the blue line runs up the screen like a route, and tilted far
 // enough to bring Earth itself into view when it is above the horizon.
 startFlight({to:surfaceCameraPosition(surface.target,frame,view?.azimuth??0,distance,view?.tilt??TILT),toTarget:surface.target.clone(),toUp:frame.up.clone(),duration:1200,done:attachSurfaceControls});
 if(!info)setTimeout(()=>{if(surface?.site===site&&!surface.info){surface.info=patch.build(site);invalidate();}},1500);
}
// ---- Fly-by: a scripted camera pass over the Landing view's terrain ----
// Each key is [fraction of the flight, turn in degrees clockwise from the starting heading, range as a
// multiple of the low pass, tilt in degrees from straight down]. The low pass is set by how fine the
// terrain under the camera is, so the ground still reads as ground at the closest point. The view is
// the Landing view's: true-scale LOLA relief, NASA imagery, and sunlight calculated for the chosen time.
const FLYBY_KEYS=[[0,0,5.6,38],[.2,65,2.8,54],[.42,165,1,71],[.68,285,1.05,72],[.86,345,2.3,58],[1,395,4.2,44]];
const FLYBY_SECONDS=50,FLYBY_SPEEDS=[1,2,.5];
const tourDirection=new THREE.Vector3();
// A site made from an entry in the IAU list of named features: [name, latitude, longitude, diameter in km, kind].
const featureSite=f=>({id:`pin-${f[1].toFixed(4)}_${f[2].toFixed(4)}`,name:f[0],type:`${f[4]} · ${f[3]>=10?Math.round(f[3]):f[3]} km across · center of the IAU-named feature`,cat:'pin',lat:f[1],lon:f[2],feature:{kind:f[4],diameterKm:f[3]}});
// Who the listed fly-by craters are named for, from the "origin" field of the IAU Gazetteer of Planetary Nomenclature.
const ORIGINS={Shackleton:'named for the Antarctic explorer Ernest Shackleton',Tycho:'named for the Danish astronomer Tycho Brahe',Copernicus:'named for the Polish astronomer Nicolaus Copernicus'};

// ---- Fly-by captions: one plain sentence for each stage of the flight, and the numbers behind it for those who ask ----
// Heights in meters around the place the camera is circling, read from the mesh on screen. For a crater of
// the given radius: the rim is the middle value of the highest point found in each direction between 0.75 and
// 1.25 radii, the floor is the level that a fifth of the inner half lies below, and the peak is the highest
// point within a quarter radius of the center. Low and high are the extremes out to 1.25 radii.
function terrainFigures(radiusKm){
 const at=(r,az)=>{const a=THREE.MathUtils.degToRad(az);tourDirection.copy(surface.frame.up).addScaledVector(surface.east,Math.sin(a)*r/1737.4).addScaledVector(surface.north,Math.cos(a)*r/1737.4).normalize();return (patch.groundRadius(tourDirection)-1)*1737400;};
 const pick=(list,q)=>{const sorted=[...list].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor(q*sorted.length))];};
 let low=Infinity,high=-Infinity,peak=-Infinity;const inner=[],crests=[];
 for(let az=0;az<360;az+=5){
  let crest=-Infinity;
  for(let k=0;k<=40;k++){const r=radiusKm*1.25*k/40,h=at(r,az);low=Math.min(low,h);high=Math.max(high,h);if(r<=radiusKm*.5)inner.push(h);if(r<=radiusKm*.25)peak=Math.max(peak,h);if(r>=radiusKm*.75)crest=Math.max(crest,h);}
  crests.push(crest);
 }
 return {low,high,peak,floor:pick(inner,.2),rim:pick(crests,.5)};
}
const kmText=m=>`${(m/1000).toFixed(1)} km`,heightText=m=>`${m<0?'−':'+'}${Math.abs(Math.round(m/10)*10).toLocaleString()} m`;
function flybyCaption(stage){
 const site=surface.site,f=site.feature,info=surface.info,mine=selected===site&&data;
 const mesh=info?`${info.gridMeters<1000?info.gridMeters+' m':(info.gridMeters/1000).toFixed(1)+' km'} mesh`:'mesh';
 // A crater is measured as a crater when its rim fits well inside the mesh; anything else is described by its relief within 25 km.
 const crater=f&&/crater/i.test(f.kind)&&f.diameterKm>=8&&info&&f.diameterKm*.625<=info.halfKm*.9;
 if(!tour.figures||tour.figuresFor!==info){tour.figures=terrainFigures(crater?f.diameterKm/2:25);tour.figuresFor=info;}
 const g=tour.figures;
 if(stage===0){
  const what=f?`${site.name}: a ${f.kind.toLowerCase()} ${f.diameterKm>=10?Math.round(f.diameterKm):f.diameterKm} km across${ORIGINS[site.name]?`, ${ORIGINS[site.name]}`:''}.`
   :site.cat==='pin'?`${site.name}: ${site.type.includes('·')?`a point ${site.type.split('·').slice(1).join('·').trim()}`:'a point you chose'}.`
   :`${site.name}: ${site.type}${site.description?`. ${site.description}`:''}.`;
  return [what,`${coord(site).replace(/\s+/g,' ')}${mine?.terrain?` · elevation ${heightText(data.terrain.elevationMeters)}`:''} · NASA LOLA relief at true scale, ${mesh} · NASA LRO imagery`];
 }
 if(stage===1){
  const slope=mine?.terrain&&Number.isFinite(data.terrain.slopeDegrees)?` Slope at the ${f?'center':'site'}: ${data.terrain.slopeDegrees.toFixed(1)}° over ${data.terrain.slopeBaselineMeters} m.`:'';
  if(crater){const depth=g.rim-g.floor,rise=g.peak-g.floor,peaked=rise>600&&g.peak<g.rim;
   return [`The floor lies about ${kmText(depth)} below the rim${peaked?`, and the high ground at its center stands about ${kmText(rise)} above the floor`:''}.`,`Measured here from the LOLA ${mesh}: typical rim ${heightText(g.rim)}, floor ${heightText(g.floor)}${peaked?`, central high point ${heightText(g.peak)}`:''}.${slope}`];}
  const span=g.high-g.low;
  return [`Within about 30 km of this point the ground rises and falls by ${span>=1000?kmText(span):`${Math.round(span/10)*10} m`}.`,`Lowest ${heightText(g.low)}, highest ${heightText(g.high)}, from the LOLA ${mesh}.${slope}`];
 }
 if(!mine)return ['Sun and Earth windows for this place are still loading.',''];
 const summary=$('#stay-summary').textContent,shadowed=$('#site-shadow').textContent.trim().startsWith('Yes');
 return [`For a lander arriving ${stamp(startDate())} and staying ${stayLabel()}: ${summary}${shadowed?' This point is in permanent shadow.':''}`,`${$('#event-count').textContent}${/^[A-Z]/.test($('#event-label').textContent)?'. ':' '}${$('#event-label').textContent}. Geometry only: not usable power, not a radio link, not landing safety.`];
}
function renderFlybyCaption(){
 if(!tour||!surface)return;
 const u=tour.t/FLYBY_SECONDS,stage=u<.34?0:u<.72?1:2;tour.stage=stage;
 const [plain,numbers]=flybyCaption(stage),show=!$('#site-card').classList.contains('simple');
 $('#flyby-fact').textContent=plain;$('#flyby-numbers').textContent=numbers;$('#flyby-numbers').hidden=!show||!numbers;
 $('#flyby-detail').setAttribute('aria-pressed',String(show));
}

// How close the camera comes, in km from the point it looks at: finer ground allows a closer pass.
function lowPassKm(){const i=surface?.info;return !i?200:i.fine?(i.halfKm<=70?22:42):i.polar?16:200;}
function closestRange(){return Math.min(surface.distance*.3,lowPassKm()*.6/1737.4);}
// A smooth curve through the keys (Catmull-Rom on each column).
function flybyAt(u){
 const k=FLYBY_KEYS;let i=0;while(i<k.length-2&&u>k[i+1][0])i++;
 const a=k[Math.max(0,i-1)],b=k[i],c=k[i+1],d=k[Math.min(k.length-1,i+2)],t=(u-b[0])/(c[0]-b[0]);
 const curve=n=>.5*(2*b[n]+(c[n]-a[n])*t+(2*a[n]-5*b[n]+4*c[n]-d[n])*t*t+(3*b[n]-a[n]-3*c[n]+d[n])*t*t*t);
 return {turn:curve(1),range:Math.max(.9,curve(2)),tilt:THREE.MathUtils.clamp(curve(3),25,76)};
}
function placeFlybyCamera(){
 const s=flybyAt(tour.t/FLYBY_SECONDS);
 camera.position.copy(surfaceCameraPosition(surface.target,surface.frame,tour.heading+s.turn,s.range*tour.lowKm/1737.4,THREE.MathUtils.degToRad(s.tilt)));
 // Never below the ground under the camera, with a margin.
 const floor=patch.groundRadius(tourDirection.copy(camera.position).normalize())+tour.clearKm/1737.4;if(camera.position.length()<floor)camera.position.setLength(floor);
 camera.up.copy(surface.frame.up);camera.lookAt(surface.target);
}
function advanceTour(now){
 tour.t=Math.min(FLYBY_SECONDS,tour.t+Math.min(.5,(now-tour.last)/1000)*tour.speed);tour.last=now; // keeps real time down to two frames a second
 placeFlybyCamera();$('#flyby-progress').style.width=`${(tour.t/FLYBY_SECONDS*100).toFixed(1)}%`;
 {const u=tour.t/FLYBY_SECONDS,stage=u<.34?0:u<.72?1:2;if(stage!==tour.stage)renderFlybyCaption();}
 if(tour.t>=FLYBY_SECONDS)pauseFlyby();
}
function showFlybyBar(){
 $('#flyby-bar').hidden=!tour;if(!tour)return;
 const done=tour.t>=FLYBY_SECONDS;
 $('#flyby-play').innerHTML=icon(tour.playing?'pause':'play');$('#flyby-play').setAttribute('aria-label',tour.playing?'Pause the fly-by':done?'Play the fly-by again':'Resume the fly-by');
 $('#flyby-label').textContent=done?'Fly-by finished · drag to look around':tour.playing?`Fly-by · ${surface.site.name}`:'Paused · drag to look around';
 $('#flyby-speed').textContent=`${tour.speed}×`;$('#flyby-progress').style.width=`${(tour.t/FLYBY_SECONDS*100).toFixed(1)}%`;
 renderFlybyCaption();
}
function beginFlyby(){
 if(!surface?.controls)return;
 flybyWanted=0;flight=null;
 const sun=data&&surface.site===selected?sampleAt(data.sun,observationTime()):null;
 // Start with the Sun off to one side, so the relief shows in light and shadow; the turn then takes in every direction.
 tour={t:0,speed:1,playing:true,last:performance.now(),heading:sun?(sun.az+110)%360:surfaceHeading(),lowKm:lowPassKm(),clearKm:surface.info?.fine||surface.info?.polar?1.5:8};
 surface.controls.enabled=false;surface.awaitingEarth=false;$('#hint').classList.add('gone');if(phone.matches)setSheet('peek');
 showFlybyBar();invalidate();
 if(sun&&sun.el<=0&&sunlightEnabled)toast('It is night here at the chosen time, so the ground is dark. Move the timeline, or switch Sunlight off to see the terrain itself.');
}
function pauseFlyby(){
 if(!tour)return;tour.playing=false;
 if(surface?.controls){surface.controls.target.copy(surface.target);surface.controls.enabled=true;surface.controls.update();}
 showFlybyBar();invalidate();
}
function resumeFlyby(){
 if(!tour||!surface?.controls)return;if(tour.t>=FLYBY_SECONDS)tour.t=0;
 tour.playing=true;tour.last=performance.now();flight=null;surface.controls.enabled=false;showFlybyBar();invalidate();
}
function stopFlyby(){
 if(!tour&&!flybyWanted)return;flybyWanted=0;const was=tour;tour=null;
 if(was&&surface?.controls){surface.controls.target.copy(surface.target);surface.controls.enabled=true;surface.controls.update();}
 showFlybyBar();invalidate();
}
// Starts once the Landing view has arrived over the site and its finer terrain is in (or after a short wait for it).
function tryStartFlyby(){
 if(!flybyWanted)return;
 if(!surface?.controls||flight||(patch.fineStatus()==='loading'&&performance.now()-flybyWanted<7000)){setTimeout(tryStartFlyby,200);return;}
 beginFlyby();
}
function requestFlyby(){
 if(!selected){toast('Open a site or drop a pin first, then start the fly-by.');return;}
 if(tour&&surface?.site===selected){resumeFlyby();return;}
 flybyWanted=performance.now();if(mode!=='landing')setMode('landing');tryStartFlyby();
}
// A time in the next 30 days when the Sun is up at the selected site and low enough to throw long shadows
// (10° to 30° high); failing that, when it is highest. Null until the site's data has loaded.
function goodLightTime(){
 if(!data)return null;
 const start=startDate(),rows=visibilityRows(data,'sun');let best=null,bestHeight=-Infinity;
 for(let h=0;h<=TIMELINE_HOURS;h++){
  const t=start+h*HOUR,real=sampleAt(data.sun,t),seen=sampleAt(rows,t);if(!real)continue;
  if(seen&&seen.el>0&&real.el>=10&&real.el<=30)return t;
  if(real.el>bestHeight){bestHeight=real.el;best=t;}
 }
 return best;
}
// Places worth flying over. Features are looked up by name in the IAU list, so their positions are not typed in here.
const FLYBYS=[{feature:'Shackleton',note:'Crater at the south pole, with a floor that never sees the Sun'},{feature:'Tycho',note:'Young crater with a central peak'},{feature:'Copernicus',note:'Terraced walls and a cluster of peaks'},{site:'apollo11',name:'Apollo 11 landing site',note:'Sea of Tranquility'}];
$('#flybys').innerHTML=FLYBYS.map((f,i)=>`<button class="row cat-pin" data-flyby="${i}"><span class="badge">${icon('play')}</span><span class="row-text"><strong>${safe(f.name||f.feature)}</strong><small>${safe(f.note)}</small></span>${icon('chevron','chev')}</button>`).join('');
$('#flybys').onclick=async e=>{
 const choice=FLYBYS[Number(e.target.closest('[data-flyby]')?.dataset.flyby)];if(!choice)return;
 let site=choice.site?sites.find(s=>s.id===choice.site):null;
 if(!site){
  const f=features?.find(x=>x[0]===choice.feature);if(!f){toast('Place names are still loading. Try again in a moment.');return;}
  site=featureSite(f);addCustom(site);
 }
 stopFlyby();
 if(mode==='landing')await selectSite(site);else{selected=site;setMode('landing');for(let i=0;i<100&&!(data&&selected===site);i++)await new Promise(r=>setTimeout(r,200));}
 if(selected!==site)return;
 // These are for looking, so the landing time moves to a moment with good light there, and says so.
 // Moving the landing time, not just the clock, keeps the stay described in the captions in step with the view.
 const when=goodLightTime();
 if(when!==null&&Math.abs(when-observationTime())>HOUR/2){
  const t=new Date(when),date=t.toISOString().slice(0,10),sun=sampleAt(data.sun,when);
  if(date>=DATE_MIN&&date<=DATE_MAX){landingHour=t.getUTCHours();$('#hour').value=String(landingHour);$('#time').value=0;applyDate(date);toast(`Landing time moved to ${stamp(when)}, when the Sun is ${deg(sun.el)} high over ${site.name}.`);}
 }
 flybyWanted=performance.now();tryStartFlyby();
};
$('#flyby').onclick=requestFlyby;
// The Apollo 11 replay is a separate full-screen view with its own code, loaded only when asked for.
let replayOpening=false;
async function openMissionReplay(){
 if(replayOpening)return;replayOpening=true;stopFlyby();
 try{const {openReplay}=await import('./mission/replay.mjs');await openReplay(()=>{const u=new URL(location.href);if(u.searchParams.has('replay')){u.searchParams.delete('replay');history.replaceState(null,'',u);}invalidate();});}
 catch(e){console.error(e);toast('The mission replay did not load. Check the connection and try again.');}
 replayOpening=false;
}
$('#replay-open').onclick=openMissionReplay;$('#replay-row').onclick=openMissionReplay;
if(new URLSearchParams(location.search).get('replay')==='apollo11')openMissionReplay();
$('#flyby-play').onclick=()=>{if(tour?.playing)pauseFlyby();else resumeFlyby();};
$('#flyby-speed').onclick=()=>{if(!tour)return;tour.speed=FLYBY_SPEEDS[(FLYBY_SPEEDS.indexOf(tour.speed)+1)%FLYBY_SPEEDS.length];showFlybyBar();};
$('#flyby-stop').onclick=stopFlyby;
$('#flyby-detail').onclick=()=>setDetail($('#site-card').classList.contains('simple'));
function attachSurfaceControls(){
 if(!surface)return;
 const c=new OrbitControls(camera,renderer.domElement);c.target.copy(surface.target);c.enablePan=false;c.enableDamping=true;c.dampingFactor=.12;c.rotateSpeed=.5;c.zoomSpeed=.65;
 c.minDistance=closestRange();c.maxDistance=surface.distance*4.5;c.maxPolarAngle=MAX_TILT;
 c.addEventListener('change',invalidate);c.addEventListener('start',()=>{flight=null;surface.awaitingEarth=false;$('#hint').classList.add('gone');invalidate();});
 c.update();surface.controls=c;invalidate();faceEarthWhenReady();
}
function exitSurface(to){
 stopFlyby();
 if(!surface)return;
 surface.controls?.dispose();const site=surface.site;surface=null;placeLabels();if(selected)updateBeams();
 camera.near=.005;camera.updateProjectionMatrix();controls.enabled=false;
 startFlight({to:to??siteVector(site).multiplyScalar(2.6),toTarget:new THREE.Vector3(),toUp:Y_UP.clone(),duration:1000,done:()=>{camera.up.copy(Y_UP);controls.enabled=true;}});
}
// If the landing view opened before the site's data arrived, turn to Earth once it is known,
// unless the user has already moved the camera.
function faceEarthWhenReady(){
 if(!surface?.awaitingEarth||!surface.controls||surface.site!==selected)return;
 const view=framing('earth',surface.site,surface.target,surface.frame,camera.position.distanceTo(surface.target));if(!view)return;
 surface.awaitingEarth=false;face(view.azimuth,view.tilt);
}
function face(azimuth,tiltTo){
 if(!surface?.controls)return;
 const offset=camera.position.clone().sub(surface.target),distance=offset.length(),tilt=Math.max(.05,Math.acos(THREE.MathUtils.clamp(offset.dot(surface.frame.up)/distance,-1,1)));
 const from=surfaceHeading();startFlight({orbit:{from,delta:((azimuth-from+540)%360)-180,distance,tilt,tiltTo:tiltTo??tilt},duration:800});
}
function faceBody(name){const view=surface?.controls?framing(name,surface.site,surface.target,surface.frame,camera.position.distanceTo(surface.target)):null;if(view)face(view.azimuth,view.tilt??undefined);else toast(`${name==='sun'?'Sun':'Earth'} position is still loading.`);}
$('#face-sun').onclick=()=>faceBody('sun');$('#face-earth').onclick=()=>faceBody('earth');
function zoom(factor){
 if(surface?.controls){const c=surface.controls,offset=camera.position.clone().sub(c.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,c.minDistance,c.maxDistance));camera.position.copy(c.target).add(offset);}
 else if(!surface)camera.position.setLength(THREE.MathUtils.clamp(camera.position.length()*factor,controls.minDistance,controls.maxDistance));
 invalidate();
}
function goHome(){if(surface)setMode('explore',homePosition());else startFlight({to:homePosition()});}
$('#zoom-in').onclick=()=>zoom(.8);$('#zoom-out').onclick=()=>zoom(1.25);
$('#home').onclick=goHome;$('#rail-home').onclick=()=>{goHome();toast('Zoriana. The app icon is an AI-generated image (made with ChatGPT).');};
// Phone layout: the planner is a bottom sheet with three heights. Drag the handle, tap it to step
// through them, or pull the content down from its top to shrink it.
const sheet=$('#planner'),sheetHandle=$('.handle'),phone=matchMedia('(max-width:900px)'),sheetOrder=['peek','mid','full'];
let sheetState='mid',sheetDrag=null,sheetPull=null;
const sheetHeights=()=>{const mid=Math.round(innerHeight*.4);return {peek:78,mid,full:Math.max(mid+80,innerHeight-128-64)};};
function setSheet(state){sheetState=state;sheet.dataset.sheet=state;if(state==='peek')sheet.scrollTop=0;if(phone.matches)sheet.style.setProperty('--sheet',sheetHeights()[state]+'px');else sheet.style.removeProperty('--sheet');}
const dragSheetTo=height=>{const h=sheetHeights();sheet.style.setProperty('--sheet',Math.max(h.peek,Math.min(h.full,height))+'px');};
// Where a released sheet settles: the nearest height, nudged by how fast it was moving (px per ms, down is positive).
function settleSheet(velocity=0){const h=sheetHeights(),target=sheet.getBoundingClientRect().height-velocity*180;sheet.classList.remove('dragging');setSheet(sheetOrder.reduce((a,b)=>Math.abs(h[b]-target)<Math.abs(h[a]-target)?b:a));}
sheetHandle.addEventListener('pointerdown',e=>{if(!phone.matches)return;sheetDrag={y:e.clientY,height:sheet.getBoundingClientRect().height,moved:false,lastY:e.clientY,lastTime:e.timeStamp,velocity:0};sheet.classList.add('dragging');try{sheetHandle.setPointerCapture(e.pointerId);}catch{}});
sheetHandle.addEventListener('pointermove',e=>{if(!sheetDrag)return;const dy=e.clientY-sheetDrag.y;if(Math.abs(dy)>4)sheetDrag.moved=true;dragSheetTo(sheetDrag.height-dy);sheetDrag.velocity=(e.clientY-sheetDrag.lastY)/Math.max(1,e.timeStamp-sheetDrag.lastTime);sheetDrag.lastY=e.clientY;sheetDrag.lastTime=e.timeStamp;});
const endSheetDrag=()=>{if(!sheetDrag)return;const {moved,velocity}=sheetDrag;sheetDrag=null;if(moved)settleSheet(velocity);else{sheet.classList.remove('dragging');setSheet(sheetOrder[(sheetOrder.indexOf(sheetState)+1)%3]);}};
sheetHandle.addEventListener('pointerup',endSheetDrag);sheetHandle.addEventListener('pointercancel',endSheetDrag);
sheetHandle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSheet(sheetOrder[(sheetOrder.indexOf(sheetState)+1)%3]);}});
sheet.addEventListener('touchstart',e=>{sheetPull=phone.matches&&sheet.scrollTop<=0&&!e.target.closest('input,select,.handle,.chips')?{y:e.touches[0].clientY,height:sheet.getBoundingClientRect().height,active:false}:null;},{passive:true});
sheet.addEventListener('touchmove',e=>{
 if(!sheetPull)return;const dy=e.touches[0].clientY-sheetPull.y;
 if(!sheetPull.active){if(dy>8&&sheet.scrollTop<=0){sheetPull.active=true;sheet.classList.add('dragging');}else{if(dy<-8)sheetPull=null;return;}}
 e.preventDefault();dragSheetTo(sheetPull.height-dy);
},{passive:false});
sheet.addEventListener('touchend',()=>{if(sheetPull?.active)settleSheet();sheetPull=null;});
$('#search').addEventListener('focus',()=>{if(sheetState==='peek')setSheet('mid');});
addEventListener('resize',()=>setSheet(sheetState));setSheet('mid');
// First visit: name the map buttons for a few seconds. After that the names show when the pointer
// is over the button column.
try{if(!localStorage.getItem('zoriana-hints')){localStorage.setItem('zoriana-hints','1');const tools=$('.map-tools');tools.classList.add('hints');const hide=()=>tools.classList.remove('hints');setTimeout(hide,9000);tools.addEventListener('pointerdown',hide,{once:true});}}catch{}
$('#north').onclick=()=>{if(surface)face(0);else{camera.up.set(0,1,0);controls.update();invalidate();}};
$('#recenter').onclick=()=>{if(!selected)return;if(mode==='landing')enterSurface(selected);else fly(selected,2.2);};
function setPin(value){pinning=value;$('#pin').classList.toggle('active',value);$('#globe').classList.toggle('pinning',value);$('#hint').classList.toggle('gone',!value);$('#hint').textContent=value?'Click anywhere on the Moon to place your pin':'Drag to explore · Scroll to zoom, then on into the Landing view · Right-click drops a pin · Shift-click compares';if(value)toast(`${matchMedia('(hover:hover)').matches?'Click':'Tap'} anywhere on the Moon to place your pin.`);}
$('#pin').onclick=()=>setPin(!pinning);$('#pin-from-card').onclick=()=>setPin(true);
let pointerStart;
let holdTimer=null,touches=0;
const cancelHold=()=>{clearTimeout(holdTimer);holdTimer=null;};
renderer.domElement.addEventListener('pointerdown',e=>{
 pointerStart={x:e.clientX,y:e.clientY};
 if(tour?.playing)pauseFlyby();
 if(e.pointerType!=='touch')return;
 // One finger held still for a moment drops a pin; a drag, a second finger or lifting cancels it.
 touches++;cancelHold();if(touches===1&&!surface){const {clientX,clientY}=e;holdTimer=setTimeout(()=>{holdTimer=null;if(dropPinAt(clientX,clientY)){try{navigator.vibrate?.(12);}catch{}toast('Pin dropped. Its Sun and Earth windows are in the panel below.');}},650);}
});
renderer.domElement.addEventListener('pointermove',e=>{if(holdTimer&&pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>8)cancelHold();});
for(const type of ['pointerup','pointercancel','pointerleave'])renderer.domElement.addEventListener(type,e=>{if(e.pointerType==='touch')touches=Math.max(0,touches-1);cancelHold();});
// Drops a pin where the pointer meets the Moon. Returns false when the pointer is off the globe.
let lastPinAt=0;
function dropPinAt(clientX,clientY){
 if(Date.now()-lastPinAt<900)return false;   // a long press can also arrive as a context-menu event: one pin, not two
 const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(clientX/innerWidth*2-1,1-clientY/innerHeight*2),camera);
 const hit=ray.intersectObject(moon)[0];if(!hit)return false;
 const v=hit.point.normalize();
 const lat=THREE.MathUtils.radToDeg(Math.asin(v.y)),lon=THREE.MathUtils.radToDeg(Math.atan2(-v.z,v.x));
 const site={id:'pin-'+Date.now(),name:pinName(lat,lon),type:describePlace(lat,lon),cat:'pin',lat,lon};
 lastPinAt=Date.now();addCustom(site);setPin(false);selectSite(site,false);return true;
}
renderer.domElement.addEventListener('pointerup',e=>{if(!(pinning||e.shiftKey)||e.button!==0||!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>6)return;const quick=e.shiftKey;if(dropPinAt(e.clientX,e.clientY)&&quick&&selected)quickCompare(selected);});
// Shift-click (or right-click) a marker, or Shift-click the bare Moon, to add that place to the comparison in one step:
// two such clicks put two places side by side without opening and closing their cards.
function quickCompare(site){
 const known=compared.some(o=>o.id===optionId(site,$('#date').value,landingHour));
 if(addOption(site,$('#date').value))toast(known?`${site.name} is already in the comparison.`:compared.length<2?`${site.name} added. Shift-click another place to compare it.`:`${site.name} added to the comparison (${compared.length} of ${MAX_OPTIONS}).`);
}
// Right-click, or a long press on touch screens, drops a pin without switching to pin mode first.
renderer.domElement.addEventListener('contextmenu',e=>{e.preventDefault();dropPinAt(e.clientX,e.clientY);});
// ---- Zooming in past the closest whole-Moon view carries on down into the landing view (true-scale terrain, tilted camera)
// over the spot under the pointer, and zooming back out of that view returns to the whole Moon: one gesture, no menu.
// The push has to continue for a moment after the limit is reached, so a scroll that merely coasts to the limit does nothing.
let push=0,pushAt=0,limitSince=0,hintTimer=0;
function diveAt(clientX,clientY){
 const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(clientX/innerWidth*2-1,1-clientY/innerHeight*2),camera);
 let hit=ray.intersectObject(moon)[0],x=clientX,y=clientY;
 if(!hit){x=innerWidth/2;y=innerHeight/2;ray.setFromCamera(new THREE.Vector2(0,0),camera);hit=ray.intersectObject(moon)[0];}
 if(!hit)return;
 // An open site close to the pointer is the place meant; otherwise a pin goes down where the pointer is.
 const near=selected&&hit.point.clone().normalize().angleTo(siteVector(selected))<THREE.MathUtils.degToRad(2);
 if(!near&&!dropPinAt(x,y))return;
 setMode('landing');toast('Landing view: this spot on true-scale terrain. Drag to look around; zoom out to return to the whole Moon.');
}
renderer.domElement.addEventListener('wheel',e=>{
 const now=performance.now();if(now-pushAt>700)push=0;pushAt=now;
 const amount=Math.abs(e.deltaY)*(e.deltaMode===1?33:1)*(e.ctrlKey?8:1),inward=e.deltaY<0;
 const atLimit=surface?(!inward&&surface.controls&&!tour?.playing&&camera.position.distanceTo(surface.controls.target)>surface.controls.maxDistance*.995):(inward&&mode!=='landing'&&!flight&&camera.position.length()<controls.minDistance*1.004);
 if(!atLimit){push=0;limitSince=0;return;}
 if(!limitSince){limitSince=now;if(!surface){$('#hint').textContent='Keep zooming in to open the Landing view of this spot';$('#hint').classList.remove('gone');clearTimeout(hintTimer);hintTimer=setTimeout(()=>$('#hint').classList.add('gone'),2600);}}
 if(now-limitSince<450)return;
 push+=amount;if(push<420)return;
 push=0;limitSince=0;
 if(surface){setMode('explore');toast('Back to the whole Moon.');}else diveAt(e.clientX,e.clientY);
},{passive:true});
// A plain click on the map asks the guide what is there: a place name, or a patch of permanent shadow.
renderer.domElement.addEventListener('pointerup',e=>{
 if(pinning||e.shiftKey||e.button!==0||surface||tour||!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>6||Date.now()-lastPinAt<900)return;
 for(const el of featureLabels){
  if(el.hidden)continue;const r=el.getBoundingClientRect();
  if(e.clientX<r.left-6||e.clientX>r.right+6||e.clientY<r.top-6||e.clientY>r.bottom+6)continue;
  const f=features?.find(x=>x[0]===el.textContent);if(f)guide?.say(explainName(f,features));return;
 }
 if(!psrEnabled)return;
 const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);
 const hit=ray.intersectObject(moon)[0];if(!hit)return;
 const v=hit.point.normalize(),r=psrAt({lat:THREE.MathUtils.radToDeg(Math.asin(v.y)),lon:THREE.MathUtils.radToDeg(Math.atan2(-v.z,v.x))});
 // From far away a patch is a few pixels wide, so a near miss counts.
 const reach=Math.max(1500,(camera.position.length()-1)*1737.4*4);
 if(r?.inside||(r?.covered&&r.nearestMeters!==null&&r.nearestMeters<reach))guide?.say(EXPLAIN.shadow);
});
function addCustom(site){for(let i=labels.length-1;i>=0;i--){if(labels[i].site.id.startsWith('pin-')&&!compared.some(s=>s.site.id===labels[i].site.id)){labels[i].el.remove();labels.splice(i,1);}}addLabel(site);}

// ---- Data ----
async function ephemeris(site,{reference=false,date=$('#date').value}={}){const key=[reference,site.lat,site.lon,date].join(':');if(clientCache.has(key))return clientCache.get(key);const promise=fetch(`/api/ephemeris?${new URLSearchParams({lat:site.lat.toFixed(6),lon:site.lon.toFixed(6),date,reference:reference?'1':'0'})}`).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load NASA data.');if(d.version){appVersion=d.version;requestInfo=d.request||null;$('#info-version').textContent=`Version ${appVersion} · `;if(requestInfo?.ephemeris)$('#info-kernel').textContent=requestInfo.ephemeris;}// Earth can pass in front of the Sun (an eclipse). The Sun's center then counts as hidden,
  // exactly as if Earth's edge were part of the skyline: its clearance is capped by how far it
  // is outside Earth's disk. Both series share the same five-minute steps.
  d.eclipse=eclipseSeries(d.sun,d.earth);
  const behindEarth=rows=>rows&&d.eclipse&&rows.length===d.eclipse.length?rows.map((r,i)=>({...r,el:Math.min(r.el,d.eclipse[i].limb)})):rows;
  if(d.terrain)d.adjusted={sun:behindEarth(clearanceSeries(d.sun,d.terrain)),earth:clearanceSeries(d.earth,d.terrain)};
  d.level={sun:behindEarth(clearanceSeries(d.sun,{angles:[0,0],stepDegrees:180}))};return d;});clientCache.set(key,promise);if(clientCache.size>40)clientCache.delete(clientCache.keys().next().value);try{return await promise;}catch(e){clientCache.delete(key);throw e;}}
async function selectSite(site,move=true){
 selected=site;$('#planner').scrollTop=0;if(sheetState==='peek')setSheet('mid');$('#browse').hidden=true;$('#site-card').hidden=false;$('#search-results').innerHTML='';$('#search').value='';
 $('#site-name').textContent=site.name;$('#site-type').textContent=site.note?`${site.type} · approximate point`:site.type;$('#site-coords').textContent=coord(site);
 $('#site-note').hidden=!site.note;$('#site-note').textContent=site.note||'';$('#site-why').hidden=!site.why;$('#site-why').textContent=site.why?`Why here: ${site.why}`:'';
 // Past missions: one tap sets the date and hour to the real touchdown.
 $('#replay-open').hidden=site.id!=='apollo11';
 $('#site-landed').hidden=!site.landed;if(site.landed)$('#site-landed span').textContent=`See it at touchdown: ${new Date(site.landed).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'})}, ${site.landed.slice(11,16)} UTC`;
 $('#site-badge').className=`badge big cat-${site.cat}`;$('#site-badge').innerHTML=icon(siteIcon(site));
 $('#link-quickmap').href=quickMapUrl(site.lat,site.lon);$('#link-trek').href=moonTrekUrl(site.lat,site.lon);
 if(mode==='landing')enterSurface(site);else if(move)fly(site,2.6);invalidate();await loadSelected();
}
async function loadSelected(){const token=++selectedRequest;data=null;refreshMetrics();$('#calculation-status').className='loading';$('#calculation-status').textContent='Checking terrain & NASA/JPL…';try{const result=await ephemeris(selected);if(token!==selectedRequest)return;data=result;$('#calculation-status').className='';$('#calculation-status').textContent='';refreshMetrics();updateLight();faceEarthWhenReady();}catch(e){if(token!==selectedRequest)return;$('#calculation-status').className='error';$('#calculation-status').textContent=e.message;const retry=document.createElement('button');retry.className='text-button';retry.textContent='Retry';retry.onclick=loadSelected;$('#calculation-status').appendChild(retry);}}
function closeSite(){selected=null;data=null;++selectedRequest;$('#site-card').hidden=true;$('#browse').hidden=false;$('#search').value='';$('#search-results').innerHTML='';if(mode==='landing')setMode('explore');refreshMetrics();}
const pickSite=e=>{const id=e.target.closest('[data-site]')?.dataset.site;if(!id)return;const site=sites.find(s=>s.id===id);if(e.shiftKey||e.metaKey||e.ctrlKey)quickCompare(site);else selectSite(site);};
$('#destinations').onclick=pickSite;$('#search-results').addEventListener('click',pickSite);
$('#close-card').onclick=closeSite;
$('#site-coords').onclick=async()=>{if(!selected)return;const text=formatCoordinates(selected.lat,selected.lon);
 try{await navigator.clipboard.writeText(text);toast(`Copied ${text} (latitude, east longitude, in degrees). Paste it into search to return here.`);}
 catch{toast(`${text} is latitude, east longitude, in degrees. Copying is blocked here; select it from this note.`);}};
$('#site-landed').onclick=()=>{
 if(!selected?.landed)return;const t=new Date(selected.landed);
 landingHour=t.getUTCHours();$('#hour').value=String(landingHour);$('#time').value=Math.round(t.getUTCMinutes()/15)*.25; // the slider moves in quarter hours
 applyDate(selected.landed.slice(0,10));
};
$('#rail-search').onclick=()=>{if(selected)closeSite();$('#search').focus();};
// Learn and Watch open the list at their part of it.
const openListAt=id=>{if(selected)closeSite();showRanking(false);requestAnimationFrame(()=>{$('#planner').scrollTop=0;$(id).scrollIntoView({block:'start'});});};
$('#rail-learn').onclick=()=>openListAt('#learn-title');$('#rail-watch').onclick=()=>openListAt('#watch-title');
$('#search').oninput=()=>{const q=$('#search').value.trim().toLowerCase();const results=$('#search-results');if(!q){results.innerHTML='';return;}const coords=parseCoordinates(q);if(coords){const {lat,lon}=coords;{results.innerHTML=`<button id="coordinate-result" class="row cat-pin"><span class="badge">${icon('pin')}</span><span class="row-text"><strong>Go to ${safe(formatCoordinates(lat,lon))}</strong><small>Latitude, east longitude · ${safe(coord({lat,lon}).replace(/\s+/g,' '))}</small></span>${icon('chevron','chev')}</button>`;$('#coordinate-result').onclick=()=>{const s={id:'pin-'+Date.now(),name:pinName(lat,lon),lat,lon,cat:'pin',type:describePlace(lat,lon)};addCustom(s);selectSite(s);};return;}}const found=sites.filter(s=>[s.name,s.description,s.type,categories[s.cat].label].join(' ').toLowerCase().includes(q));const named=searchFeatures(features,q,6).filter(f=>!found.some(s=>s.name.toLowerCase()===f[0].toLowerCase()));
 results.innerHTML=found.map(siteRow).join('')+named.map((f,i)=>`<button class="row cat-pin" data-feature="${i}"><span class="badge">${icon('crater')}</span><span class="row-text"><strong>${safe(f[0])}</strong><small>${safe(f[4])} · ${f[3]>=10?Math.round(f[3]):f[3]} km across</small></span><span class="row-meta mono">${Math.abs(f[1]).toFixed(1)}°${f[1]<0?'S':'N'}</span>${icon('chevron','chev')}</button>`).join('')||`<p>No matching place${features?'':' yet (the list of named features is still loading)'}. Try latitude, longitude (for example −85, 20), or drop a pin.</p>`;
 results.querySelectorAll('[data-feature]').forEach(button=>button.onclick=()=>{const f=named[Number(button.dataset.feature)];const s=featureSite(f);addCustom(s);selectSite(s);});
};
$('#search').onkeydown=e=>{if(e.key==='Enter')$('#search-results button')?.click();};

// ---- Visibility windows ----
function lanes(d,start,end){
 const length=end-start;
 const lane=(rows,y,color)=>segments(rows,start,end).map(([a,b])=>`<rect x="${((a-start)/length*100).toFixed(2)}" y="${y}" width="${Math.max(.25,(b-a)/length*100).toFixed(2)}" height="4.4" fill="${color}"/>`).join('');
 const sunRows=visibilityRows(d,'sun'),earthRows=visibilityRows(d,'earth');
 // Third lane (below the two the timeline shows): Sun and Earth up together.
 return lane(sunRows,0,SUN_COLOR)+lane(earthRows,5.6,EARTH_COLOR)+lane(together(sunRows,earthRows),11.2,BOTH_COLOR);
}
function drawBands(){
 const start=startDate(),stay=duration/TIMELINE_HOURS*100;
 $('.scrub').classList.toggle('has-bands',Boolean(data));
 $('#bands').innerHTML=data?lanes(data,start,start+TIMELINE_HOURS*HOUR)+(duration<TIMELINE_HOURS?`<rect x="${stay}" y="0" width="${100-stay}" height="10" fill="#000" opacity=".55"/><rect x="${stay-.15}" y="0" width=".3" height="10" fill="#fff" opacity=".7"/>`:''):'';
}
function updateBanner(time){
 const banner=$('#event-banner');
 if(!data){banner.className='banner';$('#event-icon').innerHTML=icon('clock');$('#event-count').textContent='—';$('#event-label').textContent='Calculating Sun and Earth windows';$('#event-sub').textContent='';return;}
 const events=['sun','earth'].map(name=>{const rows=visibilityRows(data,name),now=sampleAt(rows,time);return {name,rows,cross:nextCrossing(rows,time),up:now?now.el>0:false};});
 // A Sun "rise" or "set" caused by Earth moving off or onto the Sun is named for what it is.
 const byEclipse=e=>e.name==='sun'&&eclipseAt(data.eclipse,e.cross.time)?.coverage>.2;
 const word=e=>e.name==='sun'?(byEclipse(e)?(e.cross.rising?'end of eclipse':'eclipse by Earth'):(e.cross.rising?'sunrise':'sunset')):(e.cross.rising?'Earthrise':'Earthset');
 // How far the time would move if the skyline were 0.1° higher or lower than the terrain model says.
 // Skipped with terrain off, and for eclipses, which do not depend on terrain.
 const give=e=>{if(!(terrainEnabled&&data.terrain)||byEclipse(e))return '';const spread=crossingSpread(e.rows,e.cross,.1);if(!spread)return ' ± more than 3 d';const m=spread.minutes;return m<1?'':` ± ${m<90?`${Math.round(m)} min`:m<2880?`${Math.round(m/60)} h`:`${Math.round(m/1440)} d`}`;};
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
 $('#event-label').textContent=`until ${word(next)} · ${stamp(next.cross.time)}${give(next)}`;
 $('#event-label').title=give(next)?'The ± shows how far this time moves if the skyline is 0.1° higher or lower than the terrain model says.':'';
 $('#event-sub').innerHTML=other.cross?`<b>${word(other).replace(/^./,c=>c.toUpperCase())}</b> in ${span(other.cross.time-time)} · ${stamp(other.cross.time)}${give(other)}`:steady(other);
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
 const end=startDate()+duration*HOUR,nowState={};
 for(const name of ['sun','earth']){
  const current=currents[name],h=current?(profile?horizonAt(profile,current.az):0):null,clear=current?current.el-h:null;
  const eclipse=name==='sun'&&data?eclipseAt(data.eclipse,time):null,eclipsed=Boolean(eclipse&&eclipse.coverage>.001&&clear>-.3);
  const up=clear!==null&&clear>0&&!(eclipse&&eclipse.limb<0),terrainBlocked=current&&!up&&current.el>0&&Boolean(profile)&&!(eclipse&&eclipse.limb<0&&clear>0);
  nowState[name]=current?(eclipsed?'eclipsed':up?'up':terrainBlocked?'blocked':'down'):null;
  $(`#${name}-elevation`).textContent=current?deg(current.el):'—';
  $(`#${name}-az`).textContent=current?`${number(current.az)}°`:'—';
  $(`#${name}-clear`).textContent=current?signedDeg(clear):'—';
  $(`#${name}-range`).textContent=current?.range?(name==='sun'?`${(current.range/1e6).toFixed(1)}M km`:`${Math.round(current.range).toLocaleString()} km`):'—';
  const state=$(`#${name}-state`);state.className=`state${up?' ok':terrainBlocked?' blocked':''}`;
  const share=data&&current?discAt(discRows(data,name),time):null,partial=share!==null&&share>.001&&share<.999;
  $(`#${name}-disc`).textContent=share===null?'—':`${Math.round(share*100)}%`;
  state.textContent=current?(eclipsed?(eclipse.coverage>=.999?'Eclipsed by Earth':`Eclipse: Earth covers ${Math.round(eclipse.coverage*100)}% of the Sun`):partial?`${name==='sun'?'Sun':'Earth'} partly hidden · ${Math.round(share*100)}% showing`:up?(name==='sun'?'Sunlit':'Earth in view'):(terrainBlocked?'Blocked by terrain':'Below horizon')):(selected?'Awaiting terrain & JPL':'No site selected');
  const hours=data?visibleHours(visibilityRows(data,name),startDate(),end):null;
  $(`#${name}-window`).textContent=hours===null?'—':`≈ ${number(hours)} h · ${Math.round(hours/duration*100)}%`;
  $(`#${name}-bar`).style.width=hours===null?'0':`${Math.min(100,hours/duration*100)}%`;
  const indicator=$(`#rail-${name}`);indicator.className=`rail-ind ${name}${current?(up?' on':' off'):''}`;
  indicator.title=current?`${selected.name}: ${name==='sun'?(up?'sunlit':'no direct sunlight'):(up?'Earth in view':'Earth not in view')} at ${stamp(time)}`:`Select a site to see ${name==='sun'?'sunlight':'whether Earth is in view'}`;
  $(`#rail-${name}-cap`).textContent=current?(name==='sun'?(up?'Sunlit':'No sunlight'):(up?'Earth in view':'Earth not in view')):(name==='sun'?'Sunlight':'Earth view');
 }
 const bothHours=data?visibleHours(together(visibilityRows(data,'sun'),visibilityRows(data,'earth')),startDate(),end):null;
 $('#both-window').textContent=bothHours===null?'—':`≈ ${number(bothHours)} h · ${Math.round(bothHours/duration*100)}%`;$('#both-bar').style.width=bothHours===null?'0':`${Math.min(100,bothHours/duration*100)}%`;
 document.querySelectorAll('.clear-label').forEach(el=>el.textContent=profile?'Above terrain':'Above horizon');
 $('#terrain-source').textContent=data?.terrain?(terrainEnabled?`${data.terrain.source} · dotted paths show the next ${duration<72?duration+' hours':duration/24+' days'}`:'Level horizon only · terrain ignored'):'Loading terrain…';
 drawSky(currents,profile);
 // The same picture in words: where each body is, and what hides it when something does.
 const distanceText=m=>m<1000?`${Math.max(10,Math.round(m/10)*10)} m`:`${(m/1000).toFixed(m<10000?1:0)} km`;
 const skyLine=(name,label)=>{
  const c=currents[name];setBlocker(name,null);if(!c)return '';
  const o=profile?obstructionAt(profile,c.az):null,skyline=o?o.horizon:0,toward=compassPoint(c.az);
  const covered=name==='sun'&&data?eclipseAt(data.eclipse,time)?.coverage:0;
  if(covered>.001&&c.el-skyline>-.3)return `Sun: an eclipse. Earth is in front of it and covers ${covered>=.999?'all':`${Math.round(covered*100)}%`} of its disk, ${deg(c.el-skyline)} above the ${profile?'terrain':'level horizon'} to the ${toward}.`;
  if(c.el-skyline>0)return `${label}: ${deg(c.el-skyline)} clear of the ${profile?'terrain':'level horizon'} to the ${toward}.`;
  if(o&&c.el>0&&selected){
   // Where that terrain is, and the IAU-named feature it belongs to, if one covers the spot.
   const where=destination(selected.lat,selected.lon,c.az,o.distanceMeters),named=features&&placeName(features,where[0],where[1]);
   setBlocker(name,where,`Terrain hiding the ${label} from ${selected.name}: ${distanceText(o.distanceMeters)} away${named?`, ${named.text}`:''}`);
   return `${label}: up at ${deg(c.el)} but hidden by terrain ${distanceText(o.distanceMeters)} away to the ${toward}${named?` (${named.text})`:''}, which rises to ${deg(o.horizon)}.`;
  }
  return `${label}: below the horizon to the ${toward}.`;
 };
 $('#sky-note').textContent=[skyLine('sun','Sun'),skyLine('earth','Earth')].filter(Boolean).join(' ');
 // The same result as three plain steps, with this site's own numbers.
 const steps=(name,label)=>{
  const c=currents[name];if(!c)return '';
  const o=profile?obstructionAt(profile,c.az):null,skyline=o?o.horizon:0,up=c.el-skyline>0;
  // Clearing the terrain is not the whole test for the Sun: during an eclipse Earth is in front of it.
  const covered=name==='sun'&&up?eclipseAt(data.eclipse,time)?.coverage??0:0,hidden=covered>.001;
  return `<li><b>Where the ${label} is.</b> NASA/JPL Horizons puts it ${deg(c.el)} ${c.el<0?'below':'above'} level ground, toward the ${compassPoint(c.az)}, at ${stamp(time)}.</li>`+
   `<li><b>How high the ground is that way.</b> ${profile?`NASA’s LOLA terrain reaches ${deg(skyline)} in that direction${o?`, from ground ${distanceText(o.distanceMeters)} away`:''}.`:'Terrain is switched off, so the skyline is level: 0°.'}</li>`+
   `<li><b>Compare.</b> ${deg(c.el)} is ${up?'above':'below'} ${deg(skyline)}, so the ${label} ${hidden?'clears the terrain':up?'is in view':'is hidden'}.</li>`+
   (hidden?`<li><b>Check for an eclipse.</b> Earth is passing in front of the Sun and covers ${covered>=.999?'all':`${Math.round(covered*100)}%`} of its disk, so ${covered>=.999?'no sunlight reaches this spot':'the sunlight here is cut'} until Earth moves on.</li>`:'');
 };
 $('#how-steps').innerHTML=data?`<ol>${steps('sun','Sun')}</ol><ol>${steps('earth','Earth')}</ol><p>The app repeats this test every five minutes for 30 days. The stretches where the answer is “in view”, less any eclipse of the Sun by Earth, are the windows, totals and countdowns you see.</p>`:'';
 const stay=data?stayMetrics(visibilityRows(data,'sun'),visibilityRows(data,'earth'),data.sun,startDate(),end):null;
 $('#stay-summary').textContent=stay?staySentence(stay,duration):'';
 // The answer in a sentence, before any numbers: the moment shown, then the stay.
 const sunWords={up:'this spot is sunlit',blocked:'the Sun is up but terrain hides it',down:'the Sun is below the horizon',eclipsed:'Earth is passing in front of the Sun'},earthWords={up:'Earth is in view',blocked:'Earth is up but terrain hides it',down:'Earth is below the horizon'};
 $('#site-answer').textContent=nowState.sun&&nowState.earth?`${stamp(time)}: ${sunWords[nowState.sun]}, and ${earthWords[nowState.earth]}.${stay?` Over the ${stayLabel()} stay: ${staySentence(stay,duration)}`:''}`:(selected?'Working out this site’s sky…':'');
 // The same stay as lists of times (UTC): when sunlight or the view of Earth is interrupted, and when both hold.
 if(stay){const from=startDate(),never='never during this stay';
  const st=stayStretches(data,from,end),at=list=>list.some(([a,b])=>a<=from&&b>from);
  $('#stay-windows').innerHTML=`<b>At touchdown:</b> ${at(st.lit)?'sunlit':'no sunlight'}, ${at(st.seen)?'Earth in view':'<span class="warn">Earth out of view, so no direct line home at first</span>'}.<br><b>No sunlight:</b> ${stretches(st.dark,never)}.<br><b>Earth out of view:</b> ${stretches(st.outage,never)}.<br><b>Sun and Earth together:</b> ${stretches(st.both,never)}.`;
 }else $('#stay-windows').textContent='';
 const sunDisc=data?discHours(discRows(data,'sun'),startDate(),end):null;
 const limbWord={first:'first light',full:'full disk',dim:'Sun starts to be covered',last:'last light'};
 const limbs=data?limbEvents(discRows(data,'sun'),time).map(e=>`${limbWord[e.kind]} ${stamp(e.time)}`):[];
 $('#disc-note').textContent=sunDisc&&stay?`Counting the Sun’s whole disk, not just its center: full Sun ${number(sunDisc.full)} h, at least part of it ${number(sunDisc.any)} h.${limbs.length?` Next: ${limbs.join(', then ')}.`:''}`:'';
 updateBanner(time);
 $('#next-event').textContent=`From ${stamp(startDate())} to ${stamp(end)} · ${terrainEnabled?'terrain included':'level horizon'} · ${end<Date.now()?'a stay in the past':startDate()>Date.now()?'a stay in the future':'a stay under way now'}`;
 $('#site-elevation').textContent=data?.terrain?`${data.terrain.elevationMeters<0?'−':'+'}${Math.abs(Math.round(data.terrain.elevationMeters)).toLocaleString()} m`:'—';
 // Which grids the skyline was read from: near terrain is fine, far terrain coarser.
 const shares=data?.terrain?.resolutionShares,gridName=r=>Number(r)>=1000?`${(Number(r)/1000).toFixed(1)} km`:`${Math.round(Number(r))} m`;
 $('#site-grid').innerHTML=data?.terrain?`${safe(data.terrain.source)}${shares&&Object.keys(shares).length>1?`<small>Skyline samples: ${Object.entries(shares).sort((a,b)=>a[0]-b[0]).map(([r,f])=>`${Math.round(f*100)}% from the ${gridName(r)} grid`).join(', ')}</small>`:''}`:'—';
 const slope=data?.terrain?.slopeDegrees,baseline=data?.terrain?.slopeBaselineMeters;
 $('#site-slope').innerHTML=Number.isFinite(slope)?`${slope.toFixed(1)}°<small>${baseline>=1000?`regional, over ${(baseline/1000).toFixed(1)} km`:`over ${baseline} m`}</small>`:'—';
 $('#site-shadow').innerHTML=psrFact(selected);$('#site-average').innerHTML=averageFact(selected);$('#best-row').hidden=!(selected&&poleOf(selected.lat));
 $('#compare').disabled=!data;$('#compare span').textContent=compared.some(s=>selected&&s.id===optionId(selected,$('#date').value,landingHour))?`Comparing (${compared.length})`:'Compare';
 $('#compare-count').hidden=!compared.length;$('#compare-count').textContent=compared.length;
 $('#terrain-toggle').setAttribute('aria-pressed',String(terrainEnabled));$('#terrain-toggle').textContent=terrainEnabled?'Terrain on':'Terrain off';
 if(data?.terrain)$('#terrain-detail').textContent=`${data.terrain.source}. The ground here is ${Math.abs(Math.round(data.terrain.elevationMeters)).toLocaleString()} m ${data.terrain.elevationMeters<0?'below':'above'} the 1,737.4 km reference radius, and the view is from 2 m above it. The skyline is traced every 0.25° out to 300 km. Grids: 40 m south of 85°S, 80 m near both poles, 474 m elsewhere. Small obstacles and narrow ridges can be missed.`;
 drawBands();updateBeams();updateCursor();renderLunar();syncUrl();
 if(tour)renderFlybyCaption();
}
$('#terrain-toggle').onclick=()=>{terrainEnabled=!terrainEnabled;refreshMetrics();renderComparison();renderRanking();};
// The card can hide its numbers. Phones start that way; the choice is remembered. Nothing is removed: the caution line and the plain sentences always stay.
function setDetail(show,remember=true){$('#site-card').classList.toggle('simple',!show);$('#detail-toggle').setAttribute('aria-pressed',String(show));$('#detail-toggle').textContent=show?'Hide the numbers':'Show the numbers: angles, distances, data sources';if(remember)try{localStorage.setItem('zoriana-detail',show?'1':'0');}catch{}if(tour)renderFlybyCaption();}
$('#detail-toggle').onclick=()=>setDetail($('#site-card').classList.contains('simple'));
{let stored=null;try{stored=localStorage.getItem('zoriana-detail');}catch{}setDetail(stored===null?!matchMedia('(max-width:900px)').matches:stored==='1',false);}
// Explainers can show what they describe.
document.querySelector('#browse').addEventListener('click',e=>{
 const what=e.target.closest('[data-show]')?.dataset.show;if(!what)return;
 if(what==='earth')setHeat('earth');
 if(what==='imagery')$('#sunlight').click();
 if(what==='pole'){setPsr(true);startFlight({to:new THREE.Vector3(...coordinatesToVector(-84,15)).multiplyScalar(2.4)});}
 if(matchMedia('(max-width:900px)').matches)setSheet('peek'); // on a phone, get the sheet out of the way of the map
});
$('#duration').onclick=e=>{const b=e.target.closest('[data-duration]');if(!b)return;duration=Number(b.dataset.duration);$('#duration').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));refreshMetrics();renderComparison();renderRanking();};

// ---- Time ----
// The corner clock: the moment the map shows, in the viewer's own time zone, with the same moment in UTC beneath it.
const localParts=new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit',timeZoneName:'short'});
function railClock(time,iso){
 const parts=Object.fromEntries(localParts.formatToParts(new Date(time)).map(p=>[p.type,p.value]));
 $('#rail-clock').textContent=`${parts.hour}:${parts.minute}`;$('#rail-clock').dateTime=iso;
 $('#rail-zone').textContent=[parts.dayPeriod,parts.timeZoneName].filter(Boolean).join(' ');$('#rail-also').textContent=`${iso.slice(11,16)} UTC`;
}
function updateClock(){
 const time=observationTime(),iso=new Date(time).toISOString(),hours=Number($('#time').value),d=Math.floor(hours/24),h=hours-d*24;
 $('#clock').textContent=iso.slice(11,16);$('#clock-date').textContent=`${day(time)}, ${iso.slice(0,4)}`;$('#clock-when').textContent=` · ${whenWord(time)}`;railClock(time,iso);comparisonClock();
 $('#met').textContent=hours===0?'T+0 h · landing':`T+${d?d+' d ':''}${Number.isInteger(h)?h:h.toFixed(2)} h`;
 $('#range-start').textContent=day(startDate());$('#date').title=`Observation: ${iso.replace('T',' ').slice(0,16)} UTC`;$('#clock').title=iso;
}
function updateCursor(){const hours=Number($('#time').value);$('#comparison-cards').style.setProperty('--cursor',hours<=duration?`${hours/duration*100}%`:'-10%');$('#lunar-plot').style.setProperty('--lunar-cursor',`${hours/(LUNAR_DAYS*24)*100}%`);}
let referenceData=null,referenceToken=0;
async function referenceLight(){const token=++referenceToken;try{const result=await ephemeris({lat:0,lon:0},{reference:true});if(token!==referenceToken)return;referenceData=result;updateLight();}catch(e){$('#map-status').textContent='NASA imagery · lighting unavailable';}}
function updateLight(){updateBodies();const d=data||referenceData;if(!d)return;const s=sampleAt(d.sun,observationTime());if(!s)return;sun.position.fromArray(skyDirection(d.lat,d.lon,s.az,s.el)).multiplyScalar(10);
 // During an eclipse the whole Moon dims by the share of the Sun that Earth covers (as seen from this site).
 sun.intensity=SUN_INTENSITY*(1-(eclipseAt(d.eclipse,observationTime())?.coverage??0));shadows.update(sun.position);invalidate();}
$('#time').oninput=()=>{updateClock();refreshMetrics();updateLight();};
function stop(){playing=false;clearInterval(playTimer);$('#play').innerHTML=icon('play');$('#play').setAttribute('aria-label','Play time animation');}
$('#play').onclick=()=>{if(playing){stop();return;}playing=true;$('#play').innerHTML=icon('pause');$('#play').setAttribute('aria-label','Pause time animation');playTimer=setInterval(()=>{let t=Number($('#time').value)+1;if(t>TIMELINE_HOURS){stop();return;}$('#time').value=t;$('#time').oninput();},120);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else invalidate();});
function applyDate(value,load=true){$('#date').value=value;lastValidDate=value;stop();referenceData=null;shadows.pending();updateClock();renderRanking();if(!load)return;if(selected)loadSelected();else referenceLight();}
$('#date').onchange=()=>{if(!$('#date').validity.valid||!$('#date').value){toast('Choose a valid date between 1950 and 2099.');$('#date').value=lastValidDate;return;}applyDate($('#date').value);};
$('#today').onclick=()=>{landingHour=0;$('#hour').value='0';$('#date').value=new Date().toISOString().slice(0,10);$('#time').value=new Date().getUTCHours();$('#date').onchange();};
$('#hour').onchange=()=>{landingHour=Number($('#hour').value);stop();updateClock();refreshMetrics();updateLight();renderRanking();};

// ---- Map chooser ----
function showPicker(value){$('#map-picker').hidden=!value;$('#map-mode').setAttribute('aria-expanded',String(value));if(value)$('#layer-picker').hidden=true;}
$('#map-mode').onclick=()=>showPicker($('#map-picker').hidden);
$('#close-picker').onclick=()=>showPicker(false);
document.addEventListener('pointerdown',e=>{if(!$('#map-picker').hidden&&!e.target.closest('#map-picker,#map-mode'))showPicker(false);});
function setMode(name,exitTo){
 mode=name;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode===name));
 setSunlight(name!=='satellite');$('#heading-tools').hidden=name!=='landing';
 $('#map-status').textContent=name==='satellite'?'NASA imagery · no lighting added':name==='landing'?'Landing view · LOLA relief at true scale · calculated sunlight':'Calculated sunlight · NASA imagery underneath';
 if(name==='landing')selectSite(selected||sites[0]);else exitSurface(exitTo);
 showPicker(false);invalidate();syncUrl();
}
for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>setMode(b.dataset.mode);

// ---- Lunar day: the 30 days that follow the landing date ----
const LUNAR_DAYS=30;
let lunarFinder=null;
let lunarMemo=null,lunarBest=null,lunarBestTime=null;
function renderLunar(){
 if(lunarMemo&&lunarMemo.data===data&&lunarMemo.duration===duration&&lunarMemo.terrain===terrainEnabled&&lunarMemo.selected===selected&&lunarMemo.hour===landingHour)return;
 lunarMemo={data,duration,terrain:terrainEnabled,selected,hour:landingHour};lunarBest=null;
 const chart=$('#lunar-chart'),facts=$('#lunar-facts'),status=$('#lunar-status');
 const idle=text=>{chart.hidden=true;facts.innerHTML='';status.textContent=text;$('#lunar-range').textContent='';$('#finder').hidden=true;};
 if(!data){idle(selected?'Loading 30 days of Sun and Earth positions…':'');return;}
 const start=startDate(),end=start+LUNAR_DAYS*DAY;
 if(data.sun.at(-1).time<end){idle('The running server returned fewer than 30 days. Restart Zoriana to load the full lunar day.');return;}
 status.textContent='';chart.hidden=false;$('#lunar-range').textContent=`${day(start)} – ${day(end)}`;
 const sunRows=visibilityRows(data,'sun'),earthRows=visibilityRows(data,'earth');
 const lit=segments(sunRows,start,end),dark=gaps(lit,start,end),seen=segments(earthRows,start,end),outages=gaps(seen,start,end);
 const total=list=>list.reduce((sum,[a,b])=>sum+b-a,0),share=list=>Math.round(total(list)/(end-start)*100);
 // Arrival times after which a condition holds without a break for the hours asked for.
 {const need=Math.max(1,Math.min(168,Math.round(Number($('#finder-hours').value)||6))),what=$('#finder-what').value;
  const held=what==='sun'?lit:what==='earth'?seen:segments(together(sunRows,earthRows),start,end),name={sun:'sunlight',earth:'Earth in view',both:'Sun and Earth together'}[what];
  const windows=arrivalWindows(held,need),first=windows[0]&&Math.ceil(windows[0][0]/HOUR)*HOUR;
  lunarFinder=first&&first<=windows[0][1]?first:null;
  $('#finder').hidden=false;
  $('#finder-result').innerHTML=windows.length?`Land ${windows.slice(0,4).map(([a,b])=>b-a<60000?`at ${shortStamp(a)}`:`between ${shortStamp(a)} and ${shortStamp(b)} (${span(b-a)})`).join('; or ')}${windows.length>4?`; and ${windows.length-4} more`:''} UTC. ${lunarFinder?`<button id="finder-use" class="link">Use ${shortStamp(lunarFinder)}</button>`:''}<br>Each gives at least ${need} h of ${name} from touchdown, counting the center of the body against the ${terrainEnabled?'terrain':'level horizon'}. A stretch still going at the end of the 30 days is counted only up to there.`:`No landing time in the next 30 days gives ${need} h of ${name} without a break.`;}
 // A stretch that touches either edge of the window may continue beyond it, so it is a minimum.
 const stretch=list=>{const best=longest(list);if(!best)return 'None';return `${best[0]<=start||best[1]>=end?'≥ ':''}${span(best[1]-best[0])}<small>from ${day(best[0])}</small>`;};
 const peak=data.sun.reduce((best,r)=>r.time<=end&&r.el>best.el?r:best,data.sun[0]);
 const scores=landingDays(sunRows,earthRows,start,LUNAR_DAYS,duration),best=bestLandingDay(scores);lunarBest=best;
 // The best hour, searched from 00:00 on the landing date whatever landing hour is selected.
 const bestTime=lunarBestTime=bestLandingTime(sunRows,earthRows,dayStart(data.date),LUNAR_DAYS,duration);
 $('#lunar-bars').innerHTML=scores.map(s=>{if(!s)return '';const h=Math.max(.4,s.sun/duration*8.4);return `<rect x="${s.day+.14}" y="${(10-h).toFixed(2)}" width=".72" height="${h.toFixed(2)}" fill="${SUN_COLOR}" opacity="${best&&best.sun>0&&s.day===best.day?1:s.sun>0?.5:.18}"/>`;}).join('')+'<line x1="0" x2="30" y1="1.6" y2="1.6" stroke="rgba(255,255,255,.22)" stroke-width="1" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/>';   // the dashed line is 100%: a stay sunlit from start to finish
 $('#lunar-bands').innerHTML=lanes(data,start,end);
 $('#lunar-window').style.width=`${duration/(LUNAR_DAYS*24)*100}%`;
 $('#lunar-days').innerHTML=scores.map((s,d)=>{const t=start+d*DAY,text=s?`${day(t)}: ${number(s.sun)} h sunlit and ${number(s.earth)} h Earth in view for a ${stayLabel()} stay`:`${day(t)}: a ${stayLabel()} stay runs past the 30-day window`;return `<button data-day="${d}" title="${text}" aria-label="Land ${text}"${d?'':' disabled'}></button>`;}).join('');
 $('#lunar-ticks').innerHTML=[0,7,14,21,28].map(d=>`<span style="${d===28?'right:0':`left:${d/LUNAR_DAYS*100}%`}">${day(start+d*DAY)}</span>`).join('');   // the last date is pinned to the right edge so it cannot stick out
 $('#lunar-caption').textContent=`Bars: sunlit share of a ${stayLabel()} stay for each landing day; the dashed line is 100%. Select a day to land then.`;
 const row=(label,value)=>`<div><span>${label}</span><b>${value}</b></div>`;
 facts.innerHTML=row('Sunlit, next 30 days',`${share(lit)}% · ${(total(lit)/DAY).toFixed(1)} d`)+row('Longest sunlight',stretch(lit))+row('Longest darkness',stretch(dark))+row('Earth in view, next 30 days',`${share(seen)}%`)+row('Longest Earth outage',stretch(outages))+row('Peak Sun elevation',`${deg(peak.el)}<small>${day(peak.time)}</small>`)+
  row('Eclipses by Earth',(()=>{const list=eclipseEvents(data.eclipse).filter(e=>e.end>=start&&e.start<=end);const clock=t=>new Date(t).toISOString().slice(11,16);return list.length?list.map(e=>`${shortStamp(e.start)} to ${clock(e.end)} UTC<small>${e.totalStart!==null?`Sun fully hidden ${clock(e.totalStart)} to ${clock(e.totalEnd)}`:`up to ${Math.round(e.maxCoverage*100)}% of the Sun covered`}</small>`).join('<br>'):'None in these 30 days';})()+(()=>{const next=nextListedEclipse(end);if(!next)return '';
   // NASA's list says when the next one is; a penumbral eclipse touches only part of the Moon, so this site may not see it.
   return `<small>Next on NASA’s list: ${new Date(next.time).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})} (${next.kind.toLowerCase()}${next.kind==='Penumbral'?', touches only part of the Moon':''}) · <button class="link" data-eclipse="${next.time}">go to it</button></small>`;})())+
  (best&&best.sun>0?`<div><span>Most sunlit landing day<br>for a ${stayLabel()} stay</span><b>${day(best.start)}${best.day?'':' (current)'}<small>${number(best.sun)} h sunlit · ${number(best.earth)} h Earth</small></b></div><div class="best-actions">${best.day?'<button id="lunar-use" class="mini-toggle">Use this date</button>':''}<button id="lunar-compare" class="mini-toggle">Add to compare</button></div>`:row(`Most sunlit landing day for a ${stayLabel()} stay`,'No sunlit stay in this window'))+
  (bestTime&&bestTime.both>0?`<div><span>Best landing time<br>for Sun and Earth together</span><b>${shortStamp(bestTime.start)} UTC<small>${number(bestTime.both)} h together · ${number(bestTime.sun)} h sunlit</small></b></div>${bestTime.start===start?'':'<div class="best-actions"><button id="lunar-use-time" class="mini-toggle">Use this time</button></div>'}`:row('Best landing time for Sun and Earth together','None in this window'))+
  `<p class="tiny outages"><b>Earth out of view:</b> ${outages.length?outages.slice(0,4).map(([a,b])=>`${shortStamp(a)} to ${shortStamp(b)} (${span(b-a)})`).join('; ')+(outages.length>4?`; and ${outages.length-4} more`:''):'never in the next 30 days'}.</p>`;
}
$('#lunar-days').onclick=e=>{const d=e.target.closest('[data-day]')?.dataset.day;if(!d||!data)return;const date=shiftDate(data.date,Number(d));if(date)applyDate(date);else toast('That date is outside the supported range (1950–2099).');};
$('#finder-hours').oninput=$('#finder-what').onchange=()=>{lunarMemo=null;renderLunar();};
$('#finder').onclick=e=>{if(!e.target.closest('#finder-use')||!lunarFinder)return;const t=new Date(lunarFinder);landingHour=t.getUTCHours();$('#hour').value=String(landingHour);$('#time').value=0;applyDate(t.toISOString().slice(0,10));};
$('#lunar-facts').onclick=e=>{
 const jump=e.target.closest('[data-eclipse]');
 if(jump){ // open two days before the eclipse, with the clock on its middle
  const when=Number(jump.dataset.eclipse),date=new Date(when-2*DAY).toISOString().slice(0,10);
  landingHour=0;$('#hour').value='0';$('#time').value=Math.round((when-dayStart(date))/HOUR*4)/4;applyDate(date);return;
 }
 if(e.target.closest('#lunar-use-time')&&lunarBestTime){const t=new Date(lunarBestTime.start);landingHour=t.getUTCHours();$('#hour').value=String(landingHour);applyDate(t.toISOString().slice(0,10));return;}
 if(!lunarBest||!selected||!data)return;
 const date=shiftDate(data.date,lunarBest.day);if(!date)return;
 if(e.target.closest('#lunar-use'))applyDate(date);
 else if(e.target.closest('#lunar-compare')){addOption(selected,data.date);if(date!==data.date)addOption(selected,date);}
};

// ---- Comparison: each option is a site on a landing date, lined up by mission time ----
const MAX_OPTIONS=4,DATE_MIN='1950-01-01',DATE_MAX='2099-12-24';
const optionId=(site,date,hour)=>`${site.id}@${date}T${String(hour).padStart(2,'0')}`;
const optionStart=o=>dayStart(o.date)+o.hour*HOUR;
let comparisonToken=0,lastComparison=[];
function shiftDate(date,days){const shifted=new Date(Date.parse(date+'T00:00:00Z')+days*DAY).toISOString().slice(0,10);return shifted>=DATE_MIN&&shifted<=DATE_MAX?shifted:null;}
function addOption(site,date,show=true,hour=landingHour){
 const id=optionId(site,date,hour);
 if(!compared.some(s=>s.id===id)){
  if(compared.length>=MAX_OPTIONS){toast(`Compare up to ${MAX_OPTIONS} options. Remove one to add another.`);return false;}
  compared.push({id,site:{...site},date,hour});
 }
 if(show){showRanking(false);$('#comparison').hidden=false;}
 refreshMetrics();renderComparison();return true;
}
function openOption(option){landingHour=option.hour;$('#hour').value=String(option.hour);if($('#date').value!==option.date)applyDate(option.date,false);else updateClock();selectSite(option.site);}
$('#compare').onclick=()=>{if(selected)addOption(selected,$('#date').value);};
$('#rail-compare').onclick=()=>{if(!compared.length){toast(matchMedia('(hover:hover)').matches?'Shift-click two places on the Moon to compare them, or open a site and choose Compare.':'Open a site and choose Compare to line up sites and landing dates.');return;}$('#comparison').hidden=!$('#comparison').hidden;if(!$('#comparison').hidden){showRanking(false);renderComparison();}};
// A stay with no sunlight often has it a few days on: say when, so a zero is not read as "never".
function laterSun(d,metrics,end){
 if(metrics.sun>0)return '';
 const next=segments(visibilityRows(d,'sun'),end,d.sun.at(-1).time)[0];
 return next?` <span class="later">Sunlight next reaches this spot ${stamp(next[0])}; use Delay to land then.</span>`:'';
}
// The map can show a moment outside the stays being compared (after dragging the timeline, say). Say so, because then
// the sunlight drawn on the Moon and the totals on the cards describe different times.
function comparisonClock(){
 const el=$('#comparison-clock');if(!el)return;
 const now=observationTime(),outside=compared.filter(o=>now<optionStart(o)||now>optionStart(o)+duration*HOUR);
 el.hidden=!compared.length||!outside.length;
 if(!el.hidden)el.textContent=`The map is showing ${stamp(now)}, which is outside ${outside.length===compared.length?(compared.length>1?'these stays':'this stay'):'some of these stays'}. The totals below are for each stay, not for that moment.`;
}
async function renderComparison(){
 comparisonClock();
 if(!compared.length){$('#comparison').hidden=true;$('#comparison-cards').innerHTML='';lastComparison=[];syncUrl();return;}
 $('#comparison-method').textContent=`${stayLabel()} stay from each landing time · ${terrainEnabled?'terrain included':'level horizon'}`;
 const token=++comparisonToken,totals=[];lastComparison=[];syncUrl();
 $('#comparison-cards').innerHTML=compared.map((s,i)=>`<article class="compare-card" data-compare="${safe(s.id)}"><div class="compare-head cat-${s.site.cat}"><span class="badge">${icon(siteIcon(s.site))}</span><strong>${safe(s.site.name)}</strong><button aria-label="Remove ${safe(s.site.name)}, ${fullDay(s.date)}" data-remove>${icon('x')}</button></div><small><b>Lands ${fullDay(s.date)}${s.hour?`, ${hourText(s.hour)} UTC`:''}</b> · <span class="mono">${coordText(s.site)}</span><span class="stay-span">Totals cover the stay: ${stamp(optionStart(s))} to ${stamp(optionStart(s)+duration*HOUR)}</span></small><div class="tags">${i===0&&compared.length>1?'<span class="tag base">Baseline</span>':''}</div><div class="results"><p class="waiting">Loading NASA/JPL…</p></div><div class="card-actions"><button class="go" data-go>Open</button><span class="shift">Delay<button data-shift="0.5">+12 h</button><button data-shift="1">+1 d</button><button data-shift="3">+3 d</button><button data-shift="7">+7 d</button><button data-shift="14">+14 d</button><button data-shift="30">+30 d</button></span></div></article>`).join('');
 const cards=[...$('#comparison-cards').children];
 for(const [i,s] of compared.entries()){
  const card=cards[i];
  try{
   const d=await ephemeris(s.site,{date:s.date});if(token!==comparisonToken)return;
   const start=optionStart(s),end=start+duration*HOUR;
   const metrics=withDisc(stayMetrics(visibilityRows(d,'sun'),visibilityRows(d,'earth'),d.sun,start,end),d,start,end);
   if(!metrics)throw new Error('Series does not cover the stay.');
   totals.push({id:s.id,card,...metrics});lastComparison.push({option:s,metrics,terrain:d.terrain});
   const lane=(name,y,hours)=>`<div class="lane"><div class="track"><svg viewBox="0 ${y} 100 4.4" preserveAspectRatio="none" aria-hidden="true">${lanes(d,start,end)}</svg></div><b data-total="${name}">${number(hours)} h</b></div>`;
   card.querySelector('.results').innerHTML=lane('sun',0,metrics.sun)+lane('earth',5.6,metrics.earth)+lane('both',11.2,metrics.both)+
    `<p class="plain">${staySentence(metrics,duration)}${laterSun(d,metrics,end)}</p><p class="tiny">Sun elevation while sunlit ${metrics.sunHeight===null?'—':'avg '+deg(metrics.sunHeight)}${Number.isFinite(d.terrain?.slopeDegrees)?` · slope ${d.terrain.slopeDegrees.toFixed(1)}° over ${d.terrain.slopeBaselineMeters>=1000?(d.terrain.slopeBaselineMeters/1000).toFixed(1)+' km':d.terrain.slopeBaselineMeters+' m'}`:''}${Number.isFinite(d.terrain?.elevationMeters)?` · elevation ${d.terrain.elevationMeters<0?'−':'+'}${Math.abs(Math.round(d.terrain.elevationMeters)).toLocaleString()} m`:''}${s.site.note?' · approximate point':''}</p>`;
  }catch(e){if(token!==comparisonToken)return;card.querySelector('.results').innerHTML='<p class="waiting">JPL unavailable for this option. Reopen the panel to retry.</p>';}
 }
 if(totals.length<2)return;
 for(const [key,label] of [['sun','Most sunlight'],['earth','Longest Earth view'],['both','Most Sun + Earth']]){const best=Math.max(...totals.map(t=>t[key]));const winners=totals.filter(t=>t[key]===best);if(best>0&&winners.length===1)winners[0].card.querySelector('.tags').insertAdjacentHTML('beforeend',`<span class="tag ${key}">${label}</span>`);}
 // Differences against the first option, so a slipped date or a moved site reads at a glance.
 const base=totals.find(t=>t.id===compared[0].id);
 if(base)for(const t of totals){if(t===base)continue;for(const key of ['sun','earth','both']){const delta=t[key]-base[key];if(Math.abs(delta)>=.05)t.card.querySelector(`[data-total="${key}"]`).insertAdjacentHTML('beforeend',`<small class="${delta>0?'up':'down'}">${delta>0?'+':'−'}${number(Math.abs(delta))}</small>`);}}
}
$('#comparison-cards').onclick=e=>{
 const option=compared.find(s=>s.id===e.target.closest('[data-compare]')?.dataset.compare);if(!option)return;
 if(e.target.closest('[data-remove]')){compared=compared.filter(s=>s!==option);renderComparison();refreshMetrics();return;}
 if(e.target.closest('[data-go]')){openOption(option);return;}
 const shift=e.target.closest('[data-shift]');if(!shift)return;
 const days=Number(shift.dataset.shift);
 if(days%1){const t=new Date(optionStart(option)+days*DAY),date=t.toISOString().slice(0,10);if(date>=DATE_MIN&&date<=DATE_MAX)addOption(option.site,date,true,t.getUTCHours());else toast('That date is outside the supported range (1950–2099).');return;}
 const date=shiftDate(option.date,days);if(date)addOption(option.site,date,true,option.hour);else toast('That date is outside the supported range (1950–2099).');
};
$('#close-compare').onclick=()=>{$('#comparison').hidden=true;};

// ---- Ranking: every site for the chosen landing date and stay, in one table ----
const rankColumns=[['both','Sun + Earth','Hours with the Sun and Earth both above the horizon: sunlight and Earth in view at the same time'],['sun','Sunlit','Hours of sunlight'],['earth','Earth','Hours with Earth in view'],['sunHeight','Sun elev.','Average Sun elevation while the site is sunlit']];
let rankFilter='all',rankSort='both',rankToken=0,rankList=[],rankResults=new Map();
function showRanking(value){$('#ranking').hidden=!value;if(value){$('#comparison').hidden=true;renderRanking();}else rankToken++;syncUrl();}
async function renderRanking(){
 if($('#ranking').hidden)return;
 const token=++rankToken,date=$('#date').value,start=startDate(),end=start+duration*HOUR;
 rankList=sites.filter(s=>rankFilter==='all'||s.cat===rankFilter);
 if(selected?.cat==='pin'&&rankFilter==='all')rankList.push(selected);
 $('#ranking-chips').innerHTML=[['all','All'],...Object.entries(categories).filter(([k])=>k!=='pin').map(([k,c])=>[k,c.label])].map(([k,label])=>`<button class="chip-btn cat-${k}${k===rankFilter?' active':''}" data-rank-filter="${k}" aria-pressed="${k===rankFilter}">${k==='all'?'':icon(categories[k].icon)}${label}</button>`).join('');
 $('#ranking-head').innerHTML=`<span>Site</span>${rankColumns.map(([key,label,title])=>`<button data-sort="${key}" title="${title}" aria-pressed="${key===rankSort}">${label}</button>`).join('')}<i></i>`;
 rankResults=new Map();drawRanking(date,0);
 let done=0;
 for(const site of rankList){
  try{const d=await ephemeris(site,{date});if(token!==rankToken)return;const m=withDisc(stayMetrics(visibilityRows(d,'sun'),visibilityRows(d,'earth'),d.sun,start,end),d,start,end);rankResults.set(site.id,m?{...m,terrain:d.terrain}:{error:true});}
  catch(e){if(token!==rankToken)return;rankResults.set(site.id,{error:true});}
  drawRanking(date,++done);
 }
}
function drawRanking(date,done){
 const score=s=>{const m=rankResults.get(s.id);return m&&!m.error&&m[rankSort]!==null?m[rankSort]:-Infinity;};
 const minSun=Math.max(0,Number($('#rank-min-sun').value)||0),minEarth=Math.max(0,Number($('#rank-min-earth').value)||0);
 const meets=s=>{const m=rankResults.get(s.id);return !m||m.error||(m.sun>=minSun&&m.earth>=minEarth);};
 const ordered=[...rankList].filter(meets).sort((a,b)=>score(b)-score(a)||(rankResults.get(b.id)?.sun??-1)-(rankResults.get(a.id)?.sun??-1));
 $('#ranking-method').textContent=`${stayLabel()} stay from ${stamp(startDate())} · ${terrainEnabled?'terrain included':'level horizon'}${done<rankList.length?` · loading ${done} of ${rankList.length}…`:''}${minSun||minEarth?` · ${ordered.length} of ${rankList.length} meet your minimum`:''}`;
 let position=0;
 $('#ranking-rows').innerHTML=ordered.map(s=>{
  const m=rankResults.get(s.id),ready=m&&!m.error;if(ready)position++;
  const hours=key=>`<b class="c ${key}${key===rankSort?' sorted':''}" style="--f:${ready?Math.min(1,m[key]/duration).toFixed(3):0}">${ready?number(m[key])+' h':m?'n/a':'…'}</b>`;
  return `<div class="rank-row cat-${s.cat}${ready&&position===1&&score(s)>0?' first':''}" data-rank="${safe(s.id)}"><span class="pos">${ready?position:''}</span><span class="badge">${icon(siteIcon(s))}</span><button class="rank-name" data-open title="Open ${safe(s.name)}"><strong>${safe(s.name)}</strong><small>${s.note?'<em>Approx. point</em> · ':''}${safe(s.description||coord(s))}</small></button>${hours('both')}${hours('sun')}${hours('earth')}<b class="c sunHeight${rankSort==='sunHeight'?' sorted':''}">${ready?(m.sunHeight===null?'—':deg(m.sunHeight)):m?'n/a':'…'}</b><button class="add" data-add aria-label="Add ${safe(s.name)} to the comparison" title="Add to comparison">${icon('plus')}</button></div>`;
 }).join('');
}
$('#ranking-chips').onclick=e=>{const k=e.target.closest('[data-rank-filter]')?.dataset.rankFilter;if(k){rankFilter=k;renderRanking();}};
$('#ranking-head').onclick=e=>{const key=e.target.closest('[data-sort]')?.dataset.sort;if(!key)return;rankSort=key;$('#ranking-head').querySelectorAll('[data-sort]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sort===key)));drawRanking($('#date').value,rankResults.size);};
$('#ranking-rows').onclick=e=>{
 const site=rankList.find(s=>s.id===e.target.closest('[data-rank]')?.dataset.rank);if(!site)return;
 if(e.target.closest('[data-add]')){if(addOption(site,$('#date').value,false))toast(`${site.name} added to the comparison (${compared.length} of ${MAX_OPTIONS}).`);}
 else if(e.target.closest('[data-open]'))selectSite(site);
};
$('#close-ranking').onclick=()=>showRanking(false);
$('#rank-min-sun').oninput=$('#rank-min-earth').oninput=()=>drawRanking($('#date').value,rankResults.size);
$('#rail-rank').onclick=()=>showRanking($('#ranking').hidden);$('#rank-from-list').onclick=()=>showRanking(true);

// ---- Export: the comparison and the ranking as CSV files ----
const exportHeader=['site','latitude_deg','longitude_deg_east','landing_utc','stay_hours','horizon_model','sunlit_hours','earth_in_view_hours','sun_and_earth_hours','sun_full_disk_hours','sun_any_disk_hours','sun_elevation_avg_deg','sun_elevation_peak_deg','surface_elevation_m','slope_deg','slope_baseline_m','terrain_data','location_approximate','no_sunlight_utc','earth_out_of_view_utc','sun_and_earth_utc','app_version','source'];
const isoStretches=list=>(list||[]).map(([a,b])=>`${new Date(a).toISOString().slice(0,16)}Z/${new Date(b).toISOString().slice(0,16)}Z`).join('; ');
const exportRow=(site,start,m,terrain)=>[site.name,site.lat.toFixed(5),site.lon.toFixed(5),new Date(start).toISOString().slice(0,16)+'Z',duration,terrainEnabled?'terrain horizon':'level horizon',m.sun.toFixed(2),m.earth.toFixed(2),m.both.toFixed(2),m.sunDisc?m.sunDisc.full.toFixed(2):'',m.sunDisc?m.sunDisc.any.toFixed(2):'',m.sunHeight===null?'':m.sunHeight.toFixed(2),m.sunPeak===null?'':m.sunPeak.toFixed(2),terrain?Math.round(terrain.elevationMeters):'',Number.isFinite(terrain?.slopeDegrees)?terrain.slopeDegrees.toFixed(2):'',terrain?.slopeBaselineMeters??'',terrain?.source??'',site.note?'yes':'no',isoStretches(m.stretches?.dark),isoStretches(m.stretches?.outage),isoStretches(m.stretches?.both),appVersion,'NASA/JPL Horizons + NASA LOLA via Zoriana; geometry only'];
function saveCsv(name,rows){
 const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([toCsv(rows)],{type:'text/csv;charset=utf-8'}));link.download=name;
 document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),2000);
}
$('#export-compare').onclick=()=>{
 if(!lastComparison.length){toast('Nothing to export yet. Wait for the comparison to finish loading.');return;}
 saveCsv(`zoriana-comparison-${$('#date').value}.csv`,[exportHeader,...lastComparison.map(r=>exportRow(r.option.site,optionStart(r.option),r.metrics,r.terrain))]);
};
$('#export-ranking').onclick=()=>{
 // The file holds what the table shows: the same minimum hours, the same order.
 const minSun=Math.max(0,Number($('#rank-min-sun').value)||0),minEarth=Math.max(0,Number($('#rank-min-earth').value)||0);
 const loaded=rankList.filter(s=>{const r=rankResults.get(s.id);return r&&!r.error;}),ready=loaded.filter(s=>{const r=rankResults.get(s.id);return r.sun>=minSun&&r.earth>=minEarth;});
 if(!loaded.length){toast('Nothing to export yet. Wait for the ranking to finish loading.');return;}
 if(!ready.length){toast('No site meets your minimum hours, so there is nothing to export.');return;}
 const score=s=>rankResults.get(s.id)[rankSort]??-Infinity;
 saveCsv(`zoriana-ranking-${$('#date').value}.csv`,[['rank_by_'+rankSort,...exportHeader],...ready.sort((a,b)=>score(b)-score(a)||rankResults.get(b.id).sun-rankResults.get(a.id).sun).map((s,i)=>[i+1,...exportRow(s,startDate(),rankResults.get(s.id),rankResults.get(s.id).terrain)])]);
};

// ---- Shareable address: the site, date, stay and comparison are kept in the URL ----
const siteToken=s=>s.cat==='pin'?`${s.lat.toFixed(4)},${s.lon.toFixed(4)}`:s.id;
function siteFromToken(token){
 const known=sites.find(s=>s.id===token);if(known)return known;
 const m=String(token).match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);if(!m)return null;
 const lat=Number(m[1]),lon=Number(m[2]);if(Math.abs(lat)>90||Math.abs(lon)>180)return null;
 return {id:`pin-${lat.toFixed(4)}_${lon.toFixed(4)}`,name:pinName(lat,lon),type:'Custom lunar coordinates',cat:'pin',lat,lon};
}
let urlTimer;
function writeUrl(){
 const p=new URLSearchParams();
 if(new URLSearchParams(location.search).has('diagnostics'))p.set('diagnostics','1');
 if(selected)p.set('site',siteToken(selected));
 p.set('date',$('#date').value);if(landingHour)p.set('hour',landingHour);
 if(Number($('#time').value)!==0)p.set('t',$('#time').value);
 if(duration!==72)p.set('stay',duration);if(!terrainEnabled)p.set('terrain','off');if(!psrEnabled)p.set('psr','off');if(gridEnabled)p.set('grid','on');if(heatMode!=='off')p.set('heat',heatMode);if(mode!=='explore')p.set('view',mode);if(!$('#ranking').hidden)p.set('panel','rank');
 if(compared.length)p.set('compare',compared.map(o=>`${siteToken(o.site)}@${o.date}T${String(o.hour).padStart(2,'0')}`).join('~'));
 try{history.replaceState(null,'',`${location.pathname}?${p}`);}catch{}
}
// Browsers limit how often the address may change, so playback and dragging are coalesced.
function syncUrl(){if(restoring)return;clearTimeout(urlTimer);urlTimer=setTimeout(writeUrl,400);}
function restoreFromUrl(){
 const p=new URLSearchParams(location.search);
 const date=p.get('date');if(date&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&date>=DATE_MIN&&date<=DATE_MAX&&Number.isFinite(dayStart(date))){$('#date').value=date;lastValidDate=date;}
 const hour=Number(p.get('hour'));if(p.has('hour')&&Number.isInteger(hour)&&hour>=0&&hour<24){landingHour=hour;$('#hour').value=String(hour);}
 const stay=Number(p.get('stay'));if([24,48,72,168].includes(stay)){duration=stay;$('#duration').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.duration)===stay)));}
 if(p.get('terrain')==='off')terrainEnabled=false;
 if(p.get('psr')==='off')setPsr(false);if(p.get('grid')==='on')setGrid(true);
 if(HEAT[p.get('heat')])setHeat(p.get('heat'));
 const t=Number(p.get('t'));if(p.has('t')&&t>=0&&t<=TIMELINE_HOURS)$('#time').value=t;
 for(const entry of (p.get('compare')||'').split('~').filter(Boolean).slice(0,MAX_OPTIONS)){
  const [token,when]=entry.split('@'),site=siteFromToken(token),m=(when||'').match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}))?$/);
  if(!site||!m||m[1]<DATE_MIN||m[1]>DATE_MAX)continue;
  const optionHour=Math.min(23,Number(m[2]||0));
  if(site.cat==='pin'&&!labels.some(l=>l.site.id===site.id))addLabel(site);
  if(!compared.some(o=>o.id===optionId(site,m[1],optionHour)))compared.push({id:optionId(site,m[1],optionHour),site,date:m[1],hour:optionHour});
 }
 const site=p.has('site')?siteFromToken(p.get('site')):null,view=p.get('view');
 if(view==='satellite')setMode('satellite');
 if(site){
  if(site.cat==='pin'&&!labels.some(l=>l.site.id===site.id))addCustom(site);
  if(view==='landing'){selected=site;setMode('landing');}else selectSite(site);
 }
 if(compared.length){$('#comparison').hidden=false;renderComparison();}
 if(p.get('panel')==='rank')showRanking(true); // a shared link can open straight on the ranking
}
$('#share').onclick=$('#share-compare').onclick=async()=>{
 clearTimeout(urlTimer);writeUrl();
 try{await navigator.clipboard.writeText(location.href);toast('Link copied. It reopens this site, date, stay and comparison.');}
 catch{toast('The address bar now holds a link to this view. Copy it from there to share.');}
};

for(const id of ['about','details','sources'])$('#'+id).onclick=()=>$('#info').showModal();$('#close-info').onclick=()=>$('#info').close();$('#info').onclick=e=>{if(e.target===$('#info')){const r=$('#info').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#info').close();}};
restoreFromUrl();
// ---- Zoriana, the guide: asks who is exploring, sets the app up for them, gives a short tour, and explains what is clicked ----
let guideTime=null,guideOwns=false,guideDate=null,guideSpin=0;
let guideSaved=null;   // the visitor's own comparison, set aside while an investigation borrows the panel
const siteById=id=>sites.find(s=>s.id===id);
guide=createGuide({
 // What each experience sets up. Site, date, stay and comparison are left as the visitor has them.
 setup(id){setDetail(id==='planner');setGrid(id==='educator');syncUrl();},
 toast,stayLabel,
 stayWords:()=>duration<72?`${duration}-hour`:`${duration/24}-day`,
 phone:()=>phone.matches,
 select(id){const s=siteById(id);if(!s||selected?.id===id)return;if(mode!=='explore')setMode('explore');selectSite(s);},
 selected:()=>selected?.name??null,
 names:ids=>ids.map(id=>siteById(id).name),
 distanceKm:(a,b)=>siteVector(siteById(a)).angleTo(siteVector(siteById(b)))*1737.4,
 dateLabel:()=>stamp(startDate()),
 home(){if(selected)closeSite();$('#planner').scrollTop=0;goHome();},
 flyTo(lat,lon,distance=2.7){if(selected)closeSite();startFlight({to:new THREE.Vector3(...coordinatesToVector(lat,lon)).multiplyScalar(distance)});if(phone.matches)setSheet('peek');},
 // The tour's first step turns the Moon slowly by itself.
 // The tour's first step: one full turn in about six seconds, then back to the opening view.
 spin(on){
  clearTimeout(guideSpin);controls.autoRotate=Boolean(on);controls.autoRotateSpeed=10;invalidate();
  if(on)guideSpin=setTimeout(()=>{controls.autoRotate=false;goHome();},6000);
 },
 // An experiment changes one input, the landing date, and puts it back when it ends. Days count from the visitor's own date.
 moveDate(days){if(guideDate===null)guideDate=$('#date').value;const d=days?shiftDate(guideDate,days):guideDate;if(d&&d!==$('#date').value)applyDate(d);},
 restoreDate(){if(guideDate!==null&&guideDate!==$('#date').value)applyDate(guideDate);guideDate=null;},
 showSouthPole(){if(selected)closeSite();setPsr(true);startFlight({to:new THREE.Vector3(...coordinatesToVector(-84,15)).multiplyScalar(2.4)});if(phone.matches)setSheet('peek');},
 // The tour's demonstration of the time bar: play, then put the clock back where the visitor had it.
 playTime(on){
  if(on&&!playing){guideTime=$('#time').value;$('#play').click();}
  else if(!on){if(playing)$('#play').click();if(guideTime!==null){$('#time').value=guideTime;$('#time').dispatchEvent(new Event('input',{bubbles:true}));guideTime=null;}}
 },
 showNumbers(){setDetail(true);},
 openMethod(){$('#info').showModal();},
 openReplay(){openMissionReplay();},
 // An investigation borrows the comparison panel. The visitor's own comparison comes back when it ends; if they had
 // none, the investigation's results stay on screen to look at, and are not mistaken for theirs next time.
 beginCompare(){if(guideSaved===null)guideSaved=guideOwns?[]:compared.slice();compared=[];renderComparison();},
 endCompare(){if(guideSaved?.length){compared=guideSaved;guideOwns=false;renderComparison();}else guideOwns=compared.length>0;guideSaved=null;},
 // Runs the app's ordinary comparison for the given sites, the chosen stay, and the landing date shifted by `days`, and
 // hands back the hours it computed. Nothing is calculated here.
 async compare(ids,days){
  const date=days?shiftDate($('#date').value,days):$('#date').value;if(!date)return null;
  const list=ids.map(siteById);for(const s of list)if(!addOption(s,date,!phone.matches))return null;
  const want=list.map(s=>optionId(s,date,landingHour));
  for(let i=0;i<240;i++){
   const got=want.map(w=>lastComparison.find(r=>r.option.id===w));
   if(got.every(Boolean))return {when:stamp(optionStart(got[0].option)),total:duration,rows:got.map(r=>({name:r.option.site.name,sun:r.metrics.sun,earth:r.metrics.earth,both:r.metrics.both}))};
   await new Promise(r=>setTimeout(r,250));
  }
  return null;
 },
});
$('#rail-guide').innerHTML=AVATAR;$('#rail-guide').onclick=$('#guide-open').onclick=()=>guide.open();
if(openedPlain&&guide.firstVisit())setTimeout(()=>guide.welcome(),1200);
{const p=new URLSearchParams(location.search);if(!['date','hour','t','site','compare'].some(k=>p.has(k)))$('#time').value=new Date().getUTCHours();} // nothing asked for: open on now, like the Now button
restoring=false;
updateClock();refreshMetrics();if(!selected)referenceLight();invalidate();
