import {readFile, stat} from "node:fs/promises";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {plants} from "../src/plant-catalogue.mjs";
import {plantEditorial} from "../src/plant-editorial.mjs";
import {plantPhotoLinks} from "../src/plant-photo-links.mjs";
const site = "https://kiwigardeners.com";
const xml = await readFile("dist/sitemap.xml","utf8");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
const errors=[];
const styles=await readFile("dist/assets/styles.css");
const expectedStyleHash=createHash("sha256").update(styles).digest("hex").slice(0,12);
const expectedStyleUrl="/assets/styles."+expectedStyleHash+".css";
await stat("dist"+expectedStyleUrl);
const seenTitles=new Map();
const seenDescriptions=new Map();
const pages=new Map();
const fail=(value)=>errors.push(value);
assert.equal(plants.length,271,"Expected 271 sourced botanical listings");
assert.equal(urls.length,48+1+Object.keys(plantEditorial).length,"Expected existing site pages, plant directory and editorially enriched indexed profiles");
assert.equal(new Set(urls).size,urls.length,"Duplicate URL in sitemap");
const readPage=async(path)=>{
  if(pages.has(path))return pages.get(path);
  const file=path==="/"? "dist/index.html" : "dist"+path+"index.html";
  const html=await readFile(file,"utf8");
  pages.set(path,html);
  return html;
};
for(const url of urls){
  assert.ok(url.startsWith(site+"/"),"Offsite sitemap URL: "+url);
  const path=new URL(url).pathname;
  const html=await readPage(path);
  const title=html.match(/<title>(.*?)<\/title>/)?.[1];
  const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  if(!title||title.length<20||title.length>90)fail(path+" bad title");
  if(!description||description.length<60||description.length>210)fail(path+" bad meta description");
  if(seenTitles.has(title))fail(path+" duplicate title with "+seenTitles.get(title));
  if(seenDescriptions.has(description))fail(path+" duplicate description with "+seenDescriptions.get(description));
  seenTitles.set(title,path);seenDescriptions.set(description,path);
  if(html.split('https://www.googletagmanager.com/gtag/js?id=G-CVKT89LFE7').length!==2)fail(path+" missing or duplicate Google tag");
  if(html.split('src="/assets/analytics.js"').length!==2)fail(path+" missing or duplicate GA4 initialiser");
  if(!html.includes('<link rel="canonical" href="'+url+'"'))fail(path+" canonical mismatch");
  if(!html.includes('<link rel="stylesheet" href="'+expectedStyleUrl+'"'))fail(path+" stylesheet URL not fingerprinted to current CSS");
  if((html.match(/<h1(?:\s|>)/g)||[]).length!==1)fail(path+" expected one H1");
  if(!html.includes('<html lang="en-NZ">'))fail(path+" language missing");
  if(!html.includes('name="viewport"'))fail(path+" missing mobile viewport");
  const ld=html.match(/<script type="application\/ld\+json">(.+?)<\/script>/)?.[1];
  if(!ld)fail(path+" missing structured data");
  else {
    try {
      const data=JSON.parse(ld);
      const nodes=data["@graph"]||[];
      if(!nodes.some(n=>n["@type"]==="BreadcrumbList"))fail(path+" missing breadcrumbs schema");
      if(!nodes.some(n=>n.url===url))fail(path+" schema URL mismatch");
    }catch{fail(path+" invalid JSON-LD");}
  }
  // Guard against broken externally hosted stock images being rendered as undefined.
  if(/(?:src|content)="undefined"/.test(html))fail(path+" unresolved image or metadata URL");
  if(/href="https?:\/\/[^"]*facebook\.com|href="https?:\/\/[^"]*instagram\.com|href="https?:\/\/[^"]*tiktok\.com/i.test(html))fail(path+" unapproved social media link");
  if(path.startsWith("/services/")&&path!=="/services/"){
    if(!html.includes("Other gardening services"))fail(path+" missing contextual service links");
    if(!html.includes("Areas served"))fail(path+" missing regional cross-links");
    for(const area of ["/areas/christchurch/","/areas/banks-peninsula/","/areas/selwyn/","/areas/waimakariri/"]){
      if(!html.includes('href="'+area+'"'))fail(path+" missing region "+area);
    }
  }
  // Inspect every internal path, not merely page URLs from the sitemap.
  for(const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)){
    const href=match[1].replaceAll("&amp;","&");
    if(href.startsWith("mailto:")||href.startsWith("tel:")||href.startsWith("#"))continue;
    let target;
    try{target=new URL(href,url);}catch{fail(path+" malformed link "+href);continue;}
    if(target.origin!==site)continue;
    if(target.pathname==="/404/"||target.pathname==="/sitemap.xml"||target.pathname==="/robots.txt")continue;
    // Links to HTML URLs are required to be present in the generated file tree.
    if(target.pathname.endsWith(".svg")||target.pathname.endsWith(".css")||target.pathname.endsWith(".js"))continue;
    const normalized=target.pathname.endsWith("/")?target.pathname:target.pathname+"/";
    try{await stat("dist"+normalized+"index.html");}catch{fail(path+" broken internal href "+href);}
    if(target.hash&&target.pathname===path){
      const anchor=decodeURIComponent(target.hash.slice(1));
      if(!html.includes('id="'+anchor+'"'))fail(path+" missing internal anchor "+target.hash);
    }
  }
  for(const match of html.matchAll(/<img\b([^>]+)>/g)) {
    if(!/\balt="[^"]*"/.test(match[1]))fail(path+" image missing alt");
    if(!/\bsrc="[^"]+"/.test(match[1]))fail(path+" image missing src");
  }
  if(path==="/"){
    if(!html.includes("dallas@kiwigardeners.com"))fail("Missing homepage enquiry address");
    if(!html.includes("https://grideater.com/"))fail("Missing GRID EATER link");
    for(const [url,name] of [["https://davidaruck.com/","David Ruck"],["https://americafirst.nz/","America First NZ"]]){
      if(!html.includes(`href="${url}"`))fail(`Missing footer link: ${name}`);
    }
  }
}
for(const path of ["dist/robots.txt","dist/_headers","dist/assets/styles.css","dist/assets/favicon.svg","dist/assets/green-waste.svg","dist/assets/cleared-section.svg"]){
  await stat(path);
}
const analytics=await readFile("dist/assets/analytics.js","utf8");
const headers=await readFile("dist/_headers","utf8");
if(!analytics.includes("gtag('config', 'G-CVKT89LFE7')"))fail("Google Analytics measurement ID mismatch");
if(!headers.includes("script-src 'self' https://challenges.cloudflare.com https://www.googletagmanager.com"))fail("CSP blocks gtag.js");
if(!headers.includes("connect-src 'self' https://challenges.cloudflare.com https://www.google-analytics.com https://region1.google-analytics.com"))fail("CSP blocks Analytics events");
if(!headers.includes("img-src 'self' data: https://images.unsplash.com https://www.google-analytics.com"))fail("CSP blocks Analytics image fallback");
if(headers.includes("'unsafe-inline'") && !headers.includes("style-src 'self' 'unsafe-inline'"))fail("CSP script policy unexpectedly weakened");
const serviceIndex=await readFile("dist/services/index.html","utf8");
const cardSources=[...serviceIndex.matchAll(/class="card-image" src="([^"]+)"/g)].map(m=>m[1]);
if(new Set(cardSources).size!==cardSources.length)fail("Duplicate service card image URLs");
if(!cardSources.includes("/green-waste-removal.jpg")||!cardSources.includes("/rubbish-removal.jpg"))fail("Missing uploaded waste and section-clearing images");
for(const path of ["dist/green-waste-removal.jpg","dist/rubbish-removal.jpg"]) await stat(path);
const robots=await readFile("dist/robots.txt","utf8");
if(!robots.includes("Sitemap: "+site+"/sitemap.xml"))fail("robots.txt sitemap wrong");
// Local editorial pages should retain source evidence, navigation and direct enquiry paths.
for(const path of ['/areas/fendalton/','/areas/ilam/','/areas/riccarton/','/areas/burwood/','/areas/southshore/','/areas/huntsbury/']){
  const html=await readPage(path);
  if(!html.includes('Local references and further reading'))fail(path+' missing source references');
  if(!html.includes('Dallas Timpson Garden Services'))fail(path+' missing garden quote CTA');
  if(!html.includes('class="sidebar editorial-sidebar"'))fail(path+' missing editorial navigation');
}
for(const path of ['/guides/christchurch-garden-soils/','/guides/coastal-gardening-christchurch/','/guides/port-hills-gardens/','/guides/native-plants-christchurch/','/guides/historic-christchurch-gardens/']){
  const html=await readPage(path);
  if(!html.includes('Local references and further reading'))fail(path+' missing evidence');
  if(!html.includes('Dallas Timpson Garden Services'))fail(path+' missing CTA');
}


