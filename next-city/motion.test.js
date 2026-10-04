import test from 'node:test';
import assert from 'node:assert/strict';
import {JUMP_SPEED,verticalStep} from './motion.js';
function jump(speed,dt,ground){let y=ground,velocity=speed,peak=ground;for(let i=0;i<400;i++){({y,velocity}=verticalStep(y,velocity,dt,ground));peak=Math.max(peak,y);if(i&&y===ground)return {height:peak-ground,y,velocity};}throw Error('Jump did not land');}
test('jump is 40–55% higher at normal and low frame rates, and lands exactly',()=>{
 for(const dt of [1/120,1/60,1/30,.05])for(const ground of [0,.13]){const before=jump(5.3,dt,ground),after=jump(JUMP_SPEED,dt,ground),ratio=after.height/before.height;assert.ok(ratio>=1.4&&ratio<=1.55,`height ratio ${ratio} at dt=${dt}`);assert.equal(after.y,ground);assert.equal(after.velocity,0);}
});
