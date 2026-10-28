const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const code = html.slice(html.indexOf('function v17Escape('), html.indexOf('function v17SetupObserver('));
const tapStart=html.indexOf(' function attach(){document.querySelectorAll(\'.vslide[data-platform="tiktok"]');
const tapCode=html.slice(tapStart,html.indexOf(" new MutationObserver(oneFrameTask(attach)).observe(document.getElementById('vfeed')",tapStart));

// Minimal DOM adapter for exercising the production player lifecycle without a browser.
class Element {
  constructor(tag) {
    this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={};this.attrs={};this.parentElement=null;this.className='';
    this.classList={contains:c=>this.className.split(/\s+/).includes(c),add:(...cs)=>{this.className=[...new Set([...this.className.split(/\s+/),...cs])].join(' ').trim();},remove:(...cs)=>{this.className=this.className.split(/\s+/).filter(c=>!cs.includes(c)).join(' ');}};
    if(tag==='iframe'){this.messages=[];this.contentWindow={postMessage:(data,origin)=>this.messages.push({data,origin})};}
  }
  get isConnected(){return this.tagName==='DOCUMENT'||!!this.parentElement?.isConnected;}
  get src(){return this._src;}
  set src(value){this._src=value;this.srcWrites=(this.srcWrites||0)+1;}
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
    if(selector.includes(','))return [...new Set(selector.split(',').flatMap(s=>this.querySelectorAll(s.trim())))];
    const parts=selector.split(' ');if(parts.length>1)return this.querySelectorAll(parts[0]).flatMap(n=>n.querySelectorAll(parts.slice(1).join(' ')));
    return this.children.flatMap(c=>[...(c.matches(selector)?[c]:[]),...c.querySelectorAll(selector)]);
  }
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)||null;}
  scrollIntoView(){this.scrolled=true;}
  select(){this.selected=true;}
  addEventListener(type,fn){(this.handlers??={})[type]=fn;}
}
function setup(count=3){
  const document=new Element('document');document.hidden=false;document.createElement=tag=>new Element(tag);
  const feed=new Element('section');feed.id='vfeed';feed.className='vfeed show';document.appendChild(feed);
  document.getElementById=id=>id==='vfeed'?feed:null;
  const slides=[],items=new Map();
  for(let i=0;i<count;i++){
    const id=String(7000000000000000000n+BigInt(i));
    const slide=new Element('article');slide.className='vslide';slide.dataset={platform:'tiktok',id:'tt_ext_'+id};
    const media=new Element('div');media.className='vslideMedia';slide.appendChild(media);
    media.appendChild(new Element('img'));const button=new Element('button');button.className='vslidePlay';media.appendChild(button);
    feed.appendChild(slide);slides.push(slide);items.set(slide.dataset.id,{id:slide.dataset.id,p:'tiktok',tiktokId:id,creator:'Test',tiktokPlayable:true});
  }
  let clock=0,seq=0;const timers=new Map(),listeners=new Map(),opened=[];
  const context={document,URL,console,Date:{now:()=>clock},location:{origin:'https://one.test',href:'https://one.test/',hostname:'one.test'},
    v17ActiveId:'',v17Muted:true,v17Volume:50,v17TwitchPlayers:{},
    v17ItemById:id=>items.get(String(id)),platformName:p=>p,v1814NativeMuted:()=>true,v1814SoundAllowed:()=>true,v1814RememberSoundGesture(){},
    oneTTTrace(){},toast(){},learnFromItem(){},requestAnimationFrame:fn=>fn(),
    setTimeout:(fn,ms)=>{const id=++seq;timers.set(id,{at:clock+ms,fn});return id;},clearTimeout:id=>timers.delete(id),
    addEventListener:(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},open:url=>opened.push(url)};
  context.window=context;vm.createContext(context);vm.runInContext(code,context);vm.runInContext(tapCode,context);
  const tick=ms=>{clock+=ms;for(const [id,t]of [...timers])if(t.at<=clock&&timers.delete(id))t.fn();};
  const message=(frame,type,value,origin='https://www.tiktok.com')=>{for(const fn of listeners.get('message')||[])fn({source:frame.contentWindow,origin,data:{'x-tiktok-player':true,type,value}});};
  const playing=frame=>{message(frame,'onStateChange',1);message(frame,'onCurrentTime',{currentTime:0});message(frame,'onCurrentTime',{currentTime:.5});};
  const frame=slide=>slide.querySelector('iframe'),status=slide=>slide.querySelector('.oneTikTokStatus'),button=(slide,label)=>status(slide)?.querySelectorAll('button').find(b=>b.textContent===label);
  return {context,document,feed,slides,items,timers,tick,message,playing,frame,status,button,opened};
}

