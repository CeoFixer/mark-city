import * as THREE from '../vendor/three.module.js';
import {sample,trafficRoutes,walkingRoutes,gait,surfaceHeight,verticalStep,riverSegments,shouldSwim,createWalkNavigation} from './motion.js';
import {loadCity,loadGarage,saveGarage,buyCar,carOffers,defaultRoom,furnitureSizes} from './city-data.js?v=field-park-1';
import {replyLine} from './dialogues.js?v=field-park-1';
const cityEdits=loadCity(),baseCatalog=[];
const $=id=>document.getElementById(id), canvas=$('world');
let renderer;
try { renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'}); }
catch(e){$('error').hidden=false;$('error').textContent='Не удалось включить 3D. Открой игру в Safari или Chrome с включённым WebGL.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);
renderer.setClearColor(0xc9e5ea);renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xc9e5ea,95,220);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,280);
scene.add(new THREE.HemisphereLight(0xfff7df,0x719963,2.4));const sun=new THREE.DirectionalLight(0xfff1d2,2.2);sun.position.set(-40,70,20);scene.add(sun);
const mats=new Map(),colliders=[],landmarks=[],mapBuildings=[],cameraObstacles=[];
const mat=color=>{if(!mats.has(color))mats.set(color,new THREE.MeshLambertMaterial({color}));return mats.get(color)};
const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,10,8);
function box(x,y,z,w,h,d,color,parent=scene){const m=new THREE.Mesh(boxGeo,mat(color));m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;}
const doorMaterial=new THREE.MeshBasicMaterial({color:0x64b6df});
function blueDoor(x,z,w,h,parent=scene){const door=box(x,h/2,z,w,h,.045,0x64b6df,parent);door.material=doorMaterial;return door;}
function ball(x,y,z,r,color,parent=scene,sx=1,sy=1,sz=1){const m=new THREE.Mesh(sphereGeo,mat(color));m.position.set(x,y,z);m.scale.set(r*sx,r*sy,r*sz);parent.add(m);return m;}
function cylinder(x,y,z,r,h,color,vertices=8,parent=scene){let m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,vertices),mat(color));m.position.set(x,y,z);parent.add(m);return m;}
function label(text,x,y,z,width=6,facing=1,parent=scene){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#fff1c8';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#524e3b';ctx.lineWidth=6;ctx.strokeRect(5,5,502,118);ctx.fillStyle='#364540';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 43px sans-serif';ctx.fillText(text,256,66,480);const tx=new THREE.CanvasTexture(c);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshBasicMaterial({map:tx,side:THREE.DoubleSide}));mesh.position.set(x,y,z);if(facing<0)mesh.rotation.y=Math.PI;parent.add(mesh);}
box(0,-.3,0,180,.5,64,0x91b968);
// Two pages of Mark's new drawing: one avenue and two cross streets.
box(0,.01,0,170,.08,14,0xaaa9a0);
box(-34,.02,0,9,.08,60,0xaaa9a0);box(47,.02,18,9,.08,24,0xaaa9a0);
for(const z of [-9,9])box(0,.06,z,170,.13,3,0xd5cfb5);
function crossing(x,z,vertical=false){for(let i=-3;i<=3;i++)box(x+(vertical?i*1.1:0),.11,z+(vertical?0:i*1.7),vertical?.65:4,.05,vertical?4:.7,0xf9d951);}
for(const x of [-41,-27,1,40,54])crossing(x,0);
for(const z of [-12,12])crossing(-34,z,true);crossing(47,12,true);
const palette=[0xdeb0c8,0xe7ce64,0x6eb1c2,0xaf8dca,0xe88e7f,0xb0c5a0];
function building(x,z,w,d,h,color,name='',roof=true){const id=mapBuildings.length;baseCatalog.push({x,z,w,d,h,color,name:name||`Дом №${id+1}`,roof});const edit=cityEdits.overrides[id];if(edit)({x,z,w,d,h,color,name,roof}=edit);cameraObstacles.push(box(x,h/2,z,w,h,d,color));colliders.push({x,z,w:w+.6,d:d+.6});const facing=z<0?1:-1;const front=z+facing*(d/2+.05);mapBuildings.push({id:mapBuildings.length,x,z,w,d,h,color,roof,name:name||`Дом №${mapBuildings.length+1}`,doorX:x,doorZ:front+facing*1.05,facing});
const doorHeight=Math.min(h-.35,2.9);blueDoor(x,front,1.45,doorHeight);for(let i=-1;i<=1;i+=2)for(let row=0;row<Math.max(1,Math.floor(h/3));row++)box(x+i*w*.29,1.8+row*2.4,front,.85,1.1,.15,0x5b9cbe);
if(roof){let r=new THREE.Mesh(new THREE.ConeGeometry(w*.76,1.7,4),mat(color));r.rotation.y=Math.PI/4;r.scale.z=d/w;r.position.set(x,h+.8,z);scene.add(r);}
if(name){if(!/^Дом №/.test(name))label(name,x,h-.55,front+facing*.1,Math.min(w-.3,9),facing);landmarks.push({x,z,name})}}
// Buildings follow the photograph from left to right, north row then south row.
for(const [x,n,c] of [[-78,28,0x5cadd0],[-65,30,0xefb260],[-53,32,0xc49b78],[-44,34,0xf0d750]])building(x,-21,9,12,6,c,'Дом №'+n);
building(-22,-21,9,12,5,0xd391b6,'VIOLET · ЛОББИ',false);
building(-10,-21,15,12,9,0xd796bf,'VIOLET МОТЕЛЬ',false);
for(const [x,n,c] of [[10,38,0x91bb83],[22,40,0xeaa2a5],[33,42,0xf0d85e],[43,44,0xb295c8],[56,46,0xdbd78e],[67,48,0xd4b399],[78,50,0xf0e9db]])building(x,-23,8,10,6,c,'Дом №'+n);
building(-67,21,26,14,7,0xf0cc4f,'МЕГАЗИН',false);
building(-47,21,10,14,7,0xe4dbd0,'ФУД МАРТ',false);
building(-19,21,12,14,6,0xcab9a3,'ДИСКОТЕКА',false);
building(-5,21,10,14,6,0xecd547,'ФИЛД ПАРК · Книги',false);
building(61,20,12,12,7,0xe9c353,'ШКОЛА',false);
const baseCount=baseCatalog.length;
function tree(x,z,scale=1){if(mapBuildings.some(b=>Math.hypot(x-b.doorX,z-b.doorZ)<1.5||(Math.abs(x-b.x)<b.w/2+.7&&Math.abs(z-b.z)<b.d/2+.7)))return;cylinder(x,1.6*scale,z,.32*scale,3.2*scale,0x826345);cameraObstacles.push(ball(x,3.9*scale,z,1.6*scale,0x4e9165,scene,.9,1.25,.8));colliders.push({x,z,w:.6*scale,d:.6*scale});}
for(const [x,z] of [[-57,-27],[-28,-26],[1,-25],[17,-27],[50,-28],[10,16],[12,25],[20,28],[28,16],[33,24],[73,-28]])tree(x,z,1.15);
box(22,.03,20,35,.06,20,0x88b968);label('ФИЛД ПАРК',23,2.8,12,8,-1);
// Park bench and small snack kiosk.
box(20,.6,21,3,.2,.7,0xb58b57);box(20,1.1,21.3,3,.8,.12,0xb58b57);for(const x of [19,21])box(x,.3,21,.13,.6,.6,0x566c59);
colliders.push({x:20,z:21,w:3,d:.8});
box(31,1.2,28,3,2.4,2,0xda9680);label('СНЕКИ',31,2.1,26.9,2.8,-1);
// School playground from the right-hand page.
box(61,.07,11.5,4,.09,7,0xd6aa75);
for(const x of [71,77])cylinder(x,1.5,23,.12,3,0xc77868);box(74,3,23,6,.15,.15,0xc77868);
for(const x of [72.5,75.5]){box(x,1.7,23,.06,2.4,.06,0x756953);box(x,.5,23,1,.13,.8,0xd8b75f);}
box(72,1,15,3,2,3,0xd29d75);const playRoof=new THREE.Mesh(new THREE.ConeGeometry(2.4,2,4),mat(0xdb8e83));playRoof.position.set(72,3,15);playRoof.rotation.y=Math.PI/4;scene.add(playRoof);
cylinder(81,2,19,.12,4,0xc57667);box(81,4,19,2,1.5,.15,0xf4ead0);
const hoop=new THREE.Mesh(new THREE.TorusGeometry(.6,.06,6,16),mat(0xbc7258));hoop.rotation.x=Math.PI/2;hoop.position.set(81,3.65,19.7);scene.add(hoop);
for(const [x,z] of [[69,13],[76,27],[55,27]]){cylinder(x,.3,z,.07,.6,0x73955d);ball(x,.7,z,.3,0xdf9daf);}
function car(x,z,color,rot=0){const g=new THREE.Group();g.scale.set(1.3,1.2,1.3);g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);box(0,.72,0,3.1,.9,1.6,color,g);box(-.25,1.4,0,1.65,.8,1.45,color,g);box(-.25,1.48,.74,1.25,.46,.05,0x8cc4df,g);box(-.25,1.48,-.74,1.25,.46,.05,0x8cc4df,g);for(let x of [-1,1])for(let z of [-.82,.82])ball(x,.4,z,.38,0x354047,g);return g;}
function stop(x,z){cylinder(x,1.3,z,.1,2.6,0x62564b);let m=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.12,8),mat(0xd97a69));m.rotation.x=Math.PI/2;m.position.set(x,2.6,z);scene.add(m)}for(let x of [-40,41])stop(x,7);
function person(type='mark'){const g=new THREE.Group(),skin=(type==='mark'||type==='egor')?0xe3b786:0xf2d957,shirt=type==='egor'?0x303435:type==='mark'?0x99b8c8:type==='pink'?0xdd87b4:0xe8c650;const torso=box(0,1.2,0,.65,.8,.4,shirt,g);ball(0,1.98,0,.43,skin,g,1,1.1,.9);for(let x of [-.44,.44])ball(x,1.96,0,.1,skin,g);if(type==='mark'||type==='egor'){ball(0,2.24,-.035,.43,(type==='egor'?0x322a27:0x866344),g,1,.55,.9);for(let x of [-.22,0,.22])box(x,2.23,.28,.21,.2,.14,(type==='egor'?0x322a27:0x866344),g);if(type==='mark'){box(0,1.52,.23,.56,.08,.08,0x417ab1,g);for(const x of [-.12,.12]){const collar=box(x,1.52,.24,.19,.16,.06,0xb2cbd7,g);collar.rotation.z=x<0?-.4:.4;}for(const y of [1.3,1.4])ball(0,y,.23,.022,0xe8eef0,g);}}for(let x of [-.15,.15]){ball(x,2.02,.36,.1,0xfff8ee,g,1,1,.4);ball(x,2.02,.402,.047,(type==='mark'||type==='egor'?0x68452f:0x367eae),g,1,1,.4);if(type==='mark')for(let j=0;j<3;j++)ball(x+(j-1)*.055,1.86-(j%2)*.04,.365,.017,0xad693e,g);}if(type==='egor'){for(const x of [-.38,.38])box(x,1.97,-.08,.18,.75,.45,0x322a27,g);box(0,1.98,-.3,.65,.7,.2,0x322a27,g);box(0,1.73,.3,.36,.17,.08,0x755e4a,g);}box(0,1.78,.36,.17,.035,.03,0x754e39,g);let limbs=[];for(let s of [-1,1]){let leg=new THREE.Group();leg.position.set(s*.19,.83,0);g.add(leg);box(0,-.2,0,.24,.4,.27,0x496a8d,leg);const knee=new THREE.Group();knee.position.y=-.4;leg.add(knee);leg.userData.knee=knee;box(0,-.2,0,.24,.4,.27,0x496a8d,knee);box(0,-.35,.08,.28,.17,.45,0x5b584e,knee);limbs.push(leg);let arm=new THREE.Group();arm.position.set(s*.48,1.49,0);g.add(arm);box(0,-.35,0,.19,.7,.22,skin,arm);limbs.push(arm);}g.userData.limbs=limbs;return g;}
// Combine static geometry by material to keep the draw-call count low.
scene.updateMatrixWorld(true);
const batches=new Map(),staticMeshes=[];
scene.traverse(o=>{if(o.isMesh&&!o.material.map)staticMeshes.push(o)});
for(const mesh of staticMeshes){let g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(mesh.matrixWorld);if(!batches.has(mesh.material))batches.set(mesh.material,[]);batches.get(mesh.material).push(g);mesh.removeFromParent();}
for(const [material,geometries] of batches){const merged=new THREE.BufferGeometry();for(const name of ['position','normal']){let length=geometries.reduce((sum,g)=>sum+g.attributes[name].array.length,0),arr=new Float32Array(length),offset=0;for(const g of geometries){arr.set(g.attributes[name].array,offset);offset+=g.attributes[name].array.length;}merged.setAttribute(name,new THREE.BufferAttribute(arr,3));}merged.computeBoundingSphere();scene.add(new THREE.Mesh(merged,material));for(const g of geometries)g.dispose();}
// Dynamic actors remain separate from the static city. Instances share draw calls.
const walkNavigation=createWalkNavigation(colliders),pedestrians=[],traffic=[];
const walkDestinations=[{x:-77,z:11},{x:-45,z:11},{x:-25,z:11},{x:-4,z:11},{x:20,z:14},{x:35,z:11},{x:61,z:11},{x:78,z:11},{x:77,z:-11},{x:54,z:-11},{x:20,z:-11},{x:-10,z:-11},{x:-60,z:-11}];
for(let lane=0;lane<2;lane++){
  const path=walkingRoutes[lane];
  for(let i=0;i<12;i++){const root=person(i%2?'yellow':'pink');root.removeFromParent();pedestrians.push({root,path,distance:path.length*(i+.3)/12,speed:1.05+(i%3)*.13,phase:i,profile:i%4,visits:0});}
  for(let i=0;i<4;i++){const root=car(0,0,palette[i%6]);root.removeFromParent();const collider={x:0,z:0,w:4.03,d:2.08};colliders.push(collider);traffic.push({root,path:trafficRoutes[lane],distance:trafficRoutes[lane].length*i/4,collider});}
}
const egorRoot=person('egor');egorRoot.scale.setScalar(1.05);pedestrians.push({root:egorRoot,path:walkingRoutes[0],distance:4,speed:1.15,phase:0,profile:0,visits:0,isEgor:false});
function chooseWalk(actor){for(let attempt=0;attempt<walkDestinations.length;attempt++){actor.destination=(actor.destination+1)%walkDestinations.length;const path=walkNavigation.path(actor.root.position,walkDestinations[actor.destination]);if(path.length>1){actor.walk=path;actor.waypoint=1;return;}}actor.walk=[];}
pedestrians.forEach((actor,i)=>{const initial=sample(actor.path,actor.distance),start=walkNavigation.nearest(initial);actor.root.position.set(start.x,surfaceHeight(start.x,start.z),start.z);actor.destination=i%walkDestinations.length;chooseWalk(actor);actor.root.updateMatrixWorld(true);});
const instanceGroups=new Map();
for(const actor of [...pedestrians,...traffic])actor.root.traverse(mesh=>{
  if(!mesh.isMesh)return;const key=mesh.geometry.uuid+mesh.material.uuid;
  if(!instanceGroups.has(key))instanceGroups.set(key,{geometry:mesh.geometry,material:mesh.material,parts:[]});
  instanceGroups.get(key).parts.push(mesh);
});
for(const batch of instanceGroups.values()){batch.mesh=new THREE.InstancedMesh(batch.geometry,batch.material,batch.parts.length);batch.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);batch.mesh.frustumCulled=false;scene.add(batch.mesh);}
function updateCity(dt){
  for(const actor of pedestrians){if(actor===talkingActor)continue;let remaining=actor.speed*dt,moved=false;
    while(remaining>0&&actor.walk.length){const next=actor.walk[actor.waypoint],dx=next.x-actor.root.position.x,dz=next.z-actor.root.position.z,distance=Math.hypot(dx,dz),travel=Math.min(remaining,distance),x=actor.root.position.x+(distance?dx/distance*travel:0),z=actor.root.position.z+(distance?dz/distance*travel:0);
      if(traffic.some(t=>Math.abs(x-t.collider.x)<t.collider.w/2+.65&&Math.abs(z-t.collider.z)<t.collider.d/2+.65)||(ownedCar&&Math.hypot(x-ownedCar.position.x,z-ownedCar.position.z)<2.8))break;
      actor.root.position.set(x,surfaceHeight(x,z),z);if(distance>.001){const angle=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(angle-actor.root.rotation.y),Math.cos(angle-actor.root.rotation.y));actor.root.rotation.y+=delta*Math.min(1,dt*8);moved=true;}remaining-=travel;
      if(distance<=travel+.001){actor.waypoint++;if(actor.waypoint>=actor.walk.length){chooseWalk(actor);break;}}else break;
    }
    if(moved)actor.phase+=actor.speed*dt*5;gait(actor.root.userData.limbs,actor.phase,moved?1:0);actor.root.updateMatrixWorld(true);
  }
  // Shared lane speed preserves spacing; cars queue if the player blocks a lane.
  const advances=traffic.map(actor=>{
    let advance=4.6*dt;
    for(const other of traffic){if(other===actor||other.path!==actor.path)continue;const gap=(other.distance-actor.distance+actor.path.length)%actor.path.length;advance=Math.min(advance,Math.max(0,gap-6.6));}
    const p=sample(actor.path,actor.distance+advance);if(ownedCar&&Math.hypot(p.x-ownedCar.position.x,p.z-ownedCar.position.z)<5.3)advance=0;
    if(pedestrians.some(a=>Math.abs(a.root.position.x-p.x)<Math.abs(p.dx)*2.015+Math.abs(p.dz)*1.04+.8&&Math.abs(a.root.position.z-p.z)<Math.abs(p.dz)*2.015+Math.abs(p.dx)*1.04+.8))advance=0;
    if(Math.abs(player.x-p.x)<(Math.abs(p.dx)*2.015+Math.abs(p.dz)*1.04+.7)&&Math.abs(player.z-p.z)<(Math.abs(p.dz)*2.015+Math.abs(p.dx)*1.04+.7))advance=0;
    return advance;
  });
  traffic.forEach((actor,i)=>{actor.distance=(actor.distance+advances[i])%actor.path.length;const p=sample(actor.path,actor.distance);actor.root.position.set(p.x,0,p.z);actor.root.rotation.y=Math.atan2(-p.dz,p.dx);Object.assign(actor.collider,{x:p.x,z:p.z,w:Math.abs(p.dx)*4.03+Math.abs(p.dz)*2.08,d:Math.abs(p.dz)*4.03+Math.abs(p.dx)*2.08});actor.root.updateMatrixWorld(true);});
  for(const batch of instanceGroups.values()){batch.parts.forEach((mesh,i)=>batch.mesh.setMatrixAt(i,mesh.matrixWorld));batch.mesh.instanceMatrix.needsUpdate=true;}
}
let avatar=person();avatar.scale.setScalar(.85);scene.add(avatar);avatar.rotation.y=Math.PI/2;const player=new THREE.Vector3(-73,0,11);let yaw=-Math.PI/2,pitch=.12,first=true,step=0;const keys=new Set();let active=true,sitting=false,swimming=false,jumpVelocity=0,jumpCount=0,jumpPeak=0;
function reset(){sitting=false;swimming=false;if(driving){leaveCar();driving=false;}if(inside)exitBuilding();closeTalk();player.set(-73,surfaceHeight(-73,11),11);jumpVelocity=0;yaw=-Math.PI/2;pitch=.12;}function switchCamera(){first=!first;$('camera').textContent='Камера: '+(first?'от первого лица':'со стороны')+' · V';}
$('camera').onclick=switchCamera;$('home').onclick=reset;
const welcome=$('welcome');$('play').onclick=()=>{welcome.close();active=true};$('menuButton').onclick=()=>{keys.clear();active=false;welcome.showModal()};welcome.addEventListener('cancel',()=>{active=true});
$('hero').onchange=()=>{scene.remove(avatar);avatar=person($('hero').value);avatar.scale.setScalar(.85);avatar.rotation.y=Math.PI/2;scene.add(avatar)};
addEventListener('keydown',e=>{if(e.code==='Escape'){if(garageDialog.open||galleryDialog.open||drawingDialog.open)return;if(talkingActor){closeTalk();e.preventDefault();return;}if(!welcome.open){active=false;keys.clear();welcome.showModal();e.preventDefault()}return}if(!active||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==='Space'&&!e.repeat&&!driving&&!sitting&&!swimming&&!talkingActor){e.preventDefault();if(player.y<=(inside?0:surfaceHeight(player.x,player.z))+.015){jumpVelocity=5;jumpCount++;jumpPeak=player.y;}return;}if(e.code==='KeyE'&&!e.repeat){useNearby();return;}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(!e.repeat&&e.code==='KeyV')switchCamera();if(!e.repeat&&e.code==='KeyR')reset()});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
let drag=null;canvas.addEventListener('pointerdown',e=>{if(!active)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!drag||driving)return;yaw-=(e.clientX-drag.x)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.004,-.5,.8);drag={x:e.clientX,y:e.clientY}});for(let evt of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(evt,()=>drag=null);
for(let b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{if(!active)return;e.preventDefault();keys.add(b.dataset.key);b.setPointerCapture(e.pointerId)};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.key)}
let inside=null,returnPose=null,talkingActor=null,nearby=null;
const actionButton=document.createElement('button');actionButton.id='interact';actionButton.hidden=true;document.body.appendChild(actionButton);
const chat=document.createElement('section');chat.id='conversation';chat.hidden=true;chat.setAttribute('aria-label','Разговор с жителем');document.body.appendChild(chat);
const room=new THREE.Group();room.position.set(1000,0,1000);room.visible=false;scene.add(room);
const roomWalls=[],roomFurniture=[],roomColliders=[],classPeople=[];
const roomFloor=box(0,-.15,0,16,.3,16,0xd6bf8f,room);box(0,5.15,0,16,.2,16,0xf0e9d8,room);
for(const [x,z,w,d] of [[-8,0,.2,16],[8,0,.2,16],[0,-8,16,.2],[0,8,16,.2]])roomWalls.push(box(x,2.5,z,w,5,d,0xe8dbc0,room));
const exitDoor=blueDoor(0,7.87,1.8,2.9,room);roomWalls.push(exitDoor);
for(let x of [-3.5,3.5])box(x,2.2,-7.87,1.8,1.5,.06,0x94cbd7,room);
function furnish(x,z,w,h,d,color){const mesh=box(x,h/2,z,w,h,d,color,room);roomFurniture.push(mesh);roomColliders.push({x,z,w,d});return mesh;}
function buildInterior(building){
  for(const mesh of roomFurniture)room.remove(mesh);roomFurniture.length=0;roomColliders.length=0;classPeople.length=0;
  const renovation=cityEdits.rooms[building.id];roomWalls.forEach(w=>{if(w!==exitDoor)w.material=mat(renovation?.wall??building.color)});roomFloor.material=mat(renovation?.floor??0xd6bf8f);
  if(renovation){for(const f of renovation.furniture){const size=furnitureSizes[f.type];furnish(f.x,f.z,size.w,size.h,size.d,f.color);if(f.type==='sofa')furnish(f.x,f.z-.9,size.w,1.2,.3,f.color);}}
  else if(/ШКОЛА/.test(building.name)){
    for(let x of [-3,3])for(let z of [-2.5,1]){
      const top=box(x,.9,z,2.2,.15,1.2,0xc69e64,room);roomFurniture.push(top);roomColliders.push({x,z,w:2.2,d:1.2});
      for(const dx of [-.85,.85])for(const dz of [-.4,.4])roomFurniture.push(box(x+dx,.45,z+dz,.12,.9,.12,0x876b4e,room));
      furnish(x,z+1.1,.8,.55,.8,0x749eaf);
      const pupil=person('yellow');pupil.scale.setScalar(.7);pupil.position.set(x,.05,z+1.1);pupil.rotation.y=Math.PI;pupil.userData.limbs[0].rotation.x=-1.15;pupil.userData.limbs[2].rotation.x=-1.15;room.add(pupil);roomFurniture.push(pupil);classPeople.push(pupil);
      roomFurniture.push(box(x,1,z,.55,.025,.4,0xfff8df,room));
    }
    roomFurniture.push(box(0,2.5,-7.75,5,2,.15,0x8b6c45,room));roomFurniture.push(box(0,2.5,-7.64,4.7,1.7,.08,0x3f6853,room));
    const boardCanvas=document.createElement('canvas');boardCanvas.width=256;boardCanvas.height=128;const bc=boardCanvas.getContext('2d');bc.fillStyle='#3f6853';bc.fillRect(0,0,256,128);bc.fillStyle='#f5f2dc';bc.font='28px sans-serif';bc.fillText('2 + 3 = 5',30,50);bc.fillText('А Б В',55,100);const board=new THREE.Mesh(new THREE.PlaneGeometry(4.5,1.5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(boardCanvas)}));board.position.set(0,2.5,-7.57);room.add(board);roomFurniture.push(board);
    const teacher=person('pink');teacher.position.set(-3.8,0,-6);room.add(teacher);roomFurniture.push(teacher);classPeople.push(teacher);
  }
  else if(/Галерея/i.test(building.name)){for(const art of galleryWorks){const h=3,w=h*art.ratio;const mount=new THREE.Group();mount.position.set(art.x,0,art.z);mount.rotation.y=art.rotation;room.add(mount);roomFurniture.push(mount);box(0,2.3,-.06,w+.18,h+.18,.12,0x886c4d,mount);const picture=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:art.texture}));picture.position.set(0,2.3,.015);mount.add(picture);}}
  else if(/КЛИНИКА|АПТЕКА/.test(building.name)){furnish(-3,-2,2.5,.65,3.4,0xedf0e8);furnish(3,-3,1.8,2,1,0xa6d0cd);furnish(2,1,2,1,1,0xc6ad8c);}
  else if(/АВТОВАН/.test(building.name)){furnish(0,-3,5,1.1,1.3,0xc3a87b);const seller=person('yellow');seller.position.set(-3,0,-4);room.add(seller);roomFurniture.push(seller);for(let x of [-1.5,0,1.5])roomFurniture.push(box(x,1.3,-3,.8,.3,.4,palette[Math.floor(x+2)],room));}
  else if(/БИБЛИОТЕКА|Книги/.test(building.name)){for(let x of [-4.4,4.4]){furnish(x,-1,1,2.6,5,0xb58c64);for(let z of [-2.5,-1,.5])for(let y of [.6,1.4,2.2]){const book=box(x,y,z,.95,.5,.8,palette[Math.floor((z+3+y)*2)%6],room);roomFurniture.push(book);}}furnish(0,-2,2,1,1.5,0xc69e64);}
  else if(/МЕГАЗИН|ФУД МАРТ/.test(building.name)){furnish(0,-2,6,1,1.2,0xc69e64);furnish(-4,-4,1.5,2.2,1.3,0xb7c9b8);for(let x of [-1.5,0,1.5]){const bread=ball(x,1.2,-2,.3,0xe7ba70,room,1.4,.6,.8);roomFurniture.push(bread);}}
  else if(/ДИСКОТЕКА/.test(building.name)){for(let x=-3;x<=3;x+=2)for(let z=-3;z<=3;z+=2)roomFurniture.push(box(x,.03,z,1.9,.04,1.9,palette[(x+z+6)/2%6],room));for(const x of [-5,5])furnish(x,-4,1.5,2.5,1.5,0x4f5260);furnish(0,-5,4,1,1,0xbda1c6);}
  else {furnish(-3,-2,2.6,.7,2,0x7ca398);furnish(-3,-2.9,2.6,1.2,.3,0x7ca398);furnish(1,-1,2,.7,1.4,0xc5a16b);furnish(4,-4,1.4,2.2,1.4,0xb6a1bf);}
}
const galleryWorks=[];
const galleryDialog=document.createElement('dialog');galleryDialog.id='gallery';galleryDialog.innerHTML='<h2 id="galleryTitle">Галерея</h2><p id="galleryNote"></p><a id="gallerySource" target="_blank" rel="noopener">Источник репродукции</a><div id="galleryScroll"><img id="galleryArt" alt="Репродукция картины"></div><button id="galleryZoom">Увеличить</button><button id="galleryClose">Вернуться в галерею</button>';document.body.appendChild(galleryDialog);
function openGallery(){keys.clear();active=false;const art=nearby.art;$('galleryTitle').textContent=art.title;$('galleryArt').src=art.src;$('galleryArt').classList.remove('zoomed');$('galleryZoom').textContent='Увеличить';$('galleryNote').textContent=art.note;$('gallerySource').href=art.source;galleryDialog.showModal();}
$('galleryZoom').onclick=()=>{const zoom=$('galleryArt').classList.toggle('zoomed');$('galleryZoom').textContent=zoom?'Уменьшить':'Увеличить';};
$('galleryClose').onclick=()=>{galleryDialog.close();active=true;keys.clear();};galleryDialog.addEventListener('cancel',()=>{active=true;keys.clear();});
const outdoorObjects=scene.children.filter(o=>o!==avatar&&o!==room&&!o.isLight);
function enterBuilding(building){sitting=false;swimming=false;closeTalk();returnPose={position:player.clone(),yaw,pitch};inside=building;buildInterior(building);outdoorObjects.forEach(o=>o.visible=false);room.visible=true;player.set(1000,0,1004.5);jumpVelocity=0;yaw=0;pitch=.08;keys.clear();$('map').hidden=true;}
function exitBuilding(){if(!inside)return;inside=null;room.visible=false;outdoorObjects.forEach(o=>o.visible=true);player.copy(returnPose.position);jumpVelocity=0;yaw=returnPose.yaw;pitch=returnPose.pitch;keys.clear();$('map').hidden=false;}
function closeTalk(){talkingActor=null;chat.hidden=true;}
function startTalk(actor){talkingActor=actor;actor.root.rotation.y=Math.atan2(player.x-actor.root.position.x,player.z-actor.root.position.z);actor.root.userData.limbs.forEach(l=>l.rotation.x=0);actor.root.updateMatrixWorld(true);const profile=cityEdits.profiles[actor.profile],visit=actor.visits++;chat.hidden=false;chat.replaceChildren();const heading=document.createElement('b');heading.textContent=actor.isEgor?'Егор':profile.name;const reply=document.createElement('p');reply.textContent=replyLine(profile.hello,visit);chat.append(heading,reply);for(const text of ['Привет!','Что любишь в городе?','Что есть поблизости?','Пока!']){const button=document.createElement('button');button.textContent=text;button.onclick=()=>{if(text==='Пока!'){closeTalk();return;}if(text==='Привет!')reply.textContent=replyLine(profile.hello,visit+1);else if(text==='Что любишь в городе?')reply.textContent=replyLine(profile.place,visit);else {const place=landmarks.reduce((a,b)=>Math.hypot(b.x-player.x,b.z-player.z)<Math.hypot(a.x-player.x,a.z-player.z)?b:a);reply.textContent=`Недалеко отсюда — ${place.name}. Вход ищи у синей двери.`;}};chat.appendChild(button);}}
function useNearby(){if(!active)return;if(sitting){sitting=false;player.set(20,0,19.5);jumpVelocity=0;keys.clear();return;}if(driving){leaveCar();return;}if(talkingActor){closeTalk();return;}if(!nearby)return;if(nearby.type==='bench'){closeTalk();sitting=true;player.set(20,.05,20.85);yaw=0;avatar.rotation.y=Math.PI;keys.clear();jumpVelocity=0;return;}if(nearby.type==='gallery'){openGallery();return;}if(nearby.type==='car'){driving=true;player.copy(ownedCar.position);jumpVelocity=0;yaw=ownedCar.rotation.y-Math.PI/2;keys.clear();return;}if(nearby.type==='exit')exitBuilding();else if(nearby.type==='door')enterBuilding(nearby.building);else startTalk(nearby.actor);}
actionButton.onclick=useNearby;
function updateInteractions(){
  if(talkingActor&&(!active||Math.hypot(player.x-talkingActor.root.position.x,player.z-talkingActor.root.position.z)>3.5))closeTalk();
  nearby=null;
  if(sitting)nearby={type:'benchExit'};
  else if(driving)nearby={type:'carExit'};
  else if(!inside&&Math.hypot(player.x-20,player.z-21)<2.3)nearby={type:'bench'};
  else if(!inside&&ownedCar&&Math.hypot(player.x-ownedCar.position.x,player.z-ownedCar.position.z)<2.8)nearby={type:'car'};
  else if(inside){const art=/Галерея/i.test(inside.name)?galleryWorks.reduce((a,b)=>Math.hypot(player.x-1000-b.x,player.z-1000-b.z)<Math.hypot(player.x-1000-a.x,player.z-1000-a.z)?b:a):null;if(art&&Math.hypot(player.x-1000-art.x,player.z-1000-art.z)<3.3)nearby={type:'gallery',art};else if(Math.hypot(player.x-1000,player.z-1007.5)<3.2)nearby={type:'exit'};}
  else {const building=mapBuildings.find(b=>Math.hypot(player.x-b.doorX,player.z-b.doorZ)<2.1);if(building)nearby={type:'door',building};else {const actor=pedestrians.filter(a=>Math.hypot(player.x-a.root.position.x,player.z-a.root.position.z)<2.7).sort((a,b)=>a.root.position.distanceToSquared(player)-b.root.position.distanceToSquared(player))[0];if(actor)nearby={type:'talk',actor};}}
  actionButton.hidden=(!nearby&&!talkingActor)||!active;
  const text=sitting?'Встать · E':nearby?.type==='bench'?'Сесть · E':nearby?.type==='gallery'?'Рассмотреть картину · E':driving?'Выйти из машины · E':nearby?.type==='car'?'Сесть в свою машину · E':talkingActor?'Закончить разговор · E':nearby?.type==='exit'?'Выйти на улицу · E':nearby?.type==='door'?`Войти: ${nearby.building.name} · E`:'Поговорить с жителем · E';
  if(actionButton.textContent!==text)actionButton.textContent=text;
}
function valid(x,z){if(inside){const rx=x-1000,rz=z-1000;return Math.abs(rx)<7.4&&Math.abs(rz)<7.4&&!roomColliders.some(b=>Math.abs(rx-b.x)<b.w/2+.3&&Math.abs(rz-b.z)<b.d/2+.3);}return Math.abs(x)<86&&Math.abs(z)<30&&!colliders.some(b=>Math.abs(x-b.x)<b.w/2+.3&&Math.abs(z-b.z)<b.d/2+.3)}
const mini=$('map').getContext('2d');function miniMap(){mini.fillStyle='#9fbd7b';mini.fillRect(0,0,320,120);mini.fillStyle='#aaa9a0';mini.fillRect(9,25*1.875,302,14*1.875);mini.fillRect((-34-4.5+90)*1.777,4,16,112);mini.fillRect((47-4.5+90)*1.777,38*1.875,16,24*1.875);for(let b of mapBuildings){mini.fillStyle='#'+b.color.toString(16).padStart(6,'0');mini.fillRect((b.x-b.w/2+90)*1.777,(b.z-b.d/2+32)*1.875,b.w*1.777,b.d*1.875)}mini.fillStyle='#fff';mini.beginPath();mini.arc((player.x+90)*1.777,(player.z+32)*1.875,5,0,7);mini.fill();mini.fillStyle='#284d49';mini.beginPath();mini.arc((player.x+90)*1.777,(player.z+32)*1.875,3,0,7);mini.fill();}
let garage=loadGarage(),ownedCar=null,driving=false;
const garageDialog=document.createElement('dialog');garageDialog.id='garage';document.body.appendChild(garageDialog);
const garageButton=document.createElement('button');garageButton.id='garageButton';garageButton.textContent='Выбрать машину';garageButton.hidden=true;$('hud').appendChild(garageButton);
const renovateButton=document.createElement('button');renovateButton.id='renovate';renovateButton.textContent='Обустроить дом';renovateButton.hidden=true;$('hud').appendChild(renovateButton);renovateButton.onclick=()=>{location.href=`editor.html?room=${inside.id}`;};
function createOwnedCar(){if(!garage.car)return;ownedCar=car(garage.x,garage.z,carOffers.find(o=>o.id===garage.car).color);}
createOwnedCar();
function showGarage(){keys.clear();active=false;garageDialog.replaceChildren();const title=document.createElement('h2');title.textContent='АВТОВАН · автосалон';const info=document.createElement('p');info.textContent=`Баланс: ${garage.balance} игровых монет. ${garage.car?'У тебя уже есть машина. Она ждёт на дороге перед магазином.':'Это только игровые деньги. Выбери одну машину.'}`;garageDialog.append(title,info);
 if(!garage.car)for(const offer of carOffers){const button=document.createElement('button');button.textContent=`${offer.name} — ${offer.price} монет`;button.onclick=()=>{garageDialog.replaceChildren();const q=document.createElement('p');q.textContent=`Купить: ${offer.name} за ${offer.price} игровых монет?`;const yes=document.createElement('button');yes.textContent='Подтвердить покупку';yes.onclick=()=>{try{const next=buyCar(garage,offer.id);saveGarage(next);garage=next;if(!ownedCar)createOwnedCar();ownedCar.visible=false;showGarage();}catch(e){q.textContent=e.message}};const no=document.createElement('button');no.textContent='Назад';no.onclick=showGarage;garageDialog.append(q,yes,no);};garageDialog.appendChild(button);}
 const close=document.createElement('button');close.textContent='Вернуться в магазин';close.className='primary';close.onclick=()=>{garageDialog.close();active=true;};garageDialog.appendChild(close);if(!garageDialog.open)garageDialog.showModal();}
