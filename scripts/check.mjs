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
assert.equal(urls.length,27,"Expected 27 indexable HTML pages (excluding the custom 404 page)");
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
for(const path of ["dist/robots.txt","dist/_headers","dist/assets/styles.css","dist/assets/favicon.svg"]){
  await stat(path);
}
const robots=await readFile("dist/robots.txt","utf8");
if(!robots.includes("Sitemap: "+site+"/sitemap.xml"))fail("robots.txt sitemap wrong");
if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}
else console.log("SEO/link audit PASS: "+urls.length+" unique pages, titles, descriptions, canonicals, schema, alt text, robots, sitemap, live destination links.");
