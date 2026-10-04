import test from 'node:test';
import assert from 'node:assert/strict';
import {blocksCircleMove,residentStep,parkSignCollider,RESIDENTS_PER_SIDE} from './collision.js';
import {touchesObstacle} from './playground.js';
import {createWalkNavigation} from './motion.js';
import {parkTrees} from './layout.js';
test('resident boundaries stop walking and fast steps without a large invisible box',()=>{
 const circles=[{x:0,z:0,radius:.5}];
 for(let a=0;a<Math.PI*2;a+=Math.PI/8){const at=r=>({x:Math.cos(a)*r,z:Math.sin(a)*r});assert.ok(blocksCircleMove(at(1.3),at(.79),circles));assert.ok(!blocksCircleMove(at(1.3),at(.81),circles));}
 assert.ok(blocksCircleMove({x:-2,z:0},{x:2,z:0},circles));
 assert.ok(!blocksCircleMove({x:-2,z:.81},{x:2,z:.81},circles));
 assert.ok(!blocksCircleMove({x:.2,z:0},{x:.4,z:0},circles),'can escape a pre-existing overlap');
 assert.ok(blocksCircleMove({x:.2,z:0},{x:-.4,z:0},circles),'cannot escape through the person');
});
test('a resident walks around a stationary player from both sides without pushing',()=>{
 for(const side of [-1,1])for(const dt of [1/60,.05]){
  let position={x:-3,z:0};const target={x:3,z:0},player={x:0,z:0,radius:.3};
  for(let i=0;i<1000&&Math.hypot(position.x-target.x,position.z-target.z)>.01;i++){
   position=residentStep(position,target,1.2*dt,[player],(x,z)=>Math.abs(z)<2,side);
   assert.ok(Math.hypot(position.x,position.z)>=.8-1e-6);
  }
  assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<.01,JSON.stringify(position));
  assert.deepEqual(player,{x:0,z:0,radius:.3});
 }
});
test('a resident waits in a blocked narrow passage and continues when it clears',()=>{
 let position={x:-1,z:0};const target={x:2,z:0},clear=(x,z)=>Math.abs(z)<.01;
 for(let i=0;i<80;i++)position=residentStep(position,target,.05,[{x:0,z:0,radius:.3}],clear);
 assert.ok(position.x<=-.8+1e-8);
 for(let i=0;i<100;i++)position=residentStep(position,target,.05,[],clear);
 assert.ok(Math.abs(position.x-2)<.01);
});
test('park sign blocks its visible board but leaves routes around both ends',()=>{
 assert.ok(touchesObstacle(30,17.22,[parkSignCollider]));
 assert.ok(!touchesObstacle(26.9,17.22,[parkSignCollider]));
 assert.ok(!touchesObstacle(33.1,17.22,[parkSignCollider]));
 const obstacles=[parkSignCollider,...parkTrees.map(([x,z])=>({x,z,w:.6,d:.6}))];
 const nav=createWalkNavigation(obstacles),route=nav.path({x:23,z:17},{x:35,z:11});
 assert.ok(route.length>1);
 for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],length=Math.hypot(b.x-a.x,b.z-a.z);for(let d=0;d<=length;d+=.1)assert.ok(nav.clear(a.x+(b.x-a.x)*d/length,a.z+(b.z-a.z)*d/length));}
 assert.equal(RESIDENTS_PER_SIDE*2+1,49);
});

test('resident spawn and replanning skip cars added after navigation was built',()=>{
 const obstacles=[],nav=createWalkNavigation(obstacles);obstacles.push({x:-32.4,z:12.475,w:2.08,d:4.03,walkPadding:.6});
 const spawn=nav.nearest({x:-33,z:11});assert.ok(nav.clear(spawn.x,spawn.z));assert.ok(!touchesObstacle(spawn.x,spawn.z,obstacles,.6));
});
