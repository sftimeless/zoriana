// The Sun and Earth as discs rather than points.
//
// Everything else in the app asks one question: is the center of the body above the skyline?
// From the Moon the Sun is about 0.53° wide and Earth about 1.9°, and near the poles the Sun skims
// the horizon so slowly that "part of the disc showing" can last for hours. These helpers measure
// how much of the disc clears the terrain skyline. The disc is treated as a plain circle of uniform
// brightness (no limb darkening), cut by the skyline sampled at each strip's own azimuth.
import { sampleAt } from './ephemeris.mjs';
import { horizonAt } from './terrain-math.mjs';

const RAD=Math.PI/180,HOUR=3600000;
export const SUN_RADIUS_KM=695700,EARTH_RADIUS_KM=6378.137;
const TYPICAL_RANGE_KM={[SUN_RADIUS_KM]:149597870.7,[EARTH_RADIUS_KM]:384400};

// Half the apparent width of a body, in degrees, seen from `rangeKm` away.
export const angularRadius=(bodyRadiusKm,rangeKm)=>Math.asin(Math.min(1,bodyRadiusKm/rangeKm))/RAD;

// Share of a disc (0 to 1) above a skyline. `horizon(az)` gives the skyline elevation in degrees.
export function discFraction(az,el,radius,horizon,strips=15){
 const stretch=1/Math.max(.05,Math.cos(el*RAD)); // a degree across the sky spans more azimuth higher up
 let seen=0,total=0;
 for(let i=0;i<strips;i++){
  const x=((i+.5)/strips*2-1)*radius,half=Math.sqrt(radius*radius-x*x);
  seen+=Math.max(0,Math.min(2*half,el+half-horizon(az+x*stretch)));total+=2*half;
 }
 return seen/total;
}

// Disc share every `stepMinutes` across an ephemeris. `profile` is the terrain horizon, or null
// for the flat reference horizon. Rows without a JPL distance fall back to a typical one.
export function discSeries(rows,profile,bodyRadiusKm,stepMinutes=5){
 if(!rows?.length)return null;
 const horizon=profile?.angles?.length?az=>horizonAt(profile,az):()=>0,result=[];
 for(let time=rows[0].time;time<=rows.at(-1).time;time+=stepMinutes*60000){
  const s=sampleAt(rows,time),radius=angularRadius(bodyRadiusKm,s.range??TYPICAL_RANGE_KM[bodyRadiusKm]);
  result.push({time,fraction:discFraction(s.az,s.el,radius,horizon),radius});
 }
 return result;
}

// Disc share at one moment, interpolated between series samples.
export function discAt(series,time){
 if(!series?.length||time<series[0].time||time>series.at(-1).time)return null;
 const step=series[1].time-series[0].time,p=(time-series[0].time)/step,i=Math.min(series.length-2,Math.floor(p)),t=p-i;
 return series[i].fraction*(1-t)+series[i+1].fraction*t;
}

// Hours within [start,end] with the whole disc showing, with any of it showing, and the
// disc-weighted total ("equivalent full-disc hours": half a disc for two hours counts as one).
export function discHours(series,start,end){
 if(!series?.length||start<series[0].time||end>series.at(-1).time)return null;
 let full=0,any=0,equivalent=0;const FULL=.999,NONE=.001;
 for(let i=1;i<series.length;i++){
  const a=series[i-1],b=series[i],from=Math.max(a.time,start),to=Math.min(b.time,end);if(to<=from)continue;
  const dt=to-from,fa=a.fraction,fb=b.fraction;
  equivalent+=dt*(fa+fb)/2;
  // An interval that starts or ends a phase is split evenly: the step is only five minutes.
  full+=dt*((fa>=FULL)+(fb>=FULL))/2;any+=dt*((fa>NONE)+(fb>NONE))/2;
 }
 return {full:full/HOUR,any:any/HOUR,equivalent:equivalent/HOUR};
}

// The next changes of phase after `time`: 'first' light (disc starts to show), 'full' (all of it
// clear), 'dim' (it starts to be covered) and 'last' light (it disappears). Times are good to one
// series step.
export function limbEvents(series,time,limit=2){
 if(!series?.length)return [];
 const phase=f=>f<=.001?0:f>=.999?2:1,events=[];
 for(let i=1;i<series.length&&events.length<limit;i++){
  const b=series[i];if(b.time<=time)continue;
  const from=phase(series[i-1].fraction),to=phase(b.fraction);if(from===to)continue;
  if(from===0)events.push({time:b.time,kind:'first'});
  if(to===2)events.push({time:b.time,kind:'full'});
  if(from===2)events.push({time:b.time,kind:'dim'});
  if(to===0)events.push({time:b.time,kind:'last'});
 }
 return events.slice(0,limit);
}
