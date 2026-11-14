import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceShadow,sampleFloat} from '../src/shadow-reference.mjs';
import {skyDirection} from '../src/ephemeris.mjs';
test('ray visibility: a smooth Moon is lit above the horizon and dark below it',()=>{
 for(const lat of [-89.5,0,70])for(const lon of [-179,0,120]){
  assert.equal(referenceShadow(lat,lon,skyDirection(lat,lon,90,10),()=>0),1);
  assert.equal(referenceShadow(lat,lon,skyDirection(lat,lon,90,-10),()=>0),0);
 }
});
test('a ridge casts a directional shadow which clears as the Sun rises',()=>{
 const ridge=(lat,lon)=>lat>.02&&lat<.08&&Math.abs(lon)<.1?.3:0;
 assert.equal(referenceShadow(0,0,skyDirection(0,0,0,2),ridge),0);
 assert.equal(referenceShadow(0,0,skyDirection(0,0,90,2),ridge),1);
 assert.equal(referenceShadow(0,0,skyDirection(0,0,0,60),ridge),1);
});
test('visual float samples preserve negative elevation and wrap longitude',()=>{
 const grid=new Float32Array([-100,100,300,500]);
 assert.equal(sampleFloat(grid,2,2,.5,.5),200);
 assert.equal(sampleFloat(grid,2,2,-.5,0,true),0);
 assert.equal(sampleFloat(grid,2,2,0,0),-100);
});
