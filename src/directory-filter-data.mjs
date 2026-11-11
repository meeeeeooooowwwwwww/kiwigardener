/**
 * KG-DIR-01 search vocabulary + official NZ locality catalogue (build time).
 * One SHA-pinned Stats NZ 2026 UR2026/REGC2025 source, already validated by
 * GRID EATER GEO-NZ-07. Place identity is for SEARCH only, NOT a claim that a
 * business serves an area, has a public address, or passed Kiwi approval.
 */
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
const DATA_PATH=new URL("./data/nz-populated-places-2026.json.gz.b64",import.meta.url);
const STATS_SHA="89bb35e1ab3dc42ae5db6d47990299a74c75caecec28c18387fffe19171a161a";
const INDEX_SHA="79adcceb10e7303b9e7b9fb52d01266ad1bcd6e4994146cd336693a0b0c38420";
const fail=x=>{throw Error("KG_NZ_PLACE_DATA_"+x);};
const norm=v=>String(v||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
  .toLocaleLowerCase("en-NZ").replace(/\s+/g," ").trim();
const entry=(id,label,kind,...aliases)=>({id,label,kind,aliases});
const KEYWORDS=[
  entry("garden-maintenance","Garden maintenance","service","gardening","garden care","regular maintenance","property gardening"),
  entry("garden-tidy-ups","Garden tidy-ups","service","garden clean ups","garden clean-ups","garden clearance","yard tidy","overgrown gardens"),
  entry("weeding","Weeding","service","weed removal","garden weeding","hand weeding","weed control"),
  entry("hedge-trimming","Hedge trimming","service","hedge cutting","hedge maintenance","hedge shaping","topiary","hedges","hedge pruning"),
  entry("lawn-mowing","Lawn mowing","service","mowing","grass cutting","mow lawns","lawn care","ride on mowing","lawns","grass mowing"),
  entry("lawn-treatment","Lawn treatment","service","lawn fertilising","lawn renovation","lawn aeration","dethatching","lawn weed control"),
  entry("landscaping","Landscaping","service","landscaper","landscapers","landscaping services","landscape gardening"),
  entry("landscape-design","Landscape design","service","garden design","landscape planning","landscape architect"),
  entry("landscape-construction","Landscape construction","service","hard landscaping","garden edging","retaining walls","paving installation"),
  entry("tree-services","Tree services","service","arborist","arboriculture","tree removal","tree pruning","stump grinding","tree felling"),
  entry("irrigation-installation","Irrigation installation","service","sprinkler installation","drip irrigation installation","irrigation repairs"),
  entry("green-waste-removal","Green waste removal","service","garden waste","garden rubbish removal","green waste collection","branch removal"),
  entry("planting","Planting services","service","garden planting","tree planting","shrub planting","replanting"),
  entry("plant-nursery","Plant nursery","supplier","nursery","plant nurseries","seedlings","plants for sale","wholesale plants"),
  entry("native-plants","Native plants","supplier","nz native plants","native tree supplier","native shrubs","native seedlings"),
  entry("hedging-plants","Hedging plants","supplier","hedge plants","screening plants","hedging and screening","shelter plants"),
  entry("seeds-bulbs","Seeds and bulbs","supplier","seed supplier","seeds","flower bulbs","plant bulbs"),
  entry("garden-tools","Garden tools and equipment","supplier","gardening tools","garden machinery","garden equipment retailer","power tools"),
  entry("mower-retail","Lawnmowers and parts","supplier","lawn mower sales","lawn mower retailer","mower spare parts","ride on mowers"),
  entry("irrigation-supplies","Irrigation supplies","supplier","sprinkler parts","irrigation fittings","irrigation equipment","drip line"),
  entry("compost","Compost","supplier","compost supplier","garden compost","compost bags","soil conditioner"),
  entry("soil-topsoil","Topsoil and garden soil","supplier","garden soil","topsoil","soil mix","potting mix","potting soil","screened soil","garden mix"),
  entry("mulch-bark","Mulch and bark","supplier","pine mulch","mulch","bark","bark chips","wood chips","bark nuggets"),
  entry("landscaping-materials","Landscaping supplies","supplier","landscape materials","landscaping materials","paving materials","garden gravel","decorative stones","aggregates","landscape supplies","garden supplies","quarry supplies"),
  entry("garden-makeovers","Garden makeovers","service","garden renovations","garden makeover","garden transformation","garden redesign"),
  entry("garden-edging","Garden edging","service","lawn edging","garden border edging","garden borders"),
  entry("plant-wholesale","Wholesale plants and seedlings","supplier","wholesale nursery","plant wholesalers","contract growing","wholesale seedlings"),
  entry("sand-aggregates","Sand gravel and aggregates","supplier","bedding sand","screened aggregate","shingle","crusher dust","pea metal","drainage chip","river stones","landscape rocks"),
  entry("garden-centres","Garden centres","supplier","garden centre","gardening store","garden supplies store","plant retailer"),
  entry("fertilisers","Fertilisers and plant food","supplier","fertilizer","fertiliser","plant feed","garden fertiliser")
];

export function buildGardenDirectoryFilterData(){
  const encoded=readFileSync(DATA_PATH,"utf8").trim();
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)||encoded.length>12000)fail("ENCODING");
  const bytes=gunzipSync(Buffer.from(encoded,"base64"));
  if(createHash("sha256").update(bytes).digest("hex")!==INDEX_SHA)fail("SHA_MISMATCH");
  const raw=JSON.parse(bytes.toString("utf8"));
  if(raw.sourceSha256!==STATS_SHA||raw.places?.length!==597||
     raw.regions?.length!==17)fail("COUNTS_OR_PROVENANCE");
  const regions=Object.fromEntries(raw.regions);
  if(regions["13"]!=="Canterbury Region"||regions["16"]!=="Tasman Region"||
     regions["17"]!=="Nelson Region")fail("REGION_IDENTITY");
  const names=new Set(),stats={urban:0,rural:0};
  for(const row of raw.places){
    if(!Array.isArray(row)||row.length!==3||typeof row[0]!=="string"||
      typeof row[1]!=="string"||!/^(?:\d{2})+$/.test(row[1])||
      !["urban","rural"].includes(row[2])||names.has(norm(row[0])))fail("PLACE");
    names.add(norm(row[0]));stats[row[2]]++;
    for(let i=0;i<row[1].length;i+=2)if(!regions[row[1].slice(i,i+2)])fail("REGION_EDGE");
  }
  if(stats.urban!==195||stats.rural!==402)fail("PLACE_CLASSES");
  const lookup=new Map(raw.places.map(row=>[norm(row[0]),row]));
  for(const [name,code] of [["Christchurch","13"],["Ashburton","13"],
    ["Lyttelton","13"],["Dunedin","14"],["Auckland","02"]]){
    if(!lookup.get(norm(name))?.[1].includes(code))fail("KEY_TOWNS");
  }
  if(lookup.get("richmond")?.[1]!=="1617")fail("DUAL_REGION");
  const keywordIds=new Set();
  for(const word of KEYWORDS){
    if(keywordIds.has(word.id)||!["service","supplier"].includes(word.kind)||
      !word.aliases.length||word.aliases.some(a=>!norm(a)))fail("KEYWORDS");
    keywordIds.add(word.id);
  }
  return {version:1,source:"Stats NZ UR2026/REGC2025; GRID EATER review vocabulary",
    sourceSha256:STATS_SHA,
    regions:raw.regions,places:raw.places,keywords:KEYWORDS};
}

/**
 * Region expansion is a SEARCH JOIN only: the supplied strings must be
 * independently approved service-area claims already present in the public
 * GRID EATER feed. Never send registered addresses/premises here.
 */
export function placeMatchesApprovedArea(areas,selectedTown,data=buildGardenDirectoryFilterData()){
  const place=data.places.find(x=>norm(x[0])===norm(selectedTown));
  if(!place||!Array.isArray(areas))return false;
  const claimed=new Set(areas.map(norm));
  if(claimed.has(norm(place[0])))return true;
  const codes=place[1].match(/.{2}/g)||[];
  return codes.some(code=>{
    const label=data.regions.find(r=>r[0]===code)?.[1];
    return label&&code!=="99"&&
      (claimed.has(norm(label))||claimed.has(norm(label.replace(/ Region$/,""))));
  });
}
