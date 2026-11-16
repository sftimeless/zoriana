// The Apollo 11 flight as a sequence of steps: when each begins, what to say about it, where the guided
// camera sits, and how long the guided replay spends on it. No DOM access, so the list is unit tested.
//
// Times in the captions are the published ones (NASA SP-4029, Apollo 11 timeline). Figures such as speeds,
// masses and sizes are the commonly published values, rounded.
import { T, START, END } from './apollo11.mjs';

// cam: f = what the camera watches ('craft', 'lander', 'site' or 'route' for the whole route),
//      d = distance in km, az = degrees round from directly behind, el = degrees above the local horizontal.
// cams: later cameras within the same step, as [from this time, cam].
// pov: where the onboard view looks first.
// pace: [[until this time, seconds], ...], then sec for the rest of the step. Seconds are real seconds in the guided replay.
export const STEPS=[
 {at:START,mark:0,title:'Liftoff',sec:12,cam:{f:'craft',d:.47,az:150,el:-5},pov:'back',
  text:'July 16, 1969, 13:32 UTC. Five engines lift the 111 m Saturn V off Pad 39A in Florida with Neil Armstrong, Buzz Aldrin and Michael Collins on top. The rocket weighs about 2,900 tonnes, nearly all of it propellant.'},
 {at:45,mark:45,title:'First stage',sec:8,cam:{f:'craft',d:.7,az:135,el:10},pov:'back',
  text:'The first stage burns about 13 tonnes of kerosene and liquid oxygen every second. Its whole job takes 2 minutes 42 seconds.'},
 {at:150,mark:T.sicSep,title:'Staging',sec:9,cam:{f:'craft',d:.55,az:152,el:16},pov:'back',
  text:'About 66 km up, the empty first stage drops away and falls into the Atlantic. The five engines of the second stage take over, burning liquid hydrogen and oxygen.'},
 {at:192,mark:T.tower,title:'Escape tower away',sec:5,cam:{f:'craft',d:.22,az:62,el:8},pov:'nose',
  text:'The tower on the nose could have pulled the crew clear of a failing rocket. This high up it is no longer needed, so it is thrown off, taking the cover over the cabin with it.'},
 {at:215,mark:215,title:'Second stage',sec:6,cam:{f:'craft',d:.8,az:140,el:14},pov:'back',
  text:'For six minutes the second stage pushes the ship to 185 km up and nearly 25,000 km/h.'},
 {at:T.siiCutoff-25,mark:T.siiSep,title:'Third stage to orbit',pace:[[T.siiSep+30,8]],sec:5,cam:{f:'craft',d:.42,az:150,el:16},pov:'back',
  text:'The second stage drops away in its turn. The single engine of the third stage burns for two and a half minutes to reach the speed an orbit needs.'},
 {at:T.orbit+20,mark:T.orbit,title:'Earth orbit',sec:10,cam:{f:'craft',d:5200,az:215,el:28},pov:'ahead',
  text:'Eleven minutes 39 seconds after liftoff the engine stops. Apollo 11 is in orbit 186 km up at 28,000 km/h, with the third stage and its remaining propellant still attached. The crew spend one and a half orbits checking the ship.'},
 {at:T.tliOn-40,mark:T.tliOn,title:'Leaving for the Moon',pace:[[T.tliOff+40,10]],sec:3,cam:{f:'craft',d:.2,az:150,el:12},pov:'back',
  text:'The third stage fires again for 5 minutes 47 seconds, raising the speed from 28,000 to 39,000 km/h. That is enough to coast all the way to the Moon. From here Earth’s gravity slows the ship the whole way out.'},
 {at:T.csmSep-30,mark:T.csmSep,title:'Turn around and dock',pace:[[T.dock+40,13]],sec:3,cam:{f:'craft',d:.085,az:62,el:14},pov:'nose',
  text:'The lunar module has ridden up inside the adapter beneath the command ship. Collins pulls the command ship, Columbia, clear; the four panels fall away; then he turns around and docks nose to nose with the lander, Eagle.'},
 {at:T.lmEject-40,mark:T.lmEject,title:'Pulling the lander out',pace:[[T.lmEject+500,8]],sec:4,cam:{f:'craft',d:.12,az:75,el:12},pov:'back',
  text:'Springs push the joined spacecraft out of the spent third stage. The stage is then steered away; it swung past the Moon and has circled the Sun ever since. The thin white line is its real path, from JPL.'},
 {at:T.evade+600,mark:T.evade+600,title:'Three days of coasting',sec:14,cam:{f:'route'},pov:'moon',
  text:'For 71 hours the main engines are silent. The ship slows from 39,000 km/h to about 3,000 as it climbs away from Earth, then speeds up again as the Moon pulls it in. The blue line is the way out.'},
 {at:T.loiOn-2400,mark:T.loiOn,title:'Braking into lunar orbit',pace:[[T.loiOn-60,5],[T.loiOff+120,9]],sec:2,cam:{f:'craft',d:5200,az:205,el:24},cams:[[T.loiOn-60,{f:'craft',d:.1,az:105,el:10}]],pov:'moon',
  text:'Behind the Moon and out of radio contact, Columbia’s main engine fires against the direction of travel for 5 minutes 58 seconds. That slows the ship enough for the Moon to hold it. Had the engine not fired, the path would have swung round the Moon and back to Earth.'},
 {at:T.loiOff+300,mark:T.circular,title:'In lunar orbit',sec:9,cam:{f:'craft',d:4600,az:240,el:34},pov:'down',
  text:'A second short burn rounds the orbit off about 110 km above the surface: one lap every two hours, 30 laps in all. Armstrong and Aldrin move into Eagle and switch it on.'},
 {at:T.undock-120,mark:T.undock,title:'Eagle undocks',pace:[[T.undock+900,9]],sec:4,cam:{f:'craft',d:.1,az:70,el:15},pov:'lander',
  text:'Eagle separates with Armstrong and Aldrin aboard. Collins stays in Columbia and looks the lander over as it turns in front of his windows. He will orbit alone for nearly 28 hours.'},
 {at:T.doi-60,mark:T.doi,title:'Dropping lower',pace:[[T.doi+200,5]],sec:5,cam:{f:'lander',d:900,az:215,el:25},pov:'window',
  text:'On the far side again, Eagle fires its descent engine for 30 seconds. Half an orbit later that has brought it down to 15 km above the surface, with the landing site 480 km ahead.'},
 {at:T.pdi-60,mark:T.pdi,title:'Powered descent',sec:16,cam:{f:'lander',d:38,az:158,el:18},cams:[[T.landing-200,{f:'lander',d:.28,az:150,el:12}]],pov:'window',
  text:'The engine burns for twelve and a half minutes, first to kill the orbital speed, then to lower Eagle gently. The computer raises overload alarms, and it is steering toward a crater strewn with boulders, so Armstrong takes over the steering and flies on past it.'},
 {at:T.landing-45,mark:T.landing,title:'The Eagle has landed',pace:[[T.landing+30,10]],sec:5,cam:{f:'lander',d:.045,az:62,el:8},pov:'window',
  text:'Touchdown in the Sea of Tranquility: July 20, 1969, 20:17:40 UTC, with less than a minute of descent fuel left. “Houston, Tranquility Base here. The Eagle has landed.”'},
 {at:T.firstStep-120,mark:T.firstStep,title:'First steps',pace:[[T.firstStep+1500,8],[T.flag+420,5]],sec:4,cam:{f:'site',d:.032,az:40,el:6},pov:'window',
  text:'July 21, 02:56 UTC: Armstrong steps onto the surface, and Aldrin follows 19 minutes later. In two and a half hours outside they set up experiments, collect 21.5 kg of rock and soil, and plant a United States flag. A plaque on the lander’s leg reads: “We came in peace for all mankind.” One experiment, a laser reflector, is still in use.'},
 {at:T.lmLiftoff-60,mark:T.lmLiftoff,title:'Liftoff from the Moon',pace:[[T.lmLiftoff+150,9]],sec:5,cam:{f:'lander',d:.06,az:70,el:10},cams:[[T.lmLiftoff+150,{f:'lander',d:600,az:215,el:25}]],pov:'window',
  text:'After 21 hours 36 minutes on the surface, the top half of Eagle lifts off, using the bottom half as its launch pad. Its single engine has no backup. Seven minutes later Eagle is back in orbit.'},
 {at:T.redock-900,mark:T.redock,title:'Rendezvous and docking',pace:[[T.redock+200,9]],sec:3,cam:{f:'craft',d:.1,az:70,el:15},pov:'lander',
  text:'Eagle spends three and a half hours catching up with Columbia, then the two dock. The astronauts and the boxes of samples move across to Columbia.'},
 {at:T.lmJettison-60,mark:T.lmJettison,title:'Eagle left behind',pace:[[T.lmJettison+400,7]],sec:3,cam:{f:'craft',d:.12,az:70,el:14},pov:'lander',
  text:'Its work done, Eagle’s upper stage is cast off in lunar orbit. Where it ended up is not known.'},
 {at:T.teiOn-200,mark:T.teiOn,title:'Heading home',pace:[[T.teiOn-30,3],[T.teiOff+60,8]],sec:3,cam:{f:'craft',d:5000,az:205,el:24},cams:[[T.teiOn-30,{f:'craft',d:.09,az:115,el:10}]],pov:'moon',
  text:'Behind the Moon for the last time, Columbia’s engine fires for 2 minutes 31 seconds. It is the only way home: the burn speeds the ship up enough to escape the Moon and fall back toward Earth.'},
 {at:T.teiOff+400,mark:T.teiOff+400,title:'The fall back to Earth',sec:13,cam:{f:'route'},pov:'earth',
  text:'Two and a half days of coasting, gathering speed the whole way. The orange line is the way home. It has to meet the atmosphere at a shallow angle: too steep and the cabin burns up, too shallow and it skips back out to space.'},
 {at:T.cmSep-90,mark:T.cmSep,title:'Only the cabin comes home',pace:[[T.cmSep+200,8]],sec:3,cam:{f:'craft',d:.07,az:115,el:15},pov:'earth',
  text:'The service module, with the engine and the supplies, is cast off. Of the 2,900 tonnes that left the pad, what returns is a cabin 3.9 m wide weighing about 5.5 tonnes. It turns its heat shield forward.'},
 {at:T.entry-60,mark:T.entry,title:'Re-entry',sec:11,cam:{f:'craft',d:.07,az:62,el:8},pov:'ahead',
  text:'Columbia meets the air 122 km up at 39,700 km/h. The heat shield reaches about 2,800 °C, and a sheath of glowing gas cuts off radio contact for about three minutes. The crew are pressed into their couches at more than six times their weight.'},
 {at:T.drogue-15,mark:T.drogue,title:'Parachutes',sec:9,cam:{f:'craft',d:.16,az:60,el:2},pov:'nose',
  text:'Small parachutes open about 7 km up to steady the cabin. Then three main parachutes, each 25 m across, slow it to about 35 km/h.'},
 {at:T.splash-12,mark:T.splash,title:'Splashdown',sec:9,cam:{f:'craft',d:.06,az:50,el:6},pov:'ahead',
  text:'July 24, 16:50:35 UTC, in the Pacific about 1,500 km southwest of Hawaii and 24 km from the recovery ship, USS Hornet. The flight lasted 8 days, 3 hours, 18 minutes and 35 seconds.'}
];

