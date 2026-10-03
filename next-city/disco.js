// Original melody; start/resume through the entrance or an explicit sound button.
export function createDiscoMusic(container){
 const controls=document.createElement('div');controls.id='discoControls';controls.hidden=true;
 const button=document.createElement('button');button.id='discoMusic';
 const volume=document.createElement('input');volume.type='range';volume.min=0;volume.max=100;volume.value=70;volume.id='discoVolume';volume.setAttribute('aria-label','Громкость музыки');volume.title='Громкость музыки';
 controls.append(button,volume);container.appendChild(controls);
 let context,gain,analyser,samples,timer,inside=false,muted=false,beat=0,next=0;
 const notes=[392,493.88,587.32,493.88,349.22,440,523.26,440];
 const playing=()=>!!timer&&context?.state==='running';
 function updateButton(){button.textContent=muted?'♫ Музыка: выкл.':playing()?(+volume.value?'♫ Музыка играет':'♫ Громкость: 0'):'▶ Включить музыку';button.setAttribute('aria-pressed',String(playing()&&!muted));}
 function stop(){if(timer){clearInterval(timer);timer=null;}if(gain&&context){gain.gain.setValueAtTime(0,context.currentTime);context.suspend().catch(()=>{});}updateButton();}
 function tone(frequency,at,duration,type,level){const osc=context.createOscillator(),env=context.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,at);env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(level,at+.015);env.gain.linearRampToValueAtTime(level*.7,at+duration*.55);env.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(env);env.connect(gain);osc.start(at);osc.stop(at+duration+.01);osc.onended=()=>{osc.disconnect();env.disconnect();};}
 function schedule(){while(next<context.currentTime+.16){tone(notes[beat%notes.length],next,.27,'triangle',.3);if(beat%2===0)tone(130.81,next,.22,'sine',.4);if(beat%4===2)tone(784,next,.1,'sine',.1);beat++;next+=.3;}}
 async function sync(){if(!inside||muted||document.hidden){stop();return;}updateButton();
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){button.textContent='Музыка недоступна';button.disabled=true;return;}
  if(!context){context=new Audio();gain=context.createGain();analyser=context.createAnalyser();analyser.fftSize=256;samples=new Uint8Array(analyser.fftSize);gain.connect(analyser);analyser.connect(context.destination);context.addEventListener('statechange',updateButton);}
  try{await context.resume();}catch{updateButton();return;}if(!inside||muted||document.hidden){stop();return;}
  gain.gain.setValueAtTime(+volume.value*.004,context.currentTime);if(!timer){next=context.currentTime+.03;beat=0;schedule();timer=setInterval(schedule,80);}updateButton();
 }
 button.onclick=()=>{muted=playing()&&!muted;sync();};volume.oninput=()=>{if(+volume.value)muted=false;sync();};document.addEventListener('visibilitychange',sync);
 function state(){let signal=0;if(playing()){analyser.getByteTimeDomainData(samples);signal=Math.sqrt(samples.reduce((sum,v)=>sum+((v-128)/128)**2,0)/samples.length);}return {inside,muted,playing:playing(),volume:+volume.value,signal:Math.round(signal*100000)/100000};}
 return {enter(){inside=true;controls.hidden=false;sync();},leave(){inside=false;controls.hidden=true;stop();},state};
}
