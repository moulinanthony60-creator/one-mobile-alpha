(()=>{
  const clean=()=>{
    document.querySelectorAll('.oneCollectible.isMissing .oneCardImage').forEach(e=>{e.style.backgroundImage='none';e.style.backgroundColor='#241a35';e.textContent='?';});
    document.querySelectorAll('#onePointsPanel button').forEach(b=>{if(b.textContent.trim()==='Poker')b.hidden=true;});
  };
  clean();new MutationObserver(clean).observe(document.body,{childList:true,subtree:true});
})();