// The guided replay as stretches of mission time, each given a number of real seconds.
export const SEGMENTS=[];
STEPS.forEach((step,i)=>{
 const end=STEPS[i+1]?.at??END;let from=step.at;
 for(const [until,sec] of step.pace??[]){SEGMENTS.push({t0:from,t1:until,sec,step:i});from=until;}
 SEGMENTS.push({t0:from,t1:end,sec:step.sec,step:i});
});
{let g=0;for(const s of SEGMENTS){s.g0=g;g+=s.sec;}}
export const GUIDED_TOTAL=SEGMENTS.at(-1).g0+SEGMENTS.at(-1).sec;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const last=(list,test)=>{for(let i=list.length-1;i>=0;i--)if(test(list[i]))return list[i];return list[0];};
// Mission time to seconds into the guided replay, and back.
export const guidedOf=t=>{const s=last(SEGMENTS,x=>t>=x.t0);return s.g0+s.sec*clamp((t-s.t0)/(s.t1-s.t0),0,1);};
export const timeOf=g=>{const s=last(SEGMENTS,x=>g>=x.g0);return s.t0+(s.t1-s.t0)*clamp((g-s.g0)/s.sec,0,1);};
export const stepAt=t=>{let i=0;while(i<STEPS.length-1&&t>=STEPS[i+1].at)i++;return i;};
export const cameraOf=(step,t)=>{let cam=step.cam;for(const [from,c] of step.cams??[])if(t>=from)cam=c;return cam;};
// "102:45:40" for ground elapsed time, and the date and time in UTC.
export function elapsed(t){const s=Math.abs(Math.round(t)),h=Math.floor(s/3600),m=Math.floor(s%3600/60);return `T${t<0?'−':'+'} ${String(h).padStart(3,'0')}:${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
