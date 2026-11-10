import test from "node:test";
import assert from "node:assert/strict";
import {ORIGIN,RELEASE,SHA,BYTES,NEW,ALL,verifySource,verifySeventeen}
 from "./verify-live-seventeen-gardeners.mjs";
const at="2026-11-09T23:05:20.000Z";
function fixture(){
 const rows=ALL.map((id,i)=>{
  const added=NEW.find(x=>x.id===id),supplier=id==="afnz-9429053251589";
  const slug="test-"+id.slice(5),sourcePage="https://grideater.com/business/"+slug;
  return {id,slug,name:added?.name||"Existing Gardener "+i,
   description:"Independently verified business offers gardening services and products, with actual service locations and evidence from its official source pages.",
   kind:supplier?"gardening_supplier":"gardening_service",
   status:"published",approvedForKiwi:true,suppressed:false,approvedAt:at,
   sourcePage,services:[{name:supplier?"Nursery Plants":"Garden Maintenance",
    verifiedAt:at,evidenceUrl:"https://example.nz/services"}],
   serviceAreas:supplier?[]:[{name:"Auckland",verifiedAt:at,evidenceUrl:"https://example.nz/areas"}],
   ...(supplier?{publicLocations:[{name:"Te Puna",verifiedAt:at,evidenceUrl:"https://example.nz/nursery"}]}:{}),
   publicContact:{type:"website",value:"https://example.nz/",
    verifiedAt:at,evidenceUrl:"https://example.nz/contact",approvedForPublicUse:true}
  };
 });
 rows.find(x=>x.id==="afnz-9429030118973").serviceAreas[0].basis="nzbn_registered_locality";
 const feed={schemaVersion:1,source:"grideater.com",releaseId:RELEASE,
  releasedAt:at,approvedForKiwi:true,records:rows};
 const hub='<meta name="robots" content="index,follow">'+
  "Dallas Timpson. Approved native Kiwi directory. ".repeat(10)+
  "Verified supplier Products &amp; supplies: "+
  rows.map(r=>'<article data-gardener-card data-id="'+r.id+'">'+r.id+" "+r.name+" "+
   r.services[0].name+" "+(r.publicLocations?.[0]?.name||r.serviceAreas[0].name)+
   '<a href="/gardeners/'+r.slug+'/">View</a></article>').join("");
 const profiles=rows.map(r=>{
  let details=r.name+" "+r.id+" "+r.sourcePage+" "+r.publicContact.value+" "+
   r.services[0].name+" "+(r.publicLocations?.[0]?.name||r.serviceAreas[0].name);
  if(r.id==="afnz-9429030118973")
   details+=" Likely local area (NZBN registration), not confirmed as a service or delivery area.";
  if(r.kind==="gardening_supplier")
   details+=" Verified shop or nursery locations. These premises locations do not imply any delivery territory.";
  return '<meta name="robots" content="index,follow"><link rel="canonical" href="'+
   ORIGIN+'/gardeners/'+r.slug+'/">'+details+
   " Approved separate GRID EATER public profile. ".repeat(12);
 });
 const sitemap="<urlset>"+["/gardeners/",...rows.map(r=>"/gardeners/"+r.slug+"/")]
  .map(path=>"<loc>"+ORIGIN+path+"</loc>").join("")+"</urlset>";
 const status={schemaVersion:1,source:"grideater.com",
  approvedForKiwi:true,releaseId:RELEASE,publishedListings:17};
 const contact='dallas@kiwigardeners.com <form action="/api/contact"></form>'+
  " Independent Christchurch gardening service and enquiries. ".repeat(10);
 return {feed,hub,profiles,status,sitemap,contact};
}
test("exact 17 reviewed release retains 15 and two real services; nursery stays shop-only",()=>{
 const x=fixture();
 assert.equal(BYTES,23443);
 assert.equal(SHA,"5bb88613586882387bd0cdd8946413e7a27f0b2689a0b7700728f11a16359af0");
 assert.equal(ALL.length,17);
 assert.equal(new Set(ALL).size,17);
 assert.equal(NEW.length,2);
 assert.deepEqual(NEW.map(x=>x.id).sort(),[
  "afnz-9429038286858","afnz-9429047194632"].sort());
 assert.equal(verifySource(x.feed,at).length,17);
 const z=verifySeventeen(x);
 assert.equal(z.cards,17);
 assert.equal(z.existingPreserved,15);
 assert.equal(z.servicesAdded,2);
 assert.equal(z.suppliersRetained,1);
 assert.equal(z.productionWrites,0);
});
test("wrong source, 16 cards, fake territory, tampering and protected contact fail closed",()=>{
 const moves=[
  x=>x.feed.records=x.feed.records.slice(0,16),
  x=>x.feed.records.find(r=>r.kind==="gardening_supplier").kind="gardening_service",
  x=>x.feed.records.find(r=>r.kind==="gardening_supplier").serviceAreas=[{
   name:"All New Zealand",verifiedAt:at,evidenceUrl:"https://example.nz"}],
  x=>x.status.publishedListings=15,
  x=>x.hub=x.hub.replace("data-gardener-card","data-missing"),
  x=>x.profiles[0]=x.profiles[0].replace("not confirmed as a service or delivery area","everywhere"),
  x=>x.profiles[x.profiles.findIndex(p=>p.includes("Verified shop or nursery locations"))]+="<h2>Verified delivery areas</h2>",
  x=>x.feed.records[0].protectedPhone="021111111",
  x=>x.contact=x.contact.replace("dallas@kiwigardeners.com","redacted"),
  x=>x.sitemap=x.sitemap.replace("/gardeners/"+x.feed.records[16].slug+"/","/unapproved/")
 ];
 for(const mutate of moves){
  const x=fixture();mutate(x);
  assert.throws(()=>verifySeventeen(x),/KG_DIR_09_|public feed rejected/);
 }
});
