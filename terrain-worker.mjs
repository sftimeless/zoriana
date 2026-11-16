import { parentPort } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
import { openSync, readSync } from 'node:fs';
import {bilinear,globalPixel,southPixel,southPolarPixel,northPolarPixel,computeHorizon,slopeAt} from './src/terrain-math.mjs';
import { patchFrame, patchDirection, directionToCoordinates } from './src/patch-grid.mjs';
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
// Optional finer global grid: LOLA LDEM_64, 64 pixels per degree (about 474 m), 23040 x 11520,
// longitude 0° to 360° from the left, latitude 90° to -90° from the top. At 530 MB it is too big
// to hold in memory beside the polar grids, so only the window around the site being worked on is
// read from disk: 11° of latitude either side (the horizon reaches 300 km, about 10°) and the
// matching span of longitude.
const FINE={pixelsPerDegree:64,width:23040,height:11520,meters:474,fd:null,window:null};
try{FINE.fd=openSync(new URL('lola_global_64/ldem_64.img',root),'r');}catch{}
function loadFineWindow(lat,lon){
 FINE.window=null;if(FINE.fd===null||Math.abs(lat)>84)return;            // near the poles the polar grids already cover the view
 const ppd=FINE.pixelsPerDegree,reach=11,lonReach=Math.min(180,reach/Math.max(.05,Math.cos(lat*Math.PI/180)));
 const row0=Math.max(0,Math.floor((90-Math.min(90,lat+reach))*ppd)),row1=Math.min(FINE.height,Math.ceil((90-Math.max(-90,lat-reach))*ppd));
 const east=((lon%360)+360)%360,cols=Math.min(FINE.width,Math.ceil(2*lonReach*ppd)),col0=((Math.floor((east-lonReach)*ppd)%FINE.width)+FINE.width)%FINE.width;
 const rows=row1-row0,data=new Int16Array(rows*cols),bytes=Buffer.from(data.buffer),first=Math.min(cols,FINE.width-col0);
 for(let r=0;r<rows;r++){
  const offset=r*cols*2,position=((row0+r)*FINE.width+col0)*2;
  readSync(FINE.fd,bytes,offset,first*2,position);
  if(first<cols)readSync(FINE.fd,bytes,offset+first*2,(cols-first)*2,(row0+r)*FINE.width*2); // the window wraps past 360°
 }
 FINE.window={row0,rows,col0,cols,data};
}
function fineSample(lat,lon){
 const w=FINE.window;if(!w)return null;
 const y=(90-lat)*FINE.pixelsPerDegree-.5-w.row0;let x=(((lon%360)+360)%360)*FINE.pixelsPerDegree-.5-w.col0;x=((x%FINE.width)+FINE.width)%FINE.width;
 return bilinear(w.data,w.cols,w.rows,x,y);
}
function sample(lat,lon){
 if(northGrid&&lat>=80){const [x,y]=northPolarPixel(lat,lon,80,3799.5),height=bilinear(northGrid,7600,7600,x,y);if(height!==null)return {height,resolution:80};}
 if(lat<=-85){const [x,y]=southPixel(lat,lon),height=bilinear(polarGrid,7584,7584,x,y);if(height!==null)return {height,resolution:40};}
 if(wideGrid&&lat<=-80){const [x,y]=southPolarPixel(lat,lon,80,3799.5),height=bilinear(wideGrid,7600,7600,x,y);if(height!==null)return {height,resolution:80};}
 const fine=fineSample(lat,lon);if(fine!==null)return {height:fine,resolution:FINE.meters};
 const [x,y]=globalPixel(lat,lon),height=bilinear(globalGrid,5760,2880,x,y,true);
 return height===null?null:{height,resolution:1895.21};
}
const sources={40:'NASA LOLA · 40 m south-pole grid',80:'NASA LOLA · 80 m south-polar grid',474:'NASA LOLA · 474 m global grid'};
// Heights in meters on the Landing view's grid around a site, each read from the finest grid that covers it.
function patch(lat,lon,n,halfKm){
 loadFineWindow(lat,lon);
 const frame=patchFrame(lat,lon),heights=new Int16Array(n*n),v=[0,0,0],counts={};
 for(let j=0,k=0;j<n;j++)for(let i=0;i<n;i++,k++){
  const [la,lo]=directionToCoordinates(patchDirection(frame,i,j,n,halfKm,v)),s=sample(la,lo);
  heights[k]=s?Math.round(s.height):0;if(s)counts[s.resolution]=(counts[s.resolution]||0)+1;
 }
 FINE.window=null;
 const finest=Math.min(...Object.keys(counts).map(Number));
 return {n,halfKm,heights,spacingMeters:Math.round(2*halfKm*1000/(n-1)),finestGridMeters:Number.isFinite(finest)?Math.round(finest):null,
  shares:Object.fromEntries(Object.entries(counts).map(([r,c])=>[r,c/(n*n)]))};
}
parentPort.on('message',({id,lat,lon,patch:wanted})=>{try{if(wanted){const result=patch(lat,lon,wanted.n,wanted.halfKm);parentPort.postMessage({id,patch:result},[result.heights.buffer]);return;}
 const start=performance.now();loadFineWindow(lat,lon);const profile=computeHorizon(lat,lon,sample);
 // One grid cell either side of the site, so the slope reflects the finest scale the local grid resolves.
 profile.slopeBaselineMeters=Math.round(2*profile.localResolutionMeters);profile.slopeDegrees=slopeAt(lat,lon,sample,2*profile.localResolutionMeters);
 profile.computeMs=Math.round(performance.now()-start);profile.source=(lat>=80&&profile.localResolutionMeters===80?'NASA LOLA · 80 m north-polar grid':sources[profile.localResolutionMeters])||'NASA LOLA · 1.9 km global grid';
 profile.model=`Curved Moon, DEM elevation + 2 m observer, 0.25° azimuth sampling, 300 km range. 40 m south of 85°S; ${wideGrid?'80 m from 80°S to 85°S; ':''}${northGrid?'80 m north of 80°N; ':''}${FINE.fd!==null?'474 m elsewhere within 84° of the equator; ':''}1.9 km global background.`;
 FINE.window=null;
 parentPort.postMessage({id,profile});}catch(e){parentPort.postMessage({id,error:e.message});}});
