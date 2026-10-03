import * as THREE from '../vendor/three.module.js';
let materials;
function neonMaterials(){
 if(materials)return materials;
 // A soft square halo around each existing tile; no flashing or new obstacles.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,128,128);ctx.shadowColor='#fff';ctx.shadowBlur=18;ctx.fillStyle='#fff';ctx.fillRect(25,25,78,78);
 const alphaMap=new THREE.CanvasTexture(canvas);
 materials=[0x37edff,0xff52dd,0x9781ff,0xadff57].map(color=>({
  base:new THREE.MeshBasicMaterial({color}),
  edge:new THREE.MeshBasicMaterial({color:new THREE.Color(color).lerp(new THREE.Color(0xffffff),.65)}),
  halo:new THREE.MeshBasicMaterial({color,alphaMap,transparent:true,opacity:.48,blending:THREE.AdditiveBlending,depthWrite:false})
 }));
 return materials;
}
const tileGeometry=new THREE.BoxGeometry(1.9,.04,1.9),haloGeometry=new THREE.PlaneGeometry(2.8,2.8),edgeGeometry=new THREE.BoxGeometry(1.72,.014,.035);
export function createNeonDanceFloor(room){
 const pieces=[],colors=neonMaterials();
 const add=mesh=>{room.add(mesh);pieces.push(mesh);return mesh;};
 for(let x=-3;x<=3;x+=2)for(let z=-3;z<=3;z+=2){
  const material=colors[((x+3)/2+(z+3)/2)%colors.length];
  add(new THREE.Mesh(tileGeometry,material.base)).position.set(x,.03,z);
  const halo=add(new THREE.Mesh(haloGeometry,material.halo));halo.position.set(x,.06,z);halo.rotation.x=-Math.PI/2;
  for(const offset of [-.86,.86]){
   add(new THREE.Mesh(edgeGeometry,material.edge)).position.set(x,.068,z+offset);
   const side=add(new THREE.Mesh(edgeGeometry,material.edge));side.position.set(x+offset,.068,z);side.rotation.y=Math.PI/2;
  }
 }
 return pieces;
}
