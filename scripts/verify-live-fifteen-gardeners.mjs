#!/usr/bin/env node
/**
 * KG-DIR-08 | independent public GRID SHA and Kiwi NATIVE 15-record acceptance.
 * 12 prior listings preserved (including the Te Puna nursery),
 * 3 new verified gardening services. Read-only public HTTP.
 */
import {createHash} from "node:crypto";
import {pathToFileURL} from "node:url";
import {validateGridEaterPublicGardeners} from "../src/gardener-directory.mjs";
export const ORIGIN="https://kiwigardeners.com";
export const SOURCE="https://grideater.com/feeds/gardeners/v1.json";
export const RELEASE="kg-reviewed-three-20261109192241";
export const SHA="d6d093d7bc15a23d2503bd03cf85aee0cb4f2ca583094a6d7e75e7252a5afc86";
export const BYTES=20795;
export const PREVIOUS=Object.freeze([
 "afnz-9429030118973","afnz-9429030218079","afnz-9429052264047",
 "afnz-9429030692930","afnz-9429030717848","afnz-9429030835122",
 "afnz-9429031475198","afnz-9429035743651","afnz-9429042015826",
 "afnz-9429042187806","afnz-9429042288992","afnz-9429053251589"
]);
export const NEW=Object.freeze([
 {id:"afnz-9429035277972",kind:"gardening_service",name:"GROUNDCOVER LANDSCAPING LIMITED"},
 {id:"afnz-9429038261206",kind:"gardening_service",name:"SECOND NATURE GARDENS LIMITED"},
 {id:"afnz-9429041384633",kind:"gardening_service",name:"TREEMENDOUS TREE SERVICE LIMITED"}
]);
export const ALL=Object.freeze([...PREVIOUS,...NEW.map(x=>x.id)].sort());
const fail=x=>{throw Error("KG_DIR_08_"+x+"_HOLD");};
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");

