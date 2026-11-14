// Kiwi-only phone hydration. One shared request, triggered by the first
// near-viewport card/contact section; later pages hydrate only as needed.
// No GRID EATER/D1 calls or raw email contacts.
(()=>{
 const targets=[...document.querySelectorAll("[data-kiwi-public-phone]")];
 if(!targets.length)return;
 let pending;
 const load=()=>pending??=(async()=>{
  try{
   const response=await fetch("/api/gardeners/phones",{
    method:"GET",cache:"default",credentials:"omit",headers:{accept:"application/json"}
   });
   if(!response.ok)return null;
   const phones=(await response.json())?.phones;
   return phones&&typeof phones==="object"&&!Array.isArray(phones)?phones:null;
  }catch{return null;}
 })();
 const hydrate=async element=>{
  const id=element.getAttribute("data-kiwi-public-phone");
  if(!/^afnz-\d{13}$/.test(id||""))return;
  const entry=(await load())?.[id];
  if(!entry||typeof entry.display!=="string"||typeof entry.telHref!=="string"||
     !/^tel:\+64\d{7,10}$/.test(entry.telHref))return;
  const label=document.createElement("strong");
  label.textContent="Phone: ";
  const link=document.createElement("a");
  link.href=entry.telHref;link.textContent=entry.display;
  element.replaceChildren(label,link);
  element.hidden=false;
 };
 if(typeof IntersectionObserver!=="function"){
  // Progressive fallback for older browsers, still only one request.
  targets.forEach(hydrate);return;
 }
 const byContainer=new Map();
 for(const element of targets){
  // The placeholder itself is hidden until it receives a valid telephone.
  const container=element.closest("[data-gardener-card]")||element.parentElement;
  if(!container)continue;
  const group=byContainer.get(container)||[];
  group.push(element);byContainer.set(container,group);
 }
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting||entry.target.hidden)continue;
   observer.unobserve(entry.target);
   for(const element of byContainer.get(entry.target)||[])hydrate(element);
   byContainer.delete(entry.target);
  }
 },{rootMargin:"240px 0px"});
 for(const container of byContainer.keys())observer.observe(container);
})();