import {bindBattleInput} from '../battle3d-input.mjs';
const $=selector=>document.querySelector(selector),canvas=$('#scene'),buttons=[...document.querySelectorAll('button:not(#retry)')];
let view=null,input=null,paused=false,economy=new URLSearchParams(location.search).get('eco')==='1',failed=false;
function viewport(){document.documentElement.style.setProperty('--app-height',`${window.visualViewport?.height||window.innerHeight}px`);}
viewport();window.addEventListener('resize',viewport);window.visualViewport?.addEventListener('resize',viewport);
buttons.forEach(b=>b.disabled=true);
function pressed(selector,value,attribute){document.querySelectorAll(selector).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[attribute]===value)));}
function failure(message){failed=true;input?.dispose();input=null;view?.dispose();view=null;$('#loading').hidden=true;$('#error').hidden=false;$('#error-text').textContent=message;buttons.forEach(b=>b.disabled=true);}
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();failure('La 3D a été interrompue. Tu peux réessayer avec moins d’effets, ou retourner au combat.');});
$('#retry').addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('eco','1');location.replace(url.href);});
function chooseFocus(value){view?.focus(value);pressed('[data-focus]',value,'focus');$('#view-name').textContent={ensemble:'Vue d’ensemble',chateau:'Le château',maison:'La maison',gardien:'Le gardien'}[value];}
for(const button of document.querySelectorAll('[data-focus]'))button.addEventListener('click',()=>chooseFocus(button.dataset.focus));
for(const button of document.querySelectorAll('[data-motion]'))button.addEventListener('click',()=>{view?.motion(button.dataset.motion);pressed('[data-motion]',button.dataset.motion,'motion');if(button.dataset.motion!=='idle')chooseFocus('gardien');});
$('#home').addEventListener('click',()=>chooseFocus('ensemble'));
$('#zoom-in').addEventListener('click',()=>view?.zoom(1.18));$('#zoom-out').addEventListener('click',()=>view?.zoom(1/1.18));
$('#pause').addEventListener('click',()=>{paused=!paused;view?.pause(paused);$('#pause').setAttribute('aria-pressed',String(paused));$('#pause').setAttribute('aria-label',paused?'Reprendre les animations':'Mettre les animations en pause');$('#pause').textContent=paused?'▷':'Ⅱ';});
$('#eco').addEventListener('click',()=>{economy=!economy;view?.quality(economy);$('#eco').setAttribute('aria-pressed',String(economy));$('#eco').setAttribute('aria-label',economy?'Désactiver le mode économique':'Activer le mode économique');});
canvas.addEventListener('keydown',e=>{if(!view)return;const actions={ArrowLeft:()=>view.orbit(22,0),ArrowRight:()=>view.orbit(-22,0),ArrowUp:()=>view.orbit(0,15),ArrowDown:()=>view.orbit(0,-15),'+':()=>view.zoom(1.12),'=':()=>view.zoom(1.12),'-':()=>view.zoom(1/1.12),Home:()=>chooseFocus('ensemble')};if(actions[e.key]){e.preventDefault();actions[e.key]();}});
window.addEventListener('pagehide',event=>{if(event.persisted){view?.pause(true);return;}input?.dispose();view?.dispose();view=null;});window.addEventListener('pageshow',()=>view?.pause(paused));
try{
 const {createAtelier}=await import('./scene.mjs?v=1');
 // Let the loading panel paint before generating the geometry.
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 view=createAtelier(canvas,{economy});if(failed){view.dispose();view=null;}else{
  input=bindBattleInput(canvas,{enabled:()=>Boolean(view),tap:()=>{},pan:(x,y)=>view.orbit(x,y),zoom:factor=>view.zoom(factor)});
  $('#loading').hidden=true;buttons.forEach(b=>b.disabled=false);$('#eco').setAttribute('aria-pressed',String(economy));
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelectorAll('[data-motion]').forEach(b=>b.disabled=b.dataset.motion!=='idle');$('.gesture-hint').textContent='Animations réduites · glisse pour tourner';}
 }
}catch(error){console.error('Atelier Valdoria :',error);failure('La scène 3D n’a pas pu se charger. Réessaie en mode éco ; le village et le combat restent accessibles.');}
