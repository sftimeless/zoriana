import test from 'node:test';
import assert from 'node:assert/strict';
import { angularRadius, discFraction, discSeries, discAt, discHours, limbEvents, SUN_RADIUS_KM, EARTH_RADIUS_KM } from '../src/disc.mjs';

const HOUR=3600000,flat=()=>0;

test('apparent sizes from the Moon match the familiar values',()=>{
 assert.ok(Math.abs(angularRadius(SUN_RADIUS_KM,149597870.7)-.2666)<.001);   // Sun about 0.53° wide
 assert.ok(Math.abs(angularRadius(EARTH_RADIUS_KM,384400)-.9507)<.001);       // Earth about 1.9° wide
});

test('disc share over a level horizon: none, half, all',()=>{
 const r=.2666;
 assert.equal(discFraction(90,-r,r,flat),0);
 assert.equal(discFraction(90,r,r,flat),1);
 assert.ok(Math.abs(discFraction(90,0,r,flat)-.5)<1e-9);
});

test('disc share matches the circular-segment formula part-way up',()=>{
 const r=.2666,exact=h=>.5+(h*Math.sqrt(1-h*h)+Math.asin(h))/Math.PI;
 for(const h of [-.8,-.4,.3,.7])assert.ok(Math.abs(discFraction(10,h*r,r,flat,61)-exact(h))<.004,`h=${h}`);
});

test('a ridge to one side hides only that side of the disc',()=>{
 const r=.95,ridge=az=>az>100?5:-5; // skyline steps up just east of the body
 assert.ok(Math.abs(discFraction(100,0,r,ridge)-.5)<.07);
 assert.equal(discFraction(102,0,r,ridge),0);
 assert.equal(discFraction(98,0,r,ridge),1);
});

// A Sun that climbs 1° per hour through a level horizon, starting 1° below it.
const rows=Array.from({length:5},(_,i)=>({time:i*HOUR,az:90,el:i-1,range:149597870.7}));

test('series, hours and limb events for a simple sunrise',()=>{
 const series=discSeries(rows,null,SUN_RADIUS_KM);
 assert.equal(series.length,49);
 assert.equal(discAt(series,0),0);
 assert.ok(Math.abs(discAt(series,HOUR)-.5)<1e-6);
 assert.equal(discAt(series,2*HOUR),1);
 // Centre rises at 1 h; the 0.27° radius adds and removes 16 minutes either side.
 const hours=discHours(series,0,4*HOUR);
 assert.ok(Math.abs(hours.any-(3+.2666))<.09,`any ${hours.any}`);
 assert.ok(Math.abs(hours.full-(3-.2666))<.09,`full ${hours.full}`);
 assert.ok(Math.abs(hours.equivalent-3)<.02,`equivalent ${hours.equivalent}`);
 const events=limbEvents(series,0);
 assert.deepEqual(events.map(e=>e.kind),['first','full']);
 assert.ok(Math.abs(events[0].time-(1-.2666)*HOUR)<=5*60000);
 assert.ok(Math.abs(events[1].time-(1+.2666)*HOUR)<=5*60000);
});

test('out-of-range requests return null rather than a guess',()=>{
 const series=discSeries(rows,null,SUN_RADIUS_KM);
 assert.equal(discAt(series,5*HOUR),null);
 assert.equal(discHours(series,0,5*HOUR),null);
 assert.equal(discSeries([],null,SUN_RADIUS_KM),null);
});
