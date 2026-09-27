(()=>{
 const style=document.createElement('link');style.rel='stylesheet';style.href='ui/table-themes-117af.css?v=117af';document.head.append(style);const finish=document.createElement('link');finish.rel='stylesheet';finish.href='ui/game-finish-118.css?v=118r2';document.head.append(finish);
 const emblems={trio:'Ⅲ',codes:'◈',who:'?',connect:'●',timer:'◷',wolf:'☾'};
 let details=[],gameId=null;
 window.addEventListener('one-game-before-render',()=>{gameId=document.querySelector('.pc-game')?.dataset.gameId;details=[...document.querySelectorAll('.pc-arena details')].map(d=>d.open);});
 window.addEventListener('one-game-rendered',()=>{
  const root=document.querySelector('#onePartyGame .pc-game');if(!root)return;
  const kind=Object.keys(emblems).find(k=>root.classList.contains('pc-'+k));
  if(kind&&!root.querySelector('.pc-emblem')){const icon=document.createElement('div');icon.className='pc-emblem';icon.setAttribute('aria-hidden','true');icon.textContent=emblems[kind];root.querySelector('header').prepend(icon);}
  root.querySelectorAll('.pc-arena details').forEach((d,i)=>d.open=root.dataset.gameId===gameId&&!!details[i]);details=[];
 });
 window.addEventListener('one-account-changed',()=>details=[]);
})();
