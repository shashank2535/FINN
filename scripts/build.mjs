import {build} from 'esbuild';
import {mkdir,copyFile,readFile,access} from 'node:fs/promises';
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await build({entryPoints:['src/worker.mjs'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,loader:{'.html':'text','.css':'text','.webp':'binary'},plugins:[{name:'frontend-js-as-text',setup(b){b.onLoad({filter:/public[\\/](app|profile-store|theme)\.js$/},async({path})=>({contents:await readFile(path,'utf8'),loader:'text'}));}}]});
try{await access('.openai/hosting.json');await copyFile('.openai/hosting.json','dist/.openai/hosting.json')}catch(error){if(error.code!=='ENOENT')throw error;console.log('Portable Worker build: no Sites identity was supplied.');}
console.log('Worker bundle built in dist/server/index.js');
