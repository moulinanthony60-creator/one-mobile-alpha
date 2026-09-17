(()=>{
 let busy=false;
 const button=document.createElement('button');button.type='button';button.id='oneRefreshContent';button.textContent='↻';button.setAttribute('aria-label','Actualiser le contenu');const search=document.getElementById('oneSearchToggle');search?.before(button);
 async function refresh(){if(busy)return;if(document.getElementById('vfeed').classList.contains('show')&&verticalFeedMode==='tiktok'){document.getElementById('oneRefreshTikTok').click();return;}busy=true;button.disabled=true;button.setAttribute('aria-busy','true');const platform=state.filter;try{if(platform==='twitch')await twitchStreams(false,state.query);else if(platform==='youtube'){await youtubeSearch(state.query||'gaming france',false,false);if(window.oneYoutubeTab==='following')await window.oneRefreshFollowedPriority?.();}else if(platform==='tiktok'){oneTikTokSession=null;loadTikTokLocal();render();}else await loadUnifiedFeed();}catch{toast('Actualisation indisponible. Réessaie dans un instant.');}finally{busy=false;button.disabled=false;button.removeAttribute('aria-busy');}}
 button.onclick=refresh;

})();
