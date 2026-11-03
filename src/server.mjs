import http from 'node:http';
import {readFile,readdir} from 'node:fs/promises';
import {handle} from './app.mjs';
const port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';
const files={'/theme.js':'text/javascript; charset=utf-8','/index.html':'text/html; charset=utf-8','/app.js':'text/javascript; charset=utf-8','/profile-store.js':'text/javascript; charset=utf-8','/styles.css':'text/css; charset=utf-8'};
for(const file of await readdir(new URL('../public/logos/',import.meta.url)))if(file.endsWith('.webp'))files['/logos/'+file]='image/webp';
const server=http.createServer(async(req,res)=>{
  try{
    const body=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>4096){res.writeHead(413).end();return;}body.push(chunk);}
    const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(', '):v);
    const request=new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(body)});
    const assets={},requested=new URL(request.url).pathname,path=requested==='/'?'/index.html':requested;if(files[path])assets[path]={body:await readFile(new URL('../public'+path,import.meta.url)),type:files[path]};
    const response=await handle(request,process.env,assets);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500).end('Server error');}
});
server.listen(port,host,()=>console.log(`FINN ready: http://${host}:${port}`));
