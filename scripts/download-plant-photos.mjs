// Download the exact 271 catalogue thumbnails into the generated static asset tree.
// Browsers must not hotlink the nursery host: source-origin remote <img> requests can
// fail even while fetching the same JPEG over HTTPS from a build runner succeeds.
// The files live only in dist/ (generated at every build); no running image proxy.
import {mkdir, writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {join} from "node:path";
import {plants} from "../src/plant-catalogue.mjs";
import {plantPhotoLinks} from "../src/plant-photo-links.mjs";

export const plantPhotoPath = slug=>"/assets/plant-photos/"+slug+".jpg";

function assertJPEG(bytes){
  return bytes.length>=300 && bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff &&
    bytes[bytes.length-2]===0xff && bytes[bytes.length-1]===0xd9;
}
// Read dimensions from JPEG SOF segment, not the filename.
function jpegSize(bytes){
  for(let i=2;i<bytes.length-10;){
    if(bytes[i]!==0xff){i++;continue}
    while(bytes[i]===0xff)i++;
    const marker=bytes[i++];
    if(marker===0xd9||marker===0xda)break;
    if(marker>=0xd0&&marker<=0xd7||marker===0x01)continue;
    const n=bytes.readUInt16BE(i);
    if(n<2||i+n>bytes.length)break;
    if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))
      return {height:bytes.readUInt16BE(i+3),width:bytes.readUInt16BE(i+5)};
    i+=n;
  }
  return null;
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
      const dimensions=jpegSize(bytes);
      if(!dimensions||dimensions.width<100||dimensions.height<100)
        throw new Error("Invalid photo dimensions "+JSON.stringify(dimensions)+" ("+bytes.length+" bytes)");
      await writeFile(join(destination,slug+".jpg"),bytes);
      return {length:bytes.length,dimensions,hash:createHash("sha256").update(bytes).digest("hex")};
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
  const successful=[];
  const errors=[];
  async function worker(){
    while(next<entries.length){
      const {slug,url}=entries[next++];
      try{const info=await downloadOne(url,slug,destination);bytes+=info.length;successful.push({slug,...info})}
      catch(e){errors.push(String(e.message||e))}
    }
  }
  await Promise.all(Array.from({length:Math.min(concurrency,entries.length)},()=>worker()));
  if(errors.length)throw new Error("Missing "+errors.length+" of "+entries.length+" real plant photographs. Refusing to publish broken image cards.\n"+errors.join("\n"));
  const distinct=new Set(successful.map(x=>x.hash));
  const sizes=successful.map(x=>x.length).sort((a,b)=>a-b);
  console.log("Downloaded and checked "+entries.length+" plant JPEG thumbnails ("+(bytes/1024/1024).toFixed(1)+" MiB) into "+destination);
  console.log("Plant photo audit: "+distinct.size+" distinct images; JPEG bytes min/median/max "+sizes[0]+"/"+sizes[Math.floor(sizes.length/2)]+"/"+sizes.at(-1)+"; first "+JSON.stringify(successful.slice(0,3).map(x=>({slug:x.slug,bytes:x.length,pixels:x.dimensions,sha:x.hash.slice(0,12)}))));
  if(distinct.size<220)throw new Error("Too few unique plant photos ("+distinct.size+"), possibly displaying the same fallback thumbnail repeatedly");
}
