import {canWalk,onWalkway} from './layout.js?v=single-storey-6';
// A higher arc with the same gravity and grounded landing.
export const JUMP_SPEED=6.4;
// Distances are world units. Closed routes keep movement continuous at the seam.
export function route(points) {
  const segments=points.map((a,i)=>{const b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1];return {x:a[0],z:a[1],dx,dz,length:Math.hypot(dx,dz)}});
  return {segments,length:segments.reduce((sum,s)=>sum+s.length,0)};
}
export function sample(path,distance){
  let d=((distance%path.length)+path.length)%path.length;
  for(const s of path.segments){if(d<=s.length)return {x:s.x+s.dx*d/s.length,z:s.z+s.dz*d/s.length,dx:s.dx/s.length,dz:s.dz/s.length};d-=s.length;}
}
const avenueRoute=route([[-81,-3],[81,-3],[81,3],[-81,3]]);
export const trafficRoutes=[avenueRoute,avenueRoute];
export const walkingRoutes=[route([[-78,11],[78,11],[78,12],[-78,12]]),route([[-78,-11],[78,-11],[78,-12],[-78,-12]])];
export function gait(limbs,phase,amount=1){
  // Left leg/right arm swing together; feet remain attached to the legs.
  limbs.forEach((limb,i)=>limb.rotation.x=Math.sin(phase+(i<2?0:Math.PI))*.55*amount);
}

// Bridge deck has short ramps; road and sidewalk tops match their visible meshes.
export function surfaceHeight(x,z){return onWalkway(x,z)?.13:0;}
export function verticalStep(y,velocity,dt,ground){velocity-=14*dt;y+=velocity*dt;if(y<=ground){y=ground;velocity=0;}return {y,velocity};}

export const riverSegments=[];
export const inRiver=()=>false;export const onBridge=()=>false;export const shouldSwim=()=>false;

// Shared navigation grid is rebuilt from the edited city's actual obstacles.
export function createWalkNavigation(obstacles){
 const cells=new Map(),key=(x,z)=>`${x},${z}`;
 const penetration=(x,z,b)=>{
  if(b.radius!==undefined)return Math.max(0,b.radius-Math.hypot(x-b.x,z-b.z));
  const px=x-b.x,pz=z-b.z,pad=b.walkPadding??.42;
  const along=b.dx===undefined?px:px*b.dx+pz*b.dz,across=b.dx===undefined?pz:-px*b.dz+pz*b.dx;
  return Math.max(0,Math.min((b.halfLength??b.w/2)+pad-Math.abs(along),(b.halfWidth??b.d/2)+pad-Math.abs(across)));
 };
 const occupied=(x,z,b)=>penetration(x,z,b)>1e-8;
 const clear=(x,z,extra=[])=>canWalk(x,z)&&!obstacles.some(b=>occupied(x,z,b))&&!extra.some(b=>occupied(x,z,b));
 const segmentClear=(a,b,extra=[])=>{const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.2));for(let i=0;i<=steps;i++){const t=i/steps;if(!clear(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,extra))return false;}return true;};
 for(let x=-82;x<=82;x++)for(let z=-29;z<=29;z++)if(clear(x,z))cells.set(key(x,z),{x,z});
 // Connect from the real position, including after a small avoidance step.
 // A nearby cell behind a wall or across a car is not a valid starting point.
 const nearest=(p,extra=[],connected=false)=>{if(connected&&!clear(p.x,p.z,extra))return null;const candidates=[...cells.values()].map(c=>({c,d:(p.x-c.x)**2+(p.z-c.z)**2})).sort((a,b)=>a.d-b.d);for(const {c} of candidates)if(clear(c.x,c.z,extra)&&(!connected||segmentClear(p,c,extra)))return c;return null;};
 function path(from,to,extra=[]){
  const start=nearest(from,extra,true),goal=nearest(to,extra);if(!start||!goal)return [];
  const queue=[start],parents=new Map([[key(start.x,start.z),null]]);let found=null;
  for(let i=0;i<queue.length;i++){const c=queue[i];if(c===goal){found=c;break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=key(c.x+dx,c.z+dz),n=cells.get(k);if(!n||parents.has(k)||!clear(n.x,n.z,extra)||!clear(c.x+dx*.5,c.z+dz*.5,extra))continue;parents.set(k,c);queue.push(n);}}
  if(!found)return [];
  const points=[];for(let c=found;c;c=parents.get(key(c.x,c.z)))points.push(c);points.reverse();
  const turns=points.filter((p,i)=>!i||i===points.length-1||(p.x-points[i-1].x)!==(points[i+1].x-p.x)||(p.z-points[i-1].z)!==(points[i+1].z-p.z));
  if(Math.hypot(from.x-start.x,from.z-start.z)>.001)turns.unshift({x:from.x,z:from.z});
  return turns;
 }
 // A turning car can bring its small safety margin over a pedestrian.
 // Permit walking out of that margin, while never entering a new obstacle.
 const canStep=(from,to,extra=[])=>{
  for(const t of [.5,1]){const x=from.x+(to.x-from.x)*t,z=from.z+(to.z-from.z)*t;if(!canWalk(x,z))return false;
   for(const b of [...obstacles,...extra]){const after=penetration(x,z,b);if(after>1e-8&&(!b.dynamic||after>=penetration(from.x,from.z,b)-1e-8))return false;}
  }return true;
 };
 const escape=(from,distance,extra=[])=>{
  let best=from,cost=Infinity;
  for(let i=0;i<16;i++){const angle=i*Math.PI/8,next={x:from.x+Math.cos(angle)*distance,z:from.z+Math.sin(angle)*distance};if(!canStep(from,next,extra))continue;
   const remaining=[...obstacles,...extra].reduce((sum,b)=>sum+penetration(next.x,next.z,b),0);if(remaining<cost){cost=remaining;best=next;}
  }return best;
 };
 return {nearest,path,clear,segmentClear,canStep,escape};
}
