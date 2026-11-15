// Do the app's windows depend on how finely it samples? Three repeatable checks.
//  1. Time step: stay totals and the next rise or set, tested every 15, 5, 2 and 1 minutes.
//  2. Skyline step: the same with the skyline thinned from every 0.25° to every 0.5°, 1° and 2°.
//     (0.25° is the finest the server traces, so this shows the trend, not the limit.)
//  3. Hourly positions: the app's interpolation between hourly JPL rows against JPL asked
//     directly every 10 minutes, using the request the server reports in its answer.
// Needs the server running: node scripts/check-convergence.mjs   (ZORIANA_URL to point elsewhere)
import {writeFile} from 'node:fs/promises';
import {clearanceSeries} from '../src/terrain-math.mjs';
import {nextCrossing,visibleHours,parseHorizons,sampleAt} from '../src/ephemeris.mjs';
const base=process.env.ZORIANA_URL||'http://127.0.0.1:4174',iso=t=>new Date(t).toISOString().slice(0,16)+'Z';
const get=(lat,lon,date)=>fetch(`${base}/api/ephemeris?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}&date=${date}&reference=0`).then(r=>r.json());
async function site(name,lat,lon,date,from,hours){
 const d=await get(lat,lon,date);if(d.error)throw new Error(d.error);
 const start=Date.parse(from),end=start+hours*3600000;
 const run=(profile,step)=>Object.fromEntries([['sun',d.sun],['earth',d.earth]].map(([body,rows])=>{const s=clearanceSeries(rows,profile,step),c=nextCrossing(s,start);return [body,{visibleHours:+visibleHours(s,start,end).toFixed(2),nextChange:c?`${iso(c.time)} ${c.rising?'rise':'set'}`:null}];}));
 const thin=k=>({...d.terrain,angles:d.terrain.angles.filter((_,i)=>i%k===0),distances:d.terrain.distances.filter((_,i)=>i%k===0),stepDegrees:d.terrain.stepDegrees*k});
 return {name,lat,lon,from,hours,terrain:d.terrain.source,version:d.version,
  timeStepMinutes:Object.fromEntries([15,5,2,1].map(step=>[step,run(d.terrain,step)])),
  skylineStepDegrees:Object.fromEntries([1,2,4,8].map(k=>[d.terrain.stepDegrees*k,run(thin(k),5)])),data:d};
}
const sites=[];
sites.push(await site('IM-4 point',-84.6,31,'2026-11-15','2026-11-15T12:00Z',72));
sites.push(await site('Blue Moon Pathfinder 1 point',-89.45,-137.31,'2026-11-15','2026-11-15T12:00Z',72));
sites.push(await site('Apollo 11',0.67416,23.47314,'2026-11-15','2026-11-15T12:00Z',360));
// Largest spread of any total across the time steps: zero means the time step does not matter.
const spread=s=>Math.max(...['sun','earth'].map(b=>{const v=Object.values(s.timeStepMinutes).map(x=>x[b].visibleHours);return Math.max(...v)-Math.min(...v);}));
const d=sites[0].data,r=d.request;
const params={format:'json',COMMAND:"'10'",EPHEM_TYPE:"'OBSERVER'",CENTER:`'${r.center}'`,COORD_TYPE:`'${r.coordType}'`,SITE_COORD:`'${r.siteCoord}'`,START_TIME:"'2026-11-17 06:00'",STOP_TIME:"'2026-11-17 18:00'",STEP_SIZE:"'10 m'",QUANTITIES:"'4,20'",RANGE_UNITS:"'KM'",CSV_FORMAT:"'YES'",CAL_FORMAT:"'JD'",OBJ_DATA:"'NO'",APPARENT:`'${r.apparent}'`};
const reply=await fetch(`${r.service}?${new URLSearchParams(params)}`).then(x=>x.json());
const fine=parseHorizons(reply.result);let elevation=0,azimuth=0;
for(const f of fine){const s=sampleAt(d.sun,f.time);elevation=Math.max(elevation,Math.abs(s.el-f.el));azimuth=Math.max(azimuth,Math.abs(((s.az-f.az+540)%360)-180));}
const result={generated:new Date().toISOString(),server:base,
 sites:sites.map(({data,...s})=>({...s,largestDifferenceAcrossTimeStepsHours:+spread(s).toFixed(2)})),
 hourlyInterpolation:{site:'IM-4 point',body:'Sun',against:'JPL Horizons every 10 minutes, 2026-11-17 06:00 to 18:00 UT',samples:fine.length,largestElevationDifferenceDeg:+elevation.toFixed(5),largestAzimuthDifferenceDeg:+azimuth.toFixed(5),ephemeris:(reply.result.match(/\{source:\s*([^}]+)\}/)||[])[1]||null}};
for(const s of result.sites){console.log(`\n${s.name} (${s.terrain}), ${s.hours} h from ${s.from}`);
 for(const [k,v] of Object.entries(s.timeStepMinutes))console.log(`  every ${String(k).padStart(2)} min     Sun ${v.sun.visibleHours} h, ${v.sun.nextChange??'no change'} · Earth ${v.earth.visibleHours} h, ${v.earth.nextChange??'no change'}`);
 for(const [k,v] of Object.entries(s.skylineStepDegrees))console.log(`  skyline ${String(k).padEnd(4)}°   Sun ${v.sun.visibleHours} h, ${v.sun.nextChange??'no change'} · Earth ${v.earth.visibleHours} h, ${v.earth.nextChange??'no change'}`);}
console.log(`\nHourly interpolation against JPL every 10 min: elevation within ${result.hourlyInterpolation.largestElevationDifferenceDeg}°, azimuth within ${result.hourlyInterpolation.largestAzimuthDifferenceDeg}° (${fine.length} samples, ${result.hourlyInterpolation.ephemeris})`);
await writeFile(new URL('../data/convergence-check.json',import.meta.url),JSON.stringify(result,null,1)+'\n');
if(result.sites.some(s=>s.largestDifferenceAcrossTimeStepsHours>.05)||elevation>.001){console.error('Convergence check failed.');process.exit(1);}
