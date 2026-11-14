// Pure helpers for visibility windows. No DOM access, so they are unit tested (tests/windows.test.mjs).
import { DAY, visibleHours } from './ephemeris.mjs';

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
