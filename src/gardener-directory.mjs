// Kiwi Gardeners read-only consumer for a separately approved GRID EATER public export.
// No direct D1/CRM access, protected contacts or crawler work.
// Provisional NZBN registered towns may appear with an explicit inference label.
const MAX_RECORDS=200;
const MAX_BYTES=512_000;
const ROOT_KEYS=["schemaVersion","source","releaseId","releasedAt","approvedForKiwi","records"];
const RECORD_KEYS=["id","slug","name","description","kind","status","approvedForKiwi","suppressed","approvedAt","sourcePage","services","serviceAreas","publicLocations","publicContact"];
const PROOF_KEYS=["name","verifiedAt","evidenceUrl"];
const PROVISIONAL_AREA_BASIS="nzbn_registered_locality";
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
function proof(value,at,{allowProvisional=false}={}){
  keys(value,allowProvisional?[...PROOF_KEYS,"basis"]:PROOF_KEYS,at);
  if(value.basis!==undefined&&(allowProvisional!==true||value.basis!==PROVISIONAL_AREA_BASIS))
    reject(at+" invalid provisional locality basis");
  return {
    name:string(value.name,at+".name",3,90),
    verifiedAt:iso(value.verifiedAt,at+".verifiedAt"),
    evidenceUrl:httpsUrl(value.evidenceUrl,at+".evidenceUrl"),
    ...(value.basis?{basis:value.basis}:{})
  };
}
function contact(value,at){
  keys(value,CONTACT_KEYS,at);
  if(value.approvedForPublicUse!==true)reject(at+" lacks explicit public contact approval");
  const type=string(value.type,at+".type");
  // The approved v1 static feed has no verified cross-site protected-action
  // contract. Fail closed: phone and email must NEVER appear as public values.
  if(type!=="website")reject(at+" cannot expose protected phone/email in v1");
  return {type:"website",value:httpsUrl(value.value,at+".value"),
    verifiedAt:iso(value.verifiedAt,at+".verifiedAt"),
    evidenceUrl:httpsUrl(value.evidenceUrl,at+".evidenceUrl"),
    approvedForPublicUse:true};
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
    const supplier=row.kind==="gardening_supplier";
    if(!["gardening_service","gardening_supplier"].includes(row.kind)||
      row.status!=="published"||row.approvedForKiwi!==true||row.suppressed!==false)
      reject(at+" is not an approved active public gardening business");
    if(!Array.isArray(row.services)||!row.services.length||row.services.length>16
      ||!Array.isArray(row.serviceAreas)||row.serviceAreas.length>25
      ||(!supplier&&(!row.serviceAreas.length||row.publicLocations!==undefined))
      ||(supplier&&(!Array.isArray(row.publicLocations)||row.publicLocations.length>25
        ||(!row.publicLocations.length&&!row.serviceAreas.length))))
      reject(at+" requires independently verified offerings and service, delivery or premises area");
    const services=row.services.map((v,i)=>proof(v,at+".services["+i+"]"));
    const serviceAreas=row.serviceAreas.map((v,i)=>proof(v,at+".serviceAreas["+i+"]",{allowProvisional:true}));
    const publicLocations=supplier?row.publicLocations.map((v,i)=>proof(v,at+".publicLocations["+i+"]")):[];
    if([services,serviceAreas,publicLocations].some(arr=>
      new Set(arr.map(v=>v.name.toLowerCase())).size!==arr.length))
      reject(at+" duplicate service/area evidence");
    return {
      id,slug,name:string(row.name,at+".name",3,110),
      description:string(row.description,at+".description",70,450),
      kind:row.kind,status:"published",approvedForKiwi:true,suppressed:false,
      approvedAt:iso(row.approvedAt,at+".approvedAt"),
      sourcePage:httpsUrl(row.sourcePage,at+".sourcePage","grideater.com"),
      services,serviceAreas,...(supplier?{publicLocations}:{}),
      publicContact:contact(row.publicContact,at+".publicContact")
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
const hrefContact=(v)=>v.value;
const contactLabel=()=>"Visit verified website";

export function addGardenerDirectoryPages({esc,a,articleHero,layout,files,baseTrail,TEL_URL,PHONE,ENQUIRY_URL},feed){
  const records=feed.records;
  const path="/gardeners/";
  const trail=[...baseTrail,{name:"Gardening services and supplies",path}];
  const cards=records.map(r=>{
    // Searchable terms are approved commercial service/product facts ONLY,
    // not business names, addresses, generic descriptions or SEO metadata.
    const supplier=r.kind==="gardening_supplier";
    const facts=r.services.map(x=>x.name).join("|");
    const provisional=r.serviceAreas.filter(x=>x.basis===PROVISIONAL_AREA_BASIS);
    const confirmed=r.serviceAreas.filter(x=>x.basis!==PROVISIONAL_AREA_BASIS);
    return '<article class="card gardener-directory-card" data-gardener-card data-keywords="'+esc(facts)+
      '" data-areas="'+esc(r.serviceAreas.map(x=>x.name).join("|"))+
      '" data-locations="'+esc((r.publicLocations||[]).map(x=>x.name).join("|"))+'">'+
      '<div class="gardener-card-meta"><span class="tag">'+(supplier?'Verified supplier':'Verified gardening service')+'</span><span>GRID EATER ID: '+esc(r.id)+'</span></div>'+
      '<h3><a href="/gardeners/'+r.slug+'/">'+esc(r.name)+'</a></h3>'+
      '<p>'+esc(r.description)+'</p>'+
      '<p class="gardener-card-fields"><strong>'+(supplier?'Products &amp; supplies:':'Services:')+'</strong> '+esc(r.services.map(x=>x.name).join(", "))+'</p>'+
      (confirmed.length?'<p class="gardener-card-fields"><strong>'+(supplier?'Verified delivery areas:':'Verified service areas:')+'</strong> '+esc(confirmed.map(x=>x.name).join(", "))+'</p>':'')+
      (provisional.length?'<p class="gardener-card-fields"><strong>Likely local area (NZBN registration):</strong> '+esc(provisional.map(x=>x.name).join(", "))+' <small>Unconfirmed; ask the provider about coverage.</small></p>':'')+
      (supplier&&r.publicLocations.length?'<p class="gardener-card-fields"><strong>Shop / nursery locations:</strong> '+esc(r.publicLocations.map(x=>x.name).join(", "))+'</p>':'')+
      '<a class="gardener-card-link" href="/gardeners/'+r.slug+'/">View '+(supplier?'supplier':'gardener')+' profile ↗</a></article>';
  }).join("");
  const house='<aside class="gardener-house" aria-label="Kiwi Gardeners own gardening service">'+
    '<div><span class="eyebrow">From Kiwi Gardeners</span><h2>Need a gardener in Christchurch?</h2>'+
    '<p>Dallas Timpson is the independent gardener behind Kiwi Gardeners. Contact him directly to discuss lawn mowing, garden maintenance and tidy-ups. Confirm your address and job when requesting a quote.</p></div>'+
    '<div class="button-row"><a class="button" href="'+TEL_URL+'">Call Dallas · '+PHONE+'</a>'+
    '<a class="button secondary" href="'+ENQUIRY_URL+'">Email an enquiry ↗</a></div>'+
    '<p class="micro">This is our own service, shown separately from independent GRID EATER directory results. It is not an organic directory listing.</p></aside>';
  const emptyMessage=records.length?'<p id="gardener-empty" class="gardener-empty" hidden>No approved gardening businesses match these filters. Try fewer filters or confirm delivery and service areas directly with a provider.</p>':
    '<div class="gardener-empty"><strong>No independent directory listings are published yet.</strong><p>Approved gardening contractors, nurseries and suppliers appear here only when their categories, public offerings, service/delivery areas or premises, and contact permissions have passed GRID EATER review. Our Christchurch guides and Dallas enquiry service remain available.</p></div>';
  const body=articleHero("New Zealand gardening directory","Find gardening services and supplies",
    "Search gardening keywords and towns across New Zealand. Only independently approved GRID EATER records appear in directory results.",trail)+
    '<section class="section gardener-directory"><div class="container">'+
    '<p class="gardener-intro">One search for approved gardening services, nurseries, plants and supplies across New Zealand. A region-wide service or delivery claim can match towns in that region. A registered NZBN town may be used as a provisional local-area search clue and is labelled unconfirmed. A verified shop or nursery location matches only its own town and does not imply delivery or contracting coverage.</p>'+
    '<div class="gardener-search-filters" role="search" aria-label="Search approved gardening businesses">'+
    '<div class="gardener-filter-field gardener-query"><label for="gardener-query">Gardening service or supplies</label>'+
      '<div class="gardener-combobox"><input id="gardener-query" type="search" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-controls="gardener-keyword-options" aria-expanded="false" autocomplete="off" spellcheck="false" placeholder="Try lawn mowing, native plants or compost">'+
      '<ul id="gardener-keyword-options" class="gardener-suggestions" role="listbox" hidden></ul></div></div>'+
    '<div class="gardener-filter-field gardener-place"><label for="gardener-area">Town or city (New Zealand)</label>'+
      '<div class="gardener-combobox"><input id="gardener-area" type="search" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-controls="gardener-area-options" aria-expanded="false" autocomplete="off" spellcheck="false" placeholder="Start typing a town or city">'+
      '<ul id="gardener-area-options" class="gardener-suggestions" role="listbox" hidden></ul></div></div>'+
    '<button type="button" class="button secondary" id="gardener-clear">Clear filters</button></div>'+
    '<p id="gardener-filter-help" class="micro gardener-filter-help">Type a gardening service or supplies keyword and NZ town. Results use approved offerings, verified premises, confirmed coverage and clearly labelled provisional NZBN registration towns. Confirm actual service or delivery with the provider.</p>'+
    '<p class="gardener-result-count" id="gardener-count" role="status" aria-live="polite">'+(records.length?records.length+" verified public listings":"No verified independent listings yet")+'</p>'+
    '<div class="cards gardener-results" id="gardener-results">'+cards+'</div>'+emptyMessage+
    house+
    '<div class="gardener-guide-links"><h2>Plan your gardening job</h2>'+
    '<p>Not sure which service to request? Our free guides explain what to include in a quote and how to compare work scopes. Use the <a href="/plants/">plant finder</a> for planting inspiration, or explore <a href="/areas/">Canterbury area guides</a>.</p>'+
    '<div class="subnav">'+a("/services/garden-maintenance/","Garden maintenance","tag")+
    a("/services/lawn-mowing/","Lawn mowing","tag")+a("/services/hedge-trimming/","Hedge trimming","tag")+
    a("/guides/how-to-choose-a-gardener/","How to choose a gardener","tag")+'</div></div></div></section>';
  files["gardeners/index.html"]=layout({
    path,title:"Find NZ Gardening Services & Supplies by Town | Kiwi Gardeners",
    description:"Search approved gardening services and supplies by keyword and New Zealand town or city. Region-wide coverage only follows independently evidenced business claims.",
    content:body,trail,type:"CollectionPage",indexable:records.length>0
  });
  for(const r of records){
    const itemPath="/gardeners/"+r.slug+"/",itemTrail=[...trail,{name:r.name,path:itemPath}];
    const proofList=(items)=>'<ul class="gardener-proof-list">'+items.map(item=>
      '<li><strong>'+esc(item.name)+'</strong><small>Evidence checked '+humanDate(item.verifiedAt)+'</small></li>').join("")+'</ul>';
    const contact=r.publicContact;
    const href=hrefContact(contact);
    const external=contact.type==="website"?' target="_blank" rel="noopener noreferrer"':"";
    const supplier=r.kind==="gardening_supplier";
    const profile=articleHero(supplier?"Verified gardening supplier":"Verified gardening service",r.name,r.description,itemTrail)+
      '<section class="section"><div class="container gardener-profile-layout"><article class="prose">'+
      '<p class="gardener-profile-status">Verified public GRID EATER business ID: <strong>'+esc(r.id)+'</strong></p>'+
      '<section><h2>'+(supplier?'Verified products &amp; supplies':'Verified gardening services')+'</h2><p>'+(supplier?'These supplier offerings have public-source evidence. Confirm products, availability, prices and pickup terms directly.':'These services have public-source evidence. Ask the provider to confirm the work scope.')+'</p>'+proofList(r.services)+'</section>'+
      (r.serviceAreas.some(x=>!x.basis)?'<section><h2>'+(supplier?'Verified delivery areas':'Areas this business says it services')+'</h2><p>Confirmed from public business evidence.</p>'+proofList(r.serviceAreas.filter(x=>!x.basis))+'</section>':'')+
      (r.serviceAreas.some(x=>x.basis===PROVISIONAL_AREA_BASIS)?'<section><h2>Likely local area (NZBN registration)</h2><p>This town or city is inferred from the business registration, not confirmed as a service or delivery area. Contact the provider to check coverage.</p>'+proofList(r.serviceAreas.filter(x=>x.basis===PROVISIONAL_AREA_BASIS))+'</section>':'')+
      (supplier&&r.publicLocations.length?'<section><h2>Verified shop or nursery locations</h2><p>These premises locations do not imply any delivery territory or on-site gardening service.</p>'+proofList(r.publicLocations)+'</section>':'')+
      '<section><h2>Contact this business</h2><p>This website was approved for public use in GRID EATER&#39;s source export.</p>'+
      '<a class="button" href="'+esc(href)+'"'+external+'>'+esc(contactLabel(contact))+' ↗</a></section>'+
      '<section class="gardener-source-note"><h2>Source and corrections</h2><p>This directory consumes a versioned, reviewed, public-safe GRID EATER export. Business records are maintained in GRID EATER rather than edited here. Last source release '+esc(humanDate(feed.releasedAt))+'.</p>'+
      '<p><a href="'+esc(r.sourcePage)+'" target="_blank" rel="noopener noreferrer">View canonical GRID EATER business record ↗</a></p>'+
      '<p>Is a service or service area wrong? Refer to the canonical source record and request correction through GRID EATER.</p></section></article>'+
      '<aside class="gardener-profile-aside"><h2>More ways to explore</h2>'+
      '<p><a href="/gardeners/">Return to all gardeners ↗</a></p><p><a href="/guides/how-to-choose-a-gardener/">How to compare gardening quotes ↗</a></p><p><a href="/services/">Gardening work explained ↗</a></p></aside></div></section>';
    files["gardeners/"+r.slug+"/index.html"]=layout({
      path:itemPath,title:r.name+" | Verified Gardening "+(supplier?"Supplier":"Service")+" | Kiwi Gardeners",
      description:r.description.length>190?r.description.slice(0,185).replace(/\s+\S*$/,"")+"…":r.description,
      content:profile,trail:itemTrail,type:"WebPage",indexable:true
    });
  }
}
