// Original 32-bar electronic track. One loop lasts 60 seconds at 128 BPM.
export const BPM=128;
export const STEP_SECONDS=60/BPM/4;
export const LOOP_STEPS=32*16;
const chords=[[57,60,64],[53,57,60],[60,64,67],[55,59,62]];
const bassRoots=[33,29,36,31];
const melodies=[
 [69,null,76,null,72,null,71,72,null,76,null,79,76,null,72,null],
 [null,72,76,null,79,null,76,null,74,null,72,71,null,69,null,64],
 [76,null,79,81,null,79,null,76,72,null,74,null,76,72,null,69],
 [67,null,71,null,74,76,null,74,71,null,69,null,67,64,null,null]
];
export function sectionAt(step){const bar=Math.floor(((step%LOOP_STEPS)+LOOP_STEPS)%LOOP_STEPS/16);return bar<4?'intro':bar<12?'groove':bar<16?'build':bar<20?'break':bar<28?'drop':'outro';}
export function eventsAt(step){
 const loop=((step%LOOP_STEPS)+LOOP_STEPS)%LOOP_STEPS,bar=Math.floor(loop/16),s=loop%16,section=sectionAt(loop),chord=Math.floor(bar/2)%4;
 const events=[],add=(voice,note,level=1,length=1)=>events.push({voice,note,level,length});
 const intro=section==='intro',build=section==='build',quiet=section==='break',drop=section==='drop',outro=section==='outro';
 const energy=outro?1-(bar-28)*.16:intro?.6+bar*.1:1;
 if(!quiet&&s%4===0)add('kick',null,energy);
 if(quiet&&bar>=18&&s===0)add('kick',null,.5);
 if(!quiet&&(!intro||bar>=2)&&[4,12].includes(s))add('clap',null,.7*energy);
 if(!quiet&&s%2===0)add(s%4===2?'openHat':'hat',null,(s%4===2?.6:.35)*energy);
 if((drop||build)&&s%2===1)add('hat',null,.22+(s%4)*.04);
 if(build&&bar>=14&&s%(bar===15?1:2)===0)add('clap',null,.13+.32*s/16);
 if(!quiet&&[0,3,6,8,10,14].includes(s))add('bass',bassRoots[chord]+(s===14&&bar%2?12:0),.8*energy,s===8?2:1);
 if(s===0)add('pad',chords[chord],quiet?.62:.32*energy,quiet?15:13);
 if(intro&&[2,6,10,14].includes(s))add('arp',chords[chord][(s/4|0)%3]+12,.35+bar*.06,1);
 if(quiet&&[0,6,10].includes(s))add('bell',chords[chord][s===0?0:s===6?2:1]+12,.5,4);
 if(!intro&&!quiet&&!outro){const note=melodies[bar%4][s];if(note!==null)add('lead',note,drop?.72:.5,1.7);}
 if(drop&&[1,5,9,13].includes(s))add('arp',chords[chord][(bar+s)%3]+24,.25,1);
 if(outro&&bar<30&&[2,6,10,14].includes(s))add('arp',chords[chord][(s/4|0)%3]+12,.35*energy,1);
 if([4,12,20,28].includes(bar)&&s===0)add('sweep',null,.22,7);
 if([11,15,27].includes(bar)&&s>=12&&s%2===0)add('tom',45+(16-s)*2,.32,1);
 return {section,bar,events};
}
const hz=note=>440*2**((note-69)/12);

