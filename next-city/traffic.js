// Smooth, closed routes on the roads drawn by Mark. All laps meet at the same
// west-end point and heading, so a car can choose another route without a jump.
const line=(a,b)=>({length:Math.hypot(b.x-a.x,b.z-a.z),at:t=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,dx:(b.x-a.x)/Math.hypot(b.x-a.x,b.z-a.z),dz:(b.z-a.z)/Math.hypot(b.x-a.x,b.z-a.z)})});
function roundedRoute(points,radius=2){
 const corners=points.map((p,i)=>{
  const prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length],a=Math.hypot(p.x-prev.x,p.z-prev.z),b=Math.hypot(next.x-p.x,next.z-p.z),inward={x:(p.x-prev.x)/a,z:(p.z-prev.z)/a},outward={x:(next.x-p.x)/b,z:(next.z-p.z)/b};
  const trim=Math.min(p.r??radius,a*.499,b*.499),start={x:p.x-inward.x*trim,z:p.z-inward.z*trim},end={x:p.x+outward.x*trim,z:p.z+outward.z*trim},center={x:start.x+outward.x*trim,z:start.z+outward.z*trim},sign=Math.sign(inward.x*outward.z-inward.z*outward.x),angle=Math.atan2(start.z-center.z,start.x-center.x);
  return {start,end,arc:{length:trim*Math.PI/2,at:t=>{const theta=angle+sign*t*Math.PI/2;return {x:center.x+Math.cos(theta)*trim,z:center.z+Math.sin(theta)*trim,dx:-Math.sin(theta)*sign,dz:Math.cos(theta)*sign};}}};
 });
 const segments=[];for(let i=0;i<corners.length;i++){const corner=corners[i],next=corners[(i+1)%corners.length];segments.push(corner.arc,line(corner.end,next.start));}
 // The first vertex is (-82,-3), and its arc ends at the common (-79,-3).
 segments.push(segments.shift());
 return {segments,length:segments.reduce((sum,s)=>sum+s.length,0)};
}
const p=(x,z,r)=>({x,z,r});
const west=p(-82,-3,3),westBack=p(-82,3,3),east=p(82,-3,3),eastBack=p(82,3,3);
export const cityTrafficRoutes=[
 roundedRoute([west,east,eastBack,westBack]),
 roundedRoute([west,p(-35.6,-3),p(-35.6,-25.6,1.6),p(-32.4,-25.6,1.6),p(-32.4,-3),east,eastBack,westBack]),
 roundedRoute([west,p(-32.4,-3),p(-32.4,25.6,1.6),p(-35.6,25.6,1.6),p(-35.6,3),westBack]),
 roundedRoute([west,p(48.6,-3),p(48.6,25.6,1.6),p(45.4,25.6,1.6),p(45.4,3),westBack])
];
export const trafficColors=[0xd64b4b,0x527cbd,0xedc949,0x6b9470,0xa879be,0xe39251,0xe4ddd0,0x72c5c7];
export function trafficPose(path,distance){let d=((distance%path.length)+path.length)%path.length;for(const segment of path.segments){if(d<=segment.length)return segment.at(segment.length?d/segment.length:0);d-=segment.length;}return path.segments[0].at(0);}
export function carCorners(pose,margin=0){const out=[];for(const forward of [-2.015-margin,2.015+margin])for(const side of [-1.04-margin,1.04+margin])out.push({x:pose.x+pose.dx*forward-pose.dz*side,z:pose.z+pose.dz*forward+pose.dx*side});return out;}
export function carsOverlap(a,b,margin=.15){
 const ac=carCorners(a,margin),bc=carCorners(b,margin);
 for(const axis of [{x:a.dx,z:a.dz},{x:-a.dz,z:a.dx},{x:b.dx,z:b.dz},{x:-b.dz,z:b.dx}]){
  const aa=ac.map(p=>p.x*axis.x+p.z*axis.z),bb=bc.map(p=>p.x*axis.x+p.z*axis.z);
  if(Math.max(...aa)<=Math.min(...bb)||Math.max(...bb)<=Math.min(...aa))return false;
 }
 return true;
}
const junctions=[-34,47];
const inJunction=(pose,x)=>Math.abs(pose.x-x)<8&&Math.abs(pose.z)<10;
export function initialTraffic(){
 const cars=[];
 for(let i=0;i<8;i++){
  const routeIndex=i%cityTrafficRoutes.length,path=cityTrafficRoutes[routeIndex];let distance=path.length*(i+.4)/8;
  for(let attempt=0;attempt<200;attempt++){
   const pose=trafficPose(path,distance);
   if(!junctions.some(x=>inJunction(pose,x))&&!cars.some(c=>Math.hypot(c.pose.x-pose.x,c.pose.z-pose.z)<9)){cars.push({routeIndex,distance:distance%path.length,path,pose,color:trafficColors[i]});break;}
   distance+=4;
  }
 }
 return cars;
}
export function createTrafficController(cars){
 const owners=new Map();
 return function advanceTraffic(dt,people=[]){
  for(const x of junctions){const owner=owners.get(x);if(owner&&!inJunction(owner.pose,x))owners.delete(x);}
  for(const car of cars){
   let routeIndex=car.routeIndex,path=car.path,distance=car.distance+4.6*dt;
   if(distance>=path.length){distance-=path.length;routeIndex=(routeIndex+1)%cityTrafficRoutes.length;path=cityTrafficRoutes[routeIndex];}
   const pose=trafficPose(path,distance);
   const crosses=junctions.filter(x=>inJunction(pose,x));
   if(crosses.some(x=>owners.has(x)&&owners.get(x)!==car))continue;
   if(cars.some(other=>other!==car&&carsOverlap(pose,other.pose)))continue;
   if(people.some(person=>{
    const dx=person.x-pose.x,dz=person.z-pose.z,radius=person.radius??.5,forward=dx*pose.dx+dz*pose.dz,side=-dx*pose.dz+dz*pose.dx;
    if(Math.abs(forward)>=2.7+radius||Math.abs(side)>=1.04+radius)return false;
    // Someone behind a departing car must not hold it across their crossing.
    const clearance=p=>{const x=person.x-p.x,z=person.z-p.z;return Math.hypot(Math.max(0,Math.abs(x*p.dx+z*p.dz)-2.015),Math.max(0,Math.abs(-x*p.dz+z*p.dx)-1.04));};
    return !(forward<-.5&&clearance(pose)>clearance(car.pose)+1e-6);
   }))continue;
   for(const x of crosses)owners.set(x,car);
   Object.assign(car,{routeIndex,path,distance,pose});
  }
 };
}
