import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {
  validateGridEaterPublicGardeners,loadGridEaterPublicGardeners,addGardenerDirectoryPages
} from "../src/gardener-directory.mjs";
import {buildGardenDirectoryFilterData,placeMatchesApprovedArea} from "../src/directory-filter-data.mjs";

const releasedAt="2026-11-04T02:00:00Z";
const verifiedAt="2026-11-03T05:00:00Z";
function approvedFixture(){
  return {
    schemaVersion:1,source:"grideater.com",releaseId:"canterbury-reviewed-20261104",
    releasedAt,approvedForKiwi:true,
    records:[{
      id:"afnz-9429039092267",slug:"example-gardening-business",
      name:"Example gardening business (test fixture only)",
      description:"A test-only independently reviewed Canterbury garden maintenance provider, used to validate the public-safe directory contract without publishing real businesses.",
      kind:"gardening_service",status:"published",approvedForKiwi:true,suppressed:false,
      approvedAt:verifiedAt,sourcePage:"https://grideater.com/business/example",
      services:[{name:"Garden maintenance",verifiedAt,evidenceUrl:"https://example.nz/services"}],
      serviceAreas:[{name:"Christchurch",verifiedAt,evidenceUrl:"https://example.nz/areas"}],
      publicContact:{type:"website",value:"https://example.nz/",verifiedAt,
        evidenceUrl:"https://example.nz/contact",approvedForPublicUse:true}
    }]
  };
}
const copy=()=>structuredClone(approvedFixture());
const check=feed=>validateGridEaterPublicGardeners(feed,{now:"2026-11-04T03:00:00Z"});
test("unapproved holding file has zero third-party businesses and is not a false source release",async()=>{
  const local=JSON.parse(await readFile(new URL("../src/grid-eater-gardeners-public.json",import.meta.url),"utf8"));
  const feed=check(local);
  assert.equal(feed.records.length,0);
  assert.equal(feed.approvedForKiwi,false);
  assert.equal(feed.releaseId,null);
});
test("strict public release contract accepts independently evidenced areas and website, preserves canonical ID",()=>{
  const report=check(copy());
  assert.equal(report.records.length,1);
  const record=report.records[0];
  assert.equal(record.id,"afnz-9429039092267");
  assert.equal(record.serviceAreas[0].name,"Christchurch");
  assert.equal(record.publicContact.approvedForPublicUse,true);
  assert.equal(record.kind,"gardening_service");
});
test("failing records never leak to public: unpublished, suppressed, missing service area, contact or extra private fields",()=>{
  const cases=[
    f=>{f.approvedForKiwi=false;},
    f=>{f.records[0].approvedForKiwi=false;},
    f=>{f.records[0].suppressed=true;},
    f=>{f.records[0].status="draft";},
    f=>{f.records[0].kind="gardening_supplier";},
    f=>{f.records[0].serviceAreas=[];},
    f=>{delete f.records[0].serviceAreas[0]?.verifiedAt;},
    f=>{f.records[0].serviceAreas[0].evidenceUrl="";},
    f=>{f.records[0].publicContact.approvedForPublicUse=false;},
    f=>{f.records[0].publicContact.value="javascript:alert(1)";},
    f=>{f.records[0].publicContact.value="http://example.nz";},
    f=>{f.records[0].sourcePage="https://another-site.test/business/one";},
    f=>{f.records[0].streetAddress="Private contact details";},
    f=>{f.records[0].protectedPhone="027-000000";},
    f=>{f.records[0].services.push({...f.records[0].services[0]});},
    f=>{f.records[0].slug="../not-allowed";},
    f=>{f.records.push({...f.records[0],id:"afnz-9429041785683"});},
    f=>{f.releasedAt="2024-01-01T00:00:00Z";},
  ];
  for(const mutate of cases){
    const f=copy();
    try{mutate(f)}catch(e){assert.fail("Fixture edit error: "+e.message);}
    assert.throws(()=>check(f),/KG-DIR-00 public feed rejected/,String(mutate));
  }
});
test("only an explicit trusted HTTPS GRID EATER public-feed URL may activate one build-time GET",async()=>{
  const body=JSON.stringify(copy());
  let calls=0;
  const fetchImpl=async (url,options)=>{
    calls++;
    assert.equal(url,"https://grideater.com/feeds/gardeners/v1.json");
    assert.equal(options.method,"GET");
    assert.equal(options.redirect,"error");
    return new Response(body,{status:200,headers:{"content-type":"application/json","content-length":String(body.length)}});
  };
  const result=await loadGridEaterPublicGardeners({
    readFile:async()=>{throw Error("must not use local fallback in remote mode");},
    feedUrl:"https://grideater.com/feeds/gardeners/v1.json",fetchImpl
  });
  assert.equal(calls,1);
  assert.equal(result.records.length,1);
  for(const bad of ["http://grideater.com/feeds/gardeners/v1.json",
    "https://another-site.test/feeds/gardeners/v1.json",
    "https://grideater.com/admin/db",
    "https://grideater.com/feeds/gardeners/v1.json?token=secret"
  ]){
    await assert.rejects(()=>loadGridEaterPublicGardeners({
      readFile:async()=>"",feedUrl:bad,fetchImpl
    }),/public feed rejected/);
  }
  assert.equal(calls,1,"unsafe feeds must never be fetched");
});
test("static renderer has an empty noindex directory, with independent Dallas contact, but no invented profile",()=>{
  const files={},ctx={
    esc:s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),
    a:(href,label,cls)=>'<a class="'+(cls||"")+'" href="'+href+'">'+label+'</a>',
    articleHero:(_k,title,lead)=>'<h1>'+title+'</h1><p>'+lead+'</p>',
    layout:({path,indexable,content})=>JSON.stringify({path,indexable})+"|"+content,
    files,baseTrail:[{name:"Home",path:"/"}],
    TEL_URL:"tel:+64273406581",PHONE:"027 340 6581",
    ENQUIRY_URL:"mailto:dallas@kiwigardeners.com"
  };
  addGardenerDirectoryPages(ctx,check({
    schemaVersion:1,source:"grideater.com",releaseId:null,releasedAt:null,approvedForKiwi:false,records:[]
  }));
  assert.deepEqual(Object.keys(files),["gardeners/index.html"]);
  assert.ok(files["gardeners/index.html"].includes('"indexable":false'));
  assert.ok(files["gardeners/index.html"].includes('id="gardener-query"'));
  assert.ok(files["gardeners/index.html"].includes('id="gardener-area"'));
  assert.ok(files["gardeners/index.html"].includes('id="gardener-keyword-options"'));
  assert.ok(files["gardeners/index.html"].includes('id="gardener-area-options"'));
  assert.ok(!files["gardeners/index.html"].includes('id="gardener-service"'));

  assert.ok(files["gardeners/index.html"].includes('tel:+64273406581'));
  assert.ok(!files["gardeners/index.html"].includes('data-gardener-card'));
  assert.ok(files["gardeners/index.html"].includes("No independent directory listings"));
});
test("one approved record creates searchable server-rendered hub and canonical-ID profile, without synthetic review claims",()=>{
  const files={},esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  addGardenerDirectoryPages({
    files,esc,a:(href,text)=>'<a href="'+href+'">'+esc(text)+'</a>',
    articleHero:(_k,t)=>'<h1>'+esc(t)+'</h1>',
    layout:({indexable,path,content})=>'<meta data-indexable="'+indexable+'">'+path+content,
    baseTrail:[{name:"Home",path:"/"}],
    TEL_URL:"tel:+64273406581",PHONE:"027 340 6581",
    ENQUIRY_URL:"mailto:dallas@kiwigardeners.com"
  },check(copy()));
  assert.equal(Object.keys(files).length,2);
  const hub=files["gardeners/index.html"],profile=files["gardeners/example-gardening-business/index.html"];
  assert.ok(hub.includes('data-gardener-card'));
  assert.ok(hub.includes("Verified service areas"));
  assert.ok(hub.includes('data-keywords="Garden maintenance"'),"Only approved services are searchable");
  assert.ok(!hub.includes('data-search='),"Legacy company/description search attribute must be absent");
  assert.ok(hub.includes('data-areas="Christchurch"'));

  assert.ok(hub.includes('<meta data-indexable="true">'));
  assert.ok(profile.includes("afnz-9429039092267"));
  assert.ok(profile.includes("Areas this business says it services"));
  assert.ok(profile.includes("https://grideater.com/business/example"));
  assert.ok(!/ratingValue|aggregateRating|customer review/i.test(profile));
  assert.ok(!profile.includes("dallas@kiwigardeners.com")||profile.includes("mailto:dallas@kiwigardeners.com"));
});

