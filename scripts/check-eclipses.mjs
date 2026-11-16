// Checks the app's eclipse calculation against NASA's list of lunar eclipses.
// For each listed eclipse and each of three sites, asks the server for the site's Sun and Earth
// positions around the date and reports what src/eclipse.mjs finds there: nothing, a partial
// eclipse (with the largest share of the Sun covered) or a total one, and how far the middle of
// the eclipse at that site (mid-totality, or the moment of greatest coverage) is from NASA's time
// of greatest eclipse for the Moon as a whole.
// Needs the server running: node scripts/check-eclipses.mjs [last year, default 2030]
import {writeFile} from 'node:fs/promises';
import {eclipseSeries,eclipseEvents} from '../src/eclipse.mjs';
import {LUNAR_ECLIPSES} from '../src/eclipse-catalog.mjs';
const base=process.env.ZORIANA_URL||'http://127.0.0.1:4174',lastYear=Number(process.argv[2]||2030),DAY=86400000;
const sites=[['Apollo 11',0.67416,23.47314],['South pole point',-89.5,0],['North pole point',89.3,125]];
const hm=t=>new Date(t).toISOString().slice(11,16),rows=[];
for(const e of LUNAR_ECLIPSES.filter(e=>Number(e.date.slice(0,4))<=lastYear)){
 const row={date:e.date,nasaGreatestTD:e.greatest,kind:e.kind,sites:{}};
 for(const [name,lat,lon] of sites){
  const date=new Date(e.time-2*DAY).toISOString().slice(0,10);
  const d=await fetch(`${base}/api/ephemeris?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}&date=${date}&reference=0`).then(r=>r.json());
  if(d.error)throw new Error(`${e.date} ${name}: ${d.error}`);
  const found=eclipseEvents(eclipseSeries(d.sun,d.earth)).find(x=>Math.abs(x.peak-e.time)<DAY);
  const middle=found&&(found.totalStart!==null?(found.totalStart+found.totalEnd)/2:found.peak);
  row.sites[name]=found?{start:hm(found.start),end:hm(found.end),middle:hm(middle),middleMinusNasaMinutes:Math.round((middle-e.time)/60000),maxCoverage:+found.maxCoverage.toFixed(3),total:found.totalStart!==null?[hm(found.totalStart),hm(found.totalEnd)]:null}:null;
 }
 rows.push(row);
 console.log(e.date,e.kind.padEnd(9),e.greatest,'|',sites.map(([n])=>{const s=row.sites[n];return `${n}: ${s?(s.total?`total ${s.total[0]}–${s.total[1]}`:`partial ${(s.maxCoverage*100).toFixed(0)}%`)+` (${s.start}–${s.end}, middle ${s.middleMinusNasaMinutes>=0?'+':''}${s.middleMinusNasaMinutes} min)`:'none'}`;}).join(' | '));
}
// What each kind of eclipse must look like from the Moon, checked for every row.
const problems=[];
for(const r of rows){
 const seen=Object.values(r.sites);
 if(r.kind==='Total'&&!seen.every(s=>s?.total))problems.push(`${r.date}: a total lunar eclipse should hide the Sun completely at every site`);
 if(r.kind==='Partial'&&!seen.every(Boolean))problems.push(`${r.date}: a partial lunar eclipse should touch every site`);
 if(r.kind==='Penumbral'&&seen.some(s=>s?.total))problems.push(`${r.date}: a penumbral lunar eclipse should not hide the Sun completely anywhere`);
 for(const s of seen)if(s&&Math.abs(s.middleMinusNasaMinutes)>25)problems.push(`${r.date}: a site's eclipse is centered ${s.middleMinusNasaMinutes} min from NASA's time`);
}
console.log(problems.length?problems.join('\n'):`All ${rows.length} eclipses are consistent with NASA's list.`);
await writeFile(new URL('../data/eclipse-check.json',import.meta.url),JSON.stringify({generated:new Date().toISOString(),source:'https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html',note:'Site times are UTC to the nearest five minutes; NASA times are Terrestrial Dynamical Time, about 70 s ahead of UTC.',problems,rows},null,1)+'\n');
