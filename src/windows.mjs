// Pure helpers for visibility windows. No DOM access, so they are unit tested (tests/windows.test.mjs).
import { DAY, visibleHours, sampleAt } from './ephemeris.mjs';

// Intervals [start, end] in ms during which a body is above the horizon (el > 0), clipped to
// the requested range. Each rise and set is placed where a straight line between the two
// neighbouring samples crosses zero, the same rule nextCrossing uses, so the two always agree.
export function segments(rows,start,end){
 const out=[];let open=null,last=start,previous=null;
 const crossing=(a,b)=>a.time+(b.time-a.time)*(-a.el)/(b.el-a.el);
 for(const r of rows||[]){
  if(r.time>end)break;
  if(r.time>=start){
   last=r.time;
   if(r.el>0){if(open===null)open=previous&&previous.el<=0?Math.max(start,crossing(previous,r)):r.time;}
   else if(open!==null){out.push([open,previous&&previous.el>0?crossing(previous,r):r.time]);open=null;}
  }
  previous=r;
 }
 if(open!==null)out.push([open,last]);
 return out;
}

// Countdown text: "3 d 22 h", "12 h 46 m" or "9 min". Negative spans read as zero.
export function span(ms){
 const m=Math.max(0,Math.round(ms/60000)),d=Math.floor(m/1440),h=Math.floor(m%1440/60),mm=m%60;
 return d?`${d} d ${h} h`:h?`${h} h ${String(mm).padStart(2,'0')} m`:`${mm} min`;
}

// The complement of a sorted interval list inside [start, end]: for sunlight, the dark stretches.
export function gaps(intervals,start,end){
 const out=[];let t=start;
 for(const [a,b] of intervals){if(a>t)out.push([t,a]);t=Math.max(t,b);}
 if(t<end)out.push([t,end]);
 return out;
}

// The longest interval in a list, or null when the list is empty.
export function longest(intervals){
 let best=null;
 for(const interval of intervals)if(!best||interval[1]-interval[0]>best[1]-best[0])best=interval;
 return best;
}

// Sunlit and Earth-visible hours of a stay of stayHours for each possible landing day (00:00 UTC
// starts). Entries are null where the stay would run past the end of the series.
export function landingDays(sunRows,earthRows,start,days,stayHours){
 const out=[];
 for(let d=0;d<days;d++){
  const from=start+d*DAY,to=from+stayHours*3600000,sun=visibleHours(sunRows,from,to),earth=visibleHours(earthRows,from,to);
  out.push(sun===null||earth===null?null:{day:d,start:from,sun,earth});
 }
 return out;
}

// Most sunlight wins; Earth visibility breaks ties; the earliest day wins a full tie.
export function bestLandingDay(scores){
 let best=null;
 for(const s of scores){
  if(!s)continue;
  if(!best||s.sun>best.sun+1e-6||(Math.abs(s.sun-best.sun)<=1e-6&&s.earth>best.earth+1e-6))best=s;
 }
 return best;
}

// How much a rise or set time depends on the skyline being exactly right. Given the crossing
// found by nextCrossing, returns the times at which the body is `delta` degrees below and above
// the skyline either side of it. If the terrain model's skyline were `delta` too low or too high,
// the true rise or set would fall at one of those times. `minutes` is half the gap between them.
// Returns null when the body does not reach both levels within `limitHours` of the crossing, as
// when it skims along the skyline.
export function crossingSpread(rows,crossing,delta=.1,limitHours=72){
 if(!rows?.length||!crossing)return null;
 const limit=limitHours*3600000,sign=crossing.rising?1:-1; // rising: -delta comes first, then +delta
 const reach=(target,direction)=>{ // direction -1 searches back in time, +1 forward
  const at=rows.findIndex(r=>r.time>=crossing.time);if(at<0)return null;
  // Pairs of neighbouring samples, starting with the pair that holds the crossing itself.
  for(let i=direction<0?at:Math.max(0,at-1);(direction<0?i>=1:i<rows.length-1)&&Math.abs(rows[i].time-crossing.time)<=limit;i+=direction){
   const a=direction<0?rows[i-1]:rows[i],b=direction<0?rows[i]:rows[i+1];
   if((a.el-target)*(b.el-target)<=0&&a.el!==b.el)return a.time+(b.time-a.time)*(target-a.el)/(b.el-a.el);
  }
  return null;
 };
 const before=reach(-sign*delta,-1),after=reach(sign*delta,1);
 if(before===null||after===null)return null;
 return {before,after,minutes:(after-before)/120000};
}

