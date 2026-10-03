// Original melody starts with the entrance gesture; sound settings live in the menu.
export function createDiscoMusic(container){
 const controls=document.createElement('fieldset');controls.id='discoControls';
 const legend=document.createElement('legend');legend.textContent='Звук';
 const enabled=document.createElement('input');enabled.type='checkbox';enabled.id='discoMusic';enabled.checked=true;
 const label=document.createElement('label');label.append(enabled,document.createTextNode('Музыка в дискотеке'));
 const volume=document.createElement('input');volume.type='range';volume.min=0;volume.max=100;volume.value=70;volume.id='discoVolume';volume.setAttribute('aria-label','Громкость музыки');volume.title='Громкость музыки';
 controls.append(legend,label,volume);container.insertBefore(controls,container.querySelector('.primary'));
 let context,gain,analyser,samples,timer,inside=false,muted=false,beat=0,next=0;
 const notes=[392,493.88,587.32,493.88,349.22,440,523.26,440];
 const playing=()=>!!timer&&context?.state==='running';

 function stop(){if(timer){clearInterval(timer);timer=null;}if(gain&&context){gain.gain.setValueAtTime(0,context.currentTime);context.suspend().catch(()=>{});}}
 function tone(frequency,at,duration,type,level){const osc=context.createOscillator(),env=context.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,at);env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(level,at+.015);env.gain.linearRampToValueAtTime(level*.7,at+duration*.55);env.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(env);env.connect(gain);osc.start(at);osc.stop(at+duration+.01);osc.onended=()=>{osc.disconnect();env.disconnect();};}
 function schedule(){while(next<context.currentTime+.16){tone(notes[beat%notes.length],next,.27,'triangle',.3);if(beat%2===0)tone(130.81,next,.22,'sine',.4);if(beat%4===2)tone(784,next,.1,'sine',.1);beat++;next+=.3;}}
 async function sync(){if(!inside||muted||document.hidden){stop();return;}
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){enabled.disabled=true;volume.disabled=true;label.title='Браузер не поддерживает Web Audio';return;}
  if(!context){context=new Audio();gain=context.createGain();analyser=context.createAnalyser();analyser.fftSize=256;samples=new Uint8Array(analyser.fftSize);gain.connect(analyser);analyser.connect(context.destination);}
  try{await context.resume();}catch{return;}if(!inside||muted||document.hidden){stop();return;}
  gain.gain.setValueAtTime(+volume.value*.004,context.currentTime);if(!timer){next=context.currentTime+.03;beat=0;schedule();timer=setInterval(schedule,80);}
 }
 enabled.onchange=()=>{muted=!enabled.checked;sync();};volume.oninput=sync;document.addEventListener('visibilitychange',sync);
 const unlock=()=>{if(inside&&!muted&&context?.state==='suspended')sync();};document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
 function state(){let signal=0;if(playing()){analyser.getByteTimeDomainData(samples);signal=Math.sqrt(samples.reduce((sum,v)=>sum+((v-128)/128)**2,0)/samples.length);}return {inside,muted,playing:playing(),volume:+volume.value,signal:Math.round(signal*100000)/100000};}
 return {enter(){inside=true;sync();},leave(){inside=false;stop();},state};
}
