// Kiwi Gardeners read-only consumer for a separately approved GRID EATER public export.
// No direct D1/CRM access, protected contacts, inferred service areas or crawler work.
const MAX_RECORDS=200;
const MAX_BYTES=512_000;
const ROOT_KEYS=["schemaVersion","source","releaseId","releasedAt","approvedForKiwi","records"];
const RECORD_KEYS=["id","slug","name","description","kind","status","approvedForKiwi","suppressed","approvedAt","sourcePage","services","serviceAreas","publicContact"];
const PROOF_KEYS=["name","verifiedAt","evidenceUrl"];
const CONTACT_KEYS=["type","value","verifiedAt","evidenceUrl","approvedForPublicUse"];
const empty=Object.freeze({schemaVersion:1,source:"grideater.com",releaseId:null,releasedAt:null,approvedForKiwi:false,records:[]});

function reject(message){throw new Error("KG-DIR-00 public feed rejected: "+message);}
function object(value,at){if(!value||typeof value!=="object"||Array.isArray(value))reject(at+" must be an object");return value;}
function keys(value,allowed,at){
  object(value,at);
  for(const key of Object.keys(value))if(!allowed.includes(key))reject(at+" contains unexpected field "+key);
}
function string(value,at,min=1,max=260){
  if(typeof value!=="string"||value.trim().length<min||value.length>max)reject(at+" must be a bounded string");
  if(/[\u0000-\u001f\u007f]/.test(value))reject(at+" contains control characters");
  return value.trim();
}
function iso(value,at){
  const v=string(value,at,20,40);
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(v)||!Number.isFinite(Date.parse(v)))
    reject(at+" must be UTC ISO 8601");
  return v;
}
function httpsUrl(value,at,host=null){
  const v=string(value,at,12,350);
  let u;
  try{u=new URL(v);}catch{reject(at+" is not a URL");}
  if(u.protocol!=="https:"||u.username||u.password||u.hash||u.search)
    reject(at+" must be a public HTTPS URL with no credentials/query/fragment");
  if(host&&u.hostname!==host)reject(at+" must use "+host);
  if(u.hostname==="localhost"||/^\d{1,3}(?:\.\d{1,3}){3}$/.test(u.hostname)||u.hostname.endsWith(".local"))
    reject(at+" contains an unsupported host");
  return u.toString();
}
function proof(value,at){
  keys(value,PROOF_KEYS,at);
  return {
    name:string(value.name,at+".name",3,90),
    verifiedAt:iso(value.verifiedAt,at+".verifiedAt"),
    evidenceUrl:httpsUrl(value.evidenceUrl,at+".evidenceUrl")
  };
}
function contact(value,at){
  keys(value,CONTACT_KEYS,at);
  if(value.approvedForPublicUse!==true)reject(at+" lacks explicit public contact approval");
  const type=string(value.type,at+".type");
  const raw=string(value.value,at+".value",6,255);
  let v=raw;
  if(type==="website"){v=httpsUrl(raw,at+".value");}
  else if(type==="phone"){
    if(!/^\+64[0-9\s-]{7,15}$/.test(raw))reject(at+" must be a verified NZ phone in international format");
  } else if(type==="email"){
    if(!/^[^\s@<>]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(raw))reject(at+" email invalid");
  } else reject(at+" type unsupported");
  return {type,value:v,verifiedAt:iso(value.verifiedAt,at+".verifiedAt"),
    evidenceUrl:httpsUrl(value.evidenceUrl,at+".evidenceUrl"),approvedForPublicUse:true};
}
export function validateGridEaterPublicGardeners(value,{now=new Date().toISOString()}={}){
  keys(value,ROOT_KEYS,"feed");
  if(value.schemaVersion!==1||value.source!=="grideater.com")reject("unsupported schema version or source");
  if(!Array.isArray(value.records)||value.records.length>MAX_RECORDS)reject("records are not a bounded array");
  if(value.records.length===0){
    if(value.approvedForKiwi!==false||value.releaseId!==null||value.releasedAt!==null)
      reject("empty holding snapshot must not claim a published release");
    return empty;
  }
  if(value.approvedForKiwi!==true)reject("release must be explicitly approved for Kiwi");
  const releasedAt=iso(value.releasedAt,"feed.releasedAt");
  const at=Date.parse(now),age=at-Date.parse(releasedAt);
  if(!Number.isFinite(at)||age< -86_400_000||age>90*86_400_000)reject("release is future-dated or older than 90 days");
  const releaseId=string(value.releaseId,"feed.releaseId",8,100);
  if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]+$/.test(releaseId))reject("invalid release ID");
  const ids=new Set(),slugs=new Set();
  const records=value.records.map((row,index)=>{
    const at="records["+index+"]";
    keys(row,RECORD_KEYS,at);
    const id=string(row.id,at+".id",10,90);
    if(!/^afnz-\d{13}$/.test(id))reject(at+" lacks a canonical GRID EATER NZBN business ID");
    const slug=string(row.slug,at+".slug",3,90);
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))reject(at+" invalid slug");
    if(ids.has(id)||slugs.has(slug))reject("duplicate ID or slug");
    ids.add(id);slugs.add(slug);
    if(row.kind!=="gardening_service"||row.status!=="published"||row.approvedForKiwi!==true||row.suppressed!==false)
      reject(at+" is not an approved active public gardener");
    if(!Array.isArray(row.services)||!row.services.length||row.services.length>16
      ||!Array.isArray(row.serviceAreas)||!row.serviceAreas.length||row.serviceAreas.length>25)
      reject(at+" requires finite independently verified services and service areas");
    const services=row.services.map((v,i)=>proof(v,at+".services["+i+"]"));
    const serviceAreas=row.serviceAreas.map((v,i)=>proof(v,at+".serviceAreas["+i+"]"));
    if(new Set(services.map(v=>v.name.toLowerCase())).size!==services.length
      ||new Set(serviceAreas.map(v=>v.name.toLowerCase())).size!==serviceAreas.length)
      reject(at+" duplicate service/area evidence");
    return {
      id,slug,name:string(row.name,at+".name",3,110),
      description:string(row.description,at+".description",70,450),
      kind:"gardening_service",status:"published",approvedForKiwi:true,suppressed:false,
      approvedAt:iso(row.approvedAt,at+".approvedAt"),
      sourcePage:httpsUrl(row.sourcePage,at+".sourcePage","grideater.com"),
      services,serviceAreas,publicContact:contact(row.publicContact,at+".publicContact")
    };
  });
  return {schemaVersion:1,source:"grideater.com",releaseId,releasedAt,approvedForKiwi:true,records};
}
export async function loadGridEaterPublicGardeners({readFile,fetchImpl=fetch,feedUrl=""}={}){
  if(typeof readFile!=="function")throw new TypeError("readFile is required");
  let raw;
  if(feedUrl){
    // Opt-in build-time GET only. Never route an end-user search to GRID EATER/D1.
    const u=httpsUrl(feedUrl,"KG_GRID_EATER_PUBLIC_FEED_URL","grideater.com");
    if(!new URL(u).pathname.startsWith("/feeds/gardeners/"))
      reject("remote feed path must be under /feeds/gardeners/");
    const res=await fetchImpl(u,{method:"GET",redirect:"error",
      headers:{accept:"application/json"},signal:AbortSignal.timeout(8000)});
    if(!res.ok)reject("approved public feed endpoint returned HTTP "+res.status);
    if(!String(res.headers.get("content-type")||"").toLowerCase().includes("application/json"))
      reject("feed response is not JSON");
    const size=Number(res.headers.get("content-length")||0);
    if(size>MAX_BYTES)reject("feed too large");
    const bytes=await res.arrayBuffer();
    if(bytes.byteLength>MAX_BYTES)reject("feed exceeds size cap");
    raw=new TextDecoder("utf-8",{fatal:true}).decode(bytes);
  }else{
    raw=await readFile("src/grid-eater-gardeners-public.json","utf8");
  }
  if(raw.length>MAX_BYTES)reject("local feed exceeds size cap");
  let data;
  try{data=JSON.parse(raw);}catch{reject("invalid JSON");}
  return validateGridEaterPublicGardeners(data);
}
const distinct=(items)=>[...new Set(items)].sort((a,b)=>a.localeCompare(b,"en-NZ"));
const humanDate=(stamp)=>new Date(stamp).toLocaleDateString("en-NZ",{year:"numeric",month:"short",day:"numeric",timeZone:"Pacific/Auckland"});
const hrefContact=(v)=>v.type==="phone"?"tel:"+v.value.replace(/[\s-]/g,""):v.type==="email"?"mailto:"+v.value:v.value;
const contactLabel=(v)=>v.type==="phone"?"Call approved public number":v.type==="email"?"Email this gardener":"Visit verified website";

