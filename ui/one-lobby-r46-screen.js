// Explicit lobby 3D selection. Party/card activities never enter this screen.
export function createGameScreen({shell,lobbyState,setReady,startRound,reset}){
 const style=document.createElement('style');style.textContent=`
 .one3d-game-screen{box-sizing:border-box;width:min(660px,calc(100vw - 24px));max-height:88dvh;padding:clamp(18px,3vw,32px);border:2px solid #b66dfb;border-radius:24px;background:#faf6ff;color:#352547;box-shadow:0 0 40px #b05bfa66;font:15px system-ui}
 .one3d-game-screen::backdrop{background:#21163299;backdrop-filter:blur(5px)}
 .one3d-game-screen header{display:flex;align-items:center;justify-content:space-between;gap:16px}.one3d-game-screen h2{font-size:clamp(24px,4vw,36px);margin:6px 0}.one3d-game-screen .screen-kicker{font-size:11px;letter-spacing:.18em;color:#8651b5;font-weight:800}.one3d-game-screen p{line-height:1.5;color:#705a81}
 .one3d-game-screen button{font:inherit;cursor:pointer;min-height:44px;border-radius:12px;border:1px solid #cbb2df;background:white;color:#533170;padding:10px 16px}.one3d-game-screen button:focus-visible{outline:3px solid #9b41ef;outline-offset:3px}.one3d-game-screen button:disabled{opacity:.5;cursor:default}
 .one3d-game-screen [data-screen-close]{font-size:24px;padding:4px 14px}.one3d-game-screen .screen-grid{display:grid;grid-template-columns:1fr;gap:14px;margin:22px 0}
 .one3d-game-screen .screen-card>:first-child{width:100%;height:105px;min-height:0;flex:none;overflow:hidden;border-radius:9px;margin:0;box-sizing:border-box}.one3d-game-screen .screen-card>:first-child img{width:100%;height:100%;object-fit:cover}
 .one3d-game-screen .screen-card>.pl-art{position:relative!important;inset:auto!important;display:block;aspect-ratio:auto!important;transform:none!important}.one3d-game-screen .pl-art svg{position:static!important;display:block;width:100%!important;height:100%!important;max-width:none}
 .one3d-game-screen .screen-card{display:flex;flex-direction:column;text-align:left;overflow:hidden;padding:14px;gap:8px;background:linear-gradient(145deg,#fff,#eee1fc);transition:border-color .15s}.one3d-game-screen .screen-card:hover{border-color:#9439e7}.one3d-game-screen .screen-card[data-selected=true]{border:2px solid #9744df;background:#ecdcfa}.screen-card>svg,.screen-card>img,.screen-card>.screen-art{width:100%;height:94px;object-fit:contain}.screen-card strong{font-size:17px}.screen-card small{color:#755e84}.screen-art{display:grid;place-items:center;background:radial-gradient(ellipse at bottom,#79325c,#201227);border-radius:9px;color:#f0d2ff;font-size:44px;font-weight:800;letter-spacing:.08em}
 .one3d-game-screen .screen-setup{border-top:1px solid #dbc8eb;padding-top:16px}.one3d-game-screen .screen-actions{display:flex;gap:10px;flex-wrap:wrap}.one3d-game-screen .screen-primary{background:#8643c5;color:#fff;border-color:#8643c5}.one3d-game-screen [data-screen-state]{min-height:22px}.one3d-game-screen .screen-setup .os-activity{margin:0}
 .one3d-screen-button{position:absolute;z-index:7;left:50%;top:24%;transform:translateX(-50%);min-height:46px;border-radius:24px;background:#faf5fff0;color:#673791;border:1px solid #a157dd;padding:10px 22px;font:700 14px system-ui;box-shadow:0 0 22px #af57fa44;cursor:pointer;white-space:nowrap}
 .one3d-loading{position:absolute;inset:0;z-index:8;display:grid;place-content:center;gap:12px;text-align:center;background:#eee6f7;color:#63427e;padding:24px}.one3d-loading[hidden]{display:none}.one3d-loading b{font:800 40px system-ui;letter-spacing:.15em}.one3d-loading span{font:15px system-ui}.one3d-loading progress{margin:auto;width:180px;accent-color:#954ddd}
 @media(max-width:600px){.one3d-game-screen .screen-grid{gap:10px;margin:16px 0}.one3d-game-screen .screen-card{padding:10px}.screen-card>svg,.screen-card>img,.screen-card>.screen-art{height:72px}.screen-card strong{font-size:15px}.one3d-screen-button{top:22%;font-size:12px;padding:8px 15px}}
 `;document.head.append(style);
 const panel=document.createElement('dialog');panel.className='one3d-game-screen';panel.setAttribute('aria-labelledby','one3d-screen-title');
 panel.innerHTML=`<header><div><span class="screen-kicker">ONE · VOTRE SALON 3D</span><h2 id="one3d-screen-title">Jeux 3D</h2></div><button data-screen-close aria-label="Revenir au lobby">×</button></header><p>Retrouvez votre groupe et lancez votre aventure ensemble.</p><div class="screen-grid"></div><section class="screen-setup"></section>`;
 shell.append(panel);
 const grid=panel.querySelector('.screen-grid'),setup=panel.querySelector('.screen-setup');let signature='',destroyed=false;
 const button=(label,fn,cls='')=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cls;b.onclick=fn;return b;};
 function build(){
  grid.replaceChildren();const games=[{id:'317',name:'3:17 · FOUR',min:2,max:4,category:'Horreur coopérative'}];
  const seen=new Set();for(const game of games){if(seen.has(game.id))continue;seen.add(game.id);
   const card=button('',()=>{signature='';refresh();setup.scrollIntoView({block:'nearest'});},'screen-card');card.dataset.game=game.id;card.dataset.selected='true';card.setAttribute('aria-pressed','true');
   const art=document.createElement('div');art.className='screen-art';art.textContent='3:17';card.append(art);
   const title=document.createElement('strong'),info=document.createElement('small');title.textContent=game.name;info.textContent=game.min+'–'+game.max+' joueurs · '+game.category;card.append(title,info);grid.append(card);
  }
 }
 function refresh(){
  if(!panel.open||destroyed)return;
  const state=lobbyState();
  const key=JSON.stringify([state.notice,state.ready,state.canStart,state.isHost,state.joined,state.players,state.self]);if(key===signature)return;signature=key;
  const focused=setup.contains(document.activeElement)?document.activeElement?.textContent:null;
  setup.replaceChildren();
   const title=document.createElement('h3');title.textContent='3:17 · Survivre ensemble';const note=document.createElement('p');note.dataset.screenState='';note.setAttribute('role','status');note.textContent=state.notice;
   const actions=document.createElement('div');actions.className='screen-actions';const ready=button(state.ready?'✓ Prêt':'Je suis prêt',setReady),start=button('Lancer 3:17',startRound,'screen-primary');ready.disabled=!state.joined||!state.players.some(p=>p.id===state.self);ready.setAttribute('aria-pressed',String(state.ready));start.disabled=!state.canStart;start.hidden=!state.isHost;actions.append(ready,start);setup.append(title,note,actions);
  if(focused)[...setup.querySelectorAll('button')].find(b=>b.textContent===focused)?.focus();
 }
 panel.querySelector('[data-screen-close]').onclick=()=>panel.close();panel.addEventListener('close',()=>{reset();shell.querySelector('[data-screen-open]')?.focus();});
 panel.addEventListener('keydown',e=>e.stopPropagation());panel.addEventListener('pointerdown',e=>e.stopPropagation());
 const timer=setInterval(refresh,400);
 return {get opened(){return panel.open;},open(){reset();build();signature='';panel.showModal();refresh();},close(){panel.close();},dispose(){destroyed=true;clearInterval(timer);panel.remove();style.remove();}};
}
