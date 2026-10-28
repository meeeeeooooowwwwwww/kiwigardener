import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";
const xml=await readFile("dist/sitemap.xml","utf8");
const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.ok(urls.length>=15,"Expected useful indexable pages");
for(const url of urls){assert.ok(url.startsWith("https://kiwigardeners.com/"));const path=new URL(url).pathname;const file=path==="/"?"dist/index.html":"dist"+path+"index.html";const html=await readFile(file,"utf8");assert.ok(html.includes('<link rel="canonical" href="'+url+'"'),"Canonical mismatch: "+url);assert.equal((html.match(/<h1[ >]/g)||[]).length,1,"Expected one H1: "+url);assert.ok(html.includes('<html lang="en-NZ">'));
const ld=html.match(/<script type="application\/ld\+json">(.+?)<\/script>/);assert.ok(ld,"Missing structured data");JSON.parse(ld[1]);}
for(const path of ["dist/robots.txt","dist/_headers","dist/assets/styles.css","dist/assets/favicon.svg"])await stat(path);
console.log("SEO sanity checks passed for "+urls.length+" pages.");
