(()=>{
 const css=document.createElement('link');css.rel='stylesheet';css.href='ui/party-bluff.css?v=01454';document.head.append(css);
 const ranks={A:'As',K:'Roi',Q:'Dame',J:'Joker'},symbols={A:'♠',K:'♚',Q:'♛',J:'✦'};let selection=new Set(),selectionKey='';
 window.ONEBluffRules='2 à 4 joueurs. Chaque manche distribue cinq cartes et impose As, Roi ou Dame. Pose une à trois cartes face cachée en prétendant qu’elles correspondent : les jokers sont toujours vrais. Le suivant joue à son tour ou dit « Tu mens ! » pour révéler uniquement la dernière annonce. Si elle est fausse, son auteur reçoit une erreur ; sinon, l’accusateur. Trois erreurs éliminent un joueur. Après chaque accusation, nouvelle distribution. Une main vide oblige à contester à son prochain tour. Le dernier joueur en lice gagne. Un départ du salon interrompt la partie.';
 window.renderONEBluff=({g,body,busy,command,el,btn})=>{
  const key=g.id+':'+g.round+':'+g.yourTurn+':'+g.hand.map(c=>c.id).join(',');if(key!==selectionKey){selection=new Set();selectionKey=key;}
  const scene=el('div');scene.className='bluff-scene';const badge=el('div');badge.className='bluff-target';badge.append(el('small','MANCHE '+g.round+' · LA TABLE DEMANDE'),el('strong',symbols[g.target]+' '+ranks[g.target]));scene.append(badge);body.append(scene);
  window.ONEBluffScene(scene,g.players,g.pending);
  if(!scene.querySelector('.bluff-person')){const fallback=el('div');fallback.className='bluff-fallback-players';for(const p of g.players.filter(p=>!p.isYou)){const face=el('div');face.className='cg-face';face.dataset.cameraSeat=p.accountId;face.append(el('span',p.name.slice(0,1)));const label=el('div',p.name+' · '+p.faults+'/3 erreurs');label.append(face);fallback.append(label);}scene.append(fallback);}
  const hint=el('span','Glisse sur le décor pour regarder autour');hint.className='bluff-look';scene.append(hint);
  const area=el('div');area.className='bluff-controls';const me=g.players.find(p=>p.isYou);const self=el('div');self.className='bluff-self';const face=el('div');face.className='cg-face';face.dataset.cameraSeat='local';face.append(el('span',me?.name.slice(0,1)||'?'));self.append(face,el('small','Toi · '+(me?.faults||0)+'/3 erreurs'));area.append(self);
  const turn=el('h3',g.status==='playing'?(g.yourTurn?'À toi de bluffer… ou de dénoncer.':(g.players.find(p=>p.isTurn)?.name||'Un joueur')+' joue'):g.status==='finished'?(g.players.find(p=>p.isWinner)?.name||'')+' remporte la partie !':'Partie interrompue');area.append(turn,el('p',g.last));
  if(g.reveal){const r=el('details');r.className='bluff-reveal';r.append(el('summary','Dernière révélation : '+(g.reveal.honest?'annonce vraie':'bluff découvert')),el('p',g.reveal.name+' avait '+g.reveal.cards.map(c=>ranks[c]).join(', ')+' pour une table '+ranks[g.reveal.target]+'. '+g.reveal.penalized+' : '+g.reveal.faults+'/3 erreurs.'));area.append(r);}
  if(g.status==='playing'){
   if(me?.faults>=3)area.append(el('p','Tu es éliminé. Tu peux suivre la fin de la partie.'));
   const hand=el('div');hand.className='bluff-hand';hand.setAttribute('aria-label','Tes cartes secrètes');const cardButtons=[];
   const actions=el('div');actions.className='bluff-actions';const base='&game='+encodeURIComponent(g.id)+'&revision='+g.revision;
   const play=btn('Choisis 1 à 3 cartes',()=>command('play',base+'&action=bluff&cards='+encodeURIComponent([...selection].join(','))));
   const accuse=btn('Tu mens !',()=>command('play',base+'&action=accuse'));accuse.className='bluff-accuse';accuse.disabled=busy||!g.yourTurn||!g.pending;
   function sync(){play.disabled=busy||!g.yourTurn||selection.size===0;play.textContent=selection.size?'Annoncer '+selection.size+' '+ranks[g.target]+(selection.size>1&&g.target!=='A'?'s':''):'Choisis 1 à 3 cartes';for(const [id,b]of cardButtons){b.classList.toggle('selected',selection.has(id));b.setAttribute('aria-pressed',String(selection.has(id)));b.disabled=busy||!g.yourTurn||(!selection.has(id)&&selection.size>=3);}}
   for(const card of g.hand){const b=btn('',()=>{if(selection.has(card.id))selection.delete(card.id);else if(selection.size<3)selection.add(card.id);sync();});b.className='bluff-card';b.setAttribute('aria-label',ranks[card.rank]);b.append(el('small',ranks[card.rank]),el('strong',symbols[card.rank]),el('span',card.rank));hand.append(b);cardButtons.push([card.id,b]);}
   sync();area.append(hand);actions.append(play,accuse);area.append(actions);if(g.yourTurn&&!g.hand.length)area.append(el('p','Ta main est vide : conteste la dernière annonce.'));
  }body.append(area);
 };
})();
