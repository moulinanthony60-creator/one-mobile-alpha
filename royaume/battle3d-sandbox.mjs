import {startAssault, assaultCommand, stepAssault, attackScore, armyCount, FIELD} from './expeditions.mjs?v=43';
import {createTrainingFort} from './battle3d-layout.mjs?v=2';

export const TROOPS = Object.freeze([
  {kind:'guardians', name:'Gardiens', role:'Au premier rang', count:8},
  {kind:'archers', name:'Archers', role:'À distance', count:6},
  {kind:'mages', name:'Mages', role:'Dégâts de zone', count:3}
]);
export const STEP = 1 / 30;

// A fresh, private state: never import the village engine, cloud or saved game.
// Settlement uses the existing campaign rules, but its rewards stay in memory.
export function createTraining({layout=createTrainingFort,field=null}={}) {
  let state, started, paused, accumulator, effectSerial, previous;
  function reset() {
    state = {buildings:{castle:2}, energy:100, troops:8, army:{archers:6,mages:3},
      conquests:{0:3,1:3}, stats:{raid:0}, journal:[], gold:0, wood:0, xp:0, gems:0};
    startAssault(state, 2);
    state.assault.buildings=layout();
    if(field)state.assault.field={...field};
    started = false; paused = false; accumulator = 0; effectSerial = 0; previous=new Map();
    return state.assault;
  }
  function tagEffects() {
    for (const effect of state.assault.effects) effect.visualId ??= ++effectSerial;
  }
  function command(type, x, y, unit) {
    if (paused) throw new Error('Reprenez la bataille pour jouer.');
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y))
      throw new Error('Choisissez un point du terrain.');
    if (type === 'assault-deploy' && !TROOPS.some(t => t.kind === unit))
      throw new Error('Choisissez un gardien, un archer ou un mage.');
    assaultCommand(state, {type,x,y,unit});
    started = true;
    tagEffects();
  }
  reset();
  return {
    get battle() { return state.assault; },
    get started() { return started; },
    get paused() { return paused; },
    get presentation() { return {previous,alpha:paused?1:Math.max(0,Math.min(1,accumulator/STEP))}; },
    get remaining() { return Math.max(0, Math.ceil(FIELD.seconds-state.assault.elapsed)); },
    get score() { return attackScore(state.assault); },
    count: kind => armyCount(state,kind),
    deploy: (kind,x,y) => command('assault-deploy',x,y,kind),
    spell: (x,y) => command('assault-spell',x,y),
    pause(value) { paused = Boolean(value); accumulator = 0; previous=new Map(state.assault.units.map(u=>[u.id,{x:u.x,y:u.y}])); },
    tick(seconds) {
      if (!started || paused || !Number.isFinite(seconds) || seconds <= 0 || state.assault.phase !== 'active') return;
      // Bound catch-up work. Hidden tabs pause; slow frames cannot skip attacks.
      accumulator += Math.min(seconds,.1);
      while (accumulator + 1e-9 >= STEP && state.assault.phase === 'active') {
        previous=new Map(state.assault.units.map(u=>[u.id,{x:u.x,y:u.y}]));
        stepAssault(state,STEP);
        tagEffects();
        accumulator -= STEP;
      }
    },
    reset
  };
}
