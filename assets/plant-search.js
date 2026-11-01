// Accessible progressive enhancement: all 271 plant links remain readable without JavaScript.
(function(){
  "use strict";
  const cards=[...document.querySelectorAll(".plant-card")];
  const ids=["query","form","use","flower","foliage","light","season","native"];
  const controls=Object.fromEntries(ids.map(k=>[k,document.getElementById("plant-"+k)]));
  const count=document.getElementById("plant-count");
  const empty=document.getElementById("plant-empty");
  const reset=document.getElementById("plant-reset");
  const more=document.getElementById("plant-more");
  if(!cards.length||!count||!reset||!more||ids.some(k=>!controls[k]))return;

  // Common visitor phrases work without adding inaccurate growing-condition claims.
  const aliases={
    flowers:"flower",flowering:"flower",blooms:"flower",shrubs:"shrub",
    trees:"tree",hedges:"hedging",hedge:"hedging",natives:"native",
    groundcovers:"groundcover",perennials:"perennial",climbers:"climber",
    grasses:"grass",colours:"colour",colors:"colour"
  };
  const fillers=new Set(["plant","plants","garden","gardens","for","and","in","with","the","a","of","christchurch","canterbury","colour","color","foliage"]);
  const lower=s=>String(s||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"");
  const pageSize=24;
  let matching=[];
  let shown=pageSize;

  function matches(card,k,value){
    if(!value)return true;
    const stored=card.getAttribute("data-plant-"+k)||"";
    return stored.split("|").some(part=>lower(part)===lower(value));
  }
  function paint(){
    matching.forEach((card,index)=>{card.hidden=index>=shown;});
    const displayed=Math.min(shown,matching.length);
    count.textContent=matching.length===cards.length&&displayed===cards.length
      ?"Showing all "+cards.length+" plants"
      :"Showing "+displayed+" of "+matching.length+" matching plants";
    empty.hidden=matching.length!==0;
    more.hidden=displayed>=matching.length;
    const remaining=matching.length-displayed;
    more.textContent="Show "+Math.min(pageSize,remaining)+" more plants ("+remaining+" remaining)";
  }
  function apply(updateUrl){
    const words=lower(controls.query.value.trim()).split(/\s+/).filter(Boolean)
      .map(w=>aliases[w]||w).filter(w=>!fillers.has(w));
    matching=cards.filter(card=>{
      const searchable=lower(card.dataset.plantSearch);
      const flower=card.dataset.plantFlower||"";
      return words.every(w=>w==="flower"?flower.length>0:searchable.includes(w))&&
        ["form","use","flower","foliage","light","season","native"]
          .every(k=>matches(card,k,controls[k].value));
    });
    shown=pageSize;
    const found=new Set(matching);
    cards.forEach(card=>{if(!found.has(card))card.hidden=true;});
    paint();
    if(updateUrl&&window.history?.replaceState){
      const url=new URL(location.href);
      ids.forEach(k=>{
        const value=controls[k].value.trim();
        if(value)url.searchParams.set(k,value);
        else url.searchParams.delete(k);
      });
      window.history.replaceState({},"",url.pathname+url.search+url.hash);
    }
  }
  const params=new URLSearchParams(location.search);
  ids.forEach(k=>{
    const control=controls[k],value=params.get(k);
    if(value!==null){
      if(k==="query")control.value=value.slice(0,120);
      else if([...control.options].some(option=>option.value===value))control.value=value;
    }
    control.addEventListener(k==="query"?"input":"change",()=>apply(true));
  });
  more.addEventListener("click",()=>{shown+=pageSize;paint();});
  reset.addEventListener("click",()=>{
    ids.forEach(k=>controls[k].value="");
    apply(true);
    controls.query.focus();
  });
  apply(false);
})();
