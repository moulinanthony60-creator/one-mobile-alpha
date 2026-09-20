(()=>{const style=document.createElement('style');style.textContent=`
#onePointsPanel[open]>header{position:sticky;top:0;z-index:50;background:#251b32;box-shadow:0 4px 12px #0003}
#onePointsPanel .casino .onePlayingCornerBottom{position:absolute;width:auto;height:auto;left:auto;right:4px;top:auto;bottom:4px;padding:0;background:none;border:0;backdrop-filter:none;z-index:2;transform:rotate(180deg)}
@media(max-width:600px){
#onePointsPanel .casino .rouletteWheel{width:180px;height:180px;border-width:7px}
#onePointsPanel .casino .rouletteStage{height:220px;margin:0}
#onePointsPanel .casino .rouletteNumber{font-size:6.5px}
#onePointsPanel .casino .rouletteHub{inset:30px;border-width:3px;font-size:13px}
#onePointsPanel .casinoTable[data-game=roulette]{padding:12px 6px 24px;min-height:0}
#onePointsPanel .oneBettingTable{padding:9px 5px;border-width:3px}
#onePointsPanel .oneBetGrid{min-width:0;width:100%;box-sizing:border-box;grid-template-columns:16px repeat(12,minmax(0,1fr)) 18px;grid-template-rows:repeat(3,30px) 34px 32px;gap:1px}
#onePointsPanel .casino .oneBetCell{min-height:0;font-size:8px;padding:1px;line-height:1.15;touch-action:manipulation}
#onePointsPanel .oneBetScroll{overflow-x:hidden;padding:5px 1px 10px}
#onePointsPanel .oneBetChip{min-width:12px;height:12px;font-size:6px;right:-1px;bottom:-1px;border-width:1px;padding:0 1px}
#onePointsPanel .oneBettingTable h3{font-size:15px}#onePointsPanel .oneBettingTable p{font-size:11px}
#onePointsPanel .casinoToolbar{gap:6px}#onePointsPanel .casino>.casinoToolbar button{font-size:12px;padding:7px 9px}#onePointsPanel .casinoBalance{font-size:18px}
}
`;document.head.append(style);})();
