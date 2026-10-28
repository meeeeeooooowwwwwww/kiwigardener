// Progressive enhancement: leave the direct-email fallback visible until server config is ready.
(async()=>{
  const mount=document.getElementById("enquiry-form");
  if(!mount)return;
  const form=mount.querySelector("form");
  const fallback=document.getElementById("email-fallback");
  const feedback=document.getElementById("form-feedback");
  const button=form.querySelector("button[type=submit]");
  let widgetId;
  try{
    const response=await fetch("/api/contact/config",{cache:"no-store",credentials:"omit"});
    if(!response.ok) return;
    const config=await response.json();
    if(!config.enabled || !/^[a-zA-Z0-9_-]+$/.test(config.siteKey||"")) return;
    const widget=mount.querySelector(".cf-turnstile");
    const script=document.createElement("script");
    script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async=true;
    script.onload=()=>{
      if(!window.turnstile) return;
      widgetId=window.turnstile.render(widget,{sitekey:config.siteKey,theme:"auto"});
      mount.hidden=false;
      fallback.hidden=true;
    };
    script.onerror=()=>{mount.hidden=true;fallback.hidden=false;};
    document.head.append(script);
  }catch{return;}
  form.addEventListener("submit",async(event)=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const token=window.turnstile?.getResponse(widgetId);
    if(!token){feedback.textContent="Please complete the anti-spam verification.";feedback.focus();return;}
    const data=Object.fromEntries(new FormData(form));
    const payload={
      name:data.name,email:data.email,suburb:data.suburb,service:data.service,
      message:data.message,company:data.company||"",consent:data.consent==="yes",token
    };
    button.disabled=true;feedback.textContent="Sending your enquiry…";feedback.focus();
    try{
      const res=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),cache:"no-store",credentials:"omit"});
      const result=await res.json();
      if(!res.ok || !result.ok)throw Error(result.error||"We couldn't send your enquiry.");
      feedback.textContent="Thank you. Your enquiry was submitted successfully.";
      form.reset();
    }catch(err){
      feedback.textContent=(err.message||"Could not send enquiry.")+" You can email dallas@kiwigardeners.com directly.";
    }finally{
      window.turnstile?.reset(widgetId);
      button.disabled=false;
    }
  });
})();