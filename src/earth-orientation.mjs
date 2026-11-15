// Which way the Earth is turned, as seen from the Moon-fixed frame the app draws in.
//
// Chain: Earth-fixed --(Earth rotation angle)--> ICRF --(IAU lunar rotation model)--> Moon-fixed.
// The lunar model is the IAU WGCCRE series for the Moon's pole and prime meridian (the
// approximation recommended for the mean-Earth/polar-axis frame, good to roughly 150 m on the
// surface). Earth's precession, nutation and polar motion are ignored, which costs about 0.15° in
// 2026: invisible on a globe drawn about 50 pixels wide. This only orients the Earth picture;
// the directions of the Sun and Earth themselves come from JPL Horizons.
const RAD=Math.PI/180,DAY=86400000,J2000=Date.UTC(2000,0,1,12),TT_MINUS_UTC=69184; // ms; valid while no new leap second is added

// Passive (frame) rotations about z and x, as 3x3 row arrays.
const r3=a=>{const c=Math.cos(a),s=Math.sin(a);return [[c,s,0],[-s,c,0],[0,0,1]];};
const r1=a=>{const c=Math.cos(a),s=Math.sin(a);return [[1,0,0],[0,c,s],[0,-s,c]];};
const multiply=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((sum,v,k)=>sum+v*b[k][j],0)));
const transpose=m=>m[0].map((_,j)=>m.map(row=>row[j]));
export const apply=(m,v)=>m.map(row=>row[0]*v[0]+row[1]*v[1]+row[2]*v[2]);

// Right ascension and declination of the Moon's north pole and the prime-meridian angle W (radians).
export function lunarRotationElements(time){
 const d=(time+TT_MINUS_UTC-J2000)/DAY,T=d/36525;
 const E=[0,125.045-.0529921*d,250.089-.1059842*d,260.008+13.0120009*d,176.625+13.3407154*d,357.529+.9856003*d,311.589+26.4057084*d,134.963+13.0649930*d,276.617+.3287146*d,34.226+1.7484877*d,15.134-.1589763*d,119.743+.0036096*d,239.961+.1643573*d,25.053+12.9590088*d].map(x=>x*RAD);
 const s=i=>Math.sin(E[i]),c=i=>Math.cos(E[i]);
 const alpha=269.9949+.0031*T-3.8787*s(1)-.1204*s(2)+.0700*s(3)-.0172*s(4)+.0072*s(6)-.0052*s(10)+.0043*s(13);
 const delta=66.5392+.0130*T+1.5419*c(1)+.0239*c(2)-.0278*c(3)+.0068*c(4)-.0029*c(6)+.0009*c(7)+.0008*c(10)-.0009*c(13);
 const W=38.3213+13.17635815*d-1.4e-12*d*d+3.5610*s(1)+.1208*s(2)-.0642*s(3)+.0158*s(4)+.0252*s(5)-.0066*s(6)-.0047*s(7)-.0046*s(8)+.0028*s(9)+.0052*s(10)+.0040*s(11)+.0019*s(12)-.0044*s(13);
 return {alpha:alpha*RAD,delta:delta*RAD,W:W*RAD};
}
// Matrix taking ICRF vectors to the Moon-fixed frame (x through 0° longitude, z through the north pole).
export function moonFromIcrf(time){
 const {alpha,delta,W}=lunarRotationElements(time);
 return multiply(r3(W),multiply(r1(Math.PI/2-delta),r3(Math.PI/2+alpha)));
}
// Earth rotation angle (radians): how far the Greenwich meridian has turned from the ICRF x axis.
export function earthRotationAngle(time){
 const turns=.7790572732640+1.00273781191135448*(time-J2000)/DAY;
 return 2*Math.PI*(turns-Math.floor(turns));
}
// Matrix taking Earth-fixed vectors (x through 0°N 0°E, z through the north pole) to the Moon-fixed frame.
export function moonFromEarthFixed(time){
 return multiply(moonFromIcrf(time),transpose(r3(earthRotationAngle(time))));
}
// The same rotation expressed for the renderer, whose globes use x = 0° longitude, y = north,
// -z = 90° east. Returns a row-major 3x3 for a mesh whose texture is a standard world map.
export function earthMeshRotation(time){
 const toRenderer=[[1,0,0],[0,0,1],[0,-1,0]];
 return multiply(toRenderer,multiply(moonFromEarthFixed(time),transpose(toRenderer)));
}
// Geographic latitude and east longitude (degrees) of the point on Earth that faces a given
// Moon-fixed direction, for example the direction from Earth toward the Moon.
export function earthPointFacing(time,moonFixedDirection){
 const [x,y,z]=apply(transpose(moonFromEarthFixed(time)),moonFixedDirection);
 return {lat:Math.asin(Math.max(-1,Math.min(1,z)))/RAD,lon:Math.atan2(y,x)/RAD};
}
