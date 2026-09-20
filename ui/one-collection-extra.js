(()=>{
  const names=['Sylvaris','Ignéon','Aqualune','Rocéleste','Myrkane','Solarys','Brumacier','Virevolt','Célestine','Nébulyx','Fulgor','Racinaire'];
  for(let n=51;n<=100;n++)window.ONECollectionCards?.push({id:'one-'+String(n).padStart(3,'0'),number:n,name:n===99?'Aethérion':n===100?'Nyxara':names[n%names.length],rarity:n>=99?'ultra-legendary':n>=91?'legendary':n>=76?'epic':n>=61?'rare':'normal'});
  const fix=()=>{document.querySelectorAll('*').forEach(e=>{if(e.children.length===0&&e.textContent?.includes('/ 50'))e.textContent=e.textContent.replace('/ 50','/ 100');});document.querySelectorAll('progress').forEach(e=>{if(e.max===50)e.max=100;});};
  new MutationObserver(fix).observe(document.body,{childList:true,subtree:true});
})();
