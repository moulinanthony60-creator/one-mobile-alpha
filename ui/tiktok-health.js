/* User-started, read-only catalogue check. Nothing is removed or published. */
(()=>{
 'use strict';
 const core=window.ONETikTokHealthCore;if(!core)return;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,run)=>{const b=el('button',text);b.type='button';b.addEventListener('click',run);return b;};
 const labels={played:'Lecture démarrée',unavailable:'Indisponible lors du test',unknown:'À vérifier',invalid:'Lien invalide',pending:'Non testée'};
 const reasons={time_advanced:'La lecture a avancé dans le lecteur.',invalid_video:'TikTok ne trouve pas cette vidéo.',autoplay:'Le navigateur a refusé le démarrage automatique.',server_error:'Le serveur TikTok ne répond pas correctement.',player_error:'Le lecteur a rencontré une erreur.',image_post:'Ce contenu est un diaporama, pas une vidéo vérifiable ici.',timeout:'La lecture n’a pas été confirmée dans le délai prévu.',invalid_id:'L’identifiant vidéo est invalide.',interrupted:'Le contrôle a été interrompu.'};
 let dialog=null,view=null,rows=[],hasSnapshot=false,snapshotAt='',running=false,loading=false,epoch=0,controller=null,note='',current='';
 function render(){
  if(!view)return;
  const c=core.counts(rows),busy=running||loading;
  view.status.textContent=note||'Prêt à vérifier le catalogue commun TikTok.';
  view.counts.textContent=hasSnapshot?`${c.checked} / ${c.total} testées · ${c.played} lectures démarrées · ${c.unavailable} indisponibles · ${c.unknown+c.invalid} à vérifier · ${c.pending} restantes`:'';
  view.progress.max=Math.max(1,c.total);view.progress.value=c.checked;view.progress.hidden=!hasSnapshot;
  view.start.textContent=c.pending?'Reprendre le contrôle':hasSnapshot?'Nouveau contrôle':'Lancer le contrôle';
  view.start.disabled=busy;view.stop.disabled=!busy;
  view.retry.disabled=busy||!rows.some(r=>['unavailable','unknown','invalid'].includes(r.status));
  view.download.disabled=busy||!hasSnapshot;
  view.player.hidden=!running;view.current.textContent=current;
  view.list.replaceChildren();
  const checked=rows.filter(r=>r.status!=='pending');
  for(const row of checked.slice(-30).reverse()){
   const item=el('li',undefined,'tt-health-result tt-health-'+row.status),title=el('strong',row.title),detail=el('span',labels[row.status]+'. '+(reasons[row.reason]||''));
   item.append(title,detail);
   if(core.validId(row.id)){const link=el('a','Ouvrir sur TikTok');link.href='https://www.tiktok.com/@_/video/'+row.id;link.target='_blank';link.rel='noopener noreferrer';item.append(link);}
   view.list.append(item);
  }
  view.history.textContent=checked.length>30?'Les 30 derniers résultats sont affichés. Le rapport contient toutes les vidéos.':'';
 }
 function stop(message='Contrôle arrêté. Tu peux le reprendre.'){
  epoch++;controller?.abort();controller=null;running=loading=false;current='';note=message;render();
 }
 function delay(ms,signal){return new Promise(resolve=>{
  const done=()=>{clearTimeout(timer);signal.removeEventListener('abort',done);resolve();};
  const timer=setTimeout(done,ms);signal.addEventListener('abort',done,{once:true});if(signal.aborted)done();
 });}
 async function run(retry=false){
  if(running||loading)return;
  if(document.hidden||navigator.onLine===false){note='Garde ONE au premier plan et vérifie ta connexion pour lancer le contrôle.';render();return;}
  const mine=++epoch;controller=new AbortController();const signal=controller.signal;
  try{
   if(!hasSnapshot||!rows.some(r=>r.status==='pending')&&!retry){
    loading=true;note='Chargement de toutes les vidéos du catalogue commun…';render();
    if(!window.ONETikTokPublic?.refresh)throw Error('Le catalogue TikTok n’est pas disponible. Recharge ONE.');
    const entries=await window.ONETikTokPublic.refresh({force:true});
    if(mine!==epoch)return;
    rows=core.snapshot(entries);hasSnapshot=true;snapshotAt=new Date().toISOString();
   }else if(retry){for(const row of rows)if(['unavailable','unknown','invalid'].includes(row.status)){row.status='pending';delete row.checkedAt;delete row.reason;delete row.code;delete row.seconds;}}
   if(mine!==epoch)return;
   loading=false;running=true;
   const pending=rows.filter(r=>r.status==='pending');
   for(let i=0;i<pending.length;i++){
    if(mine!==epoch)return;
    const row=pending[i];current=row.title;note='Contrôle en cours. Garde ONE ouvert sur cet écran.';render();
    const result=await core.inspect(row,{container:view.frame,signal});
    if(mine!==epoch)return;
    Object.assign(row,result,{checkedAt:new Date().toISOString()});render();
    if(i<pending.length-1)await delay(3000,signal);
   }
   if(mine!==epoch)return;
   note=rows.length?'Contrôle terminé. Les résultats décrivent la lecture sur cet appareil au moment du test.':'Le catalogue commun est vide.';
  }catch(error){if(mine===epoch)note=error.message||'Le contrôle n’a pas pu se terminer. Réessaie.';}
  finally{if(mine===epoch){running=loading=false;controller=null;current='';render();}}
 }
 function download(){
  const report={version:1,scope:'Catalogue TikTok commun ONE',snapshotAt,exportedAt:new Date().toISOString(),counts:core.counts(rows),limitation:'Contrôle du démarrage sur cet appareil uniquement. Aucun résultat ne garantit toute la vidéo ni sa disponibilité future. Aucune vidéo supprimée.',entries:rows};
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
  const a=el('a');a.href=url;a.download='ONE-controle-TikTok-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function open(){
  if(dialog){dialog.focus();return;}
  const d=el('dialog',undefined,'tt-health-dialog');dialog=d;d.setAttribute('aria-labelledby','tt-health-title');
  const head=el('header'),title=el('h2','Vérifier les vidéos TikTok');title.id='tt-health-title';
  const close=button('Fermer',()=>d.close());head.append(title,close);
  const intro=el('p','ONE teste automatiquement le démarrage des vidéos du catalogue commun, une par une et sans son. Garde cet écran ouvert. Une erreur ne supprime aucune vidéo.');
  const limit=el('p','Ce contrôle concerne cet appareil et cet instant. Il ne garantit pas la lecture complète, ni celle sur les autres téléphones.','tt-health-muted');
  const actions=el('div',undefined,'tt-health-actions'),start=button('Lancer le contrôle',()=>run()),halt=button('Arrêter',()=>stop()),retry=button('Réessayer les problèmes',()=>run(true)),save=button('Exporter le rapport',download);
  actions.append(start,halt,retry,save);
  const status=el('p');status.setAttribute('role','status');
  const counter=el('p',undefined,'tt-health-counts'),progress=el('progress');progress.setAttribute('aria-label','Vidéos vérifiées');
  const player=el('section',undefined,'tt-health-player'),playing=el('p'),frame=el('div',undefined,'tt-health-frame');player.append(playing,frame);
  const history=el('p',undefined,'tt-health-muted'),list=el('ol',undefined,'tt-health-results');list.setAttribute('aria-label','Résultats du contrôle');
  d.append(head,intro,limit,actions,status,counter,progress,player,history,list);document.body.append(d);
  view={start,stop:halt,retry,download:save,status,counts:counter,progress,player,current:playing,frame,history,list};render();
  d.addEventListener('close',()=>{if(running||loading)stop();d.remove();if(dialog===d){dialog=null;view=null;}});
  d.addEventListener('cancel',()=>{if(running||loading)stop();});
  d.showModal();
 }
 const settings=document.querySelector('#settingsModal .ttCatalogBox');
 if(settings){const b=button('Vérifier les vidéos TikTok',open);b.id='oneTikTokHealth';b.className='action';settings.append(b);}
 const actions=document.querySelector('.tt-public-actions');
 if(actions)actions.append(button('Vérifier les vidéos',open));
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&(running||loading))stop('Contrôle en pause : ONE est passé en arrière-plan. Appuie sur Reprendre pour continuer.');});
 window.addEventListener('offline',()=>{if(running||loading)stop('Contrôle en pause : connexion perdue. Reprends une fois connecté.');});
 window.addEventListener('pagehide',()=>{if(running||loading)stop();});
 window.addEventListener('one-account-changed',()=>{stop('');rows=[];hasSnapshot=false;snapshotAt='';dialog?.close();});
 window.ONETikTokHealth={open};
})();
