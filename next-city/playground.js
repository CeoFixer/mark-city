// Exact solid parts shared by rendering and collision detection; no yard-wide wall.
export const swingPosts=[71,77].map(x=>({x,z:23,y:1.5,w:.36,d:.36,h:3}));
export const swingSeats=[72.5,75.5].map(x=>({x,z:23,y:.5,w:1,d:.8,h:.13}));
export const playPosts=[70.8,73.2].flatMap(x=>[15.2,17.6].map(z=>({x,z,y:1.4,w:.22,d:.22,h:2.8})));
export const playDeck={x:72,z:16.4,y:.9,w:3,d:3,h:.18};
export const playSteps=[.3,.6,.9].map(y=>({x:72,z:18,y,w:1,d:.25,h:.12}));
export const hoopPost={x:81,z:19,y:3,w:.32,d:.32,h:6};
export const schoolTrees=[{x:69,z:20,scale:.72},{x:82.4,z:16.6,scale:.65},{x:81.5,z:25.8,scale:.7}];
export const yardFences=[[67.5,15,76,15],[80,15,84,15],[84,15,84,27.7],[67.5,26,67.5,27.7],[67.5,27.7,84,27.7],[76,15,76,16.8],[80,15,80,16.8]];
export const fenceBounds=([x1,z1,x2,z2])=>({x:(x1+x2)/2,z:(z1+z2)/2,w:Math.abs(x2-x1)||.15,d:Math.abs(z2-z1)||.15});
export const playgroundSolids=[...swingPosts,...swingSeats,...playPosts,playDeck,...playSteps,hoopPost];
export const playgroundColliders=[...playgroundSolids,...yardFences.map(fenceBounds),...schoolTrees.map(p=>({x:p.x,z:p.z,w:.6*p.scale,d:.6*p.scale}))];
export const touchesObstacle=(x,z,obstacles,radius=.3)=>obstacles.some(b=>Math.abs(x-b.x)<b.w/2+radius&&Math.abs(z-b.z)<b.d/2+radius);
