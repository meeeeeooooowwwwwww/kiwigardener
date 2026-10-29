import {readFile, stat} from "node:fs/promises";
import assert from "node:assert/strict";
const site = "https://kiwigardeners.com";
const xml = await readFile("dist/sitemap.xml","utf8");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
const errors=[];
const seenTitles=new Map();
const seenDescriptions=new Map();
const pages=new Map();
const fail=(value)=>errors.push(value);
assert.equal(urls.length,48,"Expected 48 indexable HTML pages (excluding the custom 404 page)");
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
    if(!urls.includes(site+normalized))fail(path+" broken internal href "+href);
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

if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}
else console.log("SEO/link audit PASS: "+urls.length+" unique pages, titles, descriptions, canonicals, schema, alt text, robots, sitemap, live destination links.");
