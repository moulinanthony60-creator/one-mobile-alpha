/* Together uses the existing ONE feed and authenticated provider connection. */
(()=>{
 'use strict';
 const cache=new Map(),durations=new Map();
 let generation=0;
 const owner=()=>localStorage.getItem('one_account_token_v06')||'';
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const https=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
 function durationLabel(value){
  if(typeof value==='string'&&/^\d{1,3}:\d{2}(?::\d{2})?$/.test(value.trim()))return value.trim();
  let seconds=typeof value==='number'?value:null;if(typeof value==='string'){let m=value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/i)||value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?$/i);if(m&&m[0])seconds=Number(m[1]||0)*3600+Number(m[2]||0)*60+Number(m[3]||0);}
  if(!Number.isFinite(seconds)||seconds<=0)return '';seconds=Math.floor(seconds);const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),sec=String(seconds%60).padStart(2,'0');return h?h+':'+String(m).padStart(2,'0')+':'+sec:m+':'+sec;
 }
 const plain=value=>String(value||'').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt);/gi,(all,key)=>{if(key[0]==='#'){const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));return Number.isInteger(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):all;}return {amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'}[key.toLowerCase()]||all;});
 async function hydrate(list,signal){
  const token=owner(),needed=list.filter(x=>x.source==='youtube'&&!x.live&&!x.duration&&!durations.has(x.key));
  if(needed.length&&window.oneProviderReady?.('youtube')&&typeof window.oneConnectedFetch==='function'){
   const ids=needed.slice(0,50).map(x=>x.key.slice(8)),controller=AbortSignal.timeout(8000);
   try{const r=await window.oneConnectedFetch('https://www.googleapis.com/youtube/v3/videos?'+new URLSearchParams({part:'contentDetails,snippet',id:ids.join(',')}),{signal:signal?AbortSignal.any([signal,controller]):controller});const data=await r.json();if(token!==owner()||signal?.aborted)return list;if(r.ok){for(const item of needed)durations.set(item.key,{duration:'',live:false});for(const v of data.items||[])durations.set('youtube:'+v.id,{duration:durationLabel(v.contentDetails?.duration),live:v.snippet?.liveBroadcastContent==='live'});}}
   catch(e){if(signal?.aborted)throw e;}if(durations.size>500)durations.clear();
  }
  return list.map(x=>!x.duration&&durations.has(x.key)?{...x,...durations.get(x.key)}:x);
 }
 function normalize(x){
  if(!x||x.local)return null;
  const source=x.p||x.source;
  let id='',url='',kind=source,live=x.live===true||x.duration==='LIVE'||x.liveBroadcastContent==='live';
  if(source==='youtube'){
   id=String(x.videoId||String(x.id||'').replace(/^yt_/,''));
   if(!/^[\w-]{11}$/.test(id))return null;
   url='https://www.youtube.com/watch?v='+id;
  }else if(source==='tiktok'){
   id=String(x.tiktokId||'');if(!/^\d{10,25}$/.test(id))return null;
   url='https://www.tiktok.com/player/v1/'+id;
  }else if(source==='twitch'){
   if(x.twitchClipId||x.isTwitchClip)return null;
   if(x.twitchVideoId||x.isTwitchVod){id=String(x.twitchVideoId||'').replace(/^v/,'');if(!/^\d+$/.test(id))return null;url='https://www.twitch.tv/videos/'+id;}
   else{id=String(x.twitchChannel||'').toLowerCase();if(!/^[a-z0-9_]{1,25}$/.test(id))return null;url='https://www.twitch.tv/'+id;live=true;}
   kind=live?'twitch-live':'twitch-vod';
  }else if(source==='one'||source==='audio'){
   url=https(x.url);if(!url||!(/\.(mp4|webm|ogv|ogg|mp3|m4a|wav|oga)$/i.test(new URL(url).pathname)))return null;id=url;
  }else return null;
  return {key:kind+':'+id,source,url,title:plain(x.title||x.creator||'Vidéo').slice(0,120),creator:plain(x.creator||''),thumbnail:https(x.thumbnail),duration:durationLabel(x.durationSeconds??x.duration??x.contentDetails?.duration),live,tags:Array.isArray(x.tags)?x.tags.map(String):[]};
 }
 function unique(list){return [...new Map(list.map(normalize).filter(Boolean).map(x=>[x.key,x])).values()];}
 function snapshot(source){
  const yt=typeof youtubeItems!=='undefined'?youtubeItems:[],tt=typeof tiktokItems!=='undefined'?tiktokItems:[],tw=typeof twitchItems!=='undefined'?twitchItems:[];
  const vod=typeof twitchVodItems!=='undefined'?twitchVodItems:[],following=typeof followingItems!=='undefined'?followingItems:[];
  const music=typeof musicPlaylist!=='undefined'?musicPlaylist:[],native=typeof items!=='undefined'?items:[];
  return unique(source==='audio'?music:[...yt,...tt,...tw,...vod,...following,...native].filter(x=>(x.p||x.source)===source));
 }
 function filter(list,q){const n=norm(q).trim();return n?list.filter(x=>norm(x.title+' '+x.creator+' '+x.tags.join(' ')).includes(n)):list;}
 function reset(){generation++;cache.clear();durations.clear();}
 async function browse(source,{query='',cursor='',remote=false,signal}={}){
  const captured=owner(),epoch=generation;
  const check=()=>{if(signal?.aborted||captured!==owner()||epoch!==generation)throw new DOMException('Recherche annulée','AbortError');};
  check();query=query.trim().slice(0,120);
  if(source==='tiktok'){
   await window.ONECatalogue?.ready;check();await window.ONETikTokPublic?.refresh({force:remote});check();window.loadTikTokLocal?.();
  }
  const local=filter(snapshot(source),query);
  if(!['youtube','twitch'].includes(source)){
   const offset=Math.max(0,Number(cursor)||0);
   return {items:local.slice(offset,offset+24),cursor:offset+24<local.length?String(offset+24):'',total:local.length,local:true};
  }
  if(!remote&&!query&&!cursor&&local.length)return {items:await hydrate(local.slice(0,24),signal),cursor:local.length>24?'feed:24':'',total:local.length,local:true};
  if(cursor.startsWith('feed:')){const offset=Number(cursor.slice(5))||24;return {items:await hydrate(local.slice(offset,offset+24),signal),cursor:offset+24<local.length?'feed:'+(offset+24):'',total:local.length,local:true};}
  const key=JSON.stringify([captured,source,query,cursor]),cached=cache.get(key);
  const ttl=source==='youtube'?30*60*1000:60*1000;
  if(cached&&Date.now()-cached.at<ttl)return cached.value;
  if(!window.oneProviderReady?.(source))await window.ONEConnections?.refresh();check();
  if(!window.oneProviderReady?.(source))throw Object.assign(Error('Connecte '+(source==='youtube'?'YouTube':'Twitch')+' à ton compte ONE pour parcourir ses contenus.'),{connect:source});
  if(source==='youtube'&&typeof ytQuotaState==='function'&&ytQuotaState())throw Error('Quota YouTube atteint. Les vidéos déjà chargées restent accessibles avec « Mon flux ONE ».');
  let address;
  if(source==='youtube'){
   const params=new URLSearchParams({part:'snippet',type:'video',videoEmbeddable:'true',videoSyndicated:'true',maxResults:'24',order:'relevance',regionCode:'FR',relevanceLanguage:'fr',safeSearch:'moderate',q:query||'tendances france'});
   if(cursor)params.set('pageToken',cursor);
   address='https://www.googleapis.com/youtube/v3/search?'+params;
  }else{
   const params=new URLSearchParams({first:'24'});
   if(query){params.set('query',query);params.set('live_only','true');}else params.set('language','fr');
   if(cursor)params.set('after',cursor);
   address='https://api.twitch.tv/helix/'+(query?'search/channels':'streams')+'?'+params;
  }
  const timeout=AbortSignal.timeout(20000);
  const response=await window.oneConnectedFetch(address,{signal:signal?AbortSignal.any([signal,timeout]):timeout});
  const result=await response.json();check();
  if(!response.ok||result.ok===false){
   const message=typeof result.error==='string'?result.error:result.error?.message||result.message||'La plateforme est momentanément indisponible. Réessaie dans quelques instants.';
   if(source==='youtube'&&/quota/i.test(message)&&typeof ytSetQuotaBlocked==='function')ytSetQuotaBlocked(message);
   throw Object.assign(Error(message),{connect:response.status===409?source:undefined});
  }
  const rows=source==='youtube'?(result.items||[]).map(v=>({p:'youtube',videoId:v.id?.videoId,title:v.snippet?.title,liveBroadcastContent:v.snippet?.liveBroadcastContent,duration:v.contentDetails?.duration,creator:v.snippet?.channelTitle,thumbnail:(v.snippet?.thumbnails?.high||v.snippet?.thumbnails?.medium)?.url})):
   (result.data||[]).filter(v=>!query||v.is_live===true).map(v=>({p:'twitch',twitchChannel:v.user_login||v.broadcaster_login,title:v.title,creator:v.user_name||v.display_name,thumbnail:String(v.thumbnail_url||'').replace('{width}','640').replace('{height}','360'),tags:[v.game_name||'']}));
  const hydrated=await hydrate(unique(rows),signal);check();const value={items:hydrated,cursor:String(source==='youtube'?result.nextPageToken||'':result.pagination?.cursor||''),local:false};
  cache.set(key,{at:Date.now(),value});if(cache.size>40)cache.delete(cache.keys().next().value);
  return value;
 }
 window.ONETogetherCatalog={normalize,snapshot,browse,reset,durationLabel};
 window.addEventListener('one-account-changed',reset);
 window.addEventListener('storage',e=>{if(e.key==='one_account_token_v06')reset();});
})();
