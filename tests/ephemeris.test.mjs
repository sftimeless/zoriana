import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHorizons,sampleAt,visibleHours,nextCrossing,coordinatesToVector,skyDirection} from '../src/ephemeris.mjs';
test('parses JD and azimuth/elevation from documented Horizons CSV columns',()=>{
 const r=parseHorizons('header\n$$SOE\n2461358.500000000, ,i, 91.441764, -13.158066,\n2461358.541666667, ,i, 91.444819, -12.650398,\n$$EOE\nfooter');
 assert.equal(new Date(r[0].time).toISOString(),'2026-11-14T00:00:00.000Z');assert.equal(r[1].time-r[0].time,3600000);assert.equal(r[0].el,-13.158066);
});
test('rejects API errors and n.a. values instead of fabricating observations',()=>{assert.throws(()=>parseHorizons('invalid target'));assert.throws(()=>parseHorizons('$$SOE\n2461358.5, , ,n.a.,n.a.,\n2461358.6, , ,10,20,\n$$EOE'));});
test('interpolation wraps azimuth through north and never extrapolates',()=>{const r=[{time:0,az:359,el:-1},{time:3600000,az:1,el:1}];assert.equal(sampleAt(r,1800000).az,0);assert.equal(sampleAt(r,1800000).el,0);assert.equal(sampleAt(r,-1),null);assert.equal(sampleAt(r,3600001),null);});
test('visibility durations integrate crossings, not merely count samples',()=>{const r=[{time:0,az:0,el:-2},{time:3600000,az:0,el:2},{time:7200000,az:0,el:2}];assert.equal(visibleHours(r,0,7200000),1.5);assert.equal(visibleHours(r,0,3600000),.5);assert.deepEqual(nextCrossing(r,0),{time:1800000,rising:true});assert.equal(visibleHours(r,-1,7200000),null);});
test('lunar texture coordinates and topocentric sky directions share axes',()=>{assert.deepEqual(coordinatesToVector(0,0),[1,0,-0]);const n=skyDirection(0,0,0,0),e=skyDirection(0,0,90,0),z=skyDirection(0,0,0,90);assert.ok(n[1]>.999);assert.ok(e[2]<-.999);assert.ok(z[0]>.999);});
