import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { distanceKm, searchFeatures, placeName } from '../src/features.mjs';

const features=JSON.parse(await readFile(new URL('../public/assets/features.json',import.meta.url),'utf8'));
const small=[['Big Sea',0,0,600,'Mare'],['Alpha',0,0,100,'Crater'],['Alpha B',0,1,10,'Satellite crater'],['Mons Test',10,10,40,'Mons'],['Gödel',-20,5,30,'Crater'],['Rima Long',0,0.2,20,'Rima']];

test('distance: a degree of latitude is 30.3 km and a quarter turn is a quarter of the circumference',()=>{
 assert.ok(Math.abs(distanceKm(0,0,1,0)-30.32)<.01);
 assert.ok(Math.abs(distanceKm(0,0,0,90)-Math.PI*1737.4/2)<1e-6);
 assert.equal(distanceKm(-89.5,10,-89.5,10),0);
});

test('search puts names that start with the query first, ignores accents, and needs two letters',()=>{
 assert.deepEqual(searchFeatures(small,'alp').map(f=>f[0]),['Alpha','Alpha B']);
 assert.deepEqual(searchFeatures(small,'test').map(f=>f[0]),['Mons Test']);
 assert.deepEqual(searchFeatures(small,'godel').map(f=>f[0]),['Gödel']);
 assert.deepEqual(searchFeatures(small,'a'),[]);
 assert.deepEqual(searchFeatures(null,'alpha'),[]);
 assert.equal(searchFeatures(small,'a',1).length,0);
});

test('placeName picks the smallest feature that covers the point and words it by kind',()=>{
 assert.equal(placeName(small,0,0.1).text,'inside Alpha');                 // 3 km from the centre; the rille next to it is ignored
 assert.equal(placeName(small,0,1.0).text,'inside Alpha B');               // the satellite crater sits inside Alpha
 assert.equal(placeName(small,1.5,0).text,'near the rim of Alpha');        // 45 km out of a 50 km radius
 assert.equal(placeName(small,5,0).text,'in Big Sea');                     // 152 km into a 300 km radius
 assert.equal(placeName(small,8,0),null);                                  // 243 km out: too near the edge of an irregular sea to say
 assert.equal(placeName(small,10.2,10).text,'on Mons Test');
 assert.equal(placeName(small,60,60),null);
 assert.equal(placeName(null,0,0),null);
});

test('the real IAU list is loaded, sorted by size, and knows the usual places',()=>{
 assert.ok(features.length>9000);
 assert.ok(features.every((f,i)=>i===0||features[i-1][3]>=f[3]));
 assert.equal(searchFeatures(features,'tycho')[0][0],'Tycho');
 assert.equal(searchFeatures(features,'shackleton')[0][0],'Shackleton');
 assert.equal(placeName(features,-89.67,129.8).text,'inside Shackleton');
 assert.equal(placeName(features,-84.6,31).text,'on Mons Mouton');
 assert.notEqual(placeName(features,20.1911,30.7723)?.name,'Mare Tranquillitatis'); // Apollo 17 is not in that sea
});
