import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {validateFirstPartyServiceReferences,loadFirstPartyServices,addFirstPartyServiceReferencePages} from "../src/reviewed-gardening-service-directory.mjs";

const now="2026-11-08T03:00:00Z";
const load=path=>readFile(path,"utf8");
const fixture=JSON.parse(await load("src/grid-eater-reviewed-gardening-services.json"));
test("real Wordsworth canonical ID and direct first-party source, not feed approval",async()=>{
 const x=await loadFirstPartyServices({readFile:load,now});
 assert.equal(x.records.length,1);
 const r=x.records[0];
 assert.equal(r.id,"afnz-9429052264047");
 assert.equal(r.slug,"wordsworth-gardens");
 assert.equal(r.sourceWebsite,"https://www.wordsworthgardens.com/");
 assert.equal(r.sourceServices,"https://www.wordsworthgardens.com/services");
 assert.equal(r.coverageClaim,"Canterbury");
 assert.equal(r.approvedGardenerFeedMember,false);
 for(const k of ["email","phone","street","serviceAreas","canonicalCategoryVerified"])
   assert.ok(!Object.hasOwn(r,k));
});
test("reject fabricated category/area/permission and any unknown fields",()=>{
 for(const bad of [
  {...fixture,source:"another-site.com"},
  {...fixture,records:[{...fixture.records[0],approvedGardenerFeedMember:true}]},
  {...fixture,records:[{...fixture.records[0],canonicalServiceAreaAssignmentVerified:true}]},
  {...fixture,records:[{...fixture.records[0],canonicalCategoryAssignmentVerified:true}]},
  {...fixture,records:[{...fixture.records[0],contactEmail:"exposed@example.invalid"}]},
  {...fixture,records:[{...fixture.records[0],id:"afnz-9999999999999"}]},
  {...fixture,records:[{...fixture.records[0],sourceWebsite:"https://wrong-site.example/"}]}
 ])assert.throws(()=>validateFirstPartyServiceReferences(bad,{now}),/_HOLD$/);
});
test("review expiry stops old editorial claims being reused",()=>{
 assert.throws(()=>validateFirstPartyServiceReferences(fixture,{now:"2027-07-01T00:00:00Z"}),/DATE_HOLD/);
});
test("render indexable hub and service profile, zero contact values",()=>{
 const snapshot=validateFirstPartyServiceReferences(fixture,{now});
 const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
 const files={};
 addFirstPartyServiceReferencePages({esc,
  articleHero:(k,t,d)=>'<h1>'+esc(t)+'</h1><p>'+esc(d)+'</p>',
  layout:x=>x.content+"<!-- indexable:"+String(x.indexable)+" -->",
  files,baseTrail:[{name:"Home",path:"/"}]},snapshot);
 assert.equal(Object.keys(files).filter(k=>k.endsWith("/index.html")).length,2);
 for(const p of ["garden-service-providers/index.html","garden-service-providers/wordsworth-gardens/index.html"]){
  const html=files[p];
  assert.match(html,/Wordsworth Gardens/);
  assert.match(html,/first.party|First.party|First-party/i);
  assert.doesNotMatch(html,/mailto:|tel:|162 Travis Road|wordsworthgardensnz@gmail.com/i);
  assert.match(html,/indexable:true/);
 }
 const status=JSON.parse(files["assets/service-editorial-status.json"]);
 assert.equal(status.records,1);
 assert.equal(status.canonicalCategoryAssignmentsByKiwi,0);
 assert.equal(status.verifiedServesMappingsByKiwi,0);
 assert.equal(status.approvedPublicGardenerFeedRecordsByKiwi,0);
 assert.equal(status.protectedContactValuesCopied,false);
});
