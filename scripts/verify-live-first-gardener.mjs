#!/usr/bin/env node
// KG-DIR-02 independent live production acceptance. Public GETs only.
import {pathToFileURL} from "node:url";

export const RELEASE="kg-wordsworth-20261108083040";
export const ID="afnz-9429052264047";
export const SLUG="wordsworth-gardens-9429052264047";
export const ORIGIN="https://kiwigardeners.com";
const fail=x=>{throw Error("KG_DIR_02_LIVE_"+x+"_HOLD");};

export function validateLive({hub,profile,sitemap,status,contact}){
 if(![hub,profile,sitemap,contact].every(x=>typeof x==="string"&&x.length>60))
   fail("EMPTY_OR_BLOCKED");
 if(!status||status.schemaVersion!==1||status.source!=="grideater.com"||
    status.releaseId!==RELEASE||status.approvedForKiwi!==true||
    status.publishedListings!==1)
   fail("PUBLISHED_STATUS");
 const profilePath="/gardeners/"+SLUG+"/";
 if(!hub.includes('name="robots" content="index,follow')||
    (hub.match(/data-gardener-card(?:\s|>)/g)||[]).length!==1||
    !hub.includes('data-keywords="Hedges|Lawns|Weeding|Irrigation|Landscaping"')||
    !hub.includes('data-areas="Christchurch"')||
    !hub.includes('href="'+profilePath+'"')||
    !hub.includes(ID)||!hub.includes("Wordsworth Gardens")||
    hub.includes("No independent directory listings are published yet"))
   fail("DIRECTORY_CARD_OR_INDEX");
 if(!profile.includes('name="robots" content="index,follow')||
    !profile.includes('<link rel="canonical" href="'+ORIGIN+profilePath+'"')||
    !profile.includes("Wordsworth Gardens")||
    !profile.includes(ID)||!profile.includes("Christchurch")||
    !profile.includes("https://www.wordsworthgardens.com/")||
    !profile.includes("https://grideater.com/business/"+SLUG))
   fail("CANONICAL_PROFILE");
 if(!sitemap.includes("<loc>"+ORIGIN+"/gardeners/</loc>")||
    !sitemap.includes("<loc>"+ORIGIN+profilePath+"</loc>"))
   fail("SITEMAP_INDEX");
 if(!hub.includes("Dallas Timpson")||
    !contact.includes("dallas@kiwigardeners.com")||
    !contact.includes('action="/api/contact"'))
   fail("DALLAS_INDEPENDENCE");
 const exposed=hub+"\n"+profile;
 for(const secret of ["wordsworthgardensnz@gmail.com","0275918334",
    "162 Travis Road","privateContact","protectedPhone"])
   if(exposed.includes(secret))fail("PRIVATE_CONTACT_EXPOSURE");
 return {
  status:"FIRST_LIVE_KIWI_GARDENERS_WORDSWORTH_PROFILE_VERIFIED",
  source:"grideater.com",releaseId:RELEASE,records:1,
  businessId:ID,approvedCity:"Christchurch",
  hubIndexable:true,profileIndexable:true,sitemapHasBoth:true,
  dallasEnquiriesPreserved:true,rawBusinessContactExposed:false,
  remoteRequests:5,productionWrites:0,directD1Statements:0
 };
}
async function get(path,{type="text/html",json=false}={}){
 let res;
 try{
  res=await fetch(ORIGIN+path,{method:"GET",redirect:"manual",
    signal:AbortSignal.timeout(16000),
    headers:{accept:type,"user-agent":"KiwiGardeners-KG-DIR-02-live-acceptance/1.0"}});
 }catch{fail("PUBLIC_NETWORK");}
 if(res.status!==200||!res.headers.get("content-type")?.toLowerCase().includes(type))
   fail("HTTP_"+path.replace(/[^a-z]+/gi,"_").toUpperCase());
 const content=await res.text();
 if(content.length>1_200_000)fail("SIZE");
 try{return json?JSON.parse(content):content;}
 catch{fail("JSON_STATUS");}
}
export async function verify(){
 const paths=[
  "/gardeners/",
  "/gardeners/"+SLUG+"/",
  "/sitemap.xml",
  "/assets/gardener-directory-status.json",
  "/contact/"
 ];
 const [hub,profile,sitemap,status,contact]=await Promise.all([
   get(paths[0]),get(paths[1]),get(paths[2],{type:"xml"}),
   get(paths[3],{type:"application/json",json:true}),
   get(paths[4])
 ]);
 return validateLive({hub,profile,sitemap,status,contact});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 verify().then(x=>console.log("KG_DIR_02_LIVE_RECEIPT="+JSON.stringify(x)))
 .catch(e=>{
   const m=String(e?.message||"");
   console.error(/^KG_DIR_02_LIVE_[A-Z0-9_]+_HOLD$/.test(m)?m:"KG_DIR_02_LIVE_CHECK_FAILED");
   process.exitCode=1;
 });
