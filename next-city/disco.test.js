import test from 'node:test';
import assert from 'node:assert/strict';
import {BPM,STEP_SECONDS,LOOP_STEPS,eventsAt,sectionAt} from './techno.js';
test('original track has a one-minute loop with six distinct sections',()=>{
 assert.equal(BPM,128);assert.equal(STEP_SECONDS*LOOP_STEPS,60);
 assert.deepEqual([...new Set(Array.from({length:LOOP_STEPS},(_,i)=>sectionAt(i)))],['intro','groove','build','break','drop','outro']);
 for(let i=0;i<LOOP_STEPS;i++)assert.deepEqual(eventsAt(i),eventsAt(i+LOOP_STEPS));
});
test('every scheduled note and envelope is finite and playable',()=>{
 const voices=new Set();
 for(let i=0;i<LOOP_STEPS;i++)for(const e of eventsAt(i).events){voices.add(e.voice);assert.ok(e.level>0&&e.level<=1);assert.ok(e.length>0&&e.length<=16);if(e.note!==null)for(const n of Array.isArray(e.note)?e.note:[e.note])assert.ok(Number.isFinite(n)&&n>=24&&n<=96,`${e.voice}: ${n}`);}
 for(const v of ['kick','clap','hat','openHat','bass','pad','lead','arp','bell','sweep','tom'])assert.ok(voices.has(v));
});
test('breakdown removes the main beat and the drop restores a full arrangement',()=>{
 const voices=bar=>Array.from({length:16},(_,s)=>eventsAt(bar*16+s).events).flat().map(e=>e.voice);
 assert.ok(!voices(16).includes('kick'));assert.ok(!voices(16).includes('bass'));assert.ok(voices(16).includes('bell'));
 for(const v of ['kick','clap','bass','lead','arp'])assert.ok(voices(20).includes(v));
 assert.notDeepEqual(eventsAt(4*16).events,eventsAt(5*16).events);
});
