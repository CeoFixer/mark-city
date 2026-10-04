import {residentStep,RESIDENT_RADIUS} from './collision.js?v=local-walk-11';

// Route recovery uses the same live obstacles as movement. Residents never
// teleport or push someone aside when traffic temporarily blocks a crossing.
export function createResidentWalker(navigation,destinations){
 function plan(actor,extra=[],advance=false){
  if(advance)actor.destination=(actor.destination+1)%destinations.length;
  actor.walk=navigation.path(actor.position,destinations[actor.destination],extra);
  actor.waypoint=1;actor.stalledTime=0;actor.bestDistance=Infinity;
  return actor.walk.length>1;
 }
 function step(actor,dt,circles=[],extra=[]){
  const radius=actor.radius??RESIDENT_RADIUS;
  const blockers=[...extra,...circles.map(p=>({x:p.x,z:p.z,radius:p.radius+radius,dynamic:true}))];
  if(!navigation.clear(actor.position.x,actor.position.z,blockers)){
   const before={x:actor.position.x,z:actor.position.z},next=navigation.escape(before,actor.speed*dt,blockers);
   actor.position.x=next.x;actor.position.z=next.z;
   return Math.hypot(next.x-before.x,next.z-before.z);
  }
  actor.retryIn=Math.max(0,(actor.retryIn??0)-dt);
  if(!actor.walk?.length){
   if(!actor.retryIn){plan(actor,blockers);actor.retryIn=1;}
   return 0;
  }
  const target=actor.walk[actor.waypoint];
  if(!target){plan(actor,blockers,true);return 0;}
  const before={x:actor.position.x,z:actor.position.z};
  const next=residentStep(before,target,actor.speed*dt,circles,(x,z)=>navigation.canStep(before,{x,z},extra),actor.avoidSide,radius);
  const moved=Math.hypot(next.x-before.x,next.z-before.z);
  actor.position.x=next.x;actor.position.z=next.z;
  const left=Math.hypot(next.x-target.x,next.z-target.z);
  if(left<.001){
   actor.waypoint++;actor.bestDistance=Infinity;actor.stalledTime=0;
   if(actor.waypoint>=actor.walk.length){actor.visits=(actor.visits??0)+1;plan(actor,blockers,true);}
  }else{
   // Detect both a full stop and shuffling back and forth at a blocked corner.
   if(left<(actor.bestDistance??Infinity)-.06){actor.bestDistance=left;actor.stalledTime=0;}
   else actor.stalledTime=(actor.stalledTime??0)+dt;
   if(actor.stalledTime>1.25&&!actor.retryIn){
    plan(actor,blockers);actor.replans=(actor.replans??0)+1;actor.retryIn=1;
   }
  }
  return moved;
 }
 return {plan,step};
}
