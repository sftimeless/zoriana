import test from 'node:test';
import assert from 'node:assert/strict';
import {kepler,lambert,tableState,MU_EARTH,MU_MOON,norm,sub,cross,hermite} from '../src/mission/orbit.mjs';
const close=(a,b,eps)=>assert.ok(Math.abs(a-b)<eps,`${a} vs ${b}`);
test('a circular orbit comes a quarter of the way round in a quarter of its period, and returns after one',()=>{const r=6564,v=Math.sqrt(MU_EARTH/r),T=2*Math.PI*Math.sqrt(r**3/MU_EARTH);const q=kepler([r,0,0],[0,v,0],T/4,MU_EARTH);close(q.r[0],0,1e-4);close(q.r[1],r,1e-4);const full=kepler([r,0,0],[0,v,0],T,MU_EARTH);close(full.r[0],r,1e-3);close(full.r[1],0,1e-3);});
test('propagation runs backwards too, and holds for a hyperbola past the Moon',()=>{const r0=[1848.4,0,0],v0=[0,2.52,0];const out=kepler(r0,v0,6*3600,MU_MOON);assert.ok(norm(out.r)>25000);const back=kepler(out.r,out.v,-6*3600,MU_MOON);close(back.r[0],1848.4,1e-3);close(back.r[1],0,1e-3);close(norm(back.v),2.52,1e-6);});
test('the path Lambert finds really does arrive where and when it was asked to',()=>{const r1=[7000,0,0],r2=[-200000,250000,30000],time=2.5*86400;for(const sense of [[0,0,1],[0,0,-1]]){const way=lambert(r1,r2,time,MU_EARTH,sense);assert.ok(way);const end=kepler(r1,way.v1,time,MU_EARTH);assert.ok(norm(sub(end.r,r2))<.5,String(norm(sub(end.r,r2))));close(norm(sub(end.v,way.v2)),0,1e-6);assert.ok(Math.sign(cross(r1,way.v1)[2])===sense[2]);}});
test('table interpolation returns the rows themselves and a smooth value between them',()=>{const rows=[[0,0,0,0,1,0,0],[10000,10,0,0,1,0,0]];assert.deepEqual(tableState(rows,0).r,[0,0,0]);close(tableState(rows,5000).r[0],5,1e-9);assert.equal(tableState(rows,20000),null);close(hermite(0,1,1,1,.5),.5,1e-12);});

