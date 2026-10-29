const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script id="one-friends-v202">([\s\S]*?)<\/script>/)[1];
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const friends={relationships:[{id:'alice',name:'Alice',status:'accepted'},{id:'bob',name:'Bob',status:'accepted'}]};
class Element extends EventTarget{
 constructor(tag){super();this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};this.className='';this.parentNode=null;this.value='';this._text='';this.style={setProperty(){}};this.scrollHeight=this.scrollTop=this.clientHeight=0;this.classList={contains:c=>this.className.split(' ').includes(c),add:(...c)=>{this.className=[...new Set([...this.className.split(' '),...c])].join(' ');},remove:(...c)=>{this.className=this.className.split(' ').filter(x=>!c.includes(x)).join(' ');},toggle:(c,on)=>on?this.classList.add(c):this.classList.remove(c)};}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 set textContent(v){this.replaceChildren();this._text=String(v);}
 get firstChild(){return this.children[0];}get lastChild(){return this.children.at(-1);}
 get isConnected(){return this.root===true||!!this.parentNode?.isConnected;}
 setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k]??null;}removeAttribute(k){delete this.attributes[k];}
 append(...nodes){for(const n of nodes){n.remove();n.parentNode=this;this.children.push(n);}}
 prepend(n){this.insertBefore(n,this.firstChild);}
 insertBefore(n,before){n.remove();n.parentNode=this;const i=this.children.indexOf(before);this.children.splice(i<0?this.children.length:i,0,n);}
 replaceChildren(...nodes){for(const n of this.children)n.parentNode=null;this.children=[];this._text='';this.append(...nodes);}
 remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(n=>n!==this);this.parentNode=null;}}
 matches(s){if(s.startsWith('#'))return this.id===s.slice(1);if(s.startsWith('.'))return this.classList.contains(s.slice(1));return this.tagName.toLowerCase()===s;}
 querySelectorAll(s){if(s.startsWith(':scope>'))return this.children.filter(n=>n.matches(s.slice(7)));const parts=s.split(' '),all=this.children.flatMap(n=>[n,...n.querySelectorAll('*')]);return all.filter(n=>{if(parts.at(-1)!=='*'&&!n.matches(parts.at(-1)))return false;let parent=n.parentNode;for(let i=parts.length-2;i>=0;i--){while(parent&&!parent.matches(parts[i]))parent=parent.parentNode;if(!parent)return false;parent=parent.parentNode;}return true;});}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 showModal(){this.open=true;this.firstPaint=this.textContent;this.firstHeading=this.querySelector('.hub-thread-heading')?.textContent;}
 close(){this.open=false;this.dispatchEvent(new Event('close'));}
 focus(){}click(){this.onclick?.();}
}
function setup(){
 let session='first-account',now=0,nextTimer=1;const timers=new Map(),calls=[];
 const document=new EventTarget();document.body=new Element('body');document.body.root=true;document.head=new Element('head');document.head.root=true;document.hidden=false;document.visibilityState='visible';document.createElement=tag=>new Element(tag);document.getElementById=id=>document.body.querySelector('#'+id);document.querySelectorAll=s=>document.body.querySelectorAll(s);
 const inbox=new Element('div');inbox.id='oneSocialInline';document.body.append(inbox);
 for(const f of friends.relationships){const row=new Element('div');row.className='oneV79Row';row.dataset.oneFriendId=f.id;row.dataset.onePeerName=f.name;inbox.append(row);}
 const w=new EventTarget();w.document=document;w.oneAccountToken=()=>session;
 const context={window:w,document,console,Event,URL,URLSearchParams,location:{search:'',pathname:'/',origin:'https://one.test'},sessionStorage:{getItem(){return null;},setItem(){}},oneAccountToken:w.oneAccountToken,
  ONEUI:{avatar:f=>{const n=new Element('span');n.textContent=f.name;n.className='avatar';return n;},api:(url,method)=>new Promise((resolve,reject)=>calls.push({url,method,resolve,reject}))},ONEAudit:{uniqueById:x=>x},
  setTimeout:(fn,delay)=>{const id=nextTimer++;timers.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id),setInterval:()=>0,clearInterval(){}};
 vm.runInNewContext(source,context);
 return {w,document,calls,timers,dialog:()=>document.body.querySelector('dialog'),open:id=>w.oneOpenFriends(id),
  advance(ms){now+=ms;for(const [id,t]of [...timers])if(t.at<=now){timers.delete(id);t.fn();}},
  account(id){session=id;w.dispatchEvent(new Event('one-account-changed'));},
  async resolve(url,value){const request=calls.find(x=>x.url===url&&!x.done);assert(request,'Expected request '+url);request.done=true;request.resolve(value);await flush();},
  async reject(url){const request=calls.find(x=>x.url===url&&!x.done);assert(request);request.done=true;request.reject(Error('Réseau indisponible'));await flush();}};
}
test('the first chat paint already has its contact and back button, without a loading page',()=>{
 const h=setup();h.open('alice');const d=h.dialog();assert.equal(d.firstHeading,'AliceAlice');assert(!d.firstPaint.includes('Chargement'));assert(d.querySelector('.friends-content').firstChild.textContent.includes('Conversations'));assert.equal(d.querySelector('textarea'),null);assert.equal(d.querySelector('.oneThreadLoading').getAttribute('aria-busy'),'true');
});
test('fast state and message responses never display the delayed loading text',async()=>{
 const h=setup();h.open('alice');await flush();await h.resolve('/friends/state',friends);const d=h.dialog();assert(d.querySelector('textarea'));assert(!d.textContent.includes('Chargement'));
 await h.resolve('/friends/alice/messages',{messages:[]});h.advance(1000);assert(d.textContent.includes('Votre conversation commence ici.'));assert(!d.textContent.includes('Chargement'));assert.equal(h.timers.size,0);
});
test('slow requests show feedback within the chat and remove it when messages arrive',async()=>{
 const h=setup();h.open('alice');await flush();h.advance(399);assert(!h.dialog().textContent.includes('Chargement'));h.advance(1);assert(h.dialog().textContent.includes('Chargement des messages…'));assert(h.dialog().querySelector('.hub-thread-heading'));
 await h.resolve('/friends/state',friends);h.advance(400);assert(h.dialog().querySelector('.friend-message-log').textContent.includes('Chargement'));await h.resolve('/friends/alice/messages',{messages:[]});assert(!h.dialog().textContent.includes('Chargement'));
});
test('back remains usable while loading and a late response cannot reopen the chat',async()=>{
 const h=setup();h.open('alice');await flush();h.dialog().querySelector('.friends-content').firstChild.click();assert.equal(h.dialog(),null);assert.equal(h.timers.size,0);await h.resolve('/friends/state',friends);h.advance(1000);assert.equal(h.dialog(),null);assert.equal(h.calls.length,1);
});
test('a state request failure keeps the header, back button and a working retry',async()=>{
 const h=setup();h.open('alice');await flush();await h.reject('/friends/state');const d=h.dialog();assert(d.querySelector('.hub-thread-heading'));assert(d.textContent.includes('Connexion interrompue'));assert.equal(h.timers.size,0);
 d.querySelector('.os202-error').querySelector('button').click();await flush();await h.resolve('/friends/state',friends);await h.resolve('/friends/alice/messages',{messages:[]});assert(d.querySelector('textarea'));assert(!d.textContent.includes('Connexion interrompue'));
});
test('switching chat during the initial request keeps the latest contact and fetches only their messages',async()=>{
 const h=setup();h.open('alice');await flush();h.open('bob');assert(h.dialog().querySelector('.hub-thread-heading').textContent.includes('Bob'));assert.equal(h.document.body.querySelectorAll('dialog').length,1);
 await h.resolve('/friends/state',friends);assert(h.calls.some(x=>x.url==='/friends/bob/messages'));assert(!h.calls.some(x=>x.url==='/friends/alice/messages'));await h.resolve('/friends/bob/messages',{messages:[]});assert.equal(h.timers.size,0);
});
test('account changes cancel pending feedback and discard previous-account responses',async()=>{
 const h=setup();h.open('alice');await flush();h.account('second-account');assert.equal(h.dialog(),null);await h.resolve('/friends/state',friends);h.advance(1000);assert.equal(h.dialog(),null);assert.equal(h.timers.size,0);
});
test('message errors stop the waiting indicator and preserve the composer and return button',async()=>{
 const h=setup();h.open('alice');await flush();await h.resolve('/friends/state',friends);h.advance(400);await h.reject('/friends/alice/messages');assert(h.dialog().textContent.includes('Réseau indisponible'));assert(!h.dialog().textContent.includes('Chargement'));assert(h.dialog().querySelector('textarea'));assert.equal(h.timers.size,0);
});
