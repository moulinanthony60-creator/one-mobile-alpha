/* ONE Shop — local catalogue API and affiliate storefront. No provider secrets. */
(() => {
  'use strict';
  const script = document.currentScript;
  const base = new URL('.', script.src);
  const categories = ['Écrans', 'TV', 'Audio', 'Gaming', 'PC', 'Smartphones', 'Accessoires'];
  const norm = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const copy = value => JSON.parse(JSON.stringify(value));
  const safeURL = value => { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; } };
  let products = [], catalog = null, pending;
  async function load(force = false) {
    if (catalog && !force) return copy(products);
    if (pending) return pending;
    pending = (async () => {
      const response = await fetch(new URL('shop-products.json', base), {cache: 'no-store'});
      if (!response.ok) throw new Error('Catalogue indisponible');
      const data = await response.json();
      if (data.schemaVersion !== 1 || !Array.isArray(data.products) || typeof data.demo !== 'boolean') throw new Error('Catalogue incompatible');
      const ids = new Set();
      for (const p of data.products) {
        if (!p.id || ids.has(p.id) || typeof p.title !== 'string' || !categories.includes(p.category) || !Array.isArray(p.offers)) throw new Error('Produit invalide');
        ids.add(p.id);
        for (const o of p.offers) if ((o.price !== null && (!Number.isFinite(o.price) || o.price < 0)) || o.currency !== 'EUR' || typeof o.merchant !== 'string') throw new Error('Offre invalide');
      }
      products = data.products; catalog = data;
      return copy(products);
    })().finally(() => { pending = null; });
    return pending;
  }
  const available = p => p.offers.filter(o => ['in_stock', 'preorder'].includes(o.availability));
  const price = p => Math.min(...available(p).filter(o => Number.isFinite(o.price)).map(o => o.price));
  function find(criteria = {}) {
    if (!catalog) throw new Error('Attendre ONE_SHOP.ready avant de chercher.');
    const tokens = norm(criteria.query).split(/\s+/).filter(Boolean);
    const hits = products.filter(p => {
      const haystack = norm([p.title, p.brand, p.category, ...(p.tags || []), ...Object.values(p.specs || {})].join(' '));
      return (!criteria.category || norm(p.category) === norm(criteria.category)) &&
        (!criteria.brand || norm(p.brand) === norm(criteria.brand)) &&
        (criteria.maxPrice == null || price(p) <= Number(criteria.maxPrice)) &&
        (criteria.minPrice == null || (Number.isFinite(price(p)) && price(p) >= Number(criteria.minPrice))) &&
        (!criteria.inStock || available(p).some(o => o.availability === 'in_stock')) &&
        (!criteria.sizeInches || Number(p.specs?.sizeInches) === Number(criteria.sizeInches)) &&
        (!criteria.minRefreshRate || Number(p.specs?.refreshRateHz) >= Number(criteria.minRefreshRate)) &&
        tokens.every(t => haystack.includes(t));
    });
    if (criteria.sort === 'price-asc') hits.sort((a,b) => price(a)-price(b) || a.id.localeCompare(b.id));
    if (criteria.sort === 'price-desc') hits.sort((a,b) => (Number.isFinite(price(b)) ? price(b) : -1)-(Number.isFinite(price(a)) ? price(a) : -1));
    return copy(hits.slice(0, criteria.limit == null ? hits.length : Math.max(0, Math.floor(Number(criteria.limit) || 0))));
  }
  const api = window.ONE_SHOP = { categories: [...categories], getProducts: () => { if (!catalog) throw new Error('Attendre ONE_SHOP.ready'); return copy(products); }, find, search: (query, criteria = {}) => find({...criteria, query}), reload: () => load(true), getMetadata: () => catalog ? {schemaVersion: 1, demo: catalog.demo, updatedAt: catalog.updatedAt} : null };
  api.ready = load(); api.ready.catch(() => {});
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('one-shop.css?v=swipe-v12', base); document.head.append(css);
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; };
  const button = (label, handler, cls = '') => { const b = el('button', cls, label); b.type = 'button'; b.onclick = handler; return b; };
  const money = n => new Intl.NumberFormat('fr-FR', {style:'currency', currency:'EUR'}).format(n);
  const favKey = () => 'one_shop_favorites_v1:' + String(window.oneAccountLocal?.()?.id || 'visitor');
  const favorites = () => { try { const v = JSON.parse(localStorage.getItem(favKey()) || '[]'); return new Set(Array.isArray(v) ? v.filter(x => typeof x === 'string') : []); } catch { return new Set(); } };
  let state = {query:'', category:'', brand:'', maxPrice:'', sort:'default', favorites:false}, epoch = 0;
  function open(query) { if (typeof query === 'string') state.query = query; window.oneShowSpace?.('shop'); if (window.oneCurrentSpace?.() === 'shop') render(); }
  api.open = open;
  function init() {
    document.body.classList.toggle('oneShopOpen', window.oneCurrentSpace?.() === 'shop');
    if (window.oneCurrentSpace?.() === 'shop' || document.body.dataset.shopStandalone) render();
  }
  async function render() {
    const root = document.getElementById('oneShop'); if (!root) return;
    const ticket = ++epoch; root.classList.add('os-store'); root.replaceChildren(el('p','os-status','Chargement du catalogue…'));
    try { await load(); } catch { if (ticket === epoch && root.isConnected) root.replaceChildren(el('h1','','Catalogue indisponible'), el('p','','Vérifie ta connexion puis réessaie.'), button('Réessayer',render,'os-primary')); return; }
    if (ticket !== epoch || !root.isConnected) return;
    root.replaceChildren();
    const header = el('header','os-heading'), title = el('div'); title.append(el('span','os-kicker','ONE SHOP'),el('h1','','Ta sélection tech.'));
    const fav = button('♡ Mes favoris', () => { state.favorites = !state.favorites; render(); },'os-secondary'); fav.setAttribute('aria-pressed',String(state.favorites)); header.append(title,fav); root.append(header);
    const notice = el('p','os-notice',catalog.demo ? 'DÉMONSTRATION · Produits, marchands et prix fictifs. Aucun achat disponible.' : 'En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les conditions requises.');  
    root.append(el('p','os-intro','Écrans, gaming, audio… trouve ton prochain équipement.'));
    const form = el('form','os-search'); form.setAttribute('role','search');
    const input = el('input'); input.type='search'; input.value=state.query; input.placeholder='Écran PS5, casque, smartphone…'; input.setAttribute('aria-label','Rechercher un produit');
    const submit = el('button','os-primary','Rechercher'); submit.type='submit'; form.append(input,submit); form.onsubmit=e=>{e.preventDefault();state.query=input.value.trim();update();}; root.append(form);
    const toolbar=el('div','os-toolbar');
    const categoryToggle=button(state.category?'Catégories · '+state.category:'Catégories',()=>togglePanel('categories'),'os-tool-tab');
    const filterToggle=button('Filtres',()=>togglePanel('filters'),'os-tool-tab');
    categoryToggle.setAttribute('aria-controls','os-category-panel');filterToggle.setAttribute('aria-controls','os-filter-panel');
    toolbar.append(categoryToggle,filterToggle);root.append(toolbar);
    const cats=el('div','os-categories');cats.id='os-category-panel';cats.hidden=true; cats.setAttribute('role','group'); cats.setAttribute('aria-label','Catégories');
    for(const c of ['',...categories]) { const b=button(c||'Tout',()=>{state.category=c;categoryToggle.textContent=c?'Catégories · '+c:'Catégories';togglePanel(''); for(const n of cats.children)n.setAttribute('aria-pressed',String(n===b));update();}); b.setAttribute('aria-pressed',String(state.category===c));cats.append(b); } root.append(cats);
    const panel=el('div','os-filter-panel');panel.id='os-filter-panel';panel.hidden=true;
    function togglePanel(name){cats.hidden=name!=='categories'||!cats.hidden;panel.hidden=name!=='filters'||!panel.hidden;categoryToggle.setAttribute('aria-expanded',String(!cats.hidden));filterToggle.setAttribute('aria-expanded',String(!panel.hidden));}
    categoryToggle.setAttribute('aria-expanded','false');filterToggle.setAttribute('aria-expanded','false');
    const filters=el('div','os-filters');
    function select(label, key, options) { const wrap=el('label','',label), s=el('select'); for(const [value,text] of options){const o=el('option','',text);o.value=value;s.append(o);} s.value=state[key];s.onchange=()=>{state[key]=s.value;update();};wrap.append(s);filters.append(wrap); }
    select('Marque','brand',[['','Toutes les marques'],...[...new Set(products.map(p=>p.brand))].sort().map(b=>[b,b])]);
    const budget=el('label','','Budget maximal (€)'), max=el('input');max.type='number';max.min='0';max.step='0.01';max.placeholder='Sans limite';max.value=state.maxPrice;max.oninput=()=>{state.maxPrice=max.value;update();};budget.append(max);filters.append(budget);
    select('Trier','sort',[['default','Catalogue'],['price-asc','Prix croissant'],['price-desc','Prix décroissant']]);panel.append(filters,el('p','os-small','Les produits sans prix renseigné sont exclus du filtre de budget.'));root.append(panel,notice);
    const status=el('p','os-status');status.setAttribute('role','status'); const results=el('div','os-grid');root.append(status,results);
    function update(){const saved=favorites();const found=find({query:state.query,category:state.category,brand:state.brand,maxPrice:state.maxPrice===''?null:Number(state.maxPrice),sort:state.sort}).filter(p=>!state.favorites||saved.has(p.id));status.textContent=found.length+' produit'+(found.length>1?'s':'')+(state.favorites?' dans tes favoris':'');results.replaceChildren();
      if(!found.length){const empty=el('div','os-empty');empty.append(el('h2','','Aucun produit trouvé'),el('p','','Essaie un autre mot ou élargis tes filtres.'),button('Effacer les filtres',()=>{state={query:'',category:'',brand:'',maxPrice:'',sort:'default',favorites:false};render();},'os-secondary'));results.append(empty);}
      for(const p of found){const card=el('article','os-card'),visual=el('div','os-visual'),img=el('img');img.alt=p.title;img.loading='lazy';img.width=400;img.height=260;img.src=p.image?.startsWith('shop-assets/')?new URL(p.image,base).href:safeURL(p.image)||new URL('shop-assets/product.svg',base).href;img.onerror=()=>{img.onerror=null;img.src=new URL('shop-assets/product.svg',base).href;};visual.append(img);
        const heart=button(saved.has(p.id)?'♥':'♡',()=>{const set=favorites();if(set.has(p.id))set.delete(p.id);else set.add(p.id);try{localStorage.setItem(favKey(),JSON.stringify([...set]));update();}catch{status.textContent='Impossible de conserver les favoris sur cet appareil.';}},'os-heart');heart.setAttribute('aria-label','Favori : '+p.title);heart.setAttribute('aria-pressed',String(saved.has(p.id)));visual.append(heart);card.append(visual);
        const body=el('div','os-card-body');body.append(el('span','os-kicker',p.brand+' · '+p.category),el('h2','',p.title),el('p','os-specs',Object.entries(p.specs||{}).filter(([k])=>!['sizeInches','refreshRateHz'].includes(k)).map(([,v])=>v).join(' · ')));
        const best=price(p);if(Number.isFinite(best)||!p.offers.some(o=>o.price===null&&o.availability!=='out_of_stock'))body.append(el('strong','os-price',Number.isFinite(best)?money(best):p.offers.some(o=>o.price===null&&o.availability!=='out_of_stock')?'Prix chez le marchand':'Indisponible'),el('span','os-small',catalog.demo?'Prix fictif':Number.isFinite(best)?'Meilleur prix disponible du catalogue':'Prix et disponibilité à vérifier sur Amazon'));
        const offers=el('div','os-offers');for(const o of [...p.offers].sort((a,b)=>(a.price??Infinity)-(b.price??Infinity))){const row=el('div','os-offer'),info=el('div');info.append(el('b','',o.merchant),el('span','',(o.price===null?'Prix et disponibilité sur Amazon':money(o.price))+(o.availability==='out_of_stock'?' · Rupture':o.availability==='preorder'?' · Précommande':'')));const url=safeURL(o.affiliateUrl);if(!catalog.demo&&!p.demo&&!o.demo&&url&&(['in_stock','preorder'].includes(o.availability)||(o.source==='manual'&&o.price===null&&o.availability==='unknown'))){const link=el('a','os-offer-link',o.price===null?'Voir le prix sur Amazon ↗':'Voir l’offre ↗');link.href=url;link.target='_blank';link.rel='sponsored noopener noreferrer';row.append(info,link);}else{const disabled=button(catalog.demo||p.demo||o.demo?'Offre fictive':'Indisponible',()=>{},'os-offer-link');disabled.disabled=true;row.append(info,disabled);}offers.append(row);}body.append(offers);if(catalog.demo)body.append(el('small','os-small','Illustration générique · Démonstration'));card.append(body);results.append(card);}
    } update();
    root.append(el('p','os-footer','Tes favoris restent sur cet appareil. Les offres sont triées par prix, sans priorité liée à la commission.'));
  }
  window.addEventListener('one-space-open',()=>{document.body.classList.toggle('oneShopOpen',window.oneCurrentSpace?.()==='shop');if(window.oneCurrentSpace?.()==='shop')render();});
  window.addEventListener('one-shop-search',e=>open(typeof e.detail==='string'?e.detail:e.detail?.query||''));
  window.addEventListener('one-account-changed',()=>{if(document.getElementById('oneShop'))render();});
  window.addEventListener('storage',e=>{if(e.key===favKey()&&document.getElementById('oneShop'))render();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();








