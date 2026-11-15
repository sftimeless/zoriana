import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHorizons,sampleAt,visibleHours,nextCrossing,coordinatesToVector,skyDirection,centredDirection,centredPosition} from '../src/ephemeris.mjs';
test('parses JD and azimuth/elevation from documented Horizons CSV columns',()=>{
 const r=parseHorizons('header\n$$SOE\n2461358.500000000, ,i, 91.441764, -13.158066,\n2461358.541666667, ,i, 91.444819, -12.650398,\n$$EOE\nfooter');
 assert.equal(new Date(r[0].time).toISOString(),'2026-11-14T00:00:00.000Z');assert.equal(r[1].time-r[0].time,3600000);assert.equal(r[0].el,-13.158066);
});
test('rejects API errors and n.a. values instead of fabricating observations',()=>{assert.throws(()=>parseHorizons('invalid target'));assert.throws(()=>parseHorizons('$$SOE\n2461358.5, , ,n.a.,n.a.,\n2461358.6, , ,10,20,\n$$EOE'));});
test('interpolation wraps azimuth through north and never extrapolates',()=>{const r=[{time:0,az:359,el:-1},{time:3600000,az:1,el:1}];assert.equal(sampleAt(r,1800000).az,0);assert.equal(sampleAt(r,1800000).el,0);assert.equal(sampleAt(r,-1),null);assert.equal(sampleAt(r,3600001),null);});
test('visibility durations integrate crossings, not merely count samples',()=>{const r=[{time:0,az:0,el:-2},{time:3600000,az:0,el:2},{time:7200000,az:0,el:2}];assert.equal(visibleHours(r,0,7200000),1.5);assert.equal(visibleHours(r,0,3600000),.5);assert.deepEqual(nextCrossing(r,0),{time:1800000,rising:true});assert.equal(visibleHours(r,-1,7200000),null);});
test('lunar texture coordinates and topocentric sky directions share axes',()=>{assert.deepEqual(coordinatesToVector(0,0),[1,0,-0]);const n=skyDirection(0,0,0,0),e=skyDirection(0,0,90,0),z=skyDirection(0,0,0,90);assert.ok(n[1]>.999);assert.ok(e[2]<-.999);assert.ok(z[0]>.999);});
test('Moon-centred direction corrects Earth parallax and leaves an overhead body unchanged',()=>{
 const D=384400/1737.4,angle=(a,b)=>Math.acos(Math.min(1,a.reduce((s,v,i)=>s+v*b[i],0)))*180/Math.PI;
 // Earth at the zenith of the sub-Earth site: no parallax.
 assert.ok(angle(centredDirection(0,0,0,90,D),coordinatesToVector(0,0))<1e-9);
 // Site on the limb (90°E) seeing Earth on its western horizon: the true direction is tilted toward the site by atan(1/D).
 const limb=centredDirection(0,90,270,0,D),expected=Math.atan(1/D)*180/Math.PI;
 assert.ok(Math.abs(angle(limb,coordinatesToVector(0,0))-expected)<1e-6);assert.ok(expected>.25&&expected<.27);
 assert.ok(angle(limb,coordinatesToVector(0,90))<90,'tilt is toward the observing site');
 // At the Sun's distance the correction vanishes.
 assert.ok(angle(centredDirection(0,90,270,0,23500*D/60),skyDirection(0,90,270,0))<.001);
});
test('parses the Horizons range column when present and interpolates it',()=>{
 // Real Horizons rows for Earth seen from 0°N 0°E on the Moon, 2026-11-15 (QUANTITIES 4,20 with RANGE_UNITS KM).
 const r=parseHorizons('$$SOE\n2461359.500000000, ,i, 321.655223,    85.763311,  4.0298080881E+05, -0.0164008,\n2461359.541666667, ,i, 320.624337,    85.765252,  4.0292074467E+05, -0.0169714,\n$$EOE');
 assert.equal(r[0].range,402980.80881);assert.equal(r[1].range,402920.74467);
 const mid=sampleAt(r,(r[0].time+r[1].time)/2);assert.ok(Math.abs(mid.range-402950.77674)<1e-6);
 // Rows without the column, as older responses had, simply carry no range.
 const old=parseHorizons('$$SOE\n2461358.500000000, ,i, 91.441764, -13.158066,\n2461358.541666667, ,i, 91.444819, -12.650398,\n$$EOE');
 assert.equal(old[0].range,undefined);assert.equal(sampleAt(old,old[0].time+1000).range,undefined);
});
test('Moon-centred position adds the site offset to the range',()=>{
 const D=402980.80881/1737.4,len=v=>Math.hypot(...v);
 assert.ok(Math.abs(len(centredPosition(0,0,0,90,D))-(D+1))<1e-9,'overhead: one Moon radius farther from the centre');
 assert.ok(Math.abs(len(centredPosition(0,0,0,0,D))-Math.hypot(D,1))<1e-9,'on the horizon: right triangle');
});