export function createTechnoSynth(context,output){
 const sources=new Set(),nodes=new Set();let disposed=false;
 const own=node=>{nodes.add(node);return node;};
 const drums=own(context.createGain()),music=own(context.createGain()),compressor=own(context.createDynamicsCompressor());
 compressor.threshold.value=-12;compressor.knee.value=14;compressor.ratio.value=4;compressor.attack.value=.003;compressor.release.value=.15;
 drums.connect(compressor);music.connect(compressor);compressor.connect(output);
 const delay=own(context.createDelay(.8)),feedback=own(context.createGain()),echoFilter=own(context.createBiquadFilter()),wet=own(context.createGain());
 delay.delayTime.value=STEP_SECONDS*3;feedback.gain.value=.24;wet.gain.value=.18;echoFilter.type='lowpass';echoFilter.frequency.value=3200;
 delay.connect(echoFilter);echoFilter.connect(feedback);feedback.connect(delay);echoFilter.connect(wet);wet.connect(music);
 const noise=context.createBuffer(1,context.sampleRate,context.sampleRate),data=noise.getChannelData(0);let seed=31;
 for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296)*2-1;}
 function start(source,at,length,cleanup=[]){
  sources.add(source);source.onended=()=>{sources.delete(source);source.disconnect();for(const node of cleanup){node.disconnect();nodes.delete(node);}};
  source.start(at);source.stop(at+length);
 }
 function envelope(at,level,length,attack=.005){const g=own(context.createGain());g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(level,at+attack);g.gain.exponentialRampToValueAtTime(.0001,at+length);return g;}
 function oscillator(note,at,length,type,level,cutoff=1800,echo=false){
  const osc=context.createOscillator(),filter=own(context.createBiquadFilter()),amp=envelope(at,level,length);
  osc.type=type;osc.frequency.setValueAtTime(hz(note),at);filter.type='lowpass';filter.Q.value=.6;filter.frequency.setValueAtTime(cutoff,at);filter.frequency.exponentialRampToValueAtTime(Math.max(150,cutoff*.32),at+length);
  osc.connect(filter);filter.connect(amp);amp.connect(music);if(echo)amp.connect(delay);start(osc,at,length+.02,[filter,amp]);
 }
 function hiss(at,length,level,frequency,type='highpass'){
  const source=context.createBufferSource(),filter=own(context.createBiquadFilter()),amp=envelope(at,level,length);
  source.buffer=noise;filter.type=type;filter.frequency.value=frequency;filter.Q.value=.6;source.connect(filter);filter.connect(amp);amp.connect(drums);start(source,at,length+.01,[filter,amp]);
 }
 function kick(at,level){const osc=context.createOscillator(),amp=envelope(at,.82*level,.34,.002);osc.frequency.setValueAtTime(148,at);osc.frequency.exponentialRampToValueAtTime(47,at+.075);osc.connect(amp);amp.connect(drums);start(osc,at,.36,[amp]);hiss(at,.013,.075*level,3200);music.gain.cancelScheduledValues(at);music.gain.setValueAtTime(.35,at);music.gain.linearRampToValueAtTime(1,at+.14);}
 function pad(notes,at,length,level){
  for(const note of notes){const osc=context.createOscillator(),amp=own(context.createGain());osc.type='triangle';osc.frequency.value=hz(note);amp.gain.setValueAtTime(0,at);amp.gain.linearRampToValueAtTime(level*.075,at+.12);amp.gain.linearRampToValueAtTime(level*.055,at+length*.65);amp.gain.linearRampToValueAtTime(0,at+length);osc.connect(amp);amp.connect(music);start(osc,at,length+.02,[amp]);}
 }
 function event(e,at){const length=e.length*STEP_SECONDS;
  if(e.voice==='kick')kick(at,e.level);
  else if(e.voice==='clap'){for(const offset of [0,.014,.029])hiss(at+offset,.11,e.level*.22,1800,'bandpass');}
  else if(e.voice==='hat'||e.voice==='openHat')hiss(at,e.voice==='hat'?.035:.16,e.level*.16,6900);
  else if(e.voice==='bass'){oscillator(e.note,at,length*.92,'sawtooth',e.level*.26,600);oscillator(e.note,at,length*.92,'sine',e.level*.24,500);}
  else if(e.voice==='lead'){oscillator(e.note,at,length,'sawtooth',e.level*.12,2300,true);oscillator(e.note+12,at,length*.8,'triangle',e.level*.08,2800);}
  else if(e.voice==='arp')oscillator(e.note,at,length,'triangle',e.level*.15,3500,true);
  else if(e.voice==='bell')oscillator(e.note,at,length,'sine',e.level*.28,4200,true);
  else if(e.voice==='pad')pad(e.note,at,length,e.level);
  else if(e.voice==='tom')oscillator(e.note,at,.13,'sine',e.level*.36,800);
  else if(e.voice==='sweep')hiss(at,length,e.level*.4,4400);
 }
 return {
  schedule(step,at){if(disposed)return;const plan=eventsAt(step);for(const e of plan.events)event(e,at);return plan.section;},
  stop(){if(disposed)return;disposed=true;for(const source of sources){try{source.stop();}catch{}source.disconnect();}sources.clear();for(const node of nodes)node.disconnect();nodes.clear();},
  get voiceCount(){return sources.size;}
 };
}
