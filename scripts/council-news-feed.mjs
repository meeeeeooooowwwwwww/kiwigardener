// Read-only Christchurch City Council Newsline RSS source.
// Only article titles, dates and canonical links are republished; no copied article bodies, logos or photos.
// Subject scope includes native habitats, public gardens, parks and green spaces.
export const COUNCIL_FEED = "https://www.newsline.ccc.govt.nz/news/stories";
const decode=s=>String(s||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
  .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const cp=n[0].toLowerCase()==="x"?parseInt(n.slice(1),16):Number(n);return cp>0&&cp<=0x10ffff?String.fromCodePoint(cp):""})
  .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi,(_,n)=>({amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "}[n.toLowerCase()]))
  .replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
const field=(xml,key)=>decode(xml.match(new RegExp("<(?:[a-z0-9_-]+:)?"+key+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-z0-9_-]+:)?"+key+">","i"))?.[1]||"");
const titleKeywords=/\b(?:garden\w*|botanic\w*|horticultur\w*|plant\w*|flower\w*|bloom\w*|seedling\w*|trees?|vegetation|biodivers\w*|wetlands?|revegetat\w*|compost\w*|weeding|weeds?|native\s+bush|bush\s+restor\w*|ecolog\w*|green\s+waste|leaf\s+fall|forest\w*|parks?|reserves?|restor\w*|conserv\w*|environment\w*|coast\w*|estuar\w*|harbour|green\s+space\w*|urban\s+forest\w*|waterways?|streams?|rivers?|dunes?|habitats?|nature|landscap\w*|pathways?|recreation\w*|beaches|bay)\b/i;
// "Plant" may refer to an industrial facility rather than botany.
const industrialPlant=/\b(?:wastewater|water|sewage|treatment|power|energy|industrial|processing|manufacturing|chemical|recycling)\s+plant\b/i;
const allowedHost=h=>h==="newsline.ccc.govt.nz"||h==="www.newsline.ccc.govt.nz";
export function parseCouncilFeed(xml,{now=Date.now()}={}){
  if(!/<rss\b|<feed\b/i.test(xml))throw new Error("Newsline response was not RSS or Atom XML");
  const items=[...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi),...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)];
  if(!items.length)throw new Error("Newsline feed returned no entries");
  const out=[],seen=new Set();
  for(const [,entry] of items){
    const title=field(entry,"title");
    if(!title||!titleKeywords.test(title)||industrialPlant.test(title))continue;
    const bareLink=field(entry,"link");
    const atomLink=entry.match(/<link\s[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i)?.[1];
    let link;
    try{
      link=new URL(bareLink||atomLink||field(entry,"guid"));
      if(link.protocol!=="https:"||!allowedHost(link.hostname)||!/^\/news\/story\//.test(link.pathname))continue;
      link.hash="";link.search="";
    }catch{continue}
    if(seen.has(link.href))continue;
    const dateRaw=field(entry,"pubDate")||field(entry,"published")||field(entry,"updated")||field(entry,"date");
    const timestamp=Date.parse(dateRaw);
    if(!Number.isFinite(timestamp)||timestamp>now+86400000||timestamp<now-366*86400000)continue;
    seen.add(link.href);
    out.push({title:title.slice(0,180),url:link.href,date:new Date(timestamp).toISOString().slice(0,10)});
  }
  return out.sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title)).slice(0,30);
}
export async function fetchCouncilNews({url=COUNCIL_FEED, timeout=8000}={}){
  const resp=await fetch(url,{headers:{"Accept":"application/rss+xml, application/xml;q=0.9, text/xml;q=0.8","User-Agent":"KiwiGardeners/1.0 (Christchurch gardening news links)"},signal:AbortSignal.timeout(timeout),redirect:"follow"});
  if(!resp.ok)throw new Error("Newsline RSS HTTP "+resp.status);
  const xml=await resp.text();
  const stories=parseCouncilFeed(xml);
  if(!stories.length)throw new Error("No current plant/garden-related items found in Newsline RSS");
  return stories;
}
export function validateStoredNews(data,{now=Date.now()}={}){
  if(!Array.isArray(data))return [];
  return data.filter(s=>{
    if(!s||typeof s.title!=="string"||typeof s.url!=="string"||typeof s.date!=="string")return false;
    try{const u=new URL(s.url);return u.protocol==="https:"&&allowedHost(u.hostname)&&/^\/news\/story\//.test(u.pathname)&&titleKeywords.test(s.title)&&!industrialPlant.test(s.title)&&/^\d{4}-\d{2}-\d{2}$/.test(s.date)&&Date.parse(s.date)<=now+86400000&&Date.parse(s.date)>=now-366*86400000}catch{return false}
  }).slice(0,30);
}
