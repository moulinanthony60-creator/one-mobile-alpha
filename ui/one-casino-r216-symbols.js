// Original canvas artwork for the eight existing server symbol IDs.
// Drawing only: the order, payout table and random outcomes stay unchanged.
export const casinoSymbolNames=['Cerises','Citron','Trèfle','Cloche','Diamant','Sept','ONE WILD','Cadeau BONUS'];
export function drawCasinoSymbol(g,W,H,index){
 g.save();g.scale(W/320,H/416);
 const gradient=(a,b,x0=90,y0=75,x1=230,y1=290)=>{const p=g.createLinearGradient(x0,y0,x1,y1);p.addColorStop(0,a);p.addColorStop(1,b);return p;};
 const path=(draw,fill,stroke='#282746',width=8)=>{g.beginPath();draw();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.lineJoin='round';g.lineCap='round';g.stroke();}};
 const ellipse=(x,y,rx,ry,fill,stroke='#282746',width=8)=>path(()=>g.ellipse(x,y,rx,ry,0,0,Math.PI*2),fill,stroke,width);
 const line=(points,color,width)=>{g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=width;g.lineJoin='round';g.lineCap='round';g.stroke();};
 const text=(word,x,y,size,fill,outline)=>{g.textAlign='center';g.textBaseline='middle';g.font='900 '+size+'px system-ui';if(outline){g.lineWidth=9;g.strokeStyle=outline;g.strokeText(word,x,y);}g.fillStyle=fill;g.fillText(word,x,y);};
 g.fillStyle=gradient('#fffdf1','#e5d6b6',0,0,320,416);g.fillRect(0,0,320,416);
 g.fillStyle='#fff9ed';g.fillRect(13,13,294,390);g.strokeStyle='#b39860';g.lineWidth=7;g.strokeRect(6,6,308,404);
 ellipse(162,330,98,15,'#2c274218',null);
 if(index===0){
  line([[107,198],[137,120],[192,73],[213,210]],'#3c653c',13);
  path(()=>{g.moveTo(161,109);g.bezierCurveTo(125,67,91,69,77,87);g.bezierCurveTo(100,118,129,122,161,109);},gradient('#96dc62','#2f914f'),'#245745',7);
  ellipse(111,249,66,65,gradient('#ff6780','#ba163f'));
  ellipse(217,256,62,67,gradient('#ff5b74','#ae143d'));
  ellipse(92,224,16,10,'#ffd8d6',null);ellipse(199,230,15,9,'#ffd8d6',null);
 }else if(index===1){
  path(()=>{g.moveTo(76,133);g.bezierCurveTo(64,115,53,121,54,141);g.bezierCurveTo(12,179,43,283,128,302);g.bezierCurveTo(175,334,235,303,257,268);g.bezierCurveTo(281,262,286,242,265,233);g.bezierCurveTo(277,156,169,95,110,125);g.bezierCurveTo(89,118,81,126,76,133);},gradient('#fff16a','#efa91c'),'#88661b');
  path(()=>{g.moveTo(219,151);g.bezierCurveTo(201,108,220,77,252,81);g.bezierCurveTo(267,109,248,135,219,151);},gradient('#a4e569','#319353'),'#345b34',7);
  g.beginPath();g.ellipse(119,190,48,25,.55,Math.PI,Math.PI*2);g.strokeStyle='#fff9b8';g.lineWidth=12;g.stroke();
 }else if(index===2){
  path(()=>{g.moveTo(154,275);g.bezierCurveTo(166,306,171,327,146,341);g.lineTo(191,341);g.bezierCurveTo(185,307,174,285,176,272);},gradient('#45aa65','#1d6a43'),'#244b39',7);
  const leaf=gradient('#7be692','#21995e');
  path(()=>{g.moveTo(160,231);g.bezierCurveTo(138,214,87,163,108,124);g.bezierCurveTo(132,86,165,100,165,124);g.bezierCurveTo(191,91,229,111,222,145);g.bezierCurveTo(217,179,183,211,160,231);},leaf,'#235643');
  path(()=>{g.moveTo(160,231);g.bezierCurveTo(110,201,64,173,42,205);g.bezierCurveTo(20,235,48,265,76,260);g.bezierCurveTo(45,294,78,326,108,306);g.bezierCurveTo(139,286,149,249,160,231);},leaf,'#235643');
  path(()=>{g.moveTo(160,231);g.bezierCurveTo(211,193,251,175,277,204);g.bezierCurveTo(303,239,269,268,244,258);g.bezierCurveTo(267,297,232,319,206,305);g.bezierCurveTo(177,290,165,254,160,231);},leaf,'#235643');
  ellipse(160,234,15,15,'#b0ef9c',null);
 }else if(index===3){
  ellipse(160,278,30,34,gradient('#ffc355','#bd651d'),'#684224');
  ellipse(160,112,19,20,gradient('#fff292','#d38a25'),'#684224',7);
  path(()=>{g.moveTo(61,272);g.bezierCurveTo(113,237,65,158,125,134);g.bezierCurveTo(148,122,175,122,197,134);g.bezierCurveTo(253,159,213,237,265,272);g.closePath();},gradient('#fff49c','#e2a120'),'#76531f',8);
  path(()=>{g.moveTo(60,271);g.quadraticCurveTo(163,292,265,271);g.lineTo(270,294);g.quadraticCurveTo(165,317,55,294);g.closePath();},gradient('#ffe997','#dd9220'),'#76531f',7);
  g.beginPath();g.moveTo(128,151);g.quadraticCurveTo(107,171,110,226);g.strokeStyle='#fff9c0';g.lineWidth=13;g.lineCap='round';g.stroke();
 }else if(index===4){
  path(()=>{g.moveTo(75,112);g.lineTo(245,112);g.lineTo(286,185);g.lineTo(160,316);g.lineTo(34,185);g.closePath();},gradient('#96f3ff','#218acd'),'#224b77');
  path(()=>{g.moveTo(75,112);g.lineTo(116,183);g.lineTo(34,185);g.closePath();},'#d6fbff',null);
  path(()=>{g.moveTo(116,183);g.lineTo(160,112);g.lineTo(204,183);g.closePath();},'#dcfbff',null);
  path(()=>{g.moveTo(204,183);g.lineTo(245,112);g.lineTo(286,185);g.closePath();},'#5fcde9',null);
  path(()=>{g.moveTo(116,183);g.lineTo(160,316);g.lineTo(204,183);g.closePath();},'#7cdeec',null);
  line([[75,112],[116,183],[160,316],[204,183],[245,112]],'#29668d',5);line([[34,185],[286,185]],'#29668d',5);
  line([[249,71],[249,98]],'#54b6d6',6);line([[236,84],[262,84]],'#54b6d6',6);
 }else if(index===5){
  g.save();g.translate(158,215);g.rotate(-.08);g.textAlign='center';g.textBaseline='middle';g.font='900 italic 260px Georgia';g.lineJoin='round';
  g.strokeStyle='#932937';g.lineWidth=24;g.strokeText('7',6,12);g.strokeStyle='#ffdc75';g.lineWidth=13;g.strokeText('7',0,0);g.fillStyle=gradient('#ff807e','#ce183e',0,-110,0,100);g.fillText('7',0,0);g.restore();
 }else if(index===6){
  ellipse(160,216,118,118,gradient('#ffe99a','#bf782c'),'#60411f',8);
  ellipse(160,216,101,101,gradient('#9152c9','#432068'),'#fff0b5',5);
  path(()=>{for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?24:51,x=160+Math.cos(a)*r,y=168+Math.sin(a)*r;k?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();},gradient('#fff8bf','#e7a330'),'#6f4718',4);
  text('ONE',160,241,68,'#fff4bc','#47246c');text('WILD',160,296,27,'#f9dd8e');
 }else{
  path(()=>{g.moveTo(153,158);g.bezierCurveTo(61,165,53,83,111,98);g.bezierCurveTo(139,106,155,135,160,157);g.bezierCurveTo(169,84,234,79,239,112);g.bezierCurveTo(245,153,192,164,161,159);},gradient('#fff38f','#efb125'),'#815427',7);
  path(()=>{g.rect(67,177,186,127);},gradient('#db87ed','#9636b4'),'#4d2868',8);
  path(()=>{g.rect(56,157,208,48);},gradient('#f0a5f5','#be55ce'),'#4d2868',8);
  path(()=>{g.rect(144,157,35,147);},gradient('#ffe79c','#e6a939'),'#7f5727',5);
  text('BONUS',160,352,36,'#823cac');
 }
 g.restore();
}

