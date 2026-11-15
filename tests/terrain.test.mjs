import test from 'node:test';
import assert from 'node:assert/strict';
import { RADIUS,destination,southPixel,southPolarPixel,slopeAt,obstructionAt,globalPixel,bilinear,apparentTerrainAngle,computeHorizon,horizonAt,clearanceSeries } from '../src/terrain-math.mjs';
import { visibleHours } from '../src/ephemeris.mjs';
test('south polar projection follows PDS orientation and pixel registration',()=>{assert.deepEqual(southPixel(-90,0),[3791.5,3791.5]);const n=southPixel(-89,0),e=southPixel(-89,90);assert.equal(n[0],3791.5);assert.ok(n[1]<3791.5);assert.ok(e[0]>3791.5);assert.ok(Math.abs(e[1]-3791.5)<1e-8);const distance=(3791.5-n[1])*40;assert.ok(Math.abs(distance-2*RADIUS*Math.tan(Math.PI/360))<1e-8);});
test('global raster wraps the dateline and polar rows clamp at pixel centers',()=>{assert.deepEqual(globalPixel(0,-180),globalPixel(0,180));const grid=new Int16Array([0,20,40,60]);assert.equal(bilinear(grid,2,2,.5,.5),15);assert.equal(bilinear(grid,2,2,-.5,0,true),5);assert.equal(bilinear(grid,2,2,3,0),null);assert.equal(bilinear(new Int16Array([-32768,0,0,0]),2,2,.5,.5),null);});
test('great-circle destination crosses the dateline correctly',()=>{const [lat,lon]=destination(0,179,90,RADIUS*Math.PI/90);assert.ok(Math.abs(lat)<1e-8);assert.ok(Math.abs(lon+179)<1e-8);});
test('spherical flat terrain gives the analytic depressed horizon for a 2m observer',()=>{const p=computeHorizon(0,0,()=>({height:0,resolution:40}),{stepDegrees:90,maxDistance:20000});const expected=-Math.acos(RADIUS/(RADIUS+2))*180/Math.PI;for(const angle of p.angles)assert.ok(Math.abs(angle-expected)<.0002);assert.ok(apparentTerrainAngle(100000,0,0)<-1);});
test('a synthetic northern ridge blocks an otherwise visible Sun but not the east',()=>{const terrain=computeHorizon(0,0,(lat,lon)=>({height:lat>.029&&lat<.037&&Math.abs(lon)<.005?100:0,resolution:40}),{stepDegrees:10,maxDistance:5000});assert.ok(horizonAt(terrain,0)>5);assert.ok(horizonAt(terrain,90)<0);const rows=[{time:0,az:0,el:1},{time:3600000,az:0,el:1}];assert.equal(visibleHours(rows,0,3600000),1);assert.equal(visibleHours(clearanceSeries(rows,terrain),0,3600000),0);});
test('terrain azimuth interpolation wraps through north and retains negative horizons',()=>{const p={stepDegrees:90,angles:[-1,2,3,4]};assert.equal(horizonAt(p,0),-1);assert.equal(horizonAt(p,360),-1);assert.equal(horizonAt(p,315),1.5);});

test('exact south-pole rays retain distinct longitudes',()=>{const n=destination(-90,0,0,1000),e=destination(-90,0,90,1000);assert.ok(Math.abs(n[1])<1e-8);assert.ok(Math.abs(e[1]-90)<1e-8);assert.ok(Math.abs(n[0]-e[0])<1e-8);});
test('generic south-polar lookup reproduces the 40 m grid registration and scales to 80 m',()=>{
 for(const [lat,lon] of [[-89.5,0],[-86,45],[-85.2,-120]]){const a=southPixel(lat,lon),b=southPolarPixel(lat,lon,40,3791.5);assert.ok(Math.abs(a[0]-b[0])<1e-9&&Math.abs(a[1]-b[1])<1e-9);}
 assert.deepEqual(southPolarPixel(-90,0,80,3799.5),[3799.5,3799.5]);
 const [x,y]=southPolarPixel(-80,90,80,3799.5);assert.ok(Math.abs(y-3799.5)<1e-6);assert.ok(x>7597&&x<7600,'80°S lies just inside the 7600-pixel grid');
});
test('slope recovers a known tilted plane, is zero on flat ground and null without data',()=>{
 const lat0=-84,tilt=Math.tan(10*Math.PI/180),plane=(lat,lon)=>({height:(lat-lat0)*Math.PI/180*RADIUS*tilt,resolution:80});
 assert.ok(Math.abs(slopeAt(lat0,30,plane,160)-10)<.01);
 assert.equal(slopeAt(lat0,30,()=>({height:-721,resolution:80}),160),0);
 assert.equal(slopeAt(lat0,30,()=>null,160),null);
});
test('obstruction lookup reports the skyline height and the distance of the terrain that forms it',()=>{
 // A ridge 5 km to the north, 1 km high, on otherwise flat ground.
 const ridge=computeHorizon(0,0,(lat,lon)=>({height:lat>.16&&lat<.17&&Math.abs(lon)<1?1000:0,resolution:40}),{stepDegrees:5,maxDistance:20000});
 const north=obstructionAt(ridge,0),east=obstructionAt(ridge,90);
 assert.ok(north.horizon>8&&north.horizon<12);assert.ok(north.distanceMeters>4500&&north.distanceMeters<5500);
 assert.ok(east.horizon<0.5);assert.equal(obstructionAt(null,0),null);assert.equal(obstructionAt({angles:[1],stepDegrees:360},0),null);
});
