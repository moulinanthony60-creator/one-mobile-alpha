import {createTraining, TROOPS} from './battle3d-sandbox.mjs?v=2';
import {createScene} from './battle3d-scene.mjs?v=3';
import {bindBattleInput} from './battle3d-input.mjs?v=1';

const $=selector=>document.querySelector(selector);
const canvas=$('#battle-canvas'),training=createTraining();
const view=createScene(canvas,training.battle);
let abandoned=false,ready=false;
let selected='guardians',entered=false,failed=false,resultShown=false,finishedAt=0,frameId=0,last=0,lastHUD=0,toastUntil=0,southIndex=0;
const dialogs=[$('#intro'),$('#pause-dialog'),$('#result')];
const controls=[...document.querySelectorAll('[data-unit]')];
const timeLabel=seconds=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;

function toast(message) {$('#toast').textContent=message;$('#toast').classList.add('visible');toastUntil=performance.now()+2700;}
function playable() {return entered&&!training.paused&&!failed&&training.battle.phase==='active'&&!dialogs.some(dialog=>dialog.open);}
function select(kind) {
  if(!playable())return;
  selected=kind;
  updateUI();
}
function updateUI() {
  const active=playable(),b=training.battle,score=training.score;
  $('#timer').textContent=timeLabel(training.remaining);
  $('#percent').textContent=`${score.percent} %`;
  $('#progress').setAttribute('aria-valuenow',String(score.percent));
  $('#progress i').style.width=`${score.percent}%`;
  [...$('#stars').children].forEach((star,i)=>star.classList.toggle('earned',i<score.stars));
  $('#stars').setAttribute('aria-label',`${score.stars} étoile${score.stars>1?'s':''} sur 3`);
  let reserve=0;
  for(const button of controls) {
    const kind=button.dataset.unit,count=training.count(kind);reserve+=count;
    button.disabled=!active||!count;
    button.classList.toggle('selected',selected===kind);
    button.setAttribute('aria-pressed',String(selected===kind));
    button.setAttribute('aria-label',`${TROOPS.find(t=>t.kind===kind).name}, ${count} disponible${count>1?'s':''}`);
    $(`[data-count="${kind}"]`).textContent=count;
  }
  $('#reserve').textContent=`${reserve} troupe${reserve>1?'s':''} en réserve`;
  $('#spell').disabled=!active||!b.spells;
  $('#spell').setAttribute('aria-pressed',String(selected==='spell'));
  $('#spell-count').textContent=b.spells;
  $('#deploy-south').disabled=!active||selected==='spell'||!training.count(selected);
  $('#pause').disabled=!entered||failed||b.phase!=='active'||dialogs.some(dialog=>dialog.open);
  $('#hint').classList.toggle('magic',selected==='spell');
  $('#hint').textContent=selected==='spell'?'Touche une défense pour lancer la frappe magique.':reserve===0?'Ton armée est engagée. Soutiens-la avec la magie !':!training.count(selected)?'Choisis une autre troupe pour poursuivre l’assaut.':'Touche la bordure bleue pour déployer tes troupes.';
}
function deploy(point) {
  if(!playable()||!point)return;
  try {
    if(selected==='spell') {
      training.spell(point.x,point.y);view.mark(point.x,point.y,true);
      if(training.battle.spells===0)selected=TROOPS.find(t=>training.count(t.kind)>0)?.kind||'guardians';
    } else {training.deploy(selected,point.x,point.y);view.mark(point.x,point.y);}
    updateUI();
  } catch(error) {toast(error.message);}
}
function setPause() {
  if(!entered||failed||training.battle.phase!=='active'||$('#pause-dialog').open)return;
  training.pause(true);input.clear();
  $('#pause-dialog').showModal();updateUI();
}
function restart() {
  for(const dialog of dialogs)if(dialog.open)dialog.close();
  training.reset();view.reset(training.battle);entered=true;resultShown=false;selected='guardians';southIndex=0;last=performance.now();
  input.clear();updateUI();toast('Une nouvelle armée t’attend. À toi de jouer !');
  canvas.focus({preventScroll:true});
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
$('#spell').addEventListener('click',()=>select(selected==='spell'?'guardians':'spell'));
$('#deploy-south').addEventListener('click',()=>{const x=7.2+(southIndex++%9)*.7;deploy({x,y:14.4});});
$('#zoom-in').addEventListener('click',()=>view.zoom(1.2));
$('#zoom-out').addEventListener('click',()=>view.zoom(1/1.2));
$('#home').addEventListener('click',()=>view.home());
$('#quality').addEventListener('click',()=>{const eco=$('#quality').getAttribute('aria-pressed')!=='true';view.quality(eco);$('#quality').setAttribute('aria-pressed',String(eco));$('#quality').textContent=eco?'Éco ✓':'Éco';$('#quality').setAttribute('aria-label',eco?'Désactiver le mode éco et retrouver les ombres détaillées':'Activer le mode éco : réduire les ombres et la résolution');toast(eco?'Mode éco activé.':'Graphismes détaillés activés.');});
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{
  if(!view.style(button.dataset.view))return;
  input.clear();view.frame(training.battle,0,false);
  for(const item of document.querySelectorAll('[data-view]'))item.setAttribute('aria-pressed',String(item===button));
});
$('#start').addEventListener('click',()=>{entered=true;$('#intro').close();updateUI();canvas.focus({preventScroll:true});});
$('#pause').addEventListener('click',setPause);
$('#resume').addEventListener('click',()=>{training.pause(false);$('#pause-dialog').close();last=performance.now();updateUI();canvas.focus({preventScroll:true});});
$('#restart').addEventListener('click',restart);
$('#restart-pause').addEventListener('click',restart);
for(const dialog of dialogs)dialog.addEventListener('cancel',event=>{event.preventDefault();if(dialog.id==='pause-dialog')$('#resume').click();});

