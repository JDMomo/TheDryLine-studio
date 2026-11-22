// UNTESTED here. Build the browser release using Node built-ins only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const date = process.argv[2] || new Date().toISOString().slice(0, 10);
const zipPath = path.join(dist, 'TheDryLine-' + date + '.zip');
const roots = ['index.html', 'css', 'js', 'assets'];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const files = [];
function copy(rel) {
  const src = path.join(root, rel), dst = path.join(dist, rel), st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const name of fs.readdirSync(src)) copy(path.join(rel, name));
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    files.push(rel.replaceAll('\\', '/'));
  }
}
for (const rel of roots) copy(rel);

// Minimal ZIP writer: stored entries (method 0), so no external zip command/package is needed.
const table = new Uint32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
const u16 = n => { const b=Buffer.alloc(2); b.writeUInt16LE(n); return b; }, u32 = n => { const b=Buffer.alloc(4); b.writeUInt32LE(n>>>0); return b; };
const local=[], central=[]; let offset=0;
for (const rel of files) {
  const name=Buffer.from(rel), data=fs.readFileSync(path.join(dist,rel)), crc=crc32(data);
  const head=Buffer.concat([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name]);
  local.push(head,data);
  central.push(Buffer.concat([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]));
  offset += head.length + data.length;
}
const body=Buffer.concat(local), cd=Buffer.concat(central);
const end=Buffer.concat([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(cd.length),u32(body.length),u16(0)]);
fs.writeFileSync(zipPath,Buffer.concat([body,cd,end]));
console.log('UNTESTED release:', zipPath, '('+files.length+' files)');
