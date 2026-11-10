#!/usr/bin/env node
/**
 * KG-DIR-10: verify exact 17 retained + four newly source-reviewed
 * GRID-approved gardening services/suppliers on Kiwi native HTML.
 * Read-only public HTTP. Not a deploy or a second business master.
 */
import {createHash} from "node:crypto";
import {pathToFileURL} from "node:url";
import {validateGridEaterPublicGardeners} from "../src/gardener-directory.mjs";
import {ALL as PRIOR_SEVENTEEN} from "./verify-live-seventeen-gardeners.mjs";
export const ORIGIN="https://kiwigardeners.com";
export const SOURCE="https://grideater.com/feeds/gardeners/v1.json";
export const RELEASE="kg-reviewed-four-20261110022228";
export const SHA="3fb0f4a06e79390068f1dda6eb59e0b2d5361a4a82e5b697fa4188bb75dcb98c";
export const BYTES=28646;
export const NEW=Object.freeze([
 Object.freeze({id:"afnz-9429032462685",name:"Untangled Landscapes Ltd",kind:"gardening_service"}),
 Object.freeze({id:"afnz-9429032218886",name:"The Greenspace Landscape Company Limited",kind:"gardening_service"}),
 Object.freeze({id:"afnz-9429048751926",name:"Twin Falls Nursery",kind:"gardening_supplier"}),
 Object.freeze({id:"afnz-9429031205924",name:"Greenlife Perennials",kind:"gardening_supplier"})
]);
export const ALL=Object.freeze([...PRIOR_SEVENTEEN,...NEW.map(x=>x.id)].sort());
const fail=c=>{throw Error("KG_DIR_10_"+c+"_HOLD");};
const hash=b=>createHash("sha256").update(b).digest("hex");

