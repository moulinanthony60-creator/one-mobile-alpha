(()=>{
  const names=['Sylvaris','Ignéon','Aqualune','Rocéleste','Myrkane','Solarys','Brumacier','Virevolt','Célestine','Nébulyx','Fulgor','Racinaire'];
  for(let n=51;n<=100;n++)window.ONECollectionCards?.push({id:'one-'+String(n).padStart(3,'0'),number:n,name:n===99?'Aethérion':n===100?'Nyxara':names[n%names.length],rarity:n>=99?'ultra-legendary':n>=91?'legendary':n>=76?'epic':n>=61?'rare':'normal'});
  const fix=()=>{document.querySelectorAll('*').forEach(e=>{if(e.children.length===0&&e.textContent?.includes('/ 50'))e.textContent=e.textContent.replace('/ 50','/ 100');});document.querySelectorAll('progress').forEach(e=>{if(e.max===50)e.max=100;});document.querySelectorAll('.oneCollectible').forEach(card=>{const m=card.textContent.match(/#(\d+)/);const n=m&&+m[1],art=card.querySelector('.oneCardImage');if(n>=51&&n<=100&&art){const k=n-51,src=k<25?'one-new-cards-a.png':'one-new-cards-b.png',i=k%25;art.style.backgroundImage=`url("ui/${src}?v=01489")`;art.style.backgroundSize='500% 500%';art.style.backgroundPosition=((i%5)*25)+'% '+(Math.floor(i/5)*25)+'%';}});};
  new MutationObserver(fix).observe(document.body,{childList:true,subtree:true});
})();
