/* Keep game engines out of the initial home, camera and messaging load. */
(()=>{
 let pending=null,generation=0,loading=null;
 window.oneEnsureThree17=()=>pending||=(import('./one-three17-game.js?v=appels-v54').catch(error=>{pending=null;throw error;}));
 const close=()=>{generation++;loading?.remove();loading=null;};
 async function open(options){
  if(loading)return;
  const own=++generation,box=document.createElement('dialog');loading=box;
  box.className='oneCommDialog';box.setAttribute('aria-label','Chargement de 3:17');
  const title=document.createElement('h2');title.textContent='3:17';
  const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Préparation du jeu…';
  const cancel=document.createElement('button');cancel.textContent='Annuler';cancel.onclick=close;
  box.append(title,status,cancel);document.body.append(box);box.showModal();box.addEventListener('cancel',close);
  try{await window.oneEnsureThree17();if(own!==generation)return;close();window.ONEThree17.open(options);}
  catch{if(own!==generation)return;status.textContent='Le jeu n’a pas pu charger. Vérifie ta connexion et réessaie.';const retry=document.createElement('button');retry.textContent='Réessayer';retry.onclick=()=>{close();open(options);};box.append(retry);}
 }
 window.ONEThree17={open,close,layoutInfo:()=>null,graphicsInfo:()=>null};
 window.ONEThree17Coop={open:()=>window.ONEOpen3DLobby?.()};
 window.addEventListener('one-account-changed',close);
 window.addEventListener('pagehide',close);
})();



