// Compares single event times from the app with what a real lander saw on the Moon:
// Firefly's Blue Ghost Mission 1 at 18.56°N 61.81°E, March 2025.
//
//  1. The eclipse of March 14, 2025. Firefly reported its first look at the eclipse "around
//     12:30 am CDT" (05:30 UTC) and photographed the diamond ring, the Sun about to come out
//     from behind Earth, "around 3:30 am CDT" (08:30 UTC). The contact times for the Moon as a
//     whole (UTC) were penumbra 03:57 to 10:00, partial 05:09 to 08:48, total 06:26 to 07:32.
//     A site on the trailing side of the Moon, like this one, enters each shadow last.
//  2. Lunar sunset on March 16, 2025. Firefly said the lander "operated just over 5 hours into
//     the lunar night with the final data received around 6:15 pm CDT" (23:15 UTC), which puts
//     the start of its night shortly before 18:15 UTC.
//
// Needs the server running: node scripts/check-event-times.mjs
import {writeFile} from 'node:fs/promises';
import {clearanceSeries} from '../src/terrain-math.mjs';
import {nextCrossing} from '../src/ephemeris.mjs';
import {discSeries,SUN_RADIUS_KM} from '../src/disc.mjs';
import {eclipseSeries,eclipseEvents} from '../src/eclipse.mjs';
import {crossingSpread} from '../src/windows.mjs';
const base=process.env.ZORIANA_URL||'http://127.0.0.1:4174',iso=t=>new Date(t).toISOString().slice(0,16)+'Z',at=s=>Date.parse(`2025-03-14T${s}Z`);
const minutes=(a,b)=>Math.round((a-b)/60000);
const d=await fetch(`${base}/api/ephemeris?lat=18.560000&lon=61.810000&date=2025-03-01&reference=0`).then(r=>r.json());
if(d.error)throw new Error(d.error);

const e=eclipseEvents(eclipseSeries(d.sun,d.earth)).find(x=>iso(x.start).startsWith('2025-03-14'));
const within=(t,a,b)=>t>=at(a)&&t<=at(b);
const eclipse={
 published:{firefly:{firstLook:'2025-03-14T05:30Z',diamondRingAsTotalityEnds:'2025-03-14T08:30Z',note:'both given as "around", in CDT'},wholeMoonContactsUTC:{penumbra:['03:57','10:00'],partial:['05:09','08:48'],total:['06:26','07:32']}},
 app:{sunStartsToBeCovered:iso(e.start),totalityStarts:iso(e.totalStart),totalityEnds:iso(e.totalEnd),sunFullyClear:iso(e.end),stepMinutes:5},
 checks:{
  totalityEndsMinusFireflyDiamondRingMinutes:minutes(e.totalEnd,at('08:30')),
  coverStartsBeforeFireflyFirstLook:e.start<=at('05:30'),
  coverStartsWhilePenumbraCrossesMoon:within(e.start,'03:57','05:09'),
  totalityStartsWhileUmbraCrossesMoon:within(e.totalStart,'05:09','06:26'),
  totalityEndsWhileUmbraLeavesMoon:within(e.totalEnd,'07:32','08:48'),
  clearWhilePenumbraLeavesMoon:within(e.end,'08:48','10:00')}};

const sun=clearanceSeries(d.sun,d.terrain),from=Date.parse('2025-03-15T00:00Z'),set=nextCrossing(sun,from),spread=crossingSpread(sun,set,.1);
const smooth=nextCrossing(d.sun.map(r=>({...r,clearance:r.el})),from);
const disc=discSeries(d.sun,d.terrain,SUN_RADIUS_KM).filter(s=>s.time>from);
const dim=disc.find((s,i)=>i&&s.fraction<.999&&disc[i-1].fraction>=.999),last=disc.find((s,i)=>i&&s.fraction<=.001&&disc[i-1].fraction>.001);
const night=Date.parse('2025-03-16T18:15Z'),late=t=>+((t-night)/3600000).toFixed(1);
const sunset={
 published:{firefly:'final data around 2025-03-16T23:15Z, just over 5 hours into the lunar night',impliedStartOfNight:'shortly before 2025-03-16T18:15Z'},
 app:{sunStartsToBeCovered:iso(dim.time),centreSets:iso(set.time),plusMinusMinutesFor0p1DegreeOfSkyline:spread?Math.round(spread.minutes):null,lastLight:iso(last.time),centreSetsOnSmoothSphere:iso(smooth.time)},
 hoursLaterThanFirefly:{sunStartsToBeCovered:late(dim.time),centreSets:late(set.time),lastLight:late(last.time)}};

const result={site:'Blue Ghost Mission 1, 18.56°N 61.81°E',terrain:d.terrain.source,eclipse,sunset};
console.log(JSON.stringify(result,null,1));
await writeFile(new URL('../data/event-check.json',import.meta.url),JSON.stringify({generated:new Date().toISOString(),sources:['https://fireflyspace.com/news/firefly-aerospace-successfully-completes-14-days-of-surface-operations-on-the-moon','https://spacepolicyonline.com/news/fireflys-dazzling-images-of-earth-eclipsing-the-sun/','https://en.wikipedia.org/wiki/March_2025_lunar_eclipse'],...result},null,1)+'\n');
