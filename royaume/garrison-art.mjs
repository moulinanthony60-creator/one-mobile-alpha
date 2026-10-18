// Front and back sprites keep the feet anchored during a subtle idle breath.
export function paintGarrison(ctx,sprites,p,x,y,size){
 const back=p.dx+p.dz<-.2,side=p.dx-p.dz;
 const sprite=sprites['garrison-'+p.kind+(back?'-back':'')];
 if(!sprite)return false;
 const breath=Math.sin((p.activityTime||0)*1.7)*.006;
 const h=size*(p.kind==='rider'?1.32:1.16),w=h/sprite.aspect,flip=back?side>0:side<0;
 ctx.save();ctx.translate(x,y);ctx.scale(flip?-1:1,1+breath);
 ctx.drawImage(sprite.image,-w*.5,-h,w,h);ctx.restore();return true;
}
