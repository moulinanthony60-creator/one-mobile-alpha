// Run with esbuild installed locally: node tools/build-3d.mjs
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {build}=require(process.env.ONE_ESBUILD_PATH||'esbuild');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await build({absWorkingDir:root,entryPoints:['ui/one-3d-entry.js'],outfile:'ui/one-3d-v234.js',bundle:true,format:'esm',minify:true,target:'es2022',legalComments:'none',plugins:[{name:'canonical-module-paths',setup(b){
 // Version query strings must not create multiple copies of the lobby session.
 b.onResolve({filter:/^\.\.?\//},args=>({path:path.resolve(args.resolveDir,args.path.split('?')[0])}));
}}]});
