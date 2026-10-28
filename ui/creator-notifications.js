/* Creator alerts while ONE is open. Background push remains owned by the server. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ONECreatorNotifications=api.create(root);
})(typeof window==='object'?window:null,function(){
 'use strict';
 const FOLLOW_KEY='one_followed_creators_v18_1',META_KEY='one_followed_creator_meta_v18_23';
 const DAY=86400000,KEEP=7*DAY,POLL=60000,MAX=200;
 const https=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:'';}catch{return '';}};
 const login=value=>/^[a-z0-9_]{1,25}$/i.test(String(value||''))?String(value).toLowerCase():'';
 const numeric=value=>/^\d+$/.test(String(value||''))?String(value):'';
 const channelId=value=>/^UC[\w-]{22}$/.test(String(value||''))?String(value):'';
 const json=(storage,key,fallback)=>{try{return JSON.parse(storage.getItem(key))??fallback;}catch{return fallback;}};
 function linkInfo(value){
  try{const u=new URL(value);if(u.protocol!=='https:')return {};
   if(['www.twitch.tv','twitch.tv'].includes(u.hostname)){const name=u.pathname.split('/').filter(Boolean);return name.length===1?{platform:'twitch',login:login(name[0])}:{};}
   if(['www.youtube.com','youtube.com','youtu.be'].includes(u.hostname)){const parts=u.pathname.split('/').filter(Boolean),video=u.hostname==='youtu.be'?parts[0]:parts[0]==='watch'?u.searchParams.get('v'):['shorts','live'].includes(parts[0])?parts[1]:'';return {platform:'youtube',id:parts[0]==='channel'?channelId(parts[1]):'',video:/^[\w-]{11}$/.test(video||'')?video:''};}
  }catch{}return {};
 }
 function followed(storage){
  const keys=json(storage,FOLLOW_KEY,[]),meta=json(storage,META_KEY,{}),out=[],seen=new Set();
  if(!Array.isArray(keys)||!meta||typeof meta!=='object')return out;
  for(const key of keys){if(typeof key!=='string')continue;const cut=key.indexOf(':'),platform=key.slice(0,cut),raw=key.slice(cut+1),m=meta[key]||{};
   if(!['twitch','youtube'].includes(platform))continue;
   const id=platform==='twitch'?numeric(m.id||raw):channelId(m.id||raw),name=platform==='twitch'?login(m.login||linkInfo(m.url).login||(!id?raw:'')):'';
   if(!id&&!name)continue;const identity=platform+':'+(id||name);if(seen.has(identity))continue;seen.add(identity);
   out.push({platform,id:id||name,login:name,name:String(m.name||name||id),avatar:https(m.avatar||m.avatarUrl),url:platform==='twitch'&&name?'https://www.twitch.tv/'+name:platform==='youtube'?'https://www.youtube.com/channel/'+id:'',description:String(m.description||'')});
  }return out;
 }
 function identity(n,creators=[]){
  if(!String(n.kind||'').startsWith('creator_'))return null;
  const link=linkInfo(n.context),platform=link.platform||n.platform;
  if(!['twitch','youtube'].includes(platform))return null;
  const id=platform==='twitch'?numeric(n.channelId||n.broadcasterId):channelId(n.channelId||link.id);
  const name=platform==='twitch'?login(n.login||link.login):'';
  let match=creators.find(c=>c.platform===platform&&((id&&c.id===id)||(name&&c.login===name)));
  // Older YouTube notifications contain only the channel's display name.
  if(!match&&platform==='youtube'&&!id){const same=creators.filter(c=>c.platform===platform&&c.name===n.author);if(same.length===1)match=same[0];}
  return {platform,id:id||match?.id||'',login:name||match?.login||'',video:link.video||'',avatar:https(n.avatarUrl||n.creatorAvatar)||match?.avatar||''};
 }
 function matchesLive(remote,local){
  if(remote.kind!=='creator_live')return false;const r=identity(remote);
  if(!r||r.platform!=='twitch'||!((r.id&&r.id===local.channelId)||(r.login&&r.login===local.login)))return false;
  if(remote.streamId)return String(remote.streamId)===local.streamId;
  const at=Number(remote.createdAt);return at>=local.startedAt-1000&&at<=local.lastSeenAt+POLL;
 }
 function merge(remote,unread,local){
  const matched=new Set(),items=[];let count=Math.max(0,Number(unread)||0);
  for(const n of remote){const l=local.find(x=>matchesLive(n,x));if(!l){items.push(n);continue;}matched.add(l.id);
   if(l.dismissed){if(!n.read)count--;continue;}
   if(l.read&&!n.read)count--;
   items.push({...n,read:!!n.read||l.read,avatarUrl:n.avatarUrl||l.avatarUrl,_localId:l.id});
  }
  for(const n of local){if(matched.has(n.id)||n.dismissed)continue;items.push({...n,_local:true});if(!n.read)count++;}
  items.sort((a,b)=>Number(b.createdAt)-Number(a.createdAt));return {items,unread:Math.max(0,count)};
 }
 function create(w){
  let owner='',generation=0,enabled=false,records=[],busy=false,lastPoll=0,failures=0;
  const profiles=new Map(),videos=new Map(),attempts=new Map(),pending=new Set();
  const now=()=>w.Date?.now?.()??Date.now();
  const account=()=>w.oneAccountToken?.()?String(w.oneAccountLocal?.()?.id||''):'';
  const key=()=> 'one_creator_live_v1:'+owner;
  const emit=()=>w.dispatchEvent(new w.Event('one-creator-notifications-changed'));
  function restore(){records=owner?json(w.localStorage,key(),[]):[];
   if(!Array.isArray(records))records=[];records=records.filter(n=>n?.kind==='creator_live'&&n._local===true&&typeof n.id==='string'&&numeric(n.channelId)&&numeric(n.streamId)&&login(n.login)&&Number.isFinite(n.startedAt)&&Number.isFinite(n.lastSeenAt)&&Number.isFinite(n.createdAt)&&now()-n.lastSeenAt<KEEP).slice(0,MAX);
  }
  function scope(){const next=account();if(next===owner)return;owner=next;generation++;enabled=false;busy=false;lastPoll=0;failures=0;profiles.clear();videos.clear();attempts.clear();pending.clear();restore();}
  function save(){records=records.filter(n=>now()-n.lastSeenAt<KEEP).sort((a,b)=>b.createdAt-a.createdAt).slice(0,MAX);if(owner)try{w.localStorage.setItem(key(),JSON.stringify(records));}catch{}emit();}
  const valid=(g,token)=>{scope();return g===generation&&token===w.oneAccountToken?.();};
  function creators(){return followed(w.localStorage).map(c=>{const p=profiles.get(c.platform+':'+c.id)||profiles.get(c.platform+':'+c.login);return p?{...c,id:p.id,login:p.login||c.login,avatar:p.avatar||c.avatar,name:p.name||c.name,url:c.platform==='twitch'?'https://www.twitch.tv/'+p.login:c.url}:c;});}
  function relevant(){const list=creators().filter(c=>c.platform==='twitch');return records.filter(n=>list.some(c=>c.id===n.channelId||c.login===n.login||c.id===n.login));}
  function putProfile(platform,p){const id=platform==='twitch'?numeric(p.id):channelId(p.id),avatar=https(platform==='twitch'?p.profile_image_url:(p.snippet?.thumbnails?.medium||p.snippet?.thumbnails?.default)?.url);if(!id)return;
   const value={id,login:platform==='twitch'?login(p.login):'',name:platform==='twitch'?p.display_name:p.snippet?.title,avatar};profiles.set(platform+':'+id,value);if(value.login)profiles.set(platform+':'+value.login,value);
  }
  async function get(url){const r=await w.oneConnectedFetch(url);if(!r.ok)throw Error('Créateurs momentanément indisponibles.');return r.json();}
  async function poll(force=false){scope();if(!owner||!enabled||w.document.hidden||!w.oneProviderReady?.('twitch')||busy||now()-lastPoll<(force?10000:Math.min(5*POLL,POLL*2**failures)))return;
   const list=creators().filter(c=>c.platform==='twitch');if(!list.length)return;
   busy=true;lastPoll=now();const g=generation,token=w.oneAccountToken?.();let changed=false,failed=false;
   try{for(let offset=0;offset<list.length;offset+=100){
    const batch=list.slice(offset,offset+100),params=new URLSearchParams({first:'100'});for(const c of batch)params.append(numeric(c.id)?'user_id':'user_login',numeric(c.id)||c.login||c.id);
    let d;try{d=await get('https://api.twitch.tv/helix/streams?'+params);}catch{failed=true;continue;}if(!valid(g,token)||!enabled)return;if(!Array.isArray(d.data)){failed=true;continue;}
    for(const stream of d.data){const id=numeric(stream.id),uid=numeric(stream.user_id),name=login(stream.user_login),start=Date.parse(stream.started_at),current=creators().find(c=>c.platform==='twitch'&&(c.id===uid||c.login===name||c.id===name));
     if(!id||!uid||!name||!current||stream.type!=='live'||!Number.isFinite(start)||start>now()+POLL)continue;
     const notificationId='local:creator_live:twitch:'+uid+':'+id,existing=records.find(n=>n.id===notificationId);
     if(existing){existing.lastSeenAt=now();continue;}
     records.push({id:notificationId,kind:'creator_live',author:String(stream.user_name||current.name||name),text:String(stream.title||'Le live vient de commencer.'),context:'https://www.twitch.tv/'+name,platform:'twitch',channelId:uid,login:name,streamId:id,avatarUrl:current.avatar,startedAt:start,lastSeenAt:now(),createdAt:now(),read:false,dismissed:false,_local:true});changed=true;
    }
   }if(!valid(g,token))return;failures=failed?Math.min(3,failures+1):0;save();if(changed)void enrich(records);
   }finally{if(g===generation)busy=false;}
  }
  function describe(n){scope();const info=identity(n,creators());if(!info)return {avatarUrl:https(n.avatarUrl)};
   const id=info.id||videos.get(info.video)||'',profile=profiles.get(info.platform+':'+(id||info.login));return {...info,id,avatarUrl:https(n.avatarUrl)||profile?.avatar||info.avatar||''};
  }
  async function enrich(notifications){scope();if(!owner||w.document.hidden||!w.oneConnectedFetch)return;const g=generation,token=w.oneAccountToken?.(),todo={twitch:new Map(),youtube:new Map(),videos:new Map()};
   for(const n of notifications){const info=describe(n);if(!info.platform||info.avatarUrl||!w.oneProviderReady?.(info.platform))continue;const kind=info.platform==='youtube'&&!info.id&&info.video?'videos':info.platform,value=kind==='videos'?info.video:info.id||info.login;if(!value)continue;const k=kind+':'+value;if(pending.has(k)||now()-(attempts.get(k)||0)<300000)continue;todo[kind].set(value,info);}
   let changed=false;
   for(const kind of ['videos','twitch','youtube']){const entries=[...todo[kind]],size=kind==='twitch'?100:50;for(let offset=0;offset<entries.length;offset+=size){const batch=entries.slice(offset,offset+size),keys=batch.map(([v])=>kind+':'+v);keys.forEach(k=>{pending.add(k);attempts.set(k,now());});
    try{let url;if(kind==='twitch'){const params=new URLSearchParams();for(const [v] of batch)params.append(numeric(v)?'id':'login',v);url='https://api.twitch.tv/helix/users?'+params;}else url='https://www.googleapis.com/youtube/v3/'+(kind==='videos'?'videos':'channels')+'?part=snippet&id='+encodeURIComponent(batch.map(([v])=>v).join(','));
     const d=await get(url);if(!valid(g,token))return;
     for(const p of kind==='twitch'?d.data||[]:d.items||[]){if(kind==='videos'){const id=channelId(p.snippet?.channelId);if(id){videos.set(p.id,id);todo.youtube.set(id,{});}}else putProfile(kind,p);changed=true;}
    }catch{}finally{if(g===generation)keys.forEach(k=>pending.delete(k));}
   }}if(valid(g,token)&&changed)emit();
  }
  const service={
   poll,enrich,describe,followed:()=>{scope();return creators();},
   snapshot(remote=[],unread=0){scope();const state=merge(remote,unread,relevant());state.items=state.items.map(n=>({...n,avatarUrl:describe(n).avatarUrl}));return state;},
   setEnabled(value){scope();enabled=value===true;if(enabled)void poll();},
   dismiss(id){scope();const n=records.find(x=>x.id===id);if(n){n.dismissed=true;save();}},
   readThrough(at){scope();for(const n of records)if(n.createdAt<=at)n.read=true;save();}
  };
  w.addEventListener('one-account-changed',()=>{scope();emit();});
  w.addEventListener('one-followed-creators-changed',()=>{scope();emit();void poll(true);});
  w.addEventListener('storage',e=>{scope();if(e.key===key()){restore();emit();}else if([FOLLOW_KEY,META_KEY].includes(e.key)){emit();void poll(true);}});
  w.document.addEventListener('visibilitychange',()=>{if(!w.document.hidden)void poll();});
  w.setInterval(()=>void poll(),POLL);scope();return service;
 }
 return {followed,identity,matchesLive,merge,create};
});
