import { sampleAt } from './ephemeris.mjs';
export const RADIUS=1737400;
const RAD=Math.PI/180;
export function destination(lat,lon,bearing,distance){
 const p=lat*RAD,l=lon*RAD,a=bearing*RAD,d=distance/RADIUS;
 // A tangent basis avoids the singular atan2 expression at either exact pole.
 const cp=Math.cos(p),sp=Math.sin(p),cl=Math.cos(l),sl=Math.sin(l),cd=Math.cos(d),sd=Math.sin(d),ca=Math.cos(a),sa=Math.sin(a);
 const x=cp*cl*cd+(-sp*cl*ca-sl*sa)*sd;
 const y=cp*sl*cd+(-sp*sl*ca+cl*sa)*sd;
 const z=sp*cd+cp*ca*sd;
 return [Math.asin(Math.max(-1,Math.min(1,z)))/RAD,((Math.atan2(y,x)/RAD+540)%360)-180];
}
export function southPixel(lat,lon){
 const rho=2*RADIUS*Math.tan((90+lat)*RAD/2),l=lon*RAD;
 // PDS: south-pole longitude 0 is upward, 90E right; zero-based pixel centers.
 return [3791.5+rho*Math.sin(l)/40,3791.5-rho*Math.cos(l)/40];
}
// Same projection for any PDS south-polar LOLA grid: metres per pixel and the pixel offset of the pole.
export function southPolarPixel(lat,lon,metersPerPixel,poleOffset){
 const rho=2*RADIUS*Math.tan((90+lat)*RAD/2),l=lon*RAD;
 return [poleOffset+rho*Math.sin(l)/metersPerPixel,poleOffset-rho*Math.cos(l)/metersPerPixel];
}
// The north-polar LOLA grids are turned the other way: 0° longitude points down the image.
export function northPolarPixel(lat,lon,metersPerPixel,poleOffset){
 const rho=2*RADIUS*Math.tan((90-lat)*RAD/2),l=lon*RAD;
 return [poleOffset+rho*Math.sin(l)/metersPerPixel,poleOffset+rho*Math.cos(l)/metersPerPixel];
}
// Surface slope in degrees from central differences east-west and north-south over `baseline`
// metres. It describes the DEM at that scale only; rocks and small craters are not resolved.
export function slopeAt(lat,lon,sample,baseline){
 const height=bearing=>{const [p,l]=destination(lat,lon,bearing,baseline/2);return sample(p,l)?.height;};
 const north=height(0),east=height(90),south=height(180),west=height(270);
 if(![north,east,south,west].every(Number.isFinite))return null;
 return Math.atan(Math.hypot((east-west)/baseline,(north-south)/baseline))/RAD;
}
export function globalPixel(lat,lon){return [((lon+180)%360+360)%360*16-.5,(90-lat)*16-.5];}
export function apparentTerrainAngle(distance,height,observerElevation,observerHeight=2){
 const angle=distance/RADIUS,r=RADIUS+height,r0=RADIUS+observerElevation+observerHeight;
 return Math.atan2(r*Math.cos(angle)-r0,r*Math.sin(angle))/RAD;
}
export function bilinear(grid,width,height,x,y,wrap=false){
 if(!Number.isFinite(x)||!Number.isFinite(y)) return null;
 if(!wrap&&(x<0||x>width-1||y<0||y>height-1))return null;
 y=Math.max(0,Math.min(height-1,y));
 const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0;
 const read=(ix,iy)=>{ix=wrap?((ix%width)+width)%width:Math.min(width-1,ix);const v=grid[Math.min(height-1,iy)*width+ix];return v===-32768?NaN:v*.5;};
 const values=[read(x0,y0),read(x0+1,y0),read(x0,y0+1),read(x0+1,y0+1)];
 if(!values.every(Number.isFinite))return null;
 return (values[0]*(1-fx)+values[1]*fx)*(1-fy)+(values[2]*(1-fx)+values[3]*fx)*fy;
}
export function horizonAt(profile,az){
 if(!profile?.angles?.length)return null;
 const p=((az%360+360)%360)/profile.stepDegrees,i=Math.floor(p),t=p-i;
 return profile.angles[i]*(1-t)+profile.angles[(i+1)%profile.angles.length]*t;
}
// What stands in the way toward an azimuth: how high the skyline is there, and how far away
// the terrain that forms it lies (the horizon model keeps the distance of the highest point).
export function obstructionAt(profile,az){
 if(!profile?.angles?.length||!profile.distances?.length)return null;
 const i=Math.round(((az%360+360)%360)/profile.stepDegrees)%profile.angles.length;
 return {horizon:horizonAt(profile,az),distanceMeters:profile.distances[i]};
}
export function clearanceAt(rows,profile,time){const s=sampleAt(rows,time);if(!s)return null;const horizon=horizonAt(profile,s.az);return {...s,horizon,clearance:horizon===null?null:s.el-horizon};}
export function clearanceSeries(rows,profile,stepMinutes=5){
 if(!rows?.length||!profile?.angles?.length)return null;
 const result=[];
 for(let time=rows[0].time;time<=rows.at(-1).time;time+=stepMinutes*60000){const s=clearanceAt(rows,profile,time);result.push({time,az:s.az,el:s.clearance});}
 return result;
}
export function computeHorizon(lat,lon,sample,{stepDegrees=.25,maxDistance=300000,observerHeight=2}={}){
 const ground=sample(lat,lon);if(!ground||!Number.isFinite(ground.height))throw new Error('Elevation unavailable at selected location.');
 const angles=[],distances=[],byResolution={};let fineSamples=0,total=0;
 for(let az=0;az<360;az+=stepDegrees){let highest=-90,atDistance=0;
  // Sample more densely than the raster near the observer, then increase spacing.
  for(let d=ground.resolution/2;d<=maxDistance;){const [p,l]=destination(lat,lon,az,d),point=sample(p,l);if(!point)throw new Error('Terrain coverage incomplete.');
   const angle=apparentTerrainAngle(d,point.height,ground.height,observerHeight);
   if(angle>highest){highest=angle;atDistance=d;}if(point.resolution===40)fineSamples++;total++;byResolution[point.resolution]=(byResolution[point.resolution]||0)+1;
   d+=Math.max(point.resolution/2,Math.min(1000,d*.003));
  }
  angles.push(Math.round(highest*10000)/10000);distances.push(Math.round(atDistance));
 }
 return {angles,distances,stepDegrees,maxDistanceMeters:maxDistance,observerHeightMeters:observerHeight,elevationMeters:ground.height,localResolutionMeters:ground.resolution,fineSampleFraction:fineSamples/total,sampleCount:total,
  // Share of all skyline samples read from each grid, keyed by its spacing in metres (near terrain is fine, far terrain coarser).
  resolutionShares:Object.fromEntries(Object.entries(byResolution).map(([r,n])=>[r,n/total]))};
}