// Site-wide contact accessibility and directed reading paths.
for (const url of urls) {
  const path = new URL(url).pathname;
  const html = await readPage(path);
  const withoutLinksOrCode=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"")
    .replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi,"").replace(/<[^>]*>/g," ");
  if(/dallas@kiwigardeners\.com|027\s+340\s+6581/i.test(withoutLinksOrCode))fail(path+" has visible unlinked Dallas contact detail");
  if(!html.includes('class="footer-contact"'))fail(path+" missing footer contact block");
  if(!html.includes('href="tel:+64273406581"'))fail(path+" missing click-to-call");
  if(!html.includes('href="mailto:dallas@kiwigardeners.com"'))fail(path+" missing click-to-email");
}
for(const path of ['/areas/fendalton/','/areas/new-brighton/','/areas/huntsbury/','/guides/historic-christchurch-gardens/','/guides/native-plants-christchurch/','/guides/caring-for-christchurch-garden-plants/']){
  const html=await readPage(path);
  if(!html.includes('aria-label="Garden learning pathway"'))fail(path+" missing history-plants-care navigation");
  if(!html.includes('/guides/caring-for-christchurch-garden-plants/'))fail(path+" missing plant-care route");
  if(!html.includes('class="next-reading"'))fail(path+" missing next-topic prompt");
}
for(const path of ['/guides/native-plants-christchurch/','/guides/caring-for-christchurch-garden-plants/']){
  const html=await readPage(path);
  if(!html.includes('class="plant-gallery-grid"'))fail(path+" missing plant photographs");
  if(!html.includes('aria-label="On this page"'))fail(path+" missing article table of contents");
  if(!html.includes('Wikimedia Commons.'))fail(path+" missing image source credits");
}


