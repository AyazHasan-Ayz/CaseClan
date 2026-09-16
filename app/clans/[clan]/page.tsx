import {notFound} from 'next/navigation';
import {clans,Clan,clanInfo} from '@/lib/catalog';
import InfoPages from '@/components/InfoPages';
export function generateStaticParams(){return clans.map(c=>({clan:c.toLowerCase()}))}
export async function generateMetadata({params}:{params:Promise<{clan:string}>}){const {clan}=await params;const c=clan.toUpperCase() as Clan;return {title:`${c} — Coming Soon`,description:clanInfo[c]?.line}}
export default async function Page({params}:{params:Promise<{clan:string}>}){const {clan}=await params;const c=clan.toUpperCase() as Clan;if(!clans.includes(c))notFound();return <InfoPages slug="coming-soon"/>}

