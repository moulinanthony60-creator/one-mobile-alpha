const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

// Audio léger et local pour 3:17. Les sons sont synthétisés afin de ne pas
// bloquer le chargement du jeu avec de gros fichiers audio.
export function createHorrorAudio(){
  let ctx=null,master=null,muted=false,started=false,closed=false;
  let level=clamp(Number(localStorage.getItem('one_317_volume')??.78),0,1);
  let lastMonsterStep=0;
  const now=()=>ctx?.currentTime||0;
  function ensure(){
    if(closed)return null;
    if(!ctx){
      ctx=new (window.AudioContext||window.webkitAudioContext)();
      master=ctx.createGain();master.gain.value=muted?0:level;master.connect(ctx.destination);
    }
    return ctx;
  }
  function setVolume(value){
    level=clamp(Number(value),0,1);localStorage.setItem('one_317_volume',String(level));
    if(master)master.gain.setTargetAtTime(muted?0:level,now(),.025);
    return level;
  }
  function tone(frequency=440,duration=.12,gain=.03,type='sine',endFrequency=frequency){
    const audio=ensure();if(!audio||muted)return;
    const t=audio.currentTime+.005,osc=audio.createOscillator(),amp=audio.createGain();
    const peak=Math.max(.0001,gain*level);osc.type=type;osc.frequency.setValueAtTime(Math.max(20,frequency),t);
    if(endFrequency!==frequency)osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),t+duration);
    amp.gain.setValueAtTime(.0001,t);amp.gain.exponentialRampToValueAtTime(peak,t+.012);amp.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(amp).connect(master);osc.start(t);osc.stop(t+duration+.035);
  }
  function noise(duration=.08,gain=.04,filter=900){
    const audio=ensure();if(!audio||muted)return;
    const length=Math.max(1,Math.floor(audio.sampleRate*duration)),buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
    const src=audio.createBufferSource(),amp=audio.createGain(),low=audio.createBiquadFilter(),t=audio.currentTime+.005;
    low.type='lowpass';low.frequency.value=filter;amp.gain.setValueAtTime(.0001,t);amp.gain.exponentialRampToValueAtTime(Math.max(.0001,gain*level),t+.008);amp.gain.exponentialRampToValueAtTime(.0001,t+duration);
    src.buffer=buffer;src.connect(low).connect(amp).connect(master);src.start(t);src.stop(t+duration+.02);
  }
  function playerStep(surface='wood'){const base=surface==='tile'?150:surface==='stone'?92:118;tone(base,.075,.045,'triangle',base*.62);noise(.045,.012,surface==='stone'?500:800);}
  function monsterStep(distance=8,state='patrol',sameFloor=true){
    if(!sameFloor)return;
    // Le Parasite ne doit pas être audible à travers toute la maison.
    // L'écoute démarre dans les derniers mètres et suit une courbe douce.
    const d=Math.max(0,Number(distance)||0),maxDistance=8.5;
    if(d>=maxDistance)return;
    const near=1-d/maxDistance,audibility=near*near;
    const minGap=.44-near*.20,stamp=performance.now();
    if(stamp-lastMonsterStep<minGap*1000)return;lastMonsterStep=stamp;
    const gain=.018+audibility*.30+(state==='chase'?audibility*.055:0),pitch=state==='chase'?74:state==='search'?84:98;
    tone(pitch,.12,gain,'triangle',pitch*.55);noise(.10,gain*.34,360+near*260);
  }
  // Les grognements sont volontairement supprimés. La tension vient des pas,
  // des portes et de la musique très discrète, sans voix agressive répétitive.
  function monsterVoice(){return false;}
  function start(){const audio=ensure();started=true;audio?.resume?.();}
  function pause(){ctx?.suspend?.();}
  function stop(){closed=true;ctx?.close?.();ctx=null;master=null;}
  function toggle(){muted=!muted;if(master)master.gain.setTargetAtTime(muted?0:level,now(),.025);return muted;}
  function update(){/* réservé à l'atténuation future; aucun son continu */}
  function door(open=true,distance=4){tone(open?180:120,.11,.045,'square',open?260:90);}
  function search(){tone(330,.16,.035,'sine',520);}
  function spotted(){tone(180,.24,.07,'sawtooth',70);}
  function finish(won){tone(won?420:72,won?.35:.5,.045,won?'sine':'triangle',won?720:35);}
  function hide(){/* silence volontaire dans une cachette */}
  return {start,pause,stop,toggle,tone,update,door,search,spotted,finish,hide,playerStep,monsterStep,monsterVoice,setVolume,getVolume:()=>level,isMuted:()=>muted};
}
