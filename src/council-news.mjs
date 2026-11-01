// Related Council stories are a supporting news strip, not a Council-branded endorsement.
// The RSS feed has headlines, not image enclosures. Photos below are pre-credited,
 // independently licensed illustrations already used elsewhere on Kiwi Gardeners.
import {plants} from "./plant-catalogue.mjs";
import {plantEditorial} from "./plant-editorial.mjs";
import {images} from "./local-editorial.mjs";
import {validateStoredNews} from "../scripts/council-news-feed.mjs";

const recent=s=>Date.parse(s.date)>=Date.now()-270*86400000;
const normal=s=>String(s||"").toLowerCase().replace(/[-_]/g," ");
const topic={
  greenery:/\b(?:garden\w*|botanic\w*|plant\w*|seedling\w*|flora\w*|tree\w*|flower\w*|nature|environment\w*|ecolog\w*|restor\w*|parks?|reserves?|wetland\w*|coast\w*|harbour|bay|pathway\w*|recreation\w*|green\s+space\w*|landscap\w*|forest\w*|biodivers\w*)\b/i,
  garden:/\b(?:garden|botanic|planting|flower|seedling|bloom|horticultur|vegetation|compost|soil)/i,
  native:/\b(?:native|restor|bush|biodivers|forest|wetland|ecolog|habitat|revegetat)/i,
  coastal:/\b(?:coast|beach|shore|wetland|dune|erosion|estuary|harbour|bay|sea)/i,
  trees:/\b(?:tree|forest|bush|planting|native|canopy|reserve|park)/i,
  maintenance:/\b(?:garden|prun|weed|hedge|tree|plant|leaf|season|green|park|reserve)/i,
  waste:/\b(?:leaf|compost|green waste|garden waste|weed|recycl)/i,
  soil:/\b(?:soil|compost|wetland|planting|garden|drought|landscape)/i,
  hills:/\b(?:port hills|bush|forest|native|restor|planting|reserve|hill)/i
};
function relevance(path,s){
  const text=normal(s.title),slug=path.split("/")[2]||"";
  if(path==="/plants/"||path==="/guides/"||path==="/areas/"||path==="/services/")return topic.greenery.test(text)?6:0;
  if(path==="/")return topic.greenery.test(text)?2:0;
  if(path.startsWith("/plants/")){
    if(!plantEditorial[slug])return 0; // Do not repeat generic news across 229 noindex profiles.
    const p=plants.find(x=>x.slug===slug);
    if(!p)return 0;
    const names=[p.name,p.common].filter(Boolean).map(normal).filter(x=>x.length>=5);
    if(names.some(name=>text.includes(name)))return 12;
    return topic.garden.test(text)?2:0;
  }
  if(path.startsWith("/areas/")&&slug){
    const place=normal(slug);
    const located=text.includes(place)||(place==="banks peninsula"&&/\b(?:akaroa|lyttelton|banks peninsula)\b/i.test(text));
    return located?12:topic.greenery.test(text)?3:0;
  }
  if(path.startsWith("/guides/")){
    let matcher=topic.maintenance;
    if(/native/.test(slug))matcher=topic.native;
    else if(/coastal/.test(slug))matcher=topic.coastal;
    else if(/soil/.test(slug))matcher=topic.soil;
    else if(/port-hills/.test(slug))matcher=topic.hills;
    else if(/historic|flower/.test(slug))matcher=topic.garden;
    return matcher.test(text)?10:topic.greenery.test(text)?3:0;
  }
  if(path.startsWith("/services/")){
    const matcher=/green-waste|waste-removal/.test(slug)?topic.waste:
      /hedge|prun|tree/.test(slug)?topic.trees:topic.maintenance;
    return matcher.test(text)?8:topic.greenery.test(text)?2:0;
  }
  return 0;
}
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const formatted=d=>new Intl.DateTimeFormat("en-NZ",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(d+"T12:00:00Z"));
// The photos are deliberately illustrative, not falsely presented as Newsline article photographs.
function photoFor(s){
 const title=normal(s.title);
 const key=/\b(?:coast|beach|dune|sea|harbour|bay|shore|estuary)\b/.test(title)?"dunes":
  /\b(?:wetland|waterway|stream|river|ecolog|biodivers|restor|habitat)\b/.test(title)?"travis":
  /\b(?:port hills|hill)\b/.test(title)?"hills":
  /\b(?:forest|native bush|reserve|tree)\b/.test(title)?"riccarton":"botanic";
 return images[key]||images.botanic;
}
function thumbnail(s){
 const p=photoFor(s);
 return '<figure class="council-news-thumb"><img class="council-news-photo" src="'+esc(p.src)+'" width="116" height="88" alt="Illustrative Christchurch garden or nature photograph" loading="lazy" decoding="async" referrerpolicy="no-referrer"><figcaption>Illustrative photo: <a href="'+esc(p.file)+'" target="_blank" rel="noopener noreferrer">'+esc(p.credit)+'</a> · <a href="'+esc(p.licenceUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(p.licence)+'</a></figcaption></figure>';
}
export function councilNewsSection(path,records){
 if(path==="/contact/"||path==="/privacy/"||path==="/404/")return "";
 const limit=path==="/plants/"||path==="/guides/"||path==="/areas/"||path==="/services/"?3:2;
 const stories=validateStoredNews(records).filter(recent)
  .map(s=>({...s,score:relevance(path,s)})).filter(s=>s.score>0)
  .sort((a,b)=>b.score-a.score||b.date.localeCompare(a.date)).slice(0,limit);
 if(!stories.length)return "";
 const resources=(path==="/plants/"||path==="/guides/"||/\/guides\/(?:historic-christchurch-gardens|caring-for-christchurch-garden-plants|native-plants-christchurch)\//.test(path))
  ?'<p class="council-news-resource">Official garden information: <a href="https://www.ccc.govt.nz/parks-and-gardens/christchurch-botanic-gardens" target="_blank" rel="noopener noreferrer">Christchurch Botanic Gardens ↗</a></p>':"";
 const rows=stories.map(s=>'<li class="council-news-item">'+thumbnail(s)+'<div class="council-news-copy"><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+' <span aria-hidden="true">↗</span></a><time datetime="'+esc(s.date)+'">'+esc(formatted(s.date))+'</time></div></li>').join("");
 return '<section class="council-updates" aria-label="Christchurch City Council Newsline stories"><div class="container"><div class="council-updates-inner"><div class="council-updates-title"><span class="council-source"><span class="council-source-icon" aria-hidden="true">N</span><span>Christchurch City Council <strong>Newsline</strong></span></span><h2>From around our gardens</h2><p>Local environment, parks and garden news from Council. Photo illustrations are independent of Newsline.</p></div><div><ul class="council-news-links">'+rows+'</ul>'+resources+'</div></div></div></section>';
}
