// The square grid of ground points used for the Landing view's terrain mesh. Shared by the server,
// which reads a height for every point, and the browser, which places a vertex at every point, so
// the two always agree. No DOM access, so it is unit tested (tests/patch-grid.test.mjs).
import { coordinatesToVector, skyDirection } from './ephemeris.mjs';

export const RADIUS_KM=1737.4;
const DEG=180/Math.PI;

// How big a patch to ask for at a latitude. Near the poles the terrain data is finer (40 m and 80 m),
// so the patch is smaller and its points closer together; elsewhere it is 474 m data.
export const patchSize=lat=>Math.abs(lat)>=80?{n:513,halfKm:70}:{n:513,halfKm:150};

// The site's local directions as unit vectors: up, north and east.
export function patchFrame(lat,lon){
 const c=Math.max(-89.95,Math.min(89.95,lat));
 return {up:coordinatesToVector(c,lon),north:skyDirection(c,lon,0,0),east:skyDirection(c,lon,90,0)};
}

// Unit direction from the Moon's centre to grid point (i, j): i runs west to east and j south to
// north, each from 0 to n-1, across a square 2 * halfKm wide laid on the plane touching the site.
export function patchDirection(frame,i,j,n,halfKm,out=[0,0,0]){
 const x=(i/(n-1)*2-1)*halfKm/RADIUS_KM,y=(j/(n-1)*2-1)*halfKm/RADIUS_KM,{up,east,north}=frame;
 const a=up[0]+east[0]*x+north[0]*y,b=up[1]+east[1]*x+north[1]*y,c=up[2]+east[2]*x+north[2]*y,l=Math.hypot(a,b,c);
 out[0]=a/l;out[1]=b/l;out[2]=c/l;return out;
}

// Latitude and east longitude, in degrees, of a unit direction.
export const directionToCoordinates=v=>[Math.asin(Math.max(-1,Math.min(1,v[1])))*DEG,Math.atan2(-v[2],v[0])*DEG];

// Height in metres at fractional grid position (x, y), bilinear between the four nearest points.
export function patchHeight(heights,n,x,y){
 const cx=Math.max(0,Math.min(n-1.000001,x)),cy=Math.max(0,Math.min(n-1.000001,y)),i=Math.floor(cx),j=Math.floor(cy),fx=cx-i,fy=cy-j,k=j*n+i;
 return (heights[k]*(1-fx)+heights[k+1]*fx)*(1-fy)+(heights[k+n]*(1-fx)+heights[k+n+1]*fx)*fy;
}
