export const MAX_BUILDING_LEVEL=13;
// Indexed by the level being reached. Existing saved jobs keep their deadline.
export const UPGRADE_SECONDS=[0,0,30,90,300,900,1800,3600,7200,14400,28800,43200,64800,86400];
export function upgradeSeconds(kind,target){
 const level=Math.max(2,Math.min(MAX_BUILDING_LEVEL,Math.floor(target)||2));
 return Math.max(8,Math.ceil(UPGRADE_SECONDS[level]*(kind==='castle'?2:kind==='wall'?.25:1)));
}
export function formatDuration(seconds){
 const s=Math.max(0,Math.ceil(seconds)||0),d=Math.floor(s/86400),h=Math.floor(s/3600)%24,m=Math.floor(s/60)%60;
 if(d)return d+' j'+(h?' '+h+' h':'');
 if(h)return h+' h'+(m?' '+m+' min':'');
 if(m)return m+' min'+(s%60?' '+s%60+' s':'');
 return s+' s';
}
export const speedupCost=(job,now=Date.now())=>Math.max(5,Math.ceil(Math.max(0,(job?.ends||now)-now)/1800000)*5);
