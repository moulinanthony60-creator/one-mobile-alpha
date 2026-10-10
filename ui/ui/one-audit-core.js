/* Shared identity rules: identical message text is still allowed when IDs differ. */
(()=>{'use strict';
if(window.ONEAudit)return;
function uniqueById(rows){
 if(!Array.isArray(rows))throw Error('La liste reçue est incomplète. Réessaie.');
 const seen=new Set();return rows.filter(row=>{if(!row||typeof row!=='object')return false;const id=row.id??row.clientId;if(id===undefined||id===null||id==='')return true;const key=String(id);if(seen.has(key))return false;seen.add(key);return true;});
}
function readJSON(key,fallback){try{const value=JSON.parse(localStorage.getItem(key));if(value==null)return fallback;if(Array.isArray(fallback))return Array.isArray(value)?value:fallback;if(fallback&&typeof fallback==='object')return typeof value==='object'&&!Array.isArray(value)?value:fallback;return value;}catch{return fallback;}}
function route(values,push=false){const next={...history.state};for(const k of ['oneSpace','oneProvider','oneView'])delete next[k];Object.assign(next,values);if(push)history.pushState(next,'');else history.replaceState(next,'');}
function hasOverlay(){return [...document.querySelectorAll('dialog[open],.modal.show,#oneSalonTray:not([hidden]),#oneCameraV79.open,#oneCreatePage.open,#oneAiHistory.show,#oneNotifications:not([hidden]),#onePointsPanel:not([hidden])')].some(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');}
function navigationBlocked(target){return document.body.classList.contains('oneSearchPage')||hasOverlay()||!!target?.closest?.('button,a,input,textarea,select,summary,[contenteditable],dialog,[role="dialog"],.modal,.topbar,.bottom,#vfeed,video,iframe,.oneStoriesRail,.oneMomentsTabs,.oneSearchCats,.oneCreationHub');}
function frameTask(fn){let queued=false;return function(...args){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;fn(...args)})};}
function goHome(){route({oneSpace:'home'});window.oneShowSpace?.('home',false);window.oneSelectBottomNav?.('oneHomeNav');}
window.ONEAudit={uniqueById,readJSON,route,hasOverlay,navigationBlocked,frameTask,goHome};
})();
