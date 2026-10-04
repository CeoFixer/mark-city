export const PLAYER_RADIUS=.3;
export const RESIDENT_RADIUS=.5;
export const RESIDENTS_PER_SIDE=24;
export const parkSign={x:30,y:2.1,z:17.1,w:5.1,h:1.275,facing:-1};
// Covers the visible board and its backing, not the surrounding lawn.
export const parkSignCollider={x:parkSign.x,z:parkSign.z+.12,w:parkSign.w+.12,d:.27};

// Swept circles prevent fast diagonal steps from cutting through a resident.
// If a saved/spawned position overlaps, walking away must remain possible.
export function blocksCircleMove(from,to,circles,radius=PLAYER_RADIUS){
 const dx=to.x-from.x,dz=to.z-from.z,length2=dx*dx+dz*dz;
 return circles.some(circle=>{
  const limit=radius+circle.radius,fx=from.x-circle.x,fz=from.z-circle.z;
  const before=fx*fx+fz*fz,after=(to.x-circle.x)**2+(to.z-circle.z)**2;
  if(before<limit*limit-1e-8&&after>before+1e-8&&fx*dx+fz*dz>=-1e-8)return false;
  const t=length2?Math.max(0,Math.min(1,-(fx*dx+fz*dz)/length2)):0;
  return (fx+dx*t)**2+(fz+dz*t)**2<limit*limit-1e-8;
 });
}

// Keep the planned destination; take a small side step around a person when
// needed. Never displace the player or another resident, and wait if no space.
export function residentStep(from,target,distance,circles,canOccupy,side=1,radius=RESIDENT_RADIUS){
 const dx=target.x-from.x,dz=target.z-from.z,length=Math.hypot(dx,dz);
 if(length<1e-8||distance<=0)return {x:from.x,z:from.z};
 const travel=Math.min(distance,length),ux=dx/length,uz=dz/length;
 for(const angle of [0,side*Math.PI/6,side*Math.PI/3,side*Math.PI/2,-side*Math.PI/6,-side*Math.PI/3,-side*Math.PI/2]){
  const cos=Math.cos(angle),sin=Math.sin(angle);
  const next={x:from.x+(ux*cos-uz*sin)*travel,z:from.z+(ux*sin+uz*cos)*travel};
  if(canOccupy(next.x,next.z)&&canOccupy((from.x+next.x)/2,(from.z+next.z)/2)&&!blocksCircleMove(from,next,circles,radius))return next;
 }
 return {x:from.x,z:from.z};
}
