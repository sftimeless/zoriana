// Zoriana server: the JPL/terrain API plus the web app. In development it runs Vite; with
// NODE_ENV=production it serves the built files in dist/ and needs no npm packages.
import http from 'node:http';
import path from 'node:path';
import { createReadStream, readFileSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getTerrain } from './terrain-service.mjs';
import { parseHorizons, DAY } from './src/ephemeris.mjs';
import { sites } from './src/sites.mjs';
const PRODUCTION=process.env.NODE_ENV==='production';
const PORT=Number(process.env.PORT)||4174,HOST=process.env.HOST||(PRODUCTION?'0.0.0.0':'127.0.0.1');
const CACHE_LIMIT=PRODUCTION?600:100;
const cache=new Map();
const SERIES_DAYS=31; // hourly series: a full lunar day (29.5 days) plus room for a landing hour later than 00:00
let queue=Promise.resolve();
function scheduled(task) { const result=queue.then(task); queue=result.catch(()=>{}); return result; }
// Stamped on every answer and export, so a result can be tied to the code that made it.
const VERSION=JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf8')).version;
let kernel=null; // the planetary ephemeris JPL says it used, read from its reply (for example DE441)
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
    const named=(data.result||'').match(/\{source:\s*([^}]+)\}/);if(named)kernel=named[1].trim();
    return parseHorizons(data.result||'');
  });
  cache.set(key,promise);
  if(cache.size>CACHE_LIMIT) cache.delete(cache.keys().next().value);
  try{return await promise;}catch(e){cache.delete(key);throw e;}
}
// Everything the app needs for one site and date: terrain horizon plus Sun and Earth from JPL.
async function ephemeris(lat,lon,date,reference=false){
  const terrain=reference?null:await getTerrain(lat,lon);
  const altitude=terrain?(terrain.elevationMeters+terrain.observerHeightMeters)/1000:0;
  const [sun,earth]=await Promise.all([query(10,lat,lon,date,altitude),query(399,lat,lon,date,altitude)]);
  return {version:VERSION,sun,earth,lat,lon,date,days:SERIES_DAYS,terrain,altitudeKm:altitude,source:'NASA/JPL Horizons + NASA LOLA',
    // What was asked of JPL, so the same table can be requested again by anyone.
    request:{service:'https://ssd.jpl.nasa.gov/api/horizons.api',table:'OBSERVER',targets:'10 (Sun), 399 (Earth)',center:'coord@301',coordType:'GEODETIC',siteCoord:`${lon},${lat},${altitude}`,siteCoordMeaning:'east longitude (deg), latitude (deg), height above the 1737.4 km sphere (km)',quantities:'4 (apparent azimuth and elevation), 20 (range)',apparent:'AIRLESS',step:'1 h',timeScale:'UT',ephemeris:kernel,frame:'Moon mean-Earth (JPL reports MEAN_ME); planetocentric latitude, east-positive longitude'},model:'Airless apparent body-center elevation and observer range; 1737.4 km reference sphere; observer at sampled DEM elevation + 2 m; hourly ephemerides. Finite DEM, azimuth and time sampling. Eclipses of the Sun by Earth are evaluated in the browser from these positions.'};
}
// The app opens on today's date (UTC), so the curated sites are fetched for today when the server
// starts and again when the date changes. Visitors then share those answers instead of each
// waiting in the one-at-a-time JPL queue. Requests go through the normal path and cache.
let warmedDate=null,warming=false;
async function warm(){
  const today=new Date().toISOString().slice(0,10);
  if(warming||warmedDate===today)return;
  warming=true;const started=Date.now();let ready=0;
  try{
    await ephemeris(0,0,today,true).catch(()=>{}); // the globe's default lighting
    for(const site of sites){try{await ephemeris(site.lat,site.lon,today);ready++;}catch{}}
    if(ready===sites.length)warmedDate=today;
    console.log(`Warm-up for ${today}: ${ready}/${sites.length} sites in ${Math.round((Date.now()-started)/1000)} s`);
  }finally{warming=false;}
}
// A public server gets a per-visitor ceiling so one client cannot monopolise the JPL queue.
const RATE_WINDOW=5*60000,RATE_LIMIT=400,visitors=new Map();
function allowed(req){
  if(!PRODUCTION)return true;
  const who=req.headers['fly-client-ip']||req.socket.remoteAddress||'unknown',now=Date.now();
  let entry=visitors.get(who);if(!entry||now-entry.start>RATE_WINDOW){entry={start:now,count:0};visitors.set(who,entry);}
  if(visitors.size>5000)for(const [key,value] of visitors)if(now-value.start>RATE_WINDOW)visitors.delete(key);
  return ++entry.count<=RATE_LIMIT;
}
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.f32':'application/octet-stream'};
const DIST=fileURLToPath(new URL('./dist/',import.meta.url));
// Serves the built app. Files with a .gz twin (made at build time) are sent compressed.
async function serveBuilt(req,res,url){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  let relative;try{relative=decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end();return;}
  let file=path.join(DIST,path.normalize(relative));
  if(!file.startsWith(DIST)){res.writeHead(403);res.end();return;}
  let info=await stat(file).catch(()=>null);
  if(!info?.isFile()){
    // Unknown asset paths are real 404s; anything else is the single-page app.
    if(path.extname(relative)){res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');return;}
    file=path.join(DIST,'index.html');info=await stat(file).catch(()=>null);
    if(!info){res.writeHead(500,{'Content-Type':'text/plain'});res.end('The app has not been built. Run: npx vite build');return;}
  }
  const ext=path.extname(file),hashed=/[\\/]assets[\\/]index-[\w-]+\.(js|css)$/.test(file);
  const headers={'Content-Type':TYPES[ext]||'application/octet-stream','Cache-Control':ext==='.html'?'no-cache':hashed?'public, max-age=31536000, immutable':'public, max-age=86400','Last-Modified':info.mtime.toUTCString(),'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin',Vary:'Accept-Encoding'};
  const since=Date.parse(req.headers['if-modified-since']||'');
  if(Number.isFinite(since)&&Math.floor(info.mtimeMs/1000)*1000<=since){res.writeHead(304,headers);res.end();return;}
  const zipped=/\bgzip\b/.test(req.headers['accept-encoding']||'')?await stat(file+'.gz').catch(()=>null):null;
  if(zipped){file+='.gz';headers['Content-Encoding']='gzip';}
  headers['Content-Length']=(zipped||info).size;
  res.writeHead(200,headers);
  if(req.method==='HEAD'){res.end();return;}
  createReadStream(file).on('error',()=>res.destroy()).pipe(res);
}
const vite=PRODUCTION?null:await (await import('vite')).createServer({server:{middlewareMode:true},appType:'spa'});
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end('ok');return;}
  if(url.pathname==='/api/ephemeris') {
    const lat=Number(url.searchParams.get('lat')),lon=Number(url.searchParams.get('lon')),date=url.searchParams.get('date');
    const valid=date&&/^(19[5-9]\d|20\d\d)-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;
    res.setHeader('Content-Type','application/json');
    if(!allowed(req)){res.writeHead(429,{'Retry-After':'60'});res.end(JSON.stringify({error:'Too many requests from this connection. Please wait a minute and retry.'}));return;}
    if(req.method!=='GET'||!url.searchParams.has('lat')||!url.searchParams.has('lon')||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180||!valid){res.writeHead(400);res.end(JSON.stringify({error:'Choose valid lunar coordinates and a date from 1950–2099.'}));return;}
    try {
      const body=JSON.stringify(await ephemeris(lat,lon,date,url.searchParams.get('reference')==='1'));
      res.setHeader('Cache-Control','public, max-age=900');res.end(body);
    }catch(e){res.writeHead(502);res.end(JSON.stringify({error:'Terrain or NASA/JPL data is unavailable. Please retry. No reference-only result has been substituted.'}));}
    return;
  }
  if(vite)vite.middlewares(req,res);else serveBuilt(req,res,url).catch(()=>{if(!res.headersSent)res.writeHead(500);res.end();});
});
server.listen(PORT,HOST,()=>console.log(`Zoriana → http://${HOST}:${PORT}${PRODUCTION?' (production build)':''}`));
// Load the terrain grids now, so the first visitor does not wait for about 260 MB to be read,
// then fetch today's data for the curated sites, and keep doing so as the date rolls over.
if(PRODUCTION){getTerrain(-89.5,0).then(()=>{console.log('Terrain ready');return warm();}).catch(e=>console.error('Terrain warm-up failed:',e.message));setInterval(warm,10*60000).unref();}
// Let the host stop the server cleanly on deploys.
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),3000).unref();});
