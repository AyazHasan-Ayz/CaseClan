import 'server-only';
import {createClient} from 'next-sanity';
import {draftMode} from 'next/headers';
import type {CmsContent,CmsProduct,CmsPhone,CmsPost} from './types';
import {contentQuery,productProjection,phoneProjection,postsQuery} from './queries';
import {isCmsEnabled} from './config';
export const cmsConfigured=()=>isCmsEnabled();
export function sanityClient(preview=false){
 if(!cmsConfigured())throw new Error('Sanity project and dataset are not configured.');
 if(preview&&!process.env.SANITY_API_READ_TOKEN)throw new Error('Draft preview requires a server-side read token.');
 return createClient({projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,dataset:process.env.NEXT_PUBLIC_SANITY_DATASET!,apiVersion:'2025-02-19',useCdn:false,perspective:preview?'drafts':'published',token:preview?process.env.SANITY_API_READ_TOKEN:undefined});
}
export async function cmsFetch<T>(query:string,params:Record<string,unknown>,fallback:T):Promise<T>{
 if(!cmsConfigured())return fallback;
 try{const preview=(await draftMode()).isEnabled;return await sanityClient(preview).fetch<T>(query,params,{...(preview?{cache:'no-store' as const}:{next:{revalidate:60,tags:['caseclan-cms']}})});}catch(error){console.error('[CASECLAN CMS] Read failed; preserving fallback.',error instanceof Error?error.name:'UnknownError');return fallback;}
}
export const getProducts=()=>cmsFetch<CmsProduct[]>(`*[_type=="product"&&status=="active"]|order(rank asc)${productProjection}`,{},[]);
export async function getProductBySlug(slug:string){return cmsFetch<CmsProduct|null>(`*[_type=="product"&&slug.current==$slug][0]${productProjection}`,{slug},null)}
export async function getFeaturedProducts(){return (await getProducts()).filter(p=>p.featured)}
export async function getBestSellers(){return (await getProducts()).filter(p=>p.bestSeller)}
export const getPhoneModels=()=>cmsFetch<CmsPhone[]>(`*[_type=="phoneModel"&&active==true]|order(sortOrder asc)${phoneProjection}`,{},[]);
export const getCmsContent=()=>cmsFetch<CmsContent>(contentQuery,{}, {homepage:null,settings:null,customizer:null,faqs:[],reviews:[]});
export async function getHomepageContent(){return (await getCmsContent()).homepage}
export const getBlogPosts=()=>cmsFetch<CmsPost[]>(postsQuery,{},[]);
export async function getBlogPost(slug:string){return (await getBlogPosts()).find(post=>post.slug===slug)||null}
export const getPageSeo=(path:string)=>cmsFetch<import('./types').CmsSeo|null>(`*[_type=="contentPage"&&path==$path][0].${'seo{title,description,canonical,noindex,"image":image{"url":asset->url}}'}`,{path},null);
