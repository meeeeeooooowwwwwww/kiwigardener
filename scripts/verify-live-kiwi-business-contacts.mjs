#!/usr/bin/env node
/** KG-DIR-11: read-only live check; never requests or logs actual email.
 * Public business phones are intentionally visible ONLY on Kiwi Gardeners.
 * Email is checked solely for server-side Turnstile gating, not bypassed.
 */
import {pathToFileURL} from "node:url";
import {ALL,RELEASE} from "./verify-live-twentyone-gardeners.mjs";
import {normaliseKiwiPhone} from "../src/business-phone-public.js";
const ORIGIN="https://kiwigardeners.com";
const error=code=>{throw Error("KG_DIR_11_"+code+"_HOLD");};
const headers={"accept":"application/json","user-agent":"KiwiGardeners-KG-DIR-11-Live-ReadOnly"};
async function req(path,method="GET",extra={}){
 let res;
 try{res=await fetch(ORIGIN+path,{method,redirect:"manual",
  signal:AbortSignal.timeout(20000),
  headers:{...headers,...extra},
  ...(method==="POST"?{body:JSON.stringify({token:""})}:{})});}
 catch{error("PUBLIC_NETWORK");}
 return res;
}
export async function verifyLive(){
 const phonesRes=await req("/api/gardeners/phones");
 if(phonesRes.status!==200||!(phonesRes.headers.get("content-type")||"").includes("application/json"))
  error("PHONE_HTTP");
 const raw=await phonesRes.text();
 if(raw.length>16000||raw.length<35||raw.includes('"emails"')||raw.includes("@"))
  error("PHONE_JSON_PRIVACY");
 let source;try{source=JSON.parse(raw);}catch{error("PHONE_JSON");}
 if(source.releaseId!==RELEASE||!source.phones||
    typeof source.phones!=="object"||Array.isArray(source.phones))
  error("PHONE_SOURCE_RELEASE");
 const items=Object.entries(source.phones);
 if(items.length!==4||items.some(([id,val])=>
    !ALL.includes(id)||typeof val?.display!=="string"||
    typeof val?.telHref!=="string"||
    normaliseKiwiPhone(val.display)?.telHref!==val.telHref))
  error("PHONE_PUBLIC_SCOPE");
 const configRes=await req("/api/gardeners/email/config");
 if(configRes.status!==200)error("TURNSTILE_CONFIG_HTTP");
 let config;try{config=await configRes.json();}catch{error("TURNSTILE_CONFIG_JSON");}
 if(config.enabled!==true||!/^[a-zA-Z0-9_-]{10,}$/.test(config.siteKey||"")||
    JSON.stringify(config).toLowerCase().includes("secret"))
  error("TURNSTILE_CONFIG");
 const id=ALL[0];
 if((await req("/api/gardeners/"+id+"/email")).status!==405)
  error("EMAIL_GET_NOT_BLOCKED");
 if((await req("/api/gardeners/"+id+"/email","POST",
   {"origin":"https://unrelated.example","content-type":"application/json"})).status!==403)
  error("EMAIL_CROSS_ORIGIN_NOT_BLOCKED");
 if((await req("/api/gardeners/"+id+"/email","POST",
   {"origin":ORIGIN,"content-type":"application/json"})).status!==400)
  error("EMAIL_NO_TOKEN_NOT_BLOCKED");
 const privatePath="/verticals/kiwigardeners.com/v1/private-contacts/"+RELEASE+".json";
 if((await req(privatePath)).status===200)
  error("PRIVATE_OBJECT_PUBLIC_ACCESS");
 const hub=await req("/gardeners/");
 if(hub.status!==200)error("HUB_HTTP");
 const hubHtml=await hub.text();
 if(!hubHtml.includes("/assets/gardener-public-phone.js")||
   !hubHtml.includes("data-kiwi-public-phone")||
   hubHtml.includes("business@example.nz")||hubHtml.includes('"emails"'))
  error("HUB_PUBLIC_PHONE_SCRIPT");
 const first=hubHtml.match(/href="\/gardeners\/([a-z0-9-]+)\/"/);
 if(!first)error("HUB_NO_BUSINESS_LINK");
 const profile=await req("/gardeners/"+first[1]+"/");
 if(profile.status!==200)error("PROFILE_HTTP");
 const html=await profile.text();
 if(!html.includes("/assets/gardener-email-reveal.js")||
    !html.includes("data-reveal-email")||
    !html.includes("data-kiwi-public-phone"))
  error("PROFILE_CONTACT_UI");
 return {state:"KIWI_PUBLIC_BUSINESS_CONTACTS_LIVE",
   existingListingsPreserved:ALL.length,
   publicBusinessPhones:items.length,
   turnstileEmailConfig:true,
   emailNotInPublicPhoneApi:true,
   emailGetBlocked:true,crossOriginBlocked:true,
   missingTokenBlocked:true,privateR2ObjectNotPublic:true,
   canonicalSourceRelease:RELEASE,productionWrites:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 verifyLive().then(r=>console.log("KG_DIR_11_CONTACTS_PROOF="+JSON.stringify(r)))
 .catch(e=>{const s=String(e?.message||"");
   console.error(/^KG_DIR_11_[A-Z_]+_HOLD$/.test(s)?s:"KG_DIR_11_LIVE_FAILED_CLOSED");
   process.exitCode=1;});
