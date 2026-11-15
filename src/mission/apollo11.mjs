// Apollo 11, July 16 to 24, 1969: where each vehicle was at any moment of the mission, for the replay.
//
// What is real and what is reconstructed:
//   Real      the times of every event (NASA SP-4029, "Apollo by the Numbers", Apollo 11 timeline);
//             the Moon's and Sun's positions (JPL Horizons);
//             the path of the third stage (S-IVB) from 18 minutes after its burn toward the Moon
//             (JPL Horizons, reconstruction by D. R. Adamo), which the spacecraft shared until it
//             pulled away from the stage 4 h 40 min into the flight;
//             the landing site and the splashdown point.
//   Rebuilt   everything between those anchors, as unpowered two-body paths that pass through them
//             at the published times: the climb to orbit and the parking orbit (fitted to the plane and
//             timing of the real S-IVB path), the coast to the Moon and the coast home (Lambert arcs
//             around the Earth joined to hyperbolas around the Moon), a circular lunar orbit over the
//             landing site, and smooth curves for the descent, ascent, rendezvous and re-entry.
// It is an illustration of the flight plan as flown, good to the published times, not a navigation record.
//
// Positions are km from Earth's centre in the ICRF frame; t is seconds since liftoff (ground elapsed time).
import { MU_EARTH, MU_MOON, add, sub, scale, dot, cross, norm, unit, lerp, smooth, hermite, kepler, lambert, tableState } from './orbit.mjs';
import { moonFromIcrf, earthRotationAngle, apply } from '../earth-orientation.mjs';

export const LAUNCH=Date.UTC(1969,6,16,13,32,0);
const get=(h,m,s)=>h*3600+m*60+s;
// Ground elapsed times, from the NASA timeline.
export const T={
 sicCutoff:get(0,2,41.63),sicSep:get(0,2,41.71),tower:get(0,3,17.9),siiCutoff:get(0,9,3.7),siiSep:get(0,9,8.22),orbit:get(0,11,39.41),
 tliOn:get(2,44,16.2),tliOff:get(2,50,3.03),csmSep:get(3,15,23),dock:get(3,24,3.7),lmEject:get(4,17,3),evade:get(4,40,1.72),
 loiOn:get(75,49,50.37),loiOff:get(75,55,47.9),circular:get(80,11,36.75),undock:get(100,12,0),doi:get(101,36,14),pdi:get(102,33,5.01),landing:get(102,45,39.9),
 evaStart:get(109,7,33),firstStep:get(109,24,15),evaEnd:get(111,39,13),lmLiftoff:get(124,22,.79),lmOrbit:get(124,29,15.67),redock:get(128,3,0),lmJettison:get(130,9,31.2),
 teiOn:get(135,23,42.28),teiOff:get(135,26,13.69),cmSep:get(194,49,12.7),entry:get(195,3,5.7),drogue:get(195,12,6.9),splash:get(195,18,35)};
