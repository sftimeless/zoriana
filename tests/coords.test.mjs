import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCoordinates,formatCoordinates} from '../src/coords.mjs';
const near=(got,lat,lon)=>{assert.ok(got,'expected a coordinate pair');assert.ok(Math.abs(got.lat-lat)<1e-9&&Math.abs(got.lon-lon)<1e-9,JSON.stringify(got));};
test('signed pairs: comma, space, typographic minus',()=>{near(parseCoordinates('-89.5, 45'),-89.5,45);near(parseCoordinates('−85 20'),-85,20);near(parseCoordinates(' 0.6742 ; 23.4731 '),.6742,23.4731);});
test('hemisphere letters, as the site card prints them and in other common orders',()=>{near(parseCoordinates('84.6000° S 31.0000° E'),-84.6,31);near(parseCoordinates('89.5S 45E'),-89.5,45);near(parseCoordinates('89.45°S, 137.31°W'),-89.45,-137.31);near(parseCoordinates('S 89.5 E 45'),-89.5,45);near(parseCoordinates('S 89.5 W 45'),-89.5,-45);near(parseCoordinates('89.5 S 45 W'),-89.5,-45);near(parseCoordinates('45E 89.5S'),-89.5,45);near(parseCoordinates('n 26.1 e 3.6'),26.1,3.6);});
test('east longitudes from 0 to 360 are brought into -180..180',()=>{near(parseCoordinates('-89.45, 222.69'),-89.45,-137.31);near(parseCoordinates('10 N 350 E'),10,-10);});
test('text that is not a coordinate pair is left for the name search',()=>{for(const t of ['Tycho','Apollo 11','Tycho A','91, 0','0, 400','10 N 20 N','10 E 20 E','1 2 3','south pole','',null])assert.equal(parseCoordinates(t),null,String(t));});
test('formatted coordinates read back to the same point',()=>{assert.equal(formatCoordinates(-84.6,31),'-84.6000, 31.0000');near(parseCoordinates(formatCoordinates(-10.2339,45.7843)),-10.2339,45.7843);});
