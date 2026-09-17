import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('out');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(dir,x.name)):[path.join(dir,x.name)])}
const html=walk(root).filter(p=>p.endsWith('.html'));let checked=0;const missing=[];
for(const file of html){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(/(?:href|src)="([^"#]+)"/g)){const value=m[1].replaceAll('&amp;','&').split(/[?#]/)[0];if(!value.startsWith('/'))continue;checked++;const local=path.join(root,decodeURIComponent(value));if(!fs.existsSync(local)&&!fs.existsSync(path.join(local,'index.html')))missing.push({file:path.relative(root,file),target:value})}}
console.log(JSON.stringify({htmlPages:html.length,checked,missing},null,2));if(missing.length)process.exit(1);
