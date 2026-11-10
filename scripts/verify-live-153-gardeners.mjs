#!/usr/bin/env node
/** KG-DIR-12 | independently prove exact 153 native Kiwi gardening listings.
 * 21 previous reviewed and 132 newly provisional records, no content writes.
 */
import {createHash} from "node:crypto";
import {pathToFileURL} from "node:url";
import {validateGridEaterPublicGardeners} from "../src/gardener-directory.mjs";
import {ALL as EXISTING} from "./verify-live-twentyone-gardeners.mjs";
export const GRID="https://grideater.com/feeds/gardeners/v1.json";
export const SITE="https://kiwigardeners.com";
export const RELEASE="kg-bulk-provisional-20261110052336535";
export const SHA="0e186bb362bd025d1b4b728e137b7a4d343e63c88693eeb93d89672146f68a34";
export const BYTES=178914;
const hash=b=>createHash("sha256").update(b).digest("hex");
const hold=c=>{throw Error("KG_DIR_12_"+c+"_HOLD");};
const old=new Set(EXISTING);
export function verifySource(bytes,now=new Date().toISOString()){
 if(!Buffer.isBuffer(bytes)||bytes.length!==BYTES||hash(bytes)!==SHA)
  hold("SOURCE_SHA");
 let json;try{json=JSON.parse(bytes.toString("utf8"));}catch{hold("JSON");}
 const data=validateGridEaterPublicGardeners(json,{now});
 if(data.releaseId!==RELEASE||data.schemaVersion!==1||
   data.approvedForKiwi!==true||data.records.length!==153||
   new Set(data.records.map(x=>x.id)).size!==153||
   ![...old].every(x=>data.records.some(r=>r.id===x)))
  hold("SOURCE_RECORDS");
 const fresh=data.records.filter(x=>!old.has(x.id));
 if(fresh.length!==132||
   fresh.filter(x=>x.kind==="gardening_service").length!==125||
   fresh.filter(x=>x.kind==="gardening_supplier").length!==7||
   fresh.some(x=>x.services.length!==1||
     x.services[0]?.basis!=="nzbn_bic_provisional"||
     x.publicContact?.type!=="grid_profile"||
     x.publicContact?.value!==x.sourcePage||
     x.serviceAreas.length!==0||
     x.kind==="gardening_supplier"&&x.publicLocations.length!==0))
  hold("PROVISIONAL_GRADE");
 if(data.records.some(x=>Object.keys(x).some(k=>
   ["privateContact","publicPhone","publicEmail","protectedPhone","rawNZBN"].includes(k))))
  hold("PROTECTED_FIELDS");
 return data;
}
function esc(value){return String(value).replaceAll("&","&amp;")
 .replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");}
export function verifyNative({source,hub,status,sitemap,profiles,phoneCount,config}){
 const records=source.records;
 if(records.length!==153||!Array.isArray(profiles)||profiles.length!==153||
  ![hub,sitemap].every(s=>typeof s==="string"&&s.length>500))
  hold("NATIVE_INPUT");
 if(status?.schemaVersion!==1||status.releaseId!==RELEASE||
  status.source!=="grideater.com"||status.approvedForKiwi!==true||
  status.publishedListings!==153)
  hold("NATIVE_STATUS");
 if((hub.match(/data-gardener-card(?:\s|>)/g)||[]).length!==153)
  hold("CARDS");
 const locs=sitemap.match(/<loc>https:\/\/kiwigardeners\.com\/gardeners\/[^<]+\/<\/loc>/g)||[];
 if(locs.length!==153||new Set(locs).size!==153)
  hold("SITEMAP");
 for(let i=0;i<records.length;i++){
  const row=records[i],html=profiles[i],path="/gardeners/"+row.slug+"/";
  if(!hub.includes(row.id)||!hub.includes(esc(row.name))||
    !hub.includes('href="'+path+'"')||
    typeof html!=="string"||!html.includes(row.id)||
    !html.includes(esc(row.name))||
    !html.includes('<link rel="canonical" href="'+SITE+path+'"')||
    !html.includes(row.sourcePage)||
    !sitemap.includes("<loc>"+SITE+path+"</loc>"))
   hold("PROFILE_"+i);
  if(!old.has(row.id)&&
     (!html.includes("Indicative NZBN business classification")||
      !html.includes("Operating area not confirmed")||
      !html.includes("Show business email (Turnstile)")))
   hold("PROVISIONAL_PROFILE_"+i);
 }
 if(!hub.includes("Dallas Timpson")||
   !hub.includes("/assets/gardener-public-phone.js")||
   !config?.enabled||phoneCount!==5)
  hold("CONTACTS");
 if(hub.includes('"emails"')||hub.includes("privateContact"))
  hold("STATIC_EMAIL_LEAK");
 return {state:"KIWI_153_PROVISIONAL_GARDENERS_LIVE",
  releaseId:RELEASE,sourceSha256:SHA,previouslyLive:21,
  addedServices:125,addedSuppliers:7,
  cards:153,profiles:153,sitemapProfiles:153,
  publicPhoneCount:5,turnstileEnabled:true,
  newBicListingsClearlyProvisional:true,d1Writes:0,productionWrites:0};
}
async function get(path,type="text/html"){
 const url=path.startsWith("http")?path:SITE+path;
 let r;
 try{r=await fetch(url,{method:"GET",redirect:"manual",signal:AbortSignal.timeout(20000),
  headers:{accept:type,"user-agent":"KiwiGardeners-KG-DIR-12-readonly/1.0"}});}
 catch{hold("HTTP_NETWORK");}
 if(r.status!==200)hold("HTTP_"+r.status);
 const b=Buffer.from(await r.arrayBuffer());
 if(b.length>1500000||b.length<10)hold("SIZE");
 return b;
}
export async function proveLive(){
 const bytes=await get(GRID,"application/json");
 const source=verifySource(bytes);
 const hub=(await get("/gardeners/")).toString("utf8");
 const sitemap=(await get("/sitemap.xml","application/xml")).toString("utf8");
 let status,phoneData,config;
 try{
  status=JSON.parse((await get("/assets/gardener-directory-status.json","application/json")).toString("utf8"));
  phoneData=JSON.parse((await get("/api/gardeners/phones","application/json")).toString("utf8"));
  config=JSON.parse((await get("/api/gardeners/email/config","application/json")).toString("utf8"));
 }catch{hold("CONTACT_STATUS_JSON");}
 if(phoneData.releaseId!==RELEASE||
   Object.keys(phoneData.phones||{}).length!==5||
   JSON.stringify(phoneData).includes('"emails"')||
   JSON.stringify(phoneData).includes("@"))
  hold("PHONE_SOURCE_PRIVATE");
 const profiles=Array(source.records.length);
 const width=12;
 for(let from=0;from<source.records.length;from+=width){
  const selection=source.records.slice(from,from+width);
  const fetched=await Promise.all(selection.map(x=>get("/gardeners/"+x.slug+"/")));
  fetched.forEach((b,i)=>{profiles[from+i]=b.toString("utf8");});
 }
 return verifyNative({source,hub,sitemap,status,profiles,
  phoneCount:Object.keys(phoneData.phones).length,config});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 proveLive().then(x=>console.log("KG_DIR_12_PUBLIC_153_PROOF="+JSON.stringify(x)))
 .catch(e=>{
  const s=String(e?.message||"");
  console.error(/^KG_DIR_12_[A-Z0-9_]+_HOLD$/.test(s)?s:
   "KG_DIR_12_LIVE_FAILED_CLOSED");
  process.exitCode=1;
 });
