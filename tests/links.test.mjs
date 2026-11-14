import test from 'node:test';
import assert from 'node:assert/strict';
import {polarXY,quickMapUrl,moonTrekUrl} from '../src/links.mjs';
test('polar coordinates put longitude 0 above the south pole and 90°E to the right',()=>{
 const [x0,y0]=polarXY(-89.5,0);assert.ok(Math.abs(x0)<1e-6);assert.ok(Math.abs(y0-15162)<2);
 const [x1,y1]=polarXY(-89.5,90);assert.ok(Math.abs(x1-15162)<2);assert.ok(Math.abs(y1)<1e-6);
 assert.ok(polarXY(89.5,0)[1]<0,'north pole flips the vertical axis');
});
test('QuickMap link uses a projected south-polar box near the pole',()=>{
 const url=new URL(quickMapUrl(-89.5,0));assert.equal(url.host,'quickmap.lroc.im-ldi.com');assert.equal(url.searchParams.get('proj'),'27');
 const [minX,minY,maxX,maxY]=url.searchParams.get('prjExtent').split(',').map(Number);
 assert.equal(maxX-minX,50000);assert.equal(maxY-minY,50000);assert.ok(Math.abs((minX+maxX)/2)<1);assert.ok(Math.abs((minY+maxY)/2-15162)<2);
});
test('QuickMap link uses a longitude/latitude box elsewhere, centred on the site',()=>{
 const url=new URL(quickMapUrl(18.56,61.81));assert.equal(url.searchParams.get('proj'),'16');
 const [minLon,minLat,maxLon,maxLat]=url.searchParams.get('extent').split(',').map(Number);
 assert.ok(Math.abs((minLon+maxLon)/2-61.81)<1e-3);assert.ok(Math.abs((minLat+maxLat)/2-18.56)<1e-3);assert.ok(maxLon-minLon>maxLat-minLat,'box widens with latitude to stay roughly square on the ground');
});
test('Moon Trek link switches projection at the poles',()=>{
 const eq=moonTrekUrl(0.67408,23.47297);assert.ok(eq.includes('x=23.47297&y=0.67408&z=9'));assert.ok(decodeURIComponent(eq).includes('EPSG::104903'));
 const sp=moonTrekUrl(-89.5,0);assert.ok(decodeURIComponent(sp).includes('IAU2000::30120'));assert.ok(/&y=1516\d\.\d&z=7/.test(sp));
 assert.ok(decodeURIComponent(moonTrekUrl(85,10)).includes('IAU2000::30118'));
});
