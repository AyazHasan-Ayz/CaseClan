export type ClanName='NOIR'|'VALOR'|'SAGE'|'AURA';
export type Membership={primaryClan:ClanName|null;collected:ClanName[];number:string|null;since:number|null;processedOrders:string[]};
export const emptyMembership:Membership={primaryClan:null,collected:[],number:null,since:null,processedOrders:[]};
export function awardMembership(current:Membership,event:{orderId:string;status:'paid'|'pending'|'failed';clans:ClanName[];memberNumber:string;year:number}):Membership{
 if(event.status!=='paid'||!event.clans.length||current.processedOrders.includes(event.orderId))return current;
 const valid=['NOIR','VALOR','SAGE','AURA'];
 if(event.clans.some(c=>!valid.includes(c)))throw new Error('Unknown clan');
 return {primaryClan:current.primaryClan??event.clans[0],collected:[...new Set([...current.collected,...event.clans])],number:current.number??event.memberNumber,since:current.since??event.year,processedOrders:[...current.processedOrders,event.orderId]};
}
export const isElite=(m:Membership)=>['NOIR','VALOR','SAGE','AURA'].every(c=>m.collected.includes(c as ClanName));
