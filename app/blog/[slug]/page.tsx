import imageUrlBuilder from '@sanity/image-url';
import {sanityClient} from '@/lib/cms/server';
import {notFound} from 'next/navigation';
import {PortableText} from '@portabletext/react';
import CmsImage from '@/components/CmsImage';
import JsonLd from '@/components/seo/JsonLd';
import {getBlogPost,getBlogPosts} from '@/lib/cms/server';
import {cmsMetadata} from '@/lib/cms/metadata';
import {siteConfig,absoluteUrl} from '@/lib/seo/config';
import {breadcrumbSchema} from '@/lib/seo/schemas';
export async function generateStaticParams(){return (await getBlogPosts()).map(post=>({slug:post.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params,post=await getBlogPost(slug);return cmsMetadata(post?.seo,{title:post?.title||'Article unavailable',description:post?.excerpt||'CASECLAN Journal',path:`/blog/${slug}/`,image:post?.image?.url})}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params,post=await getBlogPost(slug);if(!post)notFound();return <><JsonLd data={[{'@context':'https://schema.org','@type':'Article',headline:post.title,description:post.excerpt,datePublished:post.publishedAt,author:{'@type':'Person',name:post.author},publisher:{'@type':'Organization',name:siteConfig.name},image:post.image?.url||null,mainEntityOfPage:absoluteUrl(`/blog/${slug}/`)},breadcrumbSchema([{name:'Home',path:'/'},{name:'Journal',path:'/blog/'},{name:post.title,path:`/blog/${slug}/`}])]}/><div className="page-intro"><p className="eyebrow">CASECLAN JOURNAL</p><h1>{post.title}</h1><p>{post.author} · {new Date(post.publishedAt).toLocaleDateString('en-IN')}</p></div><article className="prose-page">{post.image&&<CmsImage image={post.image} fallback="" alt={post.title}/>}<PortableText value={post.body||[]} components={{types:{image:({value})=><CmsImage image={{url:imageUrlBuilder(sanityClient()).image(value).width(1400).url(),alt:value.alt}} fallback="" alt={value.alt||post.title}/>},marks:{link:({value,children})=><a href={typeof value?.href==='string'&&(value.href.startsWith('https://')||value.href.startsWith('http://'))?value.href:'#'} rel="noopener noreferrer">{children}</a>}}}/></article></>}