// October 30 site-wide editorial, location, sharing and footer regression checks.
const headingCases=[
  ["/areas/christchurch/","Gardening in Christchurch"],
  ["/areas/selwyn/","Gardening in Selwyn, Canterbury"],
  ["/areas/waimakariri/","Gardening in Waimakariri, Canterbury"],
  ["/areas/banks-peninsula/","Gardening in Banks Peninsula, Canterbury"],
  ["/areas/cashmere/","Gardening in Cashmere, Christchurch"],
  ["/areas/fendalton/","Gardening in Fendalton, Christchurch"]
];
for(const [path,heading] of headingCases){
  const html=await readPage(path);
  if(!html.includes("<h1>"+heading+"</h1>"))fail(path+" incorrect local heading");
  if(path!=="/areas/christchurch/"&&html.includes("Gardening in "+heading.replace("Gardening in ","")+", Christchurch"))fail(path+" duplicated Christchurch");
  if(path==="/areas/selwyn/"||path==="/areas/waimakariri/"||path==="/areas/banks-peninsula/"){
    if(html.includes("Eastern Christchurch"))fail(path+" incorrectly labelled eastern Christchurch");
  }
}
for(const path of ["/","/areas/fendalton/","/guides/native-plants-christchurch/","/services/green-waste-removal/"]){
  const html=await readPage(path);
  const image=html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  if(!image||!image.startsWith("https://"))fail(path+" missing absolute Open Graph image");
  if(!html.includes('<meta name="twitter:image" content="https://'))fail(path+" missing Twitter sharing image");
}
const homepage=await readPage("/");
if(homepage.includes("Gardeners Linwood Christchurch | Kiwi Gardeners"))fail("Homepage title still over-focused on Linwood");
if(!homepage.includes('aria-label="Website credits and related links"'))fail("Footer credits lack organised navigation");
const privacy=await readPage("/privacy/");
if(!privacy.includes("Wikimedia Commons"))fail("Privacy page is missing Wikimedia photo provider");
for(const path of ["/areas/fendalton/","/areas/christchurch/"]){
  const html=await readPage(path);
  const care=html.indexOf('id="garden-care"'), next=html.indexOf('class="next-reading"');
  if(care<0||next<=care)fail(path+" next-reading box appears before practical gardening advice");
}


// Error pages must not be indexed; informational articles must describe their actual subjects.
const notFound=await readFile("dist/404.html","utf8");
if(!notFound.includes('<meta name="robots" content="noindex,follow">'))fail("404 page is indexable");
const articleHtml=await readPage("/guides/historic-christchurch-gardens/");
if(!articleHtml.includes('<meta property="og:type" content="article">'))fail("Guide pages missing article share type");
const articleGraph=JSON.parse(articleHtml.match(/<script type="application\/ld\+json">(.+?)<\/script>/)?.[1]||"{}")["@graph"]||[];
const articleNode=articleGraph.find(n=>n["@type"]==="Article");
if(!articleNode?.headline||articleNode?.about?.["@id"]===site+"/#gardener")fail("Article schema incorrectly marked as about the gardener");
const serviceHtml=await readPage("/services/garden-maintenance/");
const serviceGraph=JSON.parse(serviceHtml.match(/<script type="application\/ld\+json">(.+?)<\/script>/)?.[1]||"{}")["@graph"]||[];
if(!serviceGraph.some(x=>x["@type"]==="Service"&&x.provider?.["@id"]===site+"/#gardener"))fail("Service schema lost Dallas provider");

