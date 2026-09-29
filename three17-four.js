import * as THREE from './three.module.js';
import { BUILD, EYE_HEIGHT, PLAYER_RADIUS, createGroundFloor, blockedAt,
  movePlayer, circleHitsDoor, hasLineOfSight, roomAt } from './three17-house-rdc-v13.js';

let active = null;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function patternTexture(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (kind === 'wood') {
    ctx.fillStyle = '#33281f'; ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = ['#30251d', '#3b2c21', '#281f19', '#35281f'][i];
      ctx.fillRect(i * 32 + 1, 0, 30, 128);
      ctx.fillStyle = '#3c3029'; ctx.fillRect(i * 32, 0, 1, 128);
      ctx.fillRect(i * 32, i % 2 ? 68 : 15, 32, 1);
      ctx.strokeStyle = '#ffffff09'; ctx.beginPath();
      for (let k = 0; k < 5; k++) { ctx.moveTo(i * 32 + 5 + k * 5, 0); ctx.lineTo(i * 32 + 4 + k * 5, 128); }
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = kind === 'bath' ? '#555d59' : '#4b4941'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = kind === 'bath' ? '#788580' : '#5e5f58';
    ctx.fillRect(1, 1, 62, 62); ctx.fillRect(65, 65, 62, 62);
    ctx.strokeStyle = '#373b36'; ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 64, 64); ctx.strokeRect(64, 64, 64, 64);
    ctx.strokeRect(64, 0, 64, 64); ctx.strokeRect(0, 64, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 2;
  return texture;
}

function buildHouseScene(scene, house) {
  const wood = patternTexture('wood'), tile = patternTexture('tile'), bath = patternTexture('bath');
  const materials = {};
  const palette = {
    plaster: 0x514d43, wallBase: 0x242a26, trim: 0x30251d, ceiling: 0x242523,
    wood: 0x3a2b20, fabric: 0x344039, linen: 0x776f60, cabinet: 0x414337,
    stone: 0x454640, dark: 0x0b0f10, enamel: 0x777d76, metal: 0x555b5d,
    paper: 0x756b57, bathInner: 0x3e5050, mirror: 0x465253,
    screen: 0x0a1115, glass: 0x203544, rug: 0x342426, stoneFloor: 0x303331,
  };
  for (const [name, color] of Object.entries(palette)) {
    materials[name] = new THREE.MeshStandardMaterial({ color, roughness: name === 'metal' ? .35 : .88,
      metalness: name === 'metal' ? .45 : 0 });
  }
  for (const [name, tex, color] of [['woodFloor', wood, 0xb3a394], ['hallFloor', tile, 0x8c918e],
    ['kitchenFloor', tile, 0xafb1a0], ['bathFloor', bath, 0xb3bdb7]]) {
    materials[name] = new THREE.MeshStandardMaterial({ color, map: tex, roughness: .92 });
  }
  materials.glass.emissive.setHex(0x1b2d45); materials.glass.emissiveIntensity = .16;
  materials.screen.emissive.setHex(0x0c1b25); materials.screen.emissiveIntensity = .2;
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const batches = new Map();
  function queue(v) {
    if (!batches.has(v.material)) batches.set(v.material, []);
    batches.get(v.material).push(v);
  }
  for (const v of house.volumes) {
    if (v.kind === 'wall' && v.y - v.h / 2 < .01 && v.h > 2) {
      // Le soubassement et l'enduit partitionnent le même volume solide.
      queue({ ...v, y: .36, h: .72, material: 'wallBase' });
      queue({ ...v, y: .72 + (v.h - .72) / 2, h: v.h - .72 });
      queue({ ...v, y: .735, h: .035, w: v.w + .008, d: v.d + .008, material: 'trim' });
    } else queue(v);
  }
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), scale = new THREE.Vector3(), rotation = new THREE.Quaternion();
  for (const [name, list] of batches) {
    const mesh = new THREE.InstancedMesh(unitBox, materials[name], list.length);
    mesh.name = 'RDC-' + name;
    list.forEach((v, i) => { position.set(v.x, v.y, v.z); scale.set(v.w, v.h, v.d);
      matrix.compose(position, rotation, scale); mesh.setMatrixAt(i, matrix); });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere(); scene.add(mesh);
  }
  for (const s of house.surfaces) {
    const geometry = new THREE.PlaneGeometry(s.w, s.d);
    const uv = geometry.attributes.uv;
    if (s.material !== 'rug') for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * s.w / 2, uv.getY(i) * s.d / 2);
    const mesh = new THREE.Mesh(geometry, materials[s.material]);
    mesh.name = s.id; mesh.rotation.x = -Math.PI / 2; mesh.position.set(s.x, s.y, s.z); scene.add(mesh);
  }
  function cube(parent, x, y, z, w, h, d, material) {
    const mesh = new THREE.Mesh(unitBox, material); mesh.position.set(x, y, z); mesh.scale.set(w, h, d); parent.add(mesh); return mesh;
  }
  const doorMeshes = new Map();
  for (const d of house.doors) {
    const pivot = new THREE.Group(); pivot.name = 'porte-' + d.id;
    pivot.position.set(d.hingeX, 0, d.hingeZ); pivot.rotation.y = d.angle;
    cube(pivot, d.width / 2, d.height / 2, 0, d.width, d.height, d.thickness, materials.wood);
    for (const side of [-1, 1]) {
      for (const y of [.56, 1.55]) cube(pivot, d.width / 2, y, side * .041, d.width - .22, .71, .004, materials.trim);
      cube(pivot, d.width - .14, 1.02, side * .052, .16, .045, .05, materials.metal);
      if (d.id === 'stairs') cube(pivot, d.width / 2, 1.33, side * .046, d.width - .08, .13, .018, materials.dark);
    }
    scene.add(pivot); doorMeshes.set(d.id, pivot);
  }
  for (const label of house.signs) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#161c1b'; ctx.fillRect(0, 0, 512, 96);
    ctx.strokeStyle = '#91927c'; ctx.lineWidth = 5; ctx.strokeRect(4, 4, 504, 88);
    ctx.fillStyle = '#e2dcc6'; ctx.font = '600 30px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label.text, 256, 49, 480);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.16, .22), mat);
    mesh.position.set(label.x, label.y, label.z); mesh.rotation.y = label.ry; scene.add(mesh);
  }
  const itemMeshes = new Map();
  for (const item of house.items) {
    const group = new THREE.Group(); group.position.set(item.x, item.y, item.z);
    const mat = new THREE.MeshStandardMaterial({ color: item.color, emissive: item.color, emissiveIntensity: .6, roughness: .4 });
    if (item.id === 'key') {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.065, .018, 6, 12), mat);
      ring.position.y = .10; group.add(ring);
      cube(group, 0, -.026, 0, .03, .15, .025, mat);
      cube(group, .036, -.09, 0, .075, .025, .025, mat);
    } else if (item.id === 'fuse') {
      cube(group, 0, 0, 0, .09, .28, .09, mat);
      for (const y of [-.125, .125]) cube(group, 0, y, 0, .12, .06, .12, materials.metal);
    } else {
      const seal = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .06, 12), mat);
      seal.rotation.x = .8; group.add(seal);
    }
    scene.add(group); itemMeshes.set(item.id, group);
  }
  return { doorMeshes, itemMeshes };
}

