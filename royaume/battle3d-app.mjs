import {createTraining, TROOPS} from './battle3d-sandbox.mjs?v=12';
import {createVillageScene} from './battle-village-scene.mjs?v=12';
import {VALDORIA_FIELD,createValdoriaFort} from './battle-style-layout.mjs?v=2';
import {bindBattleInput} from './battle3d-input.mjs?v=2';

const $=selector=>document.querySelector(selector);
// Use the visible viewport in mobile browsers and embedded app windows.
let viewportHeight=0;
function fitViewport(){
  const visual=window.visualViewport;
  if(visual&&Math.abs(visual.scale-1)>.01)return;
  const height=Math.floor(Math.min(window.innerHeight,visual?.height||window.innerHeight));
  if(!Number.isFinite(height)||height<=0||height===viewportHeight)return;
  viewportHeight=height;document.documentElement.style.setProperty('--battle-height',height+'px');
  $('#game').classList.toggle('compact-screen',height<690);
}
fitViewport();window.addEventListener('resize',fitViewport);window.visualViewport?.addEventListener('resize',fitViewport);
const canvas=$('#battle-canvas'),training=createTraining({layout:createValdoriaFort,field:VALDORIA_FIELD});
const view=createVillageScene(canvas,training.battle);view.canvas=canvas;
let abandoned=false,ready=false;
let selected='guardians',entered=false,failed=false,resultShown=false,finishedAt=0,frameId=0,last=0,lastHUD=0,toastUntil=0,southIndex=0;
const dialogs=[$('#intro'),$('#pause-dialog'),$('#result')];
const controls=[...document.querySelectorAll('[data-unit]')];
const timeLabel=seconds=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;