// ---- The Apollo 11 flight model, on the real JPL data shipped with the app ----
import {readFileSync} from 'node:fs';
import {createMission,T,R_EARTH,R_MOON,END} from '../src/mission/apollo11.mjs';
const mission=createMission(JSON.parse(readFileSync(new URL('../public/assets/apollo11.json',import.meta.url))));
const earthAlt=t=>norm(mission.craft(t))-R_EARTH,moonAlt=(p,t)=>norm(sub(p,mission.moon(t)))-R_MOON;
test('Apollo 11: the rebuilt climb and parking orbit agree with the published flight',()=>{const c=mission.check;assert.ok(Math.abs(c.downrangeKm-2640)<400,`downrange ${c.downrangeKm}`);assert.ok(Math.abs(c.inclinationDeg-32.5)<2);assert.ok(Math.abs(c.padOffPlaneDeg)<2);close(c.parkPeriodMin,88.2,.3);close(earthAlt(T.orbit+60),185.9,.5);});
test('Apollo 11: the burn toward the Moon ends at the published height and speed',()=>{close(earthAlt(T.tliOff),321,8);close(norm(mission.craftVelocity(T.tliOff+2)),10.84,.05);});
test('Apollo 11: arrival at the Moon, the landing and the return are where the timeline puts them',()=>{close(moonAlt(mission.craft(T.loiOn),T.loiOn),111,.5);close(moonAlt(mission.lander(T.pdi),T.pdi),15.2,.1);assert.ok(norm(sub(mission.lander(T.landing+1),mission.site(T.landing+1)))<.01);close(norm(sub(mission.craft(T.landing),mission.site(T.landing))),111,1);close(earthAlt(T.entry),121.9,1);close(mission.check.entrySpeed,11.03,.15);assert.ok(mission.check.entryAngleDeg<-3&&mission.check.entryAngleDeg>-12,`entry angle ${mission.check.entryAngleDeg}`);assert.ok(Math.abs(earthAlt(T.splash))<.01);assert.ok(norm(sub(mission.craft(T.splash),mission.splashPoint(T.splash)))<.01);});
test('Apollo 11: the lunar orbit is close to the real two-hour one, and the craft never passes through the Moon or the Earth',()=>{for(const h of mission.check.lunarPeriodsH)close(h,1.98,.06);for(let t=T.orbit;t<T.entry;t+=120){assert.ok(earthAlt(t)>100,`Earth at ${t}`);assert.ok(moonAlt(mission.craft(t),t)>100,`Moon at ${t}`);}});
test('Apollo 11: no vehicle jumps where one stretch of the flight hands over to the next',()=>{const joins=[0,T.orbit,T.tliOn,T.tliOff,mission.check.tReal,T.evade,T.loiOn-16*3600,T.loiOn-12*3600,T.loiOn,T.teiOn,T.teiOff,T.teiOn+12*3600,T.teiOn+16*3600,T.entry,T.drogue];for(const t of joins){const gap=norm(sub(mission.craft(t+.01),mission.craft(t-.01)));assert.ok(gap<.5,`craft jumps ${gap} km at ${t}`);}for(const t of [T.pdi,T.landing,T.lmLiftoff,T.lmOrbit]){const gap=norm(sub(mission.lander(t+.01),mission.lander(t-.01)));assert.ok(gap<.5,`lander jumps ${gap} km at ${t}`);}assert.ok(norm(sub(mission.lander(T.doi+.01),mission.craft(T.doi)))<.5);assert.ok(norm(sub(mission.lander(T.redock-.01),mission.craft(T.redock)))<.5);assert.ok(END>T.splash);});

