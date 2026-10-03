import {createTechnoSynth,STEP_SECONDS,LOOP_STEPS,sectionAt} from './techno.js?v=techno-8';
// Playback starts with an entrance gesture. All sound controls stay in the menu.
export function createDiscoMusic(container){
 const controls=document.createElement('fieldset');controls.id='discoControls';
 const legend=document.createElement('legend');legend.textContent='Звук';
 const enabled=document.createElement('input');enabled.type='checkbox';enabled.id='discoMusic';enabled.checked=true;
 const label=document.createElement('label');label.append(enabled,document.createTextNode('Музыка в дискотеке'));
 const volume=document.createElement('input');volume.type='range';volume.min=0;volume.max=100;volume.value=70;volume.id='discoVolume';volume.setAttribute('aria-label','Громкость музыки');volume.title='Громкость музыки';
 const retry=document.createElement('button');retry.type='button';retry.id='discoRetry';retry.textContent='Включить звук';retry.hidden=true;
 const note=document.createElement('small');note.id='discoNote';note.style.flexBasis='100%';
 controls.append(legend,label,volume,retry,note);container.insertBefore(controls,container.querySelector('.primary'));
 let context,gain,analyser,samples,synth,timer,inside=false,muted=false,step=0,next=0,startId=0,startedAt=0;
 const wanted=()=>inside&&!muted&&!document.hidden;
 const playing=()=>!!timer&&context?.state==='running';
 function updateControls(){
  retry.hidden=!inside||muted||playing();
  note.textContent=muted?'Музыка выключена.':+volume.value===0?'Громкость музыки — 0.':!inside?'Электронный трек включится при входе в дискотеку.':playing()?'Оригинальный электронный трек · 128 BPM': 'Браузер ещё не включил звук. Нажми «Включить звук».';
 }
 function stop(){startId++;if(timer){clearInterval(timer);timer=null;}synth?.stop();synth=null;if(gain&&context?.state!=='closed'){gain.gain.setValueAtTime(0,context.currentTime);context.suspend().catch(()=>{});}updateControls();}
 function schedule(){
  // Do not queue a burst of missed notes after a background tab or a slow frame.
  if(next<context.currentTime-.15){const missed=Math.ceil((context.currentTime+.02-next)/STEP_SECONDS);step+=missed;next+=missed*STEP_SECONDS;}
  while(next<context.currentTime+.16){synth.schedule(step++,next);next+=STEP_SECONDS;}
 }
 async function sync(){
  if(!wanted()){stop();return;}
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){enabled.disabled=true;volume.disabled=true;retry.hidden=true;note.textContent='Этот браузер не поддерживает музыку игры.';return;}
  if(!context||context.state==='closed'){
   if(context)stop();
   try{context=new Audio();}catch{note.textContent='Не удалось включить звук. Попробуй ещё раз.';retry.hidden=false;return;}
   gain=context.createGain();gain.gain.value=0;analyser=context.createAnalyser();analyser.fftSize=256;samples=new Uint8Array(analyser.fftSize);gain.connect(analyser);analyser.connect(context.destination);context.addEventListener('statechange',updateControls);
  }
  const request=++startId;updateControls();
  try{await context.resume();}catch{updateControls();return;}
  if(request!==startId||!wanted()||context.state!=='running')return;
  gain.gain.setValueAtTime(+volume.value*.004,context.currentTime);
  if(!timer){synth=createTechnoSynth(context,gain);step=0;next=context.currentTime+.03;startedAt=next;schedule();timer=setInterval(schedule,40);}
  updateControls();
 }
 enabled.onchange=()=>{muted=!enabled.checked;sync();};volume.oninput=()=>{updateControls();sync();};retry.onclick=sync;
 document.addEventListener('visibilitychange',sync);
 const unlock=()=>{if(wanted()&&(!context||context.state!=='running'))sync();};
 document.addEventListener('pointerup',unlock);document.addEventListener('keydown',unlock);document.addEventListener('click',unlock);window.addEventListener('focus',unlock);
 function state(){let signal=0;if(playing()){analyser.getByteTimeDomainData(samples);signal=Math.sqrt(samples.reduce((sum,v)=>sum+((v-128)/128)**2,0)/samples.length);}const audibleStep=context?Math.max(0,Math.floor((context.currentTime-startedAt)/STEP_SECONDS)):0;return {inside,muted,playing:playing(),volume:+volume.value,signal:Math.round(signal*100000)/100000,audioState:context?.state??'not-started',section:sectionAt(audibleStep),loopSeconds:LOOP_STEPS*STEP_SECONDS,voices:synth?.voiceCount??0};}
 updateControls();
 return {enter(){inside=true;sync();},leave(){inside=false;stop();},state};
}
