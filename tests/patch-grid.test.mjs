import test from 'node:test';
import assert from 'node:assert/strict';
import {patchFrame,patchDirection,directionToCoordinates,patchHeight,patchSize,RADIUS_KM} from '../src/patch-grid.mjs';
const near=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<eps,`${a} vs ${b}`);
test('the middle of the patch is the site itself, at any latitude and across the date line',()=>{for(const [lat,lon] of [[0,0],[-43.3,-11.2],[84.6,179.9],[-89.5,0]]){const [la,lo]=directionToCoordinates(patchDirection(patchFrame(lat,lon),256,256,513,150));near(la,lat,1e-6);near(Math.cos((lo-lon)*Math.PI/180),1,1e-9);}});
test('east is to the right and north is up, and the edge is the stated distance away',()=>{const f=patchFrame(10,20),n=513,half=150;const [laE,loE]=directionToCoordinates(patchDirection(f,n-1,256,n,half)),[laN,loN]=directionToCoordinates(patchDirection(f,256,n-1,n,half));assert.ok(loE>20&&Math.abs(laE-10)<.2);assert.ok(laN>10&&Math.abs(loN-20)<1e-6);near((laN-10)*Math.PI/180*RADIUS_KM,Math.atan(half/RADIUS_KM)*RADIUS_KM,1e-6);});
test('patches near the poles are smaller, so their points are closer together',()=>{assert.deepEqual(patchSize(-84.6),{n:513,halfKm:70});assert.deepEqual(patchSize(0.67),{n:513,halfKm:150});});
test('height lookup is exact on grid points, linear between them, and clamps at the edge',()=>{const h=Int16Array.from([0,10,20,30,40,50,60,70,80]);assert.equal(patchHeight(h,3,1,1),40);assert.equal(patchHeight(h,3,.5,0),5);assert.equal(patchHeight(h,3,0,.5),15);near(patchHeight(h,3,9,9),80,1e-3);assert.equal(patchHeight(h,3,-4,0),0);});
