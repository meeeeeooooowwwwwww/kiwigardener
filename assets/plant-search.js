// Lightweight, dependency-free browser search. All result cards exist as HTML for accessibility and crawling.
(function(){
  "use strict";
  const cards=[...document.querySelectorAll(".plant-card")];
  const ids=["query","form","use","flower","foliage","light","season","native"];
  const controls=Object.fromEntries(ids.map(k=>[k,document.getElementById("plant-"+k)]));
  const count=document.getElementById("plant-count");
  const empty=document.getElementById("plant-empty");
  const reset=document.getElementById("plant-reset");
  if(!cards.length||!count||!reset||ids.some(k=>!controls[k]))return;
  const qmap={flowers:"flower",flowering:"flower",shrubs:"shrub",trees:"tree",hedges:"hedging",hedge:"hedging",natives:"native",groundcovers:"groundcover",groundcover:"groundcover",ground:"ground",colour:"colour",colors:"colour",colours:"colour"};
  const lower=s=>String(s||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"");
  function matches(card,k,value){
    if(!value)return true;
    const stored=card.getAttribute("data-plant-"+k)||"";
    return stored.split("|").some(part=>lower(part)===lower(value));
  }
  function apply(updateUrl){
    const raw=lower(controls.query.value.trim());
    const words=raw.split(/\s+/).filter(Boolean).map(w=>qmap[w]||w);
    let found=0;
    cards.forEach(card=>{
      const searchable=lower(card.dataset.plantSearch);
      const flower=card.dataset.plantFlower||"";
      const visible=words.every(w=>(w==="flower"?flower.length>0:searchable.includes(w)))&&
        ["form","use","flower","foliage","light","season","native"].every(k=>matches(card,k,controls[k].value));
      card.hidden=!visible;
      if(visible)found++;
    });
    count.textContent="Showing "+found+" of "+cards.length+" plants";
    empty.hidden=found!==0;
    if(updateUrl&&window.history?.replaceState){
      const url=new URL(location.href);
      ids.forEach(k=>{const v=controls[k].value.trim();if(v)url.searchParams.set(k,v);else url.searchParams.delete(k);});
      window.history.replaceState({}, "",url.pathname+url.search+url.hash);
    }
  }
  const params=new URLSearchParams(location.search);
  ids.forEach(k=>{
    const c=controls[k],v=params.get(k);
    if(v!==null){
      if(k==="query")c.value=v;
      else if([...c.options].some(o=>o.value===v))c.value=v;
    }
    c.addEventListener(k==="query"?"input":"change",()=>apply(true));
  });
  reset.addEventListener("click",()=>{
    ids.forEach(k=>controls[k].value="");
    apply(true);
    controls.query.focus();
  });
  apply(false);
})();
