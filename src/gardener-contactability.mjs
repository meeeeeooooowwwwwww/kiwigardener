// Site-owned published directory subset. Only public business identifiers
// already present in the approved GRID feed, never private contact flags/values.
// Current release only; a new upstream release requires a matching approved
// contactability manifest rather than silently republishing unreviewed entries.
import {createHash} from "node:crypto";
export const RELEASE_ID="kg-category-provisional-20261111045747746";
export const SOURCE_SHA="8b416584f93af81a0b4ce3dac7b114dc4a5cfa05653ef77e09e9e094b598a796";
export const POLICY_VERSION=1;
export const SOURCE_COUNT=153;
export const SOURCE_IDS_SHA="b9e83feea5e0688f3139cf5b99320f600a560af8927ac901b394357c4a874901";
export const PUBLISHED_IDS_SHA="f2444b7ad381a84c7da00c2abd2abdc15a9fa234bd04697c5393194cec45d7fe";
export const PUBLISHED_IDS=Object.freeze([
  "afnz-9429030072053",
  "afnz-9429030118973",
  "afnz-9429030121409",
  "afnz-9429030122086",
  "afnz-9429030201569",
  "afnz-9429030218079",
  "afnz-9429030366831",
  "afnz-9429030692930",
  "afnz-9429030717848",
  "afnz-9429030835122",
  "afnz-9429030867024",
  "afnz-9429030914070",
  "afnz-9429030959859",
  "afnz-9429031016797",
  "afnz-9429031039833",
  "afnz-9429031205924",
  "afnz-9429031220156",
  "afnz-9429031292139",
  "afnz-9429031467544",
  "afnz-9429031475198",
  "afnz-9429031480321",
  "afnz-9429031495516",
  "afnz-9429031533072",
  "afnz-9429031868358",
  "afnz-9429031923699",
  "afnz-9429032218886",
  "afnz-9429032387957",
  "afnz-9429032462685",
  "afnz-9429032468403",
  "afnz-9429032537048",
  "afnz-9429032539974",
  "afnz-9429032558760",
  "afnz-9429032855043",
  "afnz-9429032863468",
  "afnz-9429033485027",
  "afnz-9429033824024",
  "afnz-9429034425732",
  "afnz-9429035022305",
  "afnz-9429035277972",
  "afnz-9429035743651",
  "afnz-9429036469710",
  "afnz-9429036608010",
  "afnz-9429037108786",
  "afnz-9429037187101",
  "afnz-9429037396459",
  "afnz-9429037609337",
  "afnz-9429037680213",
  "afnz-9429037705503",
  "afnz-9429037916428",
  "afnz-9429038261206",
  "afnz-9429038286858",
  "afnz-9429038703850",
  "afnz-9429038868634",
  "afnz-9429040343648",
  "afnz-9429040425030",
  "afnz-9429040583587",
  "afnz-9429041008805",
  "afnz-9429041021217",
  "afnz-9429041032862",
  "afnz-9429041104118",
  "afnz-9429041105023",
  "afnz-9429041123072",
  "afnz-9429041167922",
  "afnz-9429041201633",
  "afnz-9429041384633",
  "afnz-9429041477526",
  "afnz-9429041572900",
  "afnz-9429041720660",
  "afnz-9429041860946",
  "afnz-9429041866214",
  "afnz-9429041873878",
  "afnz-9429042015826",
  "afnz-9429042019060",
  "afnz-9429042019350",
  "afnz-9429042072072",
  "afnz-9429042187806",
  "afnz-9429042288992",
  "afnz-9429042407638",
  "afnz-9429043997152",
  "afnz-9429045844119",
  "afnz-9429045962684",
  "afnz-9429046946805",
  "afnz-9429047012141",
  "afnz-9429047064478",
  "afnz-9429047194632",
  "afnz-9429048751926",
  "afnz-9429050675029",
  "afnz-9429052264047",
  "afnz-9429053158604",
  "afnz-9429053251589"
]);
const idOk=id=>typeof id==="string"&&/^afnz-\d{13}$/.test(id);
const digest=ids=>createHash("sha256").update([...ids].sort().join("\n")+"\n").digest("hex");
const hold=c=>{throw Error("KG_CONTACTABILITY_"+c+"_HOLD");};
export function selectContactableDirectory(feed){
 if(feed?.schemaVersion!==1||feed.source!=="grideater.com"||feed.approvedForKiwi!==true||
    feed.releaseId!==RELEASE_ID||!Array.isArray(feed.records)||feed.records.length!==SOURCE_COUNT)
   hold("SOURCE_RELEASE");
 const ids=feed.records.map(r=>r.id);
 if(ids.some(x=>!idOk(x))||new Set(ids).size!==SOURCE_COUNT||digest(ids)!==SOURCE_IDS_SHA)
   hold("SOURCE_IDENTITY");
 const accepted=new Set(PUBLISHED_IDS);
 if(accepted.size!==90||PUBLISHED_IDS.some(x=>!idOk(x))||digest(PUBLISHED_IDS)!==PUBLISHED_IDS_SHA||
    PUBLISHED_IDS.some(id=>!ids.includes(id)))hold("MANIFEST");
 const records=feed.records.filter(r=>accepted.has(r.id));
 if(records.length!==accepted.size||records.some(r=>r.status!=="published"||r.approvedForKiwi!==true||r.suppressed!==false))
   hold("PUBLICATION");
 return {...feed,records};
}
