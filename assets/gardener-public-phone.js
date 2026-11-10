// Kiwi-only public business phone presentation. No GRID EATER public feed or
// raw email contacts are used by this script.
(async()=>{
 const targets=[...document.querySelectorAll("[data-kiwi-public-phone]")];
 if(!targets.length)return;
 let data;
 try{
  const response=await fetch("/api/gardeners/phones",{
   method:"GET",cache:"default",credentials:"omit",
   headers:{accept:"application/json"}
  });
  if(!response.ok)return;
  data=await response.json();
 }catch{return;}
 const phones=data?.phones;
 if(!phones||typeof phones!=="object"||Array.isArray(phones))return;
 for(const element of targets){
  const id=element.getAttribute("data-kiwi-public-phone");
  if(!/^afnz-\d{13}$/.test(id||""))continue;
  const entry=phones[id];
  if(!entry||typeof entry.display!=="string"||
     typeof entry.telHref!=="string"||
     !/^tel:\+64\d{7,10}$/.test(entry.telHref))continue;
  const label=document.createElement("strong");
  label.textContent="Phone: ";
  const link=document.createElement("a");
  link.href=entry.telHref;link.textContent=entry.display;
  element.replaceChildren(label,link);
  element.hidden=false;
 }
})();
