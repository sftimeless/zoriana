import { Worker } from 'node:worker_threads';
const cache=new Map(),pending=new Map();let worker=null,sequence=0;
function ensureWorker(){if(worker)return worker;const w=new Worker(new URL('./terrain-worker.mjs',import.meta.url),{execArgv:process.execArgv.filter(x=>!x.startsWith('--input-type'))});worker=w;
 w.on('message',({id,profile,error})=>{const job=pending.get(id);if(!job)return;pending.delete(id);clearTimeout(job.timer);if(error)job.reject(new Error(error));else job.resolve(profile);});
 const fail=error=>{if(worker!==w)return;worker=null;for(const job of pending.values()){clearTimeout(job.timer);job.reject(error);}pending.clear();cache.clear();};
 w.on('error',fail);w.on('exit',code=>fail(new Error(`Terrain worker stopped (${code}).`)));return w;}
export async function getTerrain(lat,lon){const key=`${lat.toFixed(6)}:${lon.toFixed(6)}`;if(cache.has(key))return cache.get(key);
 if(pending.size>=12)throw new Error('Terrain service is busy. Please retry.');
 const result=new Promise((resolve,reject)=>{const w=ensureWorker(),id=++sequence;const timer=setTimeout(()=>{const job=pending.get(id);pending.delete(id);job?.reject(new Error('Terrain calculation timed out.'));},60000);pending.set(id,{resolve,reject,timer});w.postMessage({id,lat,lon});});
 cache.set(key,result);if(cache.size>(process.env.NODE_ENV==='production'?400:64))cache.delete(cache.keys().next().value);
 try{return await result;}catch(e){cache.delete(key);throw e;}}
