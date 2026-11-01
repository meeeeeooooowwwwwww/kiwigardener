// Independent Christchurch plant directory renderer.
// Descriptive copy is original editorial guidance built from compact factual plant attributes.
// No third-party images, copied nursery descriptions, live stock claims or paid affiliate links.
import {plants} from "./plant-catalogue.mjs";

const careByForm={
  "Shrub":"Allow space for mature width, then decide whether the shrub needs occasional shaping or a formal clipping schedule. Avoid hard pruning until you have identified its growth habit and flowering wood.",
  "Tree":"Check the mature canopy, roots and distance from paths, drains and buildings before planting. Young trees benefit from planned establishment care; tall, damaged or power-line-adjacent specimens need specialist assessment.",
  "Climber":"Plan the support, root space and attachment method before planting against a fence or wall. Tie and train new growth early rather than allowing stems to block paths, windows or gutters.",
  "Groundcover":"Weed the planting area thoroughly before installation and leave enough room for lateral spread. Check the edges periodically so the cover does not smother neighbouring plants or paths.",
  "Grass & sedge":"Plant in drifts only where the mature clump will fit. Remove tired foliage selectively and avoid treating every tussock like lawn grass; cutting requirements depend on the exact species.",
  "Flax":"Keep growing crowns clear of mulch and fallen debris. Remove spent flower stalks and damaged leaves with suitable tools; established flax can be bulky and should not be cut like a hedge.",
  "Perennial":"Mark the plant's position before winter tidy-ups so dormant crowns are not accidentally removed. Remove spent material in a way that suits its growth cycle and avoid constant wetness around the crown.",
  "Rush & wetland":"First confirm whether the site is seasonally damp or permanently saturated. Wetland plants are not interchangeable: check water depth, drainage changes and any nearby waterway restrictions before installation.",
  "Succulent":"Give priority to drainage, particularly through Christchurch winter. Protect small rosettes from being buried under mulch and check the particular plant's frost tolerance before leaving pots exposed.",
  "Conifer":"Allow for mature height and density before using conifers as screening. Trim conservatively: many conifers will not reshoot from old bare wood after heavy reduction.",
  "Garden plant":"Confirm the particular plant's mature size, light, drainage and seasonal growth before buying. A small specimen at the nursery may need substantially more room after establishment."
};
const situationByForm={
  "Shrub":"For boundary planting, a garden maintenance plan might include selective pruning, underplanting, weeding and green-waste removal.",
  "Tree":"Where roots or branches could affect access, plan work before a plant grows into surrounding structures.",
  "Climber":"Regular training and removal of stray shoots can prevent a climber taking over the space around a fence or trellis.",
  "Groundcover":"Good groundcover can reduce exposed soil, but weeds still need control during establishment and at bed edges.",
  "Grass & sedge":"Tussocks and sedges bring texture and movement to mixed borders, but they need adequate space for their mature clumps.",
  "Flax":"Harakeke and ornamental flaxes provide strong structure in garden beds; check the mature plant size and safe access for maintenance.",
  "Perennial":"Combining flowering and foliage plants can extend seasonal interest without assuming everything blooms at once.",
  "Rush & wetland":"For lower or wetter Christchurch sections, observe drainage across several weather conditions before choosing a planting mix.",
  "Succulent":"Raised beds and containers may help manage winter drainage, depending on the specimen and exposure.",
  "Conifer":"Screening plants should be chosen for the width and eventual height available, not just their size at purchase.",
  "Garden plant":"Match the plant to the actual space, aspect and maintenance time available on the property."
};
const displayList=(arr,none)=>arr?.length?arr.join(", "):none;
const colourWords=(arr)=>arr?.length?arr.join(" and "):"not recorded";
const unique=(a)=>[...new Set(a)].sort((x,y)=>x.localeCompare(y,"en-NZ"));

