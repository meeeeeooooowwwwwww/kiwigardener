import test from "node:test";
import assert from "node:assert/strict";
import {revealBusinessEmail,emailRevealReady,privateContactKey}
 from "../src/business-email-reveal.js";
import {publicBusinessPhones,normaliseKiwiPhone}
 from "../src/business-phone-public.js";
import worker from "../src/worker.js";
const ROOT="https://kiwigardeners.com";
const ID="afnz-9429032462685",RELEASE="kg-reviewed-four-20261110022228";
const DB={schemaVersion:1,releaseId:RELEASE,phones:{[ID]:"03 123 4567"},
 emails:{[ID]:"business@example.nz"}};
function environment(overrides={}){
 return {
  TURNSTILE_SITE_KEY:"test-site-key-123456",
  TURNSTILE_SECRET:"private-test-secret",
  CONTACT_LIMIT:{limit:async()=>({success:true})},
  BUSINESS_EMAIL_REVEAL_ENABLED:"true",
  BUSINESS_PHONE_PUBLIC_ENABLED:"true",
  ASSETS:{fetch:async()=>new Response(JSON.stringify({
   schemaVersion:1,source:"grideater.com",releaseId:RELEASE,
   approvedForKiwi:true,publishedListings:21
  }),{status:200})},
  KIWI_PRIVATE_CONTACTS:{get:async(key)=>{
   assert.equal(key,privateContactKey(RELEASE));
   return {size:100,json:async()=>structuredClone(DB)};
  }},
  ...overrides
 };
}
function emailReq(body={token:"test-turnstile-token"}){
 return new Request(ROOT+"/api/gardeners/"+ID+"/email",{
  method:"POST",headers:{"origin":ROOT,"CF-Connecting-IP":"192.0.2.5",
   "content-type":"application/json"},body:JSON.stringify(body)
 });
}
const challenge=(ok=true,action="business_email_reveal",hostname="kiwigardeners.com")=>
 async()=>new Response(JSON.stringify({success:ok,action,hostname}),{status:200});
async function outcome(env=environment(),verify=challenge(),req=emailReq()){
 const r=await revealBusinessEmail(req,env,{fetchImpl:verify});
 return {status:r.status,headers:r.headers,body:await r.json()};
}
test("phone source is published only from Kiwi server, not in GRID feed or email payload",async()=>{
 assert.deepEqual(normaliseKiwiPhone("03 123 4567"),{
  display:"03 123 4567",telHref:"tel:+6431234567"});
 assert.equal(normaliseKiwiPhone("not a phone"),null);
 const res=await publicBusinessPhones(new Request(ROOT+"/api/gardeners/phones"),environment());
 assert.equal(res.status,200);
 const body=await res.json();
 assert.deepEqual(body.phones[ID],{display:"03 123 4567",telHref:"tel:+6431234567"});
 assert.equal(JSON.stringify(body).includes("business@example.nz"),false);
 assert.equal(JSON.stringify(body).includes("emails"),false);
 assert.equal(body.releaseId,RELEASE);
});
test("Turnstile action and hostname verification precedes retrieving business email",async()=>{
 const good=await outcome();
 assert.equal(good.status,200);
 assert.equal(good.body.email,"business@example.nz");
 assert.match(good.headers.get("cache-control"),/no-store/);
 assert.equal((await outcome(environment(),challenge(true,"phone_reveal"))).status,403);
 assert.equal((await outcome(environment(),challenge(true,"business_email_reveal","evil.example"))).status,403);
 assert.equal((await outcome(environment(),challenge(false))).status,403);
});
test("missing binding, no contact, stale published source and invalid phone fail closed",async()=>{
 assert.equal(emailRevealReady(environment({BUSINESS_EMAIL_REVEAL_ENABLED:"false"})),false);
 assert.equal((await outcome(environment({BUSINESS_EMAIL_REVEAL_ENABLED:"false"}))).status,503);
 const missing=environment({KIWI_PRIVATE_CONTACTS:{get:async()=>null}});
 assert.equal((await outcome(missing)).status,404);
 assert.equal((await publicBusinessPhones(new Request(ROOT+"/api/gardeners/phones"),missing)).status,404);
 const wrongRelease=environment({KIWI_PRIVATE_CONTACTS:{get:async()=>({
  size:10,json:async()=>({...DB,releaseId:"kg-old-release"})
 })}});
 assert.equal((await outcome(wrongRelease)).status,503);
 const invalid=environment({KIWI_PRIVATE_CONTACTS:{get:async()=>({
  size:10,json:async()=>({...DB,phones:{[ID]:"invalid phone"}})
 })}});
 assert.equal((await publicBusinessPhones(new Request(ROOT+"/api/gardeners/phones"),invalid)).status,503);
});
test("rejects unverified or cross-origin email reveal, no GET bypass",async()=>{
 const noOrigin=new Request(ROOT+"/api/gardeners/"+ID+"/email",{
  method:"POST",headers:{"CF-Connecting-IP":"192.0.2.5","content-type":"application/json"},
  body:JSON.stringify({token:"test-turnstile-token"})});
 assert.equal((await outcome(environment(),challenge(),noOrigin)).status,403);
 assert.equal((await outcome(environment({CONTACT_LIMIT:{limit:async()=>({success:false})}))).status,429);
 assert.equal((await outcome(environment(),challenge(),emailReq({token:""}))).status,400);
 const get=await worker.fetch(new Request(ROOT+"/api/gardeners/"+ID+"/email"),environment());
 assert.equal(get.status,405);
 const wrong=await worker.fetch(new Request(ROOT+"/api/gardeners/phones",{method:"POST"}),environment());
 assert.equal(wrong.status,405);
});
test("source contract keeps private email and public phone out of GRID feed and static HTML",async()=>{
 const {readFileSync}=await import("node:fs");
 const producer=readFileSync("src/gardener-directory.mjs","utf8");
 const generator=readFileSync("build.mjs","utf8");
 assert.doesNotMatch(producer,/publicPhone:\s*publicPhone/);
 assert.match(generator,/gardener-email-reveal\.js/);
 assert.match(generator,/gardener-public-phone\.js/);
 assert.match(producer,/data-kiwi-public-phone/);
 assert.match(producer,/data-reveal-email/);
});
