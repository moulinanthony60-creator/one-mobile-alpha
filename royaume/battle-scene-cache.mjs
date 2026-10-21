// Cache depth-sorted scenery runs; only a run whose appearance changes is rebuilt.
// Runs crossed by units are drawn individually to preserve exact occlusion.
export function createSceneryCache(makeCanvas){
 let groups=[],signature='',stats={builds:0,blits:0,individual:0};
 const revision=items=>items.map(o=>o.revision??'').join('|');
 function release(){for(const g of groups)if(g.image)g.image.width=g.image.height=1;groups=[];}
 function build(items,start,width,height,ratio,paint){
  const g={items,start,min:items[0].depth,max:items.at(-1).depth,revision:revision(items)};
  const x=Math.max(0,Math.floor(Math.min(...items.map(o=>o.bounds.x)))),y=Math.max(0,Math.floor(Math.min(...items.map(o=>o.bounds.y))));
  const right=Math.min(width,Math.ceil(Math.max(...items.map(o=>o.bounds.x+o.bounds.w)))),bottom=Math.min(height,Math.ceil(Math.max(...items.map(o=>o.bounds.y+o.bounds.h))));
  if(right>x&&bottom>y){g.x=x;g.y=y;g.w=right-x;g.h=bottom-y;g.image=makeCanvas(Math.ceil(g.w*ratio),Math.ceil(g.h*ratio));const layer=g.image.getContext('2d');layer.setTransform(ratio,0,0,ratio,-x*ratio,-y*ratio);for(const o of items)paint(o,layer);}
  return g;
 }
 return {
  prepare(key,objects,width,height,ratio,paint){
   if(key!==signature){release();signature=key;stats.builds++;for(let i=0;i<objects.length;i+=10)groups.push(build(objects.slice(i,i+10),i,width,height,ratio,paint));return;}
   let changed=false;
   groups=groups.map(g=>{const items=objects.slice(g.start,g.start+10);if(revision(items)===g.revision)return g;if(g.image)g.image.width=g.image.height=1;changed=true;return build(items,g.start,width,height,ratio,paint);});
   if(changed)stats.builds++;
  },
  draw(ctx,actors,paintStatic,paintActor){
   stats.blits=0;stats.individual=0;let index=0;
   for(const g of groups){
    while(index<actors.length&&actors[index].depth<g.min)paintActor(actors[index++]);
    if(index===actors.length||actors[index].depth>g.max){if(g.image){ctx.drawImage(g.image,g.x,g.y,g.w,g.h);stats.blits++;}continue;}
    for(const item of g.items){while(index<actors.length&&actors[index].depth<item.depth)paintActor(actors[index++]);paintStatic(item,ctx);stats.individual++;}
   }
   while(index<actors.length)paintActor(actors[index++]);
  },
  get stats(){return {...stats,groups:groups.length};},
  invalidate(){signature='';},
  dispose(){release();signature='';}
 };
}
