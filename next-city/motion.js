// Distances are world units. Closed routes keep movement continuous at the seam.
export function route(points) {
  const segments=points.map((a,i)=>{const b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1];return {x:a[0],z:a[1],dx,dz,length:Math.hypot(dx,dz)}});
  return {segments,length:segments.reduce((sum,s)=>sum+s.length,0)};
}
export function sample(path,distance){
  let d=((distance%path.length)+path.length)%path.length;
  for(const s of path.segments){if(d<=s.length)return {x:s.x+s.dx*d/s.length,z:s.z+s.dz*d/s.length,dx:s.dx/s.length,dz:s.dz/s.length};d-=s.length;}
}
export const trafficRoutes=[route([[-81,-2],[81,-2],[81,2],[-81,2]]),route([[80,3],[-80,3],[-80,-3],[80,-3]])];
export const walkingRoutes=[route([[-78,11],[78,11],[78,12],[-78,12]]),route([[-78,-11],[78,-11],[78,-12],[-78,-12]])];
export function gait(limbs,phase,amount=1){
  // Left leg/right arm swing together; feet remain attached to the legs.
  limbs.forEach((limb,i)=>limb.rotation.x=Math.sin(phase+(i<2?0:Math.PI))*.55*amount);
}

// Bridge deck has short ramps; road and sidewalk tops match their visible meshes.
export function surfaceHeight(x,z){return Math.abs(Math.abs(z)-9)<1.5?.125:0;}
export function verticalStep(y,velocity,dt,ground){velocity-=14*dt;y+=velocity*dt;if(y<=ground){y=ground;velocity=0;}return {y,velocity};}

export const riverSegments=[];
export const inRiver=()=>false;export const onBridge=()=>false;export const shouldSwim=()=>false;

// Shared navigation grid is rebuilt from the edited city's actual obstacles.
export function createWalkNavigation(obstacles){
 const cells=new Map(),key=(x,z)=>`${x},${z}`;
 const clear=(x,z)=>!obstacles.some(b=>Math.abs(x-b.x)<b.w/2+.42&&Math.abs(z-b.z)<b.d/2+.42)&&(!inRiver(x,z)||onBridge(x,z));
 for(let x=-82;x<=82;x++)for(let z=-29;z<=29;z++){
  const horizontal=Math.abs(z)<7;
  const vertical=Math.abs(x+34)<4.5||(z>7&&Math.abs(x-47)<4.5);
  if(horizontal&&![-41,-27,1,40,54].some(c=>Math.abs(x-c)<2))continue;
  if(vertical&&Math.abs(Math.abs(z)-12)>2)continue;
  if(clear(x,z))cells.set(key(x,z),{x,z});
 }
 const nearest=p=>{let best=null,distance=Infinity;for(const c of cells.values()){const d=(p.x-c.x)**2+(p.z-c.z)**2;if(d<distance){distance=d;best=c;}}return best;};
 function path(from,to){const start=nearest(from),goal=nearest(to);if(!start||!goal)return [];const queue=[start],parents=new Map([[key(start.x,start.z),null]]);let found=null;
  for(let i=0;i<queue.length;i++){const c=queue[i];if(c===goal){found=c;break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=key(c.x+dx,c.z+dz),n=cells.get(k);if(!n||parents.has(k))continue;if(!clear(c.x+dx*.5,c.z+dz*.5))continue;parents.set(k,c);queue.push(n);}}
  if(!found)return [];const points=[];for(let c=found;c;c=parents.get(key(c.x,c.z)))points.push(c);points.reverse();return points.filter((p,i)=>!i||i===points.length-1||(p.x-points[i-1].x)!==(points[i+1].x-p.x)||(p.z-points[i-1].z)!==(points[i+1].z-p.z));
 }
 return {nearest,path,clear};
}