garageButton.onclick=showGarage;garageDialog.addEventListener('cancel',()=>{active=true});
function leaveCar(){if(!ownedCar)return;const choices=[[0,2.4],[0,-2.4],[-3,0],[3,0]];const safe=choices.find(([x,z])=>valid(ownedCar.position.x+x,ownedCar.position.z+z));if(!safe)return;driving=false;player.set(ownedCar.position.x+safe[0],0,ownedCar.position.z+safe[1]);garage={...garage,x:ownedCar.position.x,z:ownedCar.position.z};try{saveGarage(garage)}catch{}keys.clear();}
function onRoad(x,z){return(Math.abs(x)<79&&(Math.abs(z-17)<3.5||Math.abs(z+17)<3.5))||(Math.abs(z)<20.5&&(Math.abs(x+56)<3.5||Math.abs(x-23)<3.5));}
function carPositionValid(x,z,angle){const dx=-Math.sin(angle),dz=-Math.cos(angle),halfX=Math.abs(dx)*2.015+Math.abs(dz)*1.04,halfZ=Math.abs(dz)*2.015+Math.abs(dx)*1.04;if(colliders.some(b=>Math.abs(x-b.x)<halfX+b.w/2+.15&&Math.abs(z-b.z)<halfZ+b.d/2+.15))return false;for(const a of [-2.015,2.015])for(const b of [-1.04,1.04]){const cx=x+dx*a-dz*b,cz=z+dz*a+dx*b;if(!onRoad(cx,cz)||!valid(cx,cz))return false;}return true;}
function drive(dt){const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),turn=(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)-(keys.has('KeyD')||keys.has('ArrowRight')?1:0);const nextYaw=yaw+turn*dt*1.35*(forward<0?-1:1);if(carPositionValid(player.x,player.z,nextYaw))yaw=nextYaw;const speed=forward*(forward<0?3.2:7)*dt,x=player.x-Math.sin(yaw)*speed,z=player.z-Math.cos(yaw)*speed;if(carPositionValid(x,z,yaw))player.set(x,0,z);ownedCar.position.copy(player);ownedCar.rotation.y=Math.atan2(Math.cos(yaw),-Math.sin(yaw));}
const diagnostics=new URLSearchParams(location.search).has('inspect')?document.body.appendChild(document.createElement('output')):null;if(diagnostics){diagnostics.id='cityDiagnostics';diagnostics.hidden=true;}
// Explicit local test controls; absent from the normal game URL.
if(diagnostics){const test=document.createElement('details');test.id='testControls';test.innerHTML='<summary>Проверка игры</summary>';const select=document.createElement('select');select.id='testBuilding';select.setAttribute('aria-label','Проверочный вход');mapBuildings.forEach(b=>{const o=document.createElement('option');o.value=b.id;o.textContent=b.name;select.appendChild(o)});const next=document.createElement('button');next.textContent='К выбранному входу';next.onclick=()=>{if(inside)exitBuilding();const b=mapBuildings[Number(select.value)];player.set(b.doorX,0,b.doorZ);};const npc=document.createElement('button');npc.textContent='К гуляющему жителю';npc.onclick=()=>{if(inside)exitBuilding();const p=pedestrians[0].root.position;player.set(p.x-1,0,p.z);};test.append(select,next,npc);document.body.appendChild(test);}
const clock=new THREE.Clock(),ray=new THREE.Raycaster(),target=new THREE.Vector3();let frame=0;
function animate(){requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.05),moving=false;if(!inside)updateCity(dt);else classPeople.forEach((p,i)=>{p.userData.limbs[1].rotation.x=-.5+Math.sin(clock.elapsedTime*1.5+i)*.08;p.userData.limbs[3].rotation.x=-.5;});if(active&&driving)drive(dt);if(active&&!driving&&!sitting){let f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),s=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);let len=Math.hypot(f,s);if(len){let speed=(swimming?2.7:keys.has('ShiftLeft')||keys.has('ShiftRight')?10:5.8)*dt/len,dx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)*speed;if(valid(player.x+dx,player.z))player.x+=dx;if(valid(player.x,player.z+dz))player.z+=dz;avatar.rotation.y=Math.atan2(dx,dz);moving=true;step+=dt*10;}}
swimming=!inside&&!driving&&!sitting&&shouldSwim(player.x,player.y,player.z);if(swimming){player.y=-.8+Math.sin(clock.elapsedTime*2.5)*.035;jumpVelocity=0;}
if(active&&!driving&&!sitting&&!swimming){const vertical=verticalStep(player.y,jumpVelocity,dt,inside?0:surfaceHeight(player.x,player.z));player.y=vertical.y;jumpVelocity=vertical.velocity;jumpPeak=Math.max(jumpPeak,player.y);}
avatar.rotation.x=0;avatar.position.copy(player);avatar.visible=!first&&!driving;gait(avatar.userData.limbs,step,moving?1:0);for(const i of [0,2])avatar.userData.limbs[i].userData.knee.rotation.x=sitting?Math.PI/2:0;if(swimming){for(const i of [1,3]){avatar.userData.limbs[i].rotation.x=Math.sin(clock.elapsedTime*3+i)*.35;avatar.userData.limbs[i].rotation.z=i===1?.5:-.5;}}else for(const i of [1,3])avatar.userData.limbs[i].rotation.z=0;if(sitting){avatar.userData.limbs[0].rotation.x=-Math.PI/2;avatar.userData.limbs[2].rotation.x=-Math.PI/2;}
target.copy(player).add(new THREE.Vector3(0,1.65,0));if(first){camera.position.copy(target);camera.lookAt(target.x-Math.sin(yaw)*10,target.y-Math.sin(pitch)*10,target.z-Math.cos(yaw)*10);}else{let offset=sitting?new THREE.Vector3(3,2,-3):new THREE.Vector3(Math.sin(yaw)*(inside?4.2:7),(inside?2:3)+pitch*(inside?2:5),Math.cos(yaw)*(inside?4.2:7));ray.set(target,offset.clone().normalize());const hits=ray.intersectObjects(inside?roomWalls:cameraObstacles,false).filter(h=>h.distance>.35);let distance=offset.length();if(hits.length&&hits[0].distance<distance)distance=Math.max(.7,hits[0].distance-.3);camera.position.copy(target).add(offset.normalize().multiplyScalar(distance));if(inside){camera.position.x=THREE.MathUtils.clamp(camera.position.x,992.5,1007.5);camera.position.z=THREE.MathUtils.clamp(camera.position.z,992.5,1007.5);camera.position.y=Math.min(camera.position.y,4.8);}camera.lookAt(target);}
garageButton.hidden=!inside||!/АВТОВАН/.test(inside.name);renovateButton.hidden=true;if(ownedCar)ownedCar.visible=!inside&&!(driving&&first);updateInteractions();if(frame++%12===0){miniMap();let nearest=landmarks.reduce((a,b)=>Math.hypot(b.x-player.x,b.z-player.z)<Math.hypot(a.x-player.x,a.z-player.z)?b:a);$('place').textContent=inside?'Внутри: '+inside.name:Math.hypot(nearest.x-player.x,nearest.z-player.z)<18?'Рядом: '+nearest.name:'Улицы твоего города';}renderer.render(scene,camera);if(diagnostics&&frame%12===0&&window.gameState)diagnostics.textContent=JSON.stringify({...window.gameState(),buildingBounds:mapBuildings,blockedEntrances:mapBuildings.filter(b=>colliders.slice(0,-traffic.length).some(c=>Math.abs(b.doorX-c.x)<c.w/2+.3&&Math.abs(b.doorZ-c.z)<c.d/2+.3)).map(b=>b.id)});}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});const requestedRoom=Number(new URLSearchParams(location.search).get('home'));if(new URLSearchParams(location.search).has('home')&&mapBuildings[requestedRoom]){const b=mapBuildings[requestedRoom];player.set(b.doorX,0,b.doorZ);enterBuilding(b);}animate();
// Small read-only diagnostic snapshot for local smoke tests.
window.gameState=()=>({position:player.toArray(),jumpVelocity,jumpCount,jumpPeak,ground:inside?0:surfaceHeight(player.x,player.z),firstPerson:first,active,sitting,swimming,garage:{...garage},driving,inside:inside?.name||null,talking:!!talkingActor,talkingProfile:talkingActor?.profile,cameraPosition:camera.position.toArray(),buildings:mapBuildings.length,hero:$('hero').value,drawCalls:renderer.info.render.calls,egor:egorRoot.position.toArray(),pedestrians:pedestrians.map(a=>({destination:a.destination,waypoint:a.waypoint,path:a.walk,position:a.root.position.toArray(),leg:a.root.userData.limbs[0].rotation.x})),cars:traffic.map(a=>a.root.position.toArray())});

const drawingDialog=$('drawingDialog');$('drawingButton').onclick=()=>{active=false;keys.clear();drawingDialog.showModal();};$('closeDrawing').onclick=()=>{drawingDialog.close();active=true;};drawingDialog.addEventListener('cancel',()=>{active=true;});
