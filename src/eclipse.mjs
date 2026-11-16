// Eclipses of the Sun by Earth, as seen from a site on the Moon (a lunar eclipse seen from Earth).
//
// The site's own JPL positions for the Sun and Earth already say where both disks are in its sky.
// When they overlap, Earth hides part or all of the Sun and the site loses sunlight for a few
// hours whatever the terrain. This is plain geometry of two round disks: Earth's atmosphere, which
// bends a little red light into the shadow and makes the real shadow about 2% larger, is ignored.
import { SUN_RADIUS_KM, EARTH_RADIUS_KM, angularRadius } from './disc.mjs';

const RAD=Math.PI/180,MINUTE=60000;
// Unit vector toward a body in the site's east, north, up frame.
const vector=row=>{const e=row.el*RAD,a=row.az*RAD;return [Math.cos(e)*Math.sin(a),Math.cos(e)*Math.cos(a),Math.sin(e)];};

// Share of a disk of radius `small` hidden by a disk of radius `large` whose center is `distance`
// away (any one angular unit). 0 when they do not touch, 1 when the small disk is wholly inside.
export function coveredShare(distance,small,large){
 if(distance>=small+large)return 0;
 if(distance<=Math.abs(large-small))return large>=small?1:(large*large)/(small*small);
 const a=small*small*Math.acos((distance*distance+small*small-large*large)/(2*distance*small));
 const b=large*large*Math.acos((distance*distance+large*large-small*small)/(2*distance*large));
 const c=.5*Math.sqrt((-distance+small+large)*(distance+small-large)*(distance-small+large)*(distance+small+large));
 return (a+b-c)/(Math.PI*small*small);
}

// For every `stepMinutes` across the two ephemerides (which share their sample times):
//   separation  angle between the centers of the Sun and Earth, degrees
//   coverage    share of the Sun's disk hidden by Earth, 0 to 1
//   limb        how far the Sun's center is outside Earth's disk, degrees (negative: behind Earth)
// Directions are interpolated as vectors between the hourly samples, so the result holds up even
// where a body is near the zenith and its azimuth swings quickly.
export function eclipseSeries(sunRows,earthRows,stepMinutes=5){
 if(!sunRows?.length||!earthRows?.length)return null;
 const sun=sunRows.map(vector),earth=earthRows.map(vector),out=[];let i=0;
 const end=Math.min(sunRows.at(-1).time,earthRows.at(-1).time);
 const blend=(vectors,rows,t)=>{const a=vectors[i],b=vectors[i+1]??a,v=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],n=Math.hypot(...v);return v.map(x=>x/n);};
 const range=(rows,t,typical)=>{const a=rows[i].range??typical,b=rows[i+1]?.range??a;return a+(b-a)*t;};
 for(let time=sunRows[0].time;time<=end;time+=stepMinutes*MINUTE){
  while(i<sunRows.length-2&&sunRows[i+1].time<=time)i++;
  const next=sunRows[i+1]?.time??sunRows[i].time,t=next>sunRows[i].time?Math.min(1,(time-sunRows[i].time)/(next-sunRows[i].time)):0;
  const s=blend(sun,sunRows,t),e=blend(earth,earthRows,t);
  const separation=Math.acos(Math.max(-1,Math.min(1,s[0]*e[0]+s[1]*e[1]+s[2]*e[2])))/RAD;
  const sunRadius=angularRadius(SUN_RADIUS_KM,range(sunRows,t,149597870.7)),earthRadius=angularRadius(EARTH_RADIUS_KM,range(earthRows,t,384400));
  out.push({time,separation,coverage:coveredShare(separation,sunRadius,earthRadius),limb:separation-earthRadius});
 }
 return out;
}

// The series value at one moment, interpolated; null outside the series.
export function eclipseAt(series,time){
 if(!series?.length||time<series[0].time||time>series.at(-1).time)return null;
 const step=series[1].time-series[0].time,p=(time-series[0].time)/step,i=Math.min(series.length-2,Math.floor(p)),t=p-i,a=series[i],b=series[i+1];
 return {time,separation:a.separation+(b.separation-a.separation)*t,coverage:a.coverage+(b.coverage-a.coverage)*t,limb:a.limb+(b.limb-a.limb)*t};
}

// Each eclipse in the series: when any of the Sun is covered (start to end), the moment of
// greatest coverage, that coverage, and the stretch of totality if the Sun is wholly hidden.
// Times are good to one series step.
export function eclipseEvents(series){
 const events=[];let open=null;
 for(const s of series||[]){
  if(s.coverage>0){
   open??={start:s.time,end:s.time,peak:s.time,maxCoverage:0,totalStart:null,totalEnd:null};
   open.end=s.time;if(s.coverage>open.maxCoverage){open.maxCoverage=s.coverage;open.peak=s.time;}
   if(s.coverage>=.9999){open.totalStart??=s.time;open.totalEnd=s.time;}
  }else if(open){events.push(open);open=null;}
 }
 if(open)events.push(open);
 return events;
}
