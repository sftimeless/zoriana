import test from 'node:test';
import assert from 'node:assert/strict';
import {bestLandingTime,segments,span,gaps,longest,landingDays,bestLandingDay,together,stayMetrics,compassPoint,staySentence} from '../src/windows.mjs';
import {nextCrossing} from '../src/ephemeris.mjs';
const H=3600000,rows=els=>els.map((el,i)=>({time:i*H,az:0,el}));
test('segments finds each interval above the horizon',()=>{const found=segments(rows([-1,2,3,-1,-2,4,5,-3]),0,7*H),expected=[[H/3,2.75*H],[4*H+H/3,6.625*H]];assert.equal(found.length,2);found.flat().forEach((t,i)=>assert.ok(Math.abs(t-expected.flat()[i])<1));});
test('segments keeps an interval open to the end of the range',()=>{assert.deepEqual(segments(rows([-1,1,1,1]),0,3*H),[[.5*H,3*H]]);});
test('segments clips to the requested range and ignores samples outside it',()=>{assert.deepEqual(segments(rows([1,1,1,1,1,-1,1]),2*H,4*H),[[2*H,4*H]]);});
test('segments returns nothing for a body that never rises, empty input or missing rows',()=>{assert.deepEqual(segments(rows([-1,-2,-3]),0,2*H),[]);assert.deepEqual(segments([],0,H),[]);assert.deepEqual(segments(null,0,H),[]);});
test('a body exactly on the horizon is not counted as visible',()=>{assert.deepEqual(segments(rows([0,0,0]),0,2*H),[]);});
test('segment hours match the banner countdown for the same crossing',()=>{const r=rows([2,2,-2,-2]);const c=nextCrossing(r,0);assert.equal(c.rising,false);assert.equal(c.time,1.5*H);assert.equal(span(c.time-0),'1 h 30 m');});
test('span formats days, hours and minutes',()=>{assert.equal(span(94*H),'3 d 22 h');assert.equal(span(12*H+46*60000),'12 h 46 m');assert.equal(span(9*60000),'9 min');assert.equal(span(H),'1 h 00 m');assert.equal(span(24*H),'1 d 0 h');});
test('span never shows a negative countdown',()=>{assert.equal(span(-5000),'0 min');assert.equal(span(29000),'0 min');assert.equal(span(31000),'1 min');});
const D=24*H,series=(hours,f)=>Array.from({length:hours+1},(_,i)=>({time:i*H,az:0,el:f(i)}));
test('gaps returns the dark stretches between and around sunlit intervals',()=>{assert.deepEqual(gaps([[2,4],[6,8]],0,10),[[0,2],[4,6],[8,10]]);assert.deepEqual(gaps([],0,10),[[0,10]]);assert.deepEqual(gaps([[0,10]],0,10),[]);});
test('longest picks the longest interval and handles an empty list',()=>{assert.deepEqual(longest([[0,2],[5,11],[12,13]]),[5,11]);assert.equal(longest([]),null);});
test('landing-day scores integrate each stay window and stop at the end of the series',()=>{
 const sun=series(10*24,i=>i>=5*24?1:-1),earth=series(10*24,()=>1),scores=landingDays(sun,earth,0,10,72);
 assert.equal(scores.length,10);assert.equal(scores[0].sun,0);assert.equal(scores[0].earth,72);
 assert.ok(Math.abs(scores[3].sun-24.5)<1e-9,'third-day landing catches the last day plus half the crossing hour');assert.equal(scores[5].sun,72);assert.equal(scores[7].sun,72);
 assert.equal(scores[8],null);assert.equal(scores[9],null);
});
test('best landing day prefers sunlight, then Earth visibility, then the earliest date',()=>{
 assert.equal(bestLandingDay([{day:0,sun:10,earth:72},{day:1,sun:40,earth:0},null]).day,1);
 assert.equal(bestLandingDay([{day:0,sun:40,earth:10},{day:1,sun:40,earth:30},{day:2,sun:40,earth:30}]).day,1);
 assert.equal(bestLandingDay([null,null]),null);
});
test('together is up only while both bodies are up',()=>{
 const sun=rows([2,2,2,-2,-2]),earth=rows([-1,3,3,3,3]),both=together(sun,earth);
 assert.deepEqual(both.map(r=>r.el),[-1,2,2,-2,-2]);
 assert.deepEqual(together(sun,[]),[]);
 // Rows on a different time grid are interpolated onto the first body's times.
 assert.deepEqual(together(rows([1,1,1]),[{time:0,az:0,el:4},{time:2*H,az:0,el:0}]).map(r=>r.el),[1,1,0]);
});
test('stay metrics count sunlight, Earth view and the overlap, and average the Sun height while lit',()=>{
 // 48 hours: Sun up for the first 24 h, Earth up for the last 36 h, so both for hours 12-24.
 const sun=series(48,i=>i<24?1:-1),earth=series(48,i=>i>=12?1:-1),sunTrue=series(48,i=>i<24?10:-10),m=stayMetrics(sun,earth,sunTrue,0,48*H);
 assert.ok(Math.abs(m.sun-23.5)<1e-9);assert.ok(Math.abs(m.earth-36.5)<1e-9);assert.ok(Math.abs(m.both-12)<1e-9);
 assert.ok(m.both<=Math.min(m.sun,m.earth));assert.equal(m.sunHeight,10);assert.equal(m.sunPeak,10);
 const dark=stayMetrics(series(48,()=>-1),earth,series(48,()=>-5),0,48*H);
 assert.equal(dark.sun,0);assert.equal(dark.both,0);assert.equal(dark.sunHeight,null);
 assert.equal(stayMetrics(sun,earth,sunTrue,0,72*H),null,'a stay longer than the series has no result');
});
test('compass words follow the azimuth and wrap at north',()=>{
 assert.equal(compassPoint(0),'north');assert.equal(compassPoint(77.5),'east-northeast');assert.equal(compassPoint(180),'south');assert.equal(compassPoint(349),'north');assert.equal(compassPoint(-90),'west');
});
test('stay sentences say the same thing as the numbers',()=>{
 assert.equal(staySentence({sun:72,earth:72,both:72},72),'Sunlit for the whole stay. Earth in view throughout.');
 assert.equal(staySentence({sun:0,earth:72,both:0},72),'No direct sunlight during the stay. Earth in view throughout.');
 assert.equal(staySentence({sun:72,earth:16.04,both:16.04},72),'Sunlit for the whole stay. Earth in view for about 16 of 72 hours. Both at once for about 16 hours.');
 assert.equal(staySentence({sun:12.1,earth:32.6,both:12.1},72),'Sunlit for about 12 of 72 hours. Earth in view for about 33 of 72 hours. Both at once for about 12 hours.');
 assert.equal(staySentence({sun:20,earth:0,both:0},24),'Sunlit for about 20 of 24 hours. Earth never in view, so no direct line to Earth.');
});
test('segments and nextCrossing place a rise at the same instant',()=>{const r=rows([-3,1,2,2]);assert.equal(segments(r,0,3*H)[0][0],nextCrossing(r,0).time);});
test('bestLandingTime prefers Sun and Earth together, then sunlight, then the earliest hour',()=>{
 const sun=rows([-1,-1,1,1,1,1,-1,-1,-1,-1]),earth=rows([1,1,1,1,-1,-1,-1,-1,-1,-1]);
 const best=bestLandingTime(sun,earth,0,1,2);          // 2-hour stays: only hours 2-4 have both
 assert.equal(best.hour,2);assert.ok(Math.abs(best.both-1.5)<1e-6,`both ${best.both}`);
 const never=bestLandingTime(rows([-1,-1,-1,-1]),rows([1,1,1,1]),0,1,1);
 assert.equal(never.hour,0);assert.equal(never.both,0);  // nothing to choose between: the earliest
 assert.equal(bestLandingTime(sun,earth,0,1,20),null);  // no stay fits in the series
});
