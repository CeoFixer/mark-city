// An original, quiet synthesizer loop. Audio starts only after entering via a user action.
export function createDiscoMusic(container){
 const button=document.createElement('button');button.id='discoMusic';button.hidden=true;container.appendChild(button);
 let context,gain,timer,inside=false,muted=false,beat=0,next=0;
 const notes=[196,246.94,293.66,246.94,174.61,220,261.63,220];
 function stop(){if(timer){clearInterval(timer);timer=null;}if(gain&&context){gain.gain.setValueAtTime(0,context.currentTime);context.suspend().catch(()=>{});}}
 function tone(frequency,at,duration,type,volume){const osc=context.createOscillator(),env=context.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,at);env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(volume,at+.015);env.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(env);env.connect(gain);osc.start(at);osc.stop(at+duration+.01);osc.onended=()=>{osc.disconnect();env.disconnect();};}
 function schedule(){while(next<context.currentTime+.16){tone(notes[beat%notes.length],next,.22,'sine',.3);if(beat%2===0)tone(65.41,next,.15,'sine',.45);if(beat%4===2)tone(392,next,.08,'triangle',.08);beat++;next+=.3;}}
 async function sync(){button.textContent=muted?'Музыка: выкл.':'Музыка: вкл.';button.setAttribute('aria-pressed',String(!muted));if(!inside||muted||document.hidden){stop();return;}
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){button.textContent='Музыка недоступна';button.disabled=true;return;}
  if(!context){context=new Audio();gain=context.createGain();gain.connect(context.destination);}try{await context.resume();}catch{button.textContent='Включить музыку';return;}if(!inside||muted||document.hidden){stop();return;}gain.gain.setValueAtTime(.09,context.currentTime);if(!timer){next=context.currentTime+.03;beat=0;schedule();timer=setInterval(schedule,80);}
 }
 button.onclick=()=>{muted=!muted;sync();};document.addEventListener('visibilitychange',sync);
 return {enter(){inside=true;button.hidden=false;sync();},leave(){inside=false;button.hidden=true;stop();},state:()=>({inside,muted,playing:!!timer&&context?.state==='running'})};
}
