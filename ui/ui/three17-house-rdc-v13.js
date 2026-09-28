/**
 * 3:17 FOUR — V13. Un seul plan au sol, en mètres (X/Z), Y=0.
 * Ce module ne dépend pas du rendu : géométrie et collisions lisent LES MÊMES
 * volumes. Il est aussi importé par les tests de circulation hors navigateur.
 */
export const BUILD = 'V13 · RDC';
export const EYE_HEIGHT = 1.62;
export const PLAYER_RADIUS = 0.28;
export const WALL_HEIGHT = 3.0;
export const WALL_THICKNESS = 0.24;
const TAU_QUARTER = Math.PI / 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createGroundFloor() {
  const volumes = [], solids = [], doors = [], surfaces = [], signs = [];
  const bounds = { minX: -7, maxX: 7, minZ: -8, maxZ: 8 };
  const rooms = [
    { id: 'hall', name: 'Hall d’entrée', x0: -1.25, x1: 1.25, z0: 3, z1: 8, floor: 'hallFloor', visit: [0, 5] },
    { id: 'corridor', name: 'Couloir', x0: -1.25, x1: 1.25, z0: -8, z1: 3, floor: 'woodFloor', visit: [0, -2] },
    { id: 'salon', name: 'Salon', x0: -7, x1: -1.25, z0: 1, z1: 8, floor: 'woodFloor', visit: [-3.1, 5.4] },
    { id: 'dining', name: 'Salle à manger', x0: -7, x1: -1.25, z0: -3.5, z1: 1, floor: 'woodFloor', visit: [-2.8, -1.1] },
    { id: 'kitchen', name: 'Cuisine', x0: -7, x1: -1.25, z0: -8, z1: -3.5, floor: 'kitchenFloor', visit: [-3.3, -5.5] },
    { id: 'bedroom', name: 'Chambre', x0: 1.25, x1: 7, z0: 2, z1: 8, floor: 'woodFloor', visit: [2.4, 4.8] },
    { id: 'bathroom', name: 'Salle de bain', x0: 1.25, x1: 7, z0: -2, z1: 2, floor: 'bathFloor', visit: [2.6, 0] },
    { id: 'stairs', name: 'Cage d’escalier — fermée', x0: 1.25, x1: 7, z0: -8, z1: -2, floor: 'stoneFloor', locked: true, visit: [3, -4] },
  ];

  // Chaque volume solide sert directement à la fois au rendu ET à la physique.
  function volume(id, x, y, z, w, h, d, material, solid = true, kind = 'furniture') {
    if (![x, y, z, w, h, d].every(Number.isFinite) || Math.min(w, h, d) <= 0) {
      throw new Error('Volume invalide : ' + id);
    }
    const v = { id, x, y, z, w, h, d, material, solid, kind };
    volumes.push(v);
    if (solid) solids.push(v);
    return v;
  }
  function wallPart(id, axis, fixed, from, to, bottom = 0, height = WALL_HEIGHT) {
    if (to - from < 0.001) return;
    volume(id, axis === 'x' ? (from + to) / 2 : fixed,
      bottom + height / 2, axis === 'x' ? fixed : (from + to) / 2,
      axis === 'x' ? to - from : WALL_THICKNESS, height,
      axis === 'x' ? WALL_THICKNESS : to - from, 'plaster', true, 'wall');
  }
  function doorInGap(axis, fixed, gap) {
    const { id, label, center, width } = gap;
    const x = axis === 'x' ? center : fixed;
    const z = axis === 'x' ? fixed : center;
    const angle = axis === 'x' ? 0 : -TAU_QUARTER;
    const hingeX = axis === 'x' ? x - width / 2 + 0.045 : x;
    const hingeZ = axis === 'x' ? z : z - width / 2 + 0.045;
    const d = {
      id, label, x, z, hingeX, hingeZ, width: width - 0.09,
      height: 2.18, thickness: 0.085, closedAngle: angle,
      openAngle: angle + (gap.swing || 1) * TAU_QUARTER,
      angle, targetAngle: angle, locked: !!gap.locked, exit: !!gap.exit,
    };
    if (gap.open && !d.locked) d.angle = d.targetAngle = d.openAngle;
    doors.push(d);
    return d;
  }
  // Les ouvertures sont RETIRÉES des murs avant d'ajouter les portes.
  function wallRun(id, axis, fixed, from, to, gaps = []) {
    const sorted = [...gaps].sort((a, b) => a.center - b.center);
    let cursor = from;
    for (const g of sorted) {
      const a = g.center - g.width / 2, b = g.center + g.width / 2;
      if (a < cursor - 0.001 || b > to + 0.001) throw new Error('Ouvertures superposées : ' + id);
      wallPart(id + '-mur-' + cursor, axis, fixed, cursor, a);
      wallPart(id + '-linteau-' + g.id, axis, fixed, a, b, 2.3, WALL_HEIGHT - 2.3);
      // Encadrements solides ; 6 cm de chaque côté de la baie.
      for (const edge of [a - 0.015, b + 0.015]) {
        volume(g.id + '-montant-' + edge, axis === 'x' ? edge : fixed, 1.15,
          axis === 'x' ? fixed : edge, axis === 'x' ? 0.065 : 0.30, 2.3,
          axis === 'x' ? 0.30 : 0.065, 'trim', true, 'frame');
      }
      volume(g.id + '-traverse', axis === 'x' ? g.center : fixed, 2.3,
        axis === 'x' ? fixed : g.center, axis === 'x' ? g.width + 0.09 : 0.30,
        0.10, axis === 'x' ? 0.30 : g.width + 0.09, 'trim', false, 'frame');
      if (!g.arch) doorInGap(axis, fixed, g);
      if (g.sign !== false) signs.push({ text: g.label, x: axis === 'x' ? g.center : fixed + (fixed < 0 ? 0.145 : -0.145),
        z: axis === 'x' ? fixed + 0.145 : g.center, y: 2.60, ry: axis === 'x' ? 0 : (fixed < 0 ? TAU_QUARTER : -TAU_QUARTER) });
      cursor = b;
    }
    wallPart(id + '-mur-fin', axis, fixed, cursor, to);
  }

  wallRun('nord', 'x', -8, -7.12, 7.12);
  wallRun('sud', 'x', 8, -7.12, 7.12, [{ id: 'exit', label: 'SORTIE', center: 0, width: 1.45, exit: true, locked: true, sign: false }]);
  wallRun('ouest', 'z', -7, -8, 8);
  wallRun('est', 'z', 7, -8, 8);
  wallRun('couloir-ouest', 'z', -1.25, -8, 8, [
    { id: 'kitchen', label: 'CUISINE', center: -5.6, width: 1.4, swing: -1 },
    { id: 'dining', label: 'SALLE À MANGER', center: -1.1, width: 1.4, swing: -1 },
    { id: 'salon', label: 'SALON', center: 5.3, width: 1.5, swing: -1, open: true },
  ]);
  wallRun('couloir-est', 'z', 1.25, -8, 8, [
    { id: 'stairs', label: 'ESCALIER · FERMÉ', center: -4.7, width: 1.4, locked: true },
    { id: 'bathroom', label: 'SALLE DE BAIN', center: 0, width: 1.3, swing: 1 },
    { id: 'bedroom', label: 'CHAMBRE', center: 4.8, width: 1.4, swing: 1 },
  ]);
  wallRun('salon-dining', 'x', 1, -7, -1.25, [{ id: 'arch-salon', label: 'SALLE À MANGER', center: -3.1, width: 1.6, arch: true, sign: false }]);
  wallRun('dining-kitchen', 'x', -3.5, -7, -1.25, [{ id: 'kitchen-back', label: 'CUISINE', center: -3.1, width: 1.4, swing: 1, sign: false }]);
  wallRun('bedroom-bathroom', 'x', 2, 1.25, 7);
  wallRun('bathroom-stairs', 'x', -2, 1.25, 7);
  wallRun('hall-arch', 'x', 3, -1.25, 1.25, [{ id: 'hall-arch', label: 'COULOIR', center: 0, width: 1.95, arch: true }]);

  // Un seul sol porteur, un seul plafond. Aucune rampe ni autre altitude.
  volume('sol-porteur', 0, -0.11, 0, 14.24, 0.20, 16.24, 'stone', false, 'floor');
  volume('plafond', 0, 3.08, 0, 14.24, 0.16, 16.24, 'ceiling', false, 'ceiling');
  for (const r of rooms) surfaces.push({ id: 'sol-' + r.id, x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2,
    y: 0, w: r.x1 - r.x0, d: r.z1 - r.z0, material: r.floor });
  surfaces.push({ id: 'tapis-hall', x: 0, y: 0.006, z: 5.3, w: 1.60, d: 3.50, material: 'rug' });
  surfaces.push({ id: 'tapis-salon', x: -4.7, y: 0.006, z: 4.6, w: 3.35, d: 3.9, material: 'rug' });

  // Mobilier bas, réparti PAR PIÈCE, hors des baies et des passages.
  const b = (id, x, y, z, w, h, d, mat = 'wood', solid = true) => volume(id, x, y, z, w, h, d, mat, solid);
  function table(id, x, z, w, d, top = .76, mat = 'wood') {
    b(id + '-plateau', x, top - .06, z, w, .12, d, mat);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b(id + '-pied-' + sx + sz, x + sx * (w / 2 - .10), (top - .12) / 2,
      z + sz * (d / 2 - .10), .12, top - .12, .12, 'trim');
  }
  // Salon
  b('canape-assise', -5.90, .36, 4.55, 1.20, .72, 2.8, 'fabric');
  b('canape-dossier', -6.38, .78, 4.55, .24, 1.18, 2.8, 'fabric');
  for (const z of [3.18, 5.92]) b('canape-accoudoir-' + z, -5.90, .60, z, 1.20, .42, .22, 'fabric');
  table('table-basse', -4.35, 4.5, 1.25, 1.65, .50);
  b('meuble-tv', -3.60, .31, 7.40, 2.05, .62, .55);
  b('tv-cadre', -3.60, 1.32, 7.72, 1.65, .95, .12, 'dark');
  b('tv-ecran', -3.60, 1.32, 7.647, 1.50, .80, .014, 'screen', false);
  b('bibliotheque', -6.42, 1.02, 2.0, .62, 2.04, 1.15, 'wood');
  for (let i = 0; i < 5; i++) b('livre-' + i, -6.08, .7 + (i % 2) * .55, 1.58 + i * .18, .05, .33, .12, i % 2 ? 'fabric' : 'paper', false);
  // Salle à manger
  table('table-repas', -4.60, -1.12, 1.85, 1.35, .80);
  for (const z of [-2.25, .02]) {
    b('chaise-assise-' + z, -4.60, .45, z, .55, .12, .55);
    b('chaise-dossier-' + z, -4.60, .80, z + (z < -1 ? -.23 : .23), .55, .70, .10);
    for (const dx of [-.2, .2]) for (const dz of [-.2, .2]) b('chaise-pied-' + z + dx + dz, -4.60 + dx, .20, z + dz, .07, .4, .07);
  }
  b('buffet', -6.44, .48, -1.2, .70, .96, 2.0);
  // Cuisine
  b('cuisine-meubles-ouest', -6.40, .46, -5.9, .88, .92, 3.1, 'cabinet');
  b('cuisine-plan-ouest', -6.40, .965, -5.9, .96, .09, 3.15, 'stone');
  b('cuisine-meubles-nord', -4.50, .46, -7.40, 3.15, .92, .88, 'cabinet');
  b('cuisine-plan-nord', -4.50, .965, -7.40, 3.2, .09, .96, 'stone');
  b('evier', -4.6, 1.017, -7.4, .75, .015, .58, 'dark', false);
  b('robinet', -4.6, 1.15, -7.65, .07, .28, .07, 'metal', false);
  b('cuisiniere', -6.40, 1.016, -5.6, .76, .02, .88, 'dark', false);
  for (const z of [-5.85, -5.4]) for (const x of [-6.61, -6.23]) b('plaque-' + x + z, x, 1.032, z, .23, .01, .24, 'metal', false);
  b('frigo', -2.12, 1.0, -7.08, .98, 2.0, 1.1, 'enamel');
  b('frigo-poignee', -2.40, 1.15, -6.50, .05, .60, .08, 'metal', false);
  b('frigo-joint', -2.12, 1.43, -6.52, .93, .03, .03, 'dark', false);
  // Chambre
  b('lit-sommier', 4.75, .23, 5.1, 1.95, .46, 2.9, 'wood');
  b('lit-matelas', 4.75, .52, 5.1, 1.94, .18, 2.85, 'linen');
  b('lit-couverture', 4.75, .635, 4.75, 1.94, .07, 2.08, 'fabric');
  b('lit-tete', 4.75, .64, 6.55, 2.05, 1.15, .17, 'wood');
  for (const x of [4.29, 5.23]) b('oreiller-' + x, x, .65, 6.05, .75, .16, .48, 'linen');
  b('chevet', 3.15, .32, 6.2, .65, .64, .68, 'wood');
  b('armoire', 6.45, 1.04, 3.43, .70, 2.08, 1.65, 'wood');
  for (const z of [3.12, 3.75]) b('armoire-poignee-' + z, 6.075, 1.15, z, .05, .26, .045, 'metal', false);
  // Salle de bain
  b('baignoire-base', 5.8, .17, .2, 1.5, .34, 2.35, 'enamel');
  for (const x of [5.12, 6.48]) b('baignoire-bord-' + x, x, .49, .2, .14, .36, 2.35, 'enamel');
  for (const z of [-.91, 1.31]) b('baignoire-bord-' + z, 5.8, .49, z, 1.5, .36, .13, 'enamel');
  b('baignoire-interieur', 5.8, .35, .2, 1.2, .035, 2.0, 'bathInner', false);
  b('lavabo-meuble', 3.5, .39, -1.49, 1.25, .78, .65, 'cabinet');
  b('lavabo-vasque', 3.5, .82, -1.49, 1.28, .1, .67, 'enamel');
  b('miroir-cadre', 3.5, 1.69, -1.84, 1.2, 1.13, .06, 'trim', false);
  b('miroir', 3.5, 1.69, -1.801, 1.07, 1.0, .014, 'mirror', false);
  b('wc-base', 3.6, .22, 1.18, .50, .44, .64, 'enamel');
  b('wc-assise', 3.6, .45, 1.18, .62, .08, .74, 'enamel');
  b('wc-reservoir', 3.6, .63, 1.57, .56, .75, .25, 'enamel');

  // Fenêtres décoratives plaquées sur les murs : jamais de trous non protégés.
  for (const win of [{ x: -6.865, z: 6.7, side: 'west' }, { x: -6.865, z: -6.0, side: 'west' },
    { x: 6.865, z: 6.2, side: 'east' }, { x: 6.865, z: -.15, side: 'east' }]) {
    const side = win.side === 'west' ? 1 : -1;
    b('fenetre-cadre-' + win.z + side, win.x, 1.95, win.z, .07, 1.32, 1.45, 'trim', false);
    b('fenetre-vitre-' + win.z + side, win.x + side * .043, 1.95, win.z, .012, 1.13, 1.26, 'glass', false);
    b('fenetre-montant-' + win.z + side, win.x + side * .06, 1.95, win.z, .025, 1.14, .055, 'trim', false);
    b('fenetre-traverse-' + win.z + side, win.x + side * .06, 1.95, win.z, .025, .055, 1.25, 'trim', false);
  }
  signs.push({ text: 'SORTIE', x: 0, y: 2.6, z: 7.853, ry: Math.PI });
  signs.push({ text: '03:17', x: 0, y: 1.95, z: -7.853, ry: 0 });

  const items = [
    { id: 'key', label: 'Clé ancienne', room: 'bedroom', x: 3.15, y: .91, z: 6.2, color: 0xd5b567, taken: false },
    { id: 'fuse', label: 'Fusible', room: 'kitchen', x: -5.4, y: 1.21, z: -7.30, color: 0x75c5e0, taken: false },
    { id: 'seal', label: 'Sceau', room: 'dining', x: -4.25, y: 1.01, z: -1.12, color: 0xb19dda, taken: false },
  ];
  return { bounds, rooms, volumes, solids, doors, surfaces, signs, items, spawn: { x: 0, z: 6.2, yaw: 0, pitch: -.03 } };
}

