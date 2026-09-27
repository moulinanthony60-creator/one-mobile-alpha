(()=>{
 'use strict';
 const {el,button}=ONEUI;
 const sources=[['youtube','YouTube','▶'],['tiktok','TikTok','♪'],['twitch','Twitch','◉'],['audio','Musique','♫'],['one','ONE','▷']];
 // Same platform marks as ONE's icon set, drawn as vectors at every screen size.
 const platformMarks={
  youtube:'<rect x="1" y="4.5" width="22" height="15" rx="5" fill="#ff0033"/><path d="m10 8 6.5 4-6.5 4Z" fill="#fff"/>',
  tiktok:'<path d="M14 3v12a5 5 0 1 1-5-5" fill="none" stroke="#25f4ee" stroke-width="4" transform="translate(-1 1)"/><path d="M14 3c0 4 3 6 6 6M14 3v12a5 5 0 1 1-5-5" fill="none" stroke="#fe2c55" stroke-width="3" transform="translate(1 0)"/><path d="M14 3c0 4 3 6 6 6M14 3v12a5 5 0 1 1-5-5" fill="none" stroke="#fff" stroke-width="2.5"/>',
  twitch:'<path d="M4 2h18v13l-6 6h-5l-4 3v-3H2V6Z" fill="#9146ff"/><path d="M6 4h14v10l-4 4h-5l-3 3v-3H6Z" fill="#fff"/><path d="M10 7v6m6-6v6" stroke="#9146ff" stroke-width="2"/>',
  audio:'<path d="M9 17V5l12-2v12M9 9l12-2" fill="none" stroke="#ff69d4" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="5.5" cy="18" rx="4" ry="3" fill="#ff69d4"/><ellipse cx="17.5" cy="16" rx="4" ry="3" fill="#6cf5ff"/>',
  one:'<rect x="1" y="1" width="22" height="22" rx="7" fill="#713fee"/><rect x="3" y="3" width="18" height="18" rx="5.5" fill="#a06aff"/><path d="m10 7 7 5-7 5Z" fill="#fff"/><path d="M6 5h5" stroke="#e3ceff" stroke-width="1.5" stroke-linecap="round"/>'
 };
 function platformLogo(id){const mark=el('span',undefined,'ot-platform-logo');mark.setAttribute('aria-hidden','true');mark.innerHTML='<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">'+platformMarks[id]+'</svg>';return mark;}
 function create({choose}){
  let source='youtube',query='',cursor='',request=0,controller=null,disposed=false,canChoose=false,host=false,roomId='',loading=false,seen=new Set(),sessionKey='';
  const root=el('details',undefined,'ot-browser');root.open=true;
  const summary=el('summary'),heading=el('span');heading.append(el('b','Que regarde-t-on ?'),el('small','Parcours les contenus · choisis pour ton salon'));
  summary.append(el('span','◈','ot-browser-icon'),heading,el('span','⌄','ot-browser-arrow'));root.append(summary);
  const body=el('div',undefined,'ot-browser-body'),nav=el('nav',undefined,'ot-platforms');nav.setAttribute('aria-label','Parcourir les plateformes');
  const hint=el('p',undefined,'ot-catalog-hint'),form=el('form',undefined,'ot-search'),input=el('input'),submit=button('Rechercher');
  input.type='search';input.maxLength=120;input.setAttribute('aria-label','Rechercher un contenu');submit.type='submit';form.append(input,submit);
  const toolbar=el('div',undefined,'ot-browse-tools'),feed=button('Mon flux ONE',()=>{input.value='';query='';load(false);}),discover=button('Découvrir',()=>{input.value='';query='';load(true);});toolbar.append(feed,discover);
  const status=el('p',undefined,'ot-browse-status');status.setAttribute('role','status');
  const recovery=el('div',undefined,'ot-browse-recovery'),grid=el('div',undefined,'ot-results'),more=button('Voir plus',()=>load(false,true),'ot-more');more.hidden=true;
  grid.setAttribute('aria-label','Contenus à regarder ensemble');
  body.append(nav,hint,form,toolbar,status,recovery,grid,more);root.append(body);
  function updateButtons(){for(const b of grid.querySelectorAll('button')){b.disabled=!canChoose;b.hidden=b.dataset.otAction==='select'&&!host;}submit.disabled=loading;more.disabled=loading;}
  function card(item){
   const article=el('article',undefined,'ot-content');article.dataset.contentKey=item.key;
   const art=el('div',undefined,'ot-content-art');art.dataset.otSource=item.source;
   art.append(el('span',sources.find(x=>x[0]===item.source)?.[2]||'▶','ot-content-symbol'));
   if(item.thumbnail){const img=el('img');img.src=item.thumbnail;img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>img.remove();art.append(img);}
   art.append(el('span',item.live?'● EN DIRECT':sources.find(x=>x[0]===item.source)?.[1]||'ONE','ot-content-badge'));
   const title=el('h3',item.title),creator=el('p',item.creator||'Vidéo publique'),actions=el('div',undefined,'ot-content-actions');
   async function send(action){
    if(!canChoose||disposed||(action==='select'&&!host))return;
    const targetRoom=roomId,generation=request;
    const ok=await choose(action,{url:item.url,title:item.title,source:item.source});
    if(disposed||targetRoom!==roomId||generation!==request)return;
    if(ok&&action==='select'){root.open=false;document.getElementById('oneTogether')?.querySelector('.ot-player')?.scrollIntoView({block:'start',behavior:'smooth'});}
    else if(ok)status.textContent='« '+item.title+' » ajouté à la file du salon.';
   }
   const watch=button('Regarder ensemble',()=>send('select'),'os-primary'),queue=button('＋ File',()=>send('enqueue'));queue.setAttribute('aria-label','Ajouter à la file : '+item.title);
   watch.dataset.otAction='select';queue.dataset.otAction='enqueue';queue.textContent='＋ Proposer';actions.append(watch,queue);article.append(art,title,creator,actions);return article;
  }
  async function load(remote=false,append=false){
   const own=++request;controller?.abort();controller=new AbortController();loading=true;recovery.replaceChildren();status.textContent='Chargement des contenus…';grid.setAttribute('aria-busy','true');
   if(!append){cursor='';seen=new Set();grid.replaceChildren();more.hidden=true;}
   updateButtons();
   try{
    const result=await ONETogetherCatalog.browse(source,{query,cursor:append?cursor:'',remote,signal:controller.signal});
    if(disposed||own!==request)return;
    for(const item of result.items)if(!seen.has(item.key)){seen.add(item.key);grid.append(card(item));}
    cursor=result.cursor;more.hidden=!cursor;
    status.textContent=seen.size?seen.size+' contenu'+(seen.size>1?'s':'')+(result.local?' de ton flux ONE':''):
     source==='one'?'Aucune vidéo ONE publiée pour le moment.':source==='audio'?'Ta playlist est vide. Ajoute des vidéos avec « ＋ Playlist » dans YouTube sur ONE.':query?'Aucun contenu trouvé. Essaie un autre mot ou un autre créateur.':source==='tiktok'?'Aucune vidéo TikTok dans ton catalogue ONE pour le moment.':'Aucun contenu disponible pour le moment.';
   }catch(e){
    if(disposed||own!==request||e.name==='AbortError')return;
    status.textContent=e.name==='TimeoutError'?'La plateforme met trop de temps à répondre. Réessaie dans quelques instants.':e.message;
    recovery.append(button('Réessayer',()=>load(remote,append)));
    if(e.connect){const provider=e.connect;recovery.append(button('Connecter '+sources.find(x=>x[0]===provider)?.[1],()=>window.ONEConnections?.connect(provider),'os-primary'));}
   }finally{if(!disposed&&own===request){loading=false;grid.setAttribute('aria-busy','false');updateButtons();}}
  }
  function pick(id){
   source=id;query='';input.value='';root.dataset.otSource=id;
   for(const b of nav.children)b.setAttribute('aria-pressed',String(b.dataset.otSource===id));
   input.placeholder=id==='twitch'?'Rechercher une chaîne en direct…':id==='tiktok'?'Rechercher dans ton catalogue TikTok…':id==='audio'?'Rechercher dans ta playlist…':'Vidéo, thème, créateur…';
   hint.textContent=id==='tiktok'?'Les vidéos TikTok disponibles dans ONE. La recherche porte sur ce catalogue.':id==='twitch'?'Les directs Twitch, à regarder ensemble ici.':id==='audio'?'Retrouve ta playlist musique de ONE.':id==='one'?'Tes vidéos ONE publiées apparaîtront ici. Les aperçus locaux ne sont pas encore partagés.':'Retrouve ton flux ou recherche une vidéo YouTube.';
   discover.hidden=!['youtube','twitch'].includes(id);form.hidden=toolbar.hidden=id==='one';load();
  }
  for(const [id,label]of sources){const b=button('',()=>pick(id));b.dataset.otSource=id;b.append(platformLogo(id),el('span',label,'ot-platform-name'));nav.append(b);}
  form.onsubmit=e=>{e.preventDefault();query=input.value.trim();load(true);};
  const onCatalogue=()=>{if(source==='tiktok'&&!loading&&root.open)load();};window.addEventListener('one-catalogue-state',onCatalogue);
  pick(source);
  return {root,setMedia(key){if(key===sessionKey)return;sessionKey=key;root.open=!key;},update(next){host=!!next.host;canChoose=!!next.roomId&&next.ready&&!next.busy;roomId=next.roomId||'';summary.querySelector('small').textContent=host?'Choisis un contenu pour ton salon':'Propose une vidéo · file commune du salon';updateButtons();},destroy(){disposed=true;request++;controller?.abort();root.remove();window.removeEventListener('one-catalogue-state',onCatalogue);}};
 }
 window.ONETogetherBrowser={create};
})();
