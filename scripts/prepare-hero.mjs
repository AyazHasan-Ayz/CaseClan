import sharp from 'sharp';
await sharp('public/hero-caseclan-lifestyle.png')
  .resize({width:2172,withoutEnlargement:true})
  .webp({quality:90})
  .toFile('public/images/hero-caseclan-lifestyle.webp');
