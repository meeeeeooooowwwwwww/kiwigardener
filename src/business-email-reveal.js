/** Server-side Kiwi business-email reveal. Never embed emails into HTML/public feed.
 * Exact current-release R2 private snapshot, server verified Turnstile + rate limit.
 */
const headers={"content-type":"application/json; charset=utf-8","cache-control":"private, no-store, max-age=0","x-content-type-options":"nosniff","x-robots-tag":"noindex, nofollow, noarchive"};
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers});
const RELEASE=/^kg-[a-z0-9._-]{8,94}$/;
const EMAIL=/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
export const privateContactKey=(releaseId)=>
 "verticals/kiwigardeners.com/v1/private-contacts/"+releaseId+".json";
export function emailRevealReady(env){
 return Boolean(env.TURNSTILE_SITE_KEY&&env.TURNSTILE_SECRET&&env.CONTACT_LIMIT?.limit&&
   env.KIWI_PRIVATE_CONTACTS?.get&&env.ASSETS?.fetch&&env.BUSINESS_EMAIL_REVEAL_ENABLED==="true");
}
export async function loadCurrentPrivateContacts(url,env){
 let releaseId,visibleIds;
 try{
   const result=await env.ASSETS.fetch(new Request(
     new URL("/assets/gardener-directory-status.json",url.origin),{
       method:"GET",headers:{"accept":"application/json"}
     }));
   if(!result.ok)return {ok:false,status:503};
   const status=await result.json();
   if(status?.schemaVersion!==1||status.approvedForKiwi!==true||
      !Number.isInteger(status.publishedListings)||status.publishedListings<1||
      status.publishedListings>200||!RELEASE.test(status.releaseId||""))
      return {ok:false,status:503};
   if(status.source!=="grideater.com"||!Array.isArray(status.publishedBusinessIds)||
      status.publishedBusinessIds.length!==status.publishedListings||
      new Set(status.publishedBusinessIds).size!==status.publishedListings||
      status.publishedBusinessIds.some(id=>typeof id!=="string"||!/^afnz-\d{13}$/.test(id)))
      return {ok:false,status:503};
   visibleIds=new Set(status.publishedBusinessIds);
   releaseId=status.releaseId;
 }catch{return {ok:false,status:503};}
 try{
   const obj=await env.KIWI_PRIVATE_CONTACTS.get(privateContactKey(releaseId));
   if(!obj)return {ok:false,status:404};
   if((obj.size||0)>80000)return {ok:false,status:503};
   const data=await obj.json();
   if(data?.schemaVersion!==1||data.releaseId!==releaseId||
      !data.phones||typeof data.phones!=="object"||Array.isArray(data.phones)||
      !data.emails||typeof data.emails!=="object"||Array.isArray(data.emails))
     return {ok:false,status:503};
   // Contact access is limited to businesses currently published by Kiwi.
   // Keep values in the existing private binding and retain Turnstile.
   const filter=map=>Object.fromEntries(Object.entries(map).filter(([id])=>visibleIds.has(id)));
   return {ok:true,data:{...data,phones:filter(data.phones),emails:filter(data.emails)},releaseId};
 }catch{return {ok:false,status:503};}
}
export async function revealBusinessEmail(request,env,{fetchImpl=fetch}={}){
 const url=new URL(request.url);
 const path=url.pathname.match(/^\/api\/gardeners\/(afnz-\d{13})\/email$/);
 if(!path)return json(404,{error:"not_found"});
 if(request.method!=="POST")return json(405,{error:"method_not_allowed"});
 if(!emailRevealReady(env))return json(503,{error:"not_configured"});
 if(!["kiwigardeners.com","www.kiwigardeners.com"].includes(url.hostname)||
    request.headers.get("origin")!==url.origin)return json(403,{error:"invalid_origin"});
 if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
   return json(415,{error:"json_only"});
 if(Number(request.headers.get("content-length")||0)>4096)return json(413,{error:"oversized"});
 let body;
 try{const raw=await request.text();
   if(raw.length>4096)return json(413,{error:"oversized"});
   body=JSON.parse(raw);
 }catch{return json(400,{error:"invalid_json"});}
 if(!body||Object.keys(body).some(x=>x!=="token")||
   typeof body.token!=="string"||body.token.length<10||body.token.length>2048)
   return json(400,{error:"challenge_required"});
 const ip=request.headers.get("CF-Connecting-IP")||"";
 if(!ip)return json(403,{error:"missing_client_ip"});
 try{
   const limit=await env.CONTACT_LIMIT.limit({key:"business-email:"+ip.slice(0,90)});
   if(limit?.success!==true)return json(429,{error:"rate_limited"});
 }catch{return json(503,{error:"rate_limit_unavailable"});}
 try{
   const response=await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({secret:env.TURNSTILE_SECRET,response:body.token,remoteip:ip})
   });
   if(!response.ok)return json(503,{error:"challenge_unavailable"});
   const verdict=await response.json();
   if(verdict?.success!==true||verdict.hostname!==url.hostname||
      verdict.action!=="business_email_reveal")
     return json(403,{error:"challenge_failed"});
 }catch{return json(503,{error:"challenge_unavailable"});}
 const contact=await loadCurrentPrivateContacts(url,env);
 if(!contact.ok)return json(contact.status,{error:"business_email_not_available"});
 const {data:privateData,releaseId}=contact;
 const email=privateData?.emails?.[path[1]];
 if(privateData?.schemaVersion!==1||privateData?.releaseId!==releaseId||
    !privateData.emails||Array.isArray(privateData.emails)||
    typeof email!=="string"||email.length>254||!EMAIL.test(email)||/[\r\n]/.test(email))
   return json(404,{error:"business_email_not_available"});
 return json(200,{email});
}
