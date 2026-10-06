'use client';

import type {AdminData} from '@/lib/admin';
import {createSupabaseBrowserClient} from './client';

const imageTypes=new Set(['image/jpeg','image/png','image/webp','image/avif']);

export async function saveRemoteAdminData(data:AdminData,previous:AdminData){
 const client=createSupabaseBrowserClient();
 const changed=<T,>(items:T[],before:T[],key:(item:T)=>string)=>items.filter(item=>JSON.stringify(item)!==JSON.stringify(before.find(old=>key(old)===key(item))));
 const changes={products:changed(data.products,previous.products,p=>p.id),devices:changed(data.devices,previous.devices,d=>d.slug),coupons:changed(data.coupons,previous.coupons,c=>c.id),reviews:changed(data.reviews,previous.reviews,r=>r.id),...(JSON.stringify(data.settings)!==JSON.stringify(previous.settings)?{settings:data.settings}:{}),...(JSON.stringify(data.media)!==JSON.stringify(previous.media)?{media:data.media}:{})};
 const result=await client.functions.invoke('admin-catalog',{body:{data:changes}});
 if(result.error)throw result.error;
 if(result.data?.error)throw new Error(result.data.error);
 return result.data as {ok:true;products:number;devices:number};
}

export async function uploadAdminCatalogImage(file:File,scope:string){
 const client=createSupabaseBrowserClient();
 if(!imageTypes.has(file.type))throw new Error('Use a JPEG, PNG, WebP, or AVIF image.');
 if(file.size>10*1024*1024)throw new Error('Product images must be 10 MB or smaller.');
 const extension=file.name.split('.').pop()?.toLowerCase()||file.type.split('/')[1]||'jpg';
 const safeScope=scope.toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'')||'draft';
 const path=`catalog/${safeScope}/${crypto.randomUUID()}.${extension}`;
 const upload=await client.storage.from('product-images').upload(path,file,{contentType:file.type,cacheControl:'31536000',upsert:false});
 if(upload.error)throw upload.error;
 return client.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}
