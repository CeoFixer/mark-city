// Road and sidewalk geometry traced from the two-page drawing. Shared with navigation.
export const roads=[{x:0,z:0,w:170,d:14},{x:-34,z:0,w:9,d:60},{x:47,z:18,w:9,d:24}];
export const walks=[{x:3,z:18,w:6,d:24},{x:0,z:-11,w:180,d:8},{x:0,z:10.5,w:180,d:7},{x:0,z:30,w:180,d:4},{x:-87,z:0,w:6,d:64},{x:87,z:0,w:6,d:64},{x:-40,z:0,w:3,d:60},{x:-28,z:0,w:3,d:60},{x:8,z:20,w:4,d:20},{x:41,z:20,w:3,d:20},{x:53,z:20,w:3,d:20},{x:23,z:15,w:34,d:3},{x:23,z:22,w:3,d:16}];
export const crossings=[...[-41,-27,1,40,54].map(x=>({x,z:0,w:4,d:14})),{x:-34,z:-12,w:9,d:4},{x:-34,z:12,w:9,d:4},{x:47,z:12,w:9,d:4}];
export const contains=(r,x,z)=>Math.abs(x-r.x)<=r.w/2&&Math.abs(z-r.z)<=r.d/2;
export const onRoad=(x,z)=>roads.some(r=>contains(r,x,z));
export const onCrossing=(x,z)=>crossings.some(r=>contains(r,x,z));
export const onWalkway=(x,z)=>!onRoad(x,z)&&walks.some(r=>contains(r,x,z));
export const canWalk=(x,z)=>onCrossing(x,z)||onWalkway(x,z);
export const parkTrees=[[12,19],[12,27],[17,22],[18,26.5],[27,20],[29,26],[35,19],[36,27],[11.5,23],[16,18],[31,20.5],[33,23],[27,27],[37,23]];
export const destinations=[{x:-77,z:11},{x:-45,z:11},{x:-25,z:11},{x:-4,z:11},{x:23,z:17},{x:35,z:11},{x:61,z:11},{x:78,z:11},{x:77,z:-11},{x:54,z:-11},{x:20,z:-11},{x:-10,z:-11},{x:-60,z:-11}];
// Preserve the drawn order while leaving grass between walls/eaves and pavement.
export const roofOverhang=.3;
export const buildingSpecs=[
 ...[[-78,28,0x5cadd0,9],[-66,30,0xefb260,9],[-55.9,32,0xc49b78,8.5],[-46.5,34,0xf0d750,7.5]].map(([x,n,c,w])=>[x,-22.25,w,12,6,c,'Дом №'+n]),
 [-20.75,-22,9.5,12,5,0xd391b6,'VIOLET · ЛОББИ',false],
 [-8.5,-22,15,12,9,0xd796bf,'VIOLET МОТЕЛЬ',false],
 ...[[10,38,0x91bb83],[22,40,0xeaa2a5],[33,42,0xf0d85e],[43,44,0xb295c8],[56,46,0xdbd78e],[67,48,0xd4b399],[78,50,0xf0e9db]].map(([x,n,c])=>[x,-22.25,8,12,6,c,'Дом №'+n]),
 [-67,21,26,12,6,0xf0cc4f,'МЕГАЗИН',false,-1],
 [-47.5,21,9,12,6,0xe4dbd0,'ФУД МАРТ',false,-1],
 [-19,21,12,12,6,0xcab9a3,'ДИСКОТЕКА',false,-1],
 [-5.5,21,9,12,6,0xecd547,'ФИЛД ПАРК · Книги',false,-1],
 [61.5,20.5,12,11,7,0xe9c353,'Тиурба · Элементарная школа',false,-1]
];
// Cut pavement around asphalt so sidewalk meshes never cover a junction.
function subtract(a,b){const x1=Math.max(a.x-a.w/2,b.x-b.w/2),x2=Math.min(a.x+a.w/2,b.x+b.w/2),z1=Math.max(a.z-a.d/2,b.z-b.d/2),z2=Math.min(a.z+a.d/2,b.z+b.d/2);if(x1>=x2||z1>=z2)return [a];const out=[];const add=(l,r,t,u)=>{if(r>l&&u>t)out.push({x:(l+r)/2,z:(t+u)/2,w:r-l,d:u-t});};add(a.x-a.w/2,x1,a.z-a.d/2,a.z+a.d/2);add(x2,a.x+a.w/2,a.z-a.d/2,a.z+a.d/2);add(x1,x2,a.z-a.d/2,z1);add(x1,x2,z2,a.z+a.d/2);return out;}
export const pavement=roads.reduce((tiles,road)=>tiles.flatMap(tile=>subtract(tile,road)),walks);
