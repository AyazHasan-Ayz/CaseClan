'use client';
import {useCms} from './CmsProvider';
import {Plus} from 'lucide-react';
import JsonLd from './seo/JsonLd';
import {faqSchema} from '@/lib/seo/schemas';
export default function CmsFaqs({placement}:{placement:string}){const items=useCms().faqs.filter(f=>f.placements?.includes(placement));if(!items.length)return null;return <section className="faq-categories"><JsonLd data={faqSchema([{title:'FAQs',items:items.map(f=>[f.question,f.answer] as const)}])}/><section><h2>Frequently Asked Questions</h2>{items.map(f=><details key={f._id}><summary>{f.question}<Plus size={17}/></summary><p>{f.answer}</p></details>)}</section></section>}
