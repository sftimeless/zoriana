// NASA's polar illumination maps: permanently shadowed regions and long-term average light.
//
// All come from the LRO LOLA team's 2016 products (PDS Geosciences Node), computed by NASA from LOLA
// topography by simulating the Sun and Earth over long periods (Mazarico et al. 2011). This app only
// draws them and looks them up. scripts/prepare-illumination.py makes the images:
//   psr-{south,north}-240m.png    share of each 240 m cell in permanent shadow
//   heat-{south,north}-480m.webp  R = average share of time some of the Sun's disc is visible,
//                                 G = the same for Earth, B = the highest Sun share inside the cell
//   slope-{south,north}-320m.webp R = mean slope of each 320 m cell, G = steepest slope in it,
//                                 in quarter-degrees, over a 160 m baseline (scripts/prepare-slope.py)
// Each is a polar stereographic grid 914.88 km across, covering 75° to the pole. In the south image
// 0° longitude points up; in the north image it points down; 90°E is to the right in both.
const RADIUS_KM=1737.4,RAD=Math.PI/180;
export const POLAR={extentKm:914.88,limit:75,
 psr:{size:3812,gridMeters:240,path:pole=>`/assets/psr-${pole}-240m.png`},
 heat:{size:1906,gridMeters:480,path:pole=>`/assets/heat-${pole}-480m.webp`},
 // Slope from the LOLA 80 m grids: a smaller square, 608 km across, covering 80° to the pole.
 slope:{size:1900,gridMeters:320,extentKm:608,path:pole=>`/assets/slope-${pole}-320m.webp`}};

export const poleOf=lat=>lat<=-POLAR.limit?'south':lat>=POLAR.limit?'north':null;

// Continuous pixel position (x right, y down) of a place on a polar grid `size` pixels across,
// or null outside the polar maps.
export function polarPixel(lat,lon,size){
 const pole=poleOf(lat);if(!pole)return null;
 const rho=2*RADIUS_KM*Math.tan((90-Math.abs(lat))*RAD/2)*size/POLAR.extentKm,half=size/2;
 return {pole,x:half+rho*Math.sin(lon*RAD),y:half+(pole==='south'?-1:1)*rho*Math.cos(lon*RAD)};
}
// The reverse: latitude and east longitude of a pixel position.
export function polarLatLon(pole,x,y,size){
 const dx=x-size/2,dy=y-size/2,rho=Math.hypot(dx,dy)*POLAR.extentKm/size;
 const lat=(90-2*Math.atan(rho/(2*RADIUS_KM))/RAD)*(pole==='south'?-1:1);
 return {lat,lon:rho?Math.atan2(dx,pole==='south'?-dy:dy)/RAD:0};
}

// Reads a square window of shadow-mask values (0-255, row-major, `width` across) centred on a site.
// A cell counts as shadowed when at least half of it is. Returns whether the site's own cell is
// shadowed and the distance to the nearest shadowed cell centre, or null if none is in the window.
export function shadowNear(values,width,gridMeters=POLAR.psr.gridMeters){
 const centre=(width-1)/2;let nearest=Infinity;
 for(let y=0;y<width;y++)for(let x=0;x<width;x++)if(values[y*width+x]>=128)nearest=Math.min(nearest,Math.hypot(x-centre,y-centre));
 const inside=values[centre*width+centre]>=128;
 return {inside,share:values[centre*width+centre]/255,nearestMeters:inside?0:Number.isFinite(nearest)?nearest*gridMeters:null,reachMeters:centre*gridMeters};
}

// Finds the most promising cell near a site in a square window of heat-map pixels (RGBA bytes,
// `width` across, site at the centre). The score is average Sun share times average Earth share:
// a rough guide to "power and a link at once", not a measured overlap. Cells farther than
// `radius` cells are ignored; ties go to the nearer cell. Returns null when nothing scores.
export function bestCell(rgba,width,radius=(width-1)/2){
 const centre=(width-1)/2;let best=null;
 for(let y=0;y<width;y++)for(let x=0;x<width;x++){
  const distance=Math.hypot(x-centre,y-centre);if(distance>radius)continue;
  const i=(y*width+x)*4,sun=rgba[i]/255,earth=rgba[i+1]/255,score=sun*earth;
  if(score>0&&(!best||score>best.score+1e-9||(Math.abs(score-best.score)<=1e-9&&distance<best.distance)))best={dx:x-centre,dy:y-centre,distance,sun,earth,peakSun:rgba[i+2]/255,score};
 }
 return best;
}