// ---- The replay's list of steps ----
import { STEPS, SEGMENTS, GUIDED_TOTAL, guidedOf, timeOf, stepAt, cameraOf, elapsed } from '../src/mission/steps.mjs';
import { START, curve } from '../src/mission/apollo11.mjs';
test('replay steps: in order, covering the whole flight, each with a caption and a camera',()=>{
 assert.equal(STEPS[0].at,START);
 for(let i=1;i<STEPS.length;i++)assert.ok(STEPS[i].at>STEPS[i-1].at,`step ${i} starts before the one ahead of it`);
 for(const s of STEPS){assert.ok(s.title&&s.text.length>40,s.title);assert.ok(s.cam.f==='route'||(s.cam.d>0&&Number.isFinite(s.cam.az)&&Number.isFinite(s.cam.el)),s.title);}
 for(let i=0;i<STEPS.length;i++)assert.ok(STEPS[i].mark>=(STEPS[i-1]?.at??START)&&STEPS[i].mark<(STEPS[i+1]?.at??END+1),`${STEPS[i].title}: the time shown belongs near the step`);
 for(const s of SEGMENTS)assert.ok(s.t1>s.t0&&s.sec>0,`stretch ${s.t0} to ${s.t1}`);
 assert.equal(SEGMENTS.at(-1).t1,END);assert.ok(GUIDED_TOTAL>240&&GUIDED_TOTAL<360,`guided replay runs ${GUIDED_TOTAL} s`);
});
test('replay steps: the timeline maps to mission time and back, and names the right step and camera',()=>{
 for(const t of [START,0,T.sicSep,T.tliOn,T.loiOn,T.landing,T.firstStep,T.teiOn,T.entry,T.splash])close(timeOf(guidedOf(t)),t,1e-6*Math.max(1,Math.abs(t)));
 let before=-Infinity;for(let g=0;g<=GUIDED_TOTAL;g+=.5){const t=timeOf(g);assert.ok(t>before,`time runs forward at ${g}`);before=t;}
 assert.equal(STEPS[stepAt(T.landing)].title,'The Eagle has landed');assert.equal(STEPS[stepAt(T.firstStep)].title,'First steps');assert.equal(STEPS[stepAt(T.splash)].title,'Splashdown');assert.equal(stepAt(START-5),0);
 const braking=STEPS.find(s=>s.title==='Braking into lunar orbit');assert.ok(cameraOf(braking,T.loiOn-600).d>1000);assert.ok(cameraOf(braking,T.loiOn+10).d<1);
 assert.equal(elapsed(T.landing),'T+ 102:45:40');assert.equal(elapsed(-12),'T− 000:00:12');
});
test('Apollo 11: the rocket leaves the pad slowly, and the cabin comes down slowly under its parachutes',()=>{
 close(earthAlt(0),.086,.001);close(earthAlt(.01),.086,.002);assert.ok(earthAlt(10)<.3,'still close to the tower ten seconds in');
 // Straight up at first, then leaning over: the path over the ground has not left the pad after 10 seconds, and is 93 km out when the first stage is spent.
 const overGround=t=>{const a=mission.craft(t),b=mission.craft(-.001),w=7.2921e-5*t,c=Math.cos(w),s=Math.sin(w),pad=[b[0]*c-b[1]*s,b[0]*s+b[1]*c,b[2]];return Math.acos(Math.min(1,(a[0]*pad[0]+a[1]*pad[1]+a[2]*pad[2])/(norm(a)*norm(pad))))*6378.137;};
 assert.ok(overGround(10)<.02,`drifted ${overGround(10)} km in the first ten seconds`);close(overGround(T.sicCutoff),93,2);assert.ok(overGround(60)<3);
 for(let t=1;t<T.orbit;t+=5)assert.ok(overGround(t+5)>=overGround(t)-1e-6,`moving downrange at ${t}`);close(earthAlt(T.sicCutoff),66,1);
 for(let t=1;t<T.orbit;t+=5)assert.ok(earthAlt(t+5)>=earthAlt(t)-1e-6,`climbing at ${t}`);
 const fall=(earthAlt(T.splash-200)-earthAlt(T.splash-100))/100*1000;assert.ok(fall>7&&fall<12,`falls at ${fall} m/s under the main parachutes`);
 const f=curve([[0,0],[1,1],[2,1],[3,5]]);close(f(1),1,1e-12);assert.ok(f(1.5)>=1-1e-9&&f(1.5)<=1+1e-9,'no overshoot between equal points');close(f(-1),0,1e-12);close(f(9),5,1e-12);
});
test('Apollo 11 data: one whole lap of the Moon at the Moon\'s distance, covering the days of the flight',()=>{
 const lap=JSON.parse(readFileSync(new URL('../public/assets/apollo11.json',import.meta.url))).orbit;assert.ok(lap.length>=100);
 for(const row of lap){const r=Math.hypot(row[1],row[2],row[3]);assert.ok(r>355000&&r<407000,`Moon at ${r} km`);}
 const launch=Date.UTC(1969,6,16,13,32);assert.ok(lap[0][0]<launch&&lap.at(-1)[0]>launch+END*1000);assert.ok((lap.at(-1)[0]-lap[0][0])/86400000>27&&(lap.at(-1)[0]-lap[0][0])/86400000<27.6);
});
test('Apollo 11: the flag goes up during the moonwalk, at the time in NASA\'s timeline',()=>{
 assert.equal(T.flag,110*3600+9*60+43);assert.equal(new Date(Date.UTC(1969,6,16,13,32)+T.flag*1000).toISOString(),'1969-07-21T03:41:43.000Z');
 assert.ok(T.firstStep<T.plaque&&T.plaque<T.flag&&T.flag<T.evaEnd);
 assert.ok(STEPS[stepAt(T.flag)].text.includes('flag'));
});
