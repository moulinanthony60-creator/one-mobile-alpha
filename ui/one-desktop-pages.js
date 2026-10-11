(()=>{
 const pages=['discover','moments','home','social','ai'], names=['Découvrir','Moments','Accueil','Messages','ONE IA'];
 const blocked=t=>ONEAudit.navigationBlocked(t);
 const index=()=>pages.indexOf(window.oneCurrentSpace?.()||'home');
 const modal=()=>ONEAudit.hasOverlay();
 function go(delta){const i=index();if(i<0||modal()||!pages[i+delta])return;window.oneShowSpace?.(pages[i+delta]);sync();}
 const nav=document.createElement('nav');nav.className='oneDesktopPages';nav.setAttribute('aria-label','Navigation entre les écrans ONE');
 const left=document.createElement('button'),right=document.createElement('button');for(const b of [left,right])b.type='button';nav.append(left,right);document.body.append(nav);left.onclick=()=>go(-1);right.onclick=()=>go(1);
 function sync(){const i=index();nav.hidden=i<0;left.disabled=i<=0;right.disabled=i>=pages.length-1;left.textContent='‹ '+(names[i-1]||'Découvrir');right.textContent=(names[i+1]||'ONE IA')+' ›';}
 window.addEventListener('one-space-open',sync);sync();
 let start=null,swiped=false;
 document.addEventListener('pointerdown',e=>{start=null;if(e.pointerType!=='mouse'||e.button!==0||blocked(e.target)||modal()||index()<0)return;start={x:e.clientX,y:e.clientY,id:e.pointerId};},true);
 document.addEventListener('pointerup',e=>{const s=start;start=null;if(!s||e.pointerId!==s.id)return;const dx=e.clientX-s.x,dy=e.clientY-s.y;if(Math.abs(dx)<90||Math.abs(dx)<Math.abs(dy)*1.5)return;swiped=true;go(dx<0?1:-1);window.getSelection()?.removeAllRanges();setTimeout(()=>{swiped=false},0);},true);
 document.addEventListener('pointercancel',()=>start=null,true);window.addEventListener('blur',()=>start=null);
 document.addEventListener('click',e=>{if(swiped){e.preventDefault();e.stopImmediatePropagation();}},true);
})();



