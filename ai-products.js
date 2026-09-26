/* A merchant name in a title is not evidence of the destination domain. */
function oneAiMerchantProduct(value){
 let u;try{u=new URL(value)}catch{return null;}if(u.protocol!=='https:'||u.username||u.password)return null;
 const h=u.hostname.toLowerCase(),p=u.pathname,host=d=>h===d||h.endsWith('.'+d);let shop='',rank=0,direct=false;
 if(host('amazon.fr')){shop='Amazon';rank=4;direct=/\/(?:dp|gp\/product)\/[A-Z0-9]{10}(?:\/|$)/i.test(p);}
 else if(host('darty.com')){shop='Darty';rank=1;direct=/\/nav\/achat\/.+\.html$/i.test(p);}
 else if(host('fnac.com')){shop='Fnac';rank=2;direct=/\/(?:a\d+|mp\d+)\//i.test(p);}
 else if(host('cdiscount.com')){shop='Cdiscount';rank=3;direct=/\/f-\d+-[^/]+\.html$/i.test(p);}
 else return null;
 if(!direct)return null;return {url:u.href,shop,rank};
}
function oneAiProductsHtml(data){
 const seen=new Set(),rows=[];
 for(const source of Array.isArray(data?.results)?data.results:[]){const item=oneAiMerchantProduct(source?.url);if(!item||!source.title)continue;const key=new URL(item.url);key.search='';key.hash='';if(seen.has(key.href))continue;seen.add(key.href);rows.push({...item,title:String(source.title)});}
 rows.sort((a,b)=>b.rank-a.rank);if(!rows.length)return '';
 return '<section class="oneAiBuySection"><h4>Fiches produit trouvées</h4><p>Vérifie le modèle, le vendeur et le prix sur la fiche. Ces liens ne prouvent pas que le créateur utilise ce produit.</p>'+rows.slice(0,4).map(x=>'<a class="oneAiBuyCard" href="'+v17Escape(x.url)+'" target="_blank" rel="noopener noreferrer"><span class="oneAiBuyShop">'+x.shop+'</span><span class="oneAiBuyTitle">'+v17Escape(x.title)+'</span><span class="oneAiBuyAction">Voir la fiche ↗</span></a>').join('')+'</section>';
}
