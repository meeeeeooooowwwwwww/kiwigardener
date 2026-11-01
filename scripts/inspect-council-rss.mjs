const response=await fetch("https://www.newsline.ccc.govt.nz/news/stories",{signal:AbortSignal.timeout(9000)});
const xml=await response.text();
const entries=[...xml.matchAll(/<item\\b[^>]*>([\\s\\S]*?)<\\/item>/gi)];
console.log("RSS PROBE status",response.status,"type",response.headers.get("content-type"),"bytes",xml.length,"items",entries.length);
console.log("RSS ROOT",xml.slice(0,1400).replace(/\\s+/g," "));
for(const [index, match] of entries.slice(0,5).entries()){
 const item=match[1];
 const title=item.match(/<title[^>]*>([\\s\\S]*?)<\\/title>/i)?.[1]||"unknown";
 const media=[...item.matchAll(/<(?:media:[\\w-]+|enclosure|image|itunes:image|content:encoded)[^>]*>/gi)].map(x=>x[0].slice(0,700));
 const desc=item.match(/<description[^>]*>([\\s\\S]*?)<\\/description>/i)?.[1]||"";
 console.log("RSS ITEM",index,title.slice(0,150),"media",JSON.stringify(media),"desc_images",String((desc.match(/<img\\b/gi)||[]).length),"desc_head",desc.slice(0,420));
}
