// Links that open a site in the two NASA map tools named by the challenge. Formats were checked
// against the live sites on 2026-11-14: QuickMap takes a lon/lat `extent` box or a projected
// `prjExtent` box in meters; Moon Trek takes a center and zoom in its URL fragment.
const R=1737400,RAD=Math.PI/180,POLAR_FROM=80;
// Polar stereographic meters about the nearer pole (lon 0 up at the south pole, down at the north).
export function polarXY(lat,lon){
 const rho=2*R*Math.tan((90-Math.abs(lat))*RAD/2),l=lon*RAD;
 return [rho*Math.sin(l),(lat<0?1:-1)*rho*Math.cos(l)];
}
export function quickMapUrl(lat,lon){
 const base='https://quickmap.lroc.im-ldi.com/';
 if(Math.abs(lat)>=POLAR_FROM){
  const [x,y]=polarXY(lat,lon),half=25000;
  return `${base}?prjExtent=${[x-half,y-half,x+half,y+half].map(v=>v.toFixed(0)).join(',')}&proj=${lat<0?27:26}`;
 }
 const dLat=.75,dLon=dLat/Math.cos(lat*RAD);
 return `${base}?extent=${[lon-dLon,lat-dLat,lon+dLon,lat+dLat].map(v=>v.toFixed(4)).join(',')}&proj=16`;
}
export function moonTrekUrl(lat,lon){
 const base='https://trek.nasa.gov/moon/#v=0.1';
 if(Math.abs(lat)>=POLAR_FROM){
  const [x,y]=polarXY(lat,lon);
  return `${base}&x=${x.toFixed(1)}&y=${y.toFixed(1)}&z=7&p=${encodeURIComponent('urn:ogc:def:crs:IAU2000::'+(lat<0?30120:30118))}&d=`;
 }
 return `${base}&x=${lon.toFixed(5)}&y=${lat.toFixed(5)}&z=9&p=${encodeURIComponent('urn:ogc:def:crs:EPSG::104903')}&d=`;
}
