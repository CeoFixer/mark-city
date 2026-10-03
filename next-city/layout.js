// Road and sidewalk geometry traced from the two-page drawing. Shared with navigation.
export const roads=[{x:0,z:0,w:170,d:14},{x:-34,z:0,w:9,d:60},{x:3,z:18,w:6,d:24},{x:47,z:18,w:9,d:24}];
export const walks=[{x:0,z:-11,w:180,d:8},{x:0,z:10.5,w:180,d:7},{x:0,z:30,w:180,d:4},{x:-87,z:0,w:6,d:64},{x:87,z:0,w:6,d:64},{x:-40,z:0,w:3,d:60},{x:-28,z:0,w:3,d:60},{x:8,z:20,w:4,d:20},{x:41,z:20,w:3,d:20},{x:53,z:20,w:3,d:20},{x:23,z:15,w:34,d:3},{x:23,z:22,w:3,d:16}];
export const crossings=[...[-41,-27,1,40,54].map(x=>({x,z:0,w:4,d:14})),{x:-34,z:-12,w:9,d:4},{x:-34,z:12,w:9,d:4},{x:3,z:12,w:6,d:4},{x:47,z:12,w:9,d:4}];
export const contains=(r,x,z)=>Math.abs(x-r.x)<=r.w/2&&Math.abs(z-r.z)<=r.d/2;
export const onRoad=(x,z)=>roads.some(r=>contains(r,x,z));
export const onCrossing=(x,z)=>crossings.some(r=>contains(r,x,z));
export const onWalkway=(x,z)=>!onRoad(x,z)&&walks.some(r=>contains(r,x,z));
export const canWalk=(x,z)=>onCrossing(x,z)||onWalkway(x,z);
export const parkTrees=[[12,19],[12,27],[17,22],[18,26.5],[27,20],[29,26],[35,19],[36,27],[11.5,23],[16,18],[31,18],[33,23],[27,27],[37,23]];
export const destinations=[{x:-77,z:11},{x:-45,z:11},{x:-25,z:11},{x:-4,z:11},{x:23,z:17},{x:35,z:11},{x:61,z:11},{x:78,z:11},{x:77,z:-11},{x:54,z:-11},{x:20,z:-11},{x:-10,z:-11},{x:-60,z:-11}];
// Cut pavement around asphalt so sidewalk meshes never cover a junction.
function subtract(a,b){const x1=Math.max(a.x-a.w/2,b.x-b.w/2),x2=Math.min(a.x+a.w/2,b.x+b.w/2),z1=Math.max(a.z-a.d/2,b.z-b.d/2),z2=Math.min(a.z+a.d/2,b.z+b.d/2);if(x1>=x2||z1>=z2)return [a];const out=[];const add=(l,r,t,u)=>{if(r>l&&u>t)out.push({x:(l+r)/2,z:(t+u)/2,w:r-l,d:u-t});};add(a.x-a.w/2,x1,a.z-a.d/2,a.z+a.d/2);add(x2,a.x+a.w/2,a.z-a.d/2,a.z+a.d/2);add(x1,x2,a.z-a.d/2,z1);add(x1,x2,z2,a.z+a.d/2);return out;}
export const pavement=roads.reduce((tiles,road)=>tiles.flatMap(tile=>subtract(tile,road)),walks);
