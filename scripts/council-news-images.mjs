// Photograph assets already used and attributed in src/local-editorial.mjs.
// Download at build time to avoid external hotlinks failing in visitors' browsers.
// If Commons is temporarily unavailable, the renderer uses a pre-existing
// local botanical image, never a broken image or fake Council article photograph.
import {images} from "../src/local-editorial.mjs";
export const councilPhotoKeys=["botanic","travis","dunes","riccarton","hills"];
async function retrieve(key){
  const url=images[key]?.src;
  if(!url)throw new Error("Unknown licensed photograph "+key);
  for(let attempt=1;attempt<=2;attempt++){
    try{
      const response=await fetch(url,{headers:{
        "User-Agent":"KiwiGardenersWebsite/1.0 (https://kiwigardeners.com/; contact: david@americafirst.co.nz)",
        "Accept":"image/jpeg,image/*;q=0.9"
      },signal:AbortSignal.timeout(9000)});
      if(!response.ok)throw new Error("HTTP "+response.status);
      const bytes=Buffer.from(await response.arrayBuffer());
      if(bytes.length<4000||bytes[0]!==0xff||bytes[1]!==0xd8||bytes[2]!==0xff)throw new Error("Invalid JPEG");
      return bytes;
    }catch(error){if(attempt===2)throw error;}
  }
}
export async function fetchCouncilImageAssets(){
  const results=await Promise.allSettled(councilPhotoKeys.map(key=>retrieve(key)));
  const out={};
  for(let i=0;i<councilPhotoKeys.length;i++){
    const key=councilPhotoKeys[i],result=results[i];
    if(result.status==="fulfilled")out[key]=result.value;
    else console.warn("Council news illustration unavailable for "+key+": "+String(result.reason?.message||result.reason));
  }
  console.log("Council news: "+Object.keys(out).length+" of "+councilPhotoKeys.length+" licensed illustrative photos cached at build time");
  return out;
}
