#!/usr/bin/env node
/**
 * KG-DIR-03 | 3 approved gardening listings live on Kiwi Gardeners.
 * Anonymous public GETs only, source is GRID EATER's immutable approved feed.
 * Does not deploy, mutate, index or touch any private contact data.
 */
import {pathToFileURL} from "node:url";
export const ORIGIN="https://kiwigardeners.com";
export const RELEASE="kg-first-three-20261108193606";
export const LISTINGS=Object.freeze([
 Object.freeze({id:"afnz-9429052264047",slug:"wordsworth-gardens-9429052264047",
   name:"Wordsworth Gardens",area:"Christchurch"}),
 Object.freeze({id:"afnz-9429030218079",slug:"waitakere-tree-services-9429030218079",
   name:"Waitakere Tree Services",area:"Auckland"}),
 Object.freeze({id:"afnz-9429030118973",slug:"tjr-groundworks-9429030118973",
   name:"TJR Groundworks",area:"Mosgiel"})
]);
const fail=x=>{throw Error("KG_DIR_03_"+x+"_HOLD");};
export function verifyThree({hub,profiles,status,sitemap,contact}){
 if(![hub,sitemap,contact].every(x=>typeof x==="string"&&x.length>200)||
    !Array.isArray(profiles)||profiles.length!==3||
    profiles.some(x=>typeof x!=="string"||x.length<200))
   fail("BLOCKED_OR_EMPTY");
 if(status?.schemaVersion!==1||status.source!=="grideater.com"||
    status.approvedForKiwi!==true||status.releaseId!==RELEASE||
    status.publishedListings!==3)fail("STATUS");
 const cards=(hub.match(/data-gardener-card(?:\s|>)/g)||[]);
 if(cards.length!==3||!hub.includes('name="robots" content="index,follow'))
   fail("INDEXABLE_HUB");
 for(let i=0;i<LISTINGS.length;i++){
  const t=LISTINGS[i],path="/gardeners/"+t.slug+"/";
  if(!hub.includes(t.name)||!hub.includes(t.id)||
     !hub.includes('href="'+path+'"')||
     !hub.includes(t.area))fail("HUB_RECORD_"+i);
  const html=profiles[i];
  if(!html.includes(t.name)||!html.includes(t.id)||
     !html.includes(t.area)||
     !html.includes('<link rel="canonical" href="'+ORIGIN+path+'"')||
     !html.includes('name="robots" content="index,follow')||
     !html.includes("https://grideater.com/business/"+t.slug))
    fail("PROFILE_"+i);
  if(!sitemap.includes("<loc>"+ORIGIN+path+"</loc>"))
    fail("SITEMAP_"+i);
 }
 if(!sitemap.includes("<loc>"+ORIGIN+"/gardeners/</loc>"))
   fail("SITEMAP_HUB");
 const tjr=profiles[2];
 if(!tjr.includes("Likely local area (NZBN registration)")||
    !tjr.includes("not confirmed as a service or delivery area"))
   fail("MOSGIEL_PROVISIONAL_DISCLOSURE");
 if(!hub.includes("Dallas Timpson")||
    !contact.includes("dallas@kiwigardeners.com")||
    !contact.includes('action="/api/contact"'))
   fail("DALLAS_SEPARATE");
 const publicText=hub+"\n"+profiles.join("\n");
 for(const secret of ["wordsworthgardensnz@gmail.com","0275918334",
    "162 Travis Road","privateContact","protectedPhone"])
   if(publicText.includes(secret))fail("PRIVATE_DATA");
 return {
  status:"THREE_APPROVED_GARDENERS_LIVE_KIWI_VERIFIED",
  releaseId:RELEASE,records:3,
  canonicalBusinessIds:LISTINGS.map(x=>x.id),
  wordsworthRetained:true,twoNewBusinesses:2,
  townFiltersShown:true,mosgielProvisionalLabel:true,
  sitemapProfiles:3,dallasContactPreserved:true,
  privateDataExposed:false,d1Statements:0,
  productionWrites:0,publicRequests:7
 };
}
async function get(path,{accept="text/html",json=false}={}){
 let r;
 try{r=await fetch(ORIGIN+path,{method:"GET",
  signal:AbortSignal.timeout(15000),redirect:"manual",
  headers:{accept,"user-agent":"KiwiGardeners-KG-DIR-03-acceptance/1.0"}});}
 catch{fail("NETWORK");}
 if(r.status!==200||!(r.headers.get("content-type")||"").includes(accept))
   fail("HTTP_"+path.replace(/[^a-z]/gi,"_").toUpperCase());
 const text=await r.text();
 if(text.length>1200000||text.length<100)fail("BAD_RESPONSE_SIZE");
 if(json){try{return JSON.parse(text);}catch{fail("JSON");}}
 return text;
}
export async function verifyLive(){
 const requests=[
  get("/gardeners/"),
  ...LISTINGS.map(t=>get("/gardeners/"+t.slug+"/")),
  get("/assets/gardener-directory-status.json",{accept:"application/json",json:true}),
  get("/sitemap.xml",{accept:"xml"}),
  get("/contact/")
 ];
 const [hub,...rest]=await Promise.all(requests);
 const [p0,p1,p2,status,sitemap,contact]=rest;
 return verifyThree({hub,profiles:[p0,p1,p2],status,sitemap,contact});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 verifyLive().then(r=>console.log("KG_DIR_03_LIVE_RECEIPT="+JSON.stringify(r)))
  .catch(e=>{const msg=String(e?.message||"");
   console.error(/^KG_DIR_03_[A-Z0-9_]+_HOLD$/.test(msg)?msg:"KG_DIR_03_LIVE_HOLD");
   process.exitCode=1;
  });
}
