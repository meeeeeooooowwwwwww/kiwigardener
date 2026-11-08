import test from "node:test";
import assert from "node:assert/strict";
import {validateLive,ID,ORIGIN,SLUG,RELEASE} from "../scripts/verify-live-first-gardener.mjs";

const path="/gardeners/"+SLUG+"/";
function fixture(){
 return {
  hub:'<html><meta name="robots" content="index,follow,max-image-preview:large">'+
    '<article data-gardener-card data-keywords="Hedges|Lawns|Weeding|Irrigation|Landscaping"'+
    ' data-areas="Christchurch"><a href="'+path+'">Wordsworth Gardens</a>'+ID+'</article>'+
    '<p>Dallas Timpson</p></html>',
  profile:'<html><meta name="robots" content="index,follow,max-image-preview:large">'+
    '<link rel="canonical" href="'+ORIGIN+path+'">'+
    'Wordsworth Gardens '+ID+' Christchurch https://www.wordsworthgardens.com/ '+
    'https://grideater.com/business/'+SLUG+'</html>',
  sitemap:'<urlset><loc>'+ORIGIN+'/gardeners/</loc><loc>'+ORIGIN+path+'</loc></urlset>',
  status:{schemaVersion:1,source:"grideater.com",releaseId:RELEASE,
    approvedForKiwi:true,publishedListings:1},
  contact:'<html>dallas@kiwigardeners.com <form action="/api/contact"></form></html>'.repeat(8)
 };
}
test("approved live source with one directory card/profile, sitemap and independent Dallas passes",()=>{
 const a=fixture();
 assert.equal(validateLive(a).status,"FIRST_LIVE_KIWI_GARDENERS_WORDSWORTH_PROFILE_VERIFIED");
 assert.equal(validateLive(a).productionWrites,0);
});
test("no false pass for empty/withdrawn/suppressed, nonindexable or private data",()=>{
 for(const mutate of [
  x=>x.status.publishedListings=0,
  x=>x.status.approvedForKiwi=false,
  x=>x.hub=x.hub.replace('content="index,follow','content="noindex,follow'),
  x=>x.hub=x.hub.replace('data-areas="Christchurch"','data-areas="Dunedin"'),
  x=>x.profile=x.profile.replace(ORIGIN+path,ORIGIN+"/something-else/"),
  x=>x.sitemap=x.sitemap.replace(ORIGIN+path,""),
  x=>x.contact=x.contact.replaceAll("dallas@kiwigardeners.com",""),
  x=>x.profile+=" protectedPhone"
 ]){
  const x=fixture();mutate(x);
  assert.throws(()=>validateLive(x),/KG_DIR_02_LIVE_.*_HOLD/);
 }
});
