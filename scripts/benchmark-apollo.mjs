// Compares this app's Sun angles with NASA's published values for the six Apollo landings.
// Published values: Apollo Lunar Surface Journal, "Working on the Moon: Thermal Environment",
// table "Solar Phase Angles during the Apollo Lunar Stays" (elevation and azimuth at landing and
// at the end of the last EVA, times to the minute, values to 0.1°).
// https://www.nasa.gov/wp-content/uploads/static/history/alsj/WOTM/WOTM-ThermalEnvrnmnt.html
// Needs the app's server running: node scripts/benchmark-apollo.mjs
import {writeFile} from 'node:fs/promises';
import {sampleAt,nextCrossing,skyDirection} from '../src/ephemeris.mjs';
// Where on the Moon the Sun is overhead, worked back from a Sun azimuth and elevation at a site.
const DEG=180/Math.PI,subSolar=(lat,lon,az,el)=>{const v=skyDirection(lat,lon,az,el);return {lat:+(Math.asin(v[1])*DEG).toFixed(2),lon:+(Math.atan2(-v[2],v[0])*DEG).toFixed(2)};};
const cases=[
 {mission:'Apollo 11',lat:0.67416,lon:23.47314,sunrise:'1969-07-20T00:06Z',landing:['1969-07-20T20:18Z',10.3,88.1],lastEva:['1969-07-21T05:12Z',14.8,88.2]},
 {mission:'Apollo 12',lat:-3.0128,lon:-23.4219,sunrise:'1969-11-18T21:37Z',landing:['1969-11-19T06:55Z',4.7,90.4],lastEva:['1969-11-20T07:44Z',17.3,89.8]},
 {mission:'Apollo 14',lat:-3.64589,lon:-17.47194,sunrise:'1971-02-04T13:28Z',landing:['1971-02-05T09:18Z',10.0,91.4],lastEva:['1971-02-06T12:44Z',23.9,90.5]},
 {mission:'Apollo 15',lat:26.13239,lon:3.6333,sunrise:'1971-07-29T19:04Z',landing:['1971-07-30T22:16Z',12.4,93.9],lastEva:['1971-08-02T13:42Z',40.6,111.7]},
 {mission:'Apollo 16',lat:-8.9734,lon:15.5011,sunrise:'1972-04-19T21:20Z',landing:['1972-04-21T02:24Z',14.6,87.9],lastEva:['1972-04-23T21:06Z',47.9,80.1]},
 {mission:'Apollo 17',lat:20.1911,lon:30.7723,sunrise:'1972-12-10T17:03Z',landing:['1972-12-11T19:55Z',12.8,96.3],lastEva:['1972-12-14T05:41Z',39.5,109.7]}
];
const base=process.env.ZORIANA_URL||'http://127.0.0.1:4174',rows=[];
for(const c of cases){
 const date=new Date(Date.parse(c.sunrise)-86400000).toISOString().slice(0,10); // start the series a day before local sunrise
 const d=await fetch(`${base}/api/ephemeris?lat=${c.lat}&lon=${c.lon}&date=${date}&reference=0`).then(r=>r.json());
 if(d.error)throw new Error(`${c.mission}: ${d.error}`);
 for(const [event,[iso,elevation,azimuth]] of [['landing',c.landing],['end of last EVA',c.lastEva]]){
  const s=sampleAt(d.sun,Date.parse(iso));
  rows.push({mission:c.mission,event,utc:iso,published:{elevation,azimuth},app:{elevation:+s.el.toFixed(2),azimuth:+s.az.toFixed(2)},difference:{elevation:+(s.el-elevation).toFixed(2),azimuth:+(((s.az-azimuth+540)%360)-180).toFixed(2)},
   // The overhead-Sun point each pair of angles implies: this shows where the two sources part ways.
   subSolar:{jpl:subSolar(c.lat,c.lon,s.az,s.el),table:subSolar(c.lat,c.lon,azimuth,elevation)}});
 }
 // Sunrise against a level horizon (the published table does not use terrain).
 const rise=nextCrossing(d.sun,d.sun[0].time);
 rows.push({mission:c.mission,event:'local sunrise',published:{utc:c.sunrise},app:{utc:rise?new Date(rise.time).toISOString().slice(0,16)+'Z':null},difference:{minutes:rise?Math.round((rise.time-Date.parse(c.sunrise))/60000):null}});
}
const angles=rows.filter(r=>r.difference.elevation!==undefined);
const summary={cases:angles.length,maxElevationDifference:Math.max(...angles.map(r=>Math.abs(r.difference.elevation))),maxAzimuthDifference:Math.max(...angles.map(r=>Math.abs(r.difference.azimuth))),maxSunriseDifferenceMinutes:Math.max(...rows.filter(r=>r.difference.minutes!==undefined).map(r=>Math.abs(r.difference.minutes)))};
for(const r of rows)console.log(r.mission.padEnd(10),r.event.padEnd(16),r.difference.minutes!==undefined?`published ${r.published.utc}  app ${r.app.utc}  ${r.difference.minutes>=0?'+':''}${r.difference.minutes} min`:`published ${String(r.published.elevation).padStart(5)}° ${String(r.published.azimuth).padStart(6)}°  app ${String(r.app.elevation).padStart(6)}° ${String(r.app.azimuth).padStart(7)}°  Δ ${r.difference.elevation>=0?'+':''}${r.difference.elevation}° ${r.difference.azimuth>=0?'+':''}${r.difference.azimuth}°`);
const lonOffsets=angles.map(r=>r.subSolar.table.lon-r.subSolar.jpl.lon),latOffsets=angles.map(r=>r.subSolar.table.lat-r.subSolar.jpl.lat);
summary.subSolar={note:'Overhead-Sun point implied by the table minus the one from JPL Horizons, in degrees. The Sun can never be more than about 1.6° from the lunar equator.',longitudeOffsetMean:+(lonOffsets.reduce((a,b)=>a+b)/lonOffsets.length).toFixed(2),longitudeOffsetRange:[+Math.min(...lonOffsets).toFixed(2),+Math.max(...lonOffsets).toFixed(2)],latitudeOffsetRange:[+Math.min(...latOffsets).toFixed(2),+Math.max(...latOffsets).toFixed(2)],maxLatitudeJpl:Math.max(...angles.map(r=>Math.abs(r.subSolar.jpl.lat))),maxLatitudeTable:Math.max(...angles.map(r=>Math.abs(r.subSolar.table.lat)))};
console.log(JSON.stringify(summary));
await writeFile(new URL('../data/benchmark-apollo.json',import.meta.url),JSON.stringify({source:'https://www.nasa.gov/wp-content/uploads/static/history/alsj/WOTM/WOTM-ThermalEnvrnmnt.html',generated:new Date().toISOString(),summary,rows},null,2)+'\n');
