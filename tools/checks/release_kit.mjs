import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
export default async()=>{
 const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'../..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dryline-release-'));
 try{
  const q=spawnSync(process.execPath,[path.join(root,'tools/build_release.mjs'),'2099-01-02','--out='+tmp],{cwd:root,encoding:'utf8'});
  if(q.status!==0)throw new Error('builder failed: '+q.stderr);
  const zip=fs.readFileSync(path.join(tmp,'TheDryLine-2099-01-02.zip')),names=[];let p=0;
  while(p+46<=zip.length&&zip.readUInt32LE(p)===0x02014b50){const n=zip.readUInt16LE(p+28),x=zip.readUInt16LE(p+30),c=zip.readUInt16LE(p+32);names.push(zip.subarray(p+46,p+46+n).toString());p+=46+n+x+c;}
  if(!names.length){const sig=Buffer.from([0x50,0x4b,0x01,0x02]);p=zip.indexOf(sig);while(p>=0&&p+46<=zip.length&&zip.readUInt32LE(p)===0x02014b50){const n=zip.readUInt16LE(p+28),x=zip.readUInt16LE(p+30),c=zip.readUInt16LE(p+32);names.push(zip.subarray(p+46,p+46+n).toString());p+=46+n+x+c;}}
  const need=['index.html','css/','js/','assets/'];for(const n of need)if(n.endsWith('/')?!names.some(x=>x.startsWith(n)):!names.includes(n))throw new Error('zip missing '+n);
  for(const bad of ['tools/','docs/','reference/'])if(names.some(x=>x.startsWith(bad)))throw new Error('zip contains '+bad);
  return 'release zip contains index/css/js/assets and excludes tools/docs/reference';
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
};