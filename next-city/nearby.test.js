import test from 'node:test';
import assert from 'node:assert/strict';
import {nearbyActivities} from './nearby.js';
import {buildingSpecs} from './layout.js';
const buildings=buildingSpecs.map(([x,z,w,d,h,color,name,roof,facing=1])=>({name,x,z,doorX:x,doorZ:z+facing*(d/2+.7)}));
test('nearby advice changes with location and names real activities',()=>{
 const west=nearbyActivities({x:-65,z:11},buildings);
 assert.match(west,/Ближе всего — Мегазин/);assert.match(west,/прилавок с хлебом/);assert.doesNotMatch(west,/Фуд Март|Ещё рядом/);
 const east=nearbyActivities({x:61,z:11},buildings);
 assert.match(east,/Ближе всего — Школа Тиурба/);assert.match(east,/парты и доску/);assert.doesNotMatch(east,/Филд Парк|Ещё рядом/);
 const park=nearbyActivities({x:20,z:19},buildings);
 assert.match(park,/Ближе всего — Филд Парк/);assert.match(park,/лавке.*нажми E/);
 const disco=nearbyActivities({x:-19,z:12},buildings);
 assert.match(disco,/Ближе всего — Диско/);assert.match(disco,/послушать электронную музыку/);
});
test('nearby advice uses entrances, skips generic houses and does not invent purchases',()=>{
 const sample=[{name:'Дом №28',x:0,z:0},{name:'МЕГАЗИН',x:100,z:100,doorX:1,doorZ:1},{name:'ФУД МАРТ',x:0,z:0,doorX:30,doorZ:30}];
 const copy=structuredClone(sample),answer=nearbyActivities({x:0,z:-1},sample);
 assert.match(answer,/Ближе всего — Мегазин через главную улицу/);
 assert.doesNotMatch(answer,/Дом №|купить|синей двери/);assert.deepEqual(sample,copy);
});
