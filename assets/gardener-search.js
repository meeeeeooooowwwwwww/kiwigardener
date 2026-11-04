// Static, accessible browser-side search. No GRID EATER requests from visitors.
(()=>{
  const root=document.getElementById("gardener-results");
  if(!root)return;
  const cards=[...root.querySelectorAll("[data-gardener-card]")];
  const q=document.getElementById("gardener-query");
  const service=document.getElementById("gardener-service");
  const area=document.getElementById("gardener-area");
  const clear=document.getElementById("gardener-clear");
  const count=document.getElementById("gardener-count");
  const empty=document.getElementById("gardener-empty");
  if(!q||!service||!area||!clear||!count)return;
  const normalize=value=>String(value||"").toLocaleLowerCase("en-NZ")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g,"").trim();
  const parts=value=>normalize(value).split(/\s+/).filter(Boolean);
  const hasPart=(list,value)=>!value||list.split("|").some(item=>normalize(item)===normalize(value));
  const fromLocation=()=>{
    const params=new URLSearchParams(window.location.search);
    q.value=(params.get("q")||"").slice(0,100);
    service.value=params.get("service")||"";
    area.value=params.get("area")||"";
    if(!service.selectedOptions.length||service.selectedIndex<0)service.value="";
    if(!area.selectedOptions.length||area.selectedIndex<0)area.value="";
  };
  const updateUrl=()=>{
    const params=new URLSearchParams();
    if(q.value.trim())params.set("q",q.value.trim().slice(0,100));
    if(service.value)params.set("service",service.value);
    if(area.value)params.set("area",area.value);
    const path=window.location.pathname+(params.size?"?"+params.toString():"");
    window.history.replaceState(null,"",path);
  };
  const update=(persist=false)=>{
    const terms=parts(q.value);
    let visible=0;
    for(const card of cards){
      const searchable=normalize(card.dataset.search);
      const match=terms.every(term=>searchable.includes(term)) &&
        hasPart(card.dataset.services||"",service.value) &&
        hasPart(card.dataset.areas||"",area.value);
      card.hidden=!match;
      if(match)visible+=1;
    }
    count.textContent=cards.length===0?"No verified independent listings yet":
      visible+" verified "+(visible===1?"gardener":"gardeners")+" found";
    if(empty)empty.hidden=visible!==0;
    if(persist)updateUrl();
  };
  fromLocation();
  update();
  q.addEventListener("input",()=>update(true));
  service.addEventListener("change",()=>update(true));
  area.addEventListener("change",()=>update(true));
  clear.addEventListener("click",()=>{
    q.value="";service.value="";area.value="";
    update(true);q.focus();
  });
  window.addEventListener("popstate",()=>{fromLocation();update();});
})();
