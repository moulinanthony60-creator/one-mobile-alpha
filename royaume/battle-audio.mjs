// Optional synthesised battle feedback. Audio starts only after an explicit tap.
export function createCombatAudio(){
 let context=null,enabled=false,last=0,voices=0;
 function tone(frequency,seconds,gain=.04,type='triangle',end=frequency*.65){
  if(!enabled||!context||voices>=8||context.state!=='running')return;
  const start=context.currentTime,osc=context.createOscillator(),volume=context.createGain();voices++;
  osc.type=type;osc.frequency.setValueAtTime(frequency,start);osc.frequency.exponentialRampToValueAtTime(Math.max(24,end),start+seconds);
  volume.gain.setValueAtTime(gain,start);volume.gain.exponentialRampToValueAtTime(.0001,start+seconds);osc.connect(volume);volume.connect(context.destination);
  osc.onended=()=>{voices--;osc.disconnect();volume.disconnect();};osc.start();osc.stop(start+seconds);
 }
 return {
  async toggle(){
   if(enabled){enabled=false;await context?.suspend();return false;}
   const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;
   try{context??=new Audio();await context.resume();enabled=true;tone(660,.09,.025);return true;}catch{return false;}
  },
  sync(battle){for(const effect of battle.effects){if((effect.visualId||0)<=last)continue;last=effect.visualId;
   if(effect.style==='cannon'||effect.style==='mortar')tone(115,.23,.075,'triangle',28);
   else if(effect.style==='magic'||effect.style==='arcane')tone(750,.21,.024,'sine',190);
   else if(effect.style==='slash')tone(390,.055,.018,'sawtooth',130);
   else if(effect.style==='arrow')tone(1050,.06,.012,'triangle',330);
   else if(effect.kind==='spell')tone(95,.5,.075,'triangle',26);
  }},
  deploy(){tone(520,.075,.02,'sine',830);},
  reset(){last=0;},
  suspend(){context?.suspend().catch(()=>{});},
  resume(){if(enabled)context?.resume().catch(()=>{});},
  dispose(){enabled=false;context?.close().catch(()=>{});context=null;}
 };
}