export function addPlantPages(ctx){
  const {esc,a,articleHero,layout,files,baseTrail,TEL_URL,PHONE,ENQUIRY_URL}=ctx;
  const dirTrail=[...baseTrail,{name:"Plant directory",path:"/plants/"}];
  const uri=p=>"/plants/"+p.slug+"/";
  const opts=(array,first)=>'<option value="">'+esc(first)+'</option>'+unique(array).map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join("");
  const allForms=plants.map(p=>p.form),allUses=plants.flatMap(p=>p.uses),allFlowers=plants.flatMap(p=>p.flowers),allFoliage=plants.flatMap(p=>p.foliage),allLight=plants.flatMap(p=>p.light),allSeasons=plants.map(p=>p.season).filter(Boolean);
  const popular=[["Hedging & screening","Hedges"],["Ground cover","Groundcovers"],["Coastal gardens","Coastal planting"],["Bee-friendly","Pollinator-friendly"],["Dry gardens","Drought-aware"],["Borders & edging","Borders"]];
  const cards=plants.map(p=>{
    const searchable=[p.name,p.common,p.form,...p.uses,...p.flowers,...p.foliage,...p.light,...p.flags,p.season,p.native?"NZ native":""].join(" ");
    const colourNote=p.flowers.length?"Flowers: "+p.flowers.join(", "):p.foliage.length?"Foliage: "+p.foliage.join(", "):"Explore plant notes";
    return '<article class="plant-card" data-plant-form="'+esc(p.form)+'" data-plant-use="'+esc(p.uses.join("|"))+'" data-plant-flower="'+esc(p.flowers.join("|"))+'" data-plant-foliage="'+esc(p.foliage.join("|"))+'" data-plant-light="'+esc(p.light.join("|"))+'" data-plant-season="'+esc(p.season)+'" data-plant-native="'+(p.native?"yes":"no")+'" data-plant-search="'+esc(searchable.toLowerCase())+'"><a href="'+uri(p)+'" class="plant-card-link"><span class="plant-card-kind">'+esc(p.form)+(p.native?" · NZ native":"")+'</span><h3>'+esc(p.common||p.name)+'</h3>'+(p.common?'<p class="plant-botanical">'+esc(p.name)+'</p>':"")+'<p>'+esc(colourNote)+'</p><span class="plant-card-action">View Christchurch plant guide ↗</span></a></article>';
  }).join("");
  const filters='<div class="plant-filters" role="search" aria-label="Find plants"><div class="plant-filter plant-query"><label for="plant-query">Search plants and characteristics</label><input id="plant-query" type="search" placeholder="Try white flowers, koromiko, low hedge or coastal" autocomplete="off"></div>'+
    '<div class="plant-filter"><label for="plant-form">Plant type</label><select id="plant-form">'+opts(allForms,"All plant types")+'</select></div>'+
    '<div class="plant-filter"><label for="plant-use">Purpose</label><select id="plant-use">'+opts(allUses,"All garden uses")+'</select></div>'+
    '<div class="plant-filter"><label for="plant-flower">Flower colour</label><select id="plant-flower">'+opts(allFlowers,"Any flower colour")+'</select></div>'+
    '<div class="plant-filter"><label for="plant-foliage">Foliage colour</label><select id="plant-foliage">'+opts(allFoliage,"Any foliage colour")+'</select></div>'+
    '<div class="plant-filter"><label for="plant-light">Sun and shade</label><select id="plant-light">'+opts(allLight,"Any light exposure")+'</select></div>'+
    '<div class="plant-filter"><label for="plant-season">Flowering season</label><select id="plant-season">'+opts(allSeasons,"Any flowering season")+'</select></div>'+
    '<div class="plant-filter"><label for="plant-native">NZ native</label><select id="plant-native"><option value="">Native or introduced</option><option value="yes">NZ native only</option></select></div>'+
    '<div class="plant-filter-action"><button id="plant-reset" type="button" class="plant-reset">Clear filters</button></div></div>';
  const chips='<nav class="plant-quick-filters" aria-label="Popular plant searches">'+popular.map(q=>'<a href="/plants/?use='+encodeURIComponent(q[0])+'">'+esc(q[1])+' ↗</a>').join("")+'</nav>';
  const lead="Search "+plants.length+" plant profiles by name, flowers, foliage colour, type and growing conditions. Practical guidance for Christchurch gardens, from native hedges to coastal borders and flowering shrubs.";
  const hub=articleHero("Find plants for your garden","Christchurch plant directory",lead,dirTrail)+
    '<section class="section"><div class="container"><div class="plant-intro"><p>Compare garden plants before choosing what to grow in Christchurch, Canterbury. Filter shrubs, trees, perennials, hedges, climbers, native plants, grasses, groundcovers and flower colours. The reference catalogue includes restoration plants as well as everyday garden choices: not every entry suits every suburban property.</p><p><strong>Need work done?</strong> Read our <a href="/services/">Christchurch gardening services</a> or <a href="'+TEL_URL+'">call Dallas on '+PHONE+'</a> for maintenance, hedge trimming and tidy-ups. This directory does not sell plants or claim nursery stock availability.</p></div>'+
    chips+filters+'<p class="plant-count" id="plant-count" role="status" aria-live="polite">Showing all '+plants.length+' plants</p><div id="plant-results" class="plant-results">'+cards+'</div><p id="plant-empty" class="plant-empty" hidden>No matches found. Try fewer filters or search by a botanical or common name.</p>'+
    '<div class="plant-guide-note"><h2>Planting in Christchurch</h2><p>Local soil and conditions vary from exposed New Brighton gardens to sheltered city sections and Port Hills slopes. Check your own garden for frost pockets, salt wind, sun, waterlogging, plant size and any pest-plant restrictions before buying.</p><p>See our <a href="/guides/christchurch-garden-soils/">Christchurch soil guide</a>, <a href="/guides/native-plants-christchurch/">native plant guide</a> and <a href="/guides/christchurch-gardening-calendar/">seasonal gardening calendar</a>. Each plant profile links to its source listing for additional identification and reference.</p></div></div></section>';
  files["plants/index.html"]=layout({path:"/plants/",title:"Christchurch Plants, Flowers, Shrubs & Hedges | Kiwi Gardeners",description:"Search 271 plant guides for Christchurch gardens by plant type, hedge use, flower or foliage colour, NZ natives, light and seasonal interest. Get local gardening help.",content:hub,trail:dirTrail,type:"CollectionPage"});

  for(const p of plants){
    const path=uri(p);
    const headline=p.common?p.common+" ("+p.name+")":p.name;
    const trail=[...dirTrail,{name:p.common||p.name,path}];
    const featureText=[
      p.form!=="Garden plant"?"a "+p.form.toLowerCase():"a garden plant",
      p.flowers.length?"flowers in "+p.flowers.join(", "):"",
      p.foliage.length?"foliage notes including "+p.foliage.join(", "):"",
      p.native?"a New Zealand native entry":""
    ].filter(Boolean);
    const uses=p.uses.length?'<p>Possible uses to explore include <strong>'+esc(p.uses.map(s=>s.toLowerCase()).join(", "))+'</strong>. These are reference tags, not a guarantee of success on every property.</p>':"<p>Assess the plant's mature size and growth habit before deciding how it fits with existing planting.</p>";
    const light=p.light.length?'<p>The source material mentions <strong>'+esc(displayList(p.light))+'</strong>. Verify which exposure this particular cultivar prefers, especially if your section has reflected heat, strong afternoon sun or winter shade.</p>':"<p>First establish whether the space gets full sun, partial shade or very little direct light, then check the species' requirements before placing it.</p>";
    const shadeAdvice=p.flags.includes("Coastal exposure")?'<p>Coastal exposure appears in the reference notes, but shelter and salt wind still vary from street to street near New Brighton and Southshore.</p>':p.uses.includes("Wet ground")?'<p>For damp sites, distinguish moisture-retentive soil from persistent waterlogging. Do not assume a wetland-related plant will suit every waterlogged section.</p>':p.uses.includes("Dry gardens")?'<p>Dry-season performance depends on whether roots have established; new plantings still need a watering plan through hot Canterbury spells.</p>':'<p>Christchurch sites can combine cold winter nights with hot, drying summer weather. Soil structure, drainage and the amount of shelter are as important as the suburb name.</p>';
    const service=p.uses.includes("Hedging & screening")?["hedge-trimming","hedge trimming"]:p.form==="Tree"?["tree-pruning","tree pruning"]:p.form==="Groundcover"?["weeding","garden-bed weeding"]:["garden-maintenance","garden maintenance"];
    const related=plants.filter(x=>x.slug!==p.slug&&(x.form===p.form||x.uses.some(u=>p.uses.includes(u)))).sort((x,y)=>((x.slug.split("-")[0]===p.slug.split("-")[0])?0:1)-((y.slug.split("-")[0]===p.slug.split("-")[0])?0:1)||x.name.localeCompare(y.name)).slice(0,5);
    const originalIntro="This guide looks at "+headline+" as "+featureText.join(", ")+". Rather than choosing plants by appearance alone, consider where the plant will go, how much room it needs and the maintenance expected after planting.";
    const characteristics='<section><h2>Plant characteristics at a glance</h2><dl class="plant-facts">'+
      [['Plant type',p.form],['Botanical or cultivar name',p.name],['Common name',p.common||"No separate common name listed"],['Flower colours',colourWords(p.flowers)],['Foliage colours',colourWords(p.foliage)],['Light mentioned in source',displayList(p.light,"Not specified")],['Flowering season in source',p.season||"Not recorded"],['Garden use tags',displayList(p.uses,"Site-dependent")],['NZ native',p.native?"Listed here as a NZ native":"Not confirmed in this directory"]].map(x=>'<div><dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd></div>').join("")+'</dl><p class="plant-fact-note">Colours, seasons and tolerance descriptions are indicative. Flowering and growth can differ with cultivar, weather, soil and the particular garden site.</p></section>';
    const content=articleHero("Christchurch plant guide",headline,"Plant features, garden uses and care considerations for Christchurch and Canterbury. Use this page to plan your garden and find local maintenance help.",trail)+
      '<div class="container text-layout plant-profile"><article class="prose"><p class="plant-opening">'+esc(originalIntro)+'</p>'+characteristics+
      '<section><h2>Where '+esc(p.common||p.name)+' may fit in a Christchurch garden</h2><p>'+esc(situationByForm[p.form])+'</p>'+uses+
      '<p>Look at existing hedges, paths, lawn edges and neighbouring plants before deciding where to place it. A compact city garden has different needs from an open rural or restoration planting.</p></section>'+
      '<section><h2>Sun, drainage and local conditions</h2>'+light+shadeAdvice+'<p>Before planting, test soil drainage after rain and consider whether winter frosts, easterly winds or summer drying will affect establishment.</p></section>'+
      '<section><h2>Care and maintenance</h2><p>'+esc(careByForm[p.form])+'</p><p>Watering, feeding and pruning should follow the exact species and site. Observe the plant through the first full growing season; adjust the plan rather than applying the same schedule to every shrub, tree or flower.</p></section>'+
      '<section><h2>Reference and plant identification</h2><p>This entry draws on factual characteristics in a publicly listed Canterbury nursery catalogue. For identification details and more botanical information, see the <a href="'+esc(p.source)+'" target="_blank" rel="noopener noreferrer">Goughs Nurseries listing for '+esc(p.name)+' ↗</a>. Kiwi Gardeners is independent of the nursery. We do not reproduce its photographs, descriptions or stock claims.</p><p>If you are unsure of a cultivar, check the actual plant label and seek horticultural advice before purchasing. Avoid introducing regulated or invasive species, and check local rules where relevant.</p></section>'+
      '<div class="callout conversion-cta"><strong>Need Christchurch gardeners to help maintain your outdoor space?</strong><p>Dallas Timpson Garden Services welcomes enquiries about '+esc(service[1])+', lawn mowing, garden tidy-ups, pruning and green waste removal. Plant supply is not currently offered through this directory.</p><p><a class="button" href="'+TEL_URL+'">Call Dallas · '+PHONE+'</a> <a href="'+ENQUIRY_URL+'">Email a garden enquiry ↗</a></p><p><a href="/services/'+service[0]+'/">Learn about '+esc(service[1])+' services in Christchurch</a>.</p></div>'+
      '<section class="plant-related"><h2>Explore related plants</h2><ul>'+related.map(x=>'<li><a href="'+uri(x)+'">'+esc(x.common||x.name)+'</a> <small>'+esc(x.form)+'</small></li>').join("")+'</ul><p><a href="/plants/">Back to all 271 Christchurch plant guides ↗</a></p></section>'+
      '<!-- Reserved for a future, clearly labelled supplier/affiliate integration. No adverts or tracking are installed. --></article>'+
      '<aside class="sidebar plant-sidebar"><h3>Garden planning</h3><a href="/plants/">Search all plants ↗</a><a href="/guides/christchurch-garden-soils/">Christchurch soils ↗</a><a href="/guides/native-plants-christchurch/">Native plants ↗</a><a href="/guides/coastal-gardening-christchurch/">Coastal gardening ↗</a><a href="/services/">Gardening services ↗</a><p>Call Dallas to discuss <a href="'+TEL_URL+'">garden maintenance in Christchurch on '+PHONE+'</a>, or <a href="'+ENQUIRY_URL+'">email an enquiry</a>.</p></aside></div>';
    const title=(p.common?p.common+" | "+p.name:p.name)+" | Christchurch Plant Guide";
    const description=(p.common?p.common+" ("+p.name+")":p.name)+": a "+p.form.toLowerCase()+" in our Christchurch plant directory. Explore colours, growing conditions, care, and local gardening services.";
    files["plants/"+p.slug+"/index.html"]=layout({path,title,description,content,trail,type:"Article"});
  }
  return plants.length;
}
