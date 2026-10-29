const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script id="one-v79-messages-clean-js">([\s\S]*?)<\/script>/)[1];
const slice=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const PHOTO={id:'b3e12150-5853-4000-a000-675084476000',type:'photo',shareToken:'a'.repeat(40)};
const VIDEO={...PHOTO,id:'b3e12150-5853-4000-a000-675084476001',type:'video'};
class Element{
 constructor(className=''){this.className=className;this.children=[];this.dataset={};this.attrs={};this.hidden=false;this.isConnected=true;this.textContent='';this.classList={contains:c=>this.className.split(' ').includes(c),add:(...cs)=>{this.className=[...new Set([...this.className.split(' '),...cs])].join(' ').trim();},remove:(...cs)=>{this.className=this.className.split(' ').filter(c=>!cs.includes(c)).join(' ');},toggle:(c,on)=>on?this.classList.add(c):this.classList.remove(c)};}
 set innerHTML(value){if(value.includes('oneV79MediaLabel'))this.children=[new Element('oneV79MediaDot'),new Element('oneV79MediaLabel')];}
 appendChild(n){this.children.push(n);return n;}
 setAttribute(k,v){this.attrs[k]=v;}
 querySelector(selector){return this.children.find(n=>n.classList.contains(selector.slice(1)))||null;}
 querySelectorAll(){return [];}
}
function setup(stored={}){
 let session='alice',response={mine:true,opened:false,delivered:false},request=async()=>({status:response}),dialog=null;
 const calls=[],persisted=[],rows=[],statusMap=new Map(),noticeMap=new Map(),seen=new Set();
 const context={console,Date:{now:()=>100000},URL,URLSearchParams,AbortSignal,crypto:{randomUUID:()=>String(Math.random())},WeakMap,Map,Set,
  statuses:statusMap,notices:noticeMap,seenNotices:seen,notified:new Set(),delivered:new Set(),mediaCache:new Map(),
  token:()=>session,media:async(url,options)=>{calls.push({url,options});return request(url,options);},
  getCache:()=>stored,setCache(){},persistStatuses:()=>persisted.push([...statusMap]),markNoticeSeen:id=>seen.add(id),renderNotices(){},
  word:m=>m.type==='video'?'Vidéo':'Photo',sessionStorage:{setItem(){}},navigator:{},Notification:{permission:'denied'},
  document:{hidden:false,createElement:()=>new Element(),getElementById:()=>null,querySelectorAll:()=>[]},
  requestAnimationFrame:fn=>fn(),MutationObserver:class{observe(){}disconnect(){}},currentDialog:()=>dialog,mountThread(){},openShared(){},
  parse:text=>text==='photo'?PHOTO:text==='video'?VIDEO:null,
  MEDIA:'https://media.test',PEOPLE:'https://people.test',preparePhoto:async file=>file,marker:()=>'<media-marker>',threadStatus(){},syncSocial(){},
  activeId:'friend',activeName:'Ami',CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},dispatchEvent(){},toast(){},
  uploadWithProgress:async()=>({ok:true,message:{id:PHOTO.id},shareToken:PHOTO.shareToken}),fetch:async()=>({ok:true,json:async()=>({ok:true})})};
 context.window=context;
 vm.createContext(context);
 vm.runInContext(slice(' function restoreStatuses()',' const seenNotices='),context);
 vm.runInContext(slice(' async function status(',' function updateOrder('),context);
 vm.runInContext(slice(' function addNotice(',' function renderNotices('),context);
 vm.runInContext(slice(' function paintInboxMedia(',' function paintInbox('),context);
 vm.runInContext(slice(' function decorateArticle(',' window.addEventListener(\'one-thread-ready\''),context);
 vm.runInContext(slice(' const privateJobs=',' window.oneSendMediaToFriend='),context);
 function row(){const av=new Element(),sub=new Element();const value={dataset:{},querySelector:s=>s==='.avatar'?av:s==='.copy span'?sub:null};rows.push(value);return {value,av,sub};}
 function article(mine=true){const a=new Element(mine?'mine':''),p=new Element();p.textContent='photo';p.closest=()=>a;a.children=[p];return {a,p};}
 return {context,statuses:statusMap,notices:noticeMap,seen,calls,persisted,row,article,setStatus:data=>response=data,setRequest:fn=>request=fn,account:value=>session=value,
  thread(articles){dialog={querySelectorAll:()=>articles.map(x=>x.p),querySelector:()=>new Element()};return dialog;}};
}
test('unknown photo/video direction never flashes, notifies or sends a delivery receipt',()=>{
 for(const m of [PHOTO,VIDEO])for(const data of [undefined,{}, {opened:false}, {mine:null,opened:false}]){
  const h=setup(),r=h.row();if(data)h.statuses.set(m.id,{at:0,data});h.context.paintInboxMedia(r.value,{name:'Ami'},m);h.context.addNotice({name:'Ami'},m);
  assert(!r.av.classList.contains('oneV79PhotoRing'));assert(!r.av.classList.contains('oneV79VideoRing'));assert.equal(h.notices.size,0);assert.equal(h.calls.length,0);assert(!r.sub.textContent.includes('●'));
 }
});
test('sent photos and videos stay labelled as sent without a receiving indicator',()=>{
 for(const m of [PHOTO,VIDEO]){const h=setup(),r=h.row();h.context.rememberSentMedia(m);h.context.paintInboxMedia(r.value,{name:'Ami'},m);
  assert.equal(r.sub.textContent,(m.type==='video'?'Vidéo':'Photo')+' envoyée');assert.equal(r.av.className,'');assert.equal(h.notices.size,0);assert.equal(h.calls.length,0);
 }
});
test('a confirmed unopened received medium flashes and creates exactly one notice and delivery receipt',async()=>{
 for(const m of [PHOTO,VIDEO]){const h=setup(),r=h.row();h.setStatus({mine:false,opened:false,delivered:true});h.statuses.set(m.id,{at:0,data:{mine:false,opened:false}});
  h.context.paintInboxMedia(r.value,{name:'Ami'},m);h.context.paintInboxMedia(r.value,{name:'Ami'},m);await flush();
  assert(r.av.classList.contains(m.type==='video'?'oneV79VideoRing':'oneV79PhotoRing'));assert.equal(h.notices.size,1);assert.equal(h.calls.length,1);assert(h.calls[0].url.includes('/delivered-shared?'));
 }
});
test('the delayed sender response cannot cause a flash before or after it arrives',async()=>{
 const h=setup(),r=h.row();let resolve;h.setRequest(()=>new Promise(r=>resolve=r));const pending=h.context.status(PHOTO,true);
 h.context.paintInboxMedia(r.value,{name:'Ami'},PHOTO);assert.equal(r.av.className,'');assert.equal(h.notices.size,0);
 resolve({status:{mine:true,opened:false}});await pending;h.context.paintInboxMedia(r.value,{name:'Ami'},PHOTO);
 assert.equal(r.av.className,'');assert.equal(r.sub.textContent,'Photo envoyée');assert.equal(h.calls.length,1);assert.equal(h.notices.size,0);
});
test('a failed ownership lookup stays neutral and delivery cannot be forced on sent or unknown media',async()=>{
 const h=setup(),r=h.row();h.setRequest(()=>{throw Error('offline');});assert.equal(await h.context.status(PHOTO,true),null);h.context.paintInboxMedia(r.value,{name:'Ami'},PHOTO);
 await h.context.markDelivered(PHOTO);h.context.rememberSentMedia(PHOTO);await h.context.markDelivered(PHOTO);
 assert.equal(h.calls.length,1);assert.equal(h.notices.size,0);assert.equal(r.av.className,'');
});
test('opened received media clear the ring and notice; sent media clear any legacy false notice',()=>{
 const h=setup(),r=h.row();h.statuses.set(PHOTO.id,{at:0,data:{mine:false,opened:true}});h.notices.set(PHOTO.id,{mark:PHOTO});r.av.classList.add('oneV79PhotoRing');h.context.paintInboxMedia(r.value,{name:'Ami'},PHOTO);
 assert.equal(r.av.className,'');assert.equal(h.notices.size,0);assert(h.seen.has(PHOTO.id));
 h.notices.set(VIDEO.id,{mark:VIDEO});h.context.rememberSentMedia(VIDEO);assert.equal(h.notices.size,0);assert(!h.seen.has(VIDEO.id));
});
test('reload restores sent ownership and opened states while incoming unopened media are rechecked',()=>{
 const h=setup({[PHOTO.id]:{mine:true,opened:false},[VIDEO.id]:{mine:false,opened:false},opened:{mine:false,opened:true}});
 assert.equal(h.statuses.get(PHOTO.id).data.mine,true);assert.equal(h.statuses.get(PHOTO.id).at,0);assert(!h.statuses.has(VIDEO.id));assert.equal(h.statuses.get('opened').data.opened,true);
 const r=h.row();h.context.paintInboxMedia(r.value,{name:'Ami'},PHOTO);assert.equal(r.av.className,'');assert.equal(r.sub.textContent,'Photo envoyée');
});
test('opening the thread preserves known sender ownership and keeps the outgoing chip visible during refresh',async()=>{
 const h=setup(),a=h.article(true);h.context.rememberSentMedia(PHOTO);h.thread([a]);h.context.watchThread();assert(h.statuses.has(PHOTO.id));assert.equal(a.a.hidden,false);assert.equal(a.a.querySelector('.oneV79MediaChip').attrs['aria-label'],'Photo envoyée');
 const other=setup(),out=other.article(true);let resolve;other.setRequest(()=>new Promise(r=>resolve=r));other.context.decorateArticle(out.a,out.p,PHOTO);assert.equal(out.a.hidden,false);assert(out.a.querySelector('.oneV79MediaChip').classList.contains('mine'));
 resolve({status:{mine:true,opened:false}});await flush();assert.equal(out.a.hidden,false);
});
test('existing ephemeral behavior remains: opened outgoing media hide and opened received media replay only with the cache',()=>{
 const h=setup(),sent=h.article(true),received=h.article(false);h.statuses.set(PHOTO.id,{at:100000,data:{mine:true,opened:true}});h.context.decorateArticle(sent.a,sent.p,PHOTO);assert.equal(sent.a.hidden,true);
 h.statuses.set(PHOTO.id,{at:100000,data:{mine:false,opened:true}});h.context.decorateArticle(received.a,received.p,PHOTO);assert.equal(received.a.hidden,true);
 h.context.mediaCache.set(PHOTO.id,{url:'blob:replay'});h.context.decorateArticle(received.a,received.p,PHOTO);assert.equal(received.a.hidden,false);assert.equal(received.a.querySelector('.oneV79MediaChip').disabled,false);
});
test('a restored sent photo remains visible offline without an immediate retry loop or duplicate pending lookups',async()=>{
 const h=setup({[PHOTO.id]:{mine:true,opened:false}}),a=h.article(true);let reject;
 h.setRequest(()=>new Promise((_,r)=>reject=r));
 let frames=0;h.context.requestAnimationFrame=fn=>{if(++frames<=3)fn();};
 h.context.decorateArticle(a.a,a.p,PHOTO);h.context.decorateArticle(a.a,a.p,PHOTO);
 assert.equal(h.calls.length,1);assert.equal(a.a.hidden,false);
 reject(Error('offline'));await flush();
 assert.equal(h.calls.length,1);assert.equal(frames,0);assert.equal(a.a.hidden,false);assert.equal(h.statuses.get(PHOTO.id).data.mine,true);
});
test('upload records sender ownership before posting the message, including a failed or slow acknowledgment',async()=>{
 const h=setup();let resolve;h.context.fetch=()=>new Promise(r=>resolve=r);const pending=h.context.upload({type:'image/jpeg',size:10},{id:'friend'},{openConversation:false});await flush();assert.equal(h.statuses.get(PHOTO.id).data.mine,true);
 const r=h.row();h.context.paintInboxMedia(r.value,{name:'Ami'},PHOTO);assert.equal(r.av.className,'');assert.equal(h.notices.size,0);
 resolve({ok:false,status:503,json:async()=>({error:'Retry'})});assert.equal(await pending,false);assert.equal(h.statuses.get(PHOTO.id).data.mine,true);
});
test('a send acknowledgment cannot overwrite a newer opened status',async()=>{
 const h=setup();let resolve;h.context.fetch=()=>new Promise(r=>resolve=r);const pending=h.context.upload({type:'image/jpeg',size:10},{id:'friend'},{openConversation:false});await flush();h.statuses.set(PHOTO.id,{at:100000,data:{mine:true,opened:true,delivered:true}});
 resolve({ok:true,json:async()=>({ok:true})});assert.equal(await pending,true);assert.equal(h.statuses.get(PHOTO.id).data.opened,true);
});
test('status and receipt responses from a previous account cannot create receiving indicators for the next account',async()=>{
 for(const method of ['status','markDelivered','markOpened']){const h=setup();let resolve;h.setRequest(()=>new Promise(r=>resolve=r));if(method==='markDelivered')h.statuses.set(PHOTO.id,{at:0,data:{mine:false,opened:false}});const pending=h.context[method](PHOTO,true);h.account('bob');h.statuses.clear();resolve({status:{mine:false,opened:false}});await pending;assert.equal(h.statuses.size,0);assert.equal(h.persisted.length,0);}
});
