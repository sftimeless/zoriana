import http from 'node:http';
import { createServer } from 'vite';
import { getTerrain } from './terrain-service.mjs';
import { parseHorizons, DAY } from './src/ephemeris.mjs';
const cache=new Map();
const SERIES_DAYS=31; // hourly series: a full lunar day (29.5 days) plus room for a landing hour later than 00:00
let queue=Promise.resolve();
function scheduled(task) { const result=queue.then(task); queue=result.catch(()=>{}); return result; }
async function query(target,lat,lon,date,altitude=0) {
  const key=[target,lat,lon,date,altitude].join(':');
  if(cache.has(key)) return cache.get(key);
  const promise=scheduled(async()=>{
    const end=new Date(Date.parse(date)+SERIES_DAYS*DAY).toISOString().slice(0,10);
    const params={format:'json',COMMAND:`'${target}'`,EPHEM_TYPE:"'OBSERVER'",CENTER:"'coord@301'",COORD_TYPE:"'GEODETIC'",SITE_COORD:`'${lon},${lat},${altitude}'`,START_TIME:`'${date}'`,STOP_TIME:`'${end}'`,STEP_SIZE:"'1 h'",QUANTITIES:"'4,20'",RANGE_UNITS:"'KM'",CSV_FORMAT:"'YES'",CAL_FORMAT:"'JD'",OBJ_DATA:"'NO'",APPARENT:"'AIRLESS'"};
    const response=await fetch('https://ssd.jpl.nasa.gov/api/horizons.api?'+new URLSearchParams(params),{signal:AbortSignal.timeout(30000)});
    if(!response.ok) throw new Error('JPL request failed.');
    const data=await response.json();
    if(data.error) throw new Error('JPL could not calculate this location and date.');
    return parseHorizons(data.result||'');
  });
  cache.set(key,promise);
  if(cache.size>100) cache.delete(cache.keys().next().value);
  try{return await promise;}catch(e){cache.delete(key);throw e;}
}
const vite=await createServer({server:{middlewareMode:true},appType:'spa'});
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/ephemeris') {
    const lat=Number(url.searchParams.get('lat')),lon=Number(url.searchParams.get('lon')),date=url.searchParams.get('date');
    const valid=date&&/^(19[5-9]\d|20\d\d)-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;
    res.setHeader('Content-Type','application/json');
    if(req.method!=='GET'||!url.searchParams.has('lat')||!url.searchParams.has('lon')||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180||!valid){res.writeHead(400);res.end(JSON.stringify({error:'Choose valid lunar coordinates and a date from 1950–2099.'}));return;}
    try {
      const terrain=url.searchParams.get('reference')==='1'?null:await getTerrain(lat,lon);
      const altitude=terrain?(terrain.elevationMeters+terrain.observerHeightMeters)/1000:0;
      const [sun,earth]=await Promise.all([query(10,lat,lon,date,altitude),query(399,lat,lon,date,altitude)]);
      res.end(JSON.stringify({sun,earth,lat,lon,date,days:SERIES_DAYS,terrain,altitudeKm:altitude,source:'NASA/JPL Horizons + NASA LOLA',model:'Airless apparent body-center elevation and observer range; 1737.4 km reference sphere; observer at sampled DEM elevation + 2 m; hourly ephemerides. Finite DEM, azimuth and time sampling; eclipses not evaluated.'}));
    }catch(e){res.writeHead(502);res.end(JSON.stringify({error:'Terrain or NASA/JPL data is unavailable. Please retry. No reference-only result has been substituted.'}));}
    return;
  }
  vite.middlewares(req,res);
});
server.listen(4174,'127.0.0.1',()=>console.log('Zoriana → http://127.0.0.1:4174'));