test('startup preview has a bounded lifetime even if TikTok never emits ready',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const f=r.frame(s);r.tick(1000);
  assert.equal(r.document.querySelectorAll('iframe').length,3);
  assert.equal(new URL(f.src).searchParams.get('muted'),'0');assert.equal(new URL(f.src).searchParams.get('autoplay'),'1');
  for(const key of ['controls','play_button','progress_bar','volume_control','fullscreen_button'])assert.equal(new URL(f.src).searchParams.get(key),'1');
  assert.equal(f.style.opacity,'0');assert.equal(s.querySelector('img').style.opacity,'1');assert.equal(s.dataset.ttNativeInput,'0');
  r.tick(500);assert.equal(f.style.opacity,'1');assert.equal(f.style.pointerEvents,'auto');assert.equal(s.querySelector('img').style.opacity,'0');
  assert.equal(s.dataset.ttManual,'1');assert.equal(s.dataset.ttControlsReady,'1');assert.equal(s.dataset.ttNativeInput,'1');assert.equal(s.dataset.ttVisualReady,'0');
  r.message(f,'onPlayerReady');assert.equal(f.messages.length,0);
  r.message(f,'onStateChange',1);assert.equal(f.style.opacity,'1');assert.equal(s.dataset.ttVisualReady,'0');
  r.playing(f);assert.equal(s.dataset.ttVisualReady,'1');
});
test('a video loading longer than 4.5 seconds is retained and can recover after timeout',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const f=r.frame(s);
  r.tick(4501);assert.equal(r.frame(s),f);assert.equal(r.status(s),null);
  r.tick(10500);assert.equal(r.frame(s),f);assert.match(r.status(s).querySelector('p').textContent,/plus de temps/);
  r.playing(f);assert.equal(r.status(s),null);assert.equal(f.style.opacity,'1');
});
test('autoplay refusal leaves the same native player ready for a direct tap',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const old=r.frame(s);
  r.message(old,'onPlayerError',{errorCode:3002,errorType:'AUTOPLAY_ERROR'});const f=r.frame(s);
  assert.equal(f,old);assert.equal(f.dataset.oneManual,'1');assert.equal(new URL(f.src).searchParams.get('controls'),'1');
  assert.equal(new URL(f.src).searchParams.get('autoplay'),'1');assert.equal(f.style.opacity,'1');
  r.message(f,'onPlayerReady');assert.equal(f.messages.length,0);
  r.message(f,'onPlayerError',{errorCode:3002});assert.equal(r.frame(s),f);
  r.playing(f);assert.equal(r.status(s),null);
});
test('invalid videos show a way forward without deleting catalogue entries',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);r.message(r.frame(s),'onPlayerError',{errorCode:1001});
  assert.equal(r.frame(s),null);assert.match(r.status(s).querySelector('p').textContent,/indisponible/);assert.equal(r.items.size,3);
  r.button(s,'Vidéo suivante').onclick({stopPropagation(){}});assert.equal(r.slides[1].dataset.active,'1');assert.equal(r.document.querySelectorAll('iframe').length,2);
});
test('transient and legacy errors allow retry and recovery',()=>{
  for(const [type,value]of [['onPlayerError',{errorCode:2001}],['onPlayerError',{errorCode:3001}],['onError',3]]){
    const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const f=r.frame(s);r.message(f,'onStateChange',1);r.message(f,type,value);
    assert.equal(r.frame(s),f);assert(r.button(s,'Réessayer'));
    r.playing(f);assert.equal(r.status(s),null);
    r.message(f,type,value);r.button(s,'Réessayer').onclick({stopPropagation(){}});assert.equal(r.frame(s).dataset.oneManual,'1');
  }
});
test('foreign, stale and hidden-frame events cannot change the current player',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const f=r.frame(s);
  r.message(f,'onPlayerError',{errorCode:1001},'https://untrusted.test');assert.equal(r.frame(s),f);
  r.document.hidden=true;r.message(f,'onPlayerError',{errorCode:1001});assert.equal(r.frame(s),f);r.document.hidden=false;
  r.context.v17ActivateSlide(r.slides[1]);r.tick(20000);r.message(f,'onPlayerError',{errorCode:1001});
  assert.equal(r.status(s),null);assert(r.frame(r.slides[1]));assert.equal(r.document.querySelectorAll('iframe').length,2);
});
test('retry does not stack players and closing the feed cancels startup timers',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const f=r.frame(s);
  r.context.v17ActivateTikTok(s);assert.notEqual(r.frame(s),f);assert.equal(r.document.querySelectorAll('iframe').length,3);
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
test('returning to a failed player reloads it without restoring stale errors or pause state',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const old=r.frame(s);
  r.message(old,'onPlayerError',{errorCode:3001});s.dataset.oneUserPaused='1';
  r.context.v17ActivateSlide(r.slides[1]);r.context.v17ActivateSlide(s);const f=r.frame(s);
  assert.notEqual(f,old);assert.equal(r.status(s),null);assert.equal(s.dataset.oneUserPaused,undefined);
  assert.equal(r.document.querySelectorAll('iframe').length,3);r.message(f,'onPlayerReady');
  assert.equal(f.messages.length,0);assert.equal(s.dataset.ttManual,'1');assert.equal(f.style.opacity,'1');
});
test('ready or playback ends the startup preview immediately without a fixed delay',()=>{
  for(const event of ['onPlayerReady','onStateChange']){
    const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const f=r.frame(s);
    r.tick(100);r.message(f,event,event==='onStateChange'?1:undefined);assert.equal(f.style.opacity,'1');
    assert.equal(s.dataset.ttNativeInput,'1');
    r.tick(1500);assert.equal(s.dataset.ttNativeInput,'1');
    r.playing(f);assert.equal(s.dataset.ttNativeInput,'0');
  }
});
test('a tap during the preview exposes native playback without sending an ignored play command',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);r.context.attach();const f=r.frame(s),tap=s.querySelector('.oneTapPlayback');
  tap.onclick({preventDefault(){},stopPropagation(){}});
  assert.equal(f.style.opacity,'1');assert.equal(s.dataset.ttNativeInput,'1');assert.equal(f.messages.length,0);
});
test('the swipe surface ignores drag clicks and allows deliberate pause and resume after playback',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);r.context.attach();const f=r.frame(s),tap=s.querySelector('.oneTapPlayback');
  r.playing(f);assert.equal(s.dataset.ttNativeInput,'0');
  tap.handlers.pointerdown({clientX:100,clientY:300});tap.handlers.pointermove({clientX:100,clientY:100});
  tap.onclick({preventDefault(){},stopPropagation(){}});assert.equal(f.messages.length,0);
  tap.handlers.pointerdown({clientX:100,clientY:300});tap.onclick({preventDefault(){},stopPropagation(){}});
  assert.equal(f.messages.at(-1).data.type,'pause');assert.equal(tap.getAttribute('aria-pressed'),'true');
  r.message(f,'onStateChange',2);r.context.v17SendTikTok(f,'play');assert.equal(f.messages.at(-1).data.type,'pause');
  tap.onclick({preventDefault(){},stopPropagation(){}});assert.equal(f.messages.at(-1).data.type,'play');
  assert.equal(f.messages.at(-1).origin,'https://www.tiktok.com');assert.equal(tap.getAttribute('aria-pressed'),'false');
  r.message(f,'onPlayerError',{errorCode:3002});assert.equal(s.dataset.ttNativeInput,'1');
  r.playing(f);assert.equal(s.dataset.ttNativeInput,'0');
});
test('a rapid swipe cancels the previous preview deadline without revealing the next frame early',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);r.tick(1000);r.context.v17StepSlide(s,1);
  const next=r.slides[1],f=r.frame(next);r.tick(500);assert.equal(f.style.opacity,'0');
  r.tick(1000);assert.equal(f.style.opacity,'1');assert.equal(r.frame(s).dataset.onePreload,'1');assert.equal(r.frame(s).style.opacity,'0');
});
test('expired poster images are hidden while the native player remains recoverable',()=>{
  const r=setup(),s=r.slides[0],img=s.querySelector('img');img.complete=true;img.naturalWidth=0;
  r.context.v17ActivateSlide(s);assert.equal(img.style.visibility,'hidden');r.tick(1500);assert.equal(r.frame(s).style.opacity,'1');
});
test('native player navigation works without scrolling inside the cross-origin iframe',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const first=r.frame(s);
  r.context.v17StepSlide(s,-1);assert.equal(r.frame(s),first);
  r.context.v17StepSlide(s,1);assert.equal(r.slides[1].dataset.active,'1');assert.equal(r.slides[1].scrolled,true);
  assert.equal(first.isConnected,true);assert.equal(r.document.querySelectorAll('iframe').length,3);
  r.context.v17StepSlide(r.slides[1],-1);assert.equal(s.dataset.active,'1');assert.equal(r.frame(s),first);
  r.context.v17StepSlide(r.slides[2],1);assert.equal(s.dataset.active,'1');
});
test('preloading keeps exactly one previous and two next players around the active video',()=>{
  const r=setup(6);r.context.v17ActivateSlide(r.slides[2]);
  assert.deepEqual(r.slides.map((s,i)=>r.frame(s)?i:null).filter(i=>i!==null),[1,2,3,4]);
  for(const i of [1,3,4]){
    const f=r.frame(r.slides[i]);assert.equal(f.dataset.onePreload,'1');assert.equal(f.style.pointerEvents,'none');
    assert.equal(f.getAttribute('aria-hidden'),'true');assert.equal(new URL(f.src).searchParams.get('muted'),'0');
    assert.equal(f.messages.length,0);
  }
});
test('background players are muted and paused on ready or unexpected playback, never commanded to play',()=>{
  const r=setup(6);r.context.v17ActivateSlide(r.slides[2]);const f=r.frame(r.slides[3]);
  r.message(f,'onPlayerReady');assert.equal(f.dataset.oneReady,'1');
  r.message(f,'onStateChange',1);r.message(f,'onCurrentTime',{currentTime:.4});
  r.context.v17SendTikTok(f,'play',undefined,true);r.context.v17SendTikTok(f,'unMute',undefined,true);
  assert.deepEqual(f.messages.map(m=>m.data.type),['mute','pause','mute','pause','mute','pause']);
  assert.equal(r.status(r.slides[3]),null);
});
test('a ready preload keeps its native picture through activation and backward navigation',()=>{
  const r=setup(6),s=r.slides[3];r.context.v17ActivateSlide(r.slides[2]);const f=r.frame(s),img=s.querySelector('img');
  assert.equal(f.style.opacity,'0');r.message(f,'onPlayerReady');
  assert.equal(f.style.opacity,'1');assert.equal(img.style.opacity,'0');assert.equal(s.dataset.ttControlsReady,'1');
  assert.equal(f.style.pointerEvents,'none');assert.equal(f.getAttribute('aria-hidden'),'true');
  assert.deepEqual(f.messages.map(m=>m.data.type),['mute','pause']);
  r.context.v17ActivateSlide(s);r.playing(f);
  assert.equal(f.style.opacity,'1');assert.equal(img.style.opacity,'0');assert.equal(f.srcWrites,1);
  r.context.v17ActivateSlide(r.slides[4]);
  assert.equal(r.frame(s),f);assert.equal(f.style.opacity,'1');assert.equal(img.style.opacity,'0');assert.equal(s.dataset.ttControlsReady,'1');
  assert.equal(f.style.pointerEvents,'none');assert.equal(f.getAttribute('aria-hidden'),'true');
  r.context.v17ActivateSlide(s);
  assert.equal(r.frame(s),f);assert.equal(f.style.opacity,'1');assert.equal(img.style.opacity,'0');assert.equal(f.srcWrites,1);
});
test('a ready next player is promoted without changing its iframe or URL and resumes only once',()=>{
  const r=setup(6);r.context.v17ActivateSlide(r.slides[2]);
  const prev=r.frame(r.slides[1]),f=r.frame(r.slides[3]),next=r.frame(r.slides[4]);
  r.message(f,'onPlayerReady');const src=f.src;
  r.context.v17ActivateSlide(r.slides[3]);
  assert.equal(r.frame(r.slides[3]),f);assert.equal(f.src,src);assert.equal(f.srcWrites,1);
  assert.equal(f.style.opacity,'1');assert.equal(f.style.pointerEvents,'auto');assert.equal(f.getAttribute('aria-hidden'),null);
  assert.deepEqual(r.slides.map((s,i)=>r.frame(s)?i:null).filter(i=>i!==null),[2,3,4,5]);
  assert.equal(prev.isConnected,false);assert.equal(r.frame(r.slides[4]),next);
  r.message(f,'onPlayerReady');f.onload();assert.equal(f.messages.filter(m=>m.data.type==='play').length,1);
});
test('promotion before ready waits for the same player without leaving its native controls hidden',()=>{
  const r=setup(6);r.context.v17ActivateSlide(r.slides[2]);const s=r.slides[3],f=r.frame(s);
  r.context.v17ActivateSlide(s);assert.equal(r.frame(s),f);assert.equal(f.messages.filter(m=>m.data.type==='play').length,0);
  r.tick(1500);assert.equal(f.style.opacity,'1');assert.equal(s.dataset.ttNativeInput,'1');
  r.message(f,'onPlayerReady');assert.equal(f.messages.filter(m=>m.data.type==='play').length,1);
  r.playing(f);assert.equal(s.dataset.ttNativeInput,'0');assert.equal(f.srcWrites,1);
});
test('returning to the previous healthy video retains the player and restores its known sound choice',()=>{
  const r=setup(6),s=r.slides[2];r.context.v17ActivateSlide(s);const f=r.frame(s);
  r.message(f,'onPlayerReady');r.playing(f);r.message(f,'onMute',false);
  r.context.v17ActivateSlide(r.slides[3]);assert.equal(r.frame(s),f);assert.equal(f.dataset.onePreload,'1');
  r.message(f,'onMute',true);assert.equal(f.dataset.oneUserMuted,'0');
  r.context.v17ActivateSlide(s);r.playing(f);
  assert.equal(r.frame(s),f);assert.equal(f.srcWrites,1);assert.equal(f.messages.at(-1).data.type,'unMute');
});
test('rapid forward/backward navigation stays bounded and leaving the feed releases every preload',()=>{
  const r=setup(8);
  for(const i of [0,1,2,5,6,3,2,1]){
    r.context.v17ActivateSlide(r.slides[i]);assert(r.document.querySelectorAll('iframe').length<=4);
    assert.deepEqual(r.slides.map((s,j)=>r.frame(s)?j:null).filter(j=>j!==null),[i-1,i,i+1,i+2].filter(j=>j>=0&&j<r.slides.length));
  }
  const old=[...r.document.querySelectorAll('iframe')];r.document.hidden=true;r.context.v1815StopAllPlayers(null,true);r.tick(20000);
  for(const f of old)r.message(f,'onPlayerReady');
  assert.equal(r.document.querySelectorAll('iframe').length,0);assert.equal(r.timers.size,0);
});
test('an unavailable preloaded video is skipped on activation and is not repeatedly prefetched',()=>{
  const r=setup(6);r.context.v17ActivateSlide(r.slides[2]);const s=r.slides[3],f=r.frame(s);
  r.message(f,'onPlayerError',{errorCode:1001});assert.equal(r.status(s),null);
  r.context.v17ActivateSlide(s);assert.equal(r.frame(s),null);assert.equal(r.status(s),null);assert.equal(r.slides[4].dataset.active,'1');
  r.context.v17ActivateSlide(r.slides[4]);assert.equal(r.frame(s),null);assert.equal(r.items.size,6);
});

