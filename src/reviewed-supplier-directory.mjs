// KG-DIR-01A: static, publicly sourced SUPPLIER editorial projection.
// GRID EATER is the canonical business identity owner. This is NOT a
// canonical taxonomy assignment, verified contractor service area, raw
// protected-contact export, D1 mirror or current stock/availability feed.
const MAX_RECORDS=40;
const TOP_KEYS=["schemaVersion","snapshotKind","source","reviewedAt","approvalScope","records"];
const ROW_KEYS=["id","slug","name","kind","category","locality","localityBasis","summary","products","officialWebsite","evidenceUrl","canonicalPage"];
const reject=code=>{throw new Error("KG_SUPPLIERS_"+code+"_HOLD");};
const exactKeys=(o,fields)=>{
  if(!o||typeof o!=="object"||Array.isArray(o)||
    Object.keys(o).some(k=>!fields.includes(k))||
    fields.some(k=>!Object.hasOwn(o,k)))reject("UNKNOWN_OR_MISSING_FIELDS");
};
const text=(x,min,max)=>{
  if(typeof x!=="string"||x.trim().length<min||x.length>max||/[\u0000-\u001f\u007f]/.test(x))
    reject("INVALID_TEXT");
  return x.trim();
};
const url=(x,allowedHost)=>{
  let parsed;
  try{parsed=new URL(text(x,12,350));}catch{reject("INVALID_URL");}
  if(parsed.protocol!=="https:"||parsed.username||parsed.password||parsed.search||parsed.hash||
    parsed.hostname!==allowedHost||parsed.port)reject("UNTRUSTED_URL");
  return parsed.toString();
};
const date=(x,now)=>{
  if(typeof x!=="string"||! /^\d{4}-\d{2}-\d{2}$/.test(x))reject("REVIEW_DATE");
  const at=Date.parse(x+"T00:00:00Z");
  if(!Number.isFinite(at)||at>Date.parse(now)+86400000||
      Date.parse(now)-at>90*86400000)reject("STALE_OR_FUTURE_REVIEW");
  return x;
};
export function validateReviewedSuppliers(data,{now=new Date().toISOString()}={}){
  exactKeys(data,TOP_KEYS);
  if(data.schemaVersion!==1||
    data.snapshotKind!=="public-source-editorial-projection"||
    data.source!=="grideater.com"||
    data.approvalScope!=="kiwigardeners.com-garden-suppliers-editorial")
    reject("WRONG_SOURCE_OR_SCOPE");
  const reviewedAt=date(data.reviewedAt,now);
  if(!Array.isArray(data.records)||!data.records.length||data.records.length>MAX_RECORDS)
    reject("EMPTY_OR_OVERSIZED_SNAPSHOT");
  const ids=new Set(),slugs=new Set();
  const rows=data.records.map(r=>{
    exactKeys(r,ROW_KEYS);
    const id=text(r.id,18,18);
    if(!/^afnz-\d{13}$/.test(id)||r.kind!=="garden_supplier"||
       r.localityBasis!=="first_party_premises_only")
      reject("NONCANONICAL_OR_UNSUPPORTED_KIND");
    const slug=text(r.slug,3,90);
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||ids.has(id)||slugs.has(slug))
      reject("DUPLICATE_OR_INVALID_ID");
    ids.add(id);slugs.add(slug);
    const canonical=url(r.canonicalPage,"grideater.com");
    if(!new URL(canonical).pathname.startsWith("/business/")||
        !new URL(canonical).pathname.endsWith("-"+id.slice(5)))reject("MISMATCHED_CANONICAL_LINK");
    const websiteHost=new URL(r.officialWebsite).hostname;
    if(!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(websiteHost)||
      websiteHost==="grideater.com"||websiteHost==="kiwigardeners.com")
      reject("INVALID_SOURCE_HOST");
    const website=url(r.officialWebsite,websiteHost);
    const evidence=url(r.evidenceUrl,websiteHost);
    if(!Array.isArray(r.products)||r.products.length<1||r.products.length>12)
      reject("MISSING_PRODUCTS");
    const products=r.products.map(p=>text(p,3,80));
    if(new Set(products.map(x=>x.toLowerCase())).size!==products.length)
      reject("DUPLICATE_PRODUCTS");
    return {
      id,slug,name:text(r.name,3,100),kind:r.kind,category:text(r.category,5,100),
      locality:text(r.locality,3,100),localityBasis:r.localityBasis,
      summary:text(r.summary,80,480),products,officialWebsite:website,
      evidenceUrl:evidence,canonicalPage:canonical
    };
  });
  return {schemaVersion:1,source:data.source,snapshotKind:data.snapshotKind,
    approvalScope:data.approvalScope,reviewedAt,records:rows};
}
export async function loadReviewedSuppliers({readFile,now}={}){
  if(typeof readFile!=="function")reject("MISSING_READER");
  const raw=await readFile("src/grid-eater-reviewed-garden-suppliers.json","utf8");
  if(raw.length>24000)reject("SOURCE_TOO_LARGE");
  let data;
  try{data=JSON.parse(raw);}catch{reject("INVALID_JSON");}
  return validateReviewedSuppliers(data,{now});
}
export function addReviewedSupplierPages({esc,articleHero,layout,files,baseTrail},snapshot) {
  const hub="/suppliers/",trail=[...baseTrail,{name:"Garden suppliers",path:hub}];
  const card=(r)=>'<article class="card"><div class="card-body"><span class="tag">Garden supplier · Public-source review</span>'+
    '<h2><a href="/suppliers/'+esc(r.slug)+'/">'+esc(r.name)+'</a></h2>'+
    '<p>'+esc(r.summary)+'</p>'+
    '<p><strong>Supplier premises:</strong> '+esc(r.locality)+'</p>'+
    '<p><strong>Products:</strong> '+esc(r.products.join(", "))+'</p>'+
    '<a href="/suppliers/'+esc(r.slug)+'/">View supplier information ↗</a></div></article>';
  const note='<p class="micro">Locations describe documented supplier premises, not a service radius, delivery coverage or a verified contractor area. Product categories are editorial summaries based on linked first-party evidence, not automatically assigned GRID EATER canonical categories. Confirm current stock and delivery with the supplier. No private contact details are copied here.</p>';
  const intro=articleHero("Canterbury garden supplies","Garden suppliers in Canterbury",
    "Explore public-source-reviewed nurseries and landscaping material suppliers. Compare the products they describe and visit the business’s own website for current details.",trail);
  files["suppliers/index.html"]=layout({
    path:hub,title:"Garden Suppliers in Canterbury | Nurseries, Soil & Mulch | Kiwi Gardeners",
    description:"Source-reviewed Canterbury garden suppliers including nursery plants, compost, bark, soil and landscaping materials. Business premises and source links, no invented delivery areas.",
    content:intro+'<section class="section"><div class="container"><p>Looking for someone to carry out gardening work? <a href="/gardeners/">Browse the separate gardener directory</a>. These businesses supply plants and materials; supplier status does not imply they mow lawns or trim hedges.</p><div class="cards">'+snapshot.records.map(card).join("")+'</div>'+note+'</div></section>',
    trail,type:"CollectionPage",indexable:snapshot.records.length>0
  });
  for(const r of snapshot.records){
    const path="/suppliers/"+r.slug+"/";
    const t=[...trail,{name:r.name,path}];
    const products='<ul>'+r.products.map(p=>'<li>'+esc(p)+'</li>').join("")+'</ul>';
    files["suppliers/"+r.slug+"/index.html"]=layout({
      path,title:r.name+" | Canterbury Garden Supplier | Kiwi Gardeners",
      description:r.summary.length>200?r.summary.slice(0,195).replace(/\s+\S*$/,"")+"…":r.summary,
      trail:t,type:"WebPage",indexable:true,
      content:articleHero("Garden supplier · Public source review",r.name,r.summary,t)+
        '<section class="section"><div class="container text-layout"><article class="prose">'+
        '<h2>What this supplier offers</h2><p>'+esc(r.summary)+'</p>'+products+
        '<h2>Supplier premises</h2><p><strong>'+esc(r.locality)+'</strong> is a location described by the supplier’s website, not an inferred service area, delivery promise or NZBN registered-address disclosure. Confirm stock, collections and delivery directly.</p>'+
        '<h2>Check the business at source</h2><p>This reference was reviewed on '+esc(snapshot.reviewedAt)+'. GRID EATER remains the canonical owner of this business identity; Kiwi Gardeners publishes a limited public-source editorial reference, not an independent database of business details.</p>'+
        '<p><a href="'+esc(r.officialWebsite)+'" target="_blank" rel="noopener noreferrer">Visit supplier website ↗</a></p>'+
        '<p><a href="'+esc(r.canonicalPage)+'" target="_blank" rel="noopener noreferrer">View GRID EATER canonical business record ↗</a></p>'+
        '<p>See the <a href="'+esc(r.evidenceUrl)+'" target="_blank" rel="noopener noreferrer">first-party evidence page</a> for current details. Report inaccurate canonical details through the GRID EATER listing.</p>'+
        note+'</article><aside class="sidebar"><h3>More garden resources</h3>'+
        '<p><a href="/suppliers/">More Canterbury garden suppliers</a></p>'+
        '<p><a href="/plants/">Plant finder</a></p>'+
        '<p><a href="/gardeners/">Garden service providers</a></p></aside></div></section>'
    });
  }
  files["assets/supplier-directory-status.json"]=JSON.stringify({
    schemaVersion:1,source:"grideater.com",kind:"public-source-editorial-projection",
    reviewedAt:snapshot.reviewedAt,canonicalIds:snapshot.records.map(x=>x.id),
    editorialSupplierListings:snapshot.records.length,
    canonicalCategoryAssignmentsByThisRelease:0,
    verifiedServiceAreaClaims:0
  },null,2)+"\n";
}
