const test=require('node:test');
const assert=require('node:assert/strict');
const {create,followed,identity,merge}=require('../ui/creator-notifications.js');
const NOW=Date.parse('2026-10-28T08:00:00Z');
const YT='UC'+'a'.repeat(22),YT2='UC'+'b'.repeat(22);
const LOGO='https://static-cdn.jtvnw.net/jtv_user_pictures/channel.png';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
function harness(existing=storage()){
 let time=NOW,account='alice',token='alice-token',ready=true;
 const w=new EventTarget(),doc=new EventTarget(),calls=[];doc.hidden=false;
 Object.assign(w,{document:doc,localStorage:existing,Date:{now:()=>time},Event,setInterval(){},oneAccountToken:()=>token,oneAccountLocal:()=>({id:account}),oneProviderReady:()=>ready});
 let handler=()=>({data:[]});
 w.oneConnectedFetch=async url=>{calls.push(url);return {ok:true,json:async()=>handler(new URL(url))};};
 const service=create(w);
 return {w,service,calls,storage:existing,time:()=>time,advance:n=>time+=n,setReady:v=>ready=v,handler:fn=>handler=fn,
  async enable(){service.setEnabled(true);await flush();},
  follows(list){existing.setItem('one_followed_creators_v18_1',JSON.stringify(list.map(c=>c.platform+':'+c.id)));existing.setItem('one_followed_creator_meta_v18_23',JSON.stringify(Object.fromEntries(list.map(c=>[c.platform+':'+c.id,c]))));},
  account(id){account=id;token=id?id+'-token':'';w.dispatchEvent(new Event('one-account-changed'));}};
}
const tw=(id='123',name='chaine')=>({platform:'twitch',id,login:name,name:'Ma chaîne',avatar:LOGO});
const stream=(id='999',uid='123',name='chaine',at=NOW-120000)=>({id,user_id:uid,user_login:name,user_name:'Ma chaîne',type:'live',started_at:new Date(at).toISOString(),title:'Un nouveau live'});
test('follow normalization keeps Twitch and YouTube, recovers missing metadata and rejects invalid identities',()=>{
 const h=harness();h.storage.setItem('one_followed_creators_v18_1',JSON.stringify(['twitch:123','twitch:nom_chaine','youtube:'+YT,'youtube:bad','tiktok:any','twitch:evil/route']));
 assert.deepEqual(followed(h.storage).map(c=>[c.platform,c.id]),[['twitch','123'],['twitch','nom_chaine'],['youtube',YT]]);
});
test('a live is recorded once, with the correct logo and URL, across refresh and reload',async()=>{
 const h=harness();h.follows([tw()]);h.handler(()=>({data:[stream()]}));await h.enable();
 const first=h.service.snapshot();assert.equal(first.unread,1);assert.equal(first.items[0].avatarUrl,LOGO);assert.equal(first.items[0].context,'https://www.twitch.tv/chaine');
 h.advance(60000);await h.service.poll();assert.equal(h.service.snapshot().items.length,1);
 const again=harness(h.storage);again.follows([tw()]);again.handler(()=>({data:[stream()]}));await again.enable();assert.equal(again.service.snapshot().items.length,1);
});
test('read and dismissed lives stay handled after refresh; the next stream gets a fresh notification',async()=>{
 const h=harness();h.follows([tw()]);let id='999';h.handler(()=>({data:[stream(id)]}));await h.enable();
 h.service.readThrough(h.time());assert.equal(h.service.snapshot().unread,0);const old=h.service.snapshot().items[0].id;h.service.dismiss(old);
 h.advance(60000);await h.service.poll();assert.equal(h.service.snapshot().items.length,0);
 id='1000';h.advance(60000);await h.service.poll();assert.equal(h.service.snapshot().unread,1);assert.notEqual(h.service.snapshot().items[0].id,old);
});
test('server and local notifications for the same broadcast merge with consistent unread/read/dismiss state',()=>{
 const l={id:'local',kind:'creator_live',channelId:'123',login:'chaine',streamId:'999',startedAt:NOW-120000,lastSeenAt:NOW,createdAt:NOW,avatarUrl:LOGO,read:false};
 const remote={id:'server',kind:'creator_live',context:'https://www.twitch.tv/chaine',createdAt:NOW-60000,read:false};
 let result=merge([remote],8,[l]);assert.equal(result.items.length,1);assert.equal(result.unread,8);assert.equal(result.items[0]._localId,'local');assert.equal(result.items[0].avatarUrl,LOGO);
 result=merge([remote],8,[{...l,read:true}]);assert.equal(result.unread,7);assert.equal(result.items[0].read,true);
 result=merge([remote],8,[{...l,dismissed:true}]);assert.equal(result.items.length,0);assert.equal(result.unread,7);
 assert.equal(merge([{...remote,streamId:'1000'}],1,[l]).items.length,2);
 assert.equal(merge([{...remote,createdAt:NOW-86400000}],1,[l]).items.length,2);
});
test('only followed live channels notify; offline, malformed and unrelated rows are ignored',async()=>{
 const h=harness();h.follows([tw()]);h.handler(()=>({data:[stream(),stream('500','456','autre'),{...stream('501'),type:''},{...stream('502'),started_at:'bad'}]}));await h.enable();assert.equal(h.service.snapshot().items.length,1);
 h.follows([]);h.w.dispatchEvent(new Event('one-followed-creators-changed'));assert.equal(h.service.snapshot().items.length,0);
});
test('requests cover all follows in batches of at most 100 and accept legacy login identifiers',async()=>{
 const h=harness();h.follows([...Array.from({length:201},(_,i)=>tw(String(1000+i),'chaine_'+i)),tw('legacy','legacy')]);await h.enable();
 const params=h.calls.map(u=>new URL(u).searchParams);assert.deepEqual(params.map(p=>p.getAll('user_id').length+p.getAll('user_login').length),[100,100,2]);assert.equal(params[2].get('user_login'),'legacy');assert(params.every(p=>p.get('first')==='100'));
});
test('no polling before settings, when hidden, disconnected, signed out or disabled',async()=>{
 const h=harness();h.follows([tw()]);await h.service.poll();assert.equal(h.calls.length,0);
 h.w.document.hidden=true;await h.enable();assert.equal(h.calls.length,0);h.w.document.hidden=false;h.setReady(false);await h.service.poll();assert.equal(h.calls.length,0);
 h.setReady(true);h.service.setEnabled(false);await h.service.poll();assert.equal(h.calls.length,0);h.account('');await h.enable();assert.equal(h.calls.length,0);
});
test('temporary API errors retain alerts, back off and cannot create a second notification for the same stream',async()=>{
 const h=harness();h.follows([tw()]);h.handler(()=>({data:[stream()]}));await h.enable();h.advance(60000);h.handler(()=>{throw Error('offline');});await h.service.poll();assert.equal(h.service.snapshot().items.length,1);
 const count=h.calls.length;h.advance(60000);await h.service.poll();assert.equal(h.calls.length,count);h.advance(60000);h.handler(()=>({data:[stream()]}));await h.service.poll();assert.equal(h.service.snapshot().items.length,1);
});
test('account changes discard in-flight responses and keep stored notifications isolated',async()=>{
 const h=harness();h.follows([tw()]);let resolve;h.handler(()=>new Promise(r=>resolve=r));h.service.setEnabled(true);await flush();h.account('bob');resolve({data:[stream()]});await flush();assert.equal(h.service.snapshot().items.length,0);
 h.handler(()=>({data:[stream()]}));await h.enable();assert.equal(h.service.snapshot().items.length,1);h.account('alice');assert.equal(h.service.snapshot().items.length,0);
});
test('unfollowing during an in-flight request cannot add a notification',async()=>{
 const h=harness();h.follows([tw()]);let resolve;h.handler(()=>new Promise(r=>resolve=r));h.service.setEnabled(true);await flush();h.follows([]);resolve({data:[stream()]});await flush();assert.equal(h.service.snapshot().items.length,0);
});
test('Twitch avatars resolve by login from notification links, are batched, and are cached',async()=>{
 const h=harness();const n={kind:'creator_live',author:'Ma chaîne',context:'https://www.twitch.tv/chaine'};h.handler(u=>{assert.equal(u.pathname,'/helix/users');assert.equal(u.searchParams.get('login'),'chaine');return {data:[{id:'123',login:'chaine',display_name:'Ma chaîne',profile_image_url:LOGO}]};});
 await h.service.enrich([n,n]);assert.equal(h.calls.length,1);assert.equal(h.service.describe(n).avatarUrl,LOGO);await h.service.enrich([n]);assert.equal(h.calls.length,1);
});
test('YouTube logos use known channel identities and ambiguous names resolve via the video',async()=>{
 const h=harness();h.follows([{platform:'youtube',id:YT,name:'Même nom',avatar:''},{platform:'youtube',id:YT2,name:'Même nom',avatar:''}]);
 const n={kind:'creator_video',author:'Même nom',context:'https://www.youtube.com/watch?v=abcdefghijk'};assert.equal(identity(n,h.service.followed()).id,'');
 h.handler(u=>u.pathname.endsWith('/videos')?{items:[{id:'abcdefghijk',snippet:{channelId:YT}}]}:{items:[{id:YT,snippet:{title:'Même nom',thumbnails:{medium:{url:'https://yt3.ggpht.com/logo.jpg'}}}}]});
 await h.service.enrich([n]);assert.equal(h.calls.length,2);assert.equal(h.service.describe(n).avatarUrl,'https://yt3.ggpht.com/logo.jpg');
});
test('legacy creator metadata supplies logos without requests; unsafe URLs and social messages do not trigger creator lookup',async()=>{
 const h=harness();h.follows([{platform:'youtube',id:YT,name:'GOTAGA',avatar:'https://yt3.ggpht.com/gotaga.jpg'}]);
 const n={kind:'creator_video',author:'GOTAGA',context:'https://www.youtube.com/watch?v=abcdefghijk'};assert.equal(h.service.describe(n).avatarUrl,'https://yt3.ggpht.com/gotaga.jpg');await h.service.enrich([n,{kind:'message',author:'GOTAGA',context:n.context}]);assert.equal(h.calls.length,0);
 assert.equal(identity({kind:'creator_live',context:'https://www.twitch.tv.attacker.test/chaine'}),null);assert.equal(h.service.describe({avatarUrl:'javascript:alert(1)'}).avatarUrl,'');
});
test('failed profile requests are throttled and account changes clear cached avatars',async()=>{
 const h=harness(),n={kind:'creator_live',context:'https://www.twitch.tv/chaine'};h.handler(()=>{throw Error('temporary');});await h.service.enrich([n]);await h.service.enrich([n]);assert.equal(h.calls.length,1);
 h.advance(300000);h.handler(()=>({data:[{id:'123',login:'chaine',profile_image_url:LOGO}]}));await h.service.enrich([n]);assert.equal(h.service.describe(n).avatarUrl,LOGO);h.account('bob');assert.equal(h.service.describe(n).avatarUrl,'');
});
test('seven-day retention, corrupt storage and cross-tab dismissal remain safe',async()=>{
 const h=harness();h.follows([tw()]);h.handler(()=>({data:[stream()]}));await h.enable();const key='one_creator_live_v1:alice';const rows=JSON.parse(h.storage.getItem(key));rows[0].dismissed=true;h.storage.setItem(key,JSON.stringify(rows));const e=new Event('storage');e.key=key;h.w.dispatchEvent(e);assert.equal(h.service.snapshot().items.length,0);
 h.advance(8*86400000);h.account('bob');h.account('alice');assert.equal(h.service.snapshot().items.length,0);
 h.storage.setItem(key,'[null,{},42]');h.w.dispatchEvent(e);assert.equal(h.service.snapshot().items.length,0);
});
test('notification panel renders channel logos and live links, updates its badge, and handles local read/dismiss without sending fake IDs to the server',async()=>{
 const fs=require('fs'),vm=require('vm'),path=require('path'),h=harness();
 class Element extends EventTarget{
  constructor(tag){super();this.tagName=tag;this.children=[];this.dataset={};this.attrs={};this.classList={add(){}};this.textContent='';}
  append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}setAttribute(k,v){this.attrs[k]=v;}
  get firstElementChild(){return this.children[0];}querySelector(){return this.heading||null;}
 }
 const toggle=new Element('button'),panel=new Element('section'),head=new Element('header');head.heading=new Element('h2');panel.append(head);panel.hidden=false;
 const walk=n=>[n,...n.children.flatMap(walk)];
 h.w.document.createElement=tag=>new Element(tag);h.w.document.createTextNode=text=>Object.assign(new Element('text'),{textContent:text});
 h.w.document.getElementById=id=>id==='oneNotificationsToggle'?toggle:id==='oneNotifications'?panel:null;
 h.w.ONEUI={avatar:data=>{const face=new Element('span');if(data.avatarUrl){const image=new Element('img');image.src=data.avatarUrl;face.append(image);}return face;}};
 h.w.ONECreatorNotifications=h.service;h.follows([tw()]);h.handler(()=>({data:[stream()]}));
 const apiCalls=[];let remote=false;
 const apiFetch=async(url,options)=>{apiCalls.push({url,method:options.method});return {ok:true,json:async()=>({ok:true,through:NOW,unread:remote?1:0,notifications:remote?[{id:'server-live',kind:'creator_live',author:'Ma chaîne',text:'Un nouveau live',context:'https://www.twitch.tv/chaine',createdAt:NOW-60000,read:false}]:[]})};};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../ui/notifications.js'),'utf8'),{window:h.w,document:h.w.document,fetch:apiFetch,ONEAudit:{uniqueById:x=>x},Event,URL,AbortSignal,setInterval(){},Date});await flush();await h.enable();await flush();
 const badge=()=>toggle.children.find(n=>n.id==='oneUnreadBadge');
 assert.equal(badge().textContent,'1');assert.equal(walk(panel).filter(n=>n.tagName==='article').length,1);assert(walk(panel).some(n=>n.tagName==='img'&&n.src===LOGO));assert(walk(panel).some(n=>n.tagName==='a'&&n.href==='https://www.twitch.tv/chaine'&&n.textContent==='Voir le live'));
 await walk(panel).find(n=>n.textContent==='Tout lire').onclick();await flush();assert.equal(badge().hidden,true);
 await walk(panel).find(n=>n.className==='hub-notification-dismiss').onclick();assert.equal(walk(panel).filter(n=>n.tagName==='article').length,0);assert(!apiCalls.some(c=>c.url.includes('local%3A')));
 remote=true;await walk(panel).find(n=>n.textContent==='↻ Actualiser').onclick();await flush();assert.equal(walk(panel).filter(n=>n.tagName==='article').length,0);assert.equal(badge().hidden,true);
 h.account('');await flush();assert.equal(walk(panel).filter(n=>n.tagName==='article').length,0);
});
