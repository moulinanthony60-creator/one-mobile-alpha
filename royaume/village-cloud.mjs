export const VILLAGE_API='https://one-valdoria-api.moulinanthony60.workers.dev/api/villages';
export function createVillageCloud({getState,setState,save,notice,request=fetch,schedule=setInterval}){
 let inflight=null,status='';
 async function api(body){
  const token=localStorage.getItem('one_account_token_v06');
  if(!token)throw Error('Connectez-vous à votre compte ONE pour ouvrir les conquêtes en ligne.');
  const r=await request(VILLAGE_API,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify({...body,expectedUser:getState().cloud?.user})}:{}),signal:AbortSignal.timeout(15000)});
  let data;try{data=await r.json();}catch{throw Error('ONE est momentanément indisponible. Votre progression reste sur cet appareil.');}
  if(!r.ok){const e=Error(data.error||'Connexion interrompue. Réessayez.');e.data=data;throw e;}
  return data;
 }
 function accept(data,queue=[]){
  if(!data.registered)return;
  const s=data.state;s.pvp??={history:[]};s.pvp.shieldUntil=data.shield;s.cloud={user:data.user,rev:data.rev,queue,busy:false,request:null,raid:s.pvp?.active&&!s.pvp.active.result?s.pvp.active.id:null};
  setState(s);save();status='Village sauvegardé sur ONE';
 }
 async function connect(){const data=await api();if(data.registered){const old=getState();if(old.cloud?.user&&old.cloud.user!==data.user)throw Error('Ce village appartient à un autre compte ONE. Reconnectez le bon compte.');if(old.cloud?.queue?.length)return flush();accept(data);}return data;}
 function batch(queue){const out=[];let seconds=0;for(const e of queue){if(out.length===20||e.kind==='tick'&&seconds+e.dt>3.99)break;out.push(e);if(e.kind==='tick')seconds+=e.dt;}return out;}
 async function flush(){
  if(inflight)return inflight;if(!getState().cloud)return null;
  inflight=(async()=>{
   let data;
   do{
    const s=getState(),c=s.cloud;c.busy=true;
    const saved=c.request&&typeof c.request==='object'?c.request:null;
    const events=saved?.events||batch(c.queue),id=saved?.id||crypto.randomUUID(),rev=saved?.rev??c.rev;c.request={id,events,rev};save();
    try{
     data=await api({action:'sync',rev,id,events});
     if(data.user!==c.user)throw Error('Le compte ONE a changé. Reconnectez le compte associé au village.');
     accept(data,c.queue.slice(events.length));
    }catch(e){
     c.busy=false;status='En attente de connexion ONE';
     if(e.data?.registered&&e.data.user===c.user){accept(e.data);notice(e.message);}
     else save();throw e;
    }
   }while(getState().cloud.queue.length);
   return data;
  })().finally(()=>{inflight=null;});return inflight;
 }
 async function enroll(){
  await connect();if(getState().cloud)return;
  localStorage.setItem('one_royaumes_aurore_v1_before_online',JSON.stringify(getState()));
  accept(await api({action:'enroll',state:getState()}));
 }
 async function command(body){if(inflight)await inflight;const c=getState().cloud;if(c)c.busy=true;
  try{const d=await api(body);if(d.registered){if(c&&d.user!==c.user)throw Error('Le compte ONE a changé.');accept(d);}return d;}
  catch(e){if(e.data?.registered&&(!c||e.data.user===c.user))accept(e.data);throw e;}
  finally{if(getState().cloud)getState().cloud.busy=false;}
 }
 schedule(()=>{if(getState().cloud&&!getState().cloud.raid&&!document.hidden)flush().catch(()=>{});},4000);
 return {connect,enroll,flush,command,get status(){return status;}};
}
