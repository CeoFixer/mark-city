import assert from 'node:assert/strict';
import {emptyCity,validateCity,onReservedPath,buyCar,defaultRoom,validateRoom} from './city-data.js';
import {replyLine} from './dialogues.js';
const city=emptyCity();city.added.push({x:0,z:5,w:4,d:4,h:4,color:0xabcabc,name:'Мой дом',roof:true});city.profiles[0].hello='Тестовая реплика\nЕщё одна';
assert.deepEqual(validateCity(JSON.parse(JSON.stringify(city))),city);
assert.equal(replyLine(city.profiles[0].hello,1),'Ещё одна');assert.notEqual(replyLine(city.profiles[1].hello,0),replyLine(city.profiles[2].hello,0));
assert.throws(()=>validateCity({...city,added:[{...city.added[0],x:Infinity}]}));assert.throws(()=>validateCity({...city,version:2}));assert.ok(onReservedPath(0,17,4,4));assert.ok(!onReservedPath(0,5,4,4));
console.log('PASS: export/import roundtrip, custom replies, varied replies, input limits and road protection.');

const purchased=buyCar({balance:1000,car:null},'yellow');assert.equal(purchased.balance,550);assert.equal(buyCar(purchased,'red'),purchased);assert.throws(()=>buyCar({balance:10,car:null},'blue'));
assert.deepEqual(validateRoom(defaultRoom()),defaultRoom());assert.throws(()=>validateRoom({...defaultRoom(),furniture:[{type:'table',x:0,z:5,color:123}]}));
city.rooms['8']=defaultRoom();city.graffiti='data:image/png;base64,aGVsbG8=';assert.deepEqual(validateCity(JSON.parse(JSON.stringify(city))),city);assert.throws(()=>validateCity({...city,graffiti:'https://example.com/picture.png'}));assert.throws(()=>validateCity({...city,graffiti:'data:image/png;base64,'+'a'.repeat(750001)}));
console.log('PASS: garage purchase once, insufficient balance, room exit protection, room/art export and size limits.');
