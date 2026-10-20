import {createVillageScene} from './battle-village-scene.mjs?v=4';

// WebGL is an optional renderer, never a prerequisite for opening the battle.
export function createBattleView(villageCanvas,webglCanvas,battle,{
  createVillage=createVillageScene,load3D=()=>import('./battle3d-scene.mjs?v=4'),onFallback=()=>{},timeout=10000
}={}){
  const village=createVillage(villageCanvas,battle);
  let three=null,current=battle,mode='village',disposed=false,loading=false,failed3D=false,economy=false,request=0;
  const active=()=>mode==='3d'?three:village;
  function show(next){mode=next;villageCanvas.hidden=next!=='village';webglCanvas.hidden=next!=='3d';active().resize?.();active().frame(current,0,false);}
  function fallback(error){failed3D=true;request++;show('village');three?.dispose();three=null;console.warn('Vue 3D indisponible :',error?.message||error);onFallback(error);}
  const contextLost=event=>{event.preventDefault();if(!disposed)fallback(new Error('L’affichage 3D a été interrompu.'));};
  webglCanvas.addEventListener('webglcontextlost',contextLost);
  villageCanvas.hidden=false;webglCanvas.hidden=true;
  return {
    get canvas(){return mode==='3d'?webglCanvas:villageCanvas;},
    get mode(){return mode;},
    get failed3D(){return failed3D;},
    loadVillage(){return village.loadVillage();},
    async style(next){
      if(disposed)return false;
      if(next==='village'){request++;show('village');return true;}
      if(failed3D||loading)return false;
      if(three){show('3d');return true;}
      loading=true;const token=++request;let timer;
      try{
        const module=await Promise.race([load3D(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('La vue 3D met trop de temps à charger.')),timeout);})]);
        if(disposed||token!==request)return false;
        // Size the optional canvas before its renderer measures the viewport.
        webglCanvas.hidden=false;
        const candidate=module.createScene(webglCanvas,current);
        if(disposed||token!==request){candidate.dispose();return false;}
        three=candidate;three.quality(economy);show('3d');return true;
      }catch(error){if(!disposed&&token===request)fallback(error);return false;}
      finally{clearTimeout(timer);loading=false;}
    },
    frame(b,dt,animate=true){if(disposed)return;current=b;try{active().frame(b,dt,animate);}catch(error){if(mode==='3d')fallback(error);else throw error;}},
    point(x,y){return active().point(x,y);},mark(...args){active().mark(...args);},pan(...args){active().pan(...args);},zoom(factor){active().zoom(factor);},home(){active().home();},
    quality(eco){economy=Boolean(eco);village.quality(economy);three?.quality(economy);},
    reset(b){current=b;village.reset(b);three?.reset(b);},
    dispose(){disposed=true;request++;webglCanvas.removeEventListener('webglcontextlost',contextLost);village.dispose();three?.dispose();}
  };
}
