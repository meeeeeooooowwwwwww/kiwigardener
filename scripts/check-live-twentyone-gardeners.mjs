import test from "node:test";
import assert from "node:assert/strict";
import {ORIGIN,RELEASE,SHA,BYTES,NEW,ALL,verifySource,verifyTwentyone}
 from "./verify-live-twentyone-gardeners.mjs";
const at="2026-11-10T02:22:28.000Z";
const priorSupplier="afnz-9429053251589",twin="afnz-9429048751926",
 green="afnz-9429031205924",greenspace="afnz-9429032218886",
 provisional="afnz-9429030118973";
function fixture(){
 const records=ALL.map((id,i)=>{
  const added=NEW.find(x=>x.id===id);
  const supplier=[priorSupplier,twin,green].includes(id);
  const slug="test-"+id.slice(5);
  const services=[{name:supplier?"Nursery Plants":"Garden Maintenance",
   verifiedAt:at,evidenceUrl:"https://example.nz/services"}];
  let serviceAreas=supplier?[]:[{name:"Auckland",verifiedAt:at,
   evidenceUrl:"https://example.nz/areas"}],publicLocations=[];
  if(id===priorSupplier)publicLocations=[{name:"Te Puna",verifiedAt:at,
   evidenceUrl:"https://example.nz/nursery"}];
  if(id===twin)serviceAreas=[{name:"New Zealand",verifiedAt:at,
   evidenceUrl:"https://example.nz/delivery"}];
  if(id===green)publicLocations=[{name:"Ōtaki",verifiedAt:at,
   evidenceUrl:"https://example.nz/shop"}];
  if(id===greenspace)serviceAreas=[{name:"Waiheke Island",verifiedAt:at,
   evidenceUrl:"https://example.nz/nzbn",basis:"nzbn_registered_locality"}];
  if(id===provisional)serviceAreas[0].basis="nzbn_registered_locality";
  return {id,slug,name:added?.name||"Existing Gardener "+i,
   description:"Independently reviewed gardening or plant supplier business, with source-backed products, services, reviewed locality and contact permission.",
   kind:supplier?"gardening_supplier":"gardening_service",
   status:"published",approvedForKiwi:true,suppressed:false,approvedAt:at,
   sourcePage:"https://grideater.com/business/"+slug,
   services,serviceAreas,...(supplier?{publicLocations}:{}),
   publicContact:{type:"website",value:"https://example.nz/",
    verifiedAt:at,evidenceUrl:"https://example.nz/contact",
    approvedForPublicUse:true}};
 });
 const feed={schemaVersion:1,source:"grideater.com",releaseId:RELEASE,
  releasedAt:at,approvedForKiwi:true,records};
 const hub='<meta name="robots" content="index,follow">'+
  "Dallas Timpson approved directory. ".repeat(12)+
  "Verified supplier Products &amp; supplies: "+
  records.map(r=>'<article data-gardener-card data-id="'+r.id+'">'+r.id+" "+r.name+
   " "+r.services.map(s=>s.name).join(" ")+
   " "+r.serviceAreas.map(s=>s.name).join(" ")+
   " "+(r.publicLocations||[]).map(s=>s.name).join(" ")+
   '<a href="/gardeners/'+r.slug+'/">View</a></article>').join("");
 const profiles=records.map(r=>{
  let details=r.name+" "+r.id+" "+r.sourcePage+" "+r.publicContact.value+
   " "+r.services.map(s=>s.name).join(" ")+
   " "+r.serviceAreas.map(s=>s.name).join(" ")+
   " "+(r.publicLocations||[]).map(s=>s.name).join(" ");
  if([greenspace,provisional].includes(r.id))
   details+=" Likely local area (NZBN registration), not confirmed as a service or delivery area.";
  if(r.kind==="gardening_supplier"){
   details+=" <h2>Verified products &amp; supplies</h2>";
   if(r.publicLocations.length)details+=
    " <h2>Verified shop or nursery locations</h2> These premises locations do not imply any delivery territory.";
   if(r.serviceAreas.length)details+=" <h2>Verified delivery areas</h2>";
  }
  return '<meta name="robots" content="index,follow"><link rel="canonical" href="'+
   ORIGIN+'/gardeners/'+r.slug+'/">'+details+
   " Approved separate GRID EATER public profile. ".repeat(12);
 });
 const sitemap="<urlset>"+["/gardeners/",...records.map(r=>"/gardeners/"+r.slug+"/")]
  .map(path=>"<loc>"+ORIGIN+path+"</loc>").join("")+"</urlset>";
 const status={schemaVersion:1,source:"grideater.com",
  approvedForKiwi:true,releaseId:RELEASE,publishedListings:21};
 const contact='dallas@kiwigardeners.com <form action="/api/contact"></form>'+
  " Independent Christchurch gardener and customer enquiries. ".repeat(10);
 return {feed,hub,profiles,status,sitemap,contact};
}
test("exact SHA release, 17 retained, 4 approved source new and 3 suppliers",()=>{
 const x=fixture();
 assert.equal(BYTES,28646);
 assert.equal(SHA,"3fb0f4a06e79390068f1dda6eb59e0b2d5361a4a82e5b697fa4188bb75dcb98c");
 assert.equal(ALL.length,21);assert.equal(new Set(ALL).size,21);
 assert.equal(NEW.length,4);
 assert.equal(NEW.filter(x=>x.kind==="gardening_supplier").length,2);
 assert.deepEqual(NEW.map(x=>x.id).sort(),[
  "afnz-9429032462685","afnz-9429032218886","afnz-9429048751926","afnz-9429031205924"
 ].sort());
 assert.equal(verifySource(x.feed,at).length,21);
 const proof=verifyTwentyone(x);
 assert.equal(proof.cards,21);assert.equal(proof.profiles,21);
 assert.equal(proof.sitemapProfiles,21);assert.equal(proof.existingPreserved,17);
 assert.equal(proof.servicesAdded,2);assert.equal(proof.suppliersAdded,2);
 assert.equal(proof.suppliersTotal,3);assert.equal(proof.productionWrites,0);
});
test("source count, supplier vs contractor, provisional territory, contacts and sitemap fail closed",()=>{
 const failures=[
  x=>x.feed.records=x.feed.records.slice(0,20),
  x=>x.feed.records.find(r=>r.id===twin).kind="gardening_service",
  x=>x.feed.records.find(r=>r.id===green).serviceAreas=[{
   name:"New Zealand",verifiedAt:at,evidenceUrl:"https://example.nz"}],
  x=>x.feed.records.find(r=>r.id===twin).publicLocations.push({
   name:"Whangārei public shop",verifiedAt:at,evidenceUrl:"https://example.nz"}),
  x=>x.feed.records.find(r=>r.id===greenspace).serviceAreas[0].basis=undefined,
  x=>x.status.publishedListings=17,
  x=>x.hub=x.hub.replace("data-gardener-card","data-broken"),
  x=>x.profiles[x.feed.records.findIndex(r=>r.id===greenspace)]=
   x.profiles[x.feed.records.findIndex(r=>r.id===greenspace)].replace(
    "not confirmed as a service or delivery area","serves everyone"),
  x=>x.profiles[x.feed.records.findIndex(r=>r.id===twin)]+=
   "<h2>Areas this business says it services</h2>",
  x=>x.feed.records[0].protectedPhone="021123456",
  x=>x.contact=x.contact.replace("dallas@kiwigardeners.com","blocked"),
  x=>x.sitemap=x.sitemap.replace(
   "/gardeners/"+x.feed.records[20].slug+"/","/other-listing/")
 ];
 for(const mutate of failures){
  const x=fixture();mutate(x);
  assert.throws(()=>verifyTwentyone(x),/KG_DIR_10_|public feed rejected/);
 }
});
