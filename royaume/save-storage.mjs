// Older open tabs sanitize unknown buildings before writing their v1 save.
// A separate namespace prevents those tabs from rewriting the current village.
export const SAVE_KEY='one_royaumes_aurore_v2';
export const LEGACY_SAVE_KEY='one_royaumes_aurore_v1';
export function readGameSave(storage){
 const current=storage.getItem(SAVE_KEY);
 if(current!==null)return current;
 const previous=storage.getItem(LEGACY_SAVE_KEY);
 if(previous===null)return null;
 // Copy backups before the main marker so an interrupted migration can retry.
 for(const suffix of ['_previous','_before_online']){
  const backup=storage.getItem(LEGACY_SAVE_KEY+suffix);
  if(backup!==null&&storage.getItem(SAVE_KEY+suffix)===null)storage.setItem(SAVE_KEY+suffix,backup);
 }
 storage.setItem(SAVE_KEY,previous);
 return previous;
}
