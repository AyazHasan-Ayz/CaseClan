import {NextRequest,NextResponse} from 'next/server';
import {parseBody} from 'next-sanity/webhook';
import {revalidateTag,revalidatePath} from 'next/cache';
import {syncCommerceDocument} from '@/lib/cms/sync';
import {isCmsEnabled} from '@/lib/cms/config';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 if(!isCmsEnabled())return NextResponse.json({error:'CMS setup is paused.'},{status:503});
 const secret=process.env.SANITY_REVALIDATE_SECRET;if(!secret)return NextResponse.json({error:'CMS webhook not configured'},{status:503});
 try{const {isValidSignature,body}=await parseBody<{_id:string;_type:string}>(request,secret);if(!isValidSignature)return NextResponse.json({error:'Invalid signature'},{status:401});if(!body?._id||!body._type||body._id.startsWith('drafts.'))return NextResponse.json({error:'Published document required'},{status:400});
 if(['product','phoneModel','siteSettings','customizerSettings'].includes(body._type))await syncCommerceDocument(body._id,body._type);
 revalidateTag('caseclan-cms');revalidateTag('commerce-catalog');revalidatePath('/','layout');return NextResponse.json({ok:true});
 }catch(error){console.error('[CASECLAN CMS] Publish synchronization failed.',error instanceof Error?error.message:'Unknown error');return NextResponse.json({error:'Publish sync failed; webhook should retry.'},{status:500})}
}