test('playing followed by buffering without time progress still exposes recovery',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);const f=r.frame(s);
  r.message(f,'onPlayerReady');r.message(f,'onStateChange',1);r.message(f,'onStateChange',3);
  r.tick(15001);
  assert(r.button(s,'Réessayer'),'a playing notification must not cancel the startup deadline');
  assert.equal(r.frame(s),f);assert.equal(s.dataset.ttNativeInput,'1');
});
test('a cached timestamp repeated after a swipe cannot confirm playback',()=>{
  const r=setup(),s=r.slides[1];r.context.v17ActivateSlide(r.slides[0]);const f=r.frame(s);
  r.message(f,'onPlayerReady');r.message(f,'onCurrentTime',{currentTime:4});r.context.v17ActivateSlide(s);
  for(let i=0;i<4;i++){r.message(f,'onStateChange',1);r.message(f,'onCurrentTime',{currentTime:4});r.tick(4000);}
  assert(r.button(s,'Réessayer'),'a stalled clock must not hide the recovery controls');
  assert.equal(s.dataset.ttVisualReady,'0');assert.equal(f.srcWrites,1);
});
test('playback that freezes later remains recoverable without discarding the preload window',()=>{
  const r=setup(6),s=r.slides[2];r.context.v17ActivateSlide(s);const f=r.frame(s);
  r.message(f,'onStateChange',1);r.message(f,'onCurrentTime',{currentTime:0});r.message(f,'onCurrentTime',{currentTime:.5});
  r.tick(14000);r.message(f,'onCurrentTime',{currentTime:1});r.tick(14000);assert.equal(r.status(s),null);
  r.message(f,'onStateChange',3);r.tick(1001);
  assert(r.button(s,'Réessayer'));assert.equal(r.frame(s),f);
  assert.deepEqual(r.slides.map((v,i)=>r.frame(v)?i:null).filter(i=>i!==null),[1,2,3,4]);
});
test('a delayed preload pause before playback cannot cancel the startup deadline',()=>{
  const r=setup(),s=r.slides[1];r.context.v17ActivateSlide(r.slides[0]);const f=r.frame(s);
  r.message(f,'onPlayerReady');r.context.v17ActivateSlide(s);r.message(f,'onStateChange',1);r.message(f,'onStateChange',2);
  r.tick(15001);assert(r.button(s,'Réessayer'));assert.equal(r.frame(s),f);
});
test('a deliberate pause suppresses recovery and resume starts a fresh deadline',()=>{
  const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);r.context.attach();const f=r.frame(s),tap=s.querySelector('.oneTapPlayback');
  r.playing(f);tap.onclick({preventDefault(){},stopPropagation(){}});r.message(f,'onStateChange',2);
  r.tick(30000);assert.equal(r.status(s),null);
  tap.onclick({preventDefault(){},stopPropagation(){}});r.tick(14999);assert.equal(r.status(s),null);
  r.tick(2);assert(r.button(s,'Réessayer'));
});
test('diagnostics are copied only after the user requests them and remain available if clipboard fails',async()=>{
  const r=setup(),s=r.slides[0];let copied=null;
  r.context.navigator={userAgent:'Test browser',clipboard:{writeText:async text=>{copied=text;}}};
  r.context.oneTikTokDiagnostic=[{event:'lecture sans progression',time:0}];
  r.context.v17ActivateSlide(s);r.tick(15001);assert(r.button(s,'Copier le diagnostic'));assert.equal(copied,null);
  await r.context.v17CopyTikTokDiagnostic(s);assert.match(copied,/Test browser/);assert.match(copied,/lecture sans progression/);
  r.context.navigator.clipboard.writeText=async()=>{throw new Error('denied');};
  await r.context.v17CopyTikTokDiagnostic(s);const box=r.status(s).querySelector('textarea');
  assert.equal(box.value,copied);assert.equal(box.selected,true);assert.equal(box.readOnly,true);
});

