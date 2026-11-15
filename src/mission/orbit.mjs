// Two-body orbit tools for the mission replay. Positions in km, velocities in km/s, times in seconds.
// No DOM access, so they are unit tested (tests/mission.test.mjs).
export const MU_EARTH=398600.4418,MU_MOON=4902.800066;
export const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],scale=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
export const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm=a=>Math.hypot(a[0],a[1],a[2]),unit=a=>scale(a,1/(norm(a)||1));
export const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
export const smooth=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
// Cubic through two values with given slopes (slopes are per unit of s, which runs 0 to 1).
export const hermite=(p0,m0,p1,m1,s)=>{const s2=s*s,s3=s2*s;return (2*s3-3*s2+1)*p0+(s3-2*s2+s)*m0+(-2*s3+3*s2)*p1+(s3-s2)*m1;};

// Stumpff functions C(z) and S(z).
const stumpC=z=>z>1e-6?(1-Math.cos(Math.sqrt(z)))/z:z<-1e-6?(Math.cosh(Math.sqrt(-z))-1)/-z:.5-z/24;
const stumpS=z=>{if(z>1e-6){const s=Math.sqrt(z);return (s-Math.sin(s))/(s*s*s);}if(z<-1e-6){const s=Math.sqrt(-z);return (Math.sinh(s)-s)/(s*s*s);}return 1/6-z/120;};

// Where a body is after dt seconds of unpowered flight around one centre (universal-variable Kepler
// propagation; works for circles, ellipses and hyperbolas, forwards and backwards).
export function kepler(r0,v0,dt,mu){
 if(dt===0)return {r:[...r0],v:[...v0]};
 const r0m=norm(r0),vr0=dot(r0,v0)/r0m,alpha=2/r0m-dot(v0,v0)/mu,root=Math.sqrt(mu);
 let chi=root*Math.abs(alpha)*dt;
 if(alpha<=0)chi=Math.sign(dt)*Math.sqrt(-1/alpha)*Math.log(Math.max(1e-9,(-2*mu*alpha*dt)/(dot(r0,v0)+Math.sign(dt)*Math.sqrt(-mu/alpha)*(1-r0m*alpha))));
 if(!Number.isFinite(chi))chi=root*Math.abs(alpha)*dt;
 for(let i=0;i<80;i++){
  const z=alpha*chi*chi,C=stumpC(z),S=stumpS(z);
  const F=r0m*vr0/root*chi*chi*C+(1-alpha*r0m)*chi*chi*chi*S+r0m*chi-root*dt;
  const dF=r0m*vr0/root*chi*(1-alpha*chi*chi*S)+(1-alpha*r0m)*chi*chi*C+r0m;
  const step=F/dF;chi-=step;if(Math.abs(step)<1e-9)break;
 }
 const z=alpha*chi*chi,C=stumpC(z),S=stumpS(z);
 const f=1-chi*chi/r0m*C,g=dt-chi*chi*chi/root*S,r=add(scale(r0,f),scale(v0,g)),rm=norm(r);
 const fdot=root/(rm*r0m)*(alpha*chi*chi*chi*S-chi),gdot=1-chi*chi/rm*C;
 return {r,v:add(scale(r0,fdot),scale(v0,gdot))};
}

// The unpowered path from r1 to r2 that takes `time` seconds (Lambert's problem, less than one turn).
// `sense` is a vector along the wanted angular momentum; it chooses between the two ways round.
// Returns the velocities at each end, or null when there is no such path.
export function lambert(r1,r2,time,mu,sense){
 const r1m=norm(r1),r2m=norm(r2),c=cross(r1,r2);
 let theta=Math.acos(Math.max(-1,Math.min(1,dot(r1,r2)/(r1m*r2m))));
 if(dot(c,sense)<0)theta=2*Math.PI-theta;
 const A=Math.sin(theta)*Math.sqrt(r1m*r2m/(1-Math.cos(theta)));
 if(!Number.isFinite(A)||Math.abs(A)<1e-9)return null;
 const y=z=>r1m+r2m+A*(z*stumpS(z)-1)/Math.sqrt(stumpC(z));
 const F=z=>{const yy=y(z);return yy<=0?-Infinity:Math.pow(yy/stumpC(z),1.5)*stumpS(z)+A*Math.sqrt(yy)-Math.sqrt(mu)*time;};
 let lo=-4*Math.PI*Math.PI*4,hi=4*Math.PI*Math.PI-1e-6;
 if(!(F(hi)>0))return null;
 for(let i=0;i<200;i++){const mid=(lo+hi)/2;if(F(mid)>0)hi=mid;else lo=mid;}
 const z=(lo+hi)/2,yy=y(z);if(!(yy>0))return null;
 const f=1-yy/r1m,g=A*Math.sqrt(yy/mu),gdot=1-yy/r2m;
 return {v1:scale(sub(r2,scale(r1,f)),1/g),v2:scale(sub(scale(r2,gdot),r1),1/g)};
}

// Position and velocity from a table of [time, x, y, z, vx, vy, vz] rows (any spacing), by cubic
// interpolation that uses the tabulated velocities. `time` is in the table's own units; `unit` is
// how many seconds one of those units is (0.001 for milliseconds). Null outside the table.
export function tableState(rows,time,unit=.001){
 if(!rows?.length||time<rows[0][0]||time>rows.at(-1)[0])return null;
 let lo=0,hi=rows.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(rows[mid][0]<=time)lo=mid;else hi=mid;}
 const a=rows[lo],b=rows[hi],h=(b[0]-a[0])*unit,s=h?(time-a[0])/(b[0]-a[0]):0,r=[0,0,0],v=[0,0,0];
 for(let k=0;k<3;k++){r[k]=hermite(a[1+k],a[4+k]*h,b[1+k],b[4+k]*h,s);v[k]=a[4+k]+(b[4+k]-a[4+k])*s;}
 return {r,v};
}
