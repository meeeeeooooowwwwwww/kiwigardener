#!/usr/bin/env node
/**
 * KG-DIR-09 | independently prove 15 retained + 2 new GRID-approved
 * gardening businesses on Kiwi native pages. READ ONLY public HTTP.
 */
import {createHash} from "node:crypto";
import {pathToFileURL} from "node:url";
import {validateGridEaterPublicGardeners}
 from "../src/gardener-directory.mjs";
import {ALL as PREVIOUS_FIFTEEN}
 from "./verify-live-fifteen-gardeners.mjs";
export const ORIGIN="https://kiwigardeners.com";
export const SOURCE="https://grideater.com/feeds/gardeners/v1.json";
export const RELEASE="kg-reviewed-two-20261109230520";
export const SHA="5bb88613586882387bd0cdd8946413e7a27f0b2689a0b7700728f11a16359af0";
export const BYTES=23443;
export const NEW=Object.freeze([
 Object.freeze({id:"afnz-9429038286858",name:"WAI-ORA FOREST LANDSCAPES LIMITED",
  kind:"gardening_service"}),
 Object.freeze({id:"afnz-9429047194632",name:"Precision Tree Services",
  kind:"gardening_service"})
]);
export const ALL=Object.freeze([...PREVIOUS_FIFTEEN,...NEW.map(x=>x.id)].sort());
const fail=c=>{throw Error("KG_DIR_09_"+c+"_HOLD");};
const hash=b=>createHash("sha256").update(b).digest("hex");
export function verifySource(feed,now=new Date().toISOString()){
 const data=validateGridEaterPublicGardeners(feed,{now});
 if(data.schemaVersion!==1||data.source!=="grideater.com"||
  data.releaseId!==RELEASE||data.approvedForKiwi!==true||
  data.records.length!==17||ALL.length!==17||
  JSON.stringify(data.records.map(x=>x.id))!==JSON.stringify(ALL))
  fail("RELEASE_IDENTITY");
 const retained=data.records.filter(x=>PREVIOUS_FIFTEEN.includes(x.id));
 const added=data.records.filter(x=>NEW.some(y=>y.id===x.id));
 if(retained.length!==15||added.length!==2||
  retained.filter(x=>x.kind==="gardening_supplier").length!==1||
  added.some(x=>{
   const wanted=NEW.find(z=>z.id===x.id);
   return x.name!==wanted.name||x.kind!==wanted.kind||
    x.services.length<1||x.serviceAreas.length<1;
  })||
  data.records.some(x=>x.status!=="published"||x.suppressed!==false||
   x.approvedForKiwi!==true||
   x.sourcePage!=="https://grideater.com/business/"+x.slug||
   !["website","grid_profile"].includes(x.publicContact?.type)||
   x.publicContact?.approvedForPublicUse!==true||
   ["privateContact","protectedPhone","streetAddress","rawNZBN"]
    .some(k=>Object.hasOwn(x,k))))
  fail("REVIEWED_CATEGORY_AND_CONTACT");
 const nursery=retained.find(x=>x.id==="afnz-9429053251589");
 if(nursery?.serviceAreas?.length!==0||
  nursery.publicLocations?.length!==1||
  nursery.publicLocations[0].name!=="Te Puna")
  fail("NURSERY_PREMISES_VS_TERRITORY");
 return data.records;
}
export function verifySeventeen({feed,hub,profiles,status,sitemap,contact}={}){
 const rows=verifySource(feed);
 if(!Array.isArray(profiles)||profiles.length!==17||
  ![hub,sitemap,contact,...profiles].every(x=>typeof x==="string"&&x.length>200))
  fail("MISSING_HTML");
 if(status?.schemaVersion!==1||status.source!=="grideater.com"||
  status.approvedForKiwi!==true||status.releaseId!==RELEASE||
  status.publishedListings!==17)fail("STATUS");
 if((hub.match(/data-gardener-card(?:\s|>)/g)||[]).length!==17||
  !hub.includes('name="robots" content="index,follow'))
  fail("HUB_CARDS_INDEX");
 for(const [i,row] of rows.entries()){
  const url="/gardeners/"+row.slug+"/",profile=profiles[i];
  if(!hub.includes(row.name)||!hub.includes(row.id)||
   !hub.includes('href="'+url+'"')||
   !profile.includes(row.name)||!profile.includes(row.id)||
   !profile.includes('<link rel="canonical" href="'+ORIGIN+url+'"')||
   !profile.includes('name="robots" content="index,follow')||
   !profile.includes(row.sourcePage)||
   !profile.includes(row.publicContact.value)||
   !sitemap.includes("<loc>"+ORIGIN+url+"</loc>"))
   fail("PROFILE_"+i);
  for(const x of [...row.services,...row.serviceAreas,...(row.publicLocations||[])])
   if(!hub.includes(x.name)||!profile.includes(x.name))
    fail("EVIDENCE_"+i);
 }
 const nursery=rows.find(x=>x.kind==="gardening_supplier");
 const nurseryHtml=profiles[rows.indexOf(nursery)];
 if(!nurseryHtml.includes("Verified shop or nursery locations")||
  !nurseryHtml.includes("Te Puna")||
  !nurseryHtml.includes("These premises locations do not imply any delivery territory")||
  nurseryHtml.includes("<h2>Verified delivery areas</h2>")||
  nurseryHtml.includes("<h2>Areas this business says it services</h2>")||
  !hub.includes("Products &amp; supplies:")||
  !hub.includes("Verified supplier"))
  fail("NURSERY_NOT_CONTRACTOR");
 const provisional=rows.find(x=>x.id==="afnz-9429030118973");
 const provisionalHtml=profiles[rows.indexOf(provisional)];
 if(!provisionalHtml.includes("Likely local area (NZBN registration)")||
  !provisionalHtml.includes("not confirmed as a service or delivery area"))
  fail("NZBN_TOWN_NOT_CONFIRMED_SERVES");
 if(!sitemap.includes("<loc>"+ORIGIN+"/gardeners/</loc>")||
  !hub.includes("Dallas Timpson")||
  !contact.includes("dallas@kiwigardeners.com")||
  !contact.includes('action="/api/contact"'))
  fail("DALLAS_INDEPENDENT");
 const visible=hub+"\n"+profiles.join("\n");
 for(const secret of ["wordsworthgardensnz@gmail.com","0275918334",
  "162 Travis Road","privateContact","protectedPhone"])
  if(visible.includes(secret))fail("PROTECTED_CONTACT_LEAK");
 return {state:"SEVENTEEN_APPROVED_GRID_GARDENING_BUSINESSES_LIVE",
  releaseId:RELEASE,sourceSha256:SHA,
  existingPreserved:15,servicesAdded:2,supplierAdded:0,suppliersRetained:1,
  cards:17,profiles:17,sitemapProfiles:17,
  nurseryContractingClaims:0,dallasSeparate:true,
  d1Reads:0,productionWrites:0,publicRequests:22};
}
async function get(url,type="text/html"){
 let res;try{res=await fetch(url,{method:"GET",redirect:"manual",
  signal:AbortSignal.timeout(16000),
  headers:{accept:type,"user-agent":"KiwiGardeners-KG-DIR-09-seventeen/1.0"}});}
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
 let status;try{status=JSON.parse(values[18].toString("utf8"));}
 catch{fail("STATUS_JSON");}
 return verifySeventeen({feed,hub:values[0].toString("utf8"),
  profiles:values.slice(1,18).map(x=>x.toString("utf8")),
  status,sitemap:values[19].toString("utf8"),
  contact:values[20].toString("utf8")});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 verifyLive().then(x=>console.log("KG_DIR_09_LIVE_SEVENTEEN="+JSON.stringify(x)))
 .catch(e=>{const m=String(e?.message||"");
  console.error(/^KG_DIR_09_[A-Z0-9_]+_HOLD$/.test(m)?m:
   "KG_DIR_09_PUBLIC_FAILED_CLOSED");process.exitCode=1;});
