// Visible animation time, independent of page age and time spent in the background.
export function createAnimationClock(){
 let previous=null,elapsed=0;
 return {tick(now,hidden=false){if(hidden){previous=null;return {dt:0,time:elapsed};}const dt=previous===null?0:Math.max(0,Math.min(.05,(now-previous)/1000));previous=now;elapsed+=dt*1000;return {dt,time:elapsed};}};
}
