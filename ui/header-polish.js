(()=>{
 'use strict';
 const row=document.querySelector('.brandrow'),tools=row?.querySelector('.oneHeaderTools'),points=document.getElementById('onePointsToggle');if(!row||!tools||!points)return;
 row.classList.add('one-header-clear');row.insertBefore(points,document.getElementById('accountBtn'));
 const roomBadge=document.getElementById('oneRoomCapsule');if(roomBadge)row.insertBefore(roomBadge,points);
 const icons={
  oneShopToggle:['Boutique','#ed9aff','<path d="M5 7h14l1 14H4L5 7Z" fill="#933dde"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="#fff"/>'],
  oneSearchToggle:['Recherche','#67ddff','<circle cx="10" cy="10" r="6" fill="#1b698c"/><path d="m15 15 6 6" stroke-width="3"/>'],
  oneFriendsToggle:['Amis','#bda0ff','<circle cx="9" cy="7" r="3" fill="#c0a2ff"/><path d="M3 21v-4a6 6 0 0 1 12 0v4" fill="#7042c2"/><path d="M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5v2"/>'],
  oneSalonsToggle:['Salons','#64edd0','<rect x="2" y="3" width="20" height="15" rx="5" fill="#126e65"/><path d="m7 18-1 4 6-4M7 10h.01M12 10h.01M17 10h.01" stroke-width="2.5"/>'],
  oneNotificationsToggle:['Alertes','#ffbd71','<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Z" fill="#a56123"/><path d="M10 21h4M12 2v2"/>']
 };
 for(const [id,[label,color,art]]of Object.entries(icons)){
  const b=document.getElementById(id);if(!b)continue;
  const svg=b.querySelector('svg');if(svg){svg.setAttribute('viewBox','0 0 24 24');svg.innerHTML=art;svg.style.color=color;}
  let text=[...b.children].find(n=>n.tagName==='SPAN'&&!n.className&&!n.id);if(!text){text=document.createElement('span');b.append(text);}text.textContent=label;text.classList.add('one-header-label');
  b.title=b.getAttribute('aria-label')||label;b.style.setProperty('--header-accent',color);
 }
 const label=[...points.children].find(n=>n.tagName==='SPAN'&&!n.className);if(label)label.textContent='Points ONE';
 const style=document.createElement('link');style.rel='stylesheet';style.href='ui/header-polish.css?v=118c2';document.head.append(style);
})();