export function verifySource(feed,at=new Date().toISOString()){
 const approved=validateGridEaterPublicGardeners(feed,{now:at});
 if(approved.schemaVersion!==1||approved.source!=="grideater.com"||
  approved.releaseId!==RELEASE||approved.approvedForKiwi!==true||
  approved.records.length!==15||
  JSON.stringify(approved.records.map(x=>x.id))!==JSON.stringify(ALL))
  fail("SOURCE_IDENTITY");
 const old=approved.records.filter(x=>PREVIOUS.includes(x.id));
 const additions=approved.records.filter(x=>NEW.some(z=>z.id===x.id));
 if(old.length!==12||additions.length!==3||
  old.filter(x=>x.kind==="gardening_supplier").length!==1||
  additions.some(x=>{
   const t=NEW.find(z=>z.id===x.id);
   return x.name!==t.name||x.kind!==t.kind;
  })||
  approved.records.some(x=>x.status!=="published"||x.suppressed!==false||
   x.approvedForKiwi!==true||
   x.sourcePage!=="https://grideater.com/business/"+x.slug||
   !["website","grid_profile"].includes(x.publicContact?.type)||
   x.publicContact?.approvedForPublicUse!==true||
   ["privateContact","protectedPhone","streetAddress","rawNZBN"]
    .some(k=>Object.hasOwn(x,k))))
  fail("SOURCE_PRIVACY");
 const nursery=old.find(x=>x.id==="afnz-9429053251589");
 if(nursery?.id!=="afnz-9429053251589"||
  nursery.serviceAreas.length!==0||nursery.publicLocations?.length!==1||
  nursery.publicLocations[0].name!=="Te Puna")
  fail("NURSERY_LOCATION");
 return approved.records;
}
export function verifyFifteen({feed,hub,profiles,status,sitemap,contact}){
 const records=verifySource(feed);
 if(!Array.isArray(profiles)||profiles.length!==15||
  ![hub,sitemap,contact,...profiles].every(x=>typeof x==="string"&&x.length>200))
  fail("BODIES");
 if(status?.schemaVersion!==1||status.source!=="grideater.com"||
  status.approvedForKiwi!==true||status.releaseId!==RELEASE||
  status.publishedListings!==15)fail("STATUS");
 if((hub.match(/data-gardener-card(?:\s|>)/g)||[]).length!==15||
  !hub.includes('name="robots" content="index,follow'))
  fail("HUB_COUNT");
 for(const [i,row] of records.entries()){
  const url="/gardeners/"+row.slug+"/",p=profiles[i];
  if(!hub.includes(row.name)||!hub.includes(row.id)||
   !hub.includes('href="'+url+'"')||
   !p.includes(row.name)||!p.includes(row.id)||
   !p.includes('<link rel="canonical" href="'+ORIGIN+url+'"')||
   !p.includes('name="robots" content="index,follow')||
   !p.includes(row.sourcePage)||!p.includes(row.publicContact.value)||
   !sitemap.includes("<loc>"+ORIGIN+url+"</loc>"))
   fail("PROFILE_"+i);
  for(const x of [...row.services,...row.serviceAreas,...(row.publicLocations||[])])
   if(!hub.includes(x.name)||!p.includes(x.name))
    fail("EVIDENCE_"+i);
 }
 const nursery=records.find(x=>x.kind==="gardening_supplier");
 const supplierHtml=profiles[records.indexOf(nursery)];
 if(!supplierHtml.includes("Verified shop or nursery locations")||
  !supplierHtml.includes("Te Puna")||
  !supplierHtml.includes("These premises locations do not imply any delivery territory")||
  supplierHtml.includes("<h2>Verified delivery areas</h2>")||
  supplierHtml.includes("<h2>Areas this business says it services</h2>")||
  !hub.includes("Products &amp; supplies:")||
  !hub.includes("Verified supplier"))
  fail("NURSERY_NOT_CONTRACTOR");
 const provisional=records.find(x=>x.id==="afnz-9429030118973");
 const prevHtml=profiles[records.indexOf(provisional)];
 if(!prevHtml.includes("Likely local area (NZBN registration)")||
  !prevHtml.includes("not confirmed as a service or delivery area"))
  fail("PROVISIONAL_TOWN");
 if(!sitemap.includes("<loc>"+ORIGIN+"/gardeners/</loc>")||
  !hub.includes("Dallas Timpson")||
  !contact.includes("dallas@kiwigardeners.com")||
  !contact.includes('action="/api/contact"'))
  fail("INDEPENDENT_HOUSE");
 const visible=hub+"\n"+profiles.join("\n");
 for(const secret of ["wordsworthgardensnz@gmail.com","0275918334",
  "162 Travis Road","privateContact","protectedPhone"])
  if(visible.includes(secret))fail("PROTECTED_CONTACT");
 return {state:"FIFTEEN_APPROVED_GRID_GARDENING_BUSINESSES_LIVE",
  releaseId:RELEASE,sourceSha256:SHA,
  existingPreserved:12,servicesAdded:3,supplierAdded:0,suppliersRetained:1,
  cards:15,profiles:15,sitemapProfiles:15,
  nurseryContractingClaims:0,dallasSeparate:true,
  d1Reads:0,productionWrites:0,publicRequests:20};
}
async function get(url,type="text/html"){
 let res;
 try{res=await fetch(url,{method:"GET",redirect:"manual",
  signal:AbortSignal.timeout(16000),
  headers:{accept:type,"user-agent":"KiwiGardeners-KG-DIR-08-twelve/1.0"}});
 }catch{fail("NETWORK");}
 if(res.status!==200||!(res.headers.get("content-type")||"").includes(type))
  fail("HTTP_OR_TYPE");
 const bytes=Buffer.from(await res.arrayBuffer());
 if(bytes.length<50||bytes.length>1_200_000)fail("SIZE");
 return bytes;
}
export async function verifyLive(){
 const source=await get(SOURCE,"application/json");
 if(source.length!==BYTES||sha(source)!==SHA)fail("GRID_PUBLIC_SHA");
 let feed;try{feed=JSON.parse(source.toString("utf8"));}
 catch{fail("SOURCE_JSON");}
 const records=verifySource(feed);
 const paths=[
  {url:"/gardeners/",type:"text/html"},
  ...records.map(x=>({url:"/gardeners/"+x.slug+"/",type:"text/html"})),
  {url:"/assets/gardener-directory-status.json",type:"application/json"},
  {url:"/sitemap.xml",type:"xml"},
  {url:"/contact/",type:"text/html"}
 ];
 const responses=await Promise.all(paths.map(x=>get(ORIGIN+x.url,x.type)));
 let status;try{status=JSON.parse(responses[16].toString("utf8"));}
 catch{fail("STATUS_JSON");}
 return verifyFifteen({feed,hub:responses[0].toString("utf8"),
  profiles:responses.slice(1,16).map(x=>x.toString("utf8")),
  status,sitemap:responses[17].toString("utf8"),
  contact:responses[18].toString("utf8")});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 verifyLive().then(x=>console.log("KG_DIR_08_LIVE_FIFTEEN="+JSON.stringify(x)))
 .catch(e=>{
  const msg=String(e?.message||"");
  console.error(/^KG_DIR_08_[A-Z0-9_]+_HOLD$/.test(msg)?msg:
   "KG_DIR_08_PUBLIC_FAILED_CLOSED");
  process.exitCode=1;
 });
}
