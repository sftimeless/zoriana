import test from 'node:test';
import assert from 'node:assert/strict';
import { POLAR, HEAT, poleOf, polarPixel, polarLatLon, shadowNear, bestCell, topCells } from '../src/psr.mjs';

const SIZE=POLAR.psr.size,centre=SIZE/2;

test('south map follows the PDS layout: 0° longitude up, 90°E right',()=>{
 assert.deepEqual(polarPixel(-90,0,SIZE),{pole:'south',x:centre,y:centre});
 const zero=polarPixel(-80,0,SIZE);assert.ok(Math.abs(zero.x-centre)<1e-9&&zero.y<centre);
 const east=polarPixel(-80,90,SIZE);assert.ok(east.x>centre&&Math.abs(east.y-centre)<1e-6);
 assert.ok(Math.abs(polarPixel(-75,0,SIZE).y)<.2);     // 75°S sits on the image edge
});

test('north map is turned the other way: 0° longitude down, 90°E still right',()=>{
 assert.equal(polarPixel(90,0,SIZE).pole,'north');
 const zero=polarPixel(80,0,SIZE);assert.ok(Math.abs(zero.x-centre)<1e-9&&zero.y>centre);
 const east=polarPixel(80,90,SIZE);assert.ok(east.x>centre&&Math.abs(east.y-centre)<1e-6);
 assert.ok(Math.abs(polarPixel(75,0,SIZE).y-SIZE)<.2);
});

test('places outside the polar maps are not looked up',()=>{
 assert.equal(poleOf(-74.9),null);assert.equal(poleOf(20),null);assert.equal(poleOf(74.9),null);
 assert.equal(polarPixel(-74.9,0,SIZE),null);assert.equal(polarPixel(0.67,23.47,SIZE),null);
});

test('ten degrees from the pole is 304 km on the map',()=>{
 const km=(centre-polarPixel(-80,0,SIZE).y)*POLAR.psr.gridMeters/1000;
 assert.ok(Math.abs(km-2*1737.4*Math.tan(5*Math.PI/180))<.001);
});

test('pixel to latitude and longitude undoes the projection at both poles and both grid sizes',()=>{
 for(const size of [POLAR.psr.size,POLAR.heat.size])for(const [lat,lon] of [[-89.45,-137.31],[-84.6,31],[-76,179],[88.2,-45],[80,120],[75.5,-90]]){
  const p=polarPixel(lat,lon,size),back=polarLatLon(p.pole,p.x,p.y,size);
  assert.ok(Math.abs(back.lat-lat)<1e-9,`lat ${lat}`);assert.ok(Math.abs(((back.lon-lon+540)%360)-180)<1e-7,`lon ${lon}`);
 }
});

test('shadowNear reports the site cell and the nearest shadowed cell',()=>{
 const width=11,values=new Uint8Array(width*width);
 assert.deepEqual(shadowNear(values,width),{inside:false,share:0,nearestMeters:null,reachMeters:1200});
 values[5*width+8]=255;values[1*width+5]=200;values[5*width+6]=90;   // 3 cells east, 4 north, and a mostly lit neighbour
 const near=shadowNear(values,width);
 assert.equal(near.inside,false);assert.equal(near.nearestMeters,720);
 values[5*width+5]=255;
 const inside=shadowNear(values,width);
 assert.equal(inside.inside,true);assert.equal(inside.nearestMeters,0);assert.equal(inside.share,1);
});

test('bestCell picks the highest Sun times Earth score inside the radius',()=>{
 const width=9,rgba=new Uint8ClampedArray(width*width*4),put=(x,y,sun,earth,peak=sun)=>rgba.set([sun,earth,peak,255],(y*width+x)*4);
 assert.equal(bestCell(rgba,width),null);                     // nothing scores
 put(4,4,100,100);put(6,4,200,200,230);put(0,0,255,255);       // site, a better cell 2 east, the best in a far corner
 const near=bestCell(rgba,width,3);
 assert.deepEqual([near.dx,near.dy],[2,0]);assert.ok(Math.abs(near.score-(200/255)**2)<1e-9);assert.ok(Math.abs(near.peakSun-230/255)<1e-9);
 const wide=bestCell(rgba,width,6);assert.deepEqual([wide.dx,wide.dy],[-4,-4]);
 put(2,4,200,200);                                             // an equal cell the same distance west: the first found stays
 assert.equal(bestCell(rgba,width,3).distance,2);
 put(4,5,200,200);                                             // an equal cell nearer wins
 assert.equal(bestCell(rgba,width,3).distance,1);
 put(1,1,255,0);assert.equal(bestCell(rgba,width,6).dx,-4);    // full Sun with no Earth view scores nothing
});

test('heat modes have distinct shader codes and sensible ranges',()=>{
 assert.deepEqual(Object.values(HEAT).map(h=>h.code),[1,2,3]);
 for(const h of Object.values(HEAT))assert.ok(0<h.from&&h.from<h.to&&h.to<=1);
});

test('topCells returns the best cells first and keeps them apart',()=>{
 const width=21,rgba=new Uint8ClampedArray(width*width*4),put=(x,y,sun,earth)=>rgba.set([sun,earth,sun,255],(y*width+x)*4);
 put(10,10,100,100);put(14,10,250,250);put(15,10,240,240);put(10,3,200,200);put(0,0,255,255);put(3,10,255,0);
 const picked=topCells(rgba,width,8,3,4);
 assert.deepEqual(picked.map(c=>[c.dx,c.dy]),[[4,0],[0,-7],[0,0]]);   // the neighbour of the best cell is skipped; the corner is out of range; no-Earth cell scores nothing
 assert.ok(picked[0].score>picked[1].score&&picked[1].score>picked[2].score);
 assert.equal(topCells(rgba,width,8,1,4).length,1);
 assert.deepEqual(topCells(new Uint8ClampedArray(width*width*4),width),[]);
});
