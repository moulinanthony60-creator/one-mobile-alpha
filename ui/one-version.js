(()=>{
  const version='0.14.90';
  window.ONE_VERSION=version;
  document.title='ONE Mobile Alpha '+version;
  const style=document.createElement('style');style.textContent=`.brandrow:after{content:'v${version}'!important}`;document.head.append(style);
  const apply=()=>{
    const brand=document.querySelector('.brandrow');
    if(brand)brand.style.setProperty('--one-version',`'v${version}'`);
    document.querySelectorAll('[data-one-version]').forEach(e=>e.textContent='v'+version);
  };
  apply();
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
})();
