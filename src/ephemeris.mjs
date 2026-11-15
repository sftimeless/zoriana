export const DAY = 86400000;
export function parseHorizons(text) {
  const body = text.split('$$SOE')[1]?.split('$$EOE')[0];
  if (!body) throw new Error('JPL did not return an ephemeris table.');
  const rows = body.trim().split('\n').filter(Boolean).map(line => {
    const c = line.split(',').map(s => s.trim());
    const jd = Number(c[0]), az = Number(c[3]), el = Number(c[4]);
    if (![jd, az, el].every(Number.isFinite) || !c[3] || !c[4]) throw new Error('Invalid JPL sample.');
    return { time: Math.round((jd - 2440587.5) * DAY / 1000) * 1000, az, el };
  });
  if (rows.length < 2) throw new Error('Insufficient JPL samples.');
  return rows;
}
export function sampleAt(rows, time) {
  if (!rows?.length || time < rows[0].time || time > rows.at(-1).time) return null;
  let i = rows.findIndex(r => r.time >= time);
  if (i <= 0) return rows[0];
  const a=rows[i-1], b=rows[i], t=(time-a.time)/(b.time-a.time);
  const delta=((b.az-a.az+540)%360)-180;
  return {time, az:(a.az+delta*t+360)%360, el:a.el+(b.el-a.el)*t};
}
export function visibleHours(rows, start, end) {
  if (!sampleAt(rows,start) || !sampleAt(rows,end)) return null;
  const points=[sampleAt(rows,start), ...rows.filter(r=>r.time>start&&r.time<end),sampleAt(rows,end)];
  let ms=0;
  for(let i=1;i<points.length;i++) {
    const a=points[i-1],b=points[i],dt=b.time-a.time;
    if(a.el>0&&b.el>0) ms+=dt;
    else if(a.el>0||b.el>0) ms+=dt*(Math.max(a.el,b.el)/Math.abs(b.el-a.el));
  }
  return ms/3600000;
}
export function nextCrossing(rows, time) {
  const first=sampleAt(rows,time);
  if(!first) return null;
  const points=[first,...rows.filter(r=>r.time>time)];
  for(let i=1;i<points.length;i++) {
    const a=points[i-1],b=points[i];
    if((a.el>0)!==(b.el>0)) return {time:a.time+(b.time-a.time)*(-a.el)/(b.el-a.el),rising:b.el>a.el};
  }
  return null;
}
export function coordinatesToVector(lat,lon) {
  const p=lat*Math.PI/180,l=lon*Math.PI/180;
  return [Math.cos(p)*Math.cos(l),Math.sin(p),-Math.cos(p)*Math.sin(l)];
}
// Direction of a body from the Moon's centre, given its direction from a surface site and its
// distance in Moon radii. For Earth the two differ by up to about 0.26° (parallax); for the Sun
// the difference is negligible.
export function centredDirection(lat,lon,az,el,distance) {
  const site=coordinatesToVector(lat,lon),toBody=skyDirection(lat,lon,az,el);
  const v=site.map((s,i)=>s+toBody[i]*distance),length=Math.hypot(...v);
  return v.map(x=>x/length);
}
export function skyDirection(lat,lon,az,el) {
  const r=Math.PI/180,p=lat*r,l=lon*r,a=az*r,e=el*r;
  const up=coordinatesToVector(lat,lon);
  const north=[-Math.sin(p)*Math.cos(l),Math.cos(p),Math.sin(p)*Math.sin(l)];
  const east=[-Math.sin(l),0,-Math.cos(l)];
  return up.map((v,i)=>v*Math.sin(e)+Math.cos(e)*(north[i]*Math.cos(a)+east[i]*Math.sin(a)));
}
