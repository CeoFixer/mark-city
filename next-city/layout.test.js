import test from 'node:test';
import assert from 'node:assert/strict';
import {roads,crossings,pavement,canWalk,onRoad,onCrossing,parkTrees,destinations} from './layout.js';
import {createWalkNavigation} from './motion.js';
import {facade} from './facades.js';
test('every walking destination is connected using pavement or painted crossings',()=>{
 const obstacles=parkTrees.map(([x,z])=>({x,z,w:.8,d:.8}));
 const nav=createWalkNavigation(obstacles);
 for(const start of destinations)for(const end of destinations){const p=nav.path(start,end);assert.ok(p.length,p);for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],length=Math.hypot(b.x-a.x,b.z-a.z);for(let t=0;t<=length;t+=.25){const x=a.x+(b.x-a.x)*t/length,z=a.z+(b.z-a.z)*t/length;assert.ok(canWalk(x,z));assert.ok(!onRoad(x,z)||onCrossing(x,z),'road travel uses a crossing');}}}
});
test('shop facade window counts follow the drawing',()=>{for(const [name,count] of [['Дом №32',2],['VIOLET · ЛОББИ',1],['VIOLET МОТЕЛЬ',4],['МЕГАЗИН',3],['ФУД МАРТ',1],['ДИСКОТЕКА',2],['ФИЛД ПАРК · Книги',3],['Тиурба · Элементарная школа',4]])assert.equal(facade(name,12,7).windows.length,count,name);});
test('park trees leave the paved paths and its two side roads clear',()=>{for(const [x,z] of parkTrees)assert.ok(!canWalk(x,z)&&!onRoad(x,z));assert.ok(onRoad(3,24));assert.ok(onRoad(47,24));});

test('pavement never conceals the road at a junction',()=>{for(const p of pavement)for(const r of roads){const dx=Math.min(p.x+p.w/2,r.x+r.w/2)-Math.max(p.x-p.w/2,r.x-r.w/2),dz=Math.min(p.z+p.d/2,r.z+r.d/2)-Math.max(p.z-p.d/2,r.z-r.d/2);assert.ok(dx<=0||dz<=0);}});
