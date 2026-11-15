import test from 'node:test';
import assert from 'node:assert/strict';
import {toCsv} from '../src/export.mjs';
test('CSV quotes only the fields that need it and keeps empty values empty',()=>{
 assert.equal(toCsv([['site','hours','note'],['Malapert region',71.9,null],['Hadley–Apennine, near side',0,'said "go"']]),
  'site,hours,note\r\nMalapert region,71.9,\r\n"Hadley–Apennine, near side",0,"said ""go"""\r\n');
});
