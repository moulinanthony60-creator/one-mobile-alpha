// ONE Messages API v2 — media delivery through a secure share token.
// Bindings: DB (D1), MEDIA (R2), PROFILE (service binding)

const HOME = 'https://one-officiel.fr/';
const ORIGIN = new URL(HOME).origin;
const PHOTO_MAX = 15 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

const schema = [
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('text','photo','video')),
    text TEXT NOT NULL DEFAULT '',
    media_key TEXT,
    media_type TEXT,
    media_size INTEGER NOT NULL DEFAULT 0,
    client_id TEXT,
    created_at INTEGER NOT NULL,
    delivered_at INTEGER,
    opened_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS messages_conversation_time
   ON messages(conversation_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS messages_recipient_delivery
   ON messages(recipient_id, delivered_at, created_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS messages_sender_client
   ON messages(sender_id, client_id)
   WHERE client_id IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS media_shares (
    message_id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL,
    delivered_at INTEGER,
    opened_at INTEGER,
    opened_by TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS media_shares_created
   ON media_shares(created_at DESC)`
];

const initialized = new WeakMap();
const fail = (status, message) => Object.assign(new Error(message), { status });

function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
    ...extra
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    })
  });
}

async function init(env) {
  if (!env.DB || !env.MEDIA || !env.PROFILE) {
    throw fail(503, 'Installation de ONE Messages incomplète.');
  }
  let task = initialized.get(env.DB);
  if (!task) {
    task = env.DB.batch(schema.map(q => env.DB.prepare(q))).catch(err => {
      initialized.delete(env.DB);
      throw err;
    });
    initialized.set(env.DB, task);
  }
  await task;
}

async function account(req, env) {
  const token = req.headers.get('Authorization') || '';
  if (!/^Bearer \S+$/.test(token)) throw fail(401, 'Connecte-toi à ton compte ONE.');
  let response;
  try {
    response = await env.PROFILE.fetch(new Request(
      'https://one-profile-api.moulinanthony60.workers.dev/auth/me',
      { headers: { Authorization: token, Origin: ORIGIN } }
    ));
  } catch {
    throw fail(503, 'Compte ONE momentanément indisponible.');
  }
  if (response.status === 401 || response.status === 403) {
    throw fail(401, 'Reconnecte-toi à ton compte ONE.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok || !data.account?.id) {
    throw fail(503, 'Vérification du compte ONE indisponible.');
  }
  return String(data.account.id);
}

function validRecipient(value) {
  const id = String(value || '').trim();
  if (!id || id.length > 220 || /[\u0000-\u001f\u007f]/.test(id)) {
    throw fail(400, 'Destinataire invalide.');
  }
  return id;
}

function validClientId(value) {
  if (!value) return null;
  const id = String(value).trim();
  if (!/^[A-Za-z0-9_.:-]{1,100}$/.test(id)) throw fail(400, 'Identifiant de message invalide.');
  return id;
}

function conversationId(a, b) {
  return [String(a), String(b)].sort().join('~');
}

async function readJson(req) {
  const raw = await req.text();
  if (raw.length > 20000) throw fail(413, 'Requête trop longue.');
  try { return JSON.parse(raw); } catch { throw fail(400, 'Requête invalide.'); }
}

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomToken() {
  return b64url(crypto.getRandomValues(new Uint8Array(32)));
}

async function tokenHash(token) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(token || ''))));
  return [...digest].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function messageById(env, id) {
  return env.DB.prepare('SELECT * FROM messages WHERE id=?').bind(id).first();
}

async function shareById(env, id) {
  return env.DB.prepare('SELECT * FROM media_shares WHERE message_id=?').bind(id).first();
}

async function checkedShare(env, id, token) {
  if (!token || token.length > 200) throw fail(403, 'Lien média invalide.');
  const row = await shareById(env, id);
  if (!row || row.token_hash !== await tokenHash(token)) throw fail(403, 'Lien média invalide ou expiré.');
  const message = await messageById(env, id);
  if (!message?.media_key) throw fail(404, 'Média introuvable.');
  return { share: row, message };
}

function messageStatus(row) {
  if (row.opened_at) return 'opened';
  if (row.delivered_at) return 'delivered';
  return 'sent';
}

function serializeMessage(row, accountId, apiOrigin) {
  const outgoing = row.sender_id === accountId;
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    peerId: outgoing ? row.recipient_id : row.sender_id,
    direction: outgoing ? 'out' : 'in',
    type: row.type,
    text: row.text || '',
    status: outgoing ? messageStatus(row) : (row.opened_at ? 'opened' : 'received'),
    unopened: !outgoing && !row.opened_at && (row.type === 'photo' || row.type === 'video'),
    createdAt: row.created_at,
    deliveredAt: row.delivered_at || null,
    openedAt: row.opened_at || null,
    media: row.media_key ? {
      url: `${apiOrigin}/media/${encodeURIComponent(row.id)}`,
      mime: row.media_type || '',
      size: Number(row.media_size || 0)
    } : null
  };
}

async function existingByClient(env, sender, clientId) {
  if (!clientId) return null;
  return env.DB.prepare('SELECT * FROM messages WHERE sender_id=? AND client_id=? LIMIT 1')
    .bind(sender, clientId).first();
}

async function sendText(req, env, sender, origin) {
  const body = await readJson(req);
  const recipient = validRecipient(body.to);
  const text = String(body.text || '').trim();
  if (!text) throw fail(400, 'Message vide.');
  if (text.length > 5000) throw fail(413, 'Message trop long.');
  const clientId = validClientId(body.clientId);
  const previous = await existingByClient(env, sender, clientId);
  if (previous) return serializeMessage(previous, sender, origin);
  const id = crypto.randomUUID(), now = Date.now(), conversation = conversationId(sender, recipient);
  await env.DB.prepare(`INSERT INTO messages
    (id,conversation_id,sender_id,recipient_id,type,text,client_id,created_at)
    VALUES (?,?,?,?, 'text',?,?,?)`)
    .bind(id, conversation, sender, recipient, text, clientId, now).run();
  return serializeMessage(await messageById(env, id), sender, origin);
}

async function sendMedia(req, env, sender, origin, url) {
  const recipient = validRecipient(url.searchParams.get('to') || 'legacy');
  const type = String(url.searchParams.get('type') || '');
  if (!['photo', 'video'].includes(type)) throw fail(400, 'Type de média invalide.');
  const clientId = validClientId(url.searchParams.get('clientId'));
  const previous = await existingByClient(env, sender, clientId);
  if (previous) {
    const shareToken = randomToken();
    await env.DB.prepare(`INSERT INTO media_shares(message_id,token_hash,created_at)
      VALUES(?,?,?) ON CONFLICT(message_id) DO UPDATE SET token_hash=excluded.token_hash`)
      .bind(previous.id, await tokenHash(shareToken), Date.now()).run();
    return { message: serializeMessage(previous, sender, origin), shareToken };
  }

  const contentType = String(req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type === 'photo' && !contentType.startsWith('image/')) throw fail(415, 'Le fichier envoyé n’est pas une photo.');
  if (type === 'video' && !contentType.startsWith('video/')) throw fail(415, 'Le fichier envoyé n’est pas une vidéo.');
  if (!req.body) throw fail(400, 'Fichier manquant.');
  const max = type === 'photo' ? PHOTO_MAX : VIDEO_MAX;
  const declaredSize = Number(req.headers.get('content-length') || 0);
  if (declaredSize && declaredSize > max) throw fail(413, type === 'photo' ? 'Photo trop volumineuse.' : 'Vidéo trop volumineuse.');

  const id = crypto.randomUUID(), now = Date.now(), conversation = conversationId(sender, recipient);
  const key = `${sender}/${now}-${id}`;
  let stored;
  try {
    stored = await env.MEDIA.put(key, req.body, {
      httpMetadata: { contentType },
      customMetadata: { sender, messageId: id, type }
    });
    if (stored.size > max) {
      await env.MEDIA.delete(key);
      throw fail(413, type === 'photo' ? 'Photo trop volumineuse.' : 'Vidéo trop volumineuse.');
    }
    await env.DB.prepare(`INSERT INTO messages
      (id,conversation_id,sender_id,recipient_id,type,text,media_key,media_type,media_size,client_id,created_at)
      VALUES (?,?,?,?,?,'',?,?,?,?,?)`)
      .bind(id, conversation, sender, recipient, type, key, contentType, stored.size, clientId, now).run();
  } catch (err) {
    if (stored) try { await env.MEDIA.delete(key); } catch {}
    throw err;
  }

  const shareToken = randomToken();
  await env.DB.prepare(`INSERT INTO media_shares(message_id,token_hash,created_at) VALUES(?,?,?)`)
    .bind(id, await tokenHash(shareToken), now).run();
  return { message: serializeMessage(await messageById(env, id), sender, origin), shareToken };
}

async function conversations(env, accountId, origin, url) {
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 50)));
  const result = await env.DB.prepare(`WITH ranked AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at DESC) rn
    FROM messages WHERE sender_id=? OR recipient_id=?
  ) SELECT * FROM ranked WHERE rn=1 ORDER BY created_at DESC LIMIT ?`)
    .bind(accountId, accountId, limit).all();
  return (result.results || []).map(row => serializeMessage(row, accountId, origin));
}

async function messages(env, accountId, origin, url) {
  const peer = validRecipient(url.searchParams.get('peer'));
  const conversation = conversationId(accountId, peer);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 50)));
  const before = Number(url.searchParams.get('before') || Date.now() + 1);
  const result = await env.DB.prepare(`SELECT * FROM messages
    WHERE conversation_id=? AND created_at<? ORDER BY created_at DESC LIMIT ?`)
    .bind(conversation, before, limit).all();
  return (result.results || []).reverse().map(row => serializeMessage(row, accountId, origin));
}

async function openMessage(env, accountId, origin, id) {
  const now = Date.now();
  const row = await env.DB.prepare(`UPDATE messages
    SET delivered_at=COALESCE(delivered_at,?), opened_at=COALESCE(opened_at,?)
    WHERE id=? AND recipient_id=? RETURNING *`)
    .bind(now, now, id, accountId).first();
  if (!row) throw fail(404, 'Message introuvable.');
  return serializeMessage(row, accountId, origin);
}

async function sharedStatus(env, accountId, id, token) {
  const { share, message } = await checkedShare(env, id, token);
  return {
    id,
    type: message.type,
    mine: message.sender_id === accountId,
    delivered: !!(share.delivered_at || message.delivered_at),
    opened: !!(share.opened_at || message.opened_at),
    deliveredAt: share.delivered_at || message.delivered_at || null,
    openedAt: share.opened_at || message.opened_at || null
  };
}

async function markShared(env, accountId, id, token, opened) {
  const { message } = await checkedShare(env, id, token);
  if (message.sender_id === accountId) return sharedStatus(env, accountId, id, token);
  const now = Date.now();
  if (opened) {
    await env.DB.batch([
      env.DB.prepare(`UPDATE media_shares SET delivered_at=COALESCE(delivered_at,?), opened_at=COALESCE(opened_at,?), opened_by=COALESCE(opened_by,?) WHERE message_id=?`).bind(now, now, accountId, id),
      env.DB.prepare(`UPDATE messages SET delivered_at=COALESCE(delivered_at,?), opened_at=COALESCE(opened_at,?) WHERE id=?`).bind(now, now, id)
    ]);
  } else {
    await env.DB.batch([
      env.DB.prepare(`UPDATE media_shares SET delivered_at=COALESCE(delivered_at,?) WHERE message_id=?`).bind(now, id),
      env.DB.prepare(`UPDATE messages SET delivered_at=COALESCE(delivered_at,?) WHERE id=?`).bind(now, id)
    ]);
  }
  return sharedStatus(env, accountId, id, token);
}

function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(header || '');
  if (!match) return null;
  let start, end;
  if (!match[1] && match[2]) {
    const suffix = Number(match[2]);
    if (!Number.isFinite(suffix) || suffix <= 0) return { invalid: true };
    start = Math.max(0, size - suffix); end = size - 1;
  } else {
    start = Number(match[1]); end = match[2] ? Number(match[2]) : size - 1;
  }
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start >= size || end < start) return { invalid: true };
  end = Math.min(end, size - 1);
  return { start, end, offset: start, length: end - start + 1 };
}

async function serveObject(req, env, key) {
  const head = await env.MEDIA.head(key);
  if (!head) throw fail(404, 'Média introuvable.');
  const headers = new Headers(corsHeaders({
    'Cache-Control': 'private, no-store',
    'Accept-Ranges': 'bytes'
  }));
  head.writeHttpMetadata(headers);
  const range = parseRange(req.headers.get('range'), head.size);
  if (range?.invalid) {
    headers.set('Content-Range', `bytes */${head.size}`);
    return new Response(null, { status: 416, headers });
  }
  if (range) {
    const object = await env.MEDIA.get(key, { range: { offset: range.offset, length: range.length } });
    if (!object) throw fail(404, 'Média introuvable.');
    object.writeHttpMetadata(headers);
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${head.size}`);
    headers.set('Content-Length', String(range.length));
    return new Response(object.body, { status: 206, headers });
  }
  const object = await env.MEDIA.get(key);
  if (!object) throw fail(404, 'Média introuvable.');
  object.writeHttpMetadata(headers);
  headers.set('Content-Length', String(head.size));
  return new Response(object.body, { status: 200, headers });
}

