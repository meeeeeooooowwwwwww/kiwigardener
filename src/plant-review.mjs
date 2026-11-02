// Individual editorial notes for the 229 previously unreviewed profiles.
// The two distinctive paragraphs per profile are authored in three separate review batches.
// Add a restrained Christchurch-specific site check without changing the existing layout.
import {plants} from "./plant-catalogue.mjs";
import {reviewedPlantNotesA} from "./plant-review-a.mjs";
import {reviewedPlantNotesB} from "./plant-review-b.mjs";
import {reviewedPlantNotesC} from "./plant-review-c.mjs";
const reviewed={...reviewedPlantNotesA,...reviewedPlantNotesB,...reviewedPlantNotesC};
const siteCheck=(p)=>{
  if(p.uses.includes("Wet ground"))return "In Christchurch, distinguish a seasonally damp hollow from a waterlogged section or stormwater swale before choosing the planting level.";
  if(p.uses.includes("Coastal gardens"))return "Near New Brighton or Southshore, test the actual salt-wind exposure, dry sand and winter drainage rather than assuming all coastal streets have identical conditions.";
  if(p.uses.includes("Dry gardens"))return "On exposed Canterbury sections, new plants still need establishment watering even when the mature species is listed for drier gardens.";
  if(p.uses.includes("Hedging & screening"))return "For Christchurch property boundaries, work from the eventual height and width of the screen and the access needed for trimming both sides.";
  if(p.uses.includes("Restoration planting"))return "For a Canterbury restoration scheme, match the plant to the local ecosystem and use suitable eco-sourced stock rather than relying on general nursery labels.";
  if(p.form==="Groundcover")return "In a Christchurch garden bed, weed and level the soil first and decide where spreading growth must stop before it reaches paving or neighbouring crowns.";
  if(p.form==="Tree")return "Before planting a tree in Christchurch, account for mature roots, canopy, overhead services and the maintenance access that a small nursery specimen can conceal.";
  if(p.form==="Grass & sedge")return "In Canterbury wind, the movement of the foliage can be attractive, but a mature tussock needs space so it does not obstruct a walkway.";
  if(p.form==="Flax")return "In a Christchurch border, plan for the width and height of the mature leaf fans, not merely the small potted plant.";
  if(p.form==="Perennial")return "Christchurch's frost-prone winters and potentially dry summers make drainage, seasonal dieback and the position of the crown worth checking.";
  return "Christchurch gardens vary from sheltered city courtyards to exposed Port Hills sites, so check actual sun, winter drainage and wind before committing to the position.";
};
const maintenanceCheck=(p)=>{
  if(p.native&&p.uses.includes("Restoration planting"))return "If planted for biodiversity, retain natural form where practical and check the site-specific planting and weed-control plan.";
  if(p.uses.includes("Hedging & screening"))return "For an even screen, keep light reaching the lower foliage and clear cuttings from paths and neighbouring properties.";
  if(p.uses.includes("Wet ground"))return "Keep planted waterways clear of litter and avoid disturbing any protected banks or managed stormwater assets.";
  if(p.form==="Tree")return "For large or potentially hazardous tree work near buildings and powerlines, arrange suitable specialist assessment.";
  if(p.form==="Groundcover")return "A narrow hand-weeded perimeter during establishment usually causes less damage than aggressive hoeing or strimming.";
  if(p.form==="Flax")return "Old leaf removal and division require care around the central crown; avoid cutting the plant as though it were turf.";
  if(p.form==="Grass & sedge")return "Maintain the clump's natural outline instead of giving it an annual flat-top mow.";
  return "Reassess growth after the first winter and summer, as a maintenance rhythm suitable for one property may not suit another.";
};
const slugSet=new Set(plants.map(p=>p.slug));
for(const slug of Object.keys(reviewed))if(!slugSet.has(slug))throw new Error("Reviewed plant has no catalogue entry: "+slug);
export const reviewedPlantEditorial=Object.fromEntries(plants.filter(p=>reviewed[p.slug]).map(p=>[
  p.slug,[reviewed[p.slug][0]+" "+siteCheck(p),reviewed[p.slug][1]+" "+maintenanceCheck(p)]
]));
