// On-demand contact protection. No email value is present in HTML, this script,
// the directory feed, or client-visible configuration before a Turnstile check.
(async()=>{
 const mount=document.querySelector(".gardener-email-reveal");
 if(!mount)return;
 const button=mount.querySelector("[data-reveal-email]");
 const status=mount.querySelector("[data-reveal-status]");
 const target=mount.querySelector("[data-turnstile-container]");
 const output=mount.querySelector("[data-contact-details]");
 if(!output)return;
 const id=mount.getAttribute("data-business-id");
 if(!/^afnz-\d{13}$/.test(id||""))return;
 let config;
 try{
  const r=await fetch("/api/gardeners/contact/config",{cache:"no-store",credentials:"omit"});
  if(!r.ok)return;
  config=await r.json();
 }catch{return;}
 if(!config.enabled||!/^[a-zA-Z0-9_-]{10,}$/.test(config.siteKey||""))return;
 button.style.display="";
 let widgetId=null,working=false;
 const verify=async(token)=>{
  if(working)return;
  working=true;button.disabled=true;
  status.textContent="Checking and retrieving contact details…";
  try{
   const response=await fetch("/api/gardeners/"+encodeURIComponent(id)+"/contact",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({token}),cache:"no-store",credentials:"omit"
   });
   const result=await response.json();
   if(!response.ok)throw Error(response.status===404?"No contact details are available for this listing.":"Verification failed or contact details unavailable. Try again.");
   const nodes=[];
   const add=(label,text,href,external=false)=>{
    const p=document.createElement("p"),a=document.createElement("a");
    a.textContent=text;a.href=href;
    if(external){a.target="_blank";a.rel="noopener noreferrer";}
    p.append(label+": ",a);nodes.push(p);
   };
   if(typeof result.phone?.display==="string"&&/^tel:\+64\d{7,10}$/.test(result.phone.telHref||""))
    add("Phone",result.phone.display,result.phone.telHref);
   if(typeof result.email==="string"&&/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(result.email))
    add("Email",result.email,"mailto:"+result.email);
   for(const [key,label] of [["website","Website"],["sourcePage","GRID EATER business record"]]){
    if(typeof result[key]!=="string")continue;
    try{const url=new URL(result[key]);if(["https:","http:"].includes(url.protocol)&&!url.username&&!url.password)add(label,key==="website"?url.hostname:"View business record",url.href,true);}catch{}
   }
   if(!nodes.length)throw Error("No contact details are available for this listing.");
   output.replaceChildren(...nodes);
   status.textContent="Contact details verified.";
   button.style.display="none";
   target.replaceChildren();
  }catch(e){
   status.textContent=e.message||"Could not reveal email.";
   window.turnstile?.reset(widgetId);
  }finally{working=false;button.disabled=false;}
 };
 button.addEventListener("click",()=>{
  if(widgetId!==null)return;
  status.textContent="Complete the Cloudflare verification below to show the business email.";
  const script=document.createElement("script");
  script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async=true;
  script.onload=()=>{
   if(!window.turnstile){status.textContent="Verification unavailable.";return;}
   widgetId=window.turnstile.render(target,{
    sitekey:config.siteKey,action:"business_email_reveal",theme:"auto",
    callback:verify,
    "expired-callback":()=>{status.textContent="Challenge expired. Complete it again.";},
    "error-callback":()=>{status.textContent="Verification unavailable. Try again.";}
   });
  };
  script.onerror=()=>{status.textContent="Verification unavailable. Try again.";};
  document.head.append(script);
 });
})();
