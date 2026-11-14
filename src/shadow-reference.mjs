// Independent CPU reference used by the opt-in GPU verification, never per frame.
import { coordinatesToVector } from './ephemeris.mjs';
import { southPixel,globalPixel } from './terrain-math.mjs';
export function sampleFloat(grid,w,h,x,y,wrap=false){
 const floorX=Math.floor(x),floorY=Math.floor(y),fx=x-floorX,fy=y-floorY;
 const at=(i,j)=>grid[Math.max(0,Math.min(h-1,j))*w+(wrap?(i%w+w)%w:Math.max(0,Math.min(w-1,i)))];
 return (at(floorX,floorY)*(1-fx)+at(floorX+1,floorY)*fx)*(1-fy)+(at(floorX,floorY+1)*(1-fx)+at(floorX+1,floorY+1)*fx)*fy;
}
export function makeVisualSampler(global,south){return (lat,lon)=>{
 if(lat< -85){const [x,y]=southPixel(lat,lon);return sampleFloat(south,1896,1896,(x+.5)/4-.5,(y+.5)/4-.5)/1000;}
 const [x,y]=globalPixel(lat,lon);return sampleFloat(global,2880,1440,(x+.5)/2-.5,(y+.5)/2-.5,true)/1000;
};}
export function referenceShadow(lat,lon,sun,heightAt){
 const n=coordinatesToVector(lat,lon),h=heightAt(lat,lon),polar=lat< -85;
 const origin=n.map(v=>v*(1737.4+h+(polar?.008:.05)));
 // Uniform small steps are independent of the exponentially spaced GPU march.
 const step=polar?.08:.5;
 for(let d=step;d<=500;d+=step){
  const p=origin.map((v,i)=>v+sun[i]*d),r=Math.hypot(...p),alt=r-1737.4;
  if(alt>11&&p.reduce((sum,v,i)=>sum+v*sun[i],0)>0)return 1;
  const latitude=Math.asin(p[1]/r)*180/Math.PI,longitude=Math.atan2(-p[2],p[0])*180/Math.PI;
  if(alt<heightAt(latitude,longitude))return 0;
 }
 return 1;
}