export function verifySource(feed,now=new Date().toISOString()){
 const data=validateGridEaterPublicGardeners(feed,{now});
 if(data.schemaVersion!==1||data.source!=="grideater.com"||
  data.releaseId!==RELEASE||data.approvedForKiwi!==true||
  data.records.length!==21||ALL.length!==21||
  JSON.stringify(data.records.map(x=>x.id))!==JSON.stringify(ALL))
  fail("RELEASE_IDENTITY");
 const retained=data.records.filter(x=>PRIOR_SEVENTEEN.includes(x.id));
 const added=data.records.filter(x=>NEW.some(y=>y.id===x.id));
 const suppliers=data.records.filter(x=>x.kind==="gardening_supplier");
 if(retained.length!==17||added.length!==4||suppliers.length!==3||
  retained.filter(x=>x.kind==="gardening_supplier").length!==1||
  added.filter(x=>x.kind==="gardening_supplier").length!==2||
  added.filter(x=>x.kind==="gardening_service").length!==2||
  added.some(x=>{
   const wanted=NEW.find(y=>y.id===x.id);
   return x.name!==wanted?.name||x.kind!==wanted?.kind||x.services.length<1;
  })||
  data.records.some(x=>x.status!=="published"||x.suppressed!==false||
   x.approvedForKiwi!==true||
   x.sourcePage!=="https://grideater.com/business/"+x.slug||
   !["website","grid_profile"].includes(x.publicContact?.type)||
   x.publicContact?.approvedForPublicUse!==true||
   ["privateContact","protectedPhone","streetAddress","rawNZBN"].some(k=>Object.hasOwn(x,k))))
  fail("REVIEWED_CATEGORY_AND_CONTACT");
 const first=data.records.find(x=>x.id==="afnz-9429053251589");
 const twin=data.records.find(x=>x.id==="afnz-9429048751926");
 const greenlife=data.records.find(x=>x.id==="afnz-9429031205924");
 const greenspace=data.records.find(x=>x.id==="afnz-9429032218886");
 if(first?.serviceAreas?.length!==0||first.publicLocations?.length!==1||
  first.publicLocations[0].name!=="Te Puna"||
  twin?.publicLocations?.length!==0||twin.serviceAreas?.length!==1||
  twin.serviceAreas[0].name!=="New Zealand"||twin.serviceAreas[0].basis||
  greenlife?.serviceAreas?.length!==0||greenlife.publicLocations?.length!==1||
  greenlife.publicLocations[0].name!=="Ōtaki"||
  greenspace?.serviceAreas?.length!==1||
  greenspace.serviceAreas[0].basis!=="nzbn_registered_locality"||
  greenspace.serviceAreas[0].name!=="Waiheke Island")
  fail("SUPPLIERS_AND_PROVISIONAL_AREA");
 return data.records;
}
export function verifyTwentyone({feed,hub,profiles,status,sitemap,contact}={}){
 const rows=verifySource(feed);
 if(!Array.isArray(profiles)||profiles.length!==21||
  ![hub,sitemap,contact,...profiles].every(x=>typeof x==="string"&&x.length>200))
  fail("MISSING_HTML");
 if(status?.schemaVersion!==1||status.source!=="grideater.com"||
  status.approvedForKiwi!==true||status.releaseId!==RELEASE||
  status.publishedListings!==21)fail("STATUS");
 if((hub.match(/data-gardener-card(?:\s|>)/g)||[]).length!==21||
  !hub.includes('name="robots" content="index,follow'))
  fail("HUB_CARDS_INDEX");
 for(const [i,row] of rows.entries()){
  const path="/gardeners/"+row.slug+"/",profile=profiles[i];
  if(!hub.includes(row.name)||!hub.includes(row.id)||
   !hub.includes('href="'+path+'"')||
   !profile.includes(row.name)||!profile.includes(row.id)||
   !profile.includes('<link rel="canonical" href="'+ORIGIN+path+'"')||
   !profile.includes('name="robots" content="index,follow')||
   !profile.includes(row.sourcePage)||!profile.includes(row.publicContact.value)||
   !sitemap.includes("<loc>"+ORIGIN+path+"</loc>"))fail("PROFILE_"+i);
  for(const x of [...row.services,...row.serviceAreas,...(row.publicLocations||[])])
   if(!hub.includes(x.name)||!profile.includes(x.name))fail("EVIDENCE_"+i);
 }
 const profile=id=>profiles[rows.findIndex(x=>x.id===id)];
 const original=profile("afnz-9429053251589");
 if(!original.includes("Verified shop or nursery locations")||
  !original.includes("Te Puna")||
  !original.includes("These premises locations do not imply any delivery territory")||
  original.includes("<h2>Verified delivery areas</h2>"))
  fail("OLD_NURSERY_NOT_CONTRACTOR");
 const twin=profile("afnz-9429048751926");
 if(!twin.includes("<h2>Verified products &amp; supplies</h2>")||
  !twin.includes("<h2>Verified delivery areas</h2>")||
  !twin.includes("New Zealand")||
  twin.includes("<h2>Verified shop or nursery locations</h2>")||
  twin.includes("<h2>Areas this business says it services</h2>"))
  fail("TWIN_SUPPLIER_SHIPPING_NOT_CONTRACTOR");
 const green=profile("afnz-9429031205924");
 if(!green.includes("<h2>Verified products &amp; supplies</h2>")||
  !green.includes("<h2>Verified shop or nursery locations</h2>")||
  !green.includes("Ōtaki")||
  green.includes("<h2>Verified delivery areas</h2>")||
  green.includes("<h2>Areas this business says it services</h2>"))
  fail("GREENLIFE_SUPPLIER_SHOP_ONLY");
 for(const id of ["afnz-9429030118973","afnz-9429032218886"]){
  const p=profile(id);
  if(!p.includes("Likely local area (NZBN registration)")||
   !p.includes("not confirmed as a service or delivery area"))
   fail("NZBN_PROVISIONAL_NOT_CONFIRMED");
 }
 if(!hub.includes("Products &amp; supplies:")||
  !hub.includes("Verified supplier")||
  !sitemap.includes("<loc>"+ORIGIN+"/gardeners/</loc>")||
  !hub.includes("Dallas Timpson")||
  !contact.includes("dallas@kiwigardeners.com")||
  !contact.includes('action="/api/contact"'))
  fail("DALLAS_SUPPLIER_DIRECTORY");
 const profilesInSitemap=(sitemap.match(/<loc>https:\/\/kiwigardeners\.com\/gardeners\/[^<]+\/<\/loc>/g)||[]);
 if(profilesInSitemap.length!==21||new Set(profilesInSitemap).size!==21)
  fail("SITEMAP_EXACT_COUNT");
 const visible=hub+"\n"+profiles.join("\n");
 for(const secret of ["wordsworthgardensnz@gmail.com","0275918334",
  "162 Travis Road","privateContact","protectedPhone","rawNZBN"])
  if(visible.includes(secret))fail("PROTECTED_CONTACT_LEAK");
 return {state:"TWENTYONE_APPROVED_GRID_GARDENING_BUSINESSES_LIVE",
  releaseId:RELEASE,sourceSha256:SHA,existingPreserved:17,
  servicesAdded:2,suppliersAdded:2,suppliersTotal:3,
  cards:21,profiles:21,sitemapProfiles:21,
  provisionalNzbnTownLabelled:true,dallasSeparate:true,
  d1Reads:0,productionWrites:0,publicRequests:26};
}
async function get(url,type="text/html"){
 let res;try{res=await fetch(url,{method:"GET",redirect:"manual",
  signal:AbortSignal.timeout(16000),
  headers:{accept:type,"user-agent":"KiwiGardeners-KG-DIR-10-twentyone/1.0"}});}
 catch{fail("NETWORK");}
 if(res.status!==200||!(res.headers.get("content-type")||"").includes(type))
  fail("HTTP_OR_TYPE");
 const bytes=Buffer.from(await res.arrayBuffer());
 if(bytes.length<50||bytes.length>1200000)fail("SIZE");
 return bytes;
}
export async function verifyLive(){
 const source=await get(SOURCE,"application/json");
 if(source.length!==BYTES||hash(source)!==SHA)fail("GRID_SOURCE_SHA");
 let feed;try{feed=JSON.parse(source.toString("utf8"));}
 catch{fail("SOURCE_JSON");}
 const rows=verifySource(feed);
 const paths=[
  {url:"/gardeners/",type:"text/html"},
  ...rows.map(x=>({url:"/gardeners/"+x.slug+"/",type:"text/html"})),
  {url:"/assets/gardener-directory-status.json",type:"application/json"},
  {url:"/sitemap.xml",type:"xml"},
  {url:"/contact/",type:"text/html"}
 ];
 const values=await Promise.all(paths.map(x=>get(ORIGIN+x.url,x.type)));
 let status;try{status=JSON.parse(values[22].toString("utf8"));}
 catch{fail("STATUS_JSON");}
 return verifyTwentyone({feed,hub:values[0].toString("utf8"),
  profiles:values.slice(1,22).map(x=>x.toString("utf8")),
  status,sitemap:values[23].toString("utf8"),
  contact:values[24].toString("utf8")});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 verifyLive().then(x=>console.log("KG_DIR_10_LIVE_TWENTYONE="+JSON.stringify(x)))
 .catch(e=>{const m=String(e?.message||"");
  console.error(/^KG_DIR_10_[A-Z0-9_]+_HOLD$/.test(m)?m:
   "KG_DIR_10_PUBLIC_FAILED_CLOSED");process.exitCode=1;});
