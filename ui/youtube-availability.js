/* Only publish videos whose integration permission has been checked. */
(()=>{
 const cache=new Map(),queue=new Set();let running=false,timer;
 const ttl=30*60*1000;
 function allowed(v){const s=v?.status,c=v?.contentDetails,r=c?.regionRestriction;return !!v&&s?.embeddable===true&&s.privacyStatus!=='private'&&(!s.uploadStatus||s.uploadStatus==='processed')&&c?.contentRating?.ytRating!=='ytAgeRestricted'&&(!r?.allowed||r.allowed.includes('FR'))&&!r?.blocked?.includes('FR');}
 window.oneYoutubeEmbeddingAllowed=allowed;
 async function drain(){if(running)return;const key=localStorage.getItem('one_youtube_api_key');if(!key){queue.clear();return;}running=true;
 try{while(queue.size){const ids=[...queue].slice(0,50);ids.forEach(id=>queue.delete(id));const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);try{const res=await fetch('https://www.googleapis.com/youtube/v3/videos?part=status,contentDetails&id='+encodeURIComponent(ids.join(','))+'&key='+encodeURIComponent(key),{signal:controller.signal});if(!res.ok)throw new Error('verification');const data=await res.json();if(!Array.isArray(data.items))throw new Error('verification');const byId=new Map(data.items.map(v=>[v.id,v]));ids.forEach(id=>cache.set(id,{ok:allowed(byId.get(id)),until:Date.now()+ttl}));}catch{ids.forEach(id=>cache.set(id,{ok:false,unknown:true,until:Date.now()+60000}));}finally{clearTimeout(timeout);}}}
 finally{running=false;render();if(document.getElementById('vfeed').classList.contains('show')&&verticalFeedMode==='youtube')renderVerticalFeed();}
 }
 window.onePlayableYoutube=arr=>arr.filter(x=>{if(x.p!=='youtube')return true;if(!x.videoId)return false;const hit=cache.get(x.videoId);if(hit&&hit.until>Date.now())return hit.ok;queue.add(x.videoId);clearTimeout(timer);timer=setTimeout(drain,0);return false;});
 const previous=filtered;filtered=function(){return window.onePlayableYoutube(previous.apply(this,arguments));};
 const priorRender=render;render=function(){const result=priorRender.apply(this,arguments);if(state.filter==='youtube'){const empty=document.querySelector('#feed .empty');if(empty){empty.textContent=queue.size||running?'Vérification des vidéos lisibles dans ONE…':[...cache.values()].some(v=>v.unknown)?'Vérification YouTube indisponible. Réessaie dans un instant.':'Aucune vidéo lisible dans ONE pour cette sélection.';}}return result;};window.render=render;
})();
