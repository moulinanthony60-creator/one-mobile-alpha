import * as THREE from './vendor/three.module.js';
import {createWallArt,wallConnections} from './wall-art.mjs?v=34';

export {BATTLE_ATLASES,VILLAGE_CAMERA,loadArtImage,spritePlacement,villageSpriteKey,villageScenery} from './battle-village-assets.mjs?v=4';
import {VILLAGE_CAMERA,loadVillageSprites,spritePlacement,villageSpriteKey,villageScenery} from './battle-village-assets.mjs?v=4';
const SQRT2=Math.SQRT2;
const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};

export async function createVillageArt(scene,battle,{signal}={}){
  const artwork=await loadVillageSprites(signal);
  const sprites=new Map(),textures=[],materials=[],meshes=[],group=new THREE.Group(),matrix=new THREE.Object3D();
  const geometry=new THREE.PlaneGeometry(1,1);geometry.translate(0,.5,0);
  const rotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(...VILLAGE_CAMERA),new THREE.Vector3(),new THREE.Vector3(0,1,0)));
  group.visible=false;
  const putSprite=(key,image,anchor=null)=>{
    const scale=Math.min(1,512/Math.max(image.width,image.height)),c=makeCanvas(Math.round(image.width*scale),Math.round(image.height*scale));
    c.getContext('2d').drawImage(image,0,0,c.width,c.height);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
    const material=new THREE.MeshBasicMaterial({map:texture,alphaTest:.16,toneMapped:false,fog:false});materials.push(material);
    sprites.set(key,{material,aspect:image.height/image.width,anchor});
  };
  try{
    for(const [key,sprite] of artwork)putSprite(key,sprite.image);
    const wallSprite=createWallArt(makeCanvas),walls=battle.buildings.filter(b=>b.kind==='wall').map(b=>({x:b.x,z:b.y})),occupied=new Set(walls.map(b=>b.x+','+b.z));
    const entries=new Map();
    const entry=(key,item)=>{if(!entries.has(key))entries.set(key,[]);entries.get(key).push(item);};
    for(const building of battle.buildings){
      if(building.kind==='wall'){
        const mask=wallConnections({x:building.x,z:building.y},occupied),key='wall-'+mask;
        if(!sprites.has(key)){const art=wallSprite(2,mask);putSprite(key,art.image,art);}
        const art=sprites.get(key).anchor,scale=SQRT2/art.unit;
        entry(key,{id:building.id,x:building.x-10,z:building.y-8,width:art.image.width*scale,height:art.image.height*scale,front:(art.image.height-art.anchor.y)*scale*2});
      }else{
        const key=villageSpriteKey(building),sprite=sprites.get(key);if(!sprite)throw new Error('Bâtiment sans illustration : '+key);
        entry(key,{id:building.id,x:building.x-10,z:building.y-8,...spritePlacement(building,sprite.aspect)});
      }
    }
    for(const item of villageScenery())entry(item.key,{...item,height:item.width*sprites.get(item.key).aspect,front:item.bottom*2});
    for(const [key,items] of entries){
      const mesh=new THREE.InstancedMesh(geometry,sprites.get(key).material,items.length);mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(mesh);meshes.push({mesh,items});
    }
    scene.add(group);
    const buildingItems=new Map([...entries.values()].flat().filter(item=>item.id!==undefined).map(item=>[item.id,item]));
    const cameraUp=new THREE.Vector3(0,1,0).applyQuaternion(rotation);
    const tint=new THREE.Color();
    function update(current,destroyed,time){
      const buildings=new Map(current.buildings.map(b=>[b.id,b]));
      for(const {mesh,items} of meshes){
        items.forEach((item,i)=>{
          const b=item.id===undefined?null:buildings.get(item.id),death=destroyed.get(item.id),age=death===undefined?0:Math.max(0,time-death),scale=death===undefined?1:Math.max(.0001,1-age/.6);
          // Translate along the horizontal viewing diagonal, not vertically.
          matrix.position.set(item.x+item.front/Math.SQRT2,.035,item.z+item.front/Math.SQRT2);matrix.quaternion.copy(rotation);matrix.scale.set(item.width*scale,item.height*scale,1);matrix.updateMatrix();mesh.setMatrixAt(i,matrix.matrix);
          mesh.setColorAt(i,tint.set(b&&b.hp/b.maxHp<.3?'#d9bba0':'#ffffff'));
        });
        mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
      }
    }
    update(battle,new Map(),0);
    return {group,update,dispose,
      healthPoint(building){const item=buildingItems.get(building.id);return new THREE.Vector3(item.x+item.front/SQRT2,.035,item.z+item.front/SQRT2).addScaledVector(cameraUp,item.height+.2);}
    };
  }catch(error){dispose();throw error;}
  function dispose(){scene.remove(group);for(const {mesh} of meshes)mesh.dispose();geometry.dispose();for(const texture of textures)texture.dispose();for(const material of materials)material.dispose();}
}
