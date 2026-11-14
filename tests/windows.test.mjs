import test from 'node:test';
import assert from 'node:assert/strict';
import {segments,span,gaps,longest,landingDays,bestLandingDay} from '../src/windows.mjs';
import {nextCrossing} from '../src/ephemeris.mjs';
const H=3600000,rows=els=>els.map((el,i)=>({time:i*H,az:0,el}));
test('segments finds each interval above the horizon',()=>{assert.deepEqual(segments(rows([-1,2,3,-1,-2,4,5,-3]),0,7*H),[[1*H,3*H],[5*H,7*H]]);});
test('segments keeps an interval open to the end of the range',()=>{assert.deepEqual(segments(rows([-1,1,1,1]),0,3*H),[[1*H,3*H]]);});
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