// Ensure the teaching steps render without duplicate hard-coded numbering.
for(const path of ["/guides/christchurch-garden-soils/","/areas/fendalton/","/guides/caring-for-christchurch-garden-plants/"]){
 const html=await readPage(path);
 if(!html.includes('class="path-title"')||!html.includes('class="path-desc"'))fail(path+" missing accessible spaced learning steps");
 if(html.includes('class="path-index"'))fail(path+" duplicates the native ordered-list numbering");
}
// The local-area directory must show a photograph on every one of its 22 suburb cards.
const areaDirectory=await readPage("/areas/");
const areaCards=[...areaDirectory.matchAll(/<a class="card" href="\/areas\/([^/]+)\/"[^>]*>([\s\S]*?)<h3>/g)];
if(areaCards.length!==22)fail("Areas hub expected 22 unique location cards, found "+areaCards.length);
for(const [,slug,opening] of areaCards){
  if(!opening.includes('class="card-image"'))fail("/areas/"+slug+"/ has no real photo");
  if(!opening.includes('data-fallback-src="https://images.unsplash.com/'))fail("/areas/"+slug+"/ has no reliable photo fallback");
  if(opening.includes('class="number"'))fail("/areas/"+slug+"/ still has a number-only placeholder");
}
const photoFallback=await readFile("dist/assets/image-fallback.js","utf8");
if(!photoFallback.includes("data-fallback-src")||!photoFallback.includes("DOMContentLoaded"))fail("Photo fallback recovery is not installed");
if(!areaDirectory.includes('/assets/image-fallback.js?v=20261030'))fail("Photo recovery script is not loaded");
if(!areaDirectory.includes("Riccarton_Bush_predator-proof_fence_347.jpg"))fail("Riccarton photo reference missing");


