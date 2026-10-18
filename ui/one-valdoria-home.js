/* Illustrated Valdoria entry on the ONE home screen. */
const gameURL=new URL('../royaume/index.html?from=one',import.meta.url).href;
const imageURL=new URL('../royaume/assets/city.png',import.meta.url).href;

const style=document.createElement('style');
style.id='oneValdoriaHomeStyle';
style.textContent=`
#oneFoundation .oneValdoriaCard{position:relative;isolation:isolate;display:block;box-sizing:border-box;min-height:260px;overflow:hidden;margin:20px 0;border:1px solid #d9c08b80;border-radius:22px;background:#102c32;color:#fff5df;text-decoration:none;box-shadow:0 14px 36px #050c2033;outline-offset:5px;-webkit-tap-highlight-color:transparent}
#oneFoundation .oneValdoriaCard:focus-visible{outline:3px solid #f5d894}
#oneFoundation .oneValdoriaCard img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 36%;z-index:-2;transition:transform .45s ease}
#oneFoundation .oneValdoriaCard::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,#0b20242b 0%,#0b202400 24%,#091c217a 49%,#081a22f5 100%)}
#oneFoundation .oneValdoriaTop{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 22px}
#oneFoundation .oneValdoriaTag{padding:7px 10px;border:1px solid #ffffff55;border-radius:8px;background:#10252ac9;color:#fff5df;font:700 10px/1.2 system-ui,sans-serif;letter-spacing:.14em}
#oneFoundation .oneValdoriaBrand{color:#fff;font:800 12px/1 system-ui,sans-serif;letter-spacing:.16em;text-shadow:0 1px 8px #10252a}
#oneFoundation .oneValdoriaContent{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:80px 24px 24px}
#oneFoundation .oneValdoriaCopy{display:block;min-width:0}
#oneFoundation .oneValdoriaTitle{display:block;color:#fff4d4;font:500 clamp(34px,5vw,46px)/1.05 Georgia,serif;letter-spacing:-.035em;text-shadow:0 2px 14px #02101380}
#oneFoundation .oneValdoriaDescription{display:block;margin-top:9px;color:#e7ebdf;font:400 13px/1.5 system-ui,sans-serif}
#oneFoundation .oneValdoriaCta{display:inline-flex;align-items:center;justify-content:center;gap:12px;flex-shrink:0;min-height:46px;box-sizing:border-box;padding:12px 18px;border:1px solid #ffebbb;border-radius:12px;background:linear-gradient(135deg,#f9e7ba,#ddba71);color:#26312a;font:750 13px/1.3 system-ui,sans-serif;box-shadow:0 5px 16px #0003}
@media(hover:hover){#oneFoundation .oneValdoriaCard:hover img{transform:scale(1.035)}#oneFoundation .oneValdoriaCard:hover .oneValdoriaCta{background:#ffe6aa}}
@media(max-width:520px){#oneFoundation .oneValdoriaCard{min-height:310px;margin:16px 0;border-radius:18px}#oneFoundation .oneValdoriaTop{padding:16px}#oneFoundation .oneValdoriaContent{align-items:stretch;flex-direction:column;gap:16px;padding:92px 18px 18px}#oneFoundation .oneValdoriaTitle{font-size:38px}#oneFoundation .oneValdoriaCta{align-self:flex-start;min-height:44px;padding:11px 16px}#oneFoundation .oneValdoriaDescription{font-size:12px}}
@media(prefers-reduced-motion:reduce){#oneFoundation .oneValdoriaCard img{transition:none}#oneFoundation .oneValdoriaCard:hover img{transform:none}}
`;
document.head.append(style);

function mountValdoria(){
 const shell=document.getElementById('oneFoundation');
 const hero=shell?.querySelector('.os-home-hero');
 if(!hero||shell.querySelector('#oneValdoriaHome'))return;
 const card=document.createElement('a');
 card.id='oneValdoriaHome';
 card.className='oneValdoriaCard';
 card.href=gameURL;
 card.setAttribute('aria-label','Jouer à Valdoria — Construis ton royaume');
 const art=document.createElement('img');
 art.src=imageURL;art.alt='';art.width=1536;art.height=1024;art.loading='lazy';art.decoding='async';
 card.append(art);
 const top=document.createElement('span');
 top.className='oneValdoriaTop';
 top.innerHTML='<span class="oneValdoriaTag">STRATÉGIE · SOLO</span><span class="oneValdoriaBrand">ONE</span>';
 const content=document.createElement('span');
 content.className='oneValdoriaContent';
 content.innerHTML='<span class="oneValdoriaCopy"><strong class="oneValdoriaTitle">Valdoria</strong><span class="oneValdoriaDescription">Bâtis ton royaume. Écris ton aventure.</span></span><span class="oneValdoriaCta">Jouer à Valdoria <span aria-hidden="true">→</span></span>';
 card.append(top,content);
 hero.after(card);
}
window.addEventListener('one-space-open',()=>queueMicrotask(mountValdoria));
mountValdoria();
