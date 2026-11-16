// Separate Worker: never replace the Comments/catalogue/rooms Worker with this file.
const ORIGIN='https://one-officiel.fr';
const WEEK=7*86400000;
const ready=new WeakMap();
const schema=[
 'CREATE TABLE IF NOT EXISTS one_tiktok_played(video_id TEXT PRIMARY KEY,last_played_at INTEGER NOT NULL)',
 'CREATE TABLE IF NOT EXISTS one_tiktok_health_meta(id INTEGER PRIMARY KEY CHECK(id=1),started_at INTEGER NOT NULL)',
 'CREATE TABLE IF NOT EXISTS one_tiktok_health_limits(reporter TEXT NOT NULL,bucket INTEGER NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(reporter,bucket))'
];
async function init(db,now){
 let p=ready.get(db);
 if(!p){p=db.batch([...schema.map(q=>db.prepare(q)),db.prepare('INSERT OR IGNORE INTO one_tiktok_health_meta VALUES(1,?)').bind(now)]).catch(e=>{ready.delete(db);throw e;});ready.set(db,p);}
 await p;
}
export default {async fetch(request,env){
 const headers={'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','Vary':'Origin'};
 const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 const origin=request.headers.get('Origin'),path=new URL(request.url).pathname;
 if(origin&&origin!==ORIGIN)return json({ok:false,error:'Origine non autorisée.'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(!['/health','/playback'].includes(path))return json({ok:false},404);
 if(!env.HEALTH)return json({ok:false,error:'Collecte non configurée.'},503);
 try{
  const now=Date.now(),db=env.HEALTH;
  if(path==='/health'&&request.method==='GET'){
   await init(db,now);
   const meta=await db.prepare('SELECT started_at FROM one_tiktok_health_meta WHERE id=1').first();
   const {results}=await db.prepare('SELECT video_id,last_played_at FROM one_tiktok_played WHERE last_played_at>=? ORDER BY last_played_at DESC LIMIT 5001').bind(now-WEEK).all();
   // An incomplete snapshot must never authorize hiding.
   if(results.length>5000)return json({ok:false,error:'Historique trop volumineux.'},503);
   return json({ok:true,version:1,policy:'temporary-v1',startedAt:new Date(meta.started_at).toISOString(),generatedAt:new Date(now).toISOString(),entries:results.map(r=>({id:r.video_id,playedAt:new Date(r.last_played_at).toISOString()}))});
  }
  if(path!=='/playback'||request.method!=='POST')return json({ok:false},405);
  if(origin!==ORIGIN)return json({ok:false},403);
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))return json({ok:false},415);
  if(Number(request.headers.get('Content-Length'))>2048)return json({ok:false},413);
  // This public, positive-only collector never needs an account credential.
  if(request.headers.has('Authorization'))return json({ok:false},400);
  const reader=request.body?.getReader();if(!reader)return json({ok:false},400);
  const chunks=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();return json({ok:false},413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  const raw=new TextDecoder().decode(bytes);
  let data;try{data=JSON.parse(raw);}catch{return json({ok:false},400);}
  if(typeof data?.videoId!=='string'||!/^\d{8,24}$/.test(data.videoId)||data.seconds!==2||Object.keys(data).sort().join(',')!=='seconds,videoId')return json({ok:false},400);
  // No name, token, account, IP address, device identifier or per-user history.
  // Client observations can be forged: they only restore/protect, never hide a video.
  const bucket=Math.floor(now/60000);
  await init(db,now);
  const allowed=await db.prepare('INSERT INTO one_tiktok_health_limits VALUES(?,?,1) ON CONFLICT(reporter,bucket) DO UPDATE SET count=count+1 WHERE count<120 RETURNING count').bind('global',bucket).first();
  if(!allowed)return json({ok:false},429);
  const writes=await db.batch([
   db.prepare('DELETE FROM one_tiktok_played WHERE last_played_at<?').bind(now-WEEK),
   db.prepare('INSERT INTO one_tiktok_played SELECT ?,? WHERE EXISTS(SELECT 1 FROM one_tiktok_played WHERE video_id=?) OR (SELECT COUNT(*) FROM one_tiktok_played)<5000 ON CONFLICT(video_id) DO UPDATE SET last_played_at=MAX(last_played_at,excluded.last_played_at)').bind(data.videoId,now,data.videoId),
   db.prepare('DELETE FROM one_tiktok_health_limits WHERE bucket<?').bind(bucket-120)
  ]);
  if(!writes[1].meta.changes)return json({ok:false},429);
  return json({ok:true,playedAt:new Date(now).toISOString()});
 }catch{return json({ok:false,error:'Collecte momentanément indisponible.'},503);}
}};
