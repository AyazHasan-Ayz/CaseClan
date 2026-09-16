import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
const files=[['iphone-17','09_14_27 PM (1)'],['iphone-16','09_14_29 PM (2)'],['iphone-17-pro-max','09_14_30 PM (3)'],['iphone-17-pro','09_14_30 PM (4)'],['iphone-16-pro-max','09_14_31 PM (5)'],['iphone-16-pro','09_14_32 PM (6)'],['iphone-15','09_14_33 PM (7)'],['iphone-15-pro-max','09_14_34 PM (8)'],['iphone-15-pro','09_14_35 PM (9)'],['iphone-15-plus','09_14_37 PM (10)']];
await mkdir('public/images/personalized',{recursive:true});
for(const [slug,file] of files) await sharp(`C:/Users/blueh/Downloads/ChatGPT Image Sep 16, 2026, ${file}.png`).resize({width:1000,withoutEnlargement:true}).webp({quality:88}).toFile(`public/images/personalized/${slug}.webp`);
