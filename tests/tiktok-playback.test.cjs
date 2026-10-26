const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const code = html.slice(html.indexOf('function v17Escape('), html.indexOf('function v17SetupObserver('));

// Minimal DOM adapter for exercising the production player lifecycle without a browser.
class Element {
  constructor(tag) {
    this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={};this.attrs={};this.parentElement=null;this.className='';
    this.classList={contains:c=>this.className.split(/\s+/).includes(c),add:(...cs)=>{this.className=[...new Set([...this.className.split(/\s+/),...cs])].join(' ').trim();},remove:(...cs)=>{this.className=this.className.split(/\s+/).filter(c=>!cs.includes(c)).join(' ');}};
    if(tag==='iframe'){this.messages=[];this.contentWindow={postMessage:(data,origin)=>this.messages.push({data,origin})};}
  }
  get isConnected(){return this.tagName==='DOCUMENT'||!!this.parentElement?.isConnected;}
  get nextElementSibling(){return this.parentElement?.children[this.parentElement.children.indexOf(this)+1]||null;}
  get previousElementSibling(){return this.parentElement?.children[this.parentElement.children.indexOf(this)-1]||null;}
  setAttribute(name,value){this.attrs[name]=String(value);if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(value);}
  getAttribute(name){return name.startsWith('data-')?this.dataset[name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]??null:this.attrs[name]??null;}
  removeAttribute(name){delete this.attrs[name];if(name.startsWith('data-'))delete this.dataset[name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())];}
  appendChild(child){child.remove();child.parentElement=this;this.children.push(child);return child;}
  remove(){if(this.parentElement){const p=this.parentElement;this.parentElement=null;p.children.splice(p.children.indexOf(this),1);}}
  replaceChildren(...nodes){for(const c of [...this.children])c.remove();for(const c of nodes)this.appendChild(c);}
  matches(selector){
    if(selector.includes(','))return selector.split(',').some(s=>this.matches(s.trim()));
    const attr=[...selector.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];
    if(!attr.every(([,k,v])=>v===undefined?this.getAttribute(k)!==null:this.getAttribute(k)===v))return false;
    selector=selector.replace(/\[[^\]]*\]/g,'');
    const classes=[...selector.matchAll(/\.([\w-]+)/g)].map(m=>m[1]);
    if(!classes.every(c=>this.classList.contains(c)))return false;
    const tag=selector.replace(/\.[\w-]+/g,'');return !tag||tag==='*'||this.tagName===tag.toUpperCase();
  }
  querySelectorAll(selector){
    const parts=selector.split(' ');if(parts.length>1)return this.querySelectorAll(parts[0]).flatMap(n=>n.querySelectorAll(parts.slice(1).join(' ')));
    return this.children.flatMap(c=>[...(c.matches(selector)?[c]:[]),...c.querySelectorAll(selector)]);
  }
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)||null;}
  scrollIntoView(){this.scrolled=true;}
}
function setup(){
  const document=new Element('document');document.hidden=false;document.createElement=tag=>new Element(tag);
  const feed=new Element('section');feed.id='vfeed';feed.className='vfeed show';document.appendChild(feed);
  document.getElementById=id=>id==='vfeed'?feed:null;
  const slides=[],items=new Map();
  for(let i=0;i<3;i++){
    const id=String(7000000000000000000n+BigInt(i));
    const slide=new Element('article');slide.className='vslide';slide.dataset={platform:'tiktok',id:'tt_ext_'+id};
    const media=new Element('div');media.className='vslideMedia';slide.appendChild(media);
    media.appendChild(new Element('img'));const button=new Element('button');button.className='vslidePlay';media.appendChild(button);
    feed.appendChild(slide);slides.push(slide);items.set(slide.dataset.id,{id:slide.dataset.id,p:'tiktok',tiktokId:id,creator:'Test',tiktokPlayable:true});
  }
  let clock=0,seq=0;const timers=new Map(),listeners=new Map(),opened=[];
  const context={document,URL,console,location:{origin:'https://one.test',href:'https://one.test/',hostname:'one.test'},
    v17ActiveId:'',v17Muted:true,v17Volume:50,v17TwitchPlayers:{},
    v17ItemById:id=>items.get(String(id)),platformName:p=>p,v1814NativeMuted:()=>true,v1814SoundAllowed:()=>true,v1814RememberSoundGesture(){},
    oneTTTrace(){},toast(){},learnFromItem(){},requestAnimationFrame:fn=>fn(),
    setTimeout:(fn,ms)=>{const id=++seq;timers.set(id,{at:clock+ms,fn});return id;},clearTimeout:id=>timers.delete(id),
    addEventListener:(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},open:url=>opened.push(url)};
  context.window=context;vm.createContext(context);vm.runInContext(code,context);
  const tick=ms=>{clock+=ms;for(const [id,t]of [...timers])if(t.at<=clock&&timers.delete(id))t.fn();};
  const message=(frame,type,value,origin='https://www.tiktok.com')=>{for(const fn of listeners.get('message')||[])fn({source:frame.contentWindow,origin,data:{'x-tiktok-player':true,type,value}});};
  const frame=slide=>slide.querySelector('iframe'),status=slide=>slide.querySelector('.oneTikTokStatus'),button=(slide,label)=>status(slide)?.querySelectorAll('button').find(b=>b.textContent===label);
  return {context,document,feed,slides,items,timers,tick,message,frame,status,button,opened};
}

