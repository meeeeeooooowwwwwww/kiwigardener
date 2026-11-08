import test from "node:test";
import assert from "node:assert/strict";
import {LISTINGS,verifyThree}
 from "./verify-live-three-gardeners.mjs";
function fixture(){
 const o="https://kiwigardeners.com";
 const hub='<meta name="robots" content="index,follow">'+
  '<section>Dallas Timpson</section>'+LISTINGS.map(t=>
   '<article data-gardener-card><span>'+t.name+" "+t.id+" "+t.area+
   '</span><a href="/gardeners/'+t.slug+'/">View</a></article>').join("")+
   "Contact Dallas for gardening in Christchurch. ".repeat(10);
 const profiles=LISTINGS.map((t,i)=>'<meta name="robots" content="index,follow">'+
   '<link rel="canonical" href="'+o+'/gardeners/'+t.slug+'/">'+
   t.name+" "+t.id+" "+t.area+" https://grideater.com/business/"+t.slug+
   (i===2?" Likely local area (NZBN registration) - not confirmed as a service or delivery area":"")+
   "This is a canonical independent gardening business profile. ".repeat(8));
 const sitemap='<urlset>'+["/gardeners/",...LISTINGS.map(x=>"/gardeners/"+x.slug+"/")]
  .map(x=>"<loc>"+o+x+"</loc>").join("")+"</urlset>";
 const status={schemaVersion:1,source:"grideater.com",approvedForKiwi:true,
  releaseId:"kg-first-three-20261108193606",publishedListings:3};
 const contact='<form action="/api/contact"></form>dallas@kiwigardeners.com '+
  "Kiwi Gardeners offers lawn mowing, hedge trimming and garden cleanups. ".repeat(8);
 return {hub,profiles,status,sitemap,contact};
}
test("exact published v1 three business profiles, Kiwi hub/sitemap and Dallas separation",()=>{
 const p=fixture();const result=verifyThree(p);
 assert.equal(result.records,3);
 assert.equal(result.twoNewBusinesses,2);
 assert.equal(result.sitemapProfiles,3);
 assert.equal(result.privateDataExposed,false);
 assert.equal(result.productionWrites,0);
});
test("a stale one-record build, missing or misrepresented Mosgiel and private contact fail closed",()=>{
 for(const change of [
  p=>{p.status.publishedListings=1;},
  p=>{p.status.releaseId="kg-wordsworth-20261108083040";},
  p=>{p.hub=p.hub.replace("data-gardener-card","missing-card");},
  p=>{p.profiles[2]=p.profiles[2].replace("not confirmed as a service or delivery area","we cover all of NZ");},
  p=>{p.sitemap=p.sitemap.replace("/gardeners/tjr-groundworks-9429030118973/","/wrong/");},
  p=>{p.hub+=" privateContact 162 Travis Road";},
  p=>{p.contact=p.contact.replace("dallas@kiwigardeners.com","nobody@example.test");}
 ]){
  const v=fixture();change(v);
  assert.throws(()=>verifyThree(v),/KG_DIR_03_/);
 }
});
