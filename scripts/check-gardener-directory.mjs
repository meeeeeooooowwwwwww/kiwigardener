import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {
  validateGridEaterPublicGardeners,loadGridEaterPublicGardeners,addGardenerDirectoryPages
} from "../src/gardener-directory.mjs";

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