async function serveMedia(req, env, accountId, id) {
  const message = await messageById(env, id);
  if (!message?.media_key || (message.sender_id !== accountId && message.recipient_id !== accountId)) {
    throw fail(404, 'Média introuvable.');
  }
  return serveObject(req, env, message.media_key);
}

async function serveSharedMedia(req, env, id, token) {
  const { message } = await checkedShare(env, id, token);
  return serveObject(req, env, message.media_key);
}

export default {
  async fetch(req, env) {
    try {
      const url = new URL(req.url);
      const requestOrigin = req.headers.get('Origin');
      if (requestOrigin && requestOrigin !== ORIGIN) throw fail(403, 'Origine non autorisée.');
      if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders({
          'Access-Control-Allow-Headers': 'Authorization, Content-Type, Range',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Max-Age': '600'
        })});
      }
      await init(env);
      if (url.pathname === '/health' && req.method === 'GET') {
        return json({ ok: true, service: 'ONE Messages', version: 2, database: true, media: true, profile: true, sharedDelivery: true });
      }

      const accountId = await account(req, env);
      const apiOrigin = url.origin;
      const communication = await commRoute(req,env,accountId,url);if(communication)return communication;

      if (url.pathname === '/conversations' && req.method === 'GET') return json({ ok: true, conversations: await conversations(env, accountId, apiOrigin, url) });
      if (url.pathname === '/messages' && req.method === 'GET') return json({ ok: true, messages: await messages(env, accountId, apiOrigin, url) });
      if (url.pathname === '/messages/text' && req.method === 'POST') return json({ ok: true, message: await sendText(req, env, accountId, apiOrigin) });
      if (url.pathname === '/messages/media' && req.method === 'POST') {
        const out = await sendMedia(req, env, accountId, apiOrigin, url);
        return json({ ok: true, ...out });
      }

      let m = url.pathname.match(/^\/messages\/([^/]+)\/open$/);
      if (m && req.method === 'POST') return json({ ok: true, message: await openMessage(env, accountId, apiOrigin, decodeURIComponent(m[1])) });

      m = url.pathname.match(/^\/messages\/([^/]+)\/share-status$/);
      if (m && req.method === 'GET') return json({ ok: true, status: await sharedStatus(env, accountId, decodeURIComponent(m[1]), url.searchParams.get('token') || '') });

      m = url.pathname.match(/^\/messages\/([^/]+)\/delivered-shared$/);
      if (m && req.method === 'POST') return json({ ok: true, status: await markShared(env, accountId, decodeURIComponent(m[1]), url.searchParams.get('token') || '', false) });

      m = url.pathname.match(/^\/messages\/([^/]+)\/open-shared$/);
      if (m && req.method === 'POST') return json({ ok: true, status: await markShared(env, accountId, decodeURIComponent(m[1]), url.searchParams.get('token') || '', true) });

      m = url.pathname.match(/^\/shared-media\/([^/]+)$/);
      if (m && req.method === 'GET') {
        await account(req, env); // keep shared media limited to an authenticated ONE session
        return serveSharedMedia(req, env, decodeURIComponent(m[1]), url.searchParams.get('token') || '');
      }

      m = url.pathname.match(/^\/media\/([^/]+)$/);
      if (m && req.method === 'GET') return serveMedia(req, env, accountId, decodeURIComponent(m[1]));

      throw fail(404, 'Adresse inconnue.');
    } catch (err) {
      console.error(JSON.stringify({ event: 'one_messages_error', status: err.status || 500, message: err.status ? err.message : 'Erreur interne' }));
      return json({ ok: false, error: err.status ? err.message : 'ONE Messages momentanément indisponible.' }, err.status || 500);
    }
  }
};

