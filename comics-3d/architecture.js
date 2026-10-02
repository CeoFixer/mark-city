import * as THREE from '../vendor/three.module.js';

// Architectural details follow Mark's blue doors, pastel shops and uneven roofs.
// The illustration is no longer pasted over the entire volume of a building.
export function buildNeighborhood({town,box,ball,cyl,material,colliders}) {
  const cream=0xffedc7,ink=0x39415b,blue=0x4e95bd;
  const colors=[0xe6a08c,0xb29acb,0xe7c26d,0x80b4a8,0x96b4ce,0xd99da9];
  const roofColors=[0x966777,0x737d9c,0x619b99,0xb27b62];
  const paper=document.createElement('canvas');paper.width=paper.height=128;
  const pc=paper.getContext('2d');pc.fillStyle='#fffdf6';pc.fillRect(0,0,128,128);
  for(let i=0;i<360;i++){const x=(i*47)%128,y=(i*79)%128;pc.strokeStyle=i%2?'#5447370b':'#ffffff65';pc.beginPath();pc.moveTo(x,y);pc.lineTo(x+9,y-3);pc.stroke();}
  const grain=new THREE.CanvasTexture(paper);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.colorSpace=THREE.SRGBColorSpace;
  const walls=colors.map(color=>new THREE.MeshToonMaterial({color,map:grain}));
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
  const sc=shadowCanvas.getContext('2d'),grad=sc.createRadialGradient(32,32,3,32,32,32);grad.addColorStop(0,'#28364b50');grad.addColorStop(.5,'#28364b30');grad.addColorStop(1,'#28364b00');sc.fillStyle=grad;sc.fillRect(0,0,64,64);
  const shade=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false});
  const contact=(x,z,w,d)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),shade);m.rotation.x=-Math.PI/2;m.position.set(x,.14,z);town.add(m);};
  function windowAt(x,y,z,parent,w=1.45,h=1.9){
    box(x,y,z,w+.28,h+.3,.22,cream,parent);
    box(x,y,z+.13,w,h,.09,ink,parent);
    box(x,y,z+.2,w-.15,h-.15,.06,0x83b9cd,parent);
    box(x-.28,y+.1,z+.245,.08,h-.32,.02,0xc5e4e2,parent);
    box(x,y,z+.28,.065,h,.08,cream,parent);box(x,y,z+.28,w,.065,.08,cream,parent);
    box(x,y-h/2-.1,z+.3,w+.5,.18,.5,cream,parent);
  }
  function gable(w,d,h,color,parent){
    const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,h);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});geo.translate(0,0,-d/2);
    const roof=new THREE.Mesh(geo,material(color));parent.add(roof);return roof;
  }
  for(let i=0;i<70;i++)for(const side of [-1,1]){
    if(i%10===0)continue;
    const x=9+i*13,z=side*(25+(i%3)*.55),w=10+(i%3),h=6.6+(i%4)*1.65,d=12+(i%2)*2;
    const building=new THREE.Group();building.position.set(x,0,z);if(side>0)building.rotation.y=Math.PI;town.add(building);
    const front=d/2;const color=colors[(i+(side>0?2:0))%6];
    const shell=box(0,h/2,0,w,h,d,color,building);shell.material=walls[(i+(side>0?2:0))%6];
    colliders.push({x,z,w:w+1,d:d+1});contact(x,z,w+6,d+6);
    box(0,.3,0,w+.25,.6,d+.25,0xb2a695,building);
    for(const edge of [-1,1])box(edge*(w/2-.2),h/2,front+.12,.32,h,.22,cream,building);
    box(0,h-.15,0,w+.5,.3,d+.5,cream,building);
    // Dark recessed entrance, blue panel, handle, light and shallow doorstep.
    box(0,1.55,front+.1,2.15,3.1,.23,cream,building);
    box(0,1.48,front+.24,1.85,2.95,.12,ink,building);
    box(0,1.5,front+.32,1.55,2.8,.08,blue,building);
    box(0,2.05,front+.38,1.1,1.2,.035,0x91c9db,building);
    box(0,.62,front+.38,1.1,.7,.035,0x397eab,building);
    ball(.55,1.3,front+.46,.07,0xf4cd69,building);
    box(0,.1,front+.55,2.6,.2,1.25,cream,building);
    for(const a of [-1,1])windowAt(a*w*.3,2.1,front+.15,building,2,2.25);
    for(let row=4.8;row<h-1;row+=2.4)for(const a of [-1,1])windowAt(a*w*.28,row,front+.1,building);
    // Side windows and masonry courses make the depth readable when turning.
    for(const a of [-1,1]){const wall=new THREE.Group();wall.position.set(a*(w/2+.02),0,0);wall.rotation.y=a*Math.PI/2;building.add(wall);for(const zz of [-3,3])windowAt(zz,3.2,0,wall,1.3,1.85);}
    if(i%3!==2){
      const awning=new THREE.Group();awning.position.set(0,3.5,front+.25);building.add(awning);
      for(let stripe=0;stripe<10;stripe++){const m=box(-w*.44+stripe*w*.088,0,.72,w*.089,.14,1.75,stripe%2?cream:roofColors[i%4],awning);m.rotation.x=.12;box(-w*.44+stripe*w*.088,-.19,1.55,w*.089,.32,.12,stripe%2?cream:roofColors[i%4],awning);}
    }
    const roofColor=roofColors[(i+(side>0?1:0))%4];
    if(i%4===0){
      box(0,h+.25,0,w+.7,.5,d+.7,roofColor,building);
      for(const a of [-1,1])box(a*(w/2-.15),h+.8,0,.3,1.1,d,cream,building);
      box(0,h+.8,front-.15,w,.9,.3,cream,building);
      cyl(-w*.25,h+1.5,-1,.8,2,0x9b8475,building);
    }else{
      const roof=gable(w+.8,d+.8,2.5+(i%2)*1.1,roofColor,building);roof.position.y=h;
      const dormer=new THREE.Group();dormer.position.set(0,h+.4,front*.6);building.add(dormer);
      box(0,.65,0,2.15,1.3,1.5,cream,dormer);windowAt(0,.6,.77,dormer,.95,.9);
      const cap=gable(2.5,1.8,.9,roofColors[(i+1)%4],dormer);cap.position.y=1.3;
      box(-w*.28,h+1.4,-d*.2,.9,2.8,1,0xaa887c,building);box(-w*.28,h+2.8,-d*.2,1.15,.2,1.2,cream,building);
    }
    // Flower boxes, porch pots and shop signs live on the architecture.
    for(const a of [-1,1]){
      box(a*w*.3,.62,front+.4,1.8,.55,.7,0x9f7860,building);
      for(let f=0;f<3;f++){ball(a*w*.3+(f-1)*.48,1,front+.44,.35,0x689b76,building);ball(a*w*.3+(f-1)*.48,1.25,front+.52,.14,[0xee968f,0xffd773,0xc79fd5][f],building);}
    }
  }
  for(let x=2;x<900;x+=7){for(const z of [-9.2,9.2])box(x,.17,z,6.8,.25,.3,cream);}
  for(let x=0;x<900;x+=130){
    for(let z=-7;z<8;z+=2)box(x,.065,z,4,.03,1,0xf4d773);
    for(const side of [-1,1]){
      const z=side*12.8;box(x+6,.75,z,3,.25,1,0xb78b68);box(x+6,1.3,z+side*.45,3,.9,.14,0xc09973);
      for(const a of [-1,1])box(x+6+a, .4,z,.13,.8,.7,ink);
      cyl(x-5,1,z,.13,2,ink);const stop=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.09,8),material(0xd97970));stop.rotation.x=Math.PI/2;stop.position.set(x-5,2.1,z);town.add(stop);
    }
  }
  // Side lanes connect the main street to sheltered gardens and a rear walking loop.
  for(const side of [-1,1]){
    box(450,.09,side*45,930,.12,4,0xd5bf9c);
    for(let x=9;x<900;x+=130){
      box(x,.1,side*29,6,.14,40,0xe3cfaa);
      cyl(x,.18,side*48,10,.2,0xe5d4b3);
      cyl(x,.35,side*48,3,.4,0xabbbaf);cyl(x,.57,side*48,2.6,.08,0x8abcc8);
      for(const a of [-1,1]){
        box(x+a*6,.85,side*49,3,.22,1,0xb78b68);box(x+a*6,1.4,side*49+.45,3,1,.14,0xc09973);
        for(const foot of [-1,1])box(x+a*6+foot,.4,side*49,.13,.8,.7,ink);
        cyl(x+a*7,1.8,side*42,.2,3.6,0x786045);ball(x+a*7,4,side*42,1.8,0x83ac86);
        cyl(x+a*4,.4,side*54,.9,.8,0xc3947a);ball(x+a*4,1,side*54,1.1,0x71a378);
        for(let f=0;f<5;f++)ball(x+a*4+Math.cos(f*1.26)*.65,1.55,side*54+Math.sin(f*1.26)*.65,.25,0xeeb09e);
      }
    }
  }
  // Merge the static detail by material so added geometry doesn't add thousands of draw calls.
  town.updateMatrixWorld(true);const batches=new Map(),meshes=[];
  town.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const sourceGeometries=new Set();
  for(const m of meshes){const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geo.applyMatrix4(m.matrixWorld);if(!batches.has(m.material))batches.set(m.material,[]);batches.get(m.material).push(geo);sourceGeometries.add(m.geometry);m.removeFromParent();}
  for(const [mat,geos] of batches){const merged=new THREE.BufferGeometry();for(const key of ['position','normal','uv']){const size=key==='uv'?2:3;const length=geos.reduce((n,g)=>n+g.attributes.position.count*size,0),data=new Float32Array(length);let offset=0;for(const g of geos){if(g.attributes[key])data.set(g.attributes[key].array,offset);offset+=g.attributes.position.count*size;}merged.setAttribute(key,new THREE.BufferAttribute(data,size));}merged.computeBoundingSphere();town.add(new THREE.Mesh(merged,mat));for(const g of geos)g.dispose();}
  // Shared primitives belong to the renderer; per-building primitives can be reclaimed.
  for(const g of sourceGeometries)if(g.type!=='BoxGeometry')g.dispose();
}