test("P0 public contact privacy: valid phone/email fail closed, website remains approved",()=>{
  for(const [type,value] of [
    ["phone","+64275918334"],["email","business@example.co.nz"]
  ]){
    const v=copy();
    v.records[0].publicContact={...v.records[0].publicContact,type,value};
    assert.throws(()=>check(v),/cannot expose protected phone\/email in v1/);
  }
  const good=check(copy());
  assert.equal(good.records[0].publicContact.type,"website");
  assert.equal(good.records[0].publicContact.value,"https://example.nz/");
  assert.ok(!JSON.stringify(good).includes("business@example.co.nz"));
  assert.ok(!JSON.stringify(good).includes("+64275918334"));
});

test("official NZ 2026 static lookup includes 597 populated towns/cities and rural settlements",()=>{
  const data=buildGardenDirectoryFilterData();
  assert.equal(data.version,1);
  assert.equal(data.sourceSha256,"89bb35e1ab3dc42ae5db6d47990299a74c75caecec28c18387fffe19171a161a");
  assert.equal(data.places.length,597);
  assert.equal(data.regions.length,17);
  assert.equal(data.places.filter(x=>x[2]==="urban").length,195);
  assert.equal(data.places.filter(x=>x[2]==="rural").length,402);
  const byName=name=>data.places.find(x=>x[0]===name);
  assert.equal(byName("Christchurch")[1],"13");
  assert.equal(byName("Ashburton")[1],"13");
  assert.equal(byName("Lyttelton")[1],"13");
  assert.equal(byName("Dunedin")[1],"14");
  assert.equal(byName("Richmond")[1],"1617","Cross-region Richmond must not be assigned arbitrarily");
  assert.ok(data.keywords.some(x=>x.kind==="supplier"&&x.label==="Compost"));
  assert.ok(data.keywords.some(x=>x.kind==="service"&&x.label==="Hedge trimming"));
});

