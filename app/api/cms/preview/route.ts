import {draftMode} from 'next/headers';
import {NextResponse} from 'next/server';
import {createSupabaseAdminClient} from '@/lib/supabase/server';
import {isAdminRole} from '@/lib/auth';
import {isCmsEnabled} from '@/lib/cms/config';
import {isAllowedRequestOrigin} from '@/lib/request-origins';
export async function POST(request:Request){
 if(!isCmsEnabled())return NextResponse.json({error:'CMS setup is paused.'},{status:503});
 if(!isAllowedRequestOrigin(request,process.env.CASECLAN_ALLOWED_ORIGINS,true))return NextResponse.json({error:'Invalid origin'},{status:403});
 if(!process.env.SANITY_API_READ_TOKEN)return NextResponse.json({error:'Draft preview read token is not configured.'},{status:503});
 const bearer=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!bearer)return NextResponse.json({error:'Sign in as an owner/admin first.'},{status:401});
 try{const db=createSupabaseAdminClient(),user=await db.auth.getUser(bearer);if(user.error||!user.data.user)return NextResponse.json({error:'Authentication required'},{status:401});const profile=await db.from('customers').select('role').eq('id',user.data.user.id).single();if(profile.error||!isAdminRole(profile.data.role))return NextResponse.json({error:'Admin access required'},{status:403});const body=await request.json();const mode=await draftMode();if(body.enabled===false)mode.disable();else mode.enable();return NextResponse.json({ok:true});}catch{return NextResponse.json({error:'Preview unavailable'},{status:503})}
}
