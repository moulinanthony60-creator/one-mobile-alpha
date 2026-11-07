// Exercise shipped UI and the bundled 3D picker without any production requests.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const inline=id=>{const match=html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)<\\/script>'));assert(match,id);return match[1];};
const output=process.env.ONE_TEST_OUTPUT,removed=['kart','shoot','codes','who','wolf'],retained=['bluff','poker','blackjack','douze','colors','trio','connect','timer'];
const types={'.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.glb':'model/gltf-binary'};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/__games-test'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body><header class="topbar"><div class="brandrow">ONE.</div></header><main id="oneFoundation"></main></body></html>');return;}
 const file=path.resolve(root,'.'+decodeURIComponent(pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(file,(err,body)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(body);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 let browser;const errors=[],missing=[];
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ONE_CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
  await page.goto(origin+'/__games-test');
  for(const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g))await page.addStyleTag({content:match[1]});
  await page.evaluate(()=>{window.oneSocialRoom=()=>null;window.oneCurrentSpace=()=>'';});
  for(const file of ['ui/party-collection.js','ui/party-art.js','ui/party-public.js'])await page.addScriptTag({url:origin+'/'+file});
  await page.addScriptTag({content:inline('one-social-core-v202')});
  await page.addScriptTag({url:origin+'/ui/social-app.js'});
  await page.evaluate(()=>ONEPublicRooms.catalog(document.getElementById('oneFoundation')));
  assert.deepEqual(await page.evaluate(()=>ONEUI.games().map(g=>g.id).sort()),[...retained].sort());
  assert.equal(await page.locator('.os-game-card').count(),retained.length);
  for(const label of ['ONE Codes','ONE Qui est-ce ?','ONE Loups-garous'])assert.equal(await page.getByText(label,{exact:true}).count(),0);
  if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'catalogue-mobile.png'),fullPage:true});}
  // Older clients may still announce a removed game: do not show a launch action.
  for(const kind of ['codes','who','wolf']){
   const result=await page.evaluate(kind=>{
    const parent=document.createElement('div'),room={id:'old',name:'Ancien salon',members:[{accountId:'alice',isYou:true}],activity:{id:'proposal',kind}};
    ONEUI.activity(parent,{room});window.dispatchEvent(new CustomEvent('one-party-state',{detail:room}));
    return {text:parent.textContent,buttons:[...parent.querySelectorAll('button')].map(b=>b.textContent),banner:!!document.querySelector('.one-proposal-banner')};
   },kind);
   assert.match(result.text,/n’est plus proposé/);assert.deepEqual(result.buttons,['Choisir un autre jeu']);assert.equal(result.banner,false);
  }
  await page.addScriptTag({content:inline('one-matchmaking-v202')});
  assert.deepEqual(await page.evaluate(()=>Object.keys(ONEMatchmaking.catalog).sort()),['317','paint','murder','prop',...retained].sort());
  for(const game of removed){
   await page.evaluate(game=>{window.oneSocialRoom=()=>({id:'old',members:[],matchmaking:{game,size:1}});ONEMatchmaking.open(game);},game);
   assert.equal(await page.locator('.os202-match-games [aria-pressed="true"]').getAttribute('data-game'),'paint');
   await page.locator('.os202-match button[aria-label="Fermer la recherche de partie"]').click();
  }
  // Import the production bundle to catch forgotten rebuilds and stale catalogues.
  await page.goto(origin+'/__games-test');await page.addStyleTag({url:origin+'/ui/one-lobby-3d.css'});
  await page.evaluate(async()=>{
   window.__ONE198_TEST__=true;
   window.oneSocialRoom=()=>({id:'test-room',name:'Salon de test',hostId:'alice',members:[{accountId:'alice',name:'Alice',isYou:true,isHost:true}]});
   window.ONEPartyGameLink={subscribe:()=>()=>{},send:()=>true,sendReliable:()=>true,connect:async()=>{},reconnect:async()=>{},peers:()=>[]};
   window.oneCloseSalon=()=>{};window.oneOpenSalon=()=>{};
   const mod=await import('/ui/one-3d-v234.js?v=235');window.ONEOpen3DLobby=()=>mod.open({room:window.oneSocialRoom()});window.ONEOpen3DLobby();
  });
  await page.locator('[data-screen-open]').click();
  assert.deepEqual(await page.locator('.screen-card').evaluateAll(cards=>cards.map(c=>c.dataset.game)),['paint','murder','prop','317']);
  assert.deepEqual(await page.evaluate(()=>['kart','shoot'].map(id=>ONEArcadeTest.select(id))),[false,false]);
  await page.locator('.screen-card[data-game="prop"]').click();assert.equal(await page.evaluate(()=>ONEArcadeTest.state().selection.game),'prop');
  const box=await page.locator('.one3d-game-screen').boundingBox();assert(box.x>=0&&box.x+box.width<=391,'picker fits mobile width');
  if(output)await page.screenshot({path:path.join(output,'jeux-3d-mobile.png')});
  await page.setViewportSize({width:1280,height:800});assert.equal(await page.locator('.screen-card').count(),4);
  await page.evaluate(()=>ONELobby3D.close());assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('PASS: catalogues, old proposals, public matchmaking and bundled 3D picker; mobile and desktop.');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
