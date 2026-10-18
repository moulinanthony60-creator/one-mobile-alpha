// The browser records commands, never replacement balances. The server replays
// these commands against its own village, including losses received offline.
export function onlineReady(s){
 if(s.cloud?.busy)throw new Error('Sauvegarde ONE en cours… Réessayez dans un instant.');
 if(s.cloud?.raid)throw new Error('Terminez votre attaque en ligne avant de modifier le village.');
 if(s.cloud?.queue?.length>=400)throw new Error('Reconnectez-vous à ONE pour sauvegarder votre progression.');
}
export function recordOnline(s,event){
 if(!s.cloud)return;
 const q=s.cloud.queue??=[];
 if(event.kind==='tick'&&q.at(-1)?.kind==='tick'&&q.at(-1).mode===event.mode&&q.at(-1).dt+event.dt<1.99){q.at(-1).dt+=event.dt;q.at(-1).at=event.at;}
 else q.push(event);
}
