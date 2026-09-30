// Original procedural soundtrack and Foley. Nothing is downloaded or recorded.
export function createHorrorAudio(){
  let context=null,master=null,drone=null,breath=null,noiseBuffer=null,closed=false,muted=false,finished=false;
  let listener={x:0,y:0,z:0},enemy={x:0,y:0,z:0},yaw=0,hidden=false,mode='dormant',nextNote=0,nextBreath=0,nextPulse=0,foot=0;
  const oscillators=[];let seed=31741,analyser=null;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function audible(){return context?.state==='running'&&!muted&&!closed;}
  function ramp(param,value,time=.15){if(!context)return;param.setTargetAtTime(value,context.currentTime,time);}
  function panForEnemy(){const dx=enemy.x-listener.x,dz=enemy.z-listener.z;return clamp((Math.cos(yaw)*dx-Math.sin(yaw)*dz)/Math.max(1,Math.hypot(dx,dz)),-.85,.85);}
  function outlet(gain,pan=0){const p=context.createStereoPanner();p.pan.value=pan;gain.connect(p);p.connect(master);return p;}
  function tone(freq,duration=.15,volume=.02,type='sine',end=freq,pan=0,delay=0){
    if(!audible())return;
    const t=context.currentTime+delay,o=context.createOscillator(),g=context.createGain(),p=outlet(g,pan);
    o.type=type;o.frequency.setValueAtTime(Math.max(15,freq),t);o.frequency.exponentialRampToValueAtTime(Math.max(15,end),t+duration);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();p.disconnect();};
  }
  function noise(duration,volume,cutoff=500,pan=0,kind='lowpass',delay=0){
    if(!audible())return;
    const t=context.currentTime+delay,n=context.createBufferSource(),g=context.createGain(),f=context.createBiquadFilter(),p=outlet(g,pan);
    n.buffer=noiseBuffer;n.playbackRate.value=.8+random()*.4;f.type=kind;f.frequency.value=cutoff;f.Q.value=kind==='bandpass'?1.2:.7;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    n.connect(f);f.connect(g);n.start(t,random()*.4);n.stop(t+duration+.02);n.onended=()=>{n.disconnect();f.disconnect();g.disconnect();p.disconnect();};
  }
  function start(){
    if(closed)return;
    try{
      if(!context){
        const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
        context=new Audio();master=context.createGain();master.gain.value=muted?0:.42;
        const compressor=context.createDynamicsCompressor();compressor.threshold.value=-17;compressor.ratio.value=5;compressor.attack.value=.006;compressor.release.value=.2;
        master.connect(compressor);compressor.connect(context.destination);
        if(window.__ONE317_TEST__===true){analyser=context.createAnalyser();analyser.fftSize=256;master.connect(analyser);}
        noiseBuffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate);const samples=noiseBuffer.getChannelData(0);let brown=0;
        for(let i=0;i<samples.length;i++){brown=(brown+(random()*2-1)*.035)/1.018;samples[i]=brown*2+(random()*2-1)*.09;}
        drone=context.createGain();drone.gain.value=.022;drone.connect(master);
        const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=210;filter.Q.value=.4;filter.connect(drone);
        for(const [hz,type,level] of [[46.25,'sine',.55],[69.3,'triangle',.24],[70.05,'sine',.2],[138.59,'sine',.08]]){
          const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.value=hz;g.gain.value=level;o.connect(g);g.connect(filter);o.start();oscillators.push(o);
        }
        breath=context.createGain();breath.gain.value=0;
        const wind=context.createBufferSource(),windFilter=context.createBiquadFilter();wind.buffer=noiseBuffer;wind.loop=true;windFilter.type='bandpass';windFilter.frequency.value=430;windFilter.Q.value=.6;wind.connect(windFilter);windFilter.connect(breath);breath.connect(master);wind.start();oscillators.push(wind);
        nextNote=context.currentTime+3;nextBreath=context.currentTime+4;
      }
      if(context.state==='suspended')context.resume().catch(()=>{});
      ramp(master.gain,muted?0:.42,.08);
    }catch{/* The game remains playable if audio is unavailable. */}
  }
  function update(input){
    listener=input.listener;enemy=input.monster;yaw=input.yaw;hidden=input.hidden;mode=input.state;
    if(!audible()||finished)return;
    const distance=Math.hypot(enemy.x-listener.x,enemy.z-listener.z),same=Math.abs(enemy.y-listener.y)<1.5,near=clamp(1-distance/11,0,1)*(same?1:.2),chase=mode==='chase',now=context.currentTime;
    ramp(drone.gain,.018+(chase?.045:near*.018));ramp(breath.gain,hidden?.012:.004, .4);
    if(now>=nextNote){nextNote=now+5+random()*6;const notes=[138.59,146.83,185.0,207.65],note=notes[Math.floor(random()*notes.length)];tone(note,3.8,chase?.013:.009,'sine',note*.997,random()*1.2-.6);tone(note*2.003,2.4,.004,'sine',note*2,0,.25);}
    if(now>=nextBreath){nextBreath=now+(hidden?2.6:4.8)+random();noise(hidden?.9:.6,hidden?.050:.018,hidden?680:420,0,'bandpass');}
    if((hidden&&near>.1||chase)&&now>=nextPulse){nextPulse=now+(chase?.59:1.15-near*.3);tone(53,.13,.035+near*.035,'sine',30);tone(46,.15,.025,'sine',27,0,.16);}
  }
  function playerStep(surface='wood'){
    const pan=(foot++%2?.09:-.09);tone(surface==='tile'?126:surface==='wood'?92:71,.09,.050,'sine',38,pan);
    noise(surface==='wood'?.16:.11,surface==='wood'?.075:.052,surface==='tile'?1700:550,pan);
    if(surface==='wood'&&foot%5===0)tone(175,.30,.013,'triangle',91,pan,.05);
  }
  function monsterStep(distance=6,state='patrol',same=true){const v=clamp(1-distance/14,0,1)*(same?1:.15),pan=panForEnemy();if(v<=0)return;
    tone(state==='chase'?58:43,.18,.13*v,'sine',24,pan);noise(.27,.13*v,220,pan);noise(.22,.045*v,1050,pan,'bandpass',.12);
  }
  function monsterVoice(distance=8,state='search',same=true){const v=clamp(1-distance/18,0,1)*(same?1:.2),pan=panForEnemy();if(v<=0)return;
    tone(state==='chase'?69:52,.75,.060*v,'sawtooth',31,pan);noise(.95,.12*v,380,pan,'bandpass');tone(111,.9,.012*v,'triangle',58,pan,.12);
  }
  function door(open=true,distance=0){const v=clamp(1-distance/14,0,1),pan=distance?panForEnemy():0;noise(.14,.12*v,370,pan);tone(open?185:125,.48,.022*v,'triangle',open?88:61,pan);if(!open)tone(66,.17,.10*v,'sine',30,pan,.15);}
  function search(){noise(.45,.08,920,0,'bandpass');tone(117,.25,.018,'triangle',68);}
  function hide(enter){if(enter){noise(.28,.095,500);tone(95,.30,.018,'triangle',46);}else noise(.20,.055,650);}
  function spotted(){tone(87,.75,.075,'sawtooth',42);tone(98,.72,.045,'triangle',50);noise(.4,.10,820,panForEnemy(),'bandpass');}
  function scare(){noise(.48,.22,1100,0,'bandpass');tone(190,.65,.095,'sawtooth',43);tone(202,.59,.066,'triangle',54);tone(42,.45,.14,'sine',23);}
  return {start,update,tone,playerStep,monsterStep,monsterVoice,door,search,hide,spotted,scare,
    finish(){finished=true;if(drone)ramp(drone.gain,0,.8);if(breath)ramp(breath.gain,0,.2);},
    get muted(){return muted;},toggle(){muted=!muted;if(!muted)start();if(master)ramp(master.gain,muted?0:.42,.035);return muted;},
    pause(){if(context?.state==='running')context.suspend().catch(()=>{});},
    inspect(){const samples=new Float32Array(256);analyser?.getFloatTimeDomainData(samples);return {state:context?.state||'uninitialized',muted,music:!!drone,finished,signalPeak:Math.max(...samples.map(Math.abs))};},
    stop(){if(closed)return;closed=true;for(const o of oscillators)try{o.stop();}catch{}if(context&&context.state!=='closed')context.close().catch(()=>{});}
  };
}