test("Canterbury approved service-area claim matches regional towns, but never registered premises",()=>{
  const data=buildGardenDirectoryFilterData();
  assert.equal(placeMatchesApprovedArea(["Canterbury"],"Christchurch",data),true);
  assert.equal(placeMatchesApprovedArea(["Canterbury"],"Ashburton",data),true);
  assert.equal(placeMatchesApprovedArea(["Canterbury Region"],"Lyttelton",data),true);
  assert.equal(placeMatchesApprovedArea(["Canterbury"],"Dunedin",data),false);
  assert.equal(placeMatchesApprovedArea(["Ashburton"],"Christchurch",data),false,
    "One business premises/town does not imply all regional service coverage");
  assert.equal(placeMatchesApprovedArea(["Christchurch"],"Christchurch",data),true);
  assert.equal(placeMatchesApprovedArea(["Nelson"],"Richmond",data),true);
  assert.equal(placeMatchesApprovedArea(["Tasman"],"Richmond",data),true);
  assert.equal(placeMatchesApprovedArea(["Canterbury"],"Christchurch suburb",data),false,
    "No suburb lookup or invented coverage");
  assert.equal(placeMatchesApprovedArea([],"Christchurch",data),false);
});


test("one approved GRID EATER release holds contractor and supplier in the SAME keyword/town search",()=>{
  const mixed=copy();
  mixed.records.push({
    id:"afnz-9429041785683",slug:"fictional-supplier-reviewed",
    name:"Fictional Reviewed Plant Supplier",
    description:"A fictional source-approved plant nursery providing seedlings and compost for sale from its verified Swannanoa nursery premises, without offering gardening contracting.",
    kind:"gardening_supplier",status:"published",
    approvedForKiwi:true,suppressed:false,approvedAt:verifiedAt,
    sourcePage:"https://grideater.com/business/fictional-supplier-reviewed/",
    services:[
      {name:"Compost",verifiedAt,evidenceUrl:"https://example.nz/compost/"},
      {name:"Native plants",verifiedAt,evidenceUrl:"https://example.nz/native-plants/"}
    ],
    serviceAreas:[],
    publicLocations:[{name:"Swannanoa",verifiedAt,evidenceUrl:"https://example.nz/nursery-location/"}],
    publicContact:{type:"website",value:"https://example.nz/",verifiedAt,
      evidenceUrl:"https://example.nz/contact",approvedForPublicUse:true}
  });
  const parsed=check(mixed);
  assert.equal(parsed.records.length,2);
  assert.deepEqual(parsed.records.map(r=>r.kind),["gardening_service","gardening_supplier"]);
  const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const files={};
  addGardenerDirectoryPages({
    files,esc,a:(href,label)=>'<a href="'+href+'">'+label+'</a>',
    articleHero:(_k,title)=>'<h1>'+esc(title)+'</h1>',
    layout:({path,indexable,content})=>'<meta data-indexable="'+indexable+'">'+path+content,
    baseTrail:[{name:"Home",path:"/"}],
    TEL_URL:"tel:+64273406581",PHONE:"027 340 6581",
    ENQUIRY_URL:"mailto:dallas@kiwigardeners.com"
  },parsed);
  assert.equal(Object.keys(files).length,3,"One index and two independently approved source profiles");
  const hub=files["gardeners/index.html"];
  const nursery=files["gardeners/fictional-supplier-reviewed/index.html"];
  assert.equal((hub.match(/data-gardener-card/g)||[]).length,2);
  assert.ok(hub.includes("Verified gardening service"));
  assert.ok(hub.includes("Verified supplier"));
  assert.ok(hub.includes('data-keywords="Compost|Native plants"'));
  assert.ok(hub.includes('data-areas="" data-locations="Swannanoa"'));
  assert.ok(hub.includes("Products &amp; supplies:"));
  assert.ok(nursery.includes("Verified shop or nursery locations"));
  assert.ok(nursery.includes("Swannanoa"));
  assert.ok(!nursery.includes("Areas this business says it services"));
  assert.ok(!nursery.includes("Verified delivery areas"),
    "The nursery premises must not claim a delivery territory");
  assert.ok(!nursery.includes("27 000 000"));
  assert.ok(!hub.includes("approvedForKiwi"));
});
test("supplier location cannot become implied delivery coverage or unsupported private location",()=>{
  const original=copy();
  original.records[0].kind="gardening_supplier";
  original.records[0].serviceAreas=[];
  original.records[0].services=[{name:"Mulch",verifiedAt,evidenceUrl:"https://example.nz/mulch/"}];
  original.records[0].publicLocations=[{name:"Ashburton",verifiedAt,evidenceUrl:"https://example.nz/shop/"}];
  assert.equal(check(original).records[0].publicLocations[0].name,"Ashburton");
  for(const change of [
    rec=>{rec.publicLocations=[];},
    rec=>{delete rec.publicLocations;},
    rec=>{rec.publicLocations[0].inferredFromRegistration=true;},
    rec=>{rec.publicLocations[0].evidenceUrl="http://example.nz/";},
    rec=>{rec.publicContact.value="mailto:private@example.nz";}
  ]){
    const invalid=structuredClone(original);
    change(invalid.records[0]);
    assert.throws(()=>check(invalid),/public feed rejected/);
  }
  const invalid=copy();
  invalid.records[0].publicLocations=[{name:"Canterbury",verifiedAt,evidenceUrl:"https://example.nz"}];
  assert.throws(()=>check(invalid),/public feed rejected/,
    "Contractors must not add supplier premises to expand their search coverage");
});
