import assert from 'node:assert/strict';
import {trafficRoutes,walkingRoutes,sample,gait} from './motion.js';
const onRoad=(x,z)=>(Math.abs(x)<=80&&(Math.abs(z-17)<=3.5||Math.abs(z+17)<=3.5))||(Math.abs(z)<=20.5&&(Math.abs(x+56)<=3.5||Math.abs(x-23)<=3.5));
for(const path of trafficRoutes){
  assert.deepEqual(sample(path,0),sample(path,path.length));
  for(let d=0;d<path.length;d+=.15){const p=sample(path,d);for(const a of [-2.015,2.015])for(const b of [-1.04,1.04])assert.ok(onRoad(p.x+p.dx*a-p.dz*b,p.z+p.dz*a+p.dx*b),'Entire car footprint stays on roads');}
  for(let d=0;d<path.length;d+=1){const a=sample(path,d),b=sample(path,d+.046);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<=.047,'No teleport at route corners or seam');}
}
for(const path of walkingRoutes)for(let d=0;d<path.length;d+=.2){const p=sample(path,d);assert.ok(Math.abs(p.z)>=21&&Math.abs(p.z)<=21.7);assert.ok(p.x>=-48&&p.x<=73);}
const limbs=Array.from({length:4},()=>({rotation:{x:0}}));gait(limbs,Math.PI/2);assert.ok(limbs[0].rotation.x>0&&limbs[2].rotation.x<0);assert.equal(limbs[0].rotation.x,limbs[1].rotation.x);gait(limbs,0,0);assert.ok(limbs.every(l=>l.rotation.x===0));
console.log('PASS: vehicle footprints, route continuity, sidewalk bounds, opposing steps.');

const {surfaceHeight,verticalStep}=await import('./motion.js');
assert.equal(surfaceHeight(7,1),.43);assert.equal(surfaceHeight(3,1),0);assert.equal(surfaceHeight(11,1),0);assert.ok(Math.abs(surfaceHeight(3.5,1)-.215)<.0001);
for(const ground of [0,.43]){let y=ground,v=5,peak=y;for(let i=0;i<120;i++){const p=verticalStep(y,v,1/60,ground);y=p.y;v=p.velocity;peak=Math.max(peak,y);}assert.equal(y,ground);assert.equal(v,0);assert.ok(peak>ground+.7&&peak<ground+1);}
console.log('PASS: bridge ramps, jump clearance and exact landing on ground/bridge.');

const {inRiver,onBridge,shouldSwim}=await import('./motion.js');assert.ok(inRiver(5,-11));assert.ok(!inRiver(0,0));assert.ok(onBridge(7,1));assert.ok(!shouldSwim(7,.43,1));assert.ok(shouldSwim(5,0,-11));assert.ok(!shouldSwim(5,1,-11));assert.ok(!shouldSwim(0,0,0));
console.log('PASS: exact river segments, bridge exclusion, water landing and dry bank.');

const {createWalkNavigation}=await import('./motion.js');
const obstacles=[{x:0,z:0,w:4,d:4},{x:7,z:-.3,w:6.15,d:.16},{x:7,z:2.3,w:6.15,d:.16}];
const navigation=createWalkNavigation(obstacles);
for(const [start,end] of [[{x:-5,z:0},{x:2,z:4}],[{x:2,z:1},{x:12,z:1}],[{x:-48,z:21},{x:12,z:1}]]){
 const path=navigation.path(start,end);assert.ok(path.length>1);
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],length=Math.hypot(b.x-a.x,b.z-a.z);for(let d=0;d<=length;d+=.05)assert.ok(navigation.clear(a.x+(b.x-a.x)*d/length,a.z+(b.z-a.z)*d/length),'Navigation avoids buildings, water and bridge rails');}
}
assert.ok(!navigation.clear(0,0));assert.ok(!navigation.clear(7,2.3));assert.ok(navigation.clear(7,1));
console.log('PASS: continuous park paths, obstacle detours, bridge crossing and railing protection.');
