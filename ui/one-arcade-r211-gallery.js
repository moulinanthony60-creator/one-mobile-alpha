import * as THREE from './three.module.js';
export const PICTURE_THEMES=['Dunes au soleil','Forêt brumeuse','Voiliers','Ville de nuit','Montagnes','Jardin botanique','Planètes','Nature morte','Vagues','Oiseaux','Arches','Fleurs','Mosaïque','Cascade','Constellations','Terrasses'];
export function makePictureMap(design){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=512;const c=canvas.getContext('2d');c.scale(1.5,1.5);
 const palettes=[['#d8bd91','#d77d54','#754c53','#ecdcb9'],['#a5c2ad','#517f70','#294d49','#d8c5ac'],['#aec8d2','#526e9a','#e6c5a2','#527877'],['#272f4d','#596985','#cf9363','#ddd19b']];const [bg,a,b,d]=palettes[design%4];
 const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);},poly=(points,col)=>{c.fillStyle=col;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();},circle=(x,y,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();},line=(points,col,width=3)=>{c.strokeStyle=col;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();},ellipse=(x,y,rx,ry,rotation,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);c.fill();};
 rect(0,0,512,342,bg);
 switch(design%16){
 case 0:circle(363,83,49,d);for(let layer=0;layer<4;layer++){const points=[[0,342],[0,165+layer*37]];for(let x=0;x<=512;x+=16)points.push([x,165+layer*37+Math.sin(x/115+layer*1.4)*28]);points.push([512,342]);poly(points,[a,b,'#b17e65','#715956'][layer]);}for(let i=0;i<6;i++)line([[60+i*6,305],[62+i*6,289-i%2*7]],d,2);break;
 case 1:rect(0,245,512,97,b);for(let row=0;row<3;row++)for(let i=0;i<10;i++){const x=i*61-15+row*17,y=155+row*48,h=85+((i*37)%70);rect(x-3,y-30,6,180,row===2?b:a);poly([[x-25,y],[x,y-h],[x+25,y]],row===2?b:a);}circle(390,80,36,d);break;
 case 2:rect(0,183,512,159,a);for(let i=0;i<12;i++)line([[i*51%440,213+i*9],[i*51%440+64,211+i*9]],d,2);for(const [x,y,s]of [[130,235,1],[335,210,.65]]){poly([[x-43*s,y],[x+48*s,y],[x+28*s,y+16*s],[x-27*s,y+16*s]],b);line([[x,y],[x,y-117*s]],b,3);poly([[x-5,y-112*s],[x-5,y-10],[x-62*s,y-10]],d);poly([[x+5,y-104*s],[x+5,y-10],[x+51*s,y-10]],'#d28d67');}break;
 case 3:circle(396,72,28,d);for(let i=0;i<13;i++){const x=i*43,h=70+i*47%123;rect(x,342-h,38,h,i%2?a:b);for(let yy=350-h;yy<325;yy+=22)for(let xx=x+7;xx<x+31;xx+=13)if((xx+yy)%5)rect(xx,yy,5,9,d);}break;
 case 4:circle(106,83,36,d);poly([[0,290],[140,70],[280,310]],a);poly([[158,342],[328,91],[512,301],[512,342]],b);poly([[113,112],[140,70],[173,119],[147,107],[132,123]],d);poly([[298,134],[328,91],[364,145],[339,124]],d);for(let i=0;i<4;i++)poly([[0,286+i*15],[512,248+i*24],[512,342],[0,342]],i%2?b:a);break;
 case 5:for(let i=0;i<7;i++){const x=40+i*70;line([[x,342],[x+15,165-i%3*38],[x-5,49]],b,3);for(let j=0;j<5;j++){const y=90+j*45;ellipse(x+(j%2?-11:23),y,33,11,j%2?.5:-.7,j%2?a:b);}}break;
 case 6:for(let i=0;i<65;i++)circle(i*83%512,i*137%342,1+i%2,d);circle(182,180,86,a);ellipse(182,180,141,22,-.4,b);circle(182,180,70,a);circle(386,84,36,d);circle(374,77,28,bg);circle(386,266,20,b);break;
 case 7:rect(0,263,512,79,b);ellipse(278,281,157,21,a);poly([[151,260],[136,154],[205,154],[190,260]],d);for(let i=0;i<5;i++){line([[170,155],[123+i*23,67+i%2*22]],b,3);ellipse(123+i*23,67+i%2*22,18,10,i*.7,a);}circle(286,246,32,'#c67d60');circle(342,257,25,d);ellipse(397,265,35,12,-.3,'#9aa86f');break;
 case 8:for(let row=0;row<9;row++){const p=[[0,342],[0,80+row*30]];for(let x=0;x<=512;x+=8)p.push([x,80+row*30+Math.sin(x/50+row)*19]);p.push([512,342]);poly(p,row%3===0?d:row%2?a:b);}break;
 case 9:circle(379,111,71,d);for(let i=0;i<11;i++){const x=50+i*39,y=95+(i*47)%155;poly([[x-22,y-8],[x-4,y-1],[x,y+6],[x+6,y-4],[x+28,y-13],[x+8,y+4],[x,y+10],[x-8,y+4]],i%2?a:b);}poly([[0,298],[512,283],[512,342],[0,342]],a);break;
 case 10:for(let i=0;i<4;i++){const x=39+i*119;rect(x,120,93,222,i%2?a:b);c.fillStyle=i%2?a:b;c.beginPath();c.arc(x+46.5,120,46.5,Math.PI,0);c.fill();rect(x+17,124,59,218,bg);c.beginPath();c.arc(x+46.5,124,29.5,Math.PI,0);c.fill();}break;
 case 11:for(let i=0;i<12;i++){const x=40+i*43,y=80+(i*73)%190;line([[x,342],[x,y]],b,3);for(let petal=0;petal<7;petal++)ellipse(x+Math.cos(petal)*17,y+Math.sin(petal)*17,15,8,petal,i%2?a:d);circle(x,y,8,b);}break;
 case 12:for(let y=0;y<6;y++)for(let x=0;x<9;x++){const xx=x*60-15,yy=y*60-12,col=[a,b,d][(x+y)%3];rect(xx+2,yy+2,55,55,col);circle(xx+29,yy+29,17,[a,b,d][(x*2+y+1)%3]);}break;
 case 13:poly([[0,0],[195,0],[226,134],[180,240],[0,280]],b);poly([[360,0],[512,0],[512,300],[335,236],[302,86]],a);rect(235,45,50,235,d);for(let i=0;i<7;i++)line([[240+i*6,58],[241+i*5,272]],bg,2);for(let i=0;i<6;i++)ellipse(262,286+i*8,35+i*26,7,bg);break;
 case 14:for(let i=0;i<70;i++)circle(i*97%512,i*61%342,1.1,d);const pts=[[85,86],[180,65],[246,139],[348,103],[416,214],[300,259],[186,222],[85,86]];line(pts,a,2);for(const [x,y]of pts){circle(x,y,5,d);line([[x-9,y],[x+9,y]],d,1);line([[x,y-9],[x,y+9]],d,1);}break;
 case 15:for(let row=0;row<3;row++)for(let i=0;i<5;i++){const x=i*119-row*29,y=134+row*74;rect(x,y,99,110,[a,b,d][(row+i)%3]);poly([[x-6,y],[x+50,y-55],[x+105,y]],b);rect(x+17,y+18,18,31,bg);rect(x+58,y+18,18,31,bg);}circle(421,49,24,d);break;
 }
 // Small artist's mark, kept in the corner so large colour areas remain usable.
 line([[459,311],[468,295],[474,311],[483,296]],d,2);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;map.userData.theme=PICTURE_THEMES[design%16];return map;
}
