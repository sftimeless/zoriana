// Compares this app's own terrain-and-ephemeris calculation with NASA's long-term LOLA
// average-visibility maps at a handful of polar points.
//
// NASA's maps (AVGVISIB_75S/75N and their _EARTH versions, 120 m pixels) give the share of time
// that any part of the Sun's or Earth's disc is visible, from a long simulation over LOLA terrain
// (Mazarico et al. 2011). Here the app is asked for the same quantity (any part of the disc above
// its own terrain skyline) over 347 days, about one cycle of lunar seasons, starting 2026-01-01.
// The two use different terrain grids, observer heights and periods, so close agreement is the
// most that can be expected; the point is to measure how far apart they are.
//
// Needs the server running and the NASA files in data/: node scripts/validate-illumination.mjs
import {open,writeFile} from 'node:fs/promises';
import {discSeries,SUN_RADIUS_KM,EARTH_RADIUS_KM} from '../src/disc.mjs';
import {clearanceSeries} from '../src/terrain-math.mjs';

const base=process.env.ZORIANA_URL||'http://127.0.0.1:4174',DAY=86400000,RAD=Math.PI/180;
const DAYS=347,WINDOW=30,START=Date.UTC(2026,0,1);
const points=[
 ['Shackleton region',-89.5,0],['Blue Moon Pathfinder 1 point',-89.45,-137.31],['Best spot near Shackleton',-89.7475,57.8043],
 ['Malapert region',-85.95,0],['Griffin Mission One point',-85.28,53.27],['IM-2 Athena',-84.7906,29.1957],['IM-4 point',-84.6,31],['IM-1 Odysseus',-80.13,1.44],
 ['North pole rim point',89.3,125],['North 86°N 30°E',86,30]
];

// NASA's value at a place, and the lowest and highest among the nine pixels around it.
async function nasa(lat,lon,earth){
 const pole=lat<0?'s':'n',dir=new URL('../data/lola_illumination/',import.meta.url);
 const file=await open(new URL(`avgvisib_75${pole}_120m_201608${earth?'_earth':''}.img`,dir));
 const rho=2*1737.4*Math.tan((90-Math.abs(lat))*RAD/2)/.12,px=Math.floor(3812+rho*Math.sin(lon*RAD)),py=Math.floor(3812+(lat<0?-1:1)*rho*Math.cos(lon*RAD));
 const values=[];
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const b=Buffer.alloc(2);await file.read(b,0,2,((py+dy)*7624+px+dx)*2);values.push(b.readInt16LE(0)*4e-5);}
 await file.close();
 return {value:values[4],low:Math.min(...values),high:Math.max(...values)};
}

const rows=[];
for(const [name,lat,lon] of points){
 let any={sun:0,earth:0},center={sun:0,earth:0},total=0,source='';
 for(let from=0;from<DAYS;from+=WINDOW){
  const date=new Date(START+from*DAY).toISOString().slice(0,10),span=Math.min(WINDOW,DAYS-from)*DAY;
  const d=await fetch(`${base}/api/ephemeris?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}&date=${date}&reference=0`).then(r=>r.json());
  if(d.error)throw new Error(`${name} ${date}: ${d.error}`);
  source=d.terrain.source;const t0=d.sun[0].time,t1=t0+span;
  for(const [body,radius] of [['sun',SUN_RADIUS_KM],['earth',EARTH_RADIUS_KM]]){
   const disc=discSeries(d[body],d.terrain,radius).filter(s=>s.time>=t0&&s.time<t1),mid=clearanceSeries(d[body],d.terrain).filter(s=>s.time>=t0&&s.time<t1);
   any[body]+=disc.filter(s=>s.fraction>.001).length;center[body]+=mid.filter(s=>s.el>0).length;
   if(body==='sun')total+=disc.length;
  }
 }
 const row={name,lat,lon,terrain:source,days:DAYS};
 for(const body of ['sun','earth']){
  const n=await nasa(lat,lon,body==='earth'),app=any[body]/total;
  row[body]={app:+app.toFixed(3),appCenterOnly:+(center[body]/total).toFixed(3),nasa:+n.value.toFixed(3),nasaNeighbors:[+n.low.toFixed(3),+n.high.toFixed(3)],difference:+(app-n.value).toFixed(3)};
 }
 rows.push(row);
 console.log(name.padEnd(30),`Sun app ${(row.sun.app*100).toFixed(1).padStart(5)}%  NASA ${(row.sun.nasa*100).toFixed(1).padStart(5)}%  (${(row.sun.nasaNeighbors[0]*100).toFixed(0)}–${(row.sun.nasaNeighbors[1]*100).toFixed(0)})   Earth app ${(row.earth.app*100).toFixed(1).padStart(5)}%  NASA ${(row.earth.nasa*100).toFixed(1).padStart(5)}%  (${(row.earth.nasaNeighbors[0]*100).toFixed(0)}–${(row.earth.nasaNeighbors[1]*100).toFixed(0)})   ${source}`);
}
const stats=body=>{const d=rows.map(r=>Math.abs(r[body].difference));return {meanAbsoluteDifference:+(d.reduce((a,b)=>a+b)/d.length).toFixed(3),largestDifference:+Math.max(...d).toFixed(3)};};
const summary={points:rows.length,days:DAYS,from:'2026-01-01',sun:stats('sun'),earth:stats('earth')};
console.log(JSON.stringify(summary));
await writeFile(new URL('../data/validation-illumination.json',import.meta.url),JSON.stringify({generated:new Date().toISOString(),note:'App: share of 5-minute samples with any part of the disc above the app\'s terrain skyline, over 347 days from 2026-01-01. NASA: AVGVISIB 120 m pixel at the same place, with the range of its eight neighbors.',summary,rows},null,1)+'\n');
