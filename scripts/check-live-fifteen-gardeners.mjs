import test from "node:test";
import assert from "node:assert/strict";
import {ORIGIN,RELEASE,SHA,BYTES,PREVIOUS,NEW,ALL,verifySource,verifyFifteen}
 from "./verify-live-fifteen-gardeners.mjs";
const at="2026-11-09T19:22:41.000Z";
function fixture(){
 const records=ALL.map((id,i)=>{
  const newRow=NEW.find(x=>x.id===id);
  const supplier=id==="afnz-9429053251589";
  const slug="test-"+id.slice(5),sourcePage="https://grideater.com/business/"+slug;
  return {id,slug,name:newRow?.name||"Existing Gardener "+i,
   description:"Publicly reviewed gardening business providing services or products as described on its verified source website. Contact the business directly for details and availability.",
   kind:supplier?"gardening_supplier":"gardening_service",status:"published",
   approvedForKiwi:true,suppressed:false,approvedAt:at,sourcePage,
   services:[{name:supplier?"Nursery Plants":"Garden Maintenance",
    verifiedAt:at,evidenceUrl:"https://example.nz/"}],
   serviceAreas:supplier?[]:[{name:"Auckland",verifiedAt:at,evidenceUrl:"https://example.nz/"}],
   ...(supplier?{publicLocations:[{name:"Te Puna",verifiedAt:at,evidenceUrl:"https://example.nz/"}]}:{}),
   publicContact:{type:"website",value:"https://example.nz/",verifiedAt:at,
    evidenceUrl:"https://example.nz/",approvedForPublicUse:true}
  };
 });
 // The first historical locality is an unconfirmed NZBN registration clue.
 records.find(x=>x.id===PREVIOUS[0]).serviceAreas[0].basis="nzbn_registered_locality";
 const feed={schemaVersion:1,source:"grideater.com",
  releaseId:RELEASE,releasedAt:at,approvedForKiwi:true,records};
 const hub='<meta name="robots" content="index,follow">'+
  "Dallas Timpson. Approved native Kiwi directory. ".repeat(10)+
  "Verified supplier Products &amp; supplies: "+
  records.map(x=>'<article data-gardener-card data-id="'+x.id+'">'+
   x.id+" "+x.name+" "+x.services[0].name+" "+
   (x.publicLocations?.[0]?.name||x.serviceAreas[0].name)+
   '<a href="/gardeners/'+x.slug+'/">View</a></article>').join("");
 const profiles=records.map(x=>{
  let details=x.name+" "+x.id+" "+x.sourcePage+" "+x.publicContact.value+" "+
   x.services[0].name+" "+(x.publicLocations?.[0]?.name||x.serviceAreas[0].name);
  if(x.id===PREVIOUS[0])
   details+=" Likely local area (NZBN registration), not confirmed as a service or delivery area.";
  if(x.kind==="gardening_supplier")
   details+=" Verified shop or nursery locations. These premises locations do not imply any delivery territory.";
  return '<meta name="robots" content="index,follow">'+
   '<link rel="canonical" href="'+ORIGIN+'/gardeners/'+x.slug+'/">'+
   details+" Full independently verified profile. ".repeat(9);
 });
 const sitemap="<urlset>"+["/gardeners/",...records.map(x=>"/gardeners/"+x.slug+"/")]
  .map(x=>"<loc>"+ORIGIN+x+"</loc>").join("")+"</urlset>";
 const status={schemaVersion:1,source:"grideater.com",
  approvedForKiwi:true,releaseId:RELEASE,publishedListings:15};
 const contact='dallas@kiwigardeners.com <form action="/api/contact"></form>'+
   "Independent Christchurch gardening service and enquiries. ".repeat(8);
 return {feed,hub,profiles,status,sitemap,contact};
}
test("exact fifteen retains twelve including nursery and adds three services",()=>{
 const x=fixture();
 assert.equal(SHA.length,64);
 assert.equal(BYTES,20795);
 assert.equal(verifySource(x.feed).length,15);
 assert.equal(NEW.filter(x=>x.kind==="gardening_supplier").length,0);
 assert.equal(verifyFifteen(x).cards,15);
 assert.equal(verifyFifteen(x).supplierAdded,0);
 assert.equal(verifyFifteen(x).suppliersRetained,1);
 assert.equal(verifyFifteen(x).productionWrites,0);
});
test("reject missing cards, incorrect source, bad retailer locality and leaks",()=>{
 const changes=[
  x=>x.feed.records=x.feed.records.slice(0,12),
  x=>x.feed.records.find(r=>r.kind==="gardening_supplier").kind="gardening_service",
  x=>x.feed.records.find(r=>r.kind==="gardening_supplier").serviceAreas=[{
   name:"All New Zealand",verifiedAt:at,evidenceUrl:"https://example.nz/"}],
  x=>x.status.publishedListings=12,
  x=>x.hub=x.hub.replace("data-gardener-card","data-missing"),
  x=>x.profiles[0]=x.profiles[0].replace("not confirmed as a service or delivery area","everywhere"),
  x=>x.profiles.findIndex(p=>p.includes("Verified shop or nursery locations"))>=0 &&
    (x.profiles[x.profiles.findIndex(p=>p.includes("Verified shop or nursery locations"))]+="<h2>Verified delivery areas</h2>"),
  x=>x.feed.records[0].protectedPhone="021111111",
  x=>x.contact=x.contact.replace("dallas@kiwigardeners.com","redacted"),
  x=>x.sitemap=x.sitemap.replace("/gardeners/"+x.feed.records[14].slug+"/","/not-approved/")
 ];
 for(const change of changes){
  const x=fixture();change(x);
  assert.throws(()=>verifyFifteen(x),/KG_DIR_07_|public feed rejected/);
 }
});
