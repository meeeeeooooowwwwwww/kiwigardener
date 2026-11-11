#!/usr/bin/env node
/** KG-DIR-13 | native source-grade + direct canonical contact acceptance.
 * One public feed GET plus one native hub GET. No D1, API credentials,
 * private contact calls, business profile crawls or mutations.
 */
import {pathToFileURL} from "node:url";
import {verifySource,GRID,SITE} from "./verify-live-153-gardeners.mjs";
const fail=code=>{throw Error("KG_DIR_13_"+code+"_HOLD");};
export function checkNativeGradeHub(source,html){
 if(source?.records?.length!==153||typeof html!=="string"||html.length<10000)
  fail("INPUT");
 let reviewed=0,provisional=0,gridContact=0,websiteContact=0;
 for(const row of source.records){
  if(row.services.every(x=>x.basis==="nzbn_bic_provisional"))provisional++;
  else reviewed++;
  if(row.publicContact.type==="grid_profile")gridContact++;
  else if(row.publicContact.type==="website")websiteContact++;
  else fail("CONTACT_SOURCE");
 }
 if(reviewed!==21||provisional!==132)fail("SOURCE_GRADE");
 if(!html.includes("153 listed businesses · 21 source-reviewed · 132 provisional NZBN"))
  fail("INITIAL_COUNT");
 const count=(pattern)=>(html.match(pattern)||[]).length;
 if(count(/data-gardener-card(?:\s|>)/g)!==153||
    count(/data-source-grade="provisional"/g)!==provisional||
    count(/data-source-grade="reviewed"/g)!==reviewed||
    count(/NZBN: \d{13}/g)!==153)fail("CARD_GRADES");
 if(count(/Contact options on GRID EATER/g)<gridContact||
    count(/Visit verified business website/g)<websiteContact)
  fail("CARD_CONTACTS");
 if(!html.includes("Town / service area not confirmed.")||
    !html.includes("provisional records are discovery leads")||
    !html.includes("Dallas Timpson"))fail("COPY_OR_HOUSE");
 // The exact release's raw business email values are not present in the
 // public JSON or site HTML, and private contacts are not read by this audit.
 if(html.includes('"emails":')||html.includes("privateContact")||
    html.includes("protectedPhone"))fail("CONTACT_LEAK");
 return Object.freeze({
  state:"KG_DIR_13_NATIVE_GRADES_PASS",listings:153,reviewed,provisional,
  sourceContactTypeGrid:gridContact,sourceContactTypeWebsite:websiteContact,
  cards:153,publicBusinessContactsUnchanged:true,d1Queries:0,d1Writes:0
 });
}
async function get(url){
 const r=await fetch(url,{method:"GET",redirect:"error",
  headers:{accept:url.endsWith(".json")?"application/json":"text/html"},
  signal:AbortSignal.timeout(20000)});
 if(r.status!==200)fail("HTTP_"+r.status);
 const body=Buffer.from(await r.arrayBuffer());
 if(body.length<100||body.length>750000)fail("SIZE");
 return body;
}
export async function verifyLiveGrade(){
 const source=verifySource(await get(GRID));
 const hub=(await get(SITE+"/gardeners/")).toString("utf8");
 return checkNativeGradeHub(source,hub);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 verifyLiveGrade().then(r=>console.log("KG_DIR_13_NATIVE_PUBLIC_PROOF="+JSON.stringify(r)))
  .catch(e=>{const msg=String(e?.message||"");
   console.error(/^KG_DIR_13_[A-Z0-9_]+_HOLD$/.test(msg)?msg:
    "KG_DIR_13_NATIVE_PROOF_FAILED_CLOSED");process.exitCode=1;});
