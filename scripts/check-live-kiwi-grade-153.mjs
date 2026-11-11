import test from "node:test";
import assert from "node:assert/strict";
import {checkNativeGradeHub} from "./verify-live-kiwi-grade-153.mjs";
const source=()=>({records:Array.from({length:153},(_,i)=>({
 services:[i<21?{name:"Lawn care"}:{name:"Indicative gardening services",basis:"nzbn_bic_provisional"}],
 publicContact:{type:i<21?"website":"grid_profile"}
}))});
function hub(feed){
 return '<h1>153 listed businesses · 21 source-reviewed · 132 provisional NZBN</h1>'+
  "<p>These provisional records are discovery leads and not confirmed locations.</p>"+
  "<p>Town / service area not confirmed.</p><p>Dallas Timpson</p>"+
  feed.records.map((r,i)=>
   '<article data-gardener-card data-source-grade="'+
    (r.services[0].basis?"provisional":"reviewed")+
    '"><span>NZBN: '+String(9429000000000+i)+'</span>'+
    (r.publicContact.type==="website"?"Visit verified business website":
     "Contact options on GRID EATER")+"</article>").join("")+
   " ".repeat(2000);
}
test("source-backed 153 precise reviewed vs provisional and direct contact acceptance",()=>{
 const feed=source(),html=hub(feed),r=checkNativeGradeHub(feed,html);
 assert.equal(r.reviewed,21);assert.equal(r.provisional,132);
 assert.equal(r.sourceContactTypeGrid,132);
 assert.equal(r.sourceContactTypeWebsite,21);
 assert.equal(r.d1Queries,0);
 assert.equal(r.d1Writes,0);
 assert.equal(r.cards,153);
});
test("wrong badge/grade/count/contact link, private fields fail closed",()=>{
 const feed=source(),html=hub(feed);
 assert.throws(()=>checkNativeGradeHub(feed,html.replace(
  "21 source-reviewed · 132 provisional","153 verified"
  )),/INITIAL_COUNT/);
 assert.throws(()=>checkNativeGradeHub(feed,html.replace(
  'data-source-grade="provisional"','data-source-grade="reviewed"'
  )),/CARD_GRADES/);
 assert.throws(()=>checkNativeGradeHub(feed,html.replace(
  "Contact options on GRID EATER","Broken contact"
  )),/CARD_CONTACTS/);
 assert.throws(()=>checkNativeGradeHub(feed,html+'"emails": {}'),/CONTACT_LEAK/);
 const wrong=source();wrong.records[21].services[0].basis=undefined;
 assert.throws(()=>checkNativeGradeHub(wrong,html),/SOURCE_GRADE/);
});
