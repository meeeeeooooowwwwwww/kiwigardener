/** Only Kiwi publishes GRID-approved public business phone numbers.
 * The R2 contact snapshot remains private; the public response contains phones
 * only, never emails or unrelated hidden contact fields.
 */
import {loadCurrentPrivateContacts} from "./business-email-reveal.js";
const HEADERS={"content-type":"application/json; charset=utf-8",
 "cache-control":"public, max-age=180", "x-content-type-options":"nosniff",
 "x-robots-tag":"noindex, nofollow, noarchive"};
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
export function normaliseKiwiPhone(value){
 if(typeof value!=="string"||value.length>32)return null;
 const display=value.trim();
 const compact=display.replace(/[\s().-]/g,"");
 if(!/^(?:0\d{8,10}|\+64\d{7,10})$/.test(compact))return null;
 return {display,telHref:compact.startsWith("+64")?"tel:"+compact:
   "tel:+64"+compact.slice(1)};
}
export async function publicBusinessPhones(request,env){
 const url=new URL(request.url);
 if(url.pathname!=="/api/gardeners/phones")return json(404,{error:"not_found"});
 if(request.method!=="GET")return json(405,{error:"method_not_allowed"});
 if(!["kiwigardeners.com","www.kiwigardeners.com"].includes(url.hostname))
  return json(403,{error:"invalid_host"});
 if(env.BUSINESS_PHONE_PUBLIC_ENABLED!=="true"||
    !env.KIWI_PRIVATE_CONTACTS?.get||!env.ASSETS?.fetch)
  return json(503,{error:"not_configured"});
 const source=await loadCurrentPrivateContacts(url,env);
 if(!source.ok)return json(source.status,{error:"public_business_phones_unavailable"});
 const phones={};
 for(const [id,raw] of Object.entries(source.data.phones)){
  if(!/^afnz-\d{13}$/.test(id))return json(503,{error:"private_phone_data_invalid"});
  const phone=normaliseKiwiPhone(raw);
  if(!phone)return json(503,{error:"private_phone_data_invalid"});
  phones[id]=phone;
 }
 if(Object.keys(phones).length>200)return json(503,{error:"private_phone_data_invalid"});
 return json(200,{releaseId:source.releaseId,phones});
}
