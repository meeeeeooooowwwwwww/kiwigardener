#!/usr/bin/env node
/** Read-only independent live acceptance for KIWI-ONLY contact presentation.
 * Avoid logging raw phone/email values, tokens, visitor IPs or full responses.
 */
import {pathToFileURL} from "node:url";
const ORIGIN="https://kiwigardeners.com";
const RELEASE="kg-reviewed-four-20261110022228";
const fail=x=>{throw Error("KG_DIR_11_"+x+"_HOLD");};
async function get(path){
 let r;try{r=await fetch(ORIGIN+path,{method:"GET",redirect:"manual",
  signal:AbortSignal.timeout(15000),headers:{accept:"application/json",
   "user-agent":"Kiwi-Gardeners-KG-DIR-11-contact-proof"}});}
 catch{fail("GET_NETWORK");}
 return r;
}
export async function checkLiveContacts(){
 const p=await get("/api/gardeners/phones");
 if(p.status!==200)fail("PUBLIC_PHONES_HTTP_"+p.status);
 const data=await p.json().catch(()=>null);
 const pairs=Object.entries(data?.phones||{});
 if(data?.releaseId!==RELEASE||pairs.length!==4||
  !pairs.every(([id,value])=>/^afnz-\d{13}$/.test(id)&&
    typeof value?.display==="string"&&value.display.length>=8&&
    /^tel:\+64\d{7,10}$/.test(value.telHref))||
  JSON.stringify(data).includes('"emails"')||Object.hasOwn(data,"email"))
  fail("PUBLIC_PHONE_PRIVACY_OR_COUNT");
 const conf=await get("/api/gardeners/email/config");
 if(conf.status!==200)fail("EMAIL_CONFIG_HTTP_"+conf.status);
 const cfg=await conf.json().catch(()=>null);
 if(cfg?.enabled!==true||!/^[A-Za-z0-9_-]{10,}$/.test(cfg.siteKey||""))
  fail("TURNSTILE_CONFIG_NOT_READY");
 const emailId=pairs[0][0];
 const forbid=await get("/api/gardeners/"+emailId+"/email");
 if(forbid.status!==405)fail("EMAIL_GET_REVEAL_BYPASS");
 let post;
 try{post=await fetch(ORIGIN+"/api/gardeners/"+emailId+"/email",{
  method:"POST",redirect:"manual",signal:AbortSignal.timeout(15000),
  headers:{"content-type":"application/json","origin":ORIGIN},
  body:JSON.stringify({token:"invalid-test-token"})
 });}catch{fail("EMAIL_NEGATIVE_NETWORK");}
 if(![400,403,429].includes(post.status))fail("INVALID_TURNSTILE_ALLOWED");
 const j=await post.json().catch(()=>null);
 if(j?.email||j?.accepted===true)fail("EMAIL_NEGATIVE_DATA_LEAK");
 const page=await get("/gardeners/untangled-landscapes-ltd-9429032462685/");
 if(page.status!==200)fail("PROFILE_HTTP_"+page.status);
 const html=await page.text();
 if(!html.includes("data-kiwi-public-phone")||
   !html.includes("data-reveal-email")||
   !html.includes("/assets/gardener-email-reveal.js")||
   !html.includes("/assets/gardener-public-phone.js")||
   html.includes('name="business-email" value='))
   fail("NATIVE_CONTACT_PLACEHOLDERS");
 return {milestone:"KG-DIR-11",sourceRelease:RELEASE,
  phoneCardsReady:true,publicPhoneContacts:pairs.length,
  turnstileConfigEnabled:true,invalidTokenRejected:true,
  emailGetNotAllowed:true,privateEmailsInPublicPhoneResponse:0,
  publicSourceChanged:false,directD1Writes:0,
  liveSourceProof:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 checkLiveContacts().then(x=>console.log("KG_DIR_11_LIVE_CONTACTS="+JSON.stringify(x)))
 .catch(e=>{const m=String(e?.message||"");
  console.error(/^KG_DIR_11_[A-Z0-9_]+_HOLD$/.test(m)?m:"KG_DIR_11_FAILED_CLOSED");
  process.exitCode=1;});
