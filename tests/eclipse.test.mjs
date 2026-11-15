import test from 'node:test';
import assert from 'node:assert/strict';
import { coveredShare, eclipseSeries, eclipseAt, eclipseEvents } from '../src/eclipse.mjs';
import { LUNAR_ECLIPSES, nextListedEclipse } from '../src/eclipse-catalog.mjs';

const HOUR=3600000;

test('covered share: apart, touching, half-way and wholly inside',()=>{
 assert.equal(coveredShare(2,.27,.95),0);                       // far apart
 assert.equal(coveredShare(.27+.95,.27,.95),0);                 // just touching
 assert.equal(coveredShare(.5,.27,.95),1);                      // Sun wholly behind Earth
 assert.equal(coveredShare(.95-.27,.27,.95),1);                 // inner contact
 assert.ok(Math.abs(coveredShare(1000,1,1000)-.5)<1e-3);          // a nearly straight edge through the centre hides half
 const equal=coveredShare(1,1,1);                               // two equal discs one radius apart: 39.1%
 assert.ok(Math.abs(equal-(2*Math.PI/3-Math.sqrt(3)/2)/Math.PI)<1e-9);
 assert.ok(coveredShare(.9,.27,.95)>coveredShare(1.0,.27,.95)); // closer covers more
});

// Earth fixed at azimuth 90°, elevation 30°; the Sun passes straight through it at 0.5° per hour,
// starting 2° to one side. Radii at these distances: Sun 0.2666°, Earth 0.9507°.
const earthRows=Array.from({length:9},(_,i)=>({time:i*HOUR,az:90,el:30,range:384400}));
const sunRows=Array.from({length:9},(_,i)=>({time:i*HOUR,az:90,el:28+i*.5,range:149597870.7}));

test('a Sun passing behind Earth: contact times, totality and the limb',()=>{
 const series=eclipseSeries(sunRows,earthRows);
 assert.equal(series.length,97);
 assert.ok(Math.abs(series[0].separation-2)<1e-6);
 assert.ok(Math.abs(eclipseAt(series,4*HOUR).separation)<1e-6);            // dead centre at 4 h
 assert.equal(eclipseAt(series,4*HOUR).coverage,1);
 assert.ok(Math.abs(eclipseAt(series,4*HOUR).limb+.9507)<.001);            // centre is one Earth radius inside
 const [event]=eclipseEvents(series);
 // First contact when the centres are 1.2173° apart: 0.7827° travelled, 1.565 h. Last contact 6.435 h.
 assert.ok(Math.abs(event.start-1.565*HOUR)<=5*60000,`start ${event.start/HOUR}`);
 assert.ok(Math.abs(event.end-6.435*HOUR)<=5*60000,`end ${event.end/HOUR}`);
 // Totality while the centres are within 0.6841°: 2.632 h to 5.368 h.
 assert.ok(Math.abs(event.totalStart-2.632*HOUR)<=5*60000&&Math.abs(event.totalEnd-5.368*HOUR)<=5*60000);
 assert.equal(event.maxCoverage,1);
 assert.equal(eclipseEvents(series).length,1);
});

test('no eclipse when the Sun stays clear of Earth; empty input is handled',()=>{
 const far=sunRows.map(r=>({...r,az:140}));
 assert.deepEqual(eclipseEvents(eclipseSeries(far,earthRows)),[]);
 assert.ok(eclipseSeries(far,earthRows).every(s=>s.coverage===0&&s.limb>30));
 assert.equal(eclipseSeries([],earthRows),null);
 assert.equal(eclipseAt(null,0),null);
 assert.equal(eclipseAt(eclipseSeries(sunRows,earthRows),99*HOUR),null);
});

test('directions near the zenith are interpolated as vectors, not as azimuths',()=>{
 // Both bodies within a degree of straight up, on opposite sides: 1.2° apart, yet their azimuths differ by 180°.
 const e=[0,1].map(i=>({time:i*HOUR,az:0,el:89.4,range:384400})),s=[0,1].map(i=>({time:i*HOUR,az:180,el:89.4,range:149597870.7}));
 const series=eclipseSeries(s,e);
 assert.ok(series.every(x=>Math.abs(x.separation-1.2)<1e-6));
});

test('NASA eclipse list: in order, covers 2026 to 2035, and points to the next one',()=>{
 assert.equal(LUNAR_ECLIPSES.length,23);
 assert.ok(LUNAR_ECLIPSES.every((e,i)=>i===0||e.time>LUNAR_ECLIPSES[i-1].time));
 assert.ok(LUNAR_ECLIPSES.every(e=>['Total','Partial','Penumbral'].includes(e.kind)&&Number.isFinite(e.time)));
 assert.equal(nextListedEclipse(Date.UTC(2026,10,15)).date,'2027-02-20');
 assert.equal(nextListedEclipse(Date.UTC(2028,11,30)).kind,'Total');
 assert.equal(nextListedEclipse(Date.UTC(2040,0,1)),null);
});