// Private voice messages and one-to-one call signaling. Existing D1/R2 bindings retained.
const commSchema = [
`CREATE TABLE IF NOT EXISTS one_voice(id TEXT PRIMARY KEY,sender TEXT NOT NULL,recipient TEXT NOT NULL,media_key TEXT NOT NULL,mime TEXT NOT NULL,created INTEGER NOT NULL,client_id TEXT NOT NULL,UNIQUE(sender,client_id))`,
`CREATE INDEX IF NOT EXISTS one_voice_peers ON one_voice(sender,recipient,created)`,
`CREATE TABLE IF NOT EXISTS one_calls(id TEXT PRIMARY KEY,caller TEXT NOT NULL,callee TEXT NOT NULL,video INTEGER NOT NULL,offer TEXT NOT NULL,answer TEXT,state TEXT NOT NULL,created INTEGER NOT NULL,caller_seen INTEGER NOT NULL,callee_seen INTEGER NOT NULL)`,
`CREATE INDEX IF NOT EXISTS one_calls_recipient ON one_calls(callee,state,created)`,
`CREATE TABLE IF NOT EXISTS one_call_ice(seq INTEGER PRIMARY KEY AUTOINCREMENT,call_id TEXT NOT NULL,sender TEXT NOT NULL,candidate TEXT NOT NULL,created INTEGER NOT NULL)`
];
const commReady=new WeakMap();
async function commInit(env){let p=commReady.get(env.DB);if(!p){p=env.DB.batch(commSchema.map(s=>env.DB.prepare(s))).catch(e=>{commReady.delete(env.DB);throw e});commReady.set(env.DB,p)}await p;}
async function acceptedPeer(req,me,peer){
 if(peer===me||peer.startsWith('group:'))throw fail(400,'Choisis un ami pour cette conversation privée.');
 const r=await fetch('https://one-comments-api.moulinanthony60.workers.dev/friends/state',{headers:{Authorization:req.headers.get('Authorization'),Origin:ORIGIN}});
 if(!r.ok)throw fail(503,'Vérification des amis indisponible.');const d=await r.json();
 if(!(d.relationships||[]).some(x=>String(x.id)===peer&&x.status==='accepted'))throw fail(403,'Cette fonction est réservée à tes amis ONE.');
}
function iceConfig(env){if(env.PARTY_ICE_SERVERS){try{const x=JSON.parse(env.PARTY_ICE_SERVERS);if(Array.isArray(x)&&x.length)return x;}catch{}}return [{urls:'stun:stun.l.google.com:19302'}];}
async function callRow(env,id,me){const c=await env.DB.prepare('SELECT * FROM one_calls WHERE id=?').bind(id).first();if(!c||![c.caller,c.callee].includes(me))throw fail(404,'Appel introuvable.');return c;}
function expiredCall(c){return c.state==='ringing'?Date.now()-c.created>45000:c.state==='active'&&(Date.now()-c.caller_seen>60000||Date.now()-c.callee_seen>60000);}
async function commRoute(req,env,me,url){
 const p=url.pathname;if(!p.startsWith('/voice')&&!p.startsWith('/calls')&&p!=='/communications')return null;
 await commInit(env);
 if(p==='/communications'&&req.method==='GET')return json({ok:true,voice:true,calls:true,iceServers:iceConfig(env)});
 if(p==='/voice'&&req.method==='GET'){const peer=validRecipient(url.searchParams.get('peer'));const result=await env.DB.prepare('SELECT id,sender,recipient,mime,created FROM one_voice WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?) ORDER BY created DESC LIMIT 100').bind(me,peer,peer,me).all();return json({ok:true,messages:(result.results||[]).reverse()});}
 if(p==='/voice'&&req.method==='POST'){
  const peer=validRecipient(url.searchParams.get('to'));await acceptedPeer(req,me,peer);
  const client=validClientId(url.searchParams.get('clientId'));if(!client)throw fail(400,'Identifiant de vocal manquant.');
  const old=await env.DB.prepare('SELECT id FROM one_voice WHERE sender=? AND client_id=?').bind(me,client).first();if(old)return json({ok:true,id:old.id});
  const mime=(req.headers.get('content-type')||'').split(';')[0].toLowerCase();if(!['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav'].includes(mime))throw fail(415,'Format audio non pris en charge.');
  if(!req.body)throw fail(400,'Vocal vide.');
  const reader=req.body.getReader(),chunks=[];let size=0;
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>10*1024*1024){await reader.cancel();throw fail(413,'Vocal trop volumineux (10 Mo maximum).');}chunks.push(value);}
  if(!size)throw fail(400,'Vocal vide.');const data=new Uint8Array(size);let offset=0;for(const c of chunks){data.set(c,offset);offset+=c.length;}
  const id=crypto.randomUUID(),key='voice/'+me+'/'+id,created=Date.now();await env.MEDIA.put(key,data,{httpMetadata:{contentType:mime}});
  try{await env.DB.prepare('INSERT INTO one_voice VALUES(?,?,?,?,?,?,?)').bind(id,me,peer,key,mime,created,client).run();}catch(e){await env.MEDIA.delete(key);throw e;}
  return json({ok:true,id});
 }
 let m=p.match(/^\/voice\/([^/]+)$/);if(m&&req.method==='GET'){const row=await env.DB.prepare('SELECT * FROM one_voice WHERE id=?').bind(m[1]).first();if(!row||![row.sender,row.recipient].includes(me))throw fail(404,'Vocal introuvable.');return serveObject(req,env,row.media_key);}
 if(p==='/calls'&&req.method==='POST'){
  const d=await readJson(req),peer=validRecipient(d.to);await acceptedPeer(req,me,peer);if(typeof d.offer!=='string'||d.offer.length>16000||!d.offer.startsWith('v='))throw fail(400,'Proposition d’appel invalide.');
  const now=Date.now();await env.DB.prepare("UPDATE one_calls SET state='ended' WHERE (state='ringing' AND created<?) OR (state='active' AND (caller_seen<? OR callee_seen<?))").bind(now-45000,now-60000,now-60000).run();
  const id=crypto.randomUUID();const inserted=await env.DB.prepare("INSERT INTO one_calls SELECT ?,?,?,?,?,NULL,'ringing',?,?,? WHERE NOT EXISTS(SELECT 1 FROM one_calls WHERE state IN ('ringing','active') AND (caller IN (?,?) OR callee IN (?,?))) RETURNING id").bind(id,me,peer,d.video?1:0,d.offer,now,now,now,me,peer,me,peer).first();
  if(!inserted)throw fail(409,'Un des participants est déjà en appel.');return json({ok:true,id});
 }
 if(p==='/calls/incoming'&&req.method==='GET'){const row=await env.DB.prepare("SELECT id,caller,video,created FROM one_calls WHERE callee=? AND state='ringing' AND created>? ORDER BY created DESC LIMIT 1").bind(me,Date.now()-45000).first();return json({ok:true,call:row||null});}
 m=p.match(/^\/calls\/([^/]+)(?:\/(answer|ice|end))?$/);if(!m)throw fail(404,'Adresse inconnue.');
 const c=await callRow(env,m[1],me),action=m[2];if(expiredCall(c)){await env.DB.prepare("UPDATE one_calls SET state='ended' WHERE id=?").bind(c.id).run();c.state='ended';}
 if(!action&&req.method==='GET'){
  if(c.state==='active'||c.state==='ringing')await env.DB.prepare(`UPDATE one_calls SET ${me===c.caller?'caller_seen':'callee_seen'}=? WHERE id=?`).bind(Date.now(),c.id).run();
  const after=Math.max(0,Number(url.searchParams.get('after'))||0);const rows=await env.DB.prepare('SELECT seq,candidate FROM one_call_ice WHERE call_id=? AND sender<>? AND seq>? ORDER BY seq LIMIT 256').bind(c.id,me,after).all();
  return json({ok:true,call:{id:c.id,caller:c.caller,callee:c.callee,video:!!c.video,state:c.state,offer:me===c.callee?c.offer:null,answer:me===c.caller?c.answer:null},ice:rows.results||[]});
 }
 if(action==='end'&&req.method==='POST'){await env.DB.batch([env.DB.prepare("UPDATE one_calls SET state='ended' WHERE id=?").bind(c.id),env.DB.prepare('DELETE FROM one_call_ice WHERE call_id=?').bind(c.id)]);return json({ok:true});}
 if(c.state==='ended')throw fail(409,'Cet appel est terminé.');
 if(action==='answer'&&req.method==='POST'){
  if(me!==c.callee||c.state!=='ringing')throw fail(403,'Réponse non autorisée.');const d=await readJson(req);if(typeof d.answer!=='string'||d.answer.length>16000||!d.answer.startsWith('v='))throw fail(400,'Réponse invalide.');
  await env.DB.prepare("UPDATE one_calls SET answer=?,state='active',callee_seen=? WHERE id=? AND state='ringing'").bind(d.answer,Date.now(),c.id).run();return json({ok:true});
 }
 if(action==='ice'&&req.method==='POST'){const d=await readJson(req),v=JSON.stringify(d.candidate);if(!d.candidate||typeof d.candidate.candidate!=='string'||v.length>2048)throw fail(400,'Candidat invalide.');
  const count=await env.DB.prepare('SELECT COUNT(*) n FROM one_call_ice WHERE call_id=? AND sender=?').bind(c.id,me).first();if(count.n>=256)throw fail(429,'Trop de candidats.');await env.DB.prepare('INSERT INTO one_call_ice(call_id,sender,candidate,created) VALUES(?,?,?,?)').bind(c.id,me,v,Date.now()).run();return json({ok:true});}
 throw fail(405,'Méthode non autorisée.');
}
