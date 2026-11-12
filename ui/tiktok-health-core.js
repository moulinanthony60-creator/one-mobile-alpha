/* A successful HTTP response is not evidence of playback. Use the official player. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ONETikTokHealthCore=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const ORIGIN='https://www.tiktok.com';
 const validId=id=>typeof id==='string'&&/^\d{8,24}$/.test(id);
 function snapshot(entries){
  if(!Array.isArray(entries))throw Error('Réponse du catalogue invalide.');
  const seen=new Set();
  return entries.filter(entry=>{
   if(!entry||typeof entry!=='object')throw Error('Entrée du catalogue invalide.');
   const key=String(entry.id);if(seen.has(key))return false;seen.add(key);return true;
  }).map(entry=>({id:typeof entry.id==='string'?entry.id:'',title:String(entry.title||'Vidéo TikTok').slice(0,300),status:'pending'}));
 }
 function evidence(minSeconds=1){
  let playing=false,first=null;
  return data=>{
   if(!data||typeof data!=='object'||data['x-tiktok-player']!==true)return null;
   if(data.type==='onPlayerError'){
    const code=data.value?.errorCode;
    if(typeof code!=='number'||!Number.isFinite(code))return {status:'unknown',reason:'player_error'};
    return {status:code===1001?'unavailable':'unknown',reason:code===1001?'invalid_video':code===2005||data.value?.errorType==='TOO_MANY_REQUESTS'?'rate_limit':code===3002?'autoplay':code===2001?'server_error':'player_error',code};
   }
   if(data.type==='onError')return {status:'unknown',reason:'player_error'};
   if(data.type==='onImageChange')return {status:'unknown',reason:'image_post'};
   if(data.type==='onStateChange'){
    playing=data.value===1;if(!playing)first=null;
   }
   if(data.type==='onCurrentTime'&&playing){
    const time=data.value?.currentTime;
    if(typeof time!=='number'||!Number.isFinite(time)||time<0)return null;
    if(first===null||time<first)first=time;
    else if(time-first>=minSeconds)return {status:'played',reason:'time_advanced',seconds:Number((time-first).toFixed(2))};
   }
   return null;
  };
 }
 function inspect(entry,{container,signal,timeoutMs=20000,minSeconds=1,host=globalThis,doc=globalThis.document}={}){
  if(!validId(entry.id))return Promise.resolve({status:'invalid',reason:'invalid_id'});
  if(signal?.aborted)return Promise.resolve({status:'pending',reason:'interrupted'});
  return new Promise(resolve=>{
   const frame=doc.createElement('iframe'),read=evidence(minSeconds);let done=false,timer,started=false;
   frame.title='Contrôle de lecture TikTok';frame.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';
   frame.referrerPolicy='strict-origin-when-cross-origin';
   function send(type){try{frame.contentWindow?.postMessage({'x-tiktok-player':true,type},ORIGIN);}catch{}}
   function finish(result){
    if(done)return;done=true;host.clearTimeout(timer);
    host.removeEventListener('message',message);signal?.removeEventListener('abort',abort);
    send('pause');frame.remove();resolve(result);
   }
   function abort(){finish({status:'pending',reason:'interrupted'});}
   function message(event){
    if(event.origin!==ORIGIN||event.source!==frame.contentWindow)return;
    const data=event.data;
    if(data?.['x-tiktok-player']!==true)return;
    if(data.type==='onPlayerReady'&&!started){started=true;send('mute');send('play');}
    const result=read(data);if(result)finish(result);
   }
   host.addEventListener('message',message);signal?.addEventListener('abort',abort,{once:true});
   timer=host.setTimeout(()=>finish({status:'unknown',reason:'timeout'}),timeoutMs);
   try{
    frame.src=ORIGIN+'/player/v1/'+entry.id+'?autoplay=1&force_muted=1&muted=1&loop=0&rel=0&controls=1&description=0&music_info=0';
    container.replaceChildren(frame);
   }catch{finish({status:'unknown',reason:'player_error'});}
  });
 }
 function counts(rows){
  const result={total:rows.length,checked:0,played:0,unavailable:0,unknown:0,invalid:0,pending:0};
  for(const row of rows){const status=Object.hasOwn(result,row.status)&&row.status!=='total'&&row.status!=='checked'?row.status:'pending';result[status]++;if(status!=='pending')result.checked++;}
  return result;
 }
 return {validId,snapshot,evidence,inspect,counts};
});