// The `count` best-scoring cells within `radius` cells of the centre, kept at least `separation`
// cells apart so they are genuinely different places. Best first. Used to pick candidates that
// are then checked for the chosen dates.
export function topCells(rgba,width,radius=(width-1)/2,count=6,separation=4){
 const centre=(width-1)/2,cells=[];
 for(let y=0;y<width;y++)for(let x=0;x<width;x++){
  const distance=Math.hypot(x-centre,y-centre);if(distance>radius)continue;
  const i=(y*width+x)*4,sun=rgba[i]/255,earth=rgba[i+1]/255;
  if(sun*earth>0)cells.push({dx:x-centre,dy:y-centre,distance,sun,earth,peakSun:rgba[i+2]/255,score:sun*earth});
 }
 cells.sort((a,b)=>b.score-a.score||a.distance-b.distance);
 const picked=[];
 for(const cell of cells){
  if(picked.length>=count)break;
  if(picked.every(p=>Math.hypot(p.dx-cell.dx,p.dy-cell.dy)>=separation))picked.push(cell);
 }
 return picked;
}

// Heat-map modes: which value is drawn, in which colour, and the range over which it fades in.
// The ranges span what the 480 m maps actually hold: ordinary polar ground is sunlit about 40% of
// the time and the best cells about 50%, so shadowed ground stays clear and good ground glows.
export const HEAT={
 sun:{code:1,label:'Average sunlight',color:'#ffd60a',from:.15,to:.55},
 earth:{code:2,label:'Average Earth view',color:'#4da3ff',from:.10,to:.90},
 both:{code:3,label:'Sun × Earth score',color:'#30d158',from:.08,to:.48},
 // Slope is a caution layer rather than a score: amber from `from` degrees, red from `to` degrees.
 slope:{code:4,label:'Slope',color:'#ff453a',from:5,to:10}
};

