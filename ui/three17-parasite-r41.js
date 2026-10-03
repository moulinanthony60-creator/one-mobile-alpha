/** ONE 3:17 R23 — integration of the user-supplied Parasite L Starkie FBX.
 * Geometry/skin/textures preserved in a self-contained GLB. The FBX had no
 * locomotion; Idle/Stalk/Chase_Procedural are newly authored skeletal clips.
 * No remote CDN, API key, account or runtime FBX conversion is required.
 */
import * as THREE from './three.module.js?v=appels-v52';
import { GLTFLoader } from './GLTFLoader.js?v=appels-v52';
const MODEL_URL = new URL('../assets/317/parasite-starkie-r23.glb', import.meta.url).href;
const MODEL_SCALE = 1.035;
let bytesPromise = null;
function modelBytes() {
  if (bytesPromise) return bytesPromise;
  bytesPromise = (async () => {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 30000);
    try {
      const response = await fetch(MODEL_URL, { signal: abort.signal, credentials: 'same-origin' });
      if (!response.ok) throw new Error('Modèle Parasite introuvable (HTTP ' + response.status + ').');
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength < 20 || new DataView(bytes).getUint32(0, true) !== 0x46546c67)
        throw new Error('Le fichier du monstre n’est pas un GLB valide.');
      return bytes;
    } finally { clearTimeout(timer); }
  })().catch(error => { bytesPromise = null; throw error; });
  return bytesPromise;
}

