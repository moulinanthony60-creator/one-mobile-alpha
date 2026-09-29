/** ONE 3:17 R23 — integration of the user-supplied Parasite L Starkie FBX.
 * Geometry/skin/textures preserved in a self-contained GLB. The FBX had no
 * locomotion; Idle/Stalk/Chase_Procedural are newly authored skeletal clips.
 * No remote CDN, API key, account or runtime FBX conversion is required.
 */
import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';
const MODEL_URL = new URL('../assets/317/parasite-starkie-r23.glb', import.meta.url).href;
const MODEL_SCALE = .97;
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
  model.name = 'parasite-starkie-modele';
  model.scale.setScalar(MODEL_SCALE);
  model.rotation.y = Math.PI; // Original FBX faces +Z; the controller faces -Z.
  model.traverse(object => {
    if (!object.isSkinnedMesh) return;
    // Rest-pose bounds are not valid for the reaching pose: never cull on them.
    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;
  });
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
  parent.userData.variant = 'r23-parasite-fbx';
  parent.userData.sourceFile = 'Parasite L Starkie.fbx';
  parent.userData.ready = true;
  parent.userData.height = box.max.y - box.min.y;
  parent.userData.animationSource = 'procedural';
  parent.visible = true;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  let disposed = false, lastWalked = null, movement = 0, pursuit = 0;
  function animate(state, elapsed) {
    if (disposed) return;
    parent.position.set(state.position.x, state.position.y, state.position.z);
    parent.rotation.y = state.yaw;
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
    actions.Idle.setEffectiveWeight(1 - movement).setEffectiveTimeScale(reducedMotion ? 0 : 1);
    actions.Stalk.setEffectiveWeight(movement * (1 - pursuit)).setEffectiveTimeScale(speed / (.66 * MODEL_SCALE));
    actions.Chase.setEffectiveWeight(movement * pursuit).setEffectiveTimeScale(speed / (.86 * MODEL_SCALE));
    // Only bones animate here. AI/collisions, including stairs, remain unchanged.
    mixer.update(dt);
    parent.userData.animation = movement < .1 ? 'Idle' : pursuit > .5 ? 'Chase' : 'Stalk';
  }
  return { model, mixer, animate,
    dispose() { if (disposed) return; disposed = true; mixer.stopAllAction(); mixer.uncacheRoot(model); }
  };
}