export function circleHitsBox(x, z, radius, box) {
  const dx = x - clamp(x, box.x - box.w / 2, box.x + box.w / 2);
  const dz = z - clamp(z, box.z - box.d / 2, box.z + box.d / 2);
  return dx * dx + dz * dz < radius * radius - 1e-9;
}

export function circleHitsDoor(x, z, radius, door, angle = door.angle) {
  const dx = x - door.hingeX, dz = z - door.hingeZ;
  const c = Math.cos(angle), s = Math.sin(angle);
  const localX = dx * c - dz * s, localZ = dx * s + dz * c;
  const a = localX - clamp(localX, 0, door.width);
  const b = localZ - clamp(localZ, -door.thickness / 2, door.thickness / 2);
  return a * a + b * b < radius * radius - 1e-9;
}

export function blockedAt(house, x, z, radius = PLAYER_RADIUS) {
  const b = house.bounds;
  if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) return true;
  for (const v of house.solids) {
    // Corps debout (sans saut) : les linteaux au-dessus de la tête ne bloquent pas.
    if (v.y - v.h / 2 >= 1.80 || v.y + v.h / 2 <= .06) continue;
    if (circleHitsBox(x, z, radius, v)) return true;
  }
  for (const door of house.doors) if (circleHitsDoor(x, z, radius, door)) return true;
  return false;
}

