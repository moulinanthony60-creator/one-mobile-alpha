(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel:has(.casino){width:min(680px,calc(100vw - 24px))}
#onePointsPanel .casinoTable{position:relative;isolation:isolate;overflow:hidden;min-height:245px;padding:28px 16px;border:1px solid #b89a55;border-radius:28px;background:radial-gradient(ellipse at 50% 35%,#316452 0%,#164335 45%,#09271f 100%);box-shadow:inset 0 3px 2px #fff4,inset 0 -12px 24px #0009,0 9px 0 #181018,0 12px 0 #806144,0 24px 32px #0007;}
#onePointsPanel .casinoTable::before{content:'';position:absolute;inset:10px;border:1px solid #e1c27744;border-radius:20px;pointer-events:none;z-index:-1}
#onePointsPanel .casinoTable::after{content:'ONE • CLUB';position:absolute;bottom:12px;left:0;right:0;letter-spacing:5px;font-size:9px;color:#ecd89b77;pointer-events:none}
#onePointsPanel .casinoTable[data-game=slots]{background:linear-gradient(115deg,#594366,#24172e 23%,#432b50 57%,#160e1d);border:3px solid #d7b969;box-shadow:inset 3px 3px 0 #fff6,inset -5px -7px 0 #0008,0 10px 0 #725431,0 14px 0 #23192c,0 22px 30px #0007;border-radius:28px 28px 18px 18px;padding:20px 20px 30px}
#onePointsPanel .slotMarquee{color:#ffe9a2;letter-spacing:5px;font-size:16px;font-weight:900;text-shadow:0 0 13px #ffb949;margin:2px 0 18px;border:1px solid #ddad6288;border-radius:10px;background:#130c1b;padding:10px;box-shadow:inset 0 0 15px #000,0 2px 1px #ffdd9a55}
#onePointsPanel .casinoReels{gap:6px;margin:10px auto 22px;padding:10px;border-radius:15px;border:2px solid #a78a59;background:linear-gradient(#100b16,#5f496b);box-shadow:inset 0 7px 12px #000b,0 3px 0 #f4d88b55;perspective:600px;max-width:370px}
#onePointsPanel .casinoReel{display:grid;place-items:center;flex:1;min-width:0;height:90px;padding:8px 0;border:1px solid #dbbd6f;border-radius:9px;background:linear-gradient(#947c4f 0%,#f4dfb1 18%,#fff7da 48%,#ead7a5 75%,#8a7148 100%);box-shadow:inset 0 10px 15px #0005,inset 0 -10px 14px #0005,2px 0 2px #0008;font-size:clamp(30px,8vw,48px);text-shadow:1px 3px 2px #0004;transform:rotateX(-5deg)}
#onePointsPanel .casinoTable[data-game=slots].reveal .casinoReel{animation:oneReelLand .5s cubic-bezier(.2,.8,.2,1) backwards}#onePointsPanel .casinoTable[data-game=slots].reveal .casinoReel:nth-child(2){animation-delay:.09s}#onePointsPanel .casinoTable[data-game=slots].reveal .casinoReel:nth-child(3){animation-delay:.18s}
@keyframes oneReelLand{from{transform:rotateX(65deg);filter:blur(3px);opacity:.4}to{transform:rotateX(-5deg);filter:none;opacity:1}}
#onePointsPanel .rouletteStage{height:265px;display:grid;place-items:center;perspective:650px;position:relative;margin:-12px 0 0}
#onePointsPanel .rouletteWheel{width:240px;height:240px;border-radius:50%;position:relative;transform:rotateX(30deg);border:9px solid #caab63;box-shadow:inset 0 0 0 3px #5f4124,0 9px 0 #6c452b,0 15px 0 #2c1818,0 26px 25px #000a;background:#261922}
#onePointsPanel .rouletteRotor{position:absolute;inset:0;border-radius:50%;border:2px solid #e7d29c;box-shadow:inset 0 0 12px #0009;transform:rotate(var(--wheel-turn,0deg));transition:transform 1.2s cubic-bezier(.15,.7,.2,1)}
#onePointsPanel .rouletteNumber{position:absolute;left:calc(50% - 10px);top:calc(50% - 8px);width:20px;height:16px;text-align:center;font-size:9px;color:#fff1d0;font-weight:800;transform:rotate(var(--angle)) translateY(-100px);text-shadow:0 1px 2px #000}
#onePointsPanel .rouletteHub{position:absolute;inset:48px;border-radius:50%;background:repeating-radial-gradient(circle,#533023 0,#754534 3px,#44271f 6px);border:5px solid #d8b66b;box-shadow:0 3px 7px #000b,inset 0 0 15px #000a;display:grid;place-items:center;color:#fbe5a6;font-size:19px;letter-spacing:3px;text-shadow:0 2px 3px #000}
#onePointsPanel .rouletteHub::after{content:'';position:absolute;width:30px;height:30px;bottom:20px;border-radius:50%;background:radial-gradient(circle at 30% 25%,#fff3bf,#c7a34c 45%,#765126);box-shadow:0 5px 7px #0009}
#onePointsPanel .rouletteRotor.spinning{animation:oneWheelSpin 3.2s cubic-bezier(.12,.62,.12,1) both}#onePointsPanel .newSpin .roulettePointer{animation:oneBallBounce 3.2s ease-out}#onePointsPanel .newSpin .rouletteBall{animation:oneNumberReveal 3.2s step-end}@keyframes oneWheelSpin{from{transform:rotate(var(--wheel-start))}to{transform:rotate(var(--wheel-turn))}}@keyframes oneBallBounce{0%{transform:translateX(7px) translateY(-4px)}20%{transform:translateX(-8px)}40%{transform:translateX(6px) translateY(-3px)}60%{transform:translateX(-4px)}80%{transform:translateX(2px)}100%{transform:none}}@keyframes oneNumberReveal{0%{opacity:0}100%{opacity:1}}#onePointsPanel .roulettePointer{position:absolute;top:22px;left:calc(50% - 6px);width:12px;height:12px;background:radial-gradient(circle at 30% 25%,#fff,#e7dcb9 55%,#978565);border-radius:50%;z-index:3;box-shadow:1px 4px 5px #000a}
#onePointsPanel .rouletteBall{position:absolute;right:12px;bottom:8px;width:48px;height:48px;font-size:23px;border-width:2px;box-shadow:0 5px 8px #0008;margin:0;z-index:4}
#onePointsPanel .casinoTable[data-game=blackjack]{border-radius:30px 30px 42% 42% / 24px 24px 45px 45px;padding-bottom:45px;min-height:280px}
#onePointsPanel .casinoTable[data-game=blackjack] p{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e1d2a2}
#onePointsPanel .casinoCards{perspective:600px;min-height:88px;gap:0;margin:10px 0 20px}
#onePointsPanel .casinoCard{display:grid;place-items:center;font-family:Georgia,serif;font-weight:bold;min-width:46px;height:66px;padding:8px;margin:0 -5px;transform:rotateX(15deg) rotate(-7deg);border-radius:8px;background:linear-gradient(115deg,#fffdf0,#eee0c1);border:1px solid #d3bd8d;box-shadow:1px 2px 0 #bfae88,2px 4px 0 #eee0c1,4px 9px 9px #0007;font-size:25px}
#onePointsPanel .casinoCardValue{display:block;font:10px system-ui;letter-spacing:0;opacity:.8}#onePointsPanel .casinoCard:nth-child(2n){transform:translateY(4px) rotateX(15deg) rotate(6deg)}#onePointsPanel .casinoCard.back{color:#ecd191;background:repeating-linear-gradient(45deg,#513264 0 6px,#3d254e 6px 12px);border:3px double #ddbf84}
#onePointsPanel .casinoResult{border-top:1px solid #ebcb8133;padding-top:12px;margin:16px 0 12px;font-weight:700;text-shadow:0 2px 3px #000}
#onePointsPanel .casinoToolbar [aria-pressed=true]{background:linear-gradient(#74518a,#3e274f);border-color:#e3c681;box-shadow:inset 0 1px #fff3}
@media(max-width:360px){#onePointsPanel .casinoTable{padding-left:8px;padding-right:8px}#onePointsPanel .rouletteWheel{width:205px;height:205px}#onePointsPanel .rouletteNumber{transform:rotate(var(--angle)) translateY(-84px);font-size:8px}#onePointsPanel .rouletteHub{inset:40px}#onePointsPanel .rouletteStage{height:230px}#onePointsPanel .casinoReel{height:76px}}
@media(prefers-reduced-motion:reduce){#onePointsPanel .casinoTable.reveal .casinoReel{animation:none}#onePointsPanel .rouletteRotor{transition:none}#onePointsPanel .rouletteRotor.spinning,#onePointsPanel .newSpin .roulettePointer,#onePointsPanel .newSpin .rouletteBall{animation:none}}
`;document.head.append(s);
const shown=new Set();window.ONEWaitRoulette=async root=>{const rotor=root.querySelector('.rouletteRotor');if(!rotor)return;await Promise.all(rotor.getAnimations().filter(a=>a.animationName==='oneWheelSpin').map(a=>a.finished.catch(()=>{})));};window.ONECasinoWheel=(result,spinning=false)=>{const stage=document.createElement('div');stage.className='rouletteStage';stage.setAttribute('aria-label',spinning?'Roue en mouvement':result?'Roulette : '+result.number:'Roue de roulette');const wheel=document.createElement('div');wheel.className='rouletteWheel';wheel.setAttribute('aria-hidden','true');const rotor=document.createElement('div');rotor.className='rouletteRotor';const order=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26],step=360/37;rotor.style.background='conic-gradient(from '+(-step/2)+'deg,'+order.map((n,i)=>(n===0?'#267a50':i%2?'#ad3244':'#191822')+' '+i*step+'deg '+(i+1)*step+'deg').join(',')+')';order.forEach((n,i)=>{const label=document.createElement('span');label.className='rouletteNumber';label.style.setProperty('--angle',i*step+'deg');label.textContent=n;rotor.append(label);});if(result){const end=-order.indexOf(result.number)*step;rotor.style.setProperty('--wheel-turn',end+'deg');rotor.style.setProperty('--wheel-start',(end+1440)+'deg');if(!shown.has(result.id)){rotor.classList.add('spinning');stage.classList.add('newSpin');shown.add(result.id);}}const hub=document.createElement('div');hub.className='rouletteHub';hub.textContent='ONE';const ball=document.createElement('div');ball.className='roulettePointer';wheel.append(rotor,hub,ball);stage.append(wheel);if(result&&!spinning){const badge=document.createElement('div');badge.className='rouletteBall '+result.color;badge.textContent=result.number;stage.append(badge);}return stage;};})();
(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel .oneSlotsSubtitle{font-size:10px;letter-spacing:2px;color:#d8bc85;margin:0 0 14px}
#onePointsPanel .oneSlotsBoard{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;position:relative;padding:7px;background:#100915;border:2px solid #d6b76d;border-radius:14px;box-shadow:inset 0 4px 10px #000,0 3px 0 #f0d79655;overflow:hidden}
#onePointsPanel .oneSlotColumn{display:grid;grid-template-rows:repeat(3,1fr);overflow:hidden;border-radius:8px;background:#f5e5bd;box-shadow:inset 3px 0 6px #5b431e99}
#onePointsPanel .oneSlotCell{display:grid;place-items:center;aspect-ratio:1/1.06;font-size:clamp(21px,5vw,44px);color:#9c2340;font-weight:900;line-height:1;border-bottom:1px solid #967e5155;background:linear-gradient(110deg,#cebb8d,#fff3d4 35%,#f6e5b8 70%,#bfa878);text-shadow:0 3px 2px #0003;position:relative}
#onePointsPanel .oneSlotCell:first-child{box-shadow:inset 0 10px 12px #0005}#onePointsPanel .oneSlotCell:last-child{border:0;box-shadow:inset 0 -10px 12px #0005}
#onePointsPanel .oneSlotCell.isWinning{background:radial-gradient(circle,#fffceb,#ffe599);box-shadow:inset 0 0 0 2px #ffef99,inset 0 0 20px #f0ad37;animation:oneSlotWin .9s ease-out both}
#onePointsPanel .oneSlotLines{position:absolute;inset:7px;width:calc(100% - 14px);height:calc(100% - 14px);pointer-events:none;overflow:visible}
#onePointsPanel .oneSlotLines polyline{fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 3px #231028);stroke-dasharray:900;animation:oneSlotTrace 1s ease-out both}
#onePointsPanel .oneSlotWins{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:15px 0}#onePointsPanel .oneSlotWins button{font-size:11px;padding:7px 9px;background:#180e24}
#onePointsPanel .oneSlotsRules{text-align:left;font-size:12px;margin-top:18px;border-top:1px solid #bfa37755;padding-top:14px}#onePointsPanel .oneSlotsRules summary{cursor:pointer;color:#efda9e;min-height:32px}#onePointsPanel .oneSlotsRules p{font-size:12px;margin:10px 0}
#onePointsPanel .oneSlotsRules table{width:100%;border-collapse:collapse;color:#efe3c0;font-size:13px}#onePointsPanel .oneSlotsRules th,#onePointsPanel .oneSlotsRules td{padding:8px 4px;text-align:center;border-bottom:1px solid #ffffff14}
#onePointsPanel .oneSlotsPaths{display:flex;flex-wrap:wrap;gap:12px;margin:14px 0}#onePointsPanel .oneSlotsPath>div{display:grid;grid-template-columns:repeat(5,8px);gap:3px;margin-top:5px}#onePointsPanel .oneSlotsPath i{height:7px;border-radius:2px;background:#ffffff18}
#onePointsPanel .isSpinning .oneSlotCell{animation:oneSlotRoll .25s linear infinite;animation-delay:var(--reel-delay)}
@keyframes oneSlotRoll{0%{transform:translateY(-20%);filter:blur(2px)}100%{transform:translateY(20%);filter:blur(2px)}}@keyframes oneSlotWin{from{filter:brightness(1.35)}to{filter:brightness(1)}}@keyframes oneSlotTrace{from{stroke-dashoffset:900}to{stroke-dashoffset:0}}
@media(prefers-reduced-motion:reduce){#onePointsPanel .isSpinning .oneSlotCell,#onePointsPanel .oneSlotLines polyline,#onePointsPanel .oneSlotCell.isWinning{animation:none;filter:none}}
`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel .oneSlotColumn{position:relative;perspective:500px;container-type:inline-size}
#onePointsPanel .oneSlotDrum{position:absolute;left:0;right:0;top:50%;height:33.333%;margin-top:-16.666%;transform-style:preserve-3d;animation:oneCylinderSpin .55s linear infinite;z-index:2}
#onePointsPanel .oneSlotDrumFace{position:absolute;inset:0;display:grid;place-items:center;backface-visibility:hidden;font-size:clamp(22px,5vw,44px);font-weight:900;color:#a12845;background:linear-gradient(90deg,#c6b187,#fff2cf 40%,#d3be93);border:1px solid #ab956c;box-sizing:border-box;transform:rotateX(var(--face-angle)) translateZ(125cqw);text-shadow:0 3px 3px #0003}
#onePointsPanel .isSpinning .oneSlotColumn:not(.reelStopped) .oneSlotCell{visibility:hidden;animation:none}
#onePointsPanel .isSpinning .oneSlotColumn.reelStopped .oneSlotCell{visibility:visible;animation:oneReelStopBounce .28s ease-out both}
#onePointsPanel .oneSlotColumn.reelStopped .oneSlotDrum{display:none}
#onePointsPanel .oneSlotDrum.isBraking{animation-duration:1.1s;filter:blur(.3px)}
#onePointsPanel .oneSlotColumn::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(#0006,transparent 24%,transparent 76%,#0006);z-index:3;border-radius:7px}
@keyframes oneCylinderSpin{from{transform:rotateX(0deg)}to{transform:rotateX(-360deg)}}
@keyframes oneReelStopBounce{0%{transform:translateY(-8px)}65%{transform:translateY(3px)}100%{transform:translateY(0)}}
@media(prefers-reduced-motion:reduce){#onePointsPanel .oneSlotDrum{display:none}#onePointsPanel .isSpinning .oneSlotColumn:not(.reelStopped) .oneSlotCell{visibility:visible}#onePointsPanel .isSpinning .oneSlotColumn.reelStopped .oneSlotCell{animation:none}}
`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel .casinoTable{background:radial-gradient(ellipse at 45% 25%,#32634d99,transparent 70%),repeating-linear-gradient(0deg,#163e3000 0 2px,#ffffff04 2px 3px),repeating-linear-gradient(90deg,#ffffff03 0 1px,transparent 1px 3px),#103b2c;box-shadow:inset 0 1px 2px #fff4,inset 0 -15px 30px #0008,0 7px 0 #251917,0 10px 0 #8b6740,0 18px 25px #0007}
#onePointsPanel .rouletteStage{height:345px;perspective:800px;margin:-8px 0 5px}
#onePointsPanel .rouletteWheel{width:290px;height:290px;border:12px solid #73402b;container-type:inline-size;background:linear-gradient(120deg,#efdfac,#765723 25%,#e5c774 55%,#5c401e);transform:rotateX(34deg);box-shadow:0 0 0 2px #e1b876,0 0 0 5px #3d241c,inset 0 0 0 2px #f8e3a0,inset 0 0 0 7px #231814,0 8px 0 #8c5738,0 13px 0 #3e2118,0 18px 0 #69432b,0 28px 25px #000a}
#onePointsPanel .rouletteRotor{inset:6px;border:3px solid #c3a777;box-shadow:inset 0 0 0 1px #fff0c9,inset 0 0 12px #000c}
#onePointsPanel .rouletteNumber{font-size:9px;transform:rotate(var(--angle)) translateY(-41cqw);text-shadow:0 1px #000;top:calc(50% - 7px)}
#onePointsPanel .rouletteHub{inset:22%;border:5px ridge #bd9d62;background:radial-gradient(ellipse at 28% 20%,#d5945755,transparent 50%),repeating-linear-gradient(95deg,#552616 0 2px,#71371d 3px 6px,#482216 8px 9px,#824729 12px 16px);box-shadow:inset 0 0 0 2px #e4b877,inset 0 0 28px #140703,0 4px 12px #000;letter-spacing:2px;font-size:12px;align-items:end;padding-bottom:26px}
#onePointsPanel .rouletteHub::before{content:'';position:absolute;inset:15%;border-radius:50%;border:1px solid #eec49644;box-shadow:inset 0 4px 12px #f0b46722}
#onePointsPanel .rouletteHub::after{width:40px;height:40px;left:calc(50% - 20px);top:calc(50% - 25px);bottom:auto;background:radial-gradient(ellipse at 35% 25%,#fff9d6 0%,#cfaf5f 24%,#73521e 48%,#e3cb8d 62%,#755321 82%);border:3px ridge #c5ad7e;box-shadow:0 9px 0 #745629,0 14px 14px #000b}
#onePointsPanel .roulettePointer{top:12px;width:9px;height:9px;left:calc(50% - 4px);box-shadow:1px 3px 3px #000c}
#onePointsPanel .casinoTable[data-game=blackjack]{padding:30px 20px 65px;border:11px solid #302322;border-radius:80px 80px 42% 42% / 35px 35px 65px 65px;box-shadow:inset 0 0 0 2px #be9760,inset 0 6px 18px #000a,0 2px 0 #b49261,0 12px 0 #181314,0 24px 30px #0008}
#onePointsPanel .oneBlackjackBrand{color:#d5c7958c;font:14px Georgia;letter-spacing:4px;margin-bottom:20px}
#onePointsPanel .casinoCards{gap:6px;min-height:126px;align-items:center;margin-bottom:24px}
#onePointsPanel .casinoCard{display:block;position:relative;width:76px;height:108px;min-width:50px;padding:0;margin:0 -4px;border-radius:6px;background:linear-gradient(125deg,#fffef9,#f4efe2);color:#16181a;font-family:Georgia,serif;box-shadow:1px 2px #b9b09f,2px 3px #f3ede0,3px 6px 10px #0008;transform:rotateX(8deg) rotate(-6deg);overflow:hidden}
#onePointsPanel .casinoCard.red{color:#a7182e}#onePointsPanel .casinoCard.back{border:4px solid #faf3df;background:repeating-linear-gradient(45deg,#36213a 0 3px,#654365 3px 4px,#302139 4px 7px)}
#onePointsPanel .oneCardBackMark{position:absolute;inset:9px;border:1px solid #c9af77;display:grid;place-items:center;font:bold 12px Georgia;color:#d7c08c}
#onePointsPanel .onePlayingCorner{position:absolute;left:4px;top:4px;display:flex;flex-direction:column;align-items:center;font-size:13px;line-height:1;z-index:2}.onePlayingCorner b{font-weight:normal}
#onePointsPanel .onePlayingCorner.onePlayingCornerBottom{left:auto;top:auto;bottom:4px;right:4px;transform:rotate(180deg)}
#onePointsPanel .onePlayingPips{position:absolute;inset:13px 15px 17px}.onePlayingPips i{position:absolute;font-style:normal;font-size:16px;line-height:1}
#onePointsPanel .onePlayingCourt{display:grid;place-items:center;height:80%;font-size:43px;background:repeating-linear-gradient(45deg,#af7e2422 0 4px,transparent 4px 8px);border:1px solid #bc964b;color:inherit}
#onePointsPanel .oneCourtSuit{position:absolute;bottom:0;left:35%;font-size:18px}#onePointsPanel .casinoCardValue{position:absolute;bottom:3px;left:22%;font-size:7px;opacity:.65}
#onePointsPanel .oneTableChips{position:absolute;bottom:27px;left:28px;display:flex;gap:7px;transform:rotateX(25deg)}#onePointsPanel .oneTableChips i{display:grid;place-items:center;width:28px;height:28px;border:4px dashed #e8dbc2;border-radius:50%;font:6px Georgia;color:#eee2c9;box-shadow:0 3px #352f2b,0 5px #d4c1a3,0 8px 7px #0009;background:#7e2634}#onePointsPanel .oneTableChips .ivory{background:#bea985;color:#3c3026}#onePointsPanel .oneTableChips .jade{background:#245a49}
#onePointsPanel .casinoTable[data-game=slots]{border:8px ridge #8b805c;background:linear-gradient(100deg,#06080c,#24232d 30%,#090b12 70%,#30303b);box-shadow:inset 0 0 0 2px #d6c59b,inset 0 0 22px #000,0 10px 0 #26232c,0 14px 0 #9d8b62,0 27px 30px #0009;padding:20px 16px 34px}
#onePointsPanel .slotMarquee{font:20px Georgia;letter-spacing:3px;color:#f8df9a;background:radial-gradient(ellipse,#55413366,transparent),#08090c;border:3px ridge #9a8555;padding:18px 5px;box-shadow:inset 0 0 15px #000,0 1px #ecd8a3;text-shadow:0 0 5px #e7b46466}
#onePointsPanel .oneSlotsBoard{gap:4px;padding:8px;border:5px ridge #ac9b77;background:linear-gradient(#282a2e,#08090c);box-shadow:inset 0 0 15px #000,0 2px 0 #e5d6ad,0 9px 10px #0008}
#onePointsPanel .oneSlotCell,#onePointsPanel .oneSlotDrumFace{background:#131419;border-color:#82765544;padding:0;overflow:hidden}
#onePointsPanel .oneSlotArt{display:block;width:100%;height:100%;background-image:url('ui/one-slot-symbols-real.png?v=01484h');background-size:300% 200%;background-repeat:no-repeat}
#onePointsPanel .oneSlotCell.isWinning{box-shadow:inset 0 0 0 2px #f3d47e;outline:2px solid #f6d478;outline-offset:-3px;z-index:1}
#onePointsPanel .oneSlotCell.isWinning .oneSlotArt{filter:brightness(1.2)}#onePointsPanel .oneSlotColumn::after{background:linear-gradient(#0009,transparent 30%,#ffffff08 50%,transparent 70%,#0009)}
@media(max-width:420px){#onePointsPanel .rouletteWheel{width:230px;height:230px;border-width:9px}#onePointsPanel .rouletteStage{height:290px}#onePointsPanel .rouletteNumber{font-size:8px}#onePointsPanel .casinoTable[data-game=blackjack]{padding:25px 8px 58px;border-width:7px}#onePointsPanel .casinoCard{width:61px;height:91px;min-width:44px}#onePointsPanel .casinoCards{gap:4px}.onePlayingPips i{font-size:12px}#onePointsPanel .oneBlackjackBrand{font-size:10px}#onePointsPanel .casinoTable[data-game=slots]{padding:15px 6px 30px;border-width:5px}#onePointsPanel .oneSlotsBoard{padding:4px;border-width:3px;gap:3px}#onePointsPanel .slotMarquee{font-size:15px}}
`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel:has(.casino){width:min(920px,calc(100vw - 20px));max-height:95dvh}
#onePointsPanel .casino{gap:12px}#onePointsPanel .casinoToolbar{justify-content:center}
#onePointsPanel .oneBettingTable{padding:16px;border:7px ridge #78533c;border-radius:16px;background:radial-gradient(ellipse at 50% 30%,#24624c,#0a3329);box-shadow:inset 0 0 28px #0008;transition:opacity .3s}
#onePointsPanel .oneBettingTable h3{margin:0;color:#f1d998}#onePointsPanel .oneBettingTable p{font-size:12px;color:#d3e2d5}
#onePointsPanel .oneBetScroll{overflow-x:auto;padding:6px 1px 14px;scrollbar-width:thin}
#onePointsPanel .oneBetGrid{display:grid;grid-template-columns:36px repeat(12,minmax(26px,1fr)) 38px;grid-template-rows:repeat(3,42px) 38px 38px;gap:2px;min-width:490px;padding:2px}
#onePointsPanel .casino .oneBetCell{position:relative;margin:0;min-width:0;padding:4px 0;border:1px solid #d9d0a8;border-radius:2px;background:#14583d;color:#fff;font-size:12px;box-shadow:inset 0 1px #fff2}
#onePointsPanel .casino .oneBetCell.red{background:linear-gradient(#b42b35,#7e1520)}#onePointsPanel .casino .oneBetCell.black{background:linear-gradient(#282c2d,#080d0e)}#onePointsPanel .casino .oneBetCell.green{background:#087247}
#onePointsPanel .casino .oneBetCell.hasChip{outline:2px solid #fbe8a8;outline-offset:-2px}
#onePointsPanel .oneBetChip{position:absolute;right:-3px;bottom:-3px;min-width:22px;height:22px;padding:0 2px;display:grid;place-items:center;border:3px dashed #fff0c9;border-radius:50%;background:#213c9b;color:#fff;font:bold 9px system-ui;box-shadow:0 2px #111,0 3px 5px #000b;z-index:2}
#onePointsPanel .isDimmed{opacity:.45}#onePointsPanel .casinoTable.isRolling .rouletteStage{animation:oneWheelCamera 3.2s ease-in-out both}
@keyframes oneWheelCamera{0%,100%{transform:scale(1)}18%,76%{transform:scale(1.13)}}
#onePointsPanel .casinoTable[data-game=blackjack]{max-width:730px;width:100%;box-sizing:border-box;justify-self:center;border-radius:45% 45% 24px 24px / 14% 14% 24px 24px;padding-top:36px;min-height:450px}
#onePointsPanel .oneBlackjackBrand{font-size:17px;letter-spacing:5px;color:#d5c795;margin-bottom:12px}
#onePointsPanel .casinoTable[data-game=blackjack]::before{inset:14px 16px 85px;border:2px solid #dfd2a56b;border-top:0;border-radius:0 0 50% 50%;}
#onePointsPanel .casinoTable[data-game=blackjack] p{margin:8px;font-size:13px;letter-spacing:1px;color:#e3dbb9}
#onePointsPanel .casinoTable[data-game=blackjack] .casinoCards{margin:8px auto 24px;width:fit-content;padding:8px 25px;border:1px solid #e8dfbc55;border-radius:12px;max-width:90%;min-height:112px}
#onePointsPanel .casinoCard:nth-child(even){transform:rotateX(8deg) rotate(5deg)}
#onePointsPanel .casinoTable[data-game=slots]{width:min(100%,550px);box-sizing:border-box;justify-self:center;padding:16px 13px 26px;border:9px ridge #ab9262;border-radius:35px 35px 16px 16px;background:radial-gradient(ellipse at top,#373c74,#14132a 55%,#070811);box-shadow:inset 0 0 0 3px #13111e,0 6px #473854,0 12px #181119,0 18px 18px #0008}
#onePointsPanel .slotMarquee{margin:0 0 8px;padding:12px 4px;letter-spacing:3px;border-radius:20px 20px 4px 4px;color:#fff0a7;font-weight:bold;font-size:18px;background:radial-gradient(ellipse,#562753,#15152b);text-shadow:0 2px #4c231b,0 0 14px #e6b942}
#onePointsPanel .oneSlotMeters{display:grid;grid-template-columns:1.4fr 1fr;gap:7px;margin-bottom:10px}#onePointsPanel .oneSlotMeters>div{border:2px ridge #ccaa62;border-radius:8px;padding:8px 2px;background:linear-gradient(#182043,#060915);box-shadow:inset 0 0 16px #3255c755}
#onePointsPanel .oneSlotMeters small{display:block;color:#e6c879;font-size:9px;letter-spacing:1px}#onePointsPanel .oneSlotMeters strong{font:700 22px Georgia;color:#fff0b8;text-shadow:0 0 10px #eaba4855}
#onePointsPanel .oneSlotsBoard{margin:0 auto 10px;max-width:460px}#onePointsPanel .oneSlotCell{aspect-ratio:1.2;height:auto;min-height:0}
#onePointsPanel .oneSlotSpecial{display:grid;place-items:center;height:100%;width:100%;font:900 clamp(10px,2.7vw,22px) Georgia;letter-spacing:-1px;text-shadow:0 2px #491346;background:radial-gradient(ellipse,#ebbd63,#ab5627 55%,#39131b);color:#fff4b4;box-shadow:inset 0 0 0 4px #bd9454,inset 0 0 0 6px #efdc9a}
#onePointsPanel .oneSlotSpecial.wild{background:radial-gradient(ellipse,#e768f4,#7133ab 60%,#1b173c);color:#fff1a1}#onePointsPanel .oneSlotSpecial.bonus{border-radius:50%;width:90%;height:90%;margin:5%;font-size:clamp(9px,2.5vw,18px)}
#onePointsPanel .oneSlotDashboard{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}#onePointsPanel .oneSlotDashboard>div{border:1px solid #9e884e;border-radius:5px;background:#050709;padding:6px 2px}#onePointsPanel .oneSlotDashboard small{display:block;font-size:9px;color:#c7c2ab}#onePointsPanel .oneSlotDashboard strong{font:18px ui-monospace,monospace;color:#f4d889}
#onePointsPanel .oneBonusBanner{margin:8px;padding:10px;border:2px solid #f0d27b;background:linear-gradient(90deg,#57325e,#302958);color:#fff1aa;font-weight:900;animation:oneBonusGlow 1.2s ease-in-out 3 alternate}
@keyframes oneBonusGlow{to{box-shadow:0 0 22px #ebc168;filter:brightness(1.2)}}
#onePointsPanel .oneSlotsRules{margin:8px 0 0;text-align:left;font-size:12px}#onePointsPanel .oneSlotsRules summary{cursor:pointer;padding:7px}#onePointsPanel .oneSlotsRules table{width:100%}
#onePointsPanel .oneSlotWins{margin:5px 0}#onePointsPanel .casino .oneSlotWins button{font-size:11px;padding:5px 8px}
#onePointsPanel .casinoTable[data-game=slots] .casinoResult{margin:10px 0 0;font-size:16px}
@media(max-width:500px){#onePointsPanel .casinoTable[data-game=slots]{border-width:6px;padding:12px 7px 22px}#onePointsPanel .oneSlotMeters strong{font-size:18px}#onePointsPanel .slotMarquee{font-size:15px}#onePointsPanel .oneBettingTable{padding:10px;border-width:4px}#onePointsPanel .casinoTable[data-game=blackjack]{min-height:395px}#onePointsPanel .oneBlackjackBrand{font-size:12px}#onePointsPanel .casinoTable[data-game=blackjack] .casinoCards{padding:7px 13px}}
@media(prefers-reduced-motion:reduce){#onePointsPanel .casinoTable.isRolling .rouletteStage,#onePointsPanel .oneBonusBanner{animation:none}}
`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel .oneJackpotCelebration{position:relative;overflow:hidden;padding:22px 8px;margin:12px 0;border:3px ridge #ffdd87;border-radius:14px;background:radial-gradient(ellipse at center,#644422,#221332 70%);color:#ffe9a5;text-align:center;box-shadow:0 0 25px #e7b54a66;animation:oneJackpotEntrance .7s cubic-bezier(.15,1.4,.4,1) both}
#onePointsPanel .oneJackpotCelebration small,#onePointsPanel .oneJackpotCelebration strong,#onePointsPanel .oneJackpotCelebration b{position:relative;display:block;z-index:2;text-shadow:0 2px 4px #000}#onePointsPanel .oneJackpotCelebration small{font-size:9px;letter-spacing:4px}#onePointsPanel .oneJackpotCelebration strong{font:900 clamp(28px,7vw,44px) Georgia;letter-spacing:3px}#onePointsPanel .oneJackpotCelebration b{font-size:20px}
#onePointsPanel .oneJackpotCelebration i{position:absolute;left:var(--x);top:-32px;display:grid;place-items:center;width:24px;height:24px;border:3px ridge #ffe699;border-radius:50%;background:radial-gradient(circle at 30% 20%,#fff1a1,#c99525);color:#78501e;font:700 7px Georgia;animation:oneJackpotCoin 2.4s var(--delay) ease-in 2 both}
@keyframes oneJackpotEntrance{from{opacity:0;transform:scale(.75)}to{opacity:1;transform:scale(1)}}
@keyframes oneJackpotCoin{from{transform:translate(0,-20px) rotateY(0)}to{transform:translate(var(--drift),235px) rotateY(720deg) rotate(150deg)}}
@media(prefers-reduced-motion:reduce){#onePointsPanel .oneJackpotCelebration{animation:none}#onePointsPanel .oneJackpotCelebration i{display:none}}
`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel:has(.casinoTable[data-game=slots]){width:min(810px,calc(100vw - 16px))}
#onePointsPanel:has(.casino) .onePointsHead{padding:12px 18px}
#onePointsPanel .casino:has([data-game=slots]){gap:9px}
#onePointsPanel .casinoTable[data-game=slots]{width:min(100%,430px);padding-bottom:20px;border:7px solid #29252d;outline:2px solid #bf9655;box-shadow:inset 3px 0 0 #54a0ff,inset -3px 0 0 #bd6cec,0 0 12px #517cda77,0 10px 0 #101219,0 17px 0 #322d36,0 21px 18px #0009}
#onePointsPanel .oneSlotControlDeck{position:relative;margin:12px -8px -8px;padding:12px 8px 8px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:4px ridge #aa9262;border-radius:4px 4px 12px 12px;background:linear-gradient(#323a55,#111727 32%,#202337);box-shadow:inset 0 2px #c6b28a55,0 3px #070911}
#onePointsPanel .casino .oneSlotControlDeck>button{border:3px ridge #f8d07a;background:radial-gradient(ellipse at top,#ffe395,#c99439);color:#23161b;font-weight:900;box-shadow:0 4px #694320,0 6px 10px #0009;min-height:50px;max-width:55%;font-size:12px;letter-spacing:.4px}
#onePointsPanel .casino .oneSlotControlDeck select{font-size:12px;padding:7px;background:#0b1020;border-color:#a5a2b7}#onePointsPanel .oneSlotControlDeck label{font-size:11px}#onePointsPanel .oneSlotControlDeck .casinoToolbar{gap:0}
#onePointsPanel .casinoTable[data-game=slots] .slotMarquee{font-size:15px;padding:8px 2px;margin-bottom:6px}#onePointsPanel .casinoTable[data-game=slots] .oneSlotMeters{margin-bottom:6px}#onePointsPanel .casinoTable[data-game=slots] .oneSlotMeters>div{padding:5px 2px}
#onePointsPanel .casinoTable[data-game=slots] .oneSlotMeters strong{font-size:18px}
#onePointsPanel .casino:has([data-game=slots])>p:not(.casinoNotice){font-size:11px;margin:2px 0}
#onePointsPanel .casino:has([data-game=slots]) .casinoBalance{font-size:17px}
#onePointsPanel .casino:has([data-game=slots])>.casinoToolbar button{font-size:12px;padding:7px 10px}
#onePointsPanel .casino:has([data-game=slots])>.casinoToolbar:first-child{margin:0}
@media(min-width:700px){#onePointsPanel .casino:has([data-game=slots]){grid-template-columns:1fr 1fr}#onePointsPanel .casino:has([data-game=slots])>.casinoToolbar{grid-column:span 1}#onePointsPanel .casino:has([data-game=slots])>.casinoTable,#onePointsPanel .casino:has([data-game=slots])>p{grid-column:1/-1}}
`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel:has(.casino) header{padding:8px 16px}#onePointsPanel:has(.casino) h2{font-size:19px}
#onePointsPanel:has(.casino) .onePointsTabs{padding:8px 14px 0}#onePointsPanel:has(.casino) .onePointsTabs button{min-height:36px;font-size:12px}
#onePointsPanel:has(.casino) .onePointsBody{padding:12px 14px}
#onePointsPanel .casinoTable[data-game=slots]{width:min(100%,355px);border-radius:12px 12px 25px 25px;background:linear-gradient(100deg,#193ea0,#50206e 45%,#17275d);border-color:#111732;outline:2px solid #405eff;box-shadow:inset 3px 0 #62eaff,inset -3px 0 #ee72ff,0 0 8px #377bff,0 0 22px #5f35ef66,0 9px #0b1230,0 12px #64719d,0 19px #111522,0 23px 18px #0008;padding:8px 8px 23px}
#onePointsPanel .oneCabinetTop{height:77px;position:relative;border:3px solid #373ef6;border-left-color:#7f97ff;border-right-color:#c73dfa;box-shadow:0 0 7px #9b63ff,inset 0 0 10px #07348c;background:url('ui/one-slot-dragon-banner.png?v=01484j') center 42%/cover;border-radius:5px;margin:0 0 6px}
#onePointsPanel .oneCabinetTop::after{content:'';position:absolute;inset:0;background:linear-gradient(120deg,#fff2,transparent 45%,#fff1 46%,transparent 65%);pointer-events:none}
#onePointsPanel .casinoTable[data-game=slots] .slotMarquee{background:linear-gradient(100deg,#272088,#a01583 40%,#e96b1d 75%,#70266c);font-size:13px;padding:5px 1px;border-color:#ffc747;border-radius:4px;text-shadow:0 2px #721721,0 0 8px #ffe35a;letter-spacing:1px}
#onePointsPanel .oneSlotMeters>div:first-child{background:linear-gradient(#a82754,#6b1027);border-color:#ffc453;box-shadow:inset 0 0 12px #ff8f4a66,0 0 4px #ff64b1}
#onePointsPanel .oneSlotMeters>div:last-child{background:linear-gradient(#178b77,#044841);border-color:#84e885;box-shadow:inset 0 0 12px #46dfbd66}
#onePointsPanel .casinoTable[data-game=slots] .oneSlotsBoard{border-color:#ffc24a;background:#111e60;padding:5px;gap:3px;box-shadow:0 0 0 2px #2839d1,0 0 12px #5291ff}
#onePointsPanel .oneSlotCell,#onePointsPanel .oneSlotDrumFace{background:linear-gradient(#153269,#131739 50%,#29204d);border-color:#70a2ff44}
#onePointsPanel .oneSlotArt{mix-blend-mode:screen;filter:saturate(1.35) brightness(1.12)}
#onePointsPanel .casinoTable[data-game=slots] .oneSlotsRules{padding-top:0;margin:4px 0 0;border-top:0}#onePointsPanel .casinoTable[data-game=slots] .oneSlotsRules summary{min-height:0;padding:5px;font-size:10px}
#onePointsPanel .casinoTable[data-game=slots] .oneSlotDashboard{margin:7px 0;gap:4px}#onePointsPanel .casinoTable[data-game=slots] .oneSlotDashboard>div{padding:4px 1px;background:linear-gradient(#151c4f,#070c23);border-color:#aa8ef3}#onePointsPanel .casinoTable[data-game=slots] .oneSlotDashboard strong{font-size:15px}
#onePointsPanel .oneSlotControlDeck{background:linear-gradient(#5661b5,#131739 35%,#292856);border-color:#796ee6;padding:8px 5px 10px;min-height:48px;margin:7px -2px -10px}
#onePointsPanel .casino .oneSlotControlDeck>button{background:radial-gradient(ellipse at top,#ffd258,#f45c21 75%);color:#fffbe0;border-color:#ffdb64;text-shadow:0 1px #963529;box-shadow:0 3px #9a2b22,0 0 12px #ff8f3644;min-height:43px;font-size:11px}
@media(min-height:880px) and (min-width:650px){#onePointsPanel .casinoTable[data-game=slots]{width:410px}#onePointsPanel .oneCabinetTop{height:105px}}
@media(max-width:500px){#onePointsPanel .casino:has([data-game=slots]) .casinoBalance{font-size:14px}#onePointsPanel .casino:has([data-game=slots])>.casinoToolbar button{padding:5px 8px;min-height:32px;font-size:11px}#onePointsPanel .casino:has([data-game=slots])>.casinoToolbar{gap:6px}#onePointsPanel:has([data-game=slots]) .onePointsBody{padding:10px 9px}#onePointsPanel .casinoTable[data-game=slots]{max-width:330px}}
`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel .casino .casinoCard{box-sizing:border-box;width:76px;height:108px;min-width:50px;padding:0}
#onePointsPanel .casinoTable[data-game=blackjack] .casinoCards{min-height:105px}
#onePointsPanel .casinoTable[data-game=slots]{margin-bottom:8px}
@media(max-width:500px){#onePointsPanel .casino .casinoCard{width:61px;height:91px;min-width:44px}}
`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel .casino{min-width:0;max-width:100%;width:100%;box-sizing:border-box}#onePointsPanel .casino>*{min-width:0;box-sizing:border-box}
#onePointsPanel .oneBettingTable{min-width:0;max-width:100%;overflow:hidden}#onePointsPanel .oneBetScroll{width:100%;min-width:0;max-width:100%;box-sizing:border-box}
#onePointsPanel .casinoToolbar{min-width:0}#onePointsPanel .casinoBalance{overflow-wrap:anywhere}
`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`#onePointsPanel .oneSlotSpecial{font-size:22cqw;letter-spacing:0}#onePointsPanel .oneSlotSpecial.bonus{font-size:19cqw}#onePointsPanel .oneSlotsPaths{overflow:hidden}`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`#onePointsPanel .oneSlotCell.isWinning{background:radial-gradient(ellipse,#453769,#12284b);box-shadow:inset 0 0 0 2px #ffdf83,inset 0 0 12px #eda92b66}#onePointsPanel .oneSlotCell.isWinning .oneSlotArt{filter:brightness(1.15) saturate(1.25)}`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`
#onePointsPanel .casinoTable[data-game=slots]{animation:none;transform:none;overflow-anchor:none}
#onePointsPanel .casino:has([data-game=slots]){overflow-anchor:none}
#onePointsPanel .casinoTable[data-game=slots] .oneSlotWins{height:32px;min-height:32px;max-height:32px;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;justify-content:flex-start;align-items:center;margin:4px 0;scrollbar-width:thin}
#onePointsPanel .casino .oneSlotWins button{flex:none;min-height:26px;max-height:26px;padding:4px 7px;white-space:nowrap}
#onePointsPanel .casinoTable[data-game=slots] .casinoResult{height:42px;min-height:42px;max-height:42px;display:flex;justify-content:center;align-items:center;box-sizing:border-box;margin:5px 0 0;padding:3px 1px;font-size:12px;line-height:17px;overflow:auto}
#onePointsPanel .casino .oneSlotControlDeck{display:grid;grid-template-columns:minmax(90px,1fr) minmax(0,1.5fr);height:74px;min-height:74px;box-sizing:border-box;align-items:center}
#onePointsPanel .casino .oneSlotControlDeck>button{width:100%;max-width:none;height:50px;min-height:50px;max-height:50px;font-size:11px;line-height:14px;padding:4px 7px}
#onePointsPanel .oneSlotControlDeck label{display:flex;flex-direction:column;gap:3px;text-align:left}
#onePointsPanel .oneSlotControlDeck select{width:100%;box-sizing:border-box}
#onePointsPanel .oneJackpotCelebration,#onePointsPanel .oneBonusBanner{position:absolute;top:35%;left:5%;right:5%;z-index:20;pointer-events:none;box-shadow:0 0 0 8px #17112bd9,0 0 35px #ffd76b;}
`;document.head.append(s);})();
(()=>{const s=document.createElement('style');s.textContent=`#onePointsPanel .casino .casinoTable[data-game=slots]{animation:none;transform:none}`;document.head.append(s);})();
