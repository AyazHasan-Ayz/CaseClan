export const fontFamilies:Record<string,string>={Editorial:'Georgia, serif',Signature:'cursive',Modern:'Arial, sans-serif'};
export function normalizeName(value:string){return value.trim().replace(/\s+/g,' ').slice(0,18)}
export function designIdentity(design:{name:string;font:string;textColor:string;style:string;upload?:string;instructions?:string;artifactId?:string}|undefined){return design?JSON.stringify([normalizeName(design.name),design.font,design.textColor,design.style,design.upload||'',design.instructions?.trim()||'',design.artifactId||'']):''}
