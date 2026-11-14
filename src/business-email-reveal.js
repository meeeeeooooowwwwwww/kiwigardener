/** Server-side Kiwi business-email reveal. Never embed emails into HTML/public feed.
 * Exact current-release R2 private snapshot, server verified Turnstile + rate limit.
 */
import {CONTACT_RELEASE_ID,CONTACT_SOURCE_SHA,CONTACT_SNAPSHOT_SHA,CONTACT_SNAPSHOT_BYTES,
 CONTACT_VISIBLE_IDS_SHA,CONTACT_VISIBLE_COUNT,CONTACT_PHONE_COUNT,CONTACT_EMAIL_COUNT} from "./gardener-contact-snapshot.js";
const headers={"content-type":"application/json; charset=utf-8","cache-control":"private, no-store, max-age=0","x-content-type-options":"nosniff","x-robots-tag":"noindex, nofollow, noarchive"};
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers});
const RELEASE=/^kg-[a-z0-9._-]{8,94}$/;
const EMAIL=/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
export const privateContactKey=(releaseId,digest=null)=>
 "verticals/kiwigardeners.com/v1/private-contacts/"+releaseId+(digest?"/"+digest:"")+".json";
export async function sha256Hex(bytes){
 return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),n=>n.toString(16).padStart(2,"0")).join("");
}
export async function readVerifiedSnapshot(obj,{digest,bytes,releaseId,sourceSha,visibleIds,phoneCount,emailCount}){
 if(!obj||obj.size!==bytes||bytes>80000||typeof obj.arrayBuffer!=="function")throw Error("snapshot_size");
 const raw=await obj.arrayBuffer();
 if(raw.byteLength!==bytes||await sha256Hex(raw)!==digest)throw Error("snapshot_digest");
 const data=JSON.parse(new TextDecoder().decode(raw));
 if(data?.schemaVersion!==1||data.releaseId!==releaseId||data.sourceReleaseSha256!==sourceSha||
    !data.phones||typeof data.phones!=="object"||Array.isArray(data.phones)||
    !data.emails||typeof data.emails!=="object"||Array.isArray(data.emails)||
    Object.keys(data.phones).length!==phoneCount||Object.keys(data.emails).length!==emailCount||
    [...Object.keys(data.phones),...Object.keys(data.emails)].some(id=>!visibleIds.has(id))||
    Object.values(data.phones).some(n=>typeof n!=="string"||n.length>32||!/^(?:0\d{8,10}|\+64\d{7,10})$/.test(n.trim().replace(/[\s().-]/g,"")))||
    Object.values(data.emails).some(n=>typeof n!=="string"||n.length>254||!EMAIL.test(n)))
   throw Error("snapshot_schema");
 return data;
}
export function emailRevealReady(env){
 return Boolean(env.TURNSTILE_SITE_KEY&&env.TURNSTILE_SECRET&&env.CONTACT_LIMIT?.limit&&
   env.KIWI_PRIVATE_CONTACTS?.get&&env.ASSETS?.fetch&&env.BUSINESS_EMAIL_REVEAL_ENABLED==="true");
}
export async function loadCurrentPrivateContacts(url,env){
 let releaseId,visibleIds,versioned=false;
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
   if(releaseId===CONTACT_RELEASE_ID){
     versioned=true;
     if(status.contactSnapshotSha256!==CONTACT_SNAPSHOT_SHA||status.sourceSha256!==CONTACT_SOURCE_SHA||
        visibleIds.size!==CONTACT_VISIBLE_COUNT||await sha256Hex(new TextEncoder().encode([...visibleIds].sort().join("\n")+"\n"))!==CONTACT_VISIBLE_IDS_SHA)
       return {ok:false,status:503};
   }else if(status.contactSnapshotSha256!==undefined)return {ok:false,status:503};
 }catch{return {ok:false,status:503};}
 try{
   const obj=await env.KIWI_PRIVATE_CONTACTS.get(privateContactKey(releaseId,versioned?CONTACT_SNAPSHOT_SHA:null));
   if(!obj)return {ok:false,status:404};
   if((obj.size||0)>80000)return {ok:false,status:503};
   const data=versioned?await readVerifiedSnapshot(obj,{digest:CONTACT_SNAPSHOT_SHA,bytes:CONTACT_SNAPSHOT_BYTES,
     releaseId,sourceSha:CONTACT_SOURCE_SHA,visibleIds,phoneCount:CONTACT_PHONE_COUNT,emailCount:CONTACT_EMAIL_COUNT}):await obj.json();
   if(data?.schemaVersion!==1||data.releaseId!==releaseId||
      !data.phones||typeof data.phones!=="object"||Array.isArray(data.phones)||
      !data.emails||typeof data.emails!=="object"||Array.isArray(data.emails))
     return {ok:false,status:503};
   // Contact access is limited to businesses currently published by Kiwi.
   // Keep values in the existing private binding and retain Turnstile.
   const filter=map=>Object.fromEntries(Object.entries(map).filter(([id])=>visibleIds.has(id)));
   return {ok:true,data:{...data,phones:filter(data.phones),emails:filter(data.emails)},releaseId,visibleIds};
 }catch{return {ok:false,status:503};}
}
export async function revealBusinessContact(request,env,{fetchImpl=fetch}={}){
 const url=new URL(request.url);
 const path=url.pathname.match(/^\/api\/gardeners\/(afnz-\d{13})\/(?:contact|email)$/);
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
 const {data:privateData,releaseId,visibleIds}=contact;
 const id=path[1];
 if(!visibleIds?.has(id))return json(404,{error:"business_contact_not_available"});
 const raw=privateData.phones[id],email=privateData.emails[id];
 const result={};
 if(raw!==undefined){
  const phone=normaliseProtectedPhone(raw);
  if(!phone)return json(503,{error:"business_contact_not_available"});
  result.phone=phone;
 }
 if(email!==undefined){
  if(typeof email!=="string"||email.length>254||!EMAIL.test(email))return json(503,{error:"business_contact_not_available"});
  result.email=email;
 }
 // The same immutable public feed already used at build time contains
 // approved website and canonical source links. Read it only after a
 // successful per-business challenge, from R2 (not the GRID visitor API).
 if(releaseId===CONTACT_RELEASE_ID){
  try{Object.assign(result,await loadApprovedLinks(env,id));}
  catch{return json(503,{error:"business_contact_not_available"});}
 }
 return Object.keys(result).length?json(200,result):json(404,{error:"business_contact_not_available"});
}
export function normaliseProtectedPhone(value){
 if(typeof value!=="string"||value.length>32)return null;
 const display=value.trim(),compact=display.replace(/[\s().-]/g,"");
 if(!/^(?:0\d{8,10}|\+64\d{7,10})$/.test(compact))return null;
 return {display,telHref:compact.startsWith("+64")?"tel:"+compact:"tel:+64"+compact.slice(1)};
}
export async function approvedLinksFromBytes(raw,{id,digest=CONTACT_SOURCE_SHA,releaseId=CONTACT_RELEASE_ID,sourceCount=153}={}){
 if(raw.byteLength>300000||await sha256Hex(raw)!==digest)throw Error("source_digest");
 const feed=JSON.parse(new TextDecoder().decode(raw));
 if(feed.schemaVersion!==1||feed.source!=="grideater.com"||feed.releaseId!==releaseId||
    feed.approvedForKiwi!==true||!Array.isArray(feed.records)||feed.records.length!==sourceCount)throw Error("source_schema");
 const matches=feed.records.filter(r=>r.id===id);
 if(matches.length!==1||matches[0].status!=="published"||matches[0].approvedForKiwi!==true||matches[0].suppressed!==false)throw Error("source_identity");
 const row=matches[0],source=new URL(row.sourcePage);
 if(source.protocol!=="https:"||source.hostname!=="grideater.com"||!source.pathname.startsWith("/business/")||source.username||source.password)throw Error("source_url");
 const out={sourcePage:source.href};
 if(row.publicContact?.type==="website"&&row.publicContact.approvedForPublicUse===true){
  const website=new URL(row.publicContact.value);
  if(!["https:","http:"].includes(website.protocol)||website.username||website.password)throw Error("website_url");
  out.website=website.href;
 }
 return out;
}
async function loadApprovedLinks(env,id){
 const obj=await env.KIWI_PRIVATE_CONTACTS.get("verticals/kiwigardeners.com/v1/releases/"+CONTACT_RELEASE_ID+".json");
 if(!obj||obj.size<1||obj.size>300000||typeof obj.arrayBuffer!=="function")throw Error("source_object");
 const raw=await obj.arrayBuffer();
 if(raw.byteLength!==obj.size)throw Error("source_bytes");
 return approvedLinksFromBytes(raw,{id});
}
