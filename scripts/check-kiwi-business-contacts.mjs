import test from "node:test";
import assert from "node:assert/strict";
import {revealBusinessContact,emailRevealReady,privateContactKey,readVerifiedSnapshot,sha256Hex,loadCurrentPrivateContacts}
 from "../src/business-email-reveal.js";
import {publicBusinessPhones} from "../src/business-phone-public.js";
import {normaliseProtectedPhone as normaliseKiwiPhone,approvedLinksFromBytes} from "../src/business-email-reveal.js";
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
   approvedForKiwi:true,publishedListings:1,publishedBusinessIds:[ID]
  }),{status:200})},
  KIWI_PRIVATE_CONTACTS:{get:async(key)=>{
   assert.equal(key,privateContactKey(RELEASE));
   return {size:100,json:async()=>structuredClone(DB)};
  }},
  ...overrides
 };
}
function emailReq(body={token:"test-turnstile-token"}){
 return new Request(ROOT+"/api/gardeners/"+ID+"/contact",{
  method:"POST",headers:{"origin":ROOT,"CF-Connecting-IP":"192.0.2.5",
   "content-type":"application/json"},body:JSON.stringify(body)
 });
}
const challenge=(ok=true,action="business_email_reveal",hostname="kiwigardeners.com")=>
 async()=>new Response(JSON.stringify({success:ok,action,hostname}),{status:200});
