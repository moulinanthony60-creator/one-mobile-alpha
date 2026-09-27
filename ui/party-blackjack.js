(()=>{
 const css=document.createElement('link');css.rel='stylesheet';css.href='ui/party-blackjack.css?v=118r2';document.head.append(css);
 const drafts=new Map();let previous=null,focusKey=null;
 // One readiness request per hand, even when polling rebuilds the table.
 const nextHands=new Map();let paused=false,current=null,roomId=null;
 const resetNextHands=()=>{nextHands.clear();paused=false;current=null;};
 window.addEventListener('one-party-state',e=>{const id=e.detail?.id||null;if(id!==roomId){roomId=id;resetNextHands();}});
 window.addEventListener('one-game-before-render',()=>{focusKey=document.activeElement?.dataset?.bjField||null;});
 window.addEventListener('one-game-rendered',()=>{if(focusKey){const input=[...document.querySelectorAll('[data-bj-field]')].find(n=>n.dataset.bjField===focusKey);input?.focus({preventScroll:true});focusKey=null;}});
 window.addEventListener('one-account-changed',()=>{drafts.clear();previous=null;roomId=null;resetNextHands();});
 const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const tableVisible=v=>v===current&&v.root.isConnected&&!document.hidden&&window.onePartyGameVisible?.()!==false;
 function updateNextHand(){
  const v=current;if(!v||!v.root.isConnected)return;
  const s=v.state;v.check.checked=paused;v.check.disabled=v.busy||!!s?.pending;
  if(!s)return;
  v.retry.hidden=s.failed===null&&(!v.needsBuyin||s.ready||s.sent);v.retry.disabled=v.busy||s.pending;
  v.retry.textContent=s.failed===false?'Réessayer la pause':v.needsBuyin?'Recharger · '+v.g.nextBuyin+' jetons ONE':'Réessayer la main suivante';
  const others=v.g.players.filter(p=>!p.isYou&&!(v.g.replayReady||[]).includes(p.accountId));
  v.note.textContent=s.pending?'Synchronisation de la table…':s.failed!==null?'La main suivante attend ta confirmation · vérifie le message affiché.':paused?'Table en pause · décoche pour continuer.':s.ready||s.sent?(others.length?'En attente de '+others.map(p=>p.name).join(', ')+'…':'Préparation de la main suivante…'):v.needsBuyin?'Réserve insuffisante · recharge à confirmer.':'Main suivante dans '+Math.max(1,Math.ceil((s.at-Date.now())/1000))+' s';
 }
 async function nextHandReady(want,refill=false){
  const v=current,s=v?.state;if(!s||s.pending||v.busy||!tableVisible(v))return;
  if(want&&v.needsBuyin&&!refill)return;
  if(s.ready===want){s.failed=null;updateNextHand();return;}
  s.pending=true;s.failed=null;if(want)s.sent=true;updateNextHand();
  let ok=false;try{ok=await v.command('replay','&game='+encodeURIComponent(v.g.id)+'&ready='+(want?'1':'0')+(want&&refill?'&refill=1':''))===true;}catch{}
  s.pending=false;if(ok||s.ready===want){s.ready=want;if(!want)s.sent=false;}else s.failed=want;
  // A completed request may have rendered a new hand or a different room.
  if(current?.state===s)updateNextHand();
 }
 setInterval(()=>{
  const v=current,s=v?.state;if(!s||!tableVisible(v))return;
  if(!paused&&!v.needsBuyin&&!v.busy&&!s.pending&&s.failed===null&&!s.sent&&!s.ready&&Date.now()>=s.at)nextHandReady(true);
  updateNextHand();
 },250);
 function card(c){const n=node('span','bj-card');if(c===null){n.classList.add('bj-back');n.setAttribute('aria-label','Carte cachée');return n;}const suit=['♠','♥','♦','♣'][Math.floor(c/13)],rank=['2','3','4','5','6','7','8','9','10','V','D','R','A'][c%13];if(suit==='♥'||suit==='♦')n.classList.add('red');n.setAttribute('aria-label',rank+' '+suit);n.append(node('b','bj-corner',rank+suit),node('strong','bj-suit',suit),node('b','bj-corner bj-bottom',rank+suit));return n;}
 const results={blackjack:'Blackjack !',win:'Gagné',push:'Égalité',lose:'Perdu',bust:'Dépassé'};
 window.renderONEBlackjack=({g,body,busy,command})=>{
  const me=g.players.find(p=>p.isYou),active=g.status==='playing',root=node('section','bj-game');root.dataset.phase=g.phase;body.append(root);
  const action=(kind,extra={})=>command('play','&'+new URLSearchParams({game:g.id,revision:g.revision,action:kind,...extra}));
  const button=(text,kind,enabled,extra)=>{const b=node('button','',text);b.type='button';b.disabled=busy||!active||!enabled;b.onclick=()=>action(kind,typeof extra==='function'?extra():extra);b.dataset.gameControl='';return b;};
  const heading=node('header','bj-heading');heading.append(node('span','','MAIN '+g.round),node('strong','','ONE BLACKJACK'),node('small','','Croupier auto'));root.append(heading);
  const table=node('div','bj-table');root.append(table);
  const markings=node('div','bj-felt-print');markings.setAttribute('aria-hidden','true');markings.innerHTML='<svg viewBox="0 0 500 105" xmlns="http://www.w3.org/2000/svg"><defs><path id="bj-rule-arc" d="M40 20 Q250 117 460 20"/></defs><path d="M20 25 Q250 148 480 25" fill="none" stroke="currentColor" stroke-width="1.4"/><text fill="currentColor" font-size="18" font-family="Georgia,serif" letter-spacing="2"><textPath href="#bj-rule-arc" startOffset="50%" text-anchor="middle">BLACKJACK PAIE 3 POUR 2</textPath></text><text x="250" y="97" text-anchor="middle" fill="currentColor" font-family="system-ui" font-size="11" letter-spacing="2">LE CROUPIER RESTE À 17</text></svg>';table.append(markings);
  const dealer=node('section','bj-dealer');dealer.append(node('b','','CROUPIER'));const dealerCards=node('div','bj-cards');
  for(const c of (g.dealer.length?g.dealer:[null,null]))dealerCards.append(card(c));dealer.append(dealerCards);if(g.dealerTotal!==null)dealer.append(node('strong','bj-total','Total · '+g.dealerTotal));table.append(dealer);
  const line=node('p','bj-status',g.phase==='betting'?'Placez vos mises':g.last);line.setAttribute('role','status');
  const players=node('div','bj-players');players.dataset.count=g.players.length;
  const ordered=[...g.players.filter(p=>!p.isYou),...g.players.filter(p=>p.isYou)];
  for(const p of ordered){const seat=node('article','bj-seat'+(p.isYou?' own':'')+(p.isTurn?' current':''));seat.dataset.result=p.result||'';seat.setAttribute('aria-label',p.name+(p.isTurn?' · à son tour':''));
   const head=node('div','bj-seat-head'),face=node('div','bj-camera');face.dataset.cameraSeat=p.isYou?'local':p.accountId;face.append(node('span','',p.name.slice(0,1)));const label=node('div','bj-player-label');label.append(node('b','',p.name+(p.isYou?' · toi':'')),node('small','','Réserve · '+p.stack));head.append(face,label);seat.append(head);
   const cards=node('div','bj-cards');for(const c of p.hand)cards.append(card(c));if(!p.hand.length)cards.append(node('span','bj-await',p.bet?'Mise enregistrée':'Choisit sa mise…'));seat.append(cards);
   const info=node('div','bj-seat-info'),wager=node('span','bj-wager'+(p.bet?' placed':''));wager.setAttribute('aria-label',p.bet?'Mise · '+p.bet+' jetons':'Emplacement de mise');wager.append(node('i','bj-chip',''),node('b','',p.bet?String(p.bet):'MISE'));info.append(wager,node('strong','bj-total',p.total===null?'':String(p.total)));seat.append(info);
   if(p.result&&g.status!=='cancelled')seat.append(node('strong','bj-result',results[p.result]+' · '+(p.net>0?'+':'')+p.net));else if(p.done){const done=node('span','bj-done',' ✓');done.title='Reste';done.setAttribute('aria-label','Reste');label.firstChild.append(done);}players.append(seat);
  }table.append(players);
  const controls=node('section','bj-controls');root.append(controls);controls.append(line);
  if(active&&g.phase==='betting'&&!me.bet){const max=Math.floor(me.stack/10)*10,key=g.id+':'+me.accountId;
   const label=node('label','bj-bet-label','Ta mise'),input=node('input','bj-amount');input.type='number';input.dataset.bjField=key;input.min='10';input.max=String(max);input.step='10';input.value=String(Math.min(max,drafts.get(key)||20));input.setAttribute('aria-label',g.pointStake?'Mise en jetons ONE':'Mise en jetons de table');input.disabled=busy;label.append(input);controls.append(label);
   const confirm=button('Miser','bj-bet',true,()=>({amount:input.value}));confirm.className='bj-confirm';const update=()=>{const n=Number(input.value);drafts.set(key,n);confirm.textContent='Miser '+(Number.isFinite(n)?n:'')+(g.pointStake?' jetons ONE':' jetons');confirm.disabled=busy||!Number.isSafeInteger(n)||n<10||n>max||n%10!==0;};input.oninput=update;
   const chips=node('div','bj-chips');for(const n of [10,20,50,100]){const b=node('button','',String(n));b.type='button';b.disabled=busy||n>max;b.onclick=()=>{input.value=n;update();};chips.append(b);}controls.append(chips,confirm);update();
  }else if(active&&g.phase==='play'){
   controls.append(node('p','bj-turn',g.yourTurn?'À toi de jouer':(g.players.find(p=>p.accountId===g.turn)?.name||'Le croupier')+' joue…'));
   const actions=node('div','bj-actions');actions.append(button('＋ Tirer','bj-hit',g.yourTurn),button('✓ Rester','bj-stand',g.yourTurn),button('×2 Doubler','bj-double',g.canDouble));controls.append(actions);
  }else controls.append(node('p','bj-turn',active?'En attente des mises des autres joueurs.':g.status==='cancelled'?'La partie a été interrompue.':'Main terminée · retrouve tes résultats sur la table.'));
  if(me&&(active||g.status==='finished')){
   const key=g.id+':'+me.accountId;let state=null,note=null,retry=null;
   if(g.status==='finished'){
    if(!nextHands.has(key)){if(nextHands.size>8)nextHands.clear();nextHands.set(key,{at:Date.now()+3000,pending:false,sent:false,ready:false,failed:null});}
    state=nextHands.get(key);state.ready=(g.replayReady||[]).includes(me.accountId);
    if(state.failed!==null&&state.ready===state.failed)state.failed=null;
    note=node('p','bj-next-note');note.setAttribute('role','status');retry=node('button','bj-next-retry');retry.type='button';retry.dataset.gameControl='';retry.onclick=()=>{if(state.failed!==false)paused=false;nextHandReady(state.failed!==false,true);};
    controls.append(note,retry);
   }
   const choice=node('label','bj-pause'),check=node('input','bj-pause-check');check.type='checkbox';check.dataset.bjField='pause-next-hand';choice.append(check,node('span','','Pause après cette main'));controls.append(choice);
   current={g,root,busy,command,state,note,retry,check,needsBuyin:!!g.pointStake&&me.stack<10};
   check.onchange=()=>{if(current?.check!==check||check.disabled)return;paused=check.checked;if(state){state.at=Date.now()+3000;state.sent=false;state.failed=null;if(paused&&state.ready)nextHandReady(false);}updateNextHand();};
   updateNextHand();
  }else current=null;
  controls.append(node('small','bj-free',g.pointStake?'Jetons ONE · réserve et gains reversés à ton solde après la main':'Jetons de table · aucun Point ONE engagé'));
  const old=previous?.id===g.id?previous:null;if(old&&old.dealer[1]===null&&g.dealer[1]!==null&&g.dealer.length)dealerCards.classList.add('bj-reveal');previous=g;
 };
})();
