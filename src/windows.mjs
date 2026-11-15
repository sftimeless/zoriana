// Pure helpers for visibility windows. No DOM access, so they are unit tested (tests/windows.test.mjs).
import { DAY, visibleHours, sampleAt } from './ephemeris.mjs';

// Intervals [start, end] in ms during which a body is above the horizon (el > 0), clipped to
// the requested range. Transitions are placed at sample times, so precision equals the row spacing.
export function segments(rows,start,end){
 const out=[];let open=null,last=start;
 for(const r of rows||[]){
  if(r.time<start||r.time>end)continue;
  last=r.time;
  if(r.el>0){if(open===null)open=r.time;}
  else if(open!==null){out.push([open,r.time]);open=null;}
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