// Adds both overlays to a Three.js material without disturbing shader patches already on it.
// `uniforms` holds psrSouth, psrNorth, heatSouth, heatNorth, slopeSouth, slopeNorth (textures), psrVisible (0 or 1),
// heatMode (0 off, or a HEAT code) and earthDirection (unit vector from the Moon's centre toward
// Earth in Moon-fixed coordinates), and is shared between materials.
export function addPolarOverlay(material,uniforms){
 const before=material.onBeforeCompile,key=material.customProgramCacheKey;
 const scale=(2*RADIUS_KM/POLAR.extentKm).toFixed(6),rgb=hex=>`vec3(${[1,3,5].map(i=>(parseInt(hex.slice(i,i+2),16)/255).toFixed(3)).join(',')})`;
 material.onBeforeCompile=(program,renderer)=>{
  before.call(material,program,renderer);
  Object.assign(program.uniforms,uniforms);
  program.vertexShader='varying vec3 polarDirection;\n'+program.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npolarDirection=position;');
  // Polar stereographic lookups straight from the surface direction: no trigonometry and no seam.
  // Both poles are sampled and one is chosen, so texture filtering never sees a branch.
  program.fragmentShader='varying vec3 polarDirection;\nuniform sampler2D psrSouth;\nuniform sampler2D psrNorth;\nuniform sampler2D heatSouth;\nuniform sampler2D heatNorth;\nuniform sampler2D slopeSouth;\nuniform sampler2D slopeNorth;\nuniform float psrVisible;\nuniform float heatMode;\nuniform vec3 earthDirection;\n'+program.fragmentShader.replace('#include <opaque_fragment>',`
  vec3 polarUnit=normalize(polarDirection);
  float polarNorth=step(0.0,polarUnit.y),polarInside=step(0.9659258,abs(polarUnit.y)),layerOn=step(.5,heatMode),heatOn=layerOn*(1.0-step(3.5,heatMode));
  // NASA's maps stop at 75° latitude. The heat map fades in over the next five degrees rather than
  // ending on a hard circle, which read as a disc pasted on the Moon.
  float heatFade=smoothstep(0.9659258,0.9848078,abs(polarUnit.y));
  vec2 polarS=${scale}*vec2(-polarUnit.z,polarUnit.x)/max(1.0-polarUnit.y,.5)+.5;
  vec2 polarN=${scale}*vec2(-polarUnit.z,-polarUnit.x)/max(1.0+polarUnit.y,.5)+.5;
  float psrShare=mix(texture2D(psrSouth,polarS).r,texture2D(psrNorth,polarN).r,polarNorth)*psrVisible*polarInside*(1.0-layerOn);
  outgoingLight=mix(outgoingLight,outgoingLight*.5+vec3(.10,.42,1.0)*.5,psrShare*.8);
  vec3 heat=mix(texture2D(heatSouth,polarS).rgb,texture2D(heatNorth,polarN).rgb,polarNorth);
  float heatValue=heatMode<1.5?heat.r:heatMode<2.5?heat.g:heat.r*heat.g;
  vec3 heatColor=heatMode<1.5?${rgb(HEAT.sun.color)}:heatMode<2.5?${rgb(HEAT.earth.color)}:${rgb(HEAT.both.color)};
  vec2 heatRange=heatMode<1.5?vec2(${HEAT.sun.from},${HEAT.sun.to}):heatMode<2.5?vec2(${HEAT.earth.from},${HEAT.earth.to}):vec2(${HEAT.both.from},${HEAT.both.to});
  float heatShare=smoothstep(heatRange.x,heatRange.y,heatValue)*heatFade*heatOn;
  outgoingLight=mix(outgoingLight,outgoingLight*.5+heatColor*.55,heatShare*.62);
  // Earth view outside the polar maps is plain geometry: a blue wash where Earth is above level
  // ground at the selected time, and a brighter band within about 8° of the edge of the mean
  // near side (the x axis points at the mean Earth), where libration makes Earth rise and set.
  float earthNow=smoothstep(-.01,.03,dot(polarUnit,earthDirection))*step(.5,length(earthDirection));
  float earthBand=1.0-smoothstep(.125,.15,abs(polarUnit.x));
  float earthShare=(earthNow*.34+earthBand*.3)*(1.0-heatFade)*step(1.5,heatMode)*(1.0-step(2.5,heatMode));
  outgoingLight=mix(outgoingLight,outgoingLight*.45+heatColor*.6,earthShare);
  // Slope layer (mode 4): amber where the 320 m cell averages 5° to 10°, red above 10°. Its
  // square is 608 km across, so the same projection is rescaled; it fades in just inside 80°.
  vec2 slopeUv=mix((polarS-.5)*${(POLAR.extentKm/POLAR.slope.extentKm).toFixed(6)}+.5,(polarN-.5)*${(POLAR.extentKm/POLAR.slope.extentKm).toFixed(6)}+.5,polarNorth);
  float slopeDegrees=mix(texture2D(slopeSouth,slopeUv).r,texture2D(slopeNorth,slopeUv).r,polarNorth)*63.75;
  vec3 slopeColor=mix(vec3(1.0,.72,.1),vec3(1.0,.2,.15),smoothstep(${(HEAT.slope.to-1).toFixed(1)},${(HEAT.slope.to+1).toFixed(1)},slopeDegrees));
  // Amber is drawn lightly and red more strongly, and the layer fades out between 84° and 80°
  // latitude so its edge does not read as a disc.
  float slopeShare=(smoothstep(${(HEAT.slope.from-1).toFixed(1)},${(HEAT.slope.from+1).toFixed(1)},slopeDegrees)*.34+smoothstep(${(HEAT.slope.to-1).toFixed(1)},${(HEAT.slope.to+1).toFixed(1)},slopeDegrees)*.3)*smoothstep(0.9848078,0.9945219,abs(polarUnit.y))*step(3.5,heatMode);
  outgoingLight=mix(outgoingLight,outgoingLight*.45+slopeColor*.6,slopeShare);
  #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=>key.call(material)+'+polar-v6';
 material.needsUpdate=true;
}
