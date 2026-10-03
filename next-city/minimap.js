import {roads,pavement,crossings,parkTrees} from './layout.js?v=single-storey-6';
import {schoolTrees,yardFences,swingSeats,playDeck,hoopPost} from './playground.js?v=single-storey-6';
import {facade} from './facades.js?v=park-7';

// Flat plan of the actual city, using the same world coordinates as the 3D scene.
export function drawCityMap(ctx,buildings,player,yaw){
 const sx=ctx.canvas.width/180,sz=ctx.canvas.height/64;
 ctx.setTransform(sx,0,0,sz,90*sx,32*sz);
 ctx.fillStyle='#98b878';ctx.fillRect(-90,-32,180,64);
 const rect=(p,color)=>{ctx.fillStyle=color;ctx.fillRect(p.x-p.w/2,p.z-p.d/2,p.w,p.d);};
 rect({x:-42,z:23,w:84,d:18},'#d6d2c2');
 for(const p of pavement)rect(p,'#e5dfcb');
 for(const r of roads)rect(r,'#989c98');
 for(const c of crossings){if(c.d>c.w){for(let z=c.z-c.d/2+1;z<c.z+c.d/2;z+=1.7)rect({x:c.x,z,w:c.w,d:.65},'#f7d45f');}else for(let x=c.x-c.w/2+.5;x<c.x+c.w/2;x+=1.3)rect({x,z:c.z,w:.65,d:c.d},'#f7d45f');}
 for(const b of buildings){
  rect(b,'#'+b.color.toString(16).padStart(6,'0'));ctx.strokeStyle='#6b684e';ctx.lineWidth=.3;ctx.strokeRect(b.x-b.w/2,b.z-b.d/2,b.w,b.d);
  if(b.roof){ctx.beginPath();ctx.moveTo(b.x,b.z-b.d/2);ctx.lineTo(b.x,b.z+b.d/2);ctx.stroke();}
  const entry=facade(b.name,b.w,b.h);rect({x:b.doorX,z:b.z+b.facing*b.d/2,w:entry.doorW,d:.7},'#377796');
 }
 ctx.strokeStyle='#567e73';ctx.lineWidth=.3;for(const [x1,z1,x2,z2] of yardFences){ctx.beginPath();ctx.moveTo(x1,z1);ctx.lineTo(x2,z2);ctx.stroke();}
 rect(playDeck,'#d08b78');ctx.strokeStyle='#64849e';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(71,23);ctx.lineTo(77,23);ctx.stroke();for(const p of swingSeats)rect(p,'#4d5152');
 ctx.fillStyle='#d08664';ctx.beginPath();ctx.arc(hoopPost.x,hoopPost.z,.7,0,Math.PI*2);ctx.fill();
 rect({x:20,z:21,w:3,d:.8},'#9e794d');
 for(const [x,z,s] of [...parkTrees.map(([x,z])=>[x,z,1]),...schoolTrees.map(p=>[p.x,p.z,p.scale])]){ctx.fillStyle='#477a54';ctx.beginPath();ctx.arc(x,z,1.2*s,0,Math.PI*2);ctx.fill();ctx.fillStyle='#78a166';ctx.beginPath();ctx.arc(x-.3*s,z-.3*s,.7*s,0,Math.PI*2);ctx.fill();}
 ctx.save();ctx.translate(player.x,player.z);ctx.rotate(-yaw);ctx.fillStyle='#214e6d';ctx.strokeStyle='#fff';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,-3.2);ctx.lineTo(2,2.1);ctx.lineTo(0,1.1);ctx.lineTo(-2,2.1);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();ctx.resetTransform();
}
