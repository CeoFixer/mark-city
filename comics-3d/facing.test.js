import test from 'node:test';
import assert from 'node:assert/strict';
import {viewDirection} from './facing.js';
test('directions follow the camera, including wrapped angles',()=>{
  for(const yaw of [0,.55,-2,Math.PI*3]){
    for(const [offset,view] of [[0,'front'],[Math.PI,'back'],[Math.PI/2,'right'],[-Math.PI/2,'left']]){
      assert.equal(viewDirection(yaw+offset,yaw),view);
      assert.equal(viewDirection(yaw+offset+Math.PI*2,yaw),view);
    }
  }
});