const input=bindBattleInput(canvas,{enabled:playable,tap:(x,y)=>deploy(view.point(x,y)),pan:(dx,dy)=>view.pan(dx,dy),zoom:factor=>view.zoom(factor)});
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
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fatal('Le téléphone a interrompu l’affichage 3D. Ferme les autres onglets puis touche Réessayer. Ton village est préservé.');});
function frame(now) {
  if(failed)return;
  try {
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;
    if(!document.hidden) {
      if(entered)training.tick(dt);
      if(entered&&!training.paused&&(!resultShown||now-finishedAt<1000))view.frame(training.battle,dt);
      if(now-lastHUD>120){updateUI();lastHUD=now;}
      if(training.battle.phase==='finished'&&!resultShown)result();
      if(toastUntil&&now>toastUntil){$('#toast').classList.remove('visible');toastUntil=0;}
    }
    frameId=requestAnimationFrame(frame);
  } catch(error) {console.error('Valdoria 3D:',error);fatal('L’essai a rencontré un problème. Tu peux réessayer ou retourner à ton village.');}
}
window.addEventListener('pagehide',event=>{cancelAnimationFrame(frameId);setPause();if(!event.persisted){abandoned=true;input.dispose();view.dispose();}});
window.addEventListener('pageshow',event=>{if(event.persisted&&ready&&!failed){last=0;frameId=requestAnimationFrame(frame);}});

const artReady=await view.loadVillage();
if(!abandoned&&!failed){
  if(artReady){
    view.style('village');
    $('[data-view="village"]').disabled=false;
    $('[data-view="village"]').setAttribute('aria-pressed','true');
    $('[data-view="3d"]').setAttribute('aria-pressed','false');
  }else{
    $('.art-note').textContent='Les illustrations n’ont pas pu charger. La vue 3D reste disponible ; recharge la page pour réessayer la vue Village.';
    $('[data-view="village"]').title='Recharge la page pour réessayer le chargement des illustrations.';
  }
  ready=true;view.frame(training.battle,0,false);
  $('#loading').hidden=true;
  $('#intro').showModal();updateUI();
  frameId=requestAnimationFrame(frame);
}
