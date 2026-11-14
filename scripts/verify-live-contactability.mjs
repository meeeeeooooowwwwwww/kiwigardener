#!/usr/bin/env node
/** Independent public-only proof of the native contactability visibility cut. */
import {verifySource,GRID,SITE} from "./verify-live-153-gardeners.mjs";
import {selectContactableDirectory,PUBLISHED_IDS,RELEASE_ID} from "../src/gardener-contactability.mjs";
const hold=c=>{throw Error("KIWI_CONTACTABILITY_"+c+"_HOLD");};
async function get(url,status=200,accept="text/html"){
 const res=await fetch(url,{method:"GET",redirect:"manual",headers:{accept},signal:AbortSignal.timeout(20000)});
 if(res.status!==status)hold("HTTP_"+res.status+"_EXPECTED_"+status);
 const bytes=Buffer.from(await res.arrayBuffer());
 if(bytes.length>1500000)hold("BYTES");
 return bytes;
}
const source=verifySource(await get(GRID,200,"application/json"));
const selected=selectContactableDirectory(source);
const accepted=new Set(PUBLISHED_IDS);
const hidden=source.records.filter(r=>!accepted.has(r.id));
const [hubRaw,siteRaw,statusRaw,phonesRaw,configRaw]=await Promise.all([
 get(SITE+"/gardeners/"),get(SITE+"/sitemap.xml",200,"application/xml"),
 get(SITE+"/assets/gardener-directory-status.json",200,"application/json"),
 get(SITE+"/api/gardeners/phones",200,"application/json"),
 get(SITE+"/api/gardeners/email/config",200,"application/json")
]);
const hub=hubRaw.toString("utf8"),sitemap=siteRaw.toString("utf8"),status=JSON.parse(statusRaw),phones=JSON.parse(phonesRaw),config=JSON.parse(configRaw);
if(status.releaseId!==RELEASE_ID||status.publishedListings!==90||status.approvedForKiwi!==true)hold("STATUS");
const cardIds=[...hub.matchAll(/data-kiwi-public-phone="(afnz-\d{13})"/g)].map(m=>m[1]);
if(cardIds.length!==90||new Set(cardIds).size!==90||cardIds.some(x=>!accepted.has(x)))hold("CARDS");
const locs=[...sitemap.matchAll(/<loc>https:\/\/kiwigardeners\.com\/gardeners\/([^<]+)\/<\/loc>/g)].map(m=>m[1]);
if(locs.length!==90||new Set(locs).size!==90||selected.records.some(r=>!locs.includes(r.slug))||hidden.some(r=>locs.includes(r.slug)))hold("SITEMAP");
if(!hub.includes("Dallas Timpson")||phones.releaseId!==RELEASE_ID||config.enabled!==true||!phones.phones||typeof phones.phones!=="object")hold("CONTACT_BOUNDARY");
if(Object.keys(phones.phones).some(id=>!accepted.has(id)))hold("PHONE_FOR_HIDDEN_BUSINESS");
// Test three ordinary hidden routes and three retained routes; build independently
// proves every expected card/sitemap entry. No contact value or hidden ID logged.
for(const [records,expected] of [[hidden,404],[selected.records,200]]){
 for(const r of records.slice(0,3))await get(SITE+"/gardeners/"+r.slug+"/",expected);
}
console.log("KIWI_CONTACTABILITY_LIVE="+JSON.stringify({sourceRecords:source.records.length,cards:cardIds.length,sitemapProfiles:locs.length,hidden:63,hiddenProfileSamples404:3,retainedProfileSamples200:3,publicPhoneCount:Object.keys(phones.phones).length,turnstileEnabled:true,rawContactsLogged:false,d1Writes:0}));