export function movePlayer(house, position, dx, dz) {
  // Sous-pas bornés : une image lente ne permet pas de traverser une cloison.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .08));
  const sx = dx / steps, sz = dz / steps;
  for (let i = 0; i < steps; i++) {
    if (!blockedAt(house, position.x + sx, position.z)) position.x += sx;
    if (!blockedAt(house, position.x, position.z + sz)) position.z += sz;
  }
  return position;
}

// Intersection segment / boîte. Le paramètre est dans [0,1], pas en mètres.
function segmentHitsBox(a, b, box) {
  let near = .002, far = .995;
  for (const [axis, span] of [['x', 'w'], ['y', 'h'], ['z', 'd']]) {
    const low = box[axis] - box[span] / 2, high = box[axis] + box[span] / 2;
    const delta = b[axis] - a[axis];
    if (Math.abs(delta) < 1e-9) { if (a[axis] < low || a[axis] > high) return false; }
    else {
      let u = (low - a[axis]) / delta, v = (high - a[axis]) / delta;
      if (u > v) [u, v] = [v, u];
      near = Math.max(near, u); far = Math.min(far, v);
      if (near > far) return false;
    }
  }
  return near <= far;
}
export function hasLineOfSight(house, from, to, ignoreDoorId = '') {
  for (const v of house.solids) if (segmentHitsBox(from, to, v)) return false;
  for (const door of house.doors) {
    if (door.id === ignoreDoorId) continue;
    const c = Math.cos(door.angle), s = Math.sin(door.angle);
    const local = p => ({ x: (p.x - door.hingeX) * c - (p.z - door.hingeZ) * s,
      z: (p.x - door.hingeX) * s + (p.z - door.hingeZ) * c, y: p.y });
    if (segmentHitsBox(local(from), local(to), { x: door.width / 2, y: door.height / 2, z: 0,
      w: door.width, h: door.height, d: door.thickness })) return false;
  }
  return true;
}
export function roomAt(house, x, z) {
  return house.rooms.find(r => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) || house.rooms[0];
}
