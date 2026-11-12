import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {RELEASE,SHA,BYTES,verifySource,verifyNative}
 from "./verify-live-153-gardeners.mjs";
import {ALL as OLD} from "./verify-live-twentyone-gardeners.mjs";
const base="https://kiwigardeners.com";
const provisionalLabels=["Indicative general gardening (NZBN category)","Indicative lawn care (NZBN category)","Indicative landscaping (NZBN category)","Indicative arborist or tree services (NZBN category)","Indicative garden centre or nursery retail (NZBN category)"];
const ids=[...OLD,...Array.from({length:132},(_,i)=>
 "afnz-"+String(9429009000000+i))];
function fixture(){
 const records=ids.map((id,i)=>({
  id,slug:"business-"+i,name:"Garden Business "+i,
  sourcePage:"https://grideater.com/business/business-"+i,
  kind:i<21?"gardening_service":i<146?"gardening_service":"gardening_supplier",
  services:[{name:i<21?"Garden maintenance":provisionalLabels[i<146?(i-21)%4:4],
    ...(i>=21?{basis:"nzbn_bic_provisional"}:{})}]
 }));
 const source={records};
 const hub='<script src="/assets/gardener-public-phone.js"></script><p>Dallas Timpson</p>'+
  records.map(x=>'<article data-gardener-card data-id="'+x.id+
   '"><a href="/gardeners/'+x.slug+'/">'+x.name+'</a>'+x.id+x.services[0].name+'</article>').join("");
 const profiles=records.map((x,i)=>
  '<link rel="canonical" href="'+base+'/gardeners/'+x.slug+'/">'+
   x.id+x.name+x.sourcePage+x.services[0].name+(i>=21?
   'Indicative NZBN business classification Operating area not confirmed Show business email (Turnstile)':''));
 const sitemap='<urlset>'+records.map(x=>
   '<loc>'+base+'/gardeners/'+x.slug+'/</loc>').join("")+'</urlset>';
 const status={schemaVersion:1,source:"grideater.com",releaseId:RELEASE,
  approvedForKiwi:true,publishedListings:153};
 return {source,hub,sitemap,status,profiles,phoneCount:5,config:{enabled:true}};
}
test("exact pinned source and bounded 153 native verifier",()=>{
 assert.equal(RELEASE,"kg-category-provisional-20261111045747746");
 assert.equal(SHA,"8b416584f93af81a0b4ce3dac7b114dc4a5cfa05653ef77e09e9e094b598a796");
 assert.equal(BYTES,173880);
 assert.equal(ids.length,153);assert.equal(new Set(ids).size,153);
 assert.throws(()=>verifySource(Buffer.from("{}")),/SOURCE_SHA_HOLD/);
 assert.deepEqual(verifyNative(fixture()),{
  state:"KIWI_153_PROVISIONAL_GARDENERS_LIVE",releaseId:RELEASE,
  sourceSha256:SHA,previouslyLive:21,addedServices:125,addedSuppliers:7,
  cards:153,profiles:153,sitemapProfiles:153,publicPhoneCount:5,
  turnstileEnabled:true,newBicListingsClearlyProvisional:true,categoryLabelsVerified:true,
  d1Writes:0,productionWrites:0});
});
test("wrong native card/profile/sitemap counts, provisional labels or contacts hold",()=>{
 for(const change of [
  x=>x.status.publishedListings=21,
  x=>x.hub=x.hub.replace("data-gardener-card","data-broken"),
  x=>x.profiles.pop(),
  x=>x.sitemap=x.sitemap.replace("<loc>"+base+"/gardeners/business-152/</loc>",""),
  x=>x.profiles[21]=x.profiles[21].replace("Operating area not confirmed",""),
  x=>x.phoneCount=4,
  x=>x.config.enabled=false,
  x=>x.hub+="privateContact",
  x=>x.hub=x.hub.replace("Dallas Timpson","Unknown")
 ]){
  const obj=fixture();change(obj);
  assert.throws(()=>verifyNative(obj),/KG_DIR_12_/);
 }
});
test("source-only verifier makes read-only bounded GETs and no direct GRID D1 access",()=>{
 const s=readFileSync("scripts/verify-live-153-gardeners.mjs","utf8");
 assert.match(s,/width=12/);
 assert.match(s,/SOURCE_SHA/);
 assert.match(s,/publicPhoneCount:5/);
 assert.match(s,/privateContact/);
 assert.match(s,/turnstileEnabled:true/);
 assert.doesNotMatch(s,/wrangler d1 execute|DELETE FROM|INSERT INTO/);
});
