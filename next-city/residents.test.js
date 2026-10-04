import test from 'node:test';
import assert from 'node:assert/strict';
import {createWalkNavigation,walkingRoutes,sample} from './motion.js';
import {createResidentWalker} from './residents.js';
import {initialTraffic,createTrafficController} from './traffic.js';
import {RESIDENTS_PER_SIDE,parkSignCollider} from './collision.js';
import {destinations,buildingSpecs,parkTrees,canWalk} from './layout.js';
import {playgroundColliders} from './playground.js';

test('a resident replans around a newly parked car without teleporting or walking through it',()=>{
 const obstacles=[],nav=createWalkNavigation(obstacles),walker=createResidentWalker(nav,[{x:10,z:11}]);
 const actor={position:{x:-10,z:11},destination:0,speed:1.3,avoidSide:1};walker.plan(actor);
 obstacles.push({x:0,z:11,w:4.03,d:2.08,walkPadding:.6});
 for(let i=0;i<900;i++){
  const before={...actor.position};walker.step(actor,1/30);
  assert.ok(Math.hypot(actor.position.x-before.x,actor.position.z-before.z)<=actor.speed/30+1e-7);
  assert.ok(nav.clear(actor.position.x,actor.position.z));
 }
 assert.ok(actor.visits>=1,JSON.stringify(actor));assert.ok(actor.replans>0);
});

test('a blocked passage can be bypassed and residents continue after it clears',()=>{
 const obstacles=[],nav=createWalkNavigation(obstacles),walker=createResidentWalker(nav,[{x:-25,z:11}]);
 const actor={position:{x:-40,z:11},destination:0,speed:1.3,avoidSide:1};walker.plan(actor);
 const barricade={x:-34,z:12,w:3,d:4,walkPadding:.6};obstacles.push(barricade);
 for(let i=0;i<300;i++)walker.step(actor,1/30);
 assert.ok(actor.position.x< -36);
 obstacles.pop();for(let i=0;i<1800;i++)walker.step(actor,1/30);
 assert.ok(actor.visits>=1,JSON.stringify(actor));
});

test('replanned paths avoid blocked endpoints as well as edge midpoints',()=>{
 const obstacles=[],nav=createWalkNavigation(obstacles);obstacles.push({x:0,z:11,w:.15,d:.15,walkPadding:.05});
 const path=nav.path({x:-4.2,z:11.2},{x:5,z:11});assert.ok(path.length>1);
 assert.deepEqual(path[0],{x:-4.2,z:11.2});
 for(let i=1;i<path.length;i++)assert.ok(nav.segmentClear(path[i-1],path[i]));
});

test('a resident steps out of a moving car safety margin instead of being trapped',()=>{
 const obstacles=[],nav=createWalkNavigation(obstacles),walker=createResidentWalker(nav,[{x:10,z:11}]);
 const actor={position:{x:-2.58,z:11},destination:0,speed:1.3,avoidSide:1};walker.plan(actor);
 obstacles.push({x:0,z:11,w:4.03,d:2.08,walkPadding:.6,dynamic:true});
 assert.ok(!nav.clear(actor.position.x,actor.position.z));
 for(let i=0;i<600;i++){walker.step(actor,1/30);assert.ok(actor.position.x< -2.515||Math.abs(actor.position.z-11)>=1.54||actor.position.x>2.515,'never crosses the car body');}
 assert.ok(actor.visits>=1);
});

test('49 residents and eight cars keep making progress together for five minutes',()=>{
 const obstacles=[...buildingSpecs.map(([x,z,w,d])=>({x,z,w:w+.6,d:d+.6})),...parkTrees.map(([x,z])=>({x,z,w:.8,d:.8})),parkSignCollider,...[27.6,32.4].map(x=>({x,z:17.3,w:.3,d:.3})),{x:20,z:21,w:3,d:.8},...playgroundColliders];
 const nav=createWalkNavigation(obstacles),cars=initialTraffic(),tick=createTrafficController(cars),walker=createResidentWalker(nav,destinations);
 const syncCars=()=>cars.forEach(car=>Object.assign(car.collider,{x:car.pose.x,z:car.pose.z,dx:car.pose.dx,dz:car.pose.dz,w:Math.abs(car.pose.dx)*4.03+Math.abs(car.pose.dz)*2.08,d:Math.abs(car.pose.dz)*4.03+Math.abs(car.pose.dx)*2.08}));
 for(const car of cars){car.collider={walkPadding:.6,dynamic:true,halfLength:2.015,halfWidth:1.04};obstacles.push(car.collider);}syncCars();
 const people=Array.from({length:RESIDENTS_PER_SIDE*2+1},(_,i)=>{
  const path=walkingRoutes[i<RESIDENTS_PER_SIDE?0:1],initial=sample(path,path.length*((i%RESIDENTS_PER_SIDE)+.3)/RESIDENTS_PER_SIDE);
  const actor={position:{...nav.nearest(initial)},destination:i%destinations.length,speed:1.05+(i%3)*.13,avoidSide:i%2?1:-1,still:0,maxStill:0,travel:0};walker.plan(actor,[],true);return actor;
 });
 const carTravel=cars.map(()=>0),player={x:-39,z:0,radius:.3};
 for(let frame=0;frame<9000;frame++){
  for(const actor of people){const before={...actor.position};walker.step(actor,1/30,[player]);const moved=Math.hypot(actor.position.x-before.x,actor.position.z-before.z);assert.ok(moved<=actor.speed/30+1e-7,'no teleports');assert.ok(canWalk(actor.position.x,actor.position.z),'only sidewalks and crossings');assert.ok(Math.hypot(actor.position.x-player.x,actor.position.z-player.z)>=.8-1e-6,'walk around the player');actor.travel+=moved;actor.still=moved<.00001?actor.still+1/30:0;actor.maxStill=Math.max(actor.maxStill,actor.still);}
  const before=cars.map(c=>({...c.pose}));tick(1/30,[player,...people.map(a=>({...a.position,radius:.5}))]);syncCars();
  cars.forEach((c,i)=>carTravel[i]+=Math.hypot(c.pose.x-before[i].x,c.pose.z-before[i].z));
 }
 assert.ok(people.every(a=>a.visits>=2&&a.travel>200&&a.maxStill<15),JSON.stringify(people.map((a,i)=>({i,visits:a.visits,travel:a.travel,maxStill:a.maxStill,position:a.position,walk:a.walk,waypoint:a.waypoint})).filter(a=>!a.visits||a.travel<200||a.maxStill>=15)));
 assert.ok(carTravel.every(d=>d>300),JSON.stringify(carTravel));
});
