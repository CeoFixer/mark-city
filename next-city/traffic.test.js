import test from 'node:test';
import assert from 'node:assert/strict';
import {cityTrafficRoutes,trafficPose,carCorners,initialTraffic,createTrafficController,carsOverlap,trafficColors} from './traffic.js';
import {onRoad} from './layout.js';
test('all car footprints stay on the drawn roads through turns and U-turns',()=>{
 const start=trafficPose(cityTrafficRoutes[0],0);
 for(const path of cityTrafficRoutes){
  assert.deepEqual(trafficPose(path,0),start);
  for(let d=0;d<path.length;d+=.08){const p=trafficPose(path,d),next=trafficPose(path,d+.08);
   assert.ok(carCorners(p).every(c=>onRoad(c.x,c.z)),JSON.stringify(p));
   assert.ok(Math.hypot(p.x-next.x,p.z-next.z)<=.08001,'no discontinuity at segment or loop seam');
   assert.ok(p.dx*next.dx+p.dz*next.dz>.99,'smooth heading');
  }
 }
 assert.ok(cityTrafficRoutes.some(p=>p.segments.some(s=>s.at(.5).z< -20)));
 assert.ok(cityTrafficRoutes.some(p=>p.segments.some(s=>s.at(.5).z>20)));
});
test('eight distinct car colors include red, and varied routes switch without collisions or deadlocks',()=>{
 const cars=initialTraffic(),tick=createTrafficController(cars),distances=cars.map(()=>0),seen=cars.map(()=>new Set());
 assert.equal(cars.length,8);assert.equal(new Set(trafficColors).size,8);assert.equal(cars.filter(c=>c.color===0xd64b4b).length,1);
 for(let frame=0;frame<9000;frame++){
  const before=cars.map(c=>({...c.pose}));tick(1/15);
  cars.forEach((car,i)=>{
   const distance=Math.hypot(car.pose.x-before[i].x,car.pose.z-before[i].z);distances[i]+=distance;seen[i].add(car.routeIndex);
   assert.ok(distance<=4.6/15+.00001,'route changes never teleport');
   for(const other of cars.slice(i+1))assert.ok(!carsOverlap(car.pose,other.pose,.14),'cars leave space at shared roads and crossings');
  });
 }
 assert.ok(distances.every(d=>d>1000));assert.ok(seen.every(routes=>routes.size===4));
});
test('a person stops approaching traffic; it resumes when the road is clear',()=>{
 const cars=initialTraffic().slice(0,1),tick=createTrafficController(cars),car=cars[0];
 const person={x:car.pose.x+8,z:car.pose.z,radius:.5};
 for(let i=0;i<100;i++)tick(1/30,[person]);
 assert.ok(person.x-car.pose.x>3);
 const before=car.distance;for(let i=0;i<100;i++)tick(1/30,[]);assert.ok(car.distance>before+10);
});

test('a pedestrian behind a departing car does not trap it at a crossing',()=>{
 const cars=initialTraffic().slice(0,1),tick=createTrafficController(cars),car=cars[0],before=car.distance;
 const person={x:car.pose.x-3,z:car.pose.z,radius:.5};for(let i=0;i<30;i++)tick(1/30,[person]);
 assert.ok(car.distance>before+4);
});

test('traffic and walkers both clear the narrow side-street crossing',async()=>{
 const {createWalkNavigation}=await import('./motion.js');
 const {residentStep}=await import('./collision.js');
 const path=cityTrafficRoutes[2];let distance=0,best=Infinity;
 for(let d=0;d<path.length;d+=.05){const p=trafficPose(path,d),error=Math.hypot(p.x+35.6,p.z-20);if(error<best){best=error;distance=d;}}
 const car={path,routeIndex:2,distance,pose:trafficPose(path,distance)},cars=[car],tick=createTrafficController(cars),obstacle={x:car.pose.x,z:car.pose.z,w:2.08,d:4.03,walkPadding:.6},nav=createWalkNavigation([obstacle]);
 const people=[{x:-40,z:12,radius:.5},{x:-29,z:11,radius:.5}],goals=[{x:-25,z:12},{x:-43,z:11}];let carTravel=0;
 for(let i=0;i<1800;i++){
  for(let j=0;j<people.length;j++)Object.assign(people[j],residentStep(people[j],goals[j],1.2/30,[],nav.clear,j?1:-1));
  const before=car.pose;tick(1/30,people);carTravel+=Math.hypot(car.pose.x-before.x,car.pose.z-before.z);
  Object.assign(obstacle,{x:car.pose.x,z:car.pose.z,w:Math.abs(car.pose.dx)*4.03+Math.abs(car.pose.dz)*2.08,d:Math.abs(car.pose.dz)*4.03+Math.abs(car.pose.dx)*2.08});
 }
 assert.ok(carTravel>100,`traffic stalled after ${carTravel}`);
 people.forEach((person,i)=>assert.ok(Math.hypot(person.x-goals[i].x,person.z-goals[i].z)<.05,`resident stuck at ${person.x},${person.z}`));
});
