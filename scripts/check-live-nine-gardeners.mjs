import test from "node:test";
import assert from "node:assert/strict";
import {RELEASE,SHA,PREVIOUS,ADDITIONS,ORIGIN,verifySource,verifyNine}
 from "./verify-live-nine-gardeners.mjs";
function fixture(){
 const ids=[...PREVIOUS,...ADDITIONS];
 const names=["TJR Groundworks","Waitakere Tree Services","Wordsworth Gardens",
  "Xanthe White Design","Green Therapy","Tree Menders Limited",
  "Total Trees Limited","AJ LANDSCAPING AND EARTHWORKS LIMITED",
  "BLACKBIRD PROJECTS LIMITED"];
 const records=ids.map((id,i)=>{
  const slug=names[i].toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-"+id.slice(5);
  return {id,slug,name:names[i],kind:"gardening_service",
   status:"published",approvedForKiwi:true,suppressed:false,
   sourcePage:"https://grideater.com/business/"+slug,
   services:[{name:"Garden maintenance"}],
   serviceAreas:[{name:i===0?"Mosgiel":"Auckland"}],
   publicContact:{type:"website",value:"https://example.com/"+i,
    approvedForPublicUse:true}
  };
 });
 const feed={schemaVersion:1,source:"grideater.com",
  releaseId:RELEASE,approvedForKiwi:true,records};
 const hub='<meta name="robots" content="index,follow">'+
  "Dallas Timpson is the gardener behind Kiwi Gardeners. ".repeat(6)+
  records.map(x=>'<article data-gardener-card>'+
    x.id+" "+x.name+" "+x.services[0].name+" "+x.serviceAreas[0].name+
    '<a href="/gardeners/'+x.slug+'/">View</a></article>').join("");
 const profiles=records.map(x=>'<meta name="robots" content="index,follow">'+
  '<link rel="canonical" href="'+ORIGIN+'/gardeners/'+x.slug+'/">'+
  x.name+" "+x.id+" "+x.sourcePage+" "+x.publicContact.value+
  " Garden maintenance "+x.serviceAreas[0].name+
  (x.id===PREVIOUS[0]?" Likely local area (NZBN registration); not confirmed as a service or delivery area.":"")+
  " Full profile with independent evidence and garden maintenance details. ".repeat(7));
 const sitemap='<urlset>'+["/gardeners/",...records.map(x=>"/gardeners/"+x.slug+"/")]
  .map(x=>"<loc>"+ORIGIN+x+"</loc>").join("")+"</urlset>";
 const status={schemaVersion:1,source:"grideater.com",releaseId:RELEASE,
  approvedForKiwi:true,publishedListings:9};
 const contact='dallas@kiwigardeners.com <form action="/api/contact"></form>'+
  " Independently contact Dallas for lawn mowing and garden clean-ups. ".repeat(8);
 return {feed,hub,profiles,status,sitemap,contact};
}
test("nine public approved records have source identity and safe website contact",()=>{
 const v=fixture();
 assert.equal(SHA.length,64);
 assert.equal(verifySource(v.feed).length,9);
 assert.equal(verifyNine(v).liveProfiles,9);
 assert.equal(verifyNine(v).priorPreserved,3);
 assert.equal(verifyNine(v).newReviewed,6);
 assert.equal(verifyNine(v).productionWrites,0);
});
test("new release cannot silently accept stale three, wrong town or suppressed IDs",()=>{
 for(const mutate of [
  v=>v.feed.records=v.feed.records.slice(0,3),
  v=>v.status.publishedListings=3,
  v=>v.hub=v.hub.replace("data-gardener-card","data-missing"),
  v=>v.profiles[0]=v.profiles[0].replace("not confirmed as a service or delivery area","all New Zealand"),
  v=>v.profiles[4]=v.profiles[4].replace("https://example.com/4","missing contact"),
  v=>v.feed.records[4].protectedPhone="private",
  v=>v.contact=v.contact.replace("dallas@kiwigardeners.com","missing address"),
  v=>v.sitemap=v.sitemap.replace("/gardeners/"+v.feed.records[8].slug+"/","/wrong/")
 ]){
  const f=fixture();mutate(f);
  assert.throws(()=>verifyNine(f),/KG_DIR_05_/);
 }
});