async function outcome(env=environment(),verify=challenge(),req=emailReq()){
 const r=await revealBusinessContact(req,env,{fetchImpl:verify});
 return {status:r.status,headers:r.headers,body:await r.json()};
}
test("bulk endpoint retired and one verified business exposes only its own contact details",async()=>{
 assert.deepEqual(normaliseKiwiPhone("03 123 4567"),{display:"03 123 4567",telHref:"tel:+6431234567"});
 assert.equal(normaliseKiwiPhone("not a phone"),null);
 let reads=0;
 const env=environment({KIWI_PRIVATE_CONTACTS:{get:async()=>{reads++;return {size:100,json:async()=>structuredClone(DB)};}}});
 for(const method of ["GET","POST"]){
  const response=await worker.fetch(new Request(ROOT+"/api/gardeners/phones",{method}),env);
  assert.equal(response.status,410);
  assert.match(response.headers.get("cache-control"),/no-store/);
 }
 assert.equal(reads,0);
 assert.equal((await outcome(env,challenge(false))).status,403);
 assert.equal(reads,0);
 const good=await outcome(env);
 assert.deepEqual(good.body,{phone:{display:"03 123 4567",telHref:"tel:+6431234567"},email:"business@example.nz"});
 assert.equal(reads,1);
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
 assert.equal((await publicBusinessPhones()).status,410);
 const wrongRelease=environment({KIWI_PRIVATE_CONTACTS:{get:async()=>({
  size:10,json:async()=>({...DB,releaseId:"kg-old-release"})
 })}});
 assert.equal((await outcome(wrongRelease)).status,503);
 const invalid=environment({KIWI_PRIVATE_CONTACTS:{get:async()=>({
  size:10,json:async()=>({...DB,phones:{[ID]:"invalid phone"}})
 })}});
 assert.equal((await outcome(invalid)).status,503);
});
test("rejects unverified or cross-origin email reveal, no GET bypass",async()=>{
 const noOrigin=new Request(ROOT+"/api/gardeners/"+ID+"/contact",{
  method:"POST",headers:{"CF-Connecting-IP":"192.0.2.5","content-type":"application/json"},
  body:JSON.stringify({token:"test-turnstile-token"})});
 assert.equal((await outcome(environment(),challenge(),noOrigin)).status,403);
 const limited=await outcome(environment({CONTACT_LIMIT:{limit:async()=>({success:false})}}));
 assert.equal(limited.status,429);
 assert.equal((await outcome(environment(),challenge(),emailReq({token:""}))).status,400);
 const get=await worker.fetch(new Request(ROOT+"/api/gardeners/"+ID+"/contact"),environment());
 assert.equal(get.status,405);
 const wrong=await worker.fetch(new Request(ROOT+"/api/gardeners/phones",{method:"POST"}),environment());
 assert.equal(wrong.status,410);
});
test("source contract keeps private email and public phone out of GRID feed and static HTML",async()=>{
 const {readFileSync}=await import("node:fs");
 const producer=readFileSync("src/gardener-directory.mjs","utf8");
 const generator=readFileSync("build.mjs","utf8");
 assert.doesNotMatch(producer,/publicPhone:\s*publicPhone/);
 assert.match(generator,/gardener-email-reveal\.js/);
 assert.doesNotMatch(generator,/<script src="\/assets\/gardener-public-phone\.js/);
 assert.doesNotMatch(producer,/data-kiwi-public-phone/);
 assert.match(producer,/data-reveal-email/);
});

test("publish-first provisional NZBN gardening listing has no invented services, website or territory",async()=>{
 const {validateGridEaterPublicGardeners,addGardenerDirectoryPages}=await import("../src/gardener-directory.mjs");
 const approvedAt="2026-11-10T04:10:00.000Z";
 const sourcePage="https://grideater.com/business/example-garden-service-9429032462685";
 const row={id:ID,slug:"example-garden-service-9429032462685",
  name:"Example Garden Service Limited",
  description:"This directory record is provisionally classified from its official NZBN industry category, and specific services, products and operating areas are not yet confirmed. Contact the business before arranging work.",
  kind:"gardening_service",status:"published",approvedForKiwi:true,suppressed:false,
  approvedAt,sourcePage,services:[{name:"Gardening services (NZBN industry)",
   verifiedAt:approvedAt,evidenceUrl:sourcePage,basis:"nzbn_bic_provisional"}],
  serviceAreas:[],publicContact:{type:"grid_profile",value:sourcePage,
   verifiedAt:approvedAt,evidenceUrl:sourcePage,approvedForPublicUse:true}
 };
 const fixture={schemaVersion:1,source:"grideater.com",releaseId:"kg-provisional-fixture",
  releasedAt:approvedAt,approvedForKiwi:true,records:[row]};
 const validated=validateGridEaterPublicGardeners(fixture,{now:approvedAt});
 assert.equal(validated.records.length,1);
 const files={};const esc=s=>String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;");
 addGardenerDirectoryPages({files,esc,baseTrail:[],TEL_URL:"tel:+64273406581",
  PHONE:"027 340 6581",ENQUIRY_URL:"mailto:dallas@kiwigardeners.com",
  articleHero:(_a,t)=>"<h1>"+esc(t)+"</h1>",a:(href,t)=>'<a href="'+href+'">'+t+"</a>",
  layout:({content})=>content},validated);
 const profile=files["gardeners/"+row.slug+"/index.html"];
 assert.match(profile,/Indicative NZBN business classification/);
 assert.match(profile,/Operating area not confirmed/);
 assert.match(profile,/Show contact details \(Turnstile\)/);
 assert.match(profile,/data-contact-details/);
 assert.doesNotMatch(profile,/tel:\+6431234567|business@example\.nz/);
 const invalid=structuredClone(fixture);
 invalid.records[0].services[0].evidenceUrl="https://unrelated.example.nz/services";
 assert.throws(()=>validateGridEaterPublicGardeners(invalid,{now:approvedAt}),/provisional BIC needs exact canonical GRID evidence/);
});

test("contacts for hidden directory identities are excluded without exposing raw emails",async()=>{
 const hidden="afnz-9429000000001";
 const env=environment({KIWI_PRIVATE_CONTACTS:{get:async()=>({
  size:500,json:async()=>({...DB,phones:{...DB.phones,[hidden]:"03 234 5678"},emails:{...DB.emails,[hidden]:"hidden@example.nz"}})
 })}});
 const good=await outcome(env);
 assert.equal(good.status,200);
 assert.doesNotMatch(JSON.stringify(good.body),/hidden@example|234 5678/);
 const req=new Request(ROOT+"/api/gardeners/"+hidden+"/contact",{
  method:"POST",headers:{"origin":ROOT,"CF-Connecting-IP":"192.0.2.5","content-type":"application/json"},
  body:JSON.stringify({token:"test-turnstile-token"})});
 assert.equal((await outcome(env,challenge(),req)).status,404);
 const bad=environment({ASSETS:{fetch:async()=>new Response(JSON.stringify({
  schemaVersion:1,source:"grideater.com",releaseId:RELEASE,approvedForKiwi:true,publishedListings:1
 }),{status:200})}});
 assert.equal((await outcome(bad)).status,503);
});

test("immutable private snapshot validates exact bytes, source, counts and visible IDs",async()=>{
 const sourceSha="a".repeat(64),visibleIds=new Set([ID]);
 const data={...DB,sourceReleaseSha256:sourceSha};
 const raw=new TextEncoder().encode(JSON.stringify(data)),digest=await sha256Hex(raw);
 const obj={size:raw.byteLength,arrayBuffer:async()=>raw.buffer};
 const options={digest,bytes:raw.byteLength,releaseId:RELEASE,sourceSha,visibleIds,phoneCount:1,emailCount:1};
 assert.deepEqual(await readVerifiedSnapshot(obj,options),data);
 assert.equal(privateContactKey(RELEASE,digest),"verticals/kiwigardeners.com/v1/private-contacts/"+RELEASE+"/"+digest+".json");
 await assert.rejects(readVerifiedSnapshot(obj,{...options,digest:"b".repeat(64)}),/snapshot_digest/);
 await assert.rejects(readVerifiedSnapshot(obj,{...options,bytes:raw.byteLength+1}),/snapshot_size/);
 await assert.rejects(readVerifiedSnapshot(obj,{...options,sourceSha:"c".repeat(64)}),/snapshot_schema/);
 await assert.rejects(readVerifiedSnapshot(obj,{...options,visibleIds:new Set()}),/snapshot_schema/);
 await assert.rejects(readVerifiedSnapshot(obj,{...options,phoneCount:2}),/snapshot_schema/);
});
test("current release refuses an unpinned legacy snapshot and mismatched visibility before R2 access",async()=>{
 const {CONTACT_RELEASE_ID,CONTACT_SOURCE_SHA,CONTACT_SNAPSHOT_SHA}=await import("../src/gardener-contact-snapshot.js");
 const {PUBLISHED_IDS}=await import("../src/gardener-contactability.mjs");
 let seen=[];
 const correct={schemaVersion:1,source:"grideater.com",releaseId:CONTACT_RELEASE_ID,approvedForKiwi:true,publishedListings:90,publishedBusinessIds:[...PUBLISHED_IDS],contactSnapshotSha256:CONTACT_SNAPSHOT_SHA,sourceSha256:CONTACT_SOURCE_SHA};
 const envFor=status=>environment({ASSETS:{fetch:async()=>new Response(JSON.stringify(status))},KIWI_PRIVATE_CONTACTS:{get:async(key)=>{seen.push(key);return null;}}});
 const url=new URL(ROOT+"/api/gardeners/phones");
 assert.equal((await loadCurrentPrivateContacts(url,envFor({...correct,contactSnapshotSha256:undefined}))).status,503);
 assert.equal((await loadCurrentPrivateContacts(url,envFor({...correct,publishedBusinessIds:[...PUBLISHED_IDS.slice(1),"afnz-9429000000001"]}))).status,503);
 assert.deepEqual(seen,[]);
 assert.equal((await loadCurrentPrivateContacts(url,envFor(correct))).status,404);
 assert.deepEqual(seen,[privateContactKey(CONTACT_RELEASE_ID,CONTACT_SNAPSHOT_SHA)]);
});

test("verified source bytes select one approved website and canonical link only",async()=>{
 const sourcePage="https://grideater.com/business/example";
 const row={id:ID,status:"published",approvedForKiwi:true,suppressed:false,sourcePage,publicContact:{type:"website",value:"https://example.nz/",approvedForPublicUse:true}};
 const raw=new TextEncoder().encode(JSON.stringify({schemaVersion:1,source:"grideater.com",releaseId:RELEASE,approvedForKiwi:true,records:[row]}));
 const digest=await sha256Hex(raw);
 const opts={id:ID,digest,releaseId:RELEASE,sourceCount:1};
 assert.deepEqual(await approvedLinksFromBytes(raw,opts),{sourcePage,website:"https://example.nz/"});
 await assert.rejects(approvedLinksFromBytes(raw,{...opts,id:"afnz-9429000000001"}),/source_identity/);
 await assert.rejects(approvedLinksFromBytes(raw,{...opts,digest:"f".repeat(64)}),/source_digest/);
});
