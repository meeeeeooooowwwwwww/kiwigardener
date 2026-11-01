// Quiet, on-topic related-news strip between the article and shared site footer.
// Don't inject the same generic headlines into all 271 plant profiles.
import {plants} from "./plant-catalogue.mjs";
import {validateStoredNews} from "../scripts/council-news-feed.mjs";
const recent=s=>Date.parse(s.date)>=Date.now()-180*86400000;
const terms=s=>s.toLowerCase().replace(/[-_]/g," ");
const has=(s,re)=>re.test(s.toLowerCase());
const greenery=/\b(?:garden|gardening|plant|native|tree|flower|botanic|ecolog|wetland|seedling|leaf|compost|forest|biodivers)/i;
const topicPatterns={
  native:/\b(?:native|restoration|bush|biodivers|forest|wetland|ecolog|revegetat)/i,
  coastal:/\b(?:coast|beach|shore|wetland|dune|erosion|estuary|sea)/i,
  flowering:/\b(?:flower|bloom|rose|botanic|garden|blossom)/i,
  trees:/\b(?:tree|forest|bush|planting|native)/i,
  maintenance:/\b(?:garden|pruning|weed|hedge|tree|plant|leaf|season|bloom)/i,
  waste:/\b(?:leaf|compost|green waste|garden waste|weed)/i,
  soil:/\b(?:soil|compost|wetland|planting|garden|drought)/i,
  hills:/\b(?:port hills|bush|forest|native|restoration|planting)/i
};
const relevant=(path,story)=>{
  const text=terms(story.title);
  const slug=path.split("/")[2]||"";
  if(path==="/plants/"||path==="/guides/")return 5;
  if(path.startsWith("/plants/")){
    const p=plants.find(x=>x.slug===slug);
    if(!p)return 0;
    const species=[p.name,p.common].filter(Boolean).map(x=>terms(x)).filter(x=>x.length>=5);
    return species.some(t=>terms(story.title).includes(t)||terms(story.description||"").includes(t))?12:0;
  }
  if(path.startsWith("/areas/")&&slug){
    const place=terms(slug);
    const context=terms(story.title+" "+(story.description||""));
    const matches=context.includes(place) || (place==="banks peninsula"&&/\b(?:akaroa|lyttelton|banks peninsula)\b/i.test(context));
    return matches?12:0;
  }
  if(path.startsWith("/guides/")){
    let pattern=topicPatterns.maintenance;
    if(/native/.test(slug))pattern=topicPatterns.native;
    else if(/coastal/.test(slug))pattern=topicPatterns.coastal;
    else if(/soil/.test(slug))pattern=topicPatterns.soil;
    else if(/port-hills/.test(slug))pattern=topicPatterns.hills;
    else if(/historic|flower/.test(slug))pattern=topicPatterns.flowering;
    else if(/tree/.test(slug))pattern=topicPatterns.trees;
    return pattern.test(text)?10:0;
  }
  if(path.startsWith("/services/")){
    const pattern=/green-waste|waste-removal/.test(slug)?topicPatterns.waste:
      /hedge|prun/.test(slug)?topicPatterns.trees:
      /weeding|weed-control/.test(slug)?topicPatterns.maintenance:
      /garden-maintenance|garden-tidy|garden-clean|garden-bed|planting/.test(slug)?topicPatterns.maintenance:null;
    return pattern?.test(text)?8:0;
  }
  return 0;
};
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const formatDate=d=>new Intl.DateTimeFormat("en-NZ",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(d+"T12:00:00Z"));
export function councilNewsSection(path,records){
  if(path==="/"||path==="/contact/"||path==="/privacy/"||path==="/404/")return "";
  const stories=validateStoredNews(records).filter(recent)
    .map(s=>({...s,score:relevant(path,s)})).filter(s=>s.score>0)
    .sort((a,b)=>b.score-a.score||b.date.localeCompare(a.date)).slice(0,2);
  const resource=(path==="/plants/"||path==="/guides/"||/\/guides\/(?:historic-christchurch-gardens|caring-for-christchurch-garden-plants|native-plants-christchurch)\//.test(path))
    ?'<p class="council-news-resource">More local plant information: <a href="https://www.ccc.govt.nz/parks-and-gardens/christchurch-botanic-gardens" target="_blank" rel="noopener noreferrer">Christchurch Botanic Gardens ↗</a></p>':"";
  if(!stories.length)return ""; // No unrelated or stale content just to fill space.
  const rows=stories.map(s=>'<li><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+' <span aria-hidden="true">↗</span></a><time datetime="'+esc(s.date)+'">'+esc(formatDate(s.date))+'</time></li>').join("");
  return '<section class="council-updates" aria-label="Related Christchurch City Council gardening news"><div class="container"><div class="council-updates-inner"><div class="council-updates-title"><span class="eyebrow">Christchurch City Council · Newsline</span><h2>From around our gardens</h2><p>Related local news, published by the Council.</p></div><div><ul class="council-news-links">'+rows+'</ul>'+resource+'</div></div></div></section>';
}