export const END=T.splash+90,START=-12;
export const R_EARTH=6378.137,R_MOON=1737.4;
const RAD=Math.PI/180;
export const PAD={lat:28.608,lon:-80.604},SITE={lat:.67416,lon:23.47314},SPLASH={lat:13.317,lon:-169.15};
// Where the command module met the atmosphere (122 km up). An approximate point about 2,800 km short of splashdown.
const ENTRY_POINT={lat:-3.19,lon:171.96,alt:121.9};
const PARK_ALT=185.9,LUNAR_ALT=111,PDI_ALT=15.2,PDI_RANGE=480,LM_INSERT_ALT=18,LM_INSERT_RANGE=290;
const transpose=m=>m[0].map((_,j)=>m.map(row=>row[j]));
const sphere=(lat,lon)=>[Math.cos(lat*RAD)*Math.cos(lon*RAD),Math.cos(lat*RAD)*Math.sin(lon*RAD),Math.sin(lat*RAD)];
const rotZ=(v,a)=>{const c=Math.cos(a),s=Math.sin(a);return [v[0]*c-v[1]*s,v[0]*s+v[1]*c,v[2]];};
// A smooth curve through points [x, y] that never overshoots them (monotone cubic interpolation).
export function curve(points){
 const n=points.length,d=[],m=[];
 for(let i=0;i<n-1;i++)d.push((points[i+1][1]-points[i][1])/(points[i+1][0]-points[i][0]));
 for(let i=0;i<n;i++)m.push(i===0?d[0]:i===n-1?d[n-2]:d[i-1]*d[i]<=0?0:2*d[i-1]*d[i]/(d[i-1]+d[i]));
 return x=>{
  if(x<=points[0][0])return points[0][1];if(x>=points[n-1][0])return points[n-1][1];
  let i=0;while(x>points[i+1][0])i++;
  const h=points[i+1][0]-points[i][0];return hermite(points[i][1],m[i]*h,points[i+1][1],m[i+1]*h,(x-points[i][0])/h);
 };
}
// Height of the flight path's reference point above the ground during the climb, km against seconds: slow off
// the pad, 66 km when the first stage is spent, close to orbital height when the second is. The reference point is
// 60 m up the stack, and the stack stands on its launch platform, whose deck is 26 m above the ground.
export const PAD_HEIGHT=.026;
const CLIMB=curve([[0,.06+PAD_HEIGHT],[3,.071+PAD_HEIGHT],[6,.103+PAD_HEIGHT],[9,.157+PAD_HEIGHT],[12,.233+PAD_HEIGHT],[30,1.6],[60,7.4],[80,13.6],[120,37],[161.6,66],[240,112],[320,146],[400,168],[480,180],[548,184.5],[T.orbit,PARK_ALT]]);

