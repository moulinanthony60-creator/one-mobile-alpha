import * as THREE from './three.module.js';

// Shared compact cartoon pistol for the rack, local view and other players.
export function createPistol(){
 const root=new THREE.Group(),slide=new THREE.Group();root.add(slide);
 const steel=new THREE.MeshStandardMaterial({color:'#61737f',metalness:.30,roughness:.43}),frame=new THREE.MeshStandardMaterial({color:'#26313a',metalness:.08,roughness:.62}),rubber=new THREE.MeshStandardMaterial({color:'#131c23',roughness:.92}),dark=new THREE.MeshStandardMaterial({color:'#080e12',roughness:.85}),accent=new THREE.MeshStandardMaterial({color:'#d5e7cf',roughness:.6});
 function profile(points,width,material,parent=root,bevel=.009){const shape=new THREE.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(-z,y):shape.moveTo(-z,y));shape.closePath();const o=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:4,curveSegments:1}),material);o.rotation.y=Math.PI/2;o.position.x=-width/2;parent.add(o);return o;}
 function box(w,h,d,material,x,y,z,parent=root){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);o.position.set(x,y,z);parent.add(o);return o;}
 // Thin upper slide, softened corners and tapered nose.
 profile([[-.43,.018],[-.43,.080],[-.402,.105],[.046,.105],[.068,.087],[.068,.018]],.096,steel,slide);
 profile([[-.41,-.034],[-.399,.008],[.061,.008],[.080,-.09],[-.06,-.10],[-.34,-.055]],.084,frame);
 profile([[-.007,-.086],[.077,-.079],[.145,-.302],[.025,-.323],[-.038,-.142]],.087,rubber);
 profile([[.024,-.312],[.146,-.290],[.153,-.320],[.027,-.342]],.104,frame);
 for(const side of [-1,1])for(let i=0;i<4;i++){
  const stripe=box(.005,.008,.058,frame,side*.049,-.165-i*.033,.049+i*.010);stripe.rotation.x=-.24;
 }
 const guardShape=new THREE.Shape();guardShape.moveTo(-.039,-.055);guardShape.lineTo(.148,-.055);guardShape.quadraticCurveTo(.175,-.172,.111,-.193);guardShape.lineTo(.004,-.166);guardShape.closePath();const hole=new THREE.Path();hole.moveTo(-.012,-.078);hole.lineTo(.015,-.141);hole.lineTo(.106,-.164);hole.quadraticCurveTo(.137,-.151,.123,-.078);hole.closePath();guardShape.holes.push(hole);
 const guard=new THREE.Mesh(new THREE.ExtrudeGeometry(guardShape,{depth:.018,bevelEnabled:true,bevelThickness:.005,bevelSize:.005,bevelSegments:3,curveSegments:12}),frame);guard.rotation.y=Math.PI/2;guard.position.x=-.009;root.add(guard);
 const trigger=box(.012,.064,.012,steel,0,-.111,-.065);trigger.rotation.x=-.25;
 const bore=new THREE.Mesh(new THREE.RingGeometry(.015,.024,28),frame);bore.position.set(0,.054,-.440);bore.rotation.y=Math.PI;slide.add(bore);const inside=new THREE.Mesh(new THREE.CircleGeometry(.015,28),dark);inside.position.set(0,.054,-.438);inside.rotation.y=Math.PI;slide.add(inside);
 box(.043,.004,.075,dark,.018,.117,-.107,slide);
 for(const side of [-1,1])for(let i=0;i<4;i++)box(.004,.042,.008,frame,side*.058,.064,.033-i*.023,slide);
 box(.012,.014,.020,accent,0,.126,-.380,slide);for(const side of [-1,1])box(.012,.017,.018,frame,side*.029,.124,.034,slide);
 box(.010,.015,.046,steel,.051,-.018,-.008);
 const flash=new THREE.Mesh(new THREE.ConeGeometry(.045,.14,7),new THREE.MeshBasicMaterial({color:'#ffcf6c',transparent:true,opacity:.92,toneMapped:false}));flash.rotation.x=-Math.PI/2;flash.position.set(0,.054,-.505);flash.visible=false;root.add(flash);
 root.userData={flash,slide,style:'one-pistol-v218'};return root;
}
