import test from 'node:test';
import assert from 'node:assert/strict';
import { PSR, psrPixel, shadowNear } from '../src/psr.mjs';

test('mask pixels follow the PDS south polar layout',()=>{
 const centre=PSR.size/2;
 assert.deepEqual(psrPixel(-90,0),[centre,centre]);              // pole in the middle
 const [x0,y0]=psrPixel(-80,0);assert.ok(Math.abs(x0-centre)<1e-9&&y0<centre);   // 0° longitude is up
 const [x90,y90]=psrPixel(-80,90);assert.ok(x90>centre&&Math.abs(y90-centre)<1e-6); // 90°E is right
 const [,edge]=psrPixel(-75,0);assert.ok(Math.abs(edge)<.2);     // 75°S sits on the image edge
 assert.equal(psrPixel(-74.9,0),null);
 assert.equal(psrPixel(20,0),null);
});

test('ten degrees from the pole is 304 km on the map',()=>{
 const [,y]=psrPixel(-80,0),km=(PSR.size/2-y)*PSR.gridMeters/1000;
 assert.ok(Math.abs(km-2*1737.4*Math.tan(5*Math.PI/180))<.001);
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
