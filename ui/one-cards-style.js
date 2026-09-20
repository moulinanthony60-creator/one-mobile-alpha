(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel .oneCollectible{padding:6px;border-width:2px;border-radius:13px;background:linear-gradient(145deg,#514457,#19121f 55%);box-shadow:inset 0 1px 1px #fff4,0 4px 8px #0007;overflow:hidden;position:relative}
#onePointsPanel .oneCollectible[data-rarity=rare]{background:linear-gradient(145deg,#215178,#0e172b 60%);box-shadow:inset 0 1px #b8e7ff88,0 0 10px #2583c533}
#onePointsPanel .oneCollectible[data-rarity=epic]{background:linear-gradient(145deg,#75399b,#21102f 60%);box-shadow:inset 0 1px #ebbaff88,0 0 12px #a650d944}
#onePointsPanel .oneCollectible[data-rarity=legendary]{background:linear-gradient(145deg,#a97a29,#28170a 60%);box-shadow:inset 0 1px #fff6ac,0 0 16px #f2be5544}
#onePointsPanel .oneCardImage{border-radius:8px;box-shadow:inset 0 0 0 1px #ffffff28;aspect-ratio:4/5;background-color:#191121}
#onePointsPanel .oneCollectible h4{font-size:13px;line-height:1.2;color:#fff5d8;letter-spacing:.2px;margin:10px 0 5px}
#onePointsPanel .oneCollectible small{font-size:10px;line-height:1.3;display:block;color:#e6d9b4}
#onePointsPanel .oneCollectible.isMissing{border-color:#564663;background:linear-gradient(145deg,#34223e,#16101f);box-shadow:inset 0 1px #ffffff15,0 4px 8px #0005}
#onePointsPanel .oneCardBack{display:grid;place-items:center;font:50px Georgia,serif;color:#b69bbf;background:repeating-linear-gradient(45deg,#392343 0 8px,#30203c 8px 16px);border:1px solid #8f709c55;box-sizing:border-box}
#onePointsPanel .oneCollectionCover{width:100%;display:grid;gap:16px;font-size:16px;line-height:1.4;padding:28px 20px;margin:22px 0;border:1px solid #d2b377;background:radial-gradient(ellipse at top,#754594,#251631 65%);border-radius:18px;text-align:center;box-shadow:inset 0 1px #fff3,0 10px 25px #0005}
#onePointsPanel .oneCollectionCover span{font-size:13px;color:#e6d4b2}#onePointsPanel .oneCollectionCover .oneCoverStar{font-size:60px;color:#edce81;text-shadow:0 0 25px #b375d1}
#onePointsPanel .onePackOpening{padding:25px;perspective:800px}#onePointsPanel .oneOpeningEnvelope{width:135px;height:190px;display:grid;place-items:center;margin:0 auto 20px;border:3px solid #d7bc77;border-radius:12px;background:linear-gradient(130deg,#251130,#684287,#2b1939);font:bold 28px Georgia;color:#e7c47a;box-shadow:0 12px 35px #0008,0 0 30px #b872e44d;animation:onePackShake .9s ease-in-out infinite alternate}
#onePointsPanel .onePackReveal{perspective:1000px;border-bottom:1px solid #caa86b55;padding:10px 0 25px;margin-bottom:20px}
#onePointsPanel .onePackReveal .oneCollectible{animation:oneCardReveal .7s cubic-bezier(.2,.75,.2,1) both;animation-delay:var(--reveal-delay)}
@keyframes onePackShake{from{transform:rotateY(-14deg) rotate(-3deg) translateY(0)}to{transform:rotateY(14deg) rotate(3deg) translateY(-8px);box-shadow:0 20px 35px #0008,0 0 45px #c18be688}}
@keyframes oneCardReveal{0%{opacity:0;transform:rotateY(100deg) translateY(24px) scale(.8)}55%{opacity:1}100%{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){#onePointsPanel .oneOpeningEnvelope,#onePointsPanel .onePackReveal .oneCollectible{animation:none}}
`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel .onePackOpening{position:relative;padding:10px 12px 30px;overflow:hidden;border-radius:24px;background:radial-gradient(ellipse at 50% 42%,#63428177,transparent 64%),linear-gradient(#170e21,#21132c);border:1px solid #a487bf44;margin:20px 0}
#onePointsPanel .onePackOpening~.onePackList,#onePointsPanel .onePackOpening~.onePackList+p{display:none}
#onePointsPanel .onePackPortal{height:315px;display:grid;place-items:center;perspective:900px;position:relative;isolation:isolate}
#onePointsPanel .onePackPortal::before{content:'';position:absolute;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,#fae5ad99,#b480de55 32%,transparent 70%);animation:onePortalBloom 2.1s ease-out both}
#onePointsPanel .onePremiumPacket{width:158px;height:218px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:13px;border:2px solid #e6cd92;border-radius:12px;background:linear-gradient(110deg,#38203f,#704979 35%,#26172d 66%,#594064);box-shadow:inset 5px 0 #ffffff15,inset -6px 0 #0005,6px 7px 0 #180e20,0 25px 25px #0008;transform-style:preserve-3d;animation:onePacketBreak 2.1s cubic-bezier(.22,.65,.3,1) both}
#onePointsPanel .onePremiumPacket::before{content:'';position:absolute;inset:11px;border:1px solid #dfc99577;border-radius:5px;background:repeating-linear-gradient(135deg,transparent 0 15px,#d8c3a509 15px 16px);pointer-events:none}
#onePointsPanel .onePacketCaption{font-size:9px;letter-spacing:3px;color:#dccbb0}#onePointsPanel .onePacketLogo{font:bold 35px Georgia;color:#fff0bc;letter-spacing:4px;text-shadow:0 3px 2px #0006}#onePointsPanel .onePacketSeal{color:#f5d68b;font-size:46px;text-shadow:0 0 20px #d19b5c}
#onePointsPanel .onePacketLid{position:absolute;left:-2px;right:-2px;top:-2px;height:27px;border:2px solid #e6cd92;border-radius:10px 10px 0 0;background:repeating-linear-gradient(90deg,#b4965a 0 3px,#dcc38c 3px 5px);transform-origin:left bottom;animation:onePacketTear 2.1s ease-in both}
#onePointsPanel .onePackSpark{position:absolute;left:50%;top:50%;width:4px;height:4px;border-radius:50%;background:#fff0bb;box-shadow:0 0 12px #edcf83;animation:oneSparkBurst 1s ease-out both;animation-delay:calc(.95s + var(--spark-delay))}
#onePointsPanel .oneOpeningCaption{font-size:13px;letter-spacing:1px;color:#e7d7ed}
@keyframes onePacketBreak{0%{transform:translateY(22px) rotateY(-28deg) rotateZ(-6deg);opacity:0}20%{opacity:1;transform:translateY(0) rotateY(15deg) rotateZ(2deg)}50%{transform:translateY(-6px) rotateY(-7deg) rotateZ(-2deg)}75%{transform:translateY(-8px) rotateY(0deg) scale(1.06);opacity:1}100%{transform:translateY(45px) rotateX(12deg) scale(1.2);opacity:0}}
@keyframes onePacketTear{0%,45%{transform:none;opacity:1}75%{transform:translateY(-45px) rotate(-20deg);opacity:1}100%{transform:translateY(-85px) rotate(-35deg);opacity:0}}
@keyframes onePortalBloom{0%{transform:scale(.6);opacity:.25}50%{transform:scale(1);opacity:.65}85%{transform:scale(1.8);opacity:1}100%{transform:scale(2);opacity:0}}
@keyframes oneSparkBurst{0%{transform:rotate(var(--spark-angle)) translateY(-30px);opacity:0}20%{opacity:1}100%{transform:rotate(var(--spark-angle)) translateY(-150px);opacity:0}}
#onePointsPanel .onePackReveal{padding:25px 12px 30px;border:1px solid #b9976244;border-radius:20px;margin:20px 0;background:radial-gradient(ellipse at 50% 0,#6a477c44,transparent 65%),#130d1bcc;overflow:visible}
#onePointsPanel .oneRevealEyebrow{font-size:9px;color:#dbc08c;letter-spacing:3px}#onePointsPanel .oneRevealHint{font-size:12px;color:#b9a8c4}
#onePointsPanel .onePackReveal .oneCollectionGrid{gap:12px;align-items:stretch;padding-top:15px}
#onePointsPanel .onePackReveal .oneCard3d{--tier-glow:#cdd7e4;--tier-rgb:205,215,228;isolation:isolate}
#onePointsPanel .oneCard3d:not(.isLocked)[data-rarity=normal]{--tier-glow:#cdd7e4;--tier-rgb:205,215,228}
#onePointsPanel .oneCard3d:not(.isLocked)[data-rarity=rare]{--tier-glow:#5ecbff;--tier-rgb:94,203,255}
#onePointsPanel .oneCard3d:not(.isLocked)[data-rarity=epic]{--tier-glow:#d67eff;--tier-rgb:214,126,255}
#onePointsPanel .oneCard3d:not(.isLocked)[data-rarity=legendary]{--tier-glow:#ffd579;--tier-rgb:255,213,121}
#onePointsPanel .oneCard3d:not(.isLocked) .oneCollectible small{color:var(--tier-glow)}
#onePointsPanel .onePackReveal .oneCard3d::before{content:'';position:absolute;inset:-10px;z-index:-1;pointer-events:none;border-radius:18px;opacity:0;animation:oneTierGlow 2s ease-out both;animation-delay:calc(var(--reveal-delay) + .55s)}
#onePointsPanel .onePackReveal .oneCard3d[data-rarity=normal]::before{inset:0;background:none;box-shadow:0 0 12px #d4e2f244}
#onePointsPanel .onePackReveal .oneCard3d[data-rarity=rare]::before{background:radial-gradient(ellipse,#39aeff70,transparent 70%);box-shadow:0 0 18px #49baff44;border:1px solid #81d9ff44}
#onePointsPanel .onePackReveal .oneCard3d[data-rarity=epic]::before{background:conic-gradient(from 15deg,transparent,#bc5cff99 8deg,transparent 16deg,transparent 96deg,#ecb4ff99 101deg,transparent 108deg,transparent 210deg,#bc5cff99 216deg,transparent 222deg);filter:drop-shadow(0 0 7px #b869ff)}
#onePointsPanel .onePackReveal .oneCard3d[data-rarity=legendary]::before{inset:-20px;background:repeating-conic-gradient(from 0deg,#ffdc8955 0deg,transparent 12deg,transparent 30deg);filter:drop-shadow(0 0 12px #edb144);animation-name:oneLegendaryHalo}
#onePointsPanel .onePackReveal .oneCard3d:not(.isLocked) .oneCollectible::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 25%,rgba(var(--tier-rgb),.5) 48%,transparent 70%);transform:translateX(-140%);animation:oneTierSweep 1s ease-out both;animation-delay:calc(var(--reveal-delay) + .6s)}
#onePointsPanel .onePackReveal .oneCard3d[data-rarity=legendary] .oneCollectible{box-shadow:inset 0 1px #fff5bf,0 0 16px #f5c86155,0 8px 18px #0008}
@keyframes oneTierGlow{0%{opacity:0;transform:scale(.85)}30%{opacity:.85;transform:scale(1.04)}100%{opacity:.28;transform:scale(1)}}
@keyframes oneLegendaryHalo{0%{opacity:0;transform:scale(.7) rotate(-12deg)}35%{opacity:.85}100%{opacity:.35;transform:scale(1.04) rotate(14deg)}}
@keyframes oneTierSweep{0%{transform:translateX(-140%)}100%{transform:translateX(140%)}}
@media(max-width:560px){#onePointsPanel .onePackReveal .oneCollectionGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 14px}#onePointsPanel .onePackReveal .oneCard3d:last-child:nth-child(odd){grid-column:1/-1;width:calc(50% - 7px);justify-self:center}#onePointsPanel .onePackReveal{padding:20px 14px}}
@media(prefers-reduced-motion:reduce){#onePointsPanel .onePackPortal::before,#onePointsPanel .onePremiumPacket,#onePointsPanel .onePacketLid,#onePointsPanel .onePackSpark,#onePointsPanel .onePackReveal .oneCard3d::before,#onePointsPanel .onePackReveal .oneCollectible::after{animation:none!important}#onePointsPanel .onePackSpark{display:none}#onePointsPanel .onePackReveal .oneCard3d::before{opacity:.2}}
`;document.head.append(s);})();