function toast(message) {$('#toast').textContent=message;$('#toast').classList.add('visible');toastUntil=performance.now()+2700;}
function playable() {return entered&&!training.paused&&!failed&&training.battle.phase==='active'&&!dialogs.some(dialog=>dialog.open);}
function select(kind) {
  if(!playable()||(kind==='spell'?!training.battle.spells:!training.count(kind)))return;
  selected=kind;
  updateUI();
}
function updateUI() {
  const active=playable(),b=training.battle,score=training.score;
  $('#timer').textContent=timeLabel(training.remaining);
  $('#clock-label').textContent=training.started?'FIN DE LA BATAILLE DANS':'DÉPLOIE TON ARMÉE';
  $('#magic-total').textContent=b.spells;$('#targets-total').textContent=b.buildings.filter(p=>p.kind!=='wall'&&p.hp>0).length;
  $('#percent').textContent=`${score.percent} %`;
  $('#progress').setAttribute('aria-valuenow',String(score.percent));
  $('#progress i').style.width=`${score.percent}%`;
  [...$('#stars').children].forEach((star,i)=>star.classList.toggle('earned',i<score.stars));
  $('#stars').setAttribute('aria-label',`${score.stars} étoile${score.stars>1?'s':''} sur 3`);
  let reserve=0;
  for(const button of controls) {
    const kind=button.dataset.unit,count=training.count(kind);reserve+=count;
    button.disabled=!active||!count;
    button.classList.toggle('selected',selected===kind&&count>0);
    button.setAttribute('aria-pressed',String(selected===kind&&count>0));
    button.setAttribute('aria-label',`${TROOPS.find(t=>t.kind===kind).name}, ${count} disponible${count>1?'s':''}`);
    $(`[data-count="${kind}"]`).textContent=count;
  }
  $('#army-total').textContent=reserve;
  $('#reserve').textContent=`${reserve} troupe${reserve>1?'s':''} en réserve`;
  $('#spell').disabled=!active||!b.spells;
  $('#spell').setAttribute('aria-pressed',String(selected==='spell'));
  $('#spell-count').textContent=b.spells;
  $('#deploy-south').disabled=!active||selected==='spell'||!training.count(selected);
  $('#pause').disabled=!entered||failed||b.phase!=='active'||dialogs.some(dialog=>dialog.open);
  $('#hint').classList.toggle('magic',selected==='spell');
  $('#hint').textContent=selected==='spell'?'Touche une défense pour lancer la frappe magique.':reserve===0?(b.spells?'Ton armée combat. La magie reste disponible.':'Ton armée combat. Tu peux déplacer ou rapprocher la vue.'):!training.count(selected)?'Choisis une autre troupe pour poursuivre l’assaut.':'Touche hors de la ligne bleue. Maintiens pour déployer plusieurs soldats.';
}
function deploy(point) {
  if(!playable()||!point)return false;
  if(selected==='spell'?!training.battle.spells:!training.count(selected))return false;
  try {
    if(selected==='spell') {
      training.spell(point.x,point.y);view.mark(point.x,point.y,true);
      if(training.battle.spells===0)selected=TROOPS.find(t=>training.count(t.kind)>0)?.kind||'guardians';
    } else {
      training.deploy(selected,point.x,point.y);view.mark(point.x,point.y);
      if(!training.count(selected))selected=TROOPS.find(t=>training.count(t.kind)>0)?.kind||selected;
    }
    updateUI();
    return true;
  } catch(error) {view.mark(point.x,point.y,false,true);toast(error.message);return false;}
}
function setPause() {
  if(!entered||failed||training.battle.phase!=='active'||dialogs.some(dialog=>dialog.open))return;
  training.pause(true);input.clear();
  $('#pause-dialog').showModal();updateUI();
}
function restart() {
  for(const dialog of dialogs)if(dialog.open)dialog.close();
  training.reset();view.reset(training.battle);entered=true;resultShown=false;selected='guardians';southIndex=0;last=performance.now();
  input.clear();updateUI();toast('Une nouvelle armée t’attend. À toi de jouer !');
  view.canvas.focus({preventScroll:true});
}
function result() {
  const b=training.battle,score=training.score,survivors=b.units.filter(unit=>unit.hp>0).length;
  resultShown=true;finishedAt=performance.now();
  $('#result-title').textContent=score.percent===100?'Le fort est tombé !':score.stars?'Une belle percée !':'Le fort résiste encore';
  $('#result-stars').replaceChildren(...Array.from({length:3},(_,index)=>{const span=document.createElement('span');span.textContent='★';span.className=index>=score.stars?'empty':'';return span;}));
  $('#result-stars').setAttribute('aria-label',`${score.stars} étoiles sur 3`);
  $('#result-detail').textContent=`${score.percent} % détruit · ${timeLabel(Math.min(150,Math.ceil(b.elapsed)))} de combat · ${survivors} survivant${survivors>1?'s':''} sur ${b.units.length} déployés.`;
  $('#result').showModal();updateUI();
}

controls.forEach(button=>button.addEventListener('click',()=>select(button.dataset.unit)));
$('#spell').addEventListener('click',()=>{
  if(!playable())return;
  if(selected==='spell'){selected=TROOPS.find(t=>training.count(t.kind)>0)?.kind||'guardians';updateUI();}
  else select('spell');
});
$('#deploy-south').addEventListener('click',()=>{const x=16.5+(southIndex++%9)*.9;deploy({x,y:28.4});});
$('#zoom-in').addEventListener('click',()=>view.zoom(1.2));
$('#zoom-out').addEventListener('click',()=>view.zoom(1/1.2));
$('#home').addEventListener('click',()=>view.home());
$('#quality').addEventListener('click',()=>{const eco=$('#quality').getAttribute('aria-pressed')!=='true';view.quality(eco);$('#quality').setAttribute('aria-pressed',String(eco));$('#quality').textContent=eco?'Éco ✓':'Éco';$('#quality').setAttribute('aria-label',eco?'Désactiver le mode éco':'Activer le mode éco : réduire les effets et la résolution');toast(eco?'Mode éco activé.':'Graphismes détaillés activés.');});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Tourne le téléphone en paysage pour agrandir le terrain.');}catch{toast('Le plein écran est indisponible ici. Tourne le téléphone en paysage.');}});
$('#help').addEventListener('click',()=>{if(!ready||failed)return;training.pause(true);input.clear();$('#intro').showModal();updateUI();});
$('#start').addEventListener('click',()=>{entered=true;training.pause(false);$('#intro').close();last=performance.now();updateUI();view.canvas.focus({preventScroll:true});});
$('#pause').addEventListener('click',setPause);
$('#resume').addEventListener('click',()=>{training.pause(false);$('#pause-dialog').close();last=performance.now();updateUI();view.canvas.focus({preventScroll:true});});
$('#restart').addEventListener('click',restart);
$('#restart-pause').addEventListener('click',restart);
for(const dialog of dialogs)dialog.addEventListener('cancel',event=>{event.preventDefault();if(dialog.id==='pause-dialog')$('#resume').click();});

