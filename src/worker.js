// Dedicated contact API for a static-asset Cloudflare Worker.
// Customer details are never placed in URLs or logged.
const DESTINATION = "david@americafirst.co.nz";
const FROM = "enquiries@kiwigardeners.com";
const JSON_HEADERS = {"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const reply=(status,payload)=>new Response(JSON.stringify(payload),{status,headers:JSON_HEADERS});
export function ready(env) {
  return Boolean(env.EMAIL?.send && env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY && env.CONTACT_LIMIT?.limit);
}
const validEmail=(v)=>typeof v==="string" && v.length<=254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);
const clean=(v,max)=>typeof v==="string" ? v.trim().slice(0,max+1) : "";
const rejectIfInvalid=(body)=>{
  if(!body || typeof body!=="object" || Array.isArray(body))return "Invalid submission.";
  if(clean(body.name,100).length<2 || clean(body.name,100).length>100) return "Please enter your name.";
  if(!validEmail(body.email)) return "Please enter a valid email address.";
  if(clean(body.suburb,90).length<2 || clean(body.suburb,90).length>90) return "Please enter your Christchurch suburb.";
  if(clean(body.service,90).length<2 || clean(body.service,90).length>90) return "Please select a gardening service.";
  if(clean(body.message,3000).length<15 || clean(body.message,3000).length>3000) return "Please describe the work (15 to 3000 characters).";
  if(body.consent!==true) return "Please agree to the privacy notice.";
  if(typeof body.token!=="string" || body.token.length<10 || body.token.length>2048) return "Please complete the anti-spam verification.";
  return null;
};
export async function contactAPI(request,env){
  const url=new URL(request.url);
  if(url.pathname==="/api/contact/config"){
    if(request.method!=="GET") return reply(405,{error:"Method not allowed."});
    return reply(200,ready(env)?{enabled:true,siteKey:env.TURNSTILE_SITE_KEY}:{enabled:false});
  }
  if(url.pathname!=="/api/contact") return reply(404,{error:"Not found."});
  if(request.method!=="POST")return reply(405,{error:"Method not allowed."});
  if(!ready(env))return reply(503,{error:"Online enquiries are being configured. Please email david@americafirst.co.nz."});
  const origin=request.headers.get("origin");
  if(!origin || origin!==url.origin || !["kiwigardeners.com","www.kiwigardeners.com","kiwigardener.generalflynn17.workers.dev"].includes(url.hostname))return reply(403,{error:"Invalid origin."});
  if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))return reply(415,{error:"Only JSON submissions are accepted."});
  if(Number(request.headers.get("content-length")||0)>12000)return reply(413,{error:"Message too large."});
  let body;
  try{
    const text=await request.text();
    if(text.length>12000)return reply(413,{error:"Message too large."});
    body=JSON.parse(text);
  }catch{return reply(400,{error:"Invalid submission."});}
  // Honeypot traps automated form-fillers without sending emails.
  if(body?.company) return reply(200,{ok:true});
  const validation=rejectIfInvalid(body);
  if(validation)return reply(400,{error:validation});
  let limited;
  try{limited=await env.CONTACT_LIMIT.limit({key:(request.headers.get("CF-Connecting-IP")||"unknown").slice(0,90)})}
  catch{return reply(503,{error:"Enquiries are temporarily unavailable. Please email us directly."});}
  if(!limited.success)return reply(429,{error:"Too many attempts. Please try again later or email us directly."});
  try{
    const result=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({secret:env.TURNSTILE_SECRET,response:body.token,remoteip:request.headers.get("CF-Connecting-IP")||undefined})
    });
    if(!result.ok)return reply(503,{error:"Verification service unavailable. Please try again."});
    const verification=await result.json();
    if(verification.success!==true || (verification.hostname && verification.hostname!==url.hostname))return reply(403,{error:"Verification failed. Refresh the page and try again."});
  }catch{return reply(503,{error:"Verification service unavailable. Please try again."});}
  const detail=[
    "New Kiwi Gardeners Christchurch website enquiry",
    "Name: "+clean(body.name,100),
    "Email: "+body.email,
    "Suburb: "+clean(body.suburb,90),
    "Service: "+clean(body.service,90),
    "",
    "Message:",
    clean(body.message,3000),
    "",
    "Submitted via: kiwigardeners.com/contact/",
  ].join("\n");
  // Never use visitor-supplied data as sender or HTML, to avoid spoofing and injection.
  try{
    await env.EMAIL.send({
      to:DESTINATION,from:FROM,replyTo:body.email,
      subject:"Kiwi Gardeners enquiry: "+clean(body.service,50),
      text:detail
    });
    return reply(200,{ok:true,message:"Your enquiry has been submitted. Thank you."});
  }catch{
    // Do not report success if Cloudflare rejected the send.
    return reply(502,{error:"We couldn't send your enquiry. Please email david@americafirst.co.nz directly."});
  }
}
export default {async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path==="/api/contact"||path==="/api/contact/config")return contactAPI(request,env);
  return env.ASSETS.fetch(request);
}};
