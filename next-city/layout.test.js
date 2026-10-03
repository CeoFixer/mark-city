import test from 'node:test';
import assert from 'node:assert/strict';
import {roads,walks,crossings,pavement,canWalk,onRoad,onCrossing,parkTrees,destinations,buildingSpecs,roofOverhang} from './layout.js';
import {createWalkNavigation} from './motion.js';
import {facade} from './facades.js';
import {playgroundColliders,playgroundSolids,touchesObstacle} from './playground.js';
test('every walking destination is connected using pavement or painted crossings',()=>{
 const obstacles=parkTrees.map(([x,z])=>({x,z,w:.8,d:.8}));
 const nav=createWalkNavigation(obstacles);
 for(const start of destinations)for(const end of destinations){const p=nav.path(start,end);assert.ok(p.length,p);for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],length=Math.hypot(b.x-a.x,b.z-a.z);for(let t=0;t<=length;t+=.25){const x=a.x+(b.x-a.x)*t/length,z=a.z+(b.z-a.z)*t/length;assert.ok(canWalk(x,z));assert.ok(!onRoad(x,z)||onCrossing(x,z),'road travel uses a crossing');}}}
});
test('shop facade window counts follow the drawing',()=>{for(const [name,count] of [['Дом №32',2],['VIOLET · ЛОББИ',1],['VIOLET МОТЕЛЬ',4],['МЕГАЗИН',3],['ФУД МАРТ',1],['ДИСКО',2],['ФИЛД ПАРК · Книги',2],['Тиурба · Элементарная школа',4]])assert.equal(facade(name,12,7).windows.length,count,name);});
test('park trees leave the paved paths, walkway and side road clear',()=>{for(const [x,z] of parkTrees)assert.ok(!canWalk(x,z)&&!onRoad(x,z));assert.ok(canWalk(3,24)&&!onRoad(3,24));assert.ok(onRoad(47,24));});

test('pavement never conceals the road at a junction',()=>{for(const p of pavement)for(const r of roads){const dx=Math.min(p.x+p.w/2,r.x+r.w/2)-Math.max(p.x-p.w/2,r.x-r.w/2),dz=Math.min(p.z+p.d/2,r.z+r.d/2)-Math.max(p.z-p.d/2,r.z-r.d/2);assert.ok(dx<=0||dz<=0);}});

test('walls and roof eaves leave visible setbacks from streets, sidewalks and neighbors',()=>{
 const gap=(a,b)=>Math.max(Math.abs(a.x-b.x)-(a.w+b.w)/2,Math.abs(a.z-b.z)-(a.d+b.d)/2);
 const buildings=buildingSpecs.map(([x,z,w,d,h,c,name,roof=true])=>({x,z,w:w+(roof?roofOverhang*2:0),d:d+(roof?roofOverhang*2:0),name}));
 for(const [i,b] of buildings.entries()){
  for(const p of [...roads,...walks])assert.ok(gap(b,p)>=.7,`${b.name} touches pavement: ${gap(b,p)}`);
  for(const other of buildings.slice(i+1)){const sameMotel=b.name.startsWith('VIOLET')&&other.name.startsWith('VIOLET');assert.ok(sameMotel?Math.abs(gap(b,other))<.001:gap(b,other)>=.7,`${b.name} / ${other.name}`);}
 }
});
test('playground solids stop a walking player approaching from every side',()=>{
 for(const p of playgroundSolids)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const half=dx?p.w/2:p.d/2;let distance=half+1;
  while(distance>.01&&!touchesObstacle(p.x+dx*(distance-.025),p.z+dz*(distance-.025),[p]))distance-=.025;
  assert.ok(distance>=half+.3-.001&&distance<=half+.33,`solid at ${p.x},${p.z}`);
 }
});
test('schoolyard gate and open space between swings remain walkable',()=>{
 const route=[[78,13.8],[78,20],[74,20],[74,24.2],[78.5,24.2],[78.5,19],[78,19],[78,13.8]];
 for(let i=1;i<route.length;i++){const [x,z]=route[i-1],[tx,tz]=route[i],length=Math.hypot(tx-x,tz-z);for(let d=0;d<=length;d+=.05)assert.ok(!touchesObstacle(x+(tx-x)*d/length,z+(tz-z)*d/length,playgroundColliders),`blocked passage ${i}`);}
 for(const [x,z] of [[68,15],[84,20],[70,27.7],[80,27.7]])assert.ok(touchesObstacle(x,z,playgroundColliders),'solid fence');
});
