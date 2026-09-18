import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
const root='C:/Users/blueh/Downloads/ChatGPT Image Sep 18, 2026, ';
const files={
 'phones/pro-white':'11_43_44 AM (1)', 'phones/dual-white':'11_43_44 AM (2)',
 'phones/pro-titanium':'11_43_45 AM (3)', 'phones/pro-wide':'11_43_45 AM (4)',
 'phones/samsung-ultra':'11_43_46 AM (5)', 'designs/minimal-name':'11_43_48 AM (6)',
 'designs/signature-style':'11_43_49 AM (7)', 'designs/initial-name':'11_43_52 AM (8)',
 'designs/word-cloud':'11_43_52 AM (9)', 'designs/photo-collage':'11_43_53 AM (10)'
};
for(const dir of ['phones','designs','cases','hero','logo'])await mkdir(`public/assets/${dir}`,{recursive:true});
await mkdir('public/models',{recursive:true});
for(const [name,file] of Object.entries(files))await sharp(root+file+'.png').resize({width:960,withoutEnlargement:true}).webp({quality:87}).toFile(`public/assets/${name}.webp`);
console.log('Prepared 10 supplied images without changing their artwork.');