function disposeScene(scene) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  scene.traverse(o => {
    if (o.geometry) geometries.add(o.geometry);
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) if (m) materials.add(m);
    if (o.isInstancedMesh) o.dispose();
  });
  for (const m of materials) for (const v of Object.values(m)) if (v?.isTexture) textures.add(v);
  for (const t of textures) t.dispose();
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
  scene.clear();
}

function open() {
  close();
  const shell = document.createElement('section');
  shell.className = 'three17-shell'; shell.dataset.build = 'v013-rdc';
  shell.setAttribute('role', 'dialog'); shell.setAttribute('aria-label', '3:17 FOUR — Rez-de-chaussée');
  shell.innerHTML = `<div class="three17-stage"><div class="three17-hud">
    <div class="three17-top"><div><div class="three17-clock">03:17</div><div class="three17-build">${BUILD}</div></div>
    <div class="three17-objective"><span data-lock>🔒 SORTIE VERROUILLÉE</span><br><b>Éléments trouvés : <span data-count>0</span>/3</b><br><small data-floor>RDC · HALL D’ENTRÉE</small></div></div>
    <button class="three17-exit" type="button">← Lobby</button><div class="three17-cross"></div>
    <div class="three17-stick" aria-label="Joystick de déplacement"><div class="three17-knob"></div></div>
    <div class="three17-look" aria-label="Glisser pour regarder"></div>
    <div class="three17-actions"><button class="three17-btn flash" type="button" aria-label="Éteindre la lampe" aria-pressed="true">🔦</button>
    <button class="three17-btn interact" type="button">AGIR</button></div><div class="three17-hint"></div><div class="three17-msg" role="status"></div></div>
    <div class="three17-start"><div class="three17-card"><h1>3:17 FOUR</h1><div class="time">03:17</div><strong class="three17-build-label">V13 · REZ-DE-CHAUSSÉE</strong>
    <p>Explorez les pièces du rez-de-chaussée.<br>Trouvez la clé, le fusible et le sceau.<br><small>L’escalier reste fermé pour cette étape.</small></p>
    <button type="button">ENTRER DANS LA MAISON</button></div></div>
    <div class="three17-win"><div><h1>VOUS ÊTES SORTI</h1><p>Les trois éléments ont ouvert la sortie.</p><button class="three17-btn" type="button">OK</button></div></div></div>`;
  document.body.append(shell);
  const stage = shell.querySelector('.three17-stage');
  let renderer, scene, observer, raf = 0, stopped = false, messageTimer = 0;
  let removeVisibility = () => {};
  const session = { stop() {
    if (stopped) return;
    stopped = true; cancelAnimationFrame(raf); clearTimeout(messageTimer);
    observer?.disconnect(); removeVisibility();
    if (scene) disposeScene(scene);
    renderer?.dispose(); shell.remove();
  } };
  active = session;
  try {
    const house = createGroundFloor();
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x050807); scene.fog = new THREE.FogExp2(0x070b0a, .045);
    const meshes = buildHouseScene(scene, house);
    const camera = new THREE.PerspectiveCamera(68, 1, .05, 45);
    let yaw = house.spawn.yaw, pitch = house.spawn.pitch;
    const position = { x: house.spawn.x, z: house.spawn.z };
    const keys = { x: 0, y: 0 };
    let drag = null, look = null, lx = 0, ly = 0, started = false, won = false, count = 0;
    let last = performance.now(), lastRender = 0, lastHud = 0, flashOn = true;
    const FRAME_MS = 1000 / 45;
    const direction = new THREE.Vector3();
    scene.add(new THREE.HemisphereLight(0x536675, 0x130f0b, .32));
    const moon = new THREE.DirectionalLight(0x7890a8, .42); moon.position.set(2, 6, 3); scene.add(moon);
    const practicals = [[-4.7,1.65,4.8,0xd1a56d,5.0,4.2],[3.2,1.7,5.9,0xc89862,3.8,3.2],[-4.6,1.8,-5.7,0xb98b58,4.5,3.6],[3.5,1.65,-1.45,0xc29b70,2.8,2.8]];
    for (const [x,y,z,c,i,d] of practicals){const l=new THREE.PointLight(c,i,d,2);l.position.set(x,y,z);scene.add(l);}
    const flashlight = new THREE.SpotLight(0xe7dfcc, 52, 16, .46, .62, 1.45);
    const target = new THREE.Object3D(); flashlight.target = target; scene.add(flashlight, target);
    const fillLight = new THREE.PointLight(0xa8b3aa, 1.05, 3.2, 2.0); scene.add(fillLight);
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.15));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .92;
    stage.prepend(renderer.domElement);
    const stick = shell.querySelector('.three17-stick'), knob = shell.querySelector('.three17-knob');
    const flashButton = shell.querySelector('.flash'), hint = shell.querySelector('.three17-hint');
    const floorLabel = shell.querySelector('[data-floor]'), counter = shell.querySelector('[data-count]'), lockLabel = shell.querySelector('[data-lock]');
    const messageElement = shell.querySelector('.three17-msg');

    function resize() {
      const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    observer = new ResizeObserver(resize); observer.observe(stage); resize();
    function message(text) {
      messageElement.textContent = text; messageElement.classList.add('show'); clearTimeout(messageTimer);
      messageTimer = setTimeout(() => messageElement.classList.remove('show'), 1800);
    }
    function resetInputs() { drag = look = null; keys.x = keys.y = 0; knob.style.transform = ''; }
    function refreshCamera() {
      camera.rotation.order = 'YXZ'; camera.rotation.y = yaw; camera.rotation.x = pitch;
      camera.position.set(position.x, EYE_HEIGHT, position.z); camera.updateMatrixWorld();
    }
    function selectInteraction() {
      const from = { x: position.x, y: EYE_HEIGHT, z: position.z };
      let best = null, score = Infinity;
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      function candidate(object, type, point) {
        const dx = point.x - position.x, dz = point.z - position.z;
        const distance = Math.hypot(dx, dz);
        if (distance > 2.05) return;
        const facing = distance < .10 ? 1 : (fx * dx + fz * dz) / distance;
        if (facing < .38 || !hasLineOfSight(house, from, point, type === 'door' ? object.id : '')) return;
        const rank = distance + (1 - facing) * .75;
        if (rank < score) { best = { object, type }; score = rank; }
      }
      for (const item of house.items) if (!item.taken) candidate(item, 'item', item);
      for (const door of house.doors) {
        // Cible au centre de la FEUILLE réelle, même lorsqu'elle est ouverte.
        const c = Math.cos(door.angle), s = Math.sin(door.angle);
        candidate(door, 'door', { x: door.hingeX + c * door.width * .72,
          y: 1.20, z: door.hingeZ - s * door.width * .72 });
      }
      return best;
    }
    function interactionLabel(selection) {
      if (!selection) return '';
      const o = selection.object;
      if (selection.type === 'item') return 'AGIR · Prendre : ' + o.label;
      if (o.exit) return count === 3 ? 'AGIR · Ouvrir la sortie' : 'AGIR · Sortie verrouillée';
      if (o.locked) return 'Escalier fermé · aucun étage actif';
      return 'AGIR · ' + (Math.abs(o.targetAngle - o.closedAngle) < .01 ? 'Ouvrir : ' : 'Fermer : ') + o.label;
    }
    function interact() {
      if (!started || won) return;
      const selection = selectInteraction();
      if (!selection) { message('Approchez-vous et regardez la porte ou l’objet'); return; }
      const o = selection.object;
      if (selection.type === 'item') {
        o.taken = true; meshes.itemMeshes.get(o.id).visible = false; count++;
        counter.textContent = String(count); message('✓ ' + o.label + ' récupéré');
        if (count === 3) lockLabel.textContent = '🔓 RETOURNEZ À LA SORTIE';
      } else if (o.exit) {
        if (count < 3) message('Il manque ' + (3 - count) + ' élément' + (count < 2 ? 's' : ''));
        else { won = true; resetInputs(); shell.querySelector('.three17-win').classList.add('show'); }
      } else if (o.locked) message('Escalier condamné pour cette version : explorez le RDC');
      else {
        const desired = Math.abs(o.targetAngle - o.closedAngle) < .01 ? o.openAngle : o.closedAngle;
        // Ne ferme pas une porte SUR le joueur et ne le pousse pas à travers le mur.
        for (let step = 1; step <= 18; step++) {
          if (circleHitsDoor(position.x, position.z, PLAYER_RADIUS + .02, o, o.angle + (desired - o.angle) * step / 18)) {
            message('Reculez un peu pour laisser passer la porte'); return;
          }
        }
        o.targetAngle = desired; message(desired === o.openAngle ? 'Porte ouverte' : 'Porte fermée');
      }
    }
    function animateDoors(dt) {
      for (const d of house.doors) {
        const delta = d.targetAngle - d.angle;
        if (Math.abs(delta) < .0001) continue;
        const next = d.angle + Math.sign(delta) * Math.min(Math.abs(delta), dt * 5);
        if (circleHitsDoor(position.x, position.z, PLAYER_RADIUS + .015, d, next)) { d.targetAngle = d.angle; continue; }
        d.angle = next; meshes.doorMeshes.get(d.id).rotation.y = d.angle;
      }
    }
    function frame(now) {
      if (stopped) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden || now - lastRender < FRAME_MS) return;
      lastRender = now; const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (started && !won) {
        // Axes, vitesse et sens STRICTEMENT conservés depuis la version validée.
        const forwardInput = -keys.y, strafeInput = keys.x, spd = 2.5;
        const sin = Math.sin(yaw), cos = Math.cos(yaw);
        const moveX = (-sin * forwardInput + cos * strafeInput) * spd * dt;
        const moveZ = (-cos * forwardInput - sin * strafeInput) * spd * dt;
        movePlayer(house, position, moveX, moveZ);
        animateDoors(dt);
        for (const mesh of meshes.itemMeshes.values()) if (mesh.visible) mesh.rotation.y += dt * 1.6;
      }
      refreshCamera();
      flashlight.visible = fillLight.visible = flashOn;
      flashlight.position.copy(camera.position); fillLight.position.copy(camera.position);
      camera.getWorldDirection(direction); target.position.copy(camera.position).addScaledVector(direction, 5); target.updateMatrixWorld();
      if (now - lastHud > 120) {
        lastHud = now;
        const text = 'RDC · ' + roomAt(house, position.x, position.z).name.toUpperCase();
        if (floorLabel.textContent !== text) floorLabel.textContent = text;
        const selectionText = started && !won ? interactionLabel(selectInteraction()) : '';
        if (hint.textContent !== selectionText) hint.textContent = selectionText;
      }
      renderer.render(scene, camera);
    }

    // Joystick et caméra : mêmes zones, rayon 38, sensibilités .006 / .004.
    function sm(e) {
      const b = stick.getBoundingClientRect(), dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
      const d = Math.hypot(dx, dy) || 1, m = Math.min(38, d), nx = dx / d, ny = dy / d;
      keys.x = nx * (m / 38); keys.y = ny * (m / 38); knob.style.transform = `translate(${nx * m}px,${ny * m}px)`;
    }
    stick.addEventListener('pointerdown', e => { if (!started || won || drag !== null) return;
      drag = e.pointerId; stick.setPointerCapture(drag); sm(e); });
    stick.addEventListener('pointermove', e => { if (e.pointerId === drag) sm(e); });
    function se(e) { if (e.pointerId !== drag) return; drag = null; keys.x = keys.y = 0; knob.style.transform = ''; }
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.addEventListener(event, se);
    const lookZone = shell.querySelector('.three17-look');
    lookZone.addEventListener('pointerdown', e => { if (!started || won || look !== null) return;
      look = e.pointerId; lx = e.clientX; ly = e.clientY; lookZone.setPointerCapture(look); });
    lookZone.addEventListener('pointermove', e => {
      if (e.pointerId !== look) return;
      const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      yaw -= dx * .006; pitch = clamp(pitch - dy * .004, -.8, .7);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) lookZone.addEventListener(event, e => { if (e.pointerId === look) look = null; });
    // Le deuxième/troisième doigt n'est JAMAIS écarté au motif « !isPrimary ».
    function press(el, fn) {
      el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false });
      el.addEventListener('pointerup', e => e.stopPropagation());
      // Le click tactile peut avoir detail=0 : il ne doit pas doubler le pointerdown.
      el.addEventListener('click', e => { e.stopPropagation(); if (e.detail === 0 && !e.pointerType) fn(); });
    }
    press(shell.querySelector('.interact'), interact);
    press(flashButton, () => { if (!started || won) return;
      flashOn = !flashOn; flashButton.setAttribute('aria-pressed', String(flashOn));
      flashButton.setAttribute('aria-label', flashOn ? 'Éteindre la lampe' : 'Allumer la lampe');
      message(flashOn ? 'Lampe allumée' : 'Lampe éteinte'); });
    press(shell.querySelector('.three17-exit'), close);
    press(shell.querySelector('.three17-start button'), () => { resetInputs(); started = true;
      shell.querySelector('.three17-start')?.remove(); message('RDC uniquement · visez les portes et utilisez AGIR'); });
    press(shell.querySelector('.three17-win button'), close);
    const visibility = () => { resetInputs(); last = performance.now(); };
    document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', visibility);
    removeVisibility = () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', visibility); };
    refreshCamera(); raf = requestAnimationFrame(frame);

    // Instrumentation désactivée en production. Pas de téléportation dans le jeu.
    if (window.__ONE317_TEST__ === true) session.debug = {
      house, scene, renderer,
      snapshot: () => ({ x: position.x, z: position.z, y: camera.position.y, yaw, pitch, flashOn, started, won, count,
        drag, look, keys: { ...keys }, room: roomAt(house, position.x, position.z).id,
        selection: selectInteraction()?.object.id, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }),
      place(x, z, lookYaw = yaw, lookPitch = pitch) {
        if (blockedAt(house, x, z)) throw new Error('Point de test dans un obstacle');
        resetInputs(); position.x = x; position.z = z; yaw = lookYaw; pitch = lookPitch; refreshCamera();
      }, interact, selectInteraction, refreshCamera,
    };
  } catch (error) {
    console.error('3:17 FOUR V13 — lancement interrompu', error);
    session.stop();
    const message = document.createElement('div'); message.className = 'three17-shell three17-load-error';
    const text = document.createElement('p'); text.textContent = '3:17 FOUR V13 n’a pas pu démarrer. Fermez cette fenêtre et rechargez ONE. Si cela se reproduit, vérifiez le déploiement complet ou envoyez une capture de ce message.';
    const button = document.createElement('button'); button.textContent = 'Fermer'; button.onclick = () => message.remove();
    message.append(text, button); document.body.append(message);
    active = { stop: () => message.remove() };
  }
}
function close() { if (!active) return; const previous = active; active = null; previous.stop(); }
window.ONEThree17 = { open, close, build: BUILD };
if (window.__ONE317_TEST__ === true) Object.defineProperty(window.ONEThree17, 'debug', { get: () => active?.debug });
window.addEventListener('pagehide', close);
