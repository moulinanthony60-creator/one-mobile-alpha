(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel .oneCardsScreen{min-width:0}
#onePointsPanel .onePackBox{position:relative;overflow:hidden;background:radial-gradient(ellipse at 50% 20%,#196c944d,transparent 65%),linear-gradient(145deg,#162236,#130f20);border-color:#67afd86b;padding:18px 14px}
#onePointsPanel .onePackBox[data-premium=true]{background:radial-gradient(ellipse at 50% 20%,#a8793255,transparent 65%),linear-gradient(145deg,#33233c,#17101b);border-color:#d7b874}
#onePointsPanel .oneShopPacket{height:205px;display:grid;place-items:center;perspective:800px;position:relative;margin-bottom:12px}
#onePointsPanel .oneShopPacket::before{content:'';position:absolute;bottom:3px;width:150px;height:22px;border-radius:50%;background:#0008;filter:blur(7px)}
#onePointsPanel .oneShopFoil{box-sizing:border-box;width:126px;height:178px;position:relative;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;border:2px solid #a9e4ff;border-radius:3px;background:repeating-linear-gradient(130deg,transparent 0 18px,#bdeaff13 19px 20px),linear-gradient(115deg,#15293f,#427dac 35%,#152b51 64%,#547ca5);box-shadow:inset 5px 0 6px #fff2,inset -5px 0 6px #0008,7px 8px 0 #091121,0 18px 30px #0008;transform:rotateY(-15deg) rotateZ(-5deg);animation:oneShopFloat 5s ease-in-out infinite}
#onePointsPanel .oneShopFoil::before,#onePointsPanel .oneShopFoil::after{content:'';position:absolute;left:0;right:0;height:10px;background:repeating-linear-gradient(90deg,#ffffff55 0 1px,#0003 2px 3px)}
#onePointsPanel .oneShopFoil::before{top:0}#onePointsPanel .oneShopFoil::after{bottom:0}
#onePointsPanel .oneShopFoil strong{font: bold 32px Georgia;color:#f4f6ff;letter-spacing:4px}
#onePointsPanel .oneShopFoil b{font-size:42px;color:#baedff;text-shadow:0 0 20px #a3deff}
#onePointsPanel .oneShopFoil span{font-size:8px;letter-spacing:1px;color:#e0f2ff}#onePointsPanel .oneShopFoil small{font-size:9px;color:#fff}
#onePointsPanel [data-premium=true] .oneShopFoil{border-color:#f1d69a;background:repeating-linear-gradient(130deg,transparent 0 18px,#ffde841c 19px 20px),linear-gradient(115deg,#38203d,#a37650 35%,#35223f 64%,#a1875c);animation-delay:-2s}
#onePointsPanel [data-premium=true] .oneShopFoil b{color:#ffe2a0;text-shadow:0 0 20px #fbd782}
#onePointsPanel .onePackBox h3{margin:6px 0;font-size:20px}#onePointsPanel .onePackPrice{color:#ecdbac;font-size:14px}
#onePointsPanel .onePackBox button{width:100%;border:1px solid #91c8e9;background:linear-gradient(#356381,#233752);font-weight:700;min-height:46px;margin-bottom:0}
#onePointsPanel .onePackBox[data-premium=true] button{border-color:#ecd28d;background:linear-gradient(#8b6738,#503624);color:#fff1cb}
#onePointsPanel .onePackOdds{text-align:left;border-top:1px solid #ffffff1c;padding-top:12px;font-size:12px;color:#c7c4d8}#onePointsPanel .onePackOdds summary{cursor:pointer;padding:5px 0}#onePointsPanel .onePackOdds p{line-height:1.8}
#onePointsPanel .oneCollectionCover{overflow:hidden;background:radial-gradient(ellipse at 50% 30%,#81674577,transparent 65%),linear-gradient(145deg,#262845,#170f23);padding-top:10px;gap:12px}
#onePointsPanel .oneCollectionFan{height:190px;position:relative;display:grid;place-items:center;perspective:800px;width:100%}
#onePointsPanel .oneAlbumBack{position:absolute;width:95px;height:140px;display:flex;flex-direction:column;gap:20px;align-items:center;justify-content:center;border:2px solid #d7c084;border-radius:9px;background:repeating-linear-gradient(135deg,#ffffff06 0 1px,transparent 1px 10px),linear-gradient(140deg,#5f496f,#20172f);box-shadow:inset 0 0 0 5px #271b33,0 12px 20px #0008;transform:translateX(calc(var(--fan)*60px)) translateY(calc(var(--fan)*var(--fan)*12px)) rotate(calc(var(--fan)*16deg));color:#f5ddb0}
#onePointsPanel .oneAlbumBack span{font-size:36px;color:#edce81}#onePointsPanel .oneAlbumBack strong{font: bold 19px Georgia;letter-spacing:3px}
#onePointsPanel .oneCollectionCover progress{width:100%;height:7px;border:0;accent-color:#e5c981;border-radius:8px;overflow:hidden}#onePointsPanel .oneCollectionCover progress::-webkit-progress-bar{background:#ffffff15}#onePointsPanel .oneCollectionCover progress::-webkit-progress-value{background:linear-gradient(90deg,#9976ce,#ecd38b)}
#onePointsPanel .onePackOpening{background:radial-gradient(ellipse at center,#724c9655,transparent 65%),#0d0d1c}
#onePointsPanel .onePremiumPacket,#onePointsPanel .onePacketLid,#onePointsPanel .onePackPortal::before{animation-duration:2.9s}
#onePointsPanel .oneOpeningCards{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}
#onePointsPanel .oneOpeningCards i{position:absolute;display:grid;place-items:center;width:82px;height:118px;border:2px solid #e9d391;border-radius:8px;background:repeating-linear-gradient(135deg,#ffffff0d 0 2px,transparent 2px 12px),linear-gradient(145deg,#4b385d,#1a1328);color:#e9d391;font:30px Georgia;box-shadow:0 0 20px #d1b88733;opacity:0;animation:onePackCardsFly 2.9s cubic-bezier(.2,.65,.2,1) both}
@keyframes onePackCardsFly{0%,62%{opacity:0;transform:translateY(30px) scale(.7)}75%{opacity:1}94%{opacity:1;transform:translateX(calc((var(--card-index) - 2)*35px)) translateY(-25px) rotate(calc((var(--card-index) - 2)*12deg))}100%{opacity:0;transform:translateX(calc((var(--card-index) - 2)*42px)) translateY(-55px) scale(1.05)}}
@keyframes oneShopFloat{0%,100%{transform:translateY(0) rotateY(-15deg) rotateZ(-5deg)}50%{transform:translateY(-8px) rotateY(8deg) rotateZ(2deg)}}
#onePointsPanel .onePackReveal .oneCardReverse{background:radial-gradient(circle at 50% 40%,#75578c55,transparent 70%),repeating-linear-gradient(135deg,#ffffff07 0 1px,transparent 1px 11px),#21172f;box-shadow:inset 0 0 0 5px #1b1228,inset 0 0 0 6px #b49b64,0 10px 24px #0008}
@media(prefers-reduced-motion:reduce){#onePointsPanel .oneShopFoil,#onePointsPanel .oneOpeningCards i{animation:none}#onePointsPanel .oneOpeningCards{display:none}}
`;document.head.append(s);})();

(()=>{const s=document.createElement('style');s.textContent='#onePointsPanel .oneNewCardBadge{position:absolute;top:10px;left:9px;padding:4px 7px;background:linear-gradient(120deg,#fff19c,#ffbd45);color:#342013;font:bold 9px system-ui;letter-spacing:1px;border:1px solid #fff4b6;border-radius:5px;box-shadow:0 2px 8px #0007;z-index:4}';document.head.append(s);})();