const directory=await readPage("/plants/");
if(!directory.includes('id="plant-query"')||!directory.includes('id="plant-flower"')||!directory.includes('id="plant-foliage"'))fail("Plant search missing free-text or colour filters");
if(!directory.includes('src="/assets/plant-search.js"'))fail("Plant search behaviour is not loaded");
if((directory.match(/class="card plant-card"/g)||[]).length!==plants.length)fail("Plant finder does not list all 271 cards with the global card class");
if(!directory.includes('class="cards plant-results"'))fail("Plant finder does not reuse global card grid");
if(Object.keys(plantPhotoLinks).length!==plants.length)fail("Plant photo lookup is not complete");
if((directory.match(/class="plant-photo-frame"/g)||[]).length!==plants.length)fail("All directory cards require a local photograph frame");
if((directory.match(/class="plant-photo" src="\/assets\/plant-photos\//g)||[]).length!==plants.length)fail("All directory cards require locally served plant photographs");
if(directory.includes('class="plant-photo-link"')||directory.includes('class="plant-photo-fallback"'))fail("Nursery photo link placeholders must not appear");
if((directory.match(/class="plant-card-body" href="\/plants\//g)||[]).length!==plants.length)fail("Every plant card must retain a separate internal guide link");
if(!directory.includes('class="enquiry-panel"'))fail("Plant finder missing site-wide conversion panel");
if(!directory.includes('id="plant-more"'))fail("Plant finder missing progressive show-more control");
const plantGraph=JSON.parse(directory.match(/<script type="application\/ld\+json">(.+?)<\/script>/)?.[1]||"{}")["@graph"]||[];
const plantCollection=plantGraph.find(n=>n["@type"]==="CollectionPage");
if(!plantCollection?.mainEntity||plantCollection.mainEntity["@type"]!=="ItemList"||plantCollection.mainEntity.numberOfItems!==Object.keys(plantEditorial).length)fail("Plant directory is missing the reviewed-profile ItemList schema");
if(!plantCollection?.mainEntity?.itemListElement?.every(e=>urls.includes(e.url)))fail("Plant directory schema links to unindexed profiles");
if(!directory.includes('/services/hedge-trimming/'))fail("Plant finder missing contextual hedge services link");
if(!directory.includes('class="plant-quick-filters subnav"'))fail("Plant finder does not reuse tag navigation");
const finderJs=await readFile("dist/assets/plant-search.js","utf8");
if(!finderJs.includes('aria-live')&&!directory.includes('aria-live="polite"'))fail("Plant filtering lacks live result feedback");
const slugSet=new Set(plants.map(p=>p.slug));
if(slugSet.size!==plants.length)fail("Duplicate plant slugs");
for(const p of plants){
  const url="/plants/"+p.slug+"/";
  const featured=Boolean(plantEditorial[p.slug]);
  if(urls.includes(site+url)!==featured)fail("Plant indexing does not match editorial status: "+p.slug);
  const html=await readPage(url);
  if(!html.includes('href="'+p.source+'"'))fail(url+" missing source link");
  const imageUrl=plantPhotoLinks[p.slug];
  if(!imageUrl?.startsWith("https://www.goughsnurseries.co.nz/cache/plant/"))fail(url+" missing image mapping");
  if(!html.includes('class="plant-photo plant-profile-photo" src="/assets/plant-photos/'+p.slug+'.jpg"'))fail(url+" missing local plant photo");
  if(!html.includes('class="plant-figure-image"'))fail(url+" missing profile photo frame");
  const cardChunk=directory.split('data-plant-search="').find(v=>v.includes('href="/plants/'+p.slug+'/"'));
  if(!directory.includes('src="/assets/plant-photos/'+p.slug+'.jpg"'))fail(url+" directory image mismatch");
  const photo=await readFile("dist/assets/plant-photos/"+p.slug+".jpg");
  if(photo.length<300||photo[0]!==0xff||photo[1]!==0xd8||photo[2]!==0xff)fail(url+" generated photo is missing or not JPEG");
  if(!cardChunk)fail(url+" internal card guide link missing");
  if(!html.includes('Dallas Timpson Garden Services'))fail(url+" missing real gardening CTA");
  if(!html.includes('class="cards plant-related-cards"'))fail(url+" related cards do not use the shared grid");
  if(!html.includes('href="/plants/"'))fail(url+" missing plant directory return link");
  if(!html.includes('href="/services/'))fail(url+" missing contextual service link");
  if(!html.includes('class="site-footer"'))fail(url+" missing site-wide footer");
  if(!html.includes('class="site-header"'))fail(url+" missing shared navigation");
  if(!html.includes('href="mailto:dallas@kiwigardeners.com"'))fail(url+" missing linked contact email");
  if(!html.includes('href="tel:+64273406581"'))fail(url+" missing linked contact phone");
  const title=html.match(/<title>(.*?)<\/title>/)?.[1];
  const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  if(!title||title.length<20||title.length>90)fail(url+" bad title");
  if(!description||description.length<60||description.length>210)fail(url+" bad meta description");
  if(!html.includes('rel="canonical" href="'+site+url+'"'))fail(url+" bad canonical");
  if((html.match(/<h1(?:\s|>)/g)||[]).length!==1)fail(url+" expected one H1");
  if(!html.includes('class="plant-facts"'))fail(url+" missing characteristics table");
  if(featured&&!html.includes('class="plant-local-notes"'))fail(url+" editorial profile notes missing");
  if(featured&&html.includes('name="robots" content="noindex,follow"'))fail(url+" editorial page should be indexed");
  if(!featured&&!html.includes('name="robots" content="noindex,follow"'))fail(url+" unreviewed profile must remain noindex");
  if(!html.includes('rel="noopener noreferrer"'))fail(url+" missing safe source link");
}
if(!homepage.includes('href="/plants/"'))fail("Home has no plant directory entry point");
for (const path of ["/", "/services/hedge-trimming/", "/areas/", "/guides/native-plants-christchurch/", "/plants/", "/plants/acca-sellowiana/"]){
 const html=await readPage(path);
 if(!html.includes('class="site-header"')||!html.includes('class="site-footer"'))fail(path+" global header/footer missing");
 if(!html.includes('href="/plants/"'))fail(path+" plant navigation link missing");
 const foot=html.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[0];
 const baseFoot=homepage.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[0];
 if(foot!==baseFoot)fail(path+" footer differs from global homepage footer");
}
if(!serviceHtml.includes('/plants/'))fail("Maintenance services missing plant-directory crosslink");
const hedge=await readPage("/services/hedge-trimming/");
if(!hedge.includes('/plants/?use=Hedging%20%26%20screening'))fail("Hedge service missing context-filtered plant directory link");

if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}
else console.log("SEO/link audit PASS: "+urls.length+" unique pages, titles, descriptions, canonicals, schema, alt text, robots, sitemap, live destination links.");