export function createMission(data){
 const utc=t=>LAUNCH+t*1000;
 const moonAt=t=>tableState(data.moon,utc(t))??tableState(data.moon,Math.max(data.moon[0][0],Math.min(data.moon.at(-1)[0],utc(t))));
 const sivbAt=t=>tableState(data.sivb,utc(t));
 const moonToIcrf=t=>transpose(moonFromIcrf(utc(t)));
 // A point fixed to the Earth (unit vector or scaled), turned into the ICRF frame at time t.
 const earthFixed=(v,t)=>rotZ(v,earthRotationAngle(utc(t)));

 // ---- Leaving Earth: the real S-IVB path fixes the orbit plane and the timing ----
 const tReal=(data.sivb[0][0]-LAUNCH)/1000,real0=sivbAt(tReal);
 const departure=t=>kepler(real0.r,real0.v,t-tReal,MU_EARTH);      // the same unpowered path, run back to the end of the burn
 const cutoff=departure(T.tliOff),e1=unit(cutoff.r),n=unit(cross(real0.r,real0.v)),e2=cross(n,e1);
 const inPlane=a=>add(scale(e1,Math.cos(a)),scale(e2,Math.sin(a))),angleOf=p=>Math.atan2(dot(p,e2),dot(p,e1));
 const rPark=R_EARTH+PARK_ALT,wPark=Math.sqrt(MU_EARTH/rPark**3),wCut=norm(cross(cutoff.r,cutoff.v))/dot(cutoff.r,cutoff.r);
 const aIgnition=-(wPark+wCut)/2*(T.tliOff-T.tliOn);                // angle travelled during the burn, at the mean of the rates before and after
 const parkAngle=t=>aIgnition+wPark*(t-T.tliOn);
 // The climb: from the pad, which turns with the Earth, into the orbit plane by the time of insertion.
 const padDirection=t=>earthFixed(sphere(PAD.lat,PAD.lon),t);
 const aInsert=parkAngle(T.orbit);
 // Over the ground the rocket rises straight up for the first seconds, then leans over along a great circle from the
 // pad to the point beneath it at insertion. Distance over the ground, km against seconds, follows the shape of the
 // real climb: about 2 km by the speed of sound, 93 km when the first stage is spent, 1,640 km when the second is.
 const fixed=(v,t)=>rotZ(v,-earthRotationAngle(utc(t)));                      // ICRF to the turning Earth
 const padFixed=sphere(PAD.lat,PAD.lon),insertFixed=fixed(inPlane(aInsert),T.orbit),climbArc=Math.acos(dot(padFixed,insertFixed)),climbKm=climbArc*R_EARTH;
 const RANGE=curve([[0,0],[12,0],[30,.15],[66,1.9],[83,5.6],[135,46],[161.6,93],[240,305],[320,576],[400,900],[480,1277],[548,1640],[T.orbit-20,climbKm-7.35*20],[T.orbit,climbKm]]);
 function ascent(t){
  const f=RANGE(Math.max(0,t))/climbKm,ground=add(scale(padFixed,Math.sin((1-f)*climbArc)/Math.sin(climbArc)),scale(insertFixed,Math.sin(f*climbArc)/Math.sin(climbArc)));
  return earthFixed(scale(ground,R_EARTH+CLIMB(Math.max(0,t))),t);
 }
 function burnToMoon(t){
  const w=smooth((t-T.tliOn)/(T.tliOff-T.tliOn)),free=departure(t).r,a=parkAngle(t)+(angleOf(free)-parkAngle(t))*w;
  return scale(inPlane(a),rPark+(norm(free)-rPark)*w);
 }

 // ---- Around the Moon: a circle over the landing site, in the Moon's own turning frame ----
 const site=sphere(SITE.lat,SITE.lon),west=scale(unit(cross([0,0,1],site)),-1);
 const ring=a=>add(scale(site,Math.cos(a)),scale(west,Math.sin(a))),ringAhead=a=>add(scale(site,-Math.sin(a)),scale(west,Math.cos(a)));
 let aFar=0;for(let a=0,best=2;a<2*Math.PI;a+=.0005){const x=ring(a)[0];if(x<best){best=x;aFar=a;}}   // where the ring passes behind the Moon
 const rOrbit=R_MOON+LUNAR_ALT;
 const w1=(13*2*Math.PI+(2*Math.PI-aFar))/(T.landing-T.loiOn),w2=(16*2*Math.PI+aFar)/(T.teiOn-T.landing);
 const csmAngle=t=>t<=T.landing?-w1*(T.landing-t):w2*(t-T.landing);
 const aroundMoon=(t,a,alt)=>add(moonAt(t).r,apply(moonToIcrf(t),scale(ring(a),R_MOON+alt)));
 const lunarOrbit=t=>aroundMoon(t,csmAngle(t),LUNAR_ALT);

 // ---- Arriving: a hyperbola around the Moon that ends where the orbit begins, joined to an arc from the Earth ----
 const JOIN=14*3600,BLEND=2*3600;
 const relIn={r:apply(moonToIcrf(T.loiOn),scale(ring(csmAngle(T.loiOn)),rOrbit)),v:apply(moonToIcrf(T.loiOn),scale(ringAhead(csmAngle(T.loiOn)),2.52))};
 const approach=t=>add(moonAt(t).r,kepler(relIn.r,relIn.v,t-T.loiOn,MU_MOON).r);
 const tJoinOut=T.loiOn-JOIN,fromStage=sivbAt(T.evade).r,joinOut=approach(tJoinOut);
 const sense=cross(real0.r,real0.v);
 const out=lambert(fromStage,joinOut,tJoinOut-T.evade,MU_EARTH,sense);
 const outbound=t=>kepler(fromStage,out.v1,t-T.evade,MU_EARTH).r;
 function coastOut(t){
  if(t<tJoinOut-BLEND)return outbound(t);
  if(t>tJoinOut+BLEND)return approach(t);
  return lerp(outbound(t),approach(t),smooth((t-(tJoinOut-BLEND))/(2*BLEND)));
 }
 // ---- Leaving the Moon and coming home ----
 const relOut={r:apply(moonToIcrf(T.teiOn),scale(ring(csmAngle(T.teiOn)),rOrbit)),v:apply(moonToIcrf(T.teiOn),scale(ringAhead(csmAngle(T.teiOn)),2.63))};
 const departMoon=t=>add(moonAt(t).r,kepler(relOut.r,relOut.v,t-T.teiOn,MU_MOON).r);
 const tJoinBack=T.teiOn+JOIN,joinBack=departMoon(tJoinBack);
 const entryPoint=earthFixed(scale(sphere(ENTRY_POINT.lat,ENTRY_POINT.lon),R_EARTH+ENTRY_POINT.alt),T.entry);
 const towardSplash=sub(earthFixed(sphere(SPLASH.lat,SPLASH.lon),T.entry),unit(entryPoint));
 // Of the two ways round, take the one that arrives heading for the splashdown point.
 const ways=[[0,0,1],[0,0,-1]].map(s=>lambert(joinBack,entryPoint,T.entry-tJoinBack,MU_EARTH,s)).filter(Boolean);
 const back=ways.sort((a,b)=>dot(unit(b.v2),unit(towardSplash))-dot(unit(a.v2),unit(towardSplash)))[0];
 const inbound=t=>kepler(joinBack,back.v1,t-tJoinBack,MU_EARTH).r;
 function coastBack(t){
  if(t<T.teiOff)return lerp(lunarOrbit(t),departMoon(t),smooth((t-T.teiOn)/(T.teiOff-T.teiOn)));
  if(t<tJoinBack-BLEND)return departMoon(t);
  if(t>tJoinBack+BLEND)return inbound(t);
  return lerp(departMoon(t),inbound(t),smooth((t-(tJoinBack-BLEND))/(2*BLEND)));
 }
 // Re-entry: along the ground track from the entry point to splashdown, fast at first, turning with the Earth.
 const entryFixed=sphere(ENTRY_POINT.lat,ENTRY_POINT.lon),splashFixed=sphere(SPLASH.lat,SPLASH.lon),arc=Math.acos(dot(entryFixed,splashFixed));
 // Nearly all the distance is covered before the small parachutes open 7.3 km up; they slow the fall to 3.2 km,
 // where the three main parachutes take over for the last five and a half minutes.
 const glide=T.drogue-T.entry,power=Math.max(1.5,Math.min(4,norm(back.v2)*glide/(arc*R_EARTH)));
 function reentry(t){
  const x=Math.min(1,(t-T.entry)/glide),f=1-(1-x)**power,fall=t-T.drogue;
  const alt=fall<0?7.3+(ENTRY_POINT.alt-7.3)*(1-x)**1.6:fall<48?7.3-4.1*fall/48:3.2*(1-(fall-48)/(T.splash-T.drogue-48));
  const ground=add(scale(entryFixed,Math.sin((1-f)*arc)/Math.sin(arc)),scale(splashFixed,Math.sin(f*arc)/Math.sin(arc)));
  return earthFixed(scale(ground,R_EARTH+Math.max(0,alt)),t);
 }

 // ---- The command ship (with whatever is attached to it) ----
 function craft(t){
  if(t<=0)return scale(padDirection(t),R_EARTH+.06+PAD_HEIGHT);
  if(t<T.orbit)return ascent(t);
  if(t<T.tliOn)return scale(inPlane(parkAngle(t)),rPark);
  if(t<T.tliOff)return burnToMoon(t);
  if(t<tReal)return departure(t).r;
  if(t<T.evade)return sivbAt(t).r;
  if(t<T.loiOn)return coastOut(t);
  if(t<T.teiOn)return lunarOrbit(t);
  if(t<T.entry)return coastBack(t);
  if(t<T.splash)return reentry(t);
  return earthFixed(scale(splashFixed,R_EARTH),t);
 }
 // ---- The lunar module, from the moment it flies its own path ----
 const wPdi=1.695/(R_MOON+PDI_ALT),aPdi=-PDI_RANGE/R_MOON,aInsertLm=LM_INSERT_RANGE/R_MOON,wInsertLm=1.69/(R_MOON+LM_INSERT_ALT);
 const turns=Math.round((csmAngle(T.lmOrbit)-aInsertLm)/(2*Math.PI))*2*Math.PI;
 function lander(t){
  if(t<T.doi||(t>=T.redock&&t<T.lmJettison))return null;                              // riding with the command ship
  if(t<T.pdi){const d=T.pdi-T.doi,s=(t-T.doi)/d;return aroundMoon(t,hermite(csmAngle(T.doi),w1*d,aPdi,wPdi*d,s),PDI_ALT+(LUNAR_ALT-PDI_ALT)*(1+Math.cos(Math.PI*s))/2);}
  if(t<T.landing){const d=T.landing-T.pdi,s=(t-T.pdi)/d;return aroundMoon(t,hermite(aPdi,wPdi*d,0,0,s),PDI_ALT*(1-s)**2.2);}
  if(t<T.lmLiftoff)return aroundMoon(t,0,0);
  if(t<T.lmOrbit){const d=T.lmOrbit-T.lmLiftoff,s=(t-T.lmLiftoff)/d;return aroundMoon(t,hermite(0,0,aInsertLm,wInsertLm*d,s),LM_INSERT_ALT*Math.sin(Math.PI/2*s));}
  if(t<T.redock){const d=T.redock-T.lmOrbit,s=(t-T.lmOrbit)/d;return aroundMoon(t,hermite(aInsertLm+turns,wInsertLm*d,csmAngle(T.redock),w2*d,s),LM_INSERT_ALT+(LUNAR_ALT-LM_INSERT_ALT)*smooth(s/.85));}
  return aroundMoon(t,csmAngle(Math.min(t,T.teiOn))+w2*Math.max(0,t-T.teiOn)-4e-6*(t-T.lmJettison),LUNAR_ALT);   // left in lunar orbit, falling slowly behind
 }
 const velocity=(f,t)=>{const a=f(t-1),b=f(t+1);return a&&b?scale(sub(b,a),.5):[0,0,0];};
 return {
  craft,lander,
  stage:t=>t<tReal?craft(t):sivbAt(t)?.r??null,
  site:t=>aroundMoon(t,0,0),
  moon:t=>moonAt(t).r,
  moonToIcrf,
  earthAngle:t=>earthRotationAngle(utc(t)),
  sun:t=>{const rows=data.sun,time=Math.max(rows[0][0],Math.min(rows.at(-1)[0],utc(t)));let i=0;while(i<rows.length-2&&rows[i+1][0]<=time)i++;const s=(time-rows[i][0])/(rows[i+1][0]-rows[i][0]);return unit(lerp(rows[i].slice(1),rows[i+1].slice(1),s));},
  craftVelocity:t=>velocity(craft,t),
  landerVelocity:t=>velocity(lander,t),
  splashPoint:t=>earthFixed(scale(splashFixed,R_EARTH),t),
  // Numbers worth checking, used by the tests and shown nowhere else.
  check:{tReal,downrangeKm:climbKm,padOffPlaneDeg:Math.asin(dot(padDirection(0),n))/RAD,inclinationDeg:Math.acos(n[2])/RAD,parkPeriodMin:2*Math.PI/wPark/60,lunarPeriodsH:[2*Math.PI/w1/3600,2*Math.PI/w2/3600],aFarDeg:aFar/RAD,
   outSpeed:norm(out.v1),entrySpeed:norm(back.v2),entryAngleDeg:Math.asin(dot(unit(back.v2),unit(entryPoint)))/RAD}
 };
}
