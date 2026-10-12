import Link from 'next/link';
import CmsImage from '@/components/CmsImage';
import {getBlogPosts} from '@/lib/cms/server';
import {pageMetadata} from '@/lib/seo/metadata';
export const metadata=pageMetadata({title:'CASECLAN Journal',description:'Stories, case design inspiration and product guides from CASECLAN.',path:'/blog/'});
export default async function Page(){const posts=await getBlogPosts();return <><div className="page-intro"><p className="eyebrow">THE CASECLAN JOURNAL</p><h1>Stories worth carrying.</h1></div><section className="section"><div className="shop-grid">{posts.map(post=><Link href={`/blog/${post.slug}/`} key={post._id}><CmsImage image={post.image} fallback="/images/hero-caseclan-lifestyle.webp" alt={post.title}/><h2>{post.title}</h2><p>{post.excerpt}</p></Link>)}</div>{!posts.length&&<p className="muted">New stories are coming soon.</p>}</section></>}
