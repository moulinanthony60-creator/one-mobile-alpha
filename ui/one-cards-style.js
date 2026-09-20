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
