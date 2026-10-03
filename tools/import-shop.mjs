/** Import normalized affiliate exports, offline. Node 18+. No credentials in output. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const categories = ['Écrans','TV','Audio','Gaming','PC','Smartphones','Accessoires'];
function https(value, field, optional=false) {
  if(optional&&!value)return '';
  try { const u=new URL(value);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href; } catch {}
  throw new Error(field+' doit être une URL HTTPS.');
}
export function normalize(rows, source) {
  if(!['awin','amazon','manual'].includes(source))throw new Error('Source attendue : awin, amazon ou manual.');
  if(!Array.isArray(rows)||!rows.length)throw new Error('Export vide : catalogue conservé.');
  const grouped=new Map(), offers=new Set();
  for(const [index,r] of rows.entries()) {
    const fail=message=>{throw new Error('Ligne '+(index+1)+' : '+message);};
    for(const field of ['productKey','title','brand','category','merchant','sourceOfferId'])if(typeof r[field]!=='string'||!r[field].trim())fail(field+' requis');
    if(!categories.includes(r.category))fail('catégorie inconnue');
    if(typeof r.price!=='number'||!Number.isFinite(r.price)||r.price<0||r.currency!=='EUR')fail('prix numérique positif et devise EUR requis');
    if(!['in_stock','out_of_stock','preorder','unknown'].includes(r.availability))fail('disponibilité invalide');
    if(r.demo===true)fail('une offre fictive ne peut pas être importée en production');
    if(!r.updatedAt||!Number.isFinite(Date.parse(r.updatedAt)))fail('updatedAt ISO requis');
    const key=r.productKey.trim(), offerKey=source+':'+r.merchant+':'+r.sourceOfferId;
    if(offers.has(offerKey))fail('offre dupliquée');offers.add(offerKey);
    const id='prod_'+createHash('sha256').update(key).digest('hex').slice(0,20);
    if(!grouped.has(key))grouped.set(key,{id,productKey:key,title:r.title.trim(),brand:r.brand.trim(),category:r.category,image:https(r.image,'image',true),specs:r.specs||{},tags:r.tags||[],demo:false,offers:[]});
    const product=grouped.get(key);
    if(product.brand!==r.brand.trim()||product.category!==r.category)fail('productKey associé à des marques ou catégories incompatibles');
    if(!r.specs||typeof r.specs!=='object'||Array.isArray(r.specs)||Object.values(r.specs).some(v=>!['string','number'].includes(typeof v)))fail('specs doit contenir des valeurs texte ou numériques');
    if(r.tags&&(!Array.isArray(r.tags)||r.tags.some(t=>typeof t!=='string')))fail('tags doit être un tableau de textes');
    product.offers.push({id:offerKey,merchant:r.merchant.trim(),price:r.price,currency:r.currency,availability:r.availability,productUrl:https(r.productUrl,'productUrl'),affiliateUrl:https(r.affiliateUrl,'affiliateUrl'),source,sourceOfferId:r.sourceOfferId,updatedAt:r.updatedAt,demo:false});
  }
  return {schemaVersion:1,demo:false,updatedAt:new Date().toISOString(),products:[...grouped.values()].sort((a,b)=>a.id.localeCompare(b.id))};
}
async function main() {
  const [source,input,output]=process.argv.slice(2);
  if(!source||!input||!output)throw new Error('Usage : node tools/import-shop.mjs awin export-normalise.json ui/shop-products.json');
  const data=normalize(JSON.parse(await fs.readFile(input,'utf8')),source);
  const target=path.resolve(output),temp=target+'.'+process.pid+'.tmp';
  await fs.mkdir(path.dirname(target),{recursive:true});
  // Validation completes before touching the previous catalogue.
  try{await fs.writeFile(temp,JSON.stringify(data,null,2)+'\n','utf8');await fs.rename(temp,target);}finally{await fs.rm(temp,{force:true});}
  console.log(data.products.length+' produits importés dans '+target);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
