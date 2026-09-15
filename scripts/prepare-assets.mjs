import sharp from 'sharp';
import path from 'node:path';
const root=path.resolve('public/images');
await sharp(path.resolve('source-assets/hero.png')).resize({width:2000}).webp({quality:86}).toFile(path.join(root,'hero.webp'));
await sharp(path.resolve('source-assets/devices.png')).resize({width:1800}).webp({quality:85}).toFile(path.join(root,'devices.webp'));
await sharp(path.resolve('source-assets/clans.png')).webp({quality:88}).toFile(path.join(root,'clans.webp'));
const {width,height}=await sharp(path.resolve('source-assets/clans.png')).metadata();
for(const [i,name] of ['noir','valor','sage','aura'].entries())await sharp(path.resolve('source-assets/clans.png')).extract({left:Math.round(i*width/4),top:0,width:Math.floor(width/4),height}).webp({quality:88}).toFile(path.join(root,name+'.webp'));
console.log('Optimized 7 photography assets.');

