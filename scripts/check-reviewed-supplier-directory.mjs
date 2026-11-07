import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {validateReviewedSuppliers,loadReviewedSuppliers,addReviewedSupplierPages} from "../src/reviewed-supplier-directory.mjs";

const read=path=>readFile(path,"utf8");
const now="2026-11-08T03:00:00Z";
const fixture=JSON.parse(await read("src/grid-eater-reviewed-garden-suppliers.json"));

test("exact 2 real source-reviewed supplier identities, not contractors",async()=>{
  const data=await loadReviewedSuppliers({readFile:read,now});
  assert.equal(data.records.length,2);
  assert.deepEqual(data.records.map(x=>x.id),["afnz-9429041785683","afnz-9429039092267"]);
  for(const r of data.records){
    assert.equal(r.kind,"garden_supplier");
    assert.equal(r.localityBasis,"first_party_premises_only");
    assert.ok(r.canonicalPage.includes(r.id.slice(5)));
    assert.match(r.evidenceUrl,/^https:\/\//);
    assert.match(r.officialWebsite,/^https:\/\//);
    assert.ok(!Object.keys(r).includes("publicContact"));
    assert.ok(!Object.keys(r).includes("serviceAreas"));
    assert.ok(!Object.keys(r).includes("phone"));
    assert.ok(!Object.keys(r).includes("email"));
  }
});
test("reject synthetic service-area claims, unapproved fields, duplicate ID, source changes",()=>{
  for(const bad of [
    { ...fixture,source:"another-site.com" },
    { ...fixture,records:fixture.records.map((r,i)=>i===0?{...r,serviceAreas:["Canterbury"]}:r) },
    { ...fixture,records:[fixture.records[0],fixture.records[0]] },
    { ...fixture,records:fixture.records.map((r,i)=>i===0?{...r,kind:"gardening_service"}:r) },
    { ...fixture,records:fixture.records.map((r,i)=>i===0?{...r,canonicalPage:"https://grideater.com/business/unrelated-9429000000000"}:r) },
    { ...fixture,records:fixture.records.map((r,i)=>i===0?{...r,officialWebsite:"http://example.com/"}:r) },
  ]) assert.throws(()=>validateReviewedSuppliers(bad,{now}),/_HOLD$/);
});
test("source snapshot goes stale rather than silently implying fresh information",()=>{
  assert.throws(()=>validateReviewedSuppliers(fixture,{now:"2027-05-01T00:00:00Z"}),/STALE_OR_FUTURE_REVIEW_HOLD/);
});
test("build renders 1 supplier hub and 2 supplier profiles with no contact values",()=>{
  const data=validateReviewedSuppliers(fixture,{now});
  const files={};
  const esc=x=>String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const layout=x=>x.content+"<!--indexable:"+x.indexable+"-->";
  const articleHero=(a,b,c)=>'<h1>'+esc(b)+'</h1><p>'+esc(c)+'</p>';
  addReviewedSupplierPages({esc,articleHero,layout,files,baseTrail:[{name:"Home",path:"/"}]},data);
  const htmlPaths=Object.keys(files).filter(x=>x.endsWith("index.html"));
  assert.equal(htmlPaths.length,3);
  for(const p of htmlPaths){
    assert.match(files[p],/public.source|Public.source|public-source|Public-source/i);
    assert.doesNotMatch(files[p],/tel:|mailto:|verified service area|phone number/i);
  }
  assert.match(files["suppliers/index.html"],/Goughs Nurseries/);
  assert.match(files["suppliers/index.html"],/Ashburton Contracting/);
  const status=JSON.parse(files["assets/supplier-directory-status.json"]);
  assert.equal(status.editorialSupplierListings,2);
  assert.equal(status.canonicalCategoryAssignmentsByThisRelease,0);
  assert.equal(status.verifiedServiceAreaClaims,0);
});