test('only the active video loads; ready starts muted without locking volume',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const f=r.frame(s);r.tick(1000);
  assert.equal(r.document.querySelectorAll('iframe').length,1);
  assert.equal(new URL(f.src).searchParams.get('muted'),'0');assert.equal(new URL(f.src).searchParams.get('autoplay'),'0');
  r.message(f,'onPlayerReady');assert.deepEqual(f.messages.map(m=>m.data.type),['mute','play']);
  assert(f.messages.every(m=>m.origin==='https://www.tiktok.com'));
  r.message(f,'onStateChange',1);assert.equal(f.style.opacity,'1');assert.equal(s.dataset.ttVisualReady,'1');
});
test('a video loading longer than 4.5 seconds is retained and can recover after timeout',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const f=r.frame(s);
  r.tick(4501);assert.equal(r.frame(s),f);assert.equal(r.status(s),null);
  r.tick(10500);assert.equal(r.frame(s),f);assert.match(r.status(s).querySelector('p').textContent,/plus de temps/);
  r.message(f,'onStateChange',1);assert.equal(r.status(s),null);assert.equal(f.style.opacity,'1');
});
test('autoplay error exposes an interactive native player without a reload loop',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const old=r.frame(s);
  r.message(old,'onPlayerError',{errorCode:3002,errorType:'AUTOPLAY_ERROR'});const f=r.frame(s);
  assert.notEqual(f,old);assert.equal(f.dataset.oneManual,'1');assert.equal(new URL(f.src).searchParams.get('controls'),'1');
  assert.equal(new URL(f.src).searchParams.get('autoplay'),'0');assert.equal(f.style.opacity,'1');
  r.message(f,'onPlayerReady');assert.equal(f.messages.length,0);
  r.message(f,'onPlayerError',{errorCode:3002});assert.equal(r.frame(s),f);
  r.message(old,'onPlayerError',{errorCode:1001});assert.equal(r.frame(s),f);
  r.message(f,'onStateChange',1);assert.equal(r.status(s),null);
});
test('invalid videos show a way forward without deleting catalogue entries',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);r.message(r.frame(s),'onPlayerError',{errorCode:1001});
  assert.equal(r.frame(s),null);assert.match(r.status(s).querySelector('p').textContent,/indisponible/);assert.equal(r.items.size,3);
  r.button(s,'Vidéo suivante').onclick({stopPropagation(){}});assert.equal(r.slides[1].dataset.active,'1');assert.equal(r.document.querySelectorAll('iframe').length,1);
});
test('transient and legacy errors allow retry and recovery',()=>{
  for(const [type,value]of [['onPlayerError',{errorCode:2001}],['onPlayerError',{errorCode:3001}],['onError',3]]){
    const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const f=r.frame(s);r.message(f,'onStateChange',1);r.message(f,type,value);
    assert.equal(r.frame(s),f);assert(r.button(s,'Réessayer'));
    r.message(f,'onStateChange',1);assert.equal(r.status(s),null);
    r.message(f,type,value);r.button(s,'Réessayer').onclick({stopPropagation(){}});assert.equal(r.frame(s).dataset.oneManual,'1');
  }
});
test('foreign, stale and hidden-frame events cannot change the current player',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const f=r.frame(s);
  r.message(f,'onPlayerError',{errorCode:1001},'https://untrusted.test');assert.equal(r.frame(s),f);
  r.document.hidden=true;r.message(f,'onPlayerError',{errorCode:1001});assert.equal(r.frame(s),f);r.document.hidden=false;
  r.context.v17ActivateSlide(r.slides[1]);r.tick(20000);r.message(f,'onPlayerError',{errorCode:1001});
  assert.equal(r.status(s),null);assert(r.frame(r.slides[1]));assert.equal(r.document.querySelectorAll('iframe').length,1);
});
test('retry does not stack players and closing the feed cancels startup timers',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const f=r.frame(s);
  r.context.v17ActivateTikTok(s);assert.notEqual(r.frame(s),f);assert.equal(r.document.querySelectorAll('iframe').length,1);
  r.context.v1815StopAllPlayers();r.tick(20000);assert.equal(r.document.querySelectorAll('iframe').length,0);assert.equal(r.status(s),null);
});
test('explicit pause prevents automatic play and timeout messages',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const f=r.frame(s);s.dataset.oneUserPaused='1';
  r.message(f,'onPlayerReady');r.tick(20000);assert(!f.messages.some(m=>m.data.type==='play'));assert.equal(r.status(s),null);
});
test('external IDs resolve and malformed IDs are rejected',()=>{
  const r=setup();assert.equal(r.context.v17RawTikTokId({id:'tt_ext_123456789'}),'123456789');
  assert.equal(r.context.v17PlayerUrl({id:'tt_ext_invalid',p:'tiktok'}),'');
  const s=r.slides[0];r.items.get(s.dataset.id).tiktokId='invalid';r.context.v17ActivateSlide(s);
  assert.equal(r.frame(s),null);assert(r.button(s,'Vidéo suivante'));assert(r.button(s,'Ouvrir sur TikTok'));
});
test('swiping back creates a fresh playable frame without restoring stale errors or pause state',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const old=r.frame(s);
  r.message(old,'onPlayerError',{errorCode:3001});s.dataset.oneUserPaused='1';
  r.context.v17ActivateSlide(r.slides[1]);r.context.v17ActivateSlide(s);const f=r.frame(s);
  assert.notEqual(f,old);assert.equal(r.status(s),null);assert.equal(s.dataset.oneUserPaused,undefined);
  assert.equal(r.document.querySelectorAll('iframe').length,1);r.message(f,'onPlayerReady');
  assert.deepEqual(f.messages.map(m=>m.data.type),['mute','play']);
});
