export function parseCoupon(input: Record<string, unknown>) {
 const code=String(input.code||'').trim().toUpperCase(),kind=input.kind;
 const optional=(key:string)=>input[key]===undefined||input[key]===null||input[key]===''?undefined:Number(input[key]);
 const value=Number(input.value),minimum=Number(input.minimum||0),maximum=optional('maximum'),usageLimit=optional('usageLimit'),perUserLimit=optional('perUserLimit');
 const startsAt=String(input.startsAt||''),endsAt=String(input.endsAt||'');
 if(!/^[A-Z0-9][A-Z0-9_-]{1,63}$/.test(code))throw Error('Use a coupon code of 2–64 letters, numbers, hyphens or underscores.');
 if(kind!=='percentage'&&kind!=='fixed')throw Error('Choose a valid discount type.');
 if(!Number.isFinite(value)||value<=0||(kind==='percentage'&&value>100))throw Error('Enter a positive discount; percentages cannot exceed 100.');
 if(!Number.isFinite(minimum)||minimum<0||maximum!==undefined&&(!Number.isFinite(maximum)||maximum<0))throw Error('Minimum order and maximum discount must be zero or greater.');
 for(const limit of [usageLimit,perUserLimit])if(limit!==undefined&&(!Number.isInteger(limit)||limit<=0))throw Error('Usage limits must be positive whole numbers or left blank.');
 if([startsAt,endsAt].some(date=>date&&!Number.isFinite(Date.parse(date))))throw Error('Enter a valid coupon date.');
 if(startsAt&&endsAt&&Date.parse(endsAt)<=Date.parse(startsAt))throw Error('Expiry must be after the start date.');
 return{code,kind:kind as "percentage"|"fixed",value,minimum,maximum,usageLimit,perUserLimit,startsAt,endsAt,active:input.active!==false};
}
