// KG-DIR-01B: source-reviewed editorial gardener profile, NOT a verified
// GRID EATER approved gardener feed, canonical category or service-area mapper.
const FIELDS=["schemaVersion","source","snapshotKind","reviewedAt","records"];
const ROWS=["id","name","slug","kind","baseLocality","baseLocalityMeaning",
 "coverageClaim","coverageClaimMeaning","summary","services","sourceWebsite",
 "sourceServices","sourceReviewedAt","canonicalCategoryAssignmentVerified",
 "canonicalServiceAreaAssignmentVerified","approvedGardenerFeedMember"];
const reject=why=>{throw Error("KG_SERVICE_EDITORIAL_"+why+"_HOLD");};
const exact=(v,fields)=>{
 if(!v||typeof v!=="object"||Array.isArray(v)||
   Object.keys(v).length!==fields.length||fields.some(k=>!Object.hasOwn(v,k)))reject("FIELDS");
};
const safe=(v,min,max)=>{
 if(typeof v!=="string"||v.trim().length<min||v.length>max||
  /[\u0000-\u001f\u007f]/.test(v))reject("TEXT");
 return v.trim();
};
const verifiedDate=(v,now)=>{
 if(typeof v!=="string"||! /^\d{4}-\d{2}-\d{2}$/.test(v))reject("DATE");
 const n=Date.parse(now),at=Date.parse(v+"T00:00:00Z");
 if(!Number.isFinite(n)||!Number.isFinite(at)||at>n+86400000||n-at>90*86400000)
   reject("DATE");
 return v;
};
const ownUrl=(v,path)=>{
 let u;
 try{u=new URL(safe(v,16,350));}catch{reject("URL");}
 if(u.protocol!=="https:"||u.username||u.password||u.port||u.search||u.hash||
   u.hostname!=="www.wordsworthgardens.com"||u.pathname!==path)reject("URL");
 return u.toString();
};
export function validateFirstPartyServiceReferences(v,{now=new Date().toISOString()}={}){
 exact(v,FIELDS);
 if(v.schemaVersion!==1||v.source!=="grideater.com"||
   v.snapshotKind!=="first-party-gardening-service-editorial")reject("SOURCE");
 if(!Array.isArray(v.records)||v.records.length!==1)reject("COHORT");
 const r=v.records[0]; exact(r,ROWS);
 if(r.id!=="afnz-9429052264047"||r.slug!=="wordsworth-gardens"||
  r.kind!=="gardening_service_editorial_reference"||
  r.baseLocalityMeaning!=="business_declared_base_not_registered_address"||
  r.coverageClaimMeaning!=="first_party_broad_service_region_unverified_canonical_serves"||
  r.canonicalCategoryAssignmentVerified!==false||
  r.canonicalServiceAreaAssignmentVerified!==false||
  r.approvedGardenerFeedMember!==false)reject("NOT_CANONICAL_APPROVED");
 if(!Array.isArray(r.services)||r.services.length<1||r.services.length>10)reject("SERVICES");
 const services=r.services.map(s=>safe(s,3,80));
 if(new Set(services.map(s=>s.toLowerCase())).size!==services.length)reject("DUPLICATE");
 return {reviewedAt:verifiedDate(v.reviewedAt,now),records:[{
   id:r.id,slug:r.slug,name:safe(r.name,5,90),
   baseLocality:safe(r.baseLocality,5,100),
   coverageClaim:safe(r.coverageClaim,4,80),
   summary:safe(r.summary,100,650),services,
   sourceWebsite:ownUrl(r.sourceWebsite,"/"),
   sourceServices:ownUrl(r.sourceServices,"/services"),
   sourceReviewedAt:verifiedDate(r.sourceReviewedAt,now),
   approvedGardenerFeedMember:false
 }]};
}
export async function loadFirstPartyServices({readFile,now}={}){
 if(typeof readFile!=="function")reject("READER");
 const raw=await readFile("src/grid-eater-reviewed-gardening-services.json","utf8");
 if(raw.length>16000)reject("SIZE");
 let obj;try{obj=JSON.parse(raw);}catch{reject("JSON");}
 return validateFirstPartyServiceReferences(obj,{now});
}
export function addFirstPartyServiceReferencePages({esc,articleHero,layout,files,baseTrail},snapshot) {
 const root="/garden-service-providers/",r=snapshot.records[0];
 const crumbs=[...baseTrail,{name:"Gardening businesses",path:root}];
 const note='<p class="micro"><strong>First-party-source-reviewed editorial reference, not a verified GRID EATER gardener feed listing.</strong> The company’s normal Canterbury coverage is its own broad statement, not a verified suburb-by-suburb service map or a canonical GRID EATER serves assignment. Its category, area and Kiwi public-contact approval remain under separate review. No protected phone, email, or exact street address is reproduced here. Confirm your job and location with the business directly.</p>';
 files["garden-service-providers/index.html"]=layout({
   path:root,title:"Canterbury Gardening Businesses | First-Party Sources | Kiwi Gardeners",
   description:"Explore source-reviewed Canterbury gardeners, including lawn mowing, hedge trimming, maintenance and landscape services. Check each business source and coverage.",
   trail:crumbs,type:"CollectionPage",indexable:true,
   content:articleHero("Canterbury gardening businesses","Gardening service providers",
      "Discover businesses using first-party source evidence, with precise service-area and public-contact approval shown separately.",crumbs)+
      '<section class="section"><div class="container"><p><a href="/gardeners/">Approved gardener directory</a> and <a href="/suppliers/">garden suppliers</a> are separate. Dallas Timpson’s own services are also separate from independent entries.</p>'+
      '<article class="card"><div class="card-body"><span class="tag">First-party source reviewed · Canonical mapping pending</span><h2><a href="'+root+esc(r.slug)+'/">'+esc(r.name)+'</a></h2><p>'+esc(r.summary)+'</p>'+
      '<p><strong>Business-declared base:</strong> '+esc(r.baseLocality)+'</p><p><strong>Business-declared broad coverage:</strong> '+esc(r.coverageClaim)+'</p>'+
      '<a href="'+root+esc(r.slug)+'/">View source-reviewed business ↗</a></div></article>'+note+'</div></section>'
 });
 const path=root+r.slug+"/",trail=[...crumbs,{name:r.name,path}];
 files["garden-service-providers/"+r.slug+"/index.html"]=layout({
   path,title:"Wordsworth Gardens | Canterbury Garden Maintenance & Lawn Care | Kiwi Gardeners",
   description:"Wordsworth Gardens describes lawn care, hedge trimming, weeding, garden maintenance and landscaping from New Brighton. See its first-party sources and Canterbury statement.",
   trail,type:"WebPage",indexable:true,
   content:articleHero("First-party source-reviewed gardening business",r.name,r.summary,trail)+
     '<section class="section"><div class="container text-layout"><article class="prose">'+
     '<h2>Services described on the business website</h2><ul>'+
     r.services.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>'+
     '<h2>Base and broad coverage</h2><p>The business identifies '+esc(r.baseLocality)+' as its base and says its ordinary coverage includes '+esc(r.coverageClaim)+'. It describes selected larger jobs further afield. This is a first-party claim; it does not promise service in every town or substantiate a canonical GRID EATER serves mapping.</p>'+
     '<h2>Visit the first-party source</h2><p>Source reviewed '+esc(snapshot.reviewedAt)+'. <a target="_blank" rel="noopener noreferrer" href="'+esc(r.sourceWebsite)+'">Visit Wordsworth Gardens’ website ↗</a> or <a target="_blank" rel="noopener noreferrer" href="'+esc(r.sourceServices)+'">read its listed services ↗</a> and use the business’s own contact options.</p>'+
     '<p>GRID EATER canonical business identifier: <strong>'+esc(r.id)+'</strong>. This page is editorial only and does not update the canonical category, locality or contact records.</p>'+note+
     '</article><aside class="sidebar"><h3>More Canterbury resources</h3><p><a href="/gardeners/">Approved gardening directory</a></p><p><a href="/suppliers/">Garden suppliers</a></p><p><a href="/garden-service-providers/">More source-reviewed businesses</a></p></aside></div></section>'
 });
 files["assets/service-editorial-status.json"]=JSON.stringify({
  source:"grideater.com",mode:"FIRST_PARTY_EDITORIAL_ONLY",reviewedAt:snapshot.reviewedAt,
  records:1,canonicalCategoryAssignmentsByKiwi:0,verifiedServesMappingsByKiwi:0,
  approvedPublicGardenerFeedRecordsByKiwi:0,protectedContactValuesCopied:false
 },null,2)+"\n";
}
