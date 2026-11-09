#!/usr/bin/env node
/**
 * KG-DIR-05: exact GRID EATER approved nine-record SHA and independent Kiwi
 * live directory/profile/sitemap acceptance. Public GET only, no site or D1 writes.
 */
import {createHash} from "node:crypto";
import {pathToFileURL} from "node:url";
export const ORIGIN="https://kiwigardeners.com";
export const SOURCE="https://grideater.com/feeds/gardeners/v1.json";
export const RELEASE="kg-reviewed-six-20261109005020";
export const SHA="5f3b14b4362653327c7da50d28281598a30e5cb9cddf318c28e2c901126513b4";
export const BYTES=12438;
export const PREVIOUS=Object.freeze([
 "afnz-9429030118973","afnz-9429030218079","afnz-9429052264047"
]);
export const ADDITIONS=Object.freeze([
 "afnz-9429030692930","afnz-9429030717848","afnz-9429030835122",
 "afnz-9429031475198","afnz-9429035743651","afnz-9429042015826"
]);
const ALL=[...PREVIOUS,...ADDITIONS].sort();
const NAMES=[
 "Xanthe White Design","Green Therapy","Tree Menders Limited",
 "Total Trees Limited","AJ LANDSCAPING AND EARTHWORKS LIMITED",
 "BLACKBIRD PROJECTS LIMITED"
].sort();
const fail=x=>{throw Error("KG_DIR_05_"+x+"_HOLD");};
const sha=b=>createHash("sha256").update(b).digest("hex");
export function verifySource(feed){
 if(feed?.schemaVersion!==1||feed.source!=="grideater.com"||
    feed.releaseId!==RELEASE||feed.approvedForKiwi!==true||
    !Array.isArray(feed.records)||feed.records.length!==9||
    JSON.stringify(feed.records.map(x=>x.id).sort())!==JSON.stringify(ALL)||
    JSON.stringify(feed.records.filter(x=>ADDITIONS.includes(x.id)).map(x=>x.name).sort())!==JSON.stringify(NAMES))
   fail("SOURCE_IDENTITY");
 if(new Set(feed.records.map(x=>x.slug)).size!==9||
    !feed.records.every(x=>typeof x.name==="string"&&
     /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug||"")&&
     x.sourcePage==="https://grideater.com/business/"+x.slug&&
     x.kind==="gardening_service"&&x.status==="published"&&
     x.approvedForKiwi===true&&x.suppressed===false&&
     Array.isArray(x.services)&&x.services.length>0&&
     Array.isArray(x.serviceAreas)&&x.serviceAreas.length>0&&
     x.publicContact?.type==="website"&&
     x.publicContact?.approvedForPublicUse===true&&
     /^https:\/\//.test(x.publicContact.value||"")&&
     !["protectedPhone","privateContact","streetAddress","rawNZBN"].some(k=>Object.hasOwn(x,k))))
   fail("SOURCE_EVIDENCE_PRIVACY");
 return feed.records;
}
export function verifyNine({feed,hub,profiles,status,sitemap,contact}){
 const records=verifySource(feed);
 if(![hub,sitemap,contact].every(x=>typeof x==="string"&&x.length>200)||
    !Array.isArray(profiles)||profiles.length!==9||
    profiles.some(x=>typeof x!=="string"||x.length<200))
   fail("PUBLIC_BODIES");
 if(status?.schemaVersion!==1||status.source!=="grideater.com"||
    status.approvedForKiwi!==true||status.releaseId!==RELEASE||
    status.publishedListings!==9)fail("STATUS");
 if((hub.match(/data-gardener-card(?:\s|>)/g)||[]).length!==9||
    !hub.includes('name="robots" content="index,follow'))
   fail("HUB");
 for(let i=0;i<records.length;i++){
  const x=records[i],p="/gardeners/"+x.slug+"/",html=profiles[i];
  if(!hub.includes(x.name)||!hub.includes(x.id)||
     !hub.includes('href="'+p+'"')||
     !html.includes(x.name)||!html.includes(x.id)||
     !html.includes('<link rel="canonical" href="'+ORIGIN+p+'"')||
     !html.includes('name="robots" content="index,follow')||
     !html.includes(x.sourcePage)||!html.includes(x.publicContact.value)||
     !sitemap.includes("<loc>"+ORIGIN+p+"</loc>"))
    fail("PROFILE_"+i);
  for(const fact of [...x.services,...x.serviceAreas])
   if(!hub.includes(fact.name)||!html.includes(fact.name))
    fail("EVIDENCE_FACT_"+i);
 }
 if(!sitemap.includes("<loc>"+ORIGIN+"/gardeners/</loc>"))
   fail("SITEMAP_HUB");
 const tjr=records.find(x=>x.id==="afnz-9429030118973");
 if(!tjr||!profiles[records.indexOf(tjr)].includes("Likely local area (NZBN registration)")||
    !profiles[records.indexOf(tjr)].includes("not confirmed as a service or delivery area"))
   fail("PROVISIONAL_AREA");
 if(!hub.includes("Dallas Timpson")||
    !contact.includes("dallas@kiwigardeners.com")||
    !contact.includes('action="/api/contact"'))
   fail("DALLAS_SEPARATION");
 const visible=hub+"\n"+profiles.join("\n");
 for(const secret of ["wordsworthgardensnz@gmail.com","0275918334",
   "162 Travis Road","privateContact","protectedPhone"])
  if(visible.includes(secret))fail("PRIVATE_LEAK");
 return {state:"NINE_APPROVED_GARDENING_BUSINESSES_LIVE",
  releaseId:RELEASE,sourceSha256:SHA,liveDirectoryCards:9,liveProfiles:9,
  sitemapProfiles:9,priorPreserved:3,newReviewed:6,
  dallasIndependent:true,publicContactsSafe:true,
  d1Reads:0,productionWrites:0,requests:14};
}
async function get(url,type="text/html"){
 let res;
 try{res=await fetch(url,{method:"GET",redirect:"manual",
  signal:AbortSignal.timeout(15000),
  headers:{accept:type,"user-agent":"KiwiGardeners-KG-DIR-05-nine/1.0"}});}
 catch{fail("NETWORK");}
 if(res.status!==200||!(res.headers.get("content-type")||"").includes(type))
   fail("HTTP_OR_TYPE");
 const b=Buffer.from(await res.arrayBuffer());
 if(b.length<50||b.length>1200000)fail("RESPONSE_SIZE");
 return b;
}
export async function verifyLive(){
 const src=await get(SOURCE,"application/json");
 if(src.length!==BYTES||sha(src)!==SHA)fail("GRID_PUBLIC_SHA");
 let feed;
 try{feed=JSON.parse(src.toString("utf8"));}catch{fail("GRID_JSON");}
 const records=verifySource(feed);
 const list=["/gardeners/",
   ...records.map(x=>"/gardeners/"+x.slug+"/"),
   "/assets/gardener-directory-status.json","/sitemap.xml","/contact/"];
 const responses=await Promise.all(list.map((path,i)=>
  get(ORIGIN+path,i===10?"application/json":i===11?"xml":"text/html")));
 let status;
 try{status=JSON.parse(responses[10].toString("utf8"));}catch{fail("KIWI_STATUS_JSON");}
 return verifyNine({feed,hub:responses[0].toString("utf8"),
  profiles:responses.slice(1,10).map(x=>x.toString("utf8")),
  status,sitemap:responses[11].toString("utf8"),
  contact:responses[12].toString("utf8")});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 verifyLive().then(x=>console.log("KG_DIR_05_LIVE_NINE="+JSON.stringify(x)))
  .catch(e=>{
   const code=String(e?.message||"");
   console.error(/^KG_DIR_05_[A-Z0-9_]+_HOLD$/.test(code)?code:
    "KG_DIR_05_LIVE_PUBLIC_PROOF_FAILED");
   process.exitCode=1;
  });
}
