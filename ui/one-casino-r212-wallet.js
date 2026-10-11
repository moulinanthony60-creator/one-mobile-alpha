const API='https://one-comments-api.moulinanthony60.workers.dev',stakes=[10,25,50,100];
// All balances, draws and awards come from the existing account service.
// Reuse its pending-request key so the old Points panel and the 3D casino can
// recover the same wager rather than charging a second one after a lost reply.
export async function createWallet({token=()=>window.oneAccountToken?.(),storage=localStorage,request=fetch,onChange=()=>{}}={}){
 const accountToken=token();if(!accountToken)throw Error('Connecte-toi à ton compte ONE pour jouer.');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(accountToken)),key='one-casino-'+Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');let dead=false,busy=false,pending=null,data={balance:0,round:null,slotBonus:{remaining:0}},loaded=false,error='';
 const same=()=>accountToken===token(),read=()=>{try{const p=JSON.parse(storage.getItem(key)||'null');return p&&['/points/play','/points/blackjack'].includes(p.path)&&p.body&&/^[a-f0-9-]{36}$/i.test(p.body.id||'')?p:null;}catch{return null;}},notify=()=>{if(!dead)onChange(state());},state=()=>({data,pending,busy,loaded,error,accountValid:same()});pending=read();
 async function api(path,body){if(!same())throw Error('Le compte a changé. Rouvre la machine.');const r=await request(API+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+accountToken,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)}),d=await r.json();if(!r.ok)throw Object.assign(Error(d.error||'Le service ne répond pas. Réessaie.'),{definitive:r.status>=400&&r.status<500});if(!Number.isSafeInteger(d.balance)||d.balance<0||body&&(!d.round||d.round.id!==body.id))throw Error('La réponse est incomplète. Retrouve ton résultat.');return d;}
 async function refresh(){if(busy)return;busy=true;error='';notify();try{const d=await api('/points/state');if(same()){data=d;loaded=true;pending=read();}}catch(e){error=e.message;}finally{busy=false;notify();}}
 async function run(path,body,retry=false){if(busy||dead||!same())return false;busy=true;error='';notify();
  const execute=async lock=>{if(lock===null){error='Une autre fenêtre valide déjà ta mise.';return false;}const saved=read();if(saved&&!retry){pending=saved;error='Retrouve le résultat en attente avant de rejouer.';return false;}if(retry){if(!saved){pending=null;loaded=false;error='La mise a été confirmée ailleurs. Actualise ton solde.';return false;}path=saved.path;body=saved.body;}pending={path,body};
   // A persistent request must exist before the first network byte is sent.
   try{storage.setItem(key,JSON.stringify(pending));}catch{error='Le navigateur ne peut pas conserver cette mise. Autorise le stockage puis réessaie.';return false;}notify();
   try{const d=await api(path,body);const saved=read();if(saved?.body.id===body.id&&saved?.body.version===body.version)storage.removeItem(key);pending=null;if(same()){data=d;loaded=true;}return true;}
   catch(e){error=e.message;if(e.definitive){if(read()?.body.id===body.id)storage.removeItem(key);pending=null;}return false;}
  };
  try{return globalThis.navigator?.locks?await navigator.locks.request(key,{ifAvailable:true},execute):await execute(undefined);}finally{busy=false;notify();}
 }
 return {state,refresh,play(kind,stake,choice='red'){if(!loaded||!stakes.includes(stake)||!['slots','roulette','blackjack'].includes(kind)||data.round&&!data.round.settled)return Promise.resolve(false);const free=kind==='slots'&&data.slotBonus?.remaining>0,amount=free?data.slotBonus.stake:stake;if(!free&&data.balance<amount){error='Il te manque des Points ONE pour cette mise.';notify();return Promise.resolve(false);}return run('/points/play',{id:crypto.randomUUID(),kind,stake:amount,...(kind==='roulette'?{choice}:{})});},move(action){const r=data.round;if(!r||r.kind!=='blackjack'||r.settled||!['hit','stand'].includes(action))return Promise.resolve(false);return run('/points/blackjack',{id:r.id,version:r.version,action});},recover(){return pending?run(pending.path,pending.body,true):Promise.resolve(false);},dispose(){dead=true;}};
}
