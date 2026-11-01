// Download the exact 271 catalogue thumbnails into the generated static asset tree.
// Browsers must not hotlink the nursery host: source-origin remote <img> requests can
// fail even while fetching the same JPEG over HTTPS from a build runner succeeds.
// The files live only in dist/ (generated at every build); no running image proxy.
import {mkdir, writeFile, readFile} from "node:fs/promises";
import {join} from "node:path";
import {plants} from "../src/plant-catalogue.mjs";
import {plantPhotoLinks} from "../src/plant-photo-links.mjs";

export const plantPhotoPath = slug=>"/assets/plant-photos/"+slug+".jpg";

function assertJPEG(bytes){
  return bytes.length>=300 && bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff &&
    bytes[bytes.length-2]===0xff && bytes[bytes.length-1]===0xd9;
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function downloadOne(url, slug, destination) {
  let error;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const res=await fetch(url,{
        headers:{"User-Agent":"Mozilla/5.0 (compatible; KiwiGardenersPlantImageBuild/1.0)","Accept":"image/jpeg,image/*;q=0.9"},
        redirect:"follow",
        signal:AbortSignal.timeout(18000)
      });
      if(!res.ok)throw new Error("HTTP "+res.status);
      const bytes=Buffer.from(await res.arrayBuffer());
      if(!assertJPEG(bytes))throw new Error("Not a complete JPEG ("+bytes.length+" bytes, content-type "+res.headers.get("content-type")+")");
      await writeFile(join(destination,slug+".jpg"),bytes);
      return bytes.length;
    }catch(e){
      error=e;
      if(attempt<3)await sleep(400*attempt);
    }
  }
  throw new Error(slug+": "+String(error?.message??error)+" ("+url+")");
}

export async function downloadPlantPhotos({dist="dist",concurrency=14}={}){
  const entries=plants.map(p=>({slug:p.slug,url:plantPhotoLinks[p.slug]}));
  if(entries.length!==271||Object.keys(plantPhotoLinks).length!==entries.length||
    entries.some(e=>!e.url||!e.url.startsWith("https://www.goughsnurseries.co.nz/cache/plant/")))
    throw new Error("Plant photo map is missing or has incorrect entries");
  const destination=join(dist,"assets","plant-photos");
  await mkdir(destination,{recursive:true});
  let next=0,bytes=0;
  const errors=[];
  async function worker(){
    while(next<entries.length){
      const {slug,url}=entries[next++];
      try{bytes+=await downloadOne(url,slug,destination)}
      catch(e){errors.push(String(e.message||e))}
    }
  }
  await Promise.all(Array.from({length:Math.min(concurrency,entries.length)},()=>worker()));
  if(errors.length)throw new Error("Missing "+errors.length+" of "+entries.length+" real plant photographs. Refusing to publish broken image cards.\n"+errors.join("\n"));
  console.log("Downloaded and checked "+entries.length+" plant JPEG thumbnails ("+(bytes/1024/1024).toFixed(1)+" MiB) into "+destination);
}
