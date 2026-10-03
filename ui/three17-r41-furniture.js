import * as THREE from './three.module.js?v=appels-v52';

export const R41_FURNITURE_IDS = new Set([
  'meuble-tv','tv-cadre','tv-ecran','bibliotheque','buffet','office-cabinet',
  'office-shelf','storage-shelf-a','storage-shelf-b','cellar-shelf-a','cellar-shelf-b',
  'storage-rack','basement-palier-rack','storage-locker','laundry-cabinet',
  'toy-box','storage-crate-a','storage-crate-b','ritual-crate',
  'basement-palier-crate-a','basement-palier-crate-b','ritual-table',
  'laundry-machine','laundry-sink','boiler-body','boiler-pipe','frigo',
  'lavabo-meuble','upper-vanity','cuisine-meubles-ouest','cuisine-meubles-nord',
  'cuisine-plan-ouest','cuisine-plan-nord'
]);
export function replaceR41Volume(v) {
  return R41_FURNITURE_IDS.has(v.id)||/^(nursery-desk-|office-desk-|boiler-bench-)/.test(v.id);
}

// Detailed render-only furniture; house volumes and interaction targets remain untouched.
export function addR41Furniture(decor, house, materials) {
  const wood=materials.wood,trim=materials.trim,metal=materials.metal;
  const dark=new THREE.MeshStandardMaterial({color:0x131714,roughness:.83});
  const enamel=new THREE.MeshStandardMaterial({color:0x929782,roughness:.52,metalness:.08});
  const rubber=new THREE.MeshStandardMaterial({color:0x20211c,roughness:.91});
  const glass=new THREE.MeshStandardMaterial({color:0x1b2925,roughness:.22,metalness:.35});
  const rust=materials.cabinet.clone();rust.color.set(0x5f5142);rust.metalness=.25;
  const paper=materials.paper.clone();paper.color.set(0x8b836a);
  const unit=new THREE.BoxGeometry(1,1,1);
  function piece(parent,g,m,x,y,z){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=true;parent.add(o);return o;}
  function box(p,x,y,z,w,h,d,m=wood){const o=piece(p,unit,m,x,y,z);o.scale.set(w,h,d);o.castShadow=w*h*d>.035;return o;}
  function round(p,x,y,z,w,h,d,m=wood,r=.025){
    r=Math.min(r,w/4,h/4,d/4);const a=w/2-r,b=h/2-r,s=new THREE.Shape();
    s.moveTo(-a-r,-b);s.quadraticCurveTo(-a-r,-b-r,-a,-b-r);s.lineTo(a,-b-r);s.quadraticCurveTo(a+r,-b-r,a+r,-b);s.lineTo(a+r,b);s.quadraticCurveTo(a+r,b+r,a,b+r);s.lineTo(-a,b+r);s.quadraticCurveTo(-a-r,b+r,-a-r,b);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.001,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r*.65,bevelSegments:1,steps:1,curveSegments:2});
    g.translate(0,0,-d/2+r);const o=piece(p,g,m,x,y,z);o.castShadow=w*h*d>.035;return o;
  }
  function cyl(p,x,y,z,r,h,m=metal,top=r){const o=piece(p,new THREE.CylinderGeometry(top,r,h,12),m,x,y,z);o.castShadow=r*r*h>.05;return o;}
  function ring(p,x,y,z,r,t,m=metal){return piece(p,new THREE.TorusGeometry(r,t,5,24),m,x,y,z);}
  function tube(p,points,r=.015,m=metal){return piece(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),12,r,6,false),m,0,0,0);}
  function host(id,yaw=null){const v=house.volumes.find(v=>v.id===id);if(!v)throw Error('Mobilier absent '+id);
    const p=new THREE.Group();p.name='R41-'+id;p.position.set(v.x,v.y-v.h/2,v.z);
    const turned=v.w<v.d; p.rotation.y=yaw??(turned?(v.x>0?-Math.PI/2:Math.PI/2):0);decor.add(p);
    return {p,v,w:turned?v.d:v.w,d:turned?v.w:v.d,h:v.h};
  }
  function feet(p,w,d,h=.12,m=trim){for(const x of [-w*.40,w*.40])for(const z of [-d*.35,d*.35]){
    cyl(p,x,h*.5,z,.034,h,m,.049);round(p,x,h*.18,z,.09,.04,.09,m,.01);
  }}
  function pull(p,x,y,z,width=.15){tube(p,[[x-width/2,y,z-.018],[x-width/2,y,z+.025],[x+width/2,y,z+.025],[x+width/2,y,z-.018]],.009);}
  function panel(p,x,y,z,w,h,m=wood){round(p,x,y,z,w,h,.045,m,.012);round(p,x,y,z+.028,w-.08,h-.08,.018,trim,.008);}
  // Hollow shelves with separate boards, turned posts and irregular contents.
  for(const id of ['bibliotheque','office-shelf','storage-shelf-a','storage-shelf-b','cellar-shelf-a','cellar-shelf-b','storage-rack','basement-palier-rack']){
    const {p,w,d,h}=host(id);const steel=/rack/.test(id),m=steel?rust:wood;
    for(const x of [-w/2+.045,w/2-.045])for(const z of [-d/2+.04,d/2-.04]){
      if(steel)box(p,x,h/2,z,.045,h,.045,m);else cyl(p,x,h/2,z,.045,h,trim,.04);
    }
    box(p,0,h/2,-d/2+.012,w-.07,h-.07,.025,m);
    for(let row=0;row<5;row++){
      const y=.07+row*(h-.14)/4;round(p,0,y,0,w,.065,d,m,.013);
      if(row===4)continue;
      if(!steel&&(/biblio|office/.test(id)||row%2===0)){
        for(let j=0;j<Math.floor(w/.13)-1;j++){
          const bh=.19+((j*7+row*3)%5)*.025,x=-w/2+.15+j*.115;
          const b=round(p,x,y+.04+bh/2,.03,.074,bh,d*.55,j%3===0?trim:wood,.006);
          b.rotation.z=(j%5===1?.12:0);box(p,x,y+.04+bh/2,d*.31,.048,bh*.8,.006,paper);
        }
      }else{
        for(const x of [-w*.25,w*.22]){
          cyl(p,x,y+.14,0,.10,.21,steel?enamel:glass);cyl(p,x,y+.255,0,.09,.026,metal);
        }
      }
    }
    if(!steel){round(p,0,h+.01,0,w+.025,.085,d+.015,trim);round(p,0,h-.065,.01,w,.045,d,trim);}
  }
  // Plank crates and a toy chest, with gaps, diagonal braces and metal straps.
  for(const id of ['toy-box','storage-crate-a','storage-crate-b','ritual-crate','basement-palier-crate-a','basement-palier-crate-b']){
    const {p,w,d,h}=host(id,0);box(p,0,.03,0,w,.06,d);
    for(let j=0;j<3;j++)for(const z of [-d/2+.024,d/2-.024])round(p,0,(j+.5)*h/3,z,w-.02,h/3-.012,.045,wood,.009);
    for(let j=0;j<3;j++)for(const x of [-w/2+.024,w/2-.024])round(p,x,(j+.5)*h/3,0,.045,h/3-.012,d-.06,wood,.008);
    for(let j=0;j<5;j++)round(p,-w/2+(j+.5)*w/5,h-.016,0,w/5-.008,.045,d,trim,.009);
    for(const x of [-w*.34,w*.34]){box(p,x,h/2,d/2,.034,h,.012,metal);box(p,x,h,.0,.034,.012,d,metal);}
    const brace=box(p,0,h*.48,d/2+.013,w*.9,.053,.022,trim);brace.rotation.z=Math.atan2(h*.68,w*.8);
    if(id==='toy-box')pull(p,0,h*.65,d/2+.025,.16);
  }
  // Vanity units: raised panels, shaped feet and a recessed underside.
  for(const id of ['lavabo-meuble','upper-vanity']){
    const {p,w,d,h}=host(id,0);feet(p,w,d,.16);
    round(p,0,(h+.16)/2,-d*.05,w-.06,h-.18,d-.07);round(p,0,h-.04,0,w,.08,d,enamel);
    for(const x of [-w*.235,w*.235]){panel(p,x,h*.51,d/2-.01,w*.44,h*.61);pull(p,x,h*.66,d/2+.022,.10);}
  }
  // Segmented kitchen cabinets: separate doors, recessed feet and bevelled stone tops.
  for(const id of ['cuisine-meubles-ouest','cuisine-meubles-nord']){
    const {p,w,d,h}=host(id);const count=Math.round(w/.65),step=w/count;
    box(p,0,h/2,-.025,w-.05,h-.09,d-.10);box(p,0,.08,-.025,w-.10,.16,d-.20,trim);
    for(let i=0;i<count;i++){
      const x=-w/2+(i+.5)*step;panel(p,x,h*.47,d/2-.036,step-.035,h*.70,materials.cabinet);
      round(p,x,h*.86,d/2-.02,step-.035,.16,.055,materials.cabinet,.011);pull(p,x,h*.88,d/2+.013,.17);
    }
    round(p,0,h+.045,0,w+.045,.09,d+.055,materials.stone,.018);
  }
  // Vintage rounded fridge, visible gasket and hinge/handle hardware.
  {const {p,w,d,h}=host('frigo',0);feet(p,w,d,.08,metal);round(p,0,h/2,0,w,h-.06,d-.03,enamel,.07);
    for(const [y,hh] of [[.38,.57],[1.3,1.18]]){round(p,0,y,d/2-.055,w-.06,hh,.10,rubber,.025);round(p,0,y,d/2-.002,w-.085,hh-.035,.075,enamel,.03);tube(p,[[-w*.30,y-.13,d/2+.035],[-w*.30,y-.13,d/2+.080],[-w*.30,y+.13,d/2+.080],[-w*.30,y+.13,d/2+.035]],.014);}
    for(let i=0;i<7;i++)box(p,-w*.32+i*w*.10,.135,d/2,.055,.052,.009,dark);
    round(p,.20,1.74,d/2+.04,.20,.045,.012,metal,.006);
  }
  // Washer: sculpted case, inset circular door, drum, switches and rear hoses.
  {const {p,w,d,h}=host('laundry-machine',0);round(p,0,h/2,0,w,h,d,enamel,.045);round(p,0,h-.035,0,w+.015,.07,d+.025,enamel);
    const z=d/2+.01;round(p,0,h-.15,z,w-.09,.19,.04,trim,.014);
    for(const x of [w*.20,w*.34]){const n=cyl(p,x,h-.15,z+.035,.031,.022,metal);n.rotation.x=Math.PI/2;}
    round(p,-.23,h-.15,z+.03,.25,.055,.018,enamel,.009);
    const disk=piece(p,new THREE.CircleGeometry(.285,28),dark,0,.46,z+.006);
    ring(p,0,.46,z+.035,.285,.035,rubber);ring(p,0,.46,z+.055,.251,.018,metal);
    piece(p,new THREE.CircleGeometry(.225,28),glass,0,.46,z+.018);
    pull(p,.23,.46,z+.079,.07);for(let i=0;i<6;i++)box(p,-.30+i*.12,.095,z,.065,.014,.013,dark);
    tube(p,[[.28,.9,-d/2],[.28,1.18,-d/2+.02],[.40,1.2,-d/2+.06],[.40,.4,-d/2+.06]],.023,rubber);
  }
  {const {p,w,d,h}=host('laundry-sink',0);for(const x of [-w*.43,w*.43])for(const z of [-d*.36,d*.36])cyl(p,x,h*.45,z,.024,h*.90,metal);
    box(p,0,.20,0,w-.08,.045,d-.08,trim);tube(p,[[0,h-.18,0],[0,h-.5,0],[.19,h-.61,0],[.19,.12,0]],.035,metal);
  }
  // A tall round boiler and a vented locker replace the remaining solid blocks.
  {const {p,w,d,h}=host('boiler-body',0);const r=Math.min(w,d)*.43;cyl(p,0,h*.49,0,r,h*.83,rust);piece(p,new THREE.SphereGeometry(r,20,10),rust,0,h*.91,0).scale.y=.22;
    for(const y of [.22,h*.72])ring(p,0,y,0,r+.009,.024,metal).rotation.x=Math.PI/2;
    for(const x of [-.3,.3])cyl(p,x,.1,0,.04,.2,metal);tube(p,[[0,h-.02,0],[0,h+.30,0],[.23,h+.40,0]],.073,rust);
    const gauge=piece(p,new THREE.CircleGeometry(.083,16),paper,0,h*.67,r+.008);ring(p,0,h*.67,r+.015,.083,.012,metal);box(p,0,h*.67+.018,r+.023,.009,.067,.008,dark).rotation.z=-.6;
    tube(p,[[-r*.65,.28,.05],[-r*.65,.57,r*.5],[-r*.65,1.1,r*.5]],.024,metal);
  }
  {const {p,w,d,h}=host('storage-locker');feet(p,w,d,.09,metal);round(p,0,h*.51,0,w-.015,h-.04,d,rust,.024);
    panel(p,0,h*.52,d/2+.006,w-.09,h-.17,rust);for(const y of [.25,.33,.41,1.56,1.64,1.72])box(p,0,y,d/2+.038,w*.6,.025,.012,dark);pull(p,w*.30,1.02,d/2+.063,.08);
  }
  // A convex CRT on the replacement sideboard, with dials and speaker slots.
  {const p=new THREE.Group();p.position.set(-3.6,.67,8.9);p.rotation.y=Math.PI;decor.add(p);
    round(p,0,.36,0,1.04,.70,.40,trim,.035);round(p,-.075,.38,.211,.76,.54,.065,rubber,.035);
    const screen=piece(p,new THREE.SphereGeometry(1,24,12),glass,-.075,.38,.221);screen.scale.set(.35,.245,.030);
    for(const y of [.20,.38]){const knob=cyl(p,.414,y,.25,.030,.045,metal);knob.rotation.x=Math.PI/2;}
    for(let i=0;i<5;i++)box(p,.41,.51+i*.020,.214,.10,.008,.015,dark);
  }
  decor.userData.r41FurnitureCount=R41_FURNITURE_IDS.size+3;
}
