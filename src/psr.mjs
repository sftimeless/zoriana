// Permanently shadowed regions (PSRs) near the south pole.
//
// The mask is NASA's LOLA map lpsr_75s_120m_201608 (LRO LOLA GDR, PDS Geosciences Node), averaged
// from 120 m to 240 m cells by scripts/prepare-psr.py. It is a south polar stereographic grid,
// 914.88 km across, covering 75°S to the pole, with 0° longitude toward the top of the image and
// 90°E to the right. NASA computed it from LOLA topography by simulating the Sun over long periods;
// this app only draws it and looks it up. North-polar and lower-latitude shadows are not included.
const RADIUS_KM=1737.4,RAD=Math.PI/180;
export const PSR={path:'/assets/psr-south-240m.png',size:3812,gridMeters:240,extentKm:914.88,northLimit:-75};

// Continuous pixel position of a place on the mask (x right, y down), or null north of the map.
export function psrPixel(lat,lon){
 if(!(lat<=PSR.northLimit))return null;
 const rho=2*RADIUS_KM*Math.tan((90+lat)*RAD/2),scale=PSR.size/PSR.extentKm,half=PSR.size/2;
 return [half+rho*Math.sin(lon*RAD)*scale,half-rho*Math.cos(lon*RAD)*scale];
}

// Reads a square window of mask values (0-255, row-major, `width` across) centred on a site.
// A cell counts as shadowed when at least half of it is. Returns whether the site's own cell is
// shadowed and the distance to the nearest shadowed cell centre, or null if none is in the window.
export function shadowNear(values,width,gridMeters=PSR.gridMeters){
 const centre=(width-1)/2;let nearest=Infinity;
 for(let y=0;y<width;y++)for(let x=0;x<width;x++)if(values[y*width+x]>=128)nearest=Math.min(nearest,Math.hypot(x-centre,y-centre));
 const inside=values[centre*width+centre]>=128;
 return {inside,share:values[centre*width+centre]/255,nearestMeters:inside?0:Number.isFinite(nearest)?nearest*gridMeters:null,reachMeters:centre*gridMeters};
}

// Adds the PSR tint to a Three.js material without disturbing shader patches already on it.
// `uniforms` must hold psrMask (texture) and psrVisible (0 or 1) and is shared between materials.
export function addPsrOverlay(material,uniforms){
 const before=material.onBeforeCompile,key=material.customProgramCacheKey;
 material.onBeforeCompile=(program,renderer)=>{
  before.call(material,program,renderer);
  Object.assign(program.uniforms,uniforms);
  program.vertexShader='varying vec3 psrDirection;\n'+program.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npsrDirection=position;');
  // South polar stereographic lookup straight from the surface direction: no trigonometry and
  // no seam. The step() keeps the tint to the area the map covers (south of 75°S).
  program.fragmentShader='varying vec3 psrDirection;\nuniform sampler2D psrMask;\nuniform float psrVisible;\n'+program.fragmentShader.replace('#include <opaque_fragment>',`
  vec3 psrUnit=normalize(psrDirection);
  vec2 psrUv=${(2*RADIUS_KM).toFixed(1)}*vec2(-psrUnit.z,psrUnit.x)/max(1.0-psrUnit.y,.5)/${PSR.extentKm.toFixed(2)}+.5;
  float psrShare=texture2D(psrMask,psrUv).r*psrVisible*step(psrUnit.y,-0.9659258);
  outgoingLight=mix(outgoingLight,outgoingLight*.3+vec3(.10,.42,1.0)*.8,psrShare*.85);
  #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=>key.call(material)+'+psr-v1';
 material.needsUpdate=true;
}
