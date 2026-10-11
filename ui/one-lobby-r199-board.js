import {GAMES} from './one-arcade-r198-core.js?v=games-v198';

// Drawing and picking share the same rectangles, including on a tilted screen.
const WIDTH=1536,HEIGHT=768;
const cards=[
 {id:'paint',label:'PEINTURE',detail:'Cache-cache en couleurs',x:32,y:132,w:724,h:230},
 {id:'murder',label:'MURDER',detail:'Démasque le meurtrier',x:780,y:132,w:724,h:230},
 {id:'shoot',label:'TIR EN ÉQUIPE',detail:'1v1 · 2v2 · 3v3 · 4v4',x:32,y:382,w:724,h:230},
 {id:'prop',label:'PROP HUNT',detail:'Transforme-toi en objet',x:780,y:382,w:724,h:230},
 {id:'317',label:'3:17 · FOUR',detail:'La maison · 2–4 joueurs',color:'#be96d1',x:32,y:634,w:1472,h:102}
].map(card=>({...GAMES.find(g=>g.id===card.id),...card}));

export function createGameBoard(){
 const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
 const c=canvas.getContext('2d');
 const round=(x,y,w,h,r,fill)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();};
 const line=(points,color,width=8)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();};
 const disc=(x,y,r,color)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();};
 const text=(value,x,y,size,color,weight=700)=>{c.font=weight+' '+size+'px system-ui';c.fillStyle=color;c.fillText(value,x,y);};
 const arrow=(x,y,color)=>{line([[x-8,y-12],[x+5,y],[x-8,y+12]],color,5);};
 c.fillStyle='#10292e';c.fillRect(0,0,WIDTH,HEIGHT);
 text('ONE',34,88,72,'#c7f7df',900);text('ON JOUE À QUOI ?',224,83,48,'#f6fff8',800);
 c.textAlign='right';text('TOUCHE UN JEU',1500,78,27,'#a3c7bf');c.textAlign='left';
 for(const card of cards){
  const {x,y,w,h,color,id}=card;
  round(x,y,w,h,24,'#244047');round(x,y,9,h,4,color);
  if(id==='317'){
   round(x+26,y+20,70,62,15,color);text('3:17',x+31,y+62,25,'#182e35',900);
   text(card.label,x+118,y+65,48,'#fff8ff',850);
   text(card.detail,x+530,y+63,34,'#c6d9dc',550);arrow(x+w-38,y+51,'#e5f8f0');continue;
  }
  round(x+w-193,y+22,168,h-44,22,color);
  c.save();c.translate(x+w-109,y+108);
  const ink='#172d34',light='#f2fff4';
  if(id==='paint'){
   disc(-35,40,24,'#76dcbb');disc(30,42,22,'#ffcf7d');disc(20,-36,25,'#dceaff');
   round(-46,-27,85,45,12,ink);line([[40,-5],[52,-5],[52,30],[0,30],[0,56]],ink,9);round(-12,47,24,39,7,light);
  }else if(id==='murder'){
   c.beginPath();c.moveTo(-56,-28);c.quadraticCurveTo(0,-2,56,-28);c.lineTo(47,32);c.quadraticCurveTo(0,80,-47,32);c.closePath();c.fillStyle=ink;c.fill();
   line([[-33,7],[-14,13]],light,9);line([[14,13],[33,7]],light,9);
   text('?',-17,-44,53,ink,900);
  }else if(id==='shoot'){
   c.strokeStyle=ink;c.lineWidth=9;c.beginPath();c.arc(0,10,43,0,Math.PI*2);c.stroke();disc(0,10,10,ink);
   for(const [a,b]of[[[-63,10],[-31,10]],[[31,10],[63,10]],[[0,-53],[0,-21]],[[0,41],[0,73]]])line([a,b],ink,8);
  }else{
   c.beginPath();c.moveTo(0,-38);c.lineTo(49,-12);c.lineTo(49,42);c.lineTo(0,68);c.lineTo(-49,42);c.lineTo(-49,-12);c.closePath();c.fillStyle=ink;c.fill();
   line([[-45,-10],[0,15],[45,-10]],color,5);line([[0,15],[0,62]],color,5);
   disc(-42,-46,7,light);disc(52,64,6,light);
  }
  c.restore();
  text(card.label,x+30,y+73,id==='shoot'?49:56,'#f5fff8',850);
  text(card.detail,x+30,y+124,32,'#c7dcd9',550);
  text(card.min+'–'+card.max+' JOUEURS',x+30,y+192,27,color,750);arrow(x+w-225,y+185,'#c7f7df');
 }
 return {
  canvas,
  targets:cards.map(({id,x,y,w,h})=>({id,u:(x+w/2)/WIDTH,v:1-(y+h/2)/HEIGHT})),
  gameAt(uv){if(!uv)return null;const x=uv.x*WIDTH,y=(1-uv.y)*HEIGHT;return cards.find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)?.id||null;}
 };
}