test('an unavailable active video advances once while retaining catalogue entries',()=>{
  const r=setup(6),s=r.slides[0];r.context.v17ActivateSlide(s);
  r.message(r.frame(s),'onPlayerError',{errorCode:1001});
  assert.match(r.status(s).querySelector('p').textContent,/Passage à la suivante/);
  r.tick(1499);assert.equal(s.dataset.active,'1');r.tick(1);assert.equal(r.slides[1].dataset.active,'1');
  assert.equal(r.items.size,6);assert.equal(r.frame(s),null);
});
test('interaction with the unavailable panel cancels automatic navigation',()=>{
  for(const interaction of ['pointerdown','focusin','Rester ici']){
    const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);r.message(r.frame(s),'onPlayerError',{errorCode:1001});
    if(interaction==='Rester ici')r.button(s,interaction).onclick({stopPropagation(){}});else r.status(s).handlers[interaction]();
    r.tick(2000);assert.equal(s.dataset.active,'1');assert(r.button(s,'Ouvrir sur TikTok'));assert(r.button(s,'Copier le diagnostic'));
  }
});
test('network, autoplay and timeout failures are not remembered as unavailable or auto-skipped',()=>{
  for(const code of [2001,3001,3002,null]){
    const r=setup(),s=r.slides[0];r.context.v17ActivateSlide(s);if(code)r.message(r.frame(s),'onPlayerError',{errorCode:code});
    r.tick(20000);assert.equal(s.dataset.active,'1');assert.equal(r.context.v17TikTokIsUnavailable(r.items.get(s.dataset.id)),false);
  }
});
test('preloading and navigation skip known unavailable slots in both directions',()=>{
  const r=setup(8);r.context.v17ActivateSlide(r.slides[2]);
  r.message(r.frame(r.slides[3]),'onPlayerError',{errorCode:1001});
  r.context.v17StepSlide(r.slides[2],1);assert.equal(r.slides[4].dataset.active,'1');
  assert.deepEqual(r.slides.map((s,i)=>r.frame(s)?i:null).filter(i=>i!==null),[2,4,5,6]);
  r.context.v17ActivateSlide(r.slides[3]);assert.equal(r.slides[2].dataset.active,'1');assert.equal(r.frame(r.slides[3]),null);
  assert.deepEqual(r.slides.map((s,i)=>r.frame(s)?i:null).filter(i=>i!==null),[1,2,4,5]);
});
test('failed preloads are replaced with a bounded number of background requests',()=>{
  const r=setup(10);r.context.v17ActivateSlide(r.slides[2]);
  r.message(r.frame(r.slides[3]),'onPlayerError',{errorCode:1001});
  assert.deepEqual(r.slides.map((s,i)=>r.frame(s)?i:null).filter(i=>i!==null),[1,2,4,5]);
  r.message(r.frame(r.slides[4]),'onPlayerError',{errorCode:1001});
  assert.deepEqual(r.slides.map((s,i)=>r.frame(s)?i:null).filter(i=>i!==null),[1,2,5,6]);
  r.message(r.frame(r.slides[5]),'onPlayerError',{errorCode:1001});assert.equal(r.frame(r.slides[7]),null);
  assert.equal(r.slides[2].dataset.active,'1');assert.equal(r.status(r.slides[2]),null);
});
test('three consecutive failures stop automatic navigation until real playback recovers',()=>{
  const r=setup(8);r.context.v17ActivateSlide(r.slides[0]);
  for(let i=0;i<3;i++){r.message(r.frame(r.slides[i]),'onPlayerError',{errorCode:1001});r.tick(1500);assert.equal(r.slides[i+1].dataset.active,'1');}
  r.message(r.frame(r.slides[3]),'onPlayerError',{errorCode:1001});r.tick(2000);assert.equal(r.slides[3].dataset.active,'1');
  r.context.v17ActivateSlide(r.slides[4]);r.playing(r.frame(r.slides[4]));
  r.message(r.frame(r.slides[4]),'onPlayerError',{errorCode:1001});r.tick(1500);assert.equal(r.slides[5].dataset.active,'1');
});
test('unavailable evidence expires and matches both personal and shared item IDs',()=>{
  const r=setup(),s=r.slides[0],item=r.items.get(s.dataset.id);r.context.v17ActivateSlide(s);
  r.message(r.frame(s),'onPlayerError',{errorCode:1001});r.button(s,'Rester ici').onclick({stopPropagation(){}});
  assert.equal(r.context.v17TikTokIsUnavailable({p:'tiktok',id:'tt_'+item.tiktokId}),true);
  r.tick(10*60*1000+1);assert.equal(r.context.v17TikTokIsUnavailable(item),false);
  r.context.v17ActivateSlide(r.slides[1]);r.context.v17ActivateSlide(s);assert(r.frame(s));assert.equal(r.items.size,3);
});
test('last unavailable video stays recoverable and leaving the feed cancels auto-skip',()=>{
  const last=setup(1),s=last.slides[0];last.context.v17ActivateSlide(s);last.message(last.frame(s),'onPlayerError',{errorCode:1001});last.tick(2000);
  assert.equal(s.dataset.active,'1');assert(last.button(s,'Ouvrir sur TikTok'));
  const r=setup();r.context.v17ActivateSlide(r.slides[0]);r.message(r.frame(r.slides[0]),'onPlayerError',{errorCode:1001});
  r.context.v1815StopAllPlayers();r.feed.classList.remove('show');r.tick(2000);assert.equal(r.document.querySelectorAll('iframe').length,0);assert.equal(r.timers.size,0);
});
test('rebuilding the automatic feed excludes unavailable videos and explains an exhausted catalogue',()=>{
  const r=setup(),source=[...r.items.values()];
  const getElementById=r.document.getElementById;r.document.getElementById=id=>id==='vfeedScroller'?r.feed:getElementById(id);
  Object.assign(r.context,{verticalFeedMode:'tiktok',tiktokItems:source,purgeMockContent(){},oneMixCreators:xs=>xs,recommendationReason:()=>'',state:{liked:new Set(),saved:new Set(),disliked:new Set()},oneStableContent:(root,html)=>{root.innerHTML=html;return false;}});
  vm.runInContext(html.slice(html.indexOf('function renderVerticalFeed(){'),html.indexOf('async function v17ToggleFullscreen(){')),r.context);
  r.context.v17RememberTikTokUnavailable(r.slides[0]);r.context.renderVerticalFeed();
  assert(!r.feed.innerHTML.includes('data-id="'+source[0].id+'"'));assert(r.feed.innerHTML.includes('data-id="'+source[1].id+'"'));
  for(const s of r.slides)r.context.v17RememberTikTokUnavailable(s);r.context.renderVerticalFeed();
  assert.match(r.feed.innerHTML,/Vidéos temporairement indisponibles/);assert.equal(r.items.size,3);
  r.tick(10*60*1000+1);r.context.renderVerticalFeed();assert(r.feed.innerHTML.includes('data-id="'+source[0].id+'"'));
});