// The best hour to land within `days` days of `start`: the stay with the most hours of Sun and
// Earth together; more sunlight breaks ties; the earliest hour wins a full tie. Stays that would
// run past the end of the series are not considered.
export function bestLandingTime(sunRows,earthRows,start,days,stayHours){
 const both=together(sunRows,earthRows);let best=null;
 for(let hour=0;hour<days*24;hour++){
  const from=start+hour*3600000,to=from+stayHours*3600000,shared=visibleHours(both,from,to);
  if(shared===null)break;
  const sun=visibleHours(sunRows,from,to);
  if(!best||shared>best.both+1e-6||(Math.abs(shared-best.both)<=1e-6&&sun>best.sun+1e-6))best={start:from,hour,both:shared,sun,earth:visibleHours(earthRows,from,to)};
 }
 return best;
}

// Rows whose elevation is the lower of two bodies at each time, so it is above zero only while
// both are up. Used for "Sun and Earth together": power and a direct link at the same moment.
export function together(a,b){
 if(!a?.length||!b?.length)return [];
 const aligned=a.length===b.length&&a[0].time===b[0].time&&a.at(-1).time===b.at(-1).time;
 const out=[];
 for(let i=0;i<a.length;i++){const other=aligned?b[i]:sampleAt(b,a[i].time);if(other)out.push({time:a[i].time,az:a[i].az,el:Math.min(a[i].el,other.el)});}
 return out;
}

// The numbers used to rank a stay: hours of sunlight, hours with Earth in view, hours with both
// at once, and the Sun's average and highest elevation while the site is sunlit. `sunRows` and
// `earthRows` are relative to the chosen horizon (terrain or flat); `sunTrueRows` carries the
// Sun's real elevation. Returns null when the series does not cover the stay.
export function stayMetrics(sunRows,earthRows,sunTrueRows,start,end){
 const sun=visibleHours(sunRows,start,end),earth=visibleHours(earthRows,start,end),both=visibleHours(together(sunRows,earthRows),start,end);
 if(sun===null||earth===null||both===null)return null;
 let total=0,count=0,peak=-Infinity;
 for(const r of sunTrueRows||[]){
  if(r.time<start||r.time>end)continue;
  const lit=sampleAt(sunRows,r.time);
  if(lit&&lit.el>0){total+=r.el;count++;peak=Math.max(peak,r.el);}
 }
 return {sun,earth,both,sunHeight:count?total/count:null,sunPeak:count?peak:null};
}

// Compass words for an azimuth, to the nearest of 16 points.
const POINTS=['north','north-northeast','northeast','east-northeast','east','east-southeast','southeast','south-southeast','south','south-southwest','southwest','west-southwest','west','west-northwest','northwest','north-northwest'];
export const compassPoint=az=>POINTS[Math.round(((az%360+360)%360)/22.5)%16];

// One or two plain sentences describing a stay, from the same numbers the tables show.
export function staySentence(metrics,stayHours){
 const total=Math.round(stayHours),all=h=>h>=stayHours-.05,none=h=>h<=.05;
 const sun=all(metrics.sun)?'Sunlit for the whole stay':none(metrics.sun)?'No direct sunlight during the stay':`Sunlit for about ${Math.round(metrics.sun)} of ${total} hours`;
 const earth=all(metrics.earth)?'Earth in view throughout':none(metrics.earth)?'Earth never in view, so no direct line to Earth':`Earth in view for about ${Math.round(metrics.earth)} of ${total} hours`;
 const mixed=!none(metrics.sun)&&!none(metrics.earth)&&!(all(metrics.sun)&&all(metrics.earth));
 return `${sun}. ${earth}.${mixed?` Both at once for about ${Math.round(metrics.both)} hours.`:''}`;
}
