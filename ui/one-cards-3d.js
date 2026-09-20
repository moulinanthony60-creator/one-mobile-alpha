(()=>{
 const style=document.createElement('style');style.textContent=`
#onePointsPanel .oneCard3d{min-width:0;perspective:850px;position:relative;touch-action:pan-y;border-radius:14px;outline:none;cursor:pointer}
#onePointsPanel .oneCard3d.isLocked{cursor:default}
#onePointsPanel .oneCardTilt{height:100%;transform-style:preserve-3d;transform:rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg));transition:transform .2s ease-out}
#onePointsPanel .oneCardRotor{height:100%;display:grid;transform-style:preserve-3d;position:relative}
#onePointsPanel .oneCard3d .oneCollectible,#onePointsPanel .oneCardReverse{grid-area:1/1;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-sizing:border-box}
#onePointsPanel .oneCard3d .oneCollectible{animation:none;transform:translateZ(2px);margin:0}
#onePointsPanel .oneCardReverse{border:2px solid #d9bc7c;border-radius:13px;transform:rotateY(180deg) translateZ(2px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:150px;background:repeating-linear-gradient(45deg,#34203e 0 8px,#40284d 8px 16px);box-shadow:inset 0 0 0 5px #221728,inset 0 0 0 6px #987947,0 6px 16px #0008;color:#e6cc86;text-shadow:0 2px 2px #0008;font:bold 20px Georgia;letter-spacing:3px}
#onePointsPanel .oneCardReverse span{font-size:36px}
#onePointsPanel .oneCardSheen{position:absolute;inset:0;border-radius:11px;pointer-events:none;background:radial-gradient(circle at var(--shine-x,50%) var(--shine-y,20%),#ffffff70,transparent 45%);opacity:0;mix-blend-mode:screen;transition:opacity .25s}
#onePointsPanel .oneCard3d[data-rarity=epic] .oneCardSheen,#onePointsPanel .oneCard3d[data-rarity=legendary] .oneCardSheen{background:linear-gradient(115deg,transparent 15%,#dc8bff66 35%,#92dfff66 46%,#ffed9266 56%,transparent 80%);background-size:200% 100%;background-position:var(--shine-x,50%) center}
#onePointsPanel .oneCard3d.isTilting .oneCardSheen,#onePointsPanel .oneCard3d:focus-visible .oneCardSheen{opacity:.65}
#onePointsPanel .oneCard3d:focus-visible{outline:2px solid #f0d593;outline-offset:4px}
#onePointsPanel .onePackReveal .oneCard3d .oneCardRotor{animation:oneCardTurn3D 1.25s cubic-bezier(.18,.65,.2,1) both;animation-delay:var(--reveal-delay,0s)}
#onePointsPanel .onePackReveal .oneCard3d .oneCollectible{animation:none}
@keyframes oneCardTurn3D{0%{transform:translateY(25px) rotateY(180deg) rotateZ(-7deg) scale(.84)}28%{transform:translateY(-8px) rotateY(180deg) rotateZ(3deg) scale(.97)}100%{transform:translateY(0) rotateY(0deg) rotateZ(0) scale(1)}}
@media(prefers-reduced-motion:reduce){#onePointsPanel .oneCardTilt{transform:none!important;transition:none}#onePointsPanel .onePackReveal .oneCard3d .oneCardRotor{animation:none}#onePointsPanel .oneCardSheen{transition:none}}
`;document.head.append(style);
 window.ONECard3D=(front,card,locked)=>{
  const shell=document.createElement('article');shell.className='oneCard3d'+(locked?' isLocked':'');shell.dataset.rarity=card.rarity;
  const tilt=document.createElement('div'),rotor=document.createElement('div');tilt.className='oneCardTilt';rotor.className='oneCardRotor';rotor.append(front);tilt.append(rotor);shell.append(tilt);
  if(locked)return shell;
  const back=document.createElement('div');back.className='oneCardReverse';back.setAttribute('aria-hidden','true');const star=document.createElement('span');star.textContent='✦';back.append('ONE',star);rotor.append(back);const shine=document.createElement('div');shine.className='oneCardSheen';shine.setAttribute('aria-hidden','true');front.append(shine);
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;let frame=0,animation=null;
  const reset=()=>{cancelAnimationFrame(frame);shell.style.removeProperty('--tilt-x');shell.style.removeProperty('--tilt-y');shell.classList.remove('isTilting');};
  const move=e=>{if(reduced())return;const r=shell.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{shell.style.setProperty('--tilt-x',(0.5-y)*16+'deg');shell.style.setProperty('--tilt-y',(x-0.5)*20+'deg');shell.style.setProperty('--shine-x',x*100+'%');shell.style.setProperty('--shine-y',y*100+'%');shell.classList.add('isTilting');});};
  shell.addEventListener('pointermove',move);shell.addEventListener('pointerdown',move);for(const event of ['pointerleave','pointerup','pointercancel','blur'])shell.addEventListener(event,reset);
  shell.tabIndex=0;shell.setAttribute('role','button');shell.setAttribute('aria-label',card.name+' · Faire tourner la carte en 3D');shell.title='Toucher pour faire tourner la carte';
  const spin=()=>{if(reduced()||rotor.getAnimations().some(a=>a.playState==='running'))return;animation=rotor.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)',offset:.5},{transform:'rotateY(360deg)'}],{duration:1100,easing:'cubic-bezier(.25,.6,.3,1)'});animation.onfinish=()=>{animation=null;};};shell.addEventListener('click',spin);shell.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();spin();}});return shell;
 };
})();
