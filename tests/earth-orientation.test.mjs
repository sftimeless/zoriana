import test from 'node:test';
import assert from 'node:assert/strict';
import {moonFromIcrf,moonFromEarthFixed,earthMeshRotation,earthPointFacing,earthRotationAngle,apply} from '../src/earth-orientation.mjs';
import {coordinatesToVector} from '../src/ephemeris.mjs';
const RAD=Math.PI/180,J2000=Date.UTC(2000,0,1,12),at=iso=>Date.parse(iso);
const angle=(a,b)=>Math.acos(Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2]))/RAD;
const fromLatLon=(lat,lon)=>[Math.cos(lat*RAD)*Math.cos(lon*RAD),Math.cos(lat*RAD)*Math.sin(lon*RAD),Math.sin(lat*RAD)];
// Low-precision Sun direction in the ICRF (precession removed), good to about 0.01°.
function sunIcrf(t){const n=(t+69184-J2000)/864e5,g=(357.528+.9856003*n)*RAD,lam=(280.460+.9856474*n+1.915*Math.sin(g)+.020*Math.sin(2*g)-3.8246e-5*n)*RAD,eps=23.4393*RAD;return [Math.cos(lam),Math.cos(eps)*Math.sin(lam),Math.sin(eps)*Math.sin(lam)];}
test('lunar rotation model reproduces JPL Horizons sub-solar points',()=>{
 // Sub-solar latitude and east longitude derived from live Horizons data on 2026-11-14 (reference site 0°N 0°E).
 // The model's Sun is seen from Earth, not the Moon, which alone allows up to 0.15°.
 for(const [iso,lat,lon] of [['2026-11-15T12:00:00Z',-1.557,108.341],['2026-11-25T12:00:00Z',-1.514,-13.155],['2026-12-05T12:00:00Z',-1.453,-134.716]]){
  const mismatch=angle(apply(moonFromIcrf(at(iso)),sunIcrf(at(iso))),fromLatLon(lat,lon));
  assert.ok(mismatch<.25,`${iso}: ${mismatch.toFixed(3)}° from the JPL sub-solar point`);
 }
});
test('rotation matrices are proper rotations',()=>{
 for(const m of [moonFromIcrf(at('2026-11-15T12:00:00Z')),moonFromEarthFixed(at('2027-02-01T00:00:00Z')),earthMeshRotation(at('2026-11-21T06:00:00Z'))]){
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){const dot=m[i][0]*m[j][0]+m[i][1]*m[j][1]+m[i][2]*m[j][2];assert.ok(Math.abs(dot-(i===j?1:0))<1e-12);}
  const det=m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);assert.ok(Math.abs(det-1)<1e-12);
 }
});
test('Earth turns at the sidereal rate and the sub-lunar point drifts west',()=>{
 const t=at('2026-11-15T12:00:00Z'),turn=(earthRotationAngle(t+3600000)-earthRotationAngle(t)+2*Math.PI)%(2*Math.PI)/RAD;
 assert.ok(Math.abs(turn-15.041)<.001);
 // Sub-lunar point from the Horizons Earth direction at that time (2.701°N 3.308°W on the Moon): about 21.9°S 69.4°E.
 const toMoon=fromLatLon(2.701,-3.308).map(v=>-v),now=earthPointFacing(t,toMoon),later=earthPointFacing(t+3600000,toMoon);
 assert.ok(Math.abs(now.lat+21.95)<.1&&Math.abs(now.lon-69.35)<.1);
 // The Moon-fixed frame turns too (about 0.55° per hour), so the drift is Earth's rate minus the Moon's.
 assert.ok(Math.abs(((now.lon-later.lon+540)%360)-180-14.49)<.05,'the point under a Moon-fixed direction moves west at about 14.5° per hour');
});
test('the mesh rotation puts the sub-lunar point of the map on the side facing the Moon',()=>{
 const t=at('2026-11-15T12:00:00Z'),toMoon=fromLatLon(2.701,-3.308).map(v=>-v),sub=earthPointFacing(t,toMoon);
 // Renderer convention: x = 0° longitude, y = north, -z = 90° east (same as the Moon globe).
 const onMap=coordinatesToVector(sub.lat,sub.lon),rotated=apply(earthMeshRotation(t),onMap),expected=[toMoon[0],toMoon[2],-toMoon[1]];
 assert.ok(angle(rotated,expected)<1e-4);
});
