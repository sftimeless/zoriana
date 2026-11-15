// Fetches what the Apollo 11 replay needs from NASA/JPL Horizons and writes public/assets/apollo11.json:
//   moon  the Moon's position and velocity from Earth's centre, every 30 minutes, July 16 to 25, 1969
//   sun   the Sun's direction from Earth, every 12 hours
//   sivb  the real path of the Saturn V's third stage (S-IVB) after its engine burn toward the Moon:
//         JPL's reconstruction by D. R. Adamo (2012), which starts 18 minutes after the burn ended
// All in km and km/s, in the ICRF frame (x toward the equinox, z toward Earth's north pole).
// Horizons counts in TDB, which ran 40.2 s ahead of UTC in July 1969; times here are UTC milliseconds.
// Run once: node scripts/prepare-apollo11.mjs
import {writeFile} from 'node:fs/promises';
const TDB_MINUS_UTC=40184; // ms: 32.184 s + TAI-UTC of about 8.0 s in July 1969
const jdToUtc=jd=>Math.round((jd-2440587.5)*86400000-TDB_MINUS_UTC);
async function vectors(command,start,stop,step){
 const p={format:'json',COMMAND:`'${command}'`,EPHEM_TYPE:"'VECTORS'",CENTER:"'500@399'",START_TIME:`'${start}'`,STOP_TIME:`'${stop}'`,STEP_SIZE:`'${step}'`,REF_PLANE:"'FRAME'",VEC_TABLE:"'2'",CSV_FORMAT:"'YES'",OUT_UNITS:"'KM-S'"};
 const reply=await fetch('https://ssd.jpl.nasa.gov/api/horizons.api?'+new URLSearchParams(p)).then(r=>r.json());
 if(!reply.result?.includes('$$SOE'))throw new Error(`Horizons gave no table for ${command}: ${(reply.result||reply.error||'').slice(-300)}`);
 return reply.result.split('$$SOE')[1].split('$$EOE')[0].trim().split('\n').map(line=>{const c=line.split(',').map(s=>s.trim());return {time:jdToUtc(Number(c[0])),state:c.slice(2,8).map(Number)};});
}
const round=(rows,pos,vel)=>rows.map(r=>[r.time,...r.state.slice(0,3).map(v=>+v.toFixed(pos)),...r.state.slice(3).map(v=>+v.toFixed(vel))]);
const moon=await vectors('301','1969-07-16 12:00','1969-07-25 00:00','30 m');
const sun=await vectors('10','1969-07-16 12:00','1969-07-25 00:00','12 h');
const sivb=[...await vectors('-399110','1969-07-16 16:41','1969-07-17 00:01','5 m'),...await vectors('-399110','1969-07-17 00:31','1969-07-20 12:01','30 m')];
const out={generated:new Date().toISOString(),source:'NASA/JPL Horizons vector tables, geocentric, ICRF, km and km/s; times converted from TDB to UTC (40.184 s)',
 columns:['time (ms, UTC)','x','y','z','vx','vy','vz'],moon:round(moon,2,6),sivb:round(sivb,2,6),
 sun:sun.map(r=>{const l=Math.hypot(...r.state.slice(0,3));return [r.time,...r.state.slice(0,3).map(v=>+(v/l).toFixed(6))];})};
await writeFile(new URL('../public/assets/apollo11.json',import.meta.url),JSON.stringify(out));
console.log(`moon ${moon.length} rows, S-IVB ${sivb.length} rows from ${new Date(sivb[0].time).toISOString()} to ${new Date(sivb.at(-1).time).toISOString()}, sun ${sun.length} rows`);