export async function loadParasite(parent) {
  const bytes = await modelBytes();
  // Parse a fresh skeleton and textures for every session; only raw bytes are
  // reused. Disposing a previous game cannot corrupt a new game's model.
  const gltf = await new GLTFLoader().parseAsync(bytes, '');
  const model = gltf.scene;
  model.name = 'parasite-r41';
  model.scale.setScalar(MODEL_SCALE);
  model.rotation.y = Math.PI; // Original FBX faces +Z; the controller faces -Z.
  model.traverse(object => {
    if (!object.isSkinnedMesh) return;
    // Rest-pose bounds are not valid for the reaching pose: never cull on them.
    object.frustumCulled = false;
    object.castShadow = true;
    object.receiveShadow = true;
  });
  const materialSet=new Set();
  model.traverse(o=>{if(o.isMesh)for(const m of (Array.isArray(o.material)?o.material:[o.material]))materialSet.add(m);});
  for(const m of materialSet){m.color.set(0xb9bbb0);m.roughness=.68;m.metalness=0;m.normalScale?.set(.95,.95);m.envMapIntensity=.18;}
  const bones=new Map();model.traverse(o=>{if(o.isBone)bones.set(o.name,o);});
  for(const name of ['LeftHand','RightHand'])bones.get(name)?.scale.set(1.10,1.12,1.08);
  for(const name of ['LeftForeArm','RightForeArm'])bones.get(name)?.scale.set(1,1.07,1);
  // Small dull catchlights inside dark sockets, attached to the existing eye bones.
  const socket=new THREE.MeshStandardMaterial({color:0x100d0b,roughness:.53});
  const iris=new THREE.MeshStandardMaterial({color:0x8b8f77,roughness:.2,emissive:0x33392a,emissiveIntensity:.05});
  for(const name of ['LeftEye','RightEye']){const bone=bones.get(name);if(!bone)continue;
    const eye=new THREE.Mesh(new THREE.SphereGeometry(1,10,7),socket);eye.scale.set(.020,.014,.012);eye.position.z=.013;bone.add(eye);
    const pupil=new THREE.Mesh(new THREE.SphereGeometry(.0045,8,6),iris);pupil.position.set(0,0,.024);bone.add(pupil);
  }
  parent.add(model);
  const mixer = new THREE.AnimationMixer(model);
  const actions = {};
  for (const name of ['Idle', 'Stalk', 'Chase']) {
    const clip = gltf.animations.find(c => c.name === name + '_Procedural');
    if (!clip) throw new Error('Animation du Parasite manquante : ' + name);
    actions[name] = mixer.clipAction(clip).setEffectiveWeight(name === 'Idle' ? 1 : 0).play();
  }
  mixer.update(0);
  model.updateMatrixWorld(true);
  model.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
  // Ground the *posed* model once, instead of scaling/offsetting its geometry.
  const box = new THREE.Box3().setFromObject(model, true);
  model.position.y = -box.min.y;
  parent.userData.variant = 'r41-parasite';
  parent.userData.sourceFile = 'Parasite L Starkie.fbx';
  parent.userData.ready = true;
  parent.userData.height = box.max.y - box.min.y;
  parent.userData.animationSource = 'procedural';
  parent.visible = true;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  let disposed = false, lastWalked = null, movement = 0, pursuit = 0,gaitSpeed=0,time=0,startle=0,lastMode='dormant';
  const pose=new Map(),rotation=new THREE.Quaternion(),euler=new THREE.Euler();
  const offsets=['Spine','Spine1','Spine2','Neck','Head','JawDowm','LeftShoulder','RightShoulder','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftHand','RightHand'];
  for(const name of offsets){const bone=bones.get(name);if(bone)pose.set(name,bone.quaternion.clone());}
  function offset(name,x,y,z){const bone=bones.get(name);if(!bone)return;rotation.setFromEuler(euler.set(x,y,z));bone.quaternion.multiply(rotation);}
  function posture(dt){
    time+=dt;const pulse=reducedMotion?0:Math.sin(time*2.4);
    offset('Spine',.13+pursuit*.11,0,.025);
    offset('Spine1',.09+pursuit*.025,0,-.015);
    offset('Spine2',.055,0,.025);
    offset('Neck',-.085,0,-.04);
    offset('Head',-.12+pulse*.012,Math.sin(time*.36)*.045,(reducedMotion?.12:.17+Math.sin(time*.62)*.035)-startle*.13);
    offset('JawDowm',.07+pursuit*.09+Math.max(0,pulse)*.025,0,0);
    offset('LeftShoulder',.04,0,.055);offset('RightShoulder',-.025,0,-.085);
    offset('LeftHand',.11,0,.08);offset('RightHand',-.09,0,-.06);
    // Aim upper arms and forearms forward in model space. Blend from the authored
    // walking clips rather than snapping a new pose onto the skeleton.
    const influence=.12+pursuit*.70;
    reach('LeftArm','LeftForeArm',[.20,-.67,.67],influence);
    reach('RightArm','RightForeArm',[-.24,-.60,.76],influence);
    reach('LeftForeArm','LeftHand',[.06,-.05,.98],influence);
    reach('RightForeArm','RightHand',[-.09,.08,.99],influence);
  }
  const a=new THREE.Vector3(),b=new THREE.Vector3(),wanted=new THREE.Vector3();
  const worldQ=new THREE.Quaternion(),parentQ=new THREE.Quaternion(),deltaQ=new THREE.Quaternion(),modelQ=new THREE.Quaternion();
  function reach(name,child,direction,weight){
    const joint=bones.get(name),tip=bones.get(child);if(!joint||!tip)return;
    model.updateMatrixWorld(true);joint.getWorldPosition(a);tip.getWorldPosition(b);b.sub(a).normalize();
    model.getWorldQuaternion(modelQ);wanted.set(...direction).applyQuaternion(modelQ).normalize();
    deltaQ.setFromUnitVectors(b,wanted);joint.getWorldQuaternion(worldQ);worldQ.premultiply(deltaQ);
    joint.parent.getWorldQuaternion(parentQ).invert();worldQ.premultiply(parentQ);joint.quaternion.slerp(worldQ,weight);
  }
  function animate(state, elapsed) {
    if (disposed) return;
    const visualDt=Number.isFinite(elapsed)?Math.max(0,Math.min(.05,elapsed)):0;
    const separation=parent.position.distanceTo(new THREE.Vector3(state.position.x,state.position.y,state.position.z));
    if(!visualDt||separation>1.5)parent.position.set(state.position.x,state.position.y,state.position.z);
    else parent.position.lerp(state.position,1-Math.exp(-visualDt*30));
    const turn=Math.atan2(Math.sin(state.yaw-parent.rotation.y),Math.cos(state.yaw-parent.rotation.y));
    parent.rotation.y+=turn*(visualDt?1-Math.exp(-visualDt*15):1);
    if(state.state==='chase'&&lastMode!=='chase')startle=1;
    else startle*=Math.exp(-visualDt*5);
    lastMode=state.state;
    parent.userData.state = state.state;
    const dt = Number.isFinite(elapsed) ? Math.max(0, Math.min(.05, elapsed)) : 0;
    const moving = state.moving && state.grace <= 0 ? 1 : 0;
    const chase = state.state === 'chase' || state.state === 'caught' ? 1 : 0;
    const mix = dt > 0 ? 1 - Math.exp(-dt * 12) : 1;
    movement += (moving - movement) * mix;
    pursuit += (chase - pursuit) * mix;
    const walked = Number.isFinite(state.walked) ? state.walked : 0;
    const distance = lastWalked === null ? 0 : Math.max(0, walked - lastWalked);
    lastWalked = walked;
    const speed = dt > 0 && moving ? Math.min(4, distance / dt) : 0;
    gaitSpeed+=(speed-gaitSpeed)*mix;
    actions.Idle.setEffectiveWeight(1 - movement).setEffectiveTimeScale(reducedMotion ? 0 : 1);
    actions.Stalk.setEffectiveWeight(movement * (1 - pursuit)).setEffectiveTimeScale(Math.max(.65,Math.min(1.6,gaitSpeed/1.05)));
    actions.Chase.setEffectiveWeight(movement * pursuit).setEffectiveTimeScale(Math.max(.8,Math.min(1.65,gaitSpeed/2.15)));
    // Only bones animate here. AI/collisions, including stairs, remain unchanged.
    for(const [name,q] of pose)bones.get(name).quaternion.copy(q);
    mixer.update(dt);
    for(const [name,q] of pose)q.copy(bones.get(name).quaternion);
    posture(dt);
    parent.userData.animation = movement < .1 ? 'Idle' : pursuit > .5 ? 'Chase' : 'Stalk';
  }
  return { model, mixer, animate,
    dispose() { if (disposed) return; disposed = true; mixer.stopAllAction(); mixer.uncacheRoot(model); }
  };
}
