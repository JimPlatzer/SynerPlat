import {spawn} from 'node:child_process';
import {cp,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const output=path.join(root,'static-dist');
const port=Number(process.env.SYNERPLAT_EXPORT_PORT||4177);
const base=normalizeBase(process.env.SYNERPLAT_BASE_PATH||'/SynerPlat/');

function normalizeBase(value){
 const clean=String(value).trim().replace(/^\/+|\/+$/g,'');
 return clean?`/${clean}/`:'/';
}

function rewriteHtml(html){
 const meta=`<meta name="synerplat-base" content="${base}">`;
 return html
  .replace('<head>','<head>'+meta)
  .replaceAll('/_next/',base+'_next/')
  .replaceAll('href="/favicon.svg"','href="'+base+'favicon.svg"')
  .replaceAll('href="/og.png"','href="'+base+'og.png"')
  .replaceAll('href="/data/#timeline"','href="'+base+'data/#timeline"')
  .replaceAll('href="/data/"','href="'+base+'data/"')
  .replaceAll('href="/data#timeline"','href="'+base+'data/#timeline"')
  .replaceAll('href="/data"','href="'+base+'data/"')
  .replaceAll('href="/"','href="'+base+'"');
}

async function waitUntilReady(url){
 for(let attempt=0;attempt<40;attempt+=1){
  try{const response=await fetch(url);if(response.ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw new Error(`Production preview did not become ready at ${url}`);
}

async function rewriteAssets(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);
  if(entry.isDirectory()){await rewriteAssets(file);continue;}
  if(!/\.(?:css|js)$/.test(entry.name))continue;
  const original=await readFile(file,'utf8');
  const updated=original
   .replaceAll('url(/_next/','url('+base+'_next/')
   .replaceAll('"/_next/','"'+base+'_next/')
   .replaceAll("'/_next/","'"+base+'_next/');
  if(updated!==original)await writeFile(file,updated);
 }
}

const server=spawn('npm',['run','start','--','--port',String(port)],{cwd:root,stdio:['ignore','pipe','pipe']});
let logs='';
server.stdout.on('data',chunk=>{logs+=chunk});
server.stderr.on('data',chunk=>{logs+=chunk});

try{
 const origin=`http://127.0.0.1:${port}`;
 await waitUntilReady(origin+'/');
 const [home,data]=await Promise.all([
  fetch(origin+'/').then(response=>response.text()),
  fetch(origin+'/data').then(response=>response.text())
 ]);
 await rm(output,{recursive:true,force:true});
 await mkdir(path.join(output,'data'),{recursive:true});
 await cp(path.join(root,'dist/client'),output,{recursive:true});
 await writeFile(path.join(output,'index.html'),rewriteHtml(home));
 await writeFile(path.join(output,'data/index.html'),rewriteHtml(data));
 await writeFile(path.join(output,'.nojekyll'),'');
 await rewriteAssets(output);
 console.log(`Static export ready at ${output} with base ${base}`);
}catch(error){
 console.error(logs);
 throw error;
}finally{
 server.kill('SIGTERM');
}