const inputs=[canvas].map(surface=>bindBattleInput(surface,{enabled:()=>playable()&&view.canvas===surface,tap:(x,y)=>deploy(view.point(x,y)),holdKey:()=>selected==='spell'?null:selected,hold:(x,y,key)=>selected===key&&deploy(view.point(x,y)),pan:(dx,dy)=>view.pan(dx,dy),zoom:factor=>view.zoom(factor)}));
const input={clear(){inputs.forEach(i=>i.clear());},dispose(){inputs.forEach(i=>i.dispose());}};
document.addEventListener('keydown',event=>{
  if(event.repeat)return;
  if(playable()&&['1','2','3'].includes(event.key)) {select(TROOPS[Number(event.key)-1].kind);event.preventDefault();}
  if(playable()&&event.key.toLowerCase()==='m') {select('spell');event.preventDefault();}
  if(playable()&&event.key==='Escape') {setPause();event.preventDefault();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)setPause();else last=performance.now();});

function fatal(message) {
  failed=true;cancelAnimationFrame(frameId);training.pause(true);
  for(const dialog of dialogs)if(dialog.open)dialog.close();
  $('#fatal-detail').textContent=message;$('#fatal').hidden=false;$('#loading').hidden=true;updateUI();
}
function frame(now) {
  if(failed)return;
  try {
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;
    if(!document.hidden) {
      if(entered)training.tick(dt);
      if(entered&&!training.paused&&(!resultShown||now-finishedAt<1000))view.frame(training.battle,dt,true,training.presentation);
      if(now-lastHUD>120){updateUI();lastHUD=now;}
      if(training.battle.phase==='finished'&&!resultShown)result();
      if(toastUntil&&now>toastUntil){$('#toast').classList.remove('visible');toastUntil=0;}
    }
    frameId=requestAnimationFrame(frame);
  } catch(error) {console.error('Valdoria 3D:',error);fatal('L’essai a rencontré un problème. Tu peux réessayer ou retourner à ton village.');}
}
window.addEventListener('pagehide',event=>{cancelAnimationFrame(frameId);setPause();if(!event.persisted){abandoned=true;input.dispose();view.dispose();window.removeEventListener('resize',fitViewport);window.visualViewport?.removeEventListener('resize',fitViewport);}});
window.addEventListener('pageshow',event=>{if(event.persisted&&ready&&!failed){last=0;frameId=requestAnimationFrame(frame);}});

const artReady=await view.loadVillage();
if(!abandoned&&!failed){
  if(!artReady)$('.art-note').textContent='Les illustrations n’ont pas pu charger. Le terrain simplifié reste jouable. Recharge la page pour réessayer les illustrations.';
  ready=true;entered=true;view.frame(training.battle,0,false);
  $('#loading').hidden=true;
  updateUI();
  if(!artReady)toast('Les bâtiments n’ont pas chargé. Recharge la page pour retrouver leurs illustrations.');
  else if(view.artStatus.details===false)toast('Certains bâtiments détaillés n’ont pas chargé. Recharge la page pour les retrouver.');
  else if(!view.artStatus.troops)toast('Les illustrations des troupes n’ont pas chargé. Les soldats simplifiés restent jouables.');
  frameId=requestAnimationFrame(frame);
}