export function addGardenerDirectoryPages({esc,a,articleHero,layout,files,baseTrail,TEL_URL,PHONE,ENQUIRY_URL},feed){
  const records=feed.records;
  const path="/gardeners/";
  const trail=[...baseTrail,{name:"Find gardeners",path}];
  const services=distinct(records.flatMap(r=>r.services.map(x=>x.name)));
  const areas=distinct(records.flatMap(r=>r.serviceAreas.map(x=>x.name)));
  const options=(items,placeholder)=>'<option value="">'+esc(placeholder)+'</option>'+
    items.map(name=>'<option value="'+esc(name)+'">'+esc(name)+'</option>').join("");
  const cards=records.map(r=>{
    const terms=[r.name,r.description,...r.services.map(x=>x.name),...r.serviceAreas.map(x=>x.name)].join(" ").toLowerCase();
    return '<article class="card gardener-directory-card" data-gardener-card data-search="'+esc(terms)+
      '" data-services="'+esc(r.services.map(x=>x.name).join("|"))+'" data-areas="'+esc(r.serviceAreas.map(x=>x.name).join("|"))+'">'+
      '<div class="gardener-card-meta"><span class="tag">Verified public listing</span><span>GRID EATER ID: '+esc(r.id)+'</span></div>'+
      '<h3><a href="/gardeners/'+r.slug+'/">'+esc(r.name)+'</a></h3>'+
      '<p>'+esc(r.description)+'</p>'+
      '<p class="gardener-card-fields"><strong>Services:</strong> '+esc(r.services.map(x=>x.name).join(", "))+'</p>'+
      '<p class="gardener-card-fields"><strong>Verified service areas:</strong> '+esc(r.serviceAreas.map(x=>x.name).join(", "))+'</p>'+
      '<a class="gardener-card-link" href="/gardeners/'+r.slug+'/">View gardener profile ↗</a></article>';
  }).join("");
  const house='<aside class="gardener-house" aria-label="Kiwi Gardeners own gardening service">'+
    '<div><span class="eyebrow">From Kiwi Gardeners</span><h2>Need a gardener in Christchurch?</h2>'+
    '<p>Dallas Timpson is the independent gardener behind Kiwi Gardeners. Contact him directly to discuss lawn mowing, garden maintenance and tidy-ups. Confirm your address and job when requesting a quote.</p></div>'+
    '<div class="button-row"><a class="button" href="'+TEL_URL+'">Call Dallas · '+PHONE+'</a>'+
    '<a class="button secondary" href="'+ENQUIRY_URL+'">Email an enquiry ↗</a></div>'+
    '<p class="micro">This is our own service, shown separately from independent GRID EATER directory results. It is not an organic directory listing.</p></aside>';
  const emptyMessage=records.length?'<p id="gardener-empty" class="gardener-empty" hidden>No verified gardeners match these filters. Try fewer filters or confirm the area directly with a provider.</p>':
    '<div class="gardener-empty"><strong>No independent directory listings are published yet.</strong><p>We are preparing a versioned public-only connection to GRID EATER. Businesses will appear when their identity, gardening services, actual service areas and public contact permission have been reviewed. Our Christchurch gardening guides and Dallas enquiry service remain available.</p></div>';
  const body=articleHero("Canterbury gardening directory","Find gardeners across Canterbury",
    "Search by gardening service, verified service area or business name. Only independently approved public GRID EATER records can appear as directory results.",trail)+
    '<section class="section gardener-directory"><div class="container">'+
    '<p class="gardener-intro">Gardening services and suppliers are different categories. This directory is for verified gardening service providers; a business address alone is not proof that a gardener works in your suburb. Confirm availability and the job details with each provider.</p>'+
    '<div class="gardener-search-filters" role="search" aria-label="Search verified gardeners">'+
    '<label class="gardener-query">Search by business or keyword<input id="gardener-query" type="search" autocomplete="off" placeholder="Try lawn mowing, hedges or a business name"></label>'+
    '<label>Gardening service<select id="gardener-service">'+options(services,"All services")+'</select></label>'+
    '<label>Verified service area<select id="gardener-area">'+options(areas,"All areas")+'</select></label>'+
    '<button type="button" class="button secondary" id="gardener-clear">Clear filters</button></div>'+
    '<p class="gardener-result-count" id="gardener-count" role="status" aria-live="polite">'+(records.length?records.length+" verified public listings":"No verified independent listings yet")+'</p>'+
    '<div class="cards gardener-results" id="gardener-results">'+cards+'</div>'+emptyMessage+
    house+
    '<div class="gardener-guide-links"><h2>Plan your gardening job</h2>'+
    '<p>Not sure which service to request? Our free guides explain what to include in a quote and how to compare work scopes. Use the <a href="/plants/">plant finder</a> for planting inspiration, or explore <a href="/areas/">Canterbury area guides</a>.</p>'+
    '<div class="subnav">'+a("/services/garden-maintenance/","Garden maintenance","tag")+
    a("/services/lawn-mowing/","Lawn mowing","tag")+a("/services/hedge-trimming/","Hedge trimming","tag")+
    a("/guides/how-to-choose-a-gardener/","How to choose a gardener","tag")+'</div></div></div></section>';
  files["gardeners/index.html"]=layout({
    path,title:"Find Canterbury Gardeners by Service & Area | Kiwi Gardeners",
    description:"Find independent gardeners across Canterbury by verified services and actual service areas. Discover approved directory profiles and local Christchurch gardening advice.",
    content:body,trail,type:"CollectionPage",indexable:records.length>0
  });
  for(const r of records){
    const itemPath="/gardeners/"+r.slug+"/",itemTrail=[...trail,{name:r.name,path:itemPath}];
    const proofList=(items)=>'<ul class="gardener-proof-list">'+items.map(item=>
      '<li><strong>'+esc(item.name)+'</strong><small>Evidence checked '+humanDate(item.verifiedAt)+'</small></li>').join("")+'</ul>';
    const contact=r.publicContact;
    const href=hrefContact(contact);
    const external=contact.type==="website"?' target="_blank" rel="noopener noreferrer"':"";
    const profile=articleHero("Verified gardening business",r.name,r.description,itemTrail)+
      '<section class="section"><div class="container gardener-profile-layout"><article class="prose">'+
      '<p class="gardener-profile-status">Verified public GRID EATER business ID: <strong>'+esc(r.id)+'</strong></p>'+
      '<section><h2>Verified gardening services</h2><p>These service descriptions have public-source evidence. Ask the provider to confirm whether the job you need is within their scope.</p>'+proofList(r.services)+'</section>'+
      '<section><h2>Areas this business says it services</h2><p>The areas below are independently supported service areas, not inferred from a postal address. Confirm your property address before arranging work.</p>'+proofList(r.serviceAreas)+'</section>'+
      '<section><h2>Contact this gardener</h2><p>This method was approved for public use in the source export.</p>'+
      '<a class="button" href="'+esc(href)+'"'+external+'>'+esc(contactLabel(contact))+' ↗</a></section>'+
      '<section class="gardener-source-note"><h2>Source and corrections</h2><p>This directory consumes a versioned, reviewed, public-safe GRID EATER export. Business records are maintained in GRID EATER rather than edited here. Last source release '+esc(humanDate(feed.releasedAt))+'.</p>'+
      '<p><a href="'+esc(r.sourcePage)+'" target="_blank" rel="noopener noreferrer">View canonical GRID EATER business record ↗</a></p>'+
      '<p>Is a service or service area wrong? Refer to the canonical source record and request correction through GRID EATER.</p></section></article>'+
      '<aside class="gardener-profile-aside"><h2>More ways to explore</h2>'+
      '<p><a href="/gardeners/">Return to all gardeners ↗</a></p><p><a href="/guides/how-to-choose-a-gardener/">How to compare gardening quotes ↗</a></p><p><a href="/services/">Gardening work explained ↗</a></p></aside></div></section>';
    files["gardeners/"+r.slug+"/index.html"]=layout({
      path:itemPath,title:r.name+" | Verified Canterbury Gardener | Kiwi Gardeners",
      description:r.description.length>190?r.description.slice(0,185).replace(/\s+\S*$/,"")+"…":r.description,
      content:profile,trail:itemTrail,type:"WebPage",indexable:true
    });
  }
}
