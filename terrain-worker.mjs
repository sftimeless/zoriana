import { parentPort } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
import {bilinear,globalPixel,southPixel,southPolarPixel,northPolarPixel,computeHorizon,slopeAt} from './src/terrain-math.mjs';
const root=new URL('./data/',import.meta.url);
const [g,p]=await Promise.all([readFile(new URL('global-height.i16',root)),readFile(new URL('ldem_85s_40m.img',root))]);
const globalGrid=new Int16Array(g.buffer,g.byteOffset,g.byteLength/2),polarGrid=new Int16Array(p.buffer,p.byteOffset,p.byteLength/2);
if(globalGrid.length!==5760*2880||polarGrid.length!==7584*7584)throw new Error('Invalid terrain grid size.');
// Optional wider grid: LOLA LDEM_80S_80M covers 80°S to the pole at 80 m. Without it the
// 80–85°S band falls back to the global grid, exactly as before.
let wideGrid=null;
try{const w=await readFile(new URL('lola_80s_80m/ldem_80s_80m.img',root));if(w.byteLength===7600*7600*2)wideGrid=new Int16Array(w.buffer,w.byteOffset,w.byteLength/2);}catch{}
// Optional north-polar grid: LOLA LDEM_80N_80M covers 80°N to the pole at 80 m.
let northGrid=null;
try{const w=await readFile(new URL('lola_80n_80m/ldem_80n_80m.img',root));if(w.byteLength===7600*7600*2)northGrid=new Int16Array(w.buffer,w.byteOffset,w.byteLength/2);}catch{}
function sample(lat,lon){
 if(northGrid&&lat>=80){const [x,y]=northPolarPixel(lat,lon,80,3799.5),height=bilinear(northGrid,7600,7600,x,y);if(height!==null)return {height,resolution:80};}
 if(lat<=-85){const [x,y]=southPixel(lat,lon),height=bilinear(polarGrid,7584,7584,x,y);if(height!==null)return {height,resolution:40};}
 if(wideGrid&&lat<=-80){const [x,y]=southPolarPixel(lat,lon,80,3799.5),height=bilinear(wideGrid,7600,7600,x,y);if(height!==null)return {height,resolution:80};}
 const [x,y]=globalPixel(lat,lon),height=bilinear(globalGrid,5760,2880,x,y,true);
 return height===null?null:{height,resolution:1895.21};
}
const sources={40:'NASA LOLA · 40 m south-pole grid',80:'NASA LOLA · 80 m south-polar grid'};
parentPort.on('message',({id,lat,lon})=>{try{const start=performance.now();const profile=computeHorizon(lat,lon,sample);
 // One grid cell either side of the site, so the slope reflects the finest scale the local grid resolves.
 profile.slopeBaselineMeters=Math.round(2*profile.localResolutionMeters);profile.slopeDegrees=slopeAt(lat,lon,sample,2*profile.localResolutionMeters);
 profile.computeMs=Math.round(performance.now()-start);profile.source=(lat>=80&&profile.localResolutionMeters===80?'NASA LOLA · 80 m north-polar grid':sources[profile.localResolutionMeters])||'NASA LOLA · 1.9 km global grid';
 profile.model=`Curved Moon, DEM elevation + 2 m observer, 0.25° azimuth sampling, 300 km range. 40 m south of 85°S; ${wideGrid?'80 m from 80°S to 85°S; ':''}${northGrid?'80 m north of 80°N; ':''}1.9 km global background.`;
 parentPort.postMessage({id,profile});}catch(e){parentPort.postMessage({id,error:e.message});}});
