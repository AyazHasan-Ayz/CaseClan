import Link from 'next/link';
import {ArrowRight} from 'lucide-react';

const pages={
  'personalized-phone-covers':{eyebrow:'PERSONALIZED PHONE COVERS',title:'A case that feels personal.',description:'Explore curated CASECLAN artwork or start with a blank case and add the text, photographs and graphics that matter to you.',cta:'EXPLORE READY DESIGNS',href:'/ready-designs/'},
  'custom-phone-cases':{eyebrow:'CUSTOM PHONE CASES',title:'Create a case of your own.',description:'Choose the exact phone model, begin with a blank model-specific case and build a print-ready design in the live CASECLAN editor.',cta:'CHOOSE YOUR MODEL',href:'/#model-chooser-title'},
  'design-your-own-phone-case':{eyebrow:'DESIGN YOUR OWN',title:'Your blank case. Your ideas.',description:'Add text and original images to a realistic phone-case preview. Move, resize and refine the composition before adding it to your cart.',cta:'START WITH YOUR PHONE',href:'/#model-chooser-title'},
  'custom-photo-cases':{eyebrow:'CUSTOM PHOTO CASES',title:'Carry a photograph you love.',description:'Select your phone, upload the original photograph and use the editor to position a full-bleed crop inside the model-specific print area.',cta:'CHOOSE YOUR MODEL',href:'/#model-chooser-title'},
} as const;

export type SeoLandingSlug=keyof typeof pages;
export function isSeoLanding(slug:string):slug is SeoLandingSlug{return slug in pages}
export default function SeoLanding({slug}:{slug:SeoLandingSlug}){const page=pages[slug];return <><div className="page-intro"><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p>{page.description}</p></div><section className="prose-page"><h2>Built around the phone you actually use.</h2><p>CASECLAN keeps ready-made artwork and custom creation separate. Choose a finished design exactly as shown, or enter the blank editor to create something original for a supported phone model.</p><Link className="button" href={page.href}>{page.cta} <ArrowRight size={15}/></Link></section></>}
