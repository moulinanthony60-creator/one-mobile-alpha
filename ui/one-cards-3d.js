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
  const spin=()=>{if(shell.classList.contains('isUnrevealed')){shell.classList.remove('isUnrevealed');shell.classList.add('isJustRevealed');const fx=document.createElement('div');fx.className='oneRevealFX';fx.setAttribute('aria-hidden','true');for(const cls of ['oneFXAura','oneFXRing']){const layer=document.createElement('span');layer.className=cls;fx.append(layer);}const n={normal:0,rare:5,epic:8,legendary:12}[card.rarity]||0;for(let i=0;i<n;i++){const spark=document.createElement('i');spark.className='oneFXSpark';spark.style.setProperty('--fx-x',(50+43*Math.cos(i*2*Math.PI/n))+'%');spark.style.setProperty('--fx-y',(50+44*Math.sin(i*2*Math.PI/n))+'%');spark.style.setProperty('--fx-delay',(.34+(i%3)*.075)+'s');if(card.rarity==='legendary')spark.textContent='✦';fx.append(spark);}shell.append(fx);front.removeAttribute('aria-hidden');shell.setAttribute('aria-label',card.name+' · Faire tourner la carte en 3D');shell.title='Toucher pour faire tourner la carte';return;}if(reduced()||rotor.getAnimations().some(a=>a.playState==='running'))return;animation=rotor.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)',offset:.5},{transform:'rotateY(360deg)'}],{duration:1100,easing:'cubic-bezier(.25,.6,.3,1)'});animation.onfinish=()=>{animation=null;};};shell.addEventListener('click',spin);shell.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();spin();}});return shell;
 };
})();
(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel .onePackReveal .oneCard3d .oneCardRotor{animation:none;transform:rotateY(0deg);transition:transform .85s cubic-bezier(.2,.65,.25,1)}
#onePointsPanel .onePackReveal .oneCard3d.isUnrevealed .oneCardRotor{transform:rotateY(180deg)}
#onePointsPanel .onePackReveal .oneCard3d.isUnrevealed::before,#onePointsPanel .onePackReveal .oneCard3d.isUnrevealed .oneCollectible::after{animation:none;opacity:0;background:none;box-shadow:none}
#onePointsPanel .onePackReveal .oneCard3d.isUnrevealed .oneCardSheen{background:radial-gradient(circle,#fff3,transparent);opacity:0}
#onePointsPanel .onePackReveal .oneCard3d.isUnrevealed .oneCardReverse::after{content:'TOUCHER';font:8px system-ui;letter-spacing:2px;color:#e1caa0}
#onePointsPanel .onePackReveal .oneCard3d.isUnrevealed{animation:oneHiddenCardArrive .65s ease-out both}
@keyframes oneHiddenCardArrive{from{opacity:0;translate:0 18px}to{opacity:1;translate:0 0}}
@media(prefers-reduced-motion:reduce){#onePointsPanel .onePackReveal .oneCard3d .oneCardRotor{transition:none}#onePointsPanel .onePackReveal .oneCard3d.isUnrevealed{animation:none}}
`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel .onePackReveal .oneCard3d::before{display:none!important}
#onePointsPanel .oneRevealFX{position:absolute;inset:-6px;border-radius:16px;pointer-events:none;z-index:2;overflow:visible;color:var(--tier-glow)}
#onePointsPanel .oneFXAura{position:absolute;inset:-5px;border-radius:22px;background:radial-gradient(ellipse,rgba(var(--tier-rgb),.12) 35%,rgba(var(--tier-rgb),.32) 56%,transparent 74%);opacity:0;animation:oneAuraPolished 1.8s ease-out .32s both}
#onePointsPanel .oneFXRing{position:absolute;inset:4px;border:1px solid var(--tier-glow);border-radius:13px;box-shadow:inset 0 0 12px rgba(var(--tier-rgb),.3),0 0 15px rgba(var(--tier-rgb),.3);opacity:0;animation:oneRingPolished 1.6s cubic-bezier(.2,.65,.3,1) .36s both}
#onePointsPanel .oneFXSpark{position:absolute;left:50%;top:50%;width:3px;height:3px;border-radius:50%;background:var(--tier-glow);box-shadow:0 0 8px var(--tier-glow);opacity:0;animation:oneSparkPolished 1.65s ease-out var(--fx-delay) both}
#onePointsPanel .oneCard3d[data-rarity=normal] .oneFXAura{display:none}#onePointsPanel .oneCard3d[data-rarity=normal] .oneFXRing{box-shadow:0 0 6px #ccd8ec55;animation-duration:1.1s}
#onePointsPanel .oneCard3d[data-rarity=rare] .oneFXRing{border-width:2px;box-shadow:0 0 18px #58c6ff55,inset 0 0 12px #5dccff33}
#onePointsPanel .oneCard3d[data-rarity=epic] .oneFXSpark{border-radius:0;transform:rotate(45deg);width:5px;height:5px;background:#f2ceff;box-shadow:0 0 12px #bb6cff}
#onePointsPanel .oneCard3d[data-rarity=epic] .oneFXAura{background:radial-gradient(ellipse,transparent 40%,#b169fa55 60%,transparent 74%);animation-duration:2s}
#onePointsPanel .oneCard3d[data-rarity=legendary] .oneFXSpark{background:none;box-shadow:none;width:auto;height:auto;font-size:12px;text-shadow:0 0 8px #ffd278;animation-duration:2.2s}
#onePointsPanel .oneCard3d[data-rarity=legendary] .oneFXAura{inset:-12px;background:radial-gradient(ellipse,#fff0b914 35%,#fbc96766 55%,transparent 74%);animation-duration:2.6s}
#onePointsPanel .oneCard3d[data-rarity=legendary] .oneFXRing{border:2px double #fff0bf;box-shadow:0 0 24px #e8b95977,inset 0 0 14px #f7d89155;animation-duration:2.4s}
#onePointsPanel .onePackReveal .oneCard3d:not(.isUnrevealed) .oneCollectible::after{background:linear-gradient(110deg,transparent 35%,rgba(var(--tier-rgb),.3) 46%,#fff7dc66 50%,rgba(var(--tier-rgb),.3) 54%,transparent 65%);animation-duration:1.35s;animation-delay:.42s}
#onePointsPanel .onePackReveal .oneCard3d.isUnrevealed .oneCollectible::after{animation:none;opacity:0}
@keyframes oneAuraPolished{0%{opacity:0;transform:scale(.95)}30%{opacity:.8;transform:scale(1.04)}100%{opacity:0;transform:scale(1.15)}}
@keyframes oneRingPolished{0%{opacity:0;transform:scale(.97)}25%{opacity:.85}100%{opacity:0;transform:scale(1.13)}}
@keyframes oneSparkPolished{0%{opacity:0;left:50%;top:50%;scale:.2}20%{opacity:1;scale:1}100%{opacity:0;left:var(--fx-x);top:var(--fx-y);scale:.4}}
@media(prefers-reduced-motion:reduce){#onePointsPanel .oneRevealFX{display:none}#onePointsPanel .onePackReveal .oneCard3d .oneCollectible::after{animation:none;opacity:0}}
`;document.head.append(s);})();
