import {getTerrain} from '../terrain-service.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {bilinear,globalPixel,southPixel} from '../src/terrain-math.mjs';
import assert from 'node:assert/strict';
const g=await readFile(new URL('../data/global-height.i16',import.meta.url)),p=await readFile(new URL('../data/ldem_85s_40m.img',import.meta.url));
const G=new Int16Array(g.buffer,g.byteOffset,g.byteLength/2),P=new Int16Array(p.buffer,p.byteOffset,p.byteLength/2);
const checks=[];
for(const [lat,lon]of[[-86,0],[-87,90],[-88,-90],[-89,180],[-89.5,0]]){const [gx,gy]=globalPixel(lat,lon),[px,py]=southPixel(lat,lon);const global=bilinear(G,5760,2880,gx,gy,true),polar=bilinear(P,7584,7584,px,py);checks.push({lat,lon,global,polar,difference:polar-global});}
// The independently projected products should agree at regional scales; local resolution differs.
assert.ok(checks.every(x=>Math.abs(x.difference)<1500));
const start=performance.now(),profile=await getTerrain(-89.5,0),coldMs=performance.now()-start;
const cachedStart=performance.now(),cached=await getTerrain(-89.5,0),cachedMs=performance.now()-cachedStart;
assert.equal(profile,cached);assert.equal(profile.angles.length,1440);assert.equal(profile.localResolutionMeters,40);assert.ok(Math.max(...profile.angles)>5);assert.ok(profile.angles.every(Number.isFinite));
const result={checks,coldMs,cachedMs,workerMs:profile.computeMs,samples:profile.sampleCount,elevation:profile.elevationMeters,minHorizon:Math.min(...profile.angles),maxHorizon:Math.max(...profile.angles)};
console.log(JSON.stringify(result,null,2));await writeFile(new URL('../data/terrain-check.json',import.meta.url),JSON.stringify(result,null,2)+'\n');process.exit();
