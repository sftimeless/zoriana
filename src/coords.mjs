// Reading and writing lunar coordinates as text. No DOM access, so it is unit tested (tests/coords.test.mjs).
//
// Convention everywhere in the app: planetocentric latitude (north positive) and east-positive
// longitude, in decimal degrees, in the Moon's mean-Earth frame.

// Reads two numbers as latitude and longitude. Accepts signed pairs ("-89.5, 45"), hemisphere
// letters before or after each number in either order ("89.5S 45E", "E 45 S 89.5"), degree signs,
// a typographic minus, and east longitudes from 0 to 360. Returns {lat, lon} with the longitude
// brought into -180..180, or null when the text is not a coordinate pair.
export function parseCoordinates(text){
 const clean=String(text??'').replace(/[−–]/g,'-').replace(/°/g,' ').trim();
 if(!clean)return null;
 const part=/([NSEW])?\s*(-?\d+(?:\.\d+)?)\s*([NSEW])?(?![A-Za-z])/gi,found=[];let m,last=0,carry='';
 while((m=part.exec(clean))){
  if(/[^\s,;]/.test(clean.slice(last,m.index)))return null;      // anything else between the numbers means it is not a coordinate pair
  // "S 89.5 E 45": a number with a letter on both sides keeps the one in front; the other belongs to the next number.
  const before=(m[1]||carry).toUpperCase(),after=(m[3]||'').toUpperCase();
  if(m[1]&&carry)return null;
  carry=before&&after?after:'';
  found.push({value:Number(m[2]),letter:before||after});last=part.lastIndex;
 }
 if(carry)return null;
 if(found.length!==2||/[^\s,;]/.test(clean.slice(last)))return null;
 const isLat=f=>f.letter==='N'||f.letter==='S',isLon=f=>f.letter==='E'||f.letter==='W';
 let [a,b]=found;
 if(isLon(a)&&!isLon(b)||isLat(b)&&!isLat(a))[a,b]=[b,a];        // "45E 89.5S": the letters say which is which
 if(isLon(a)||isLat(b))return null;                               // two latitudes or two longitudes
 const signed=f=>f.letter?(Math.abs(f.value)*(f.letter==='S'||f.letter==='W'?-1:1)):f.value;
 const lat=signed(a);let lon=signed(b);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||lon<-180||lon>360)return null;
 if(lon>180)lon-=360;
 return {lat,lon};
}

// The pair as text that parseCoordinates reads back: "-84.6000, 31.0000" (latitude, east longitude).
export const formatCoordinates=(lat,lon,digits=4)=>`${lat.toFixed(digits)}, ${lon.toFixed(digits)}`;
