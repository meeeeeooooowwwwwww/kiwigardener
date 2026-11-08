// JSON-backed, static Kiwi Gardeners search. One same-origin static lookup GET.
// No visitor-time GRID EATER/D1 requests or raw phone/email values.
(()=>{
  const root=document.getElementById("gardener-results");
  if(!root)return;
  const cards=[...root.querySelectorAll("[data-gardener-card]")];
  const query=document.getElementById("gardener-query");
  const area=document.getElementById("gardener-area");
  const clear=document.getElementById("gardener-clear");
  const count=document.getElementById("gardener-count");
  const empty=document.getElementById("gardener-empty");
  const keywordList=document.getElementById("gardener-keyword-options");
  const areaList=document.getElementById("gardener-area-options");
  const help=document.getElementById("gardener-filter-help");
  if(!query||!area||!clear||!count||!keywordList||!areaList)return;

  const normal=value=>String(value||"").normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("en-NZ")
    .replace(/\s+/g," ").trim();
  const words=value=>String(value||"").split("|").map(normal).filter(Boolean);
  const pairs=code=>String(code||"").match(/.{2}/g)||[];
  const MAX_OPTIONS=10;
  let dictionary=null;
  let selectedKeyword=null;
  let selectedTown=null;
  const regionNames=new Map();

  const keywordsFor=text=>{
    const needle=normal(text);
    if(!dictionary||!needle)return [];
    return dictionary.keywords
      .filter(x=>[x.label,...x.aliases].some(v=>normal(v).includes(needle)))
      .sort((a,b)=>(normal(a.label).startsWith(needle)?0:1)-
        (normal(b.label).startsWith(needle)?0:1)||a.label.localeCompare(b.label,"en-NZ"))
      .slice(0,MAX_OPTIONS);
  };
  const placesFor=text=>{
    const needle=normal(text);
    if(!dictionary||!needle)return [];
    return dictionary.places
      .filter(x=>normal(x[0]).includes(needle))
      .sort((a,b)=>(normal(a[0]).startsWith(needle)?0:1)-
        (normal(b[0]).startsWith(needle)?0:1)||a[0].localeCompare(b[0],"en-NZ"))
      .slice(0,MAX_OPTIONS);
  };
  const placeCandidates=()=>{
    if(!area.value.trim())return [];
    if(selectedTown&&normal(selectedTown[0])===normal(area.value))return [selectedTown];
    const term=normal(area.value);
    return dictionary?dictionary.places.filter(x=>normal(x[0]).includes(term)):[];
  };
  const keywordCandidates=()=>{
    if(!query.value.trim())return [];
    if(selectedKeyword&&normal(selectedKeyword.label)===normal(query.value))return [selectedKeyword];
    const term=normal(query.value);
    return dictionary?dictionary.keywords.filter(x=>
      [x.label,...x.aliases].some(v=>normal(v).includes(term))):[];
  };
  const matchesKeywords=card=>{
    if(!query.value.trim())return true;
    const candidates=keywordCandidates();
    if(!candidates.length)return false;
    const facts=words(card.dataset.keywords);
    return candidates.some(x=>{
      const synonyms=[x.label,...x.aliases].map(normal);
      return facts.some(fact=>synonyms.some(v=>
        fact===v||(v.length>=5&&fact.includes(v))||
        (fact.length>=5&&v.includes(fact))));
    });
  };
  const matchesPlace=(card,place)=>{
    const verified=new Set(words(card.dataset.areas));
    if(verified.has(normal(place[0])))return true;
    // A region-level claim from the APPROVED service-area feed covers each
    // Stats NZ town in that region for search only. Registered address is
    // NEVER read or treated as evidence of a coverage relationship.
    return pairs(place[1]).some(code=>{
      const region=regionNames.get(code);
      if(!region||code==="99")return false;
      return verified.has(normal(region))||
        verified.has(normal(region.replace(/ Region$/,"")));
    });
  };
  const matchesArea=card=>{
    if(!area.value.trim())return true;
    return placeCandidates().some(place=>matchesPlace(card,place));
  };
  const updateUrl=()=>{
    const p=new URLSearchParams();
    if(query.value.trim())p.set("q",query.value.trim().slice(0,100));
    if(area.value.trim())p.set("area",area.value.trim().slice(0,100));
    window.history.replaceState(null,"",window.location.pathname+(p.size?"?"+p:""));
  };
  const restore=()=>{
    const p=new URLSearchParams(window.location.search);
    query.value=(p.get("q")||"").slice(0,100);
    area.value=(p.get("area")||"").slice(0,100);
    selectedKeyword=null;selectedTown=null;
  };
  const update=(persist=false)=>{
    const searching=!!(query.value.trim()||area.value.trim());
    let visible=0;
    for(const card of cards){
      const match=!searching||(dictionary&&matchesKeywords(card)&&matchesArea(card));
      card.hidden=!match;
      if(match)visible++;
    }
    if(searching&&!dictionary){
      count.textContent="Loading search filters…";
    }else{
      count.textContent=cards.length===0?"No verified independent listings yet":
        visible+" approved "+(visible===1?"business":"businesses")+" found";
    }
    if(empty)empty.hidden=visible!==0||!dictionary&&searching;
    if(persist)updateUrl();
  };

  const controls=[
    {input:query,list:keywordList,kind:"keyword",options:keywordsFor,
      title:x=>x.label,extra:x=>x.kind==="supplier"?"Supplies":"Service"},
    {input:area,list:areaList,kind:"town",options:placesFor,
      title:x=>x[0],extra:x=>x[2]==="rural"?"Town / settlement":"Town / city"}
  ];
  const close=control=>{
    control.list.hidden=true;
    control.input.setAttribute("aria-expanded","false");
    control.input.removeAttribute("aria-activedescendant");
    control.active=-1;
    control.values=[];
  };
  const choose=(control,item)=>{
    if(control.kind==="keyword"){
      selectedKeyword=item;
      query.value=item.label;
    }else{
      selectedTown=item;
      area.value=item[0];
    }
    close(control);
    update(true);
    control.input.focus();
  };
  const render=control=>{
    close(control);
    const text=control.input.value.trim();
    if(!dictionary||!text)return;
    const options=control.options(text);
    if(!options.length)return;
    control.values=options;
    options.forEach((item,i)=>{
      const li=document.createElement("li");
      li.id=control.list.id+"-"+i;
      li.setAttribute("role","option");
      li.setAttribute("aria-selected","false");
      const main=document.createElement("span");
      main.textContent=control.title(item);
      const meta=document.createElement("small");
      meta.textContent=control.extra(item);
      li.append(main,meta);
      li.addEventListener("mousedown",event=>event.preventDefault());
      li.addEventListener("click",()=>choose(control,item));
      control.list.append(li);
    });
    control.list.hidden=false;
    control.input.setAttribute("aria-expanded","true");
  };
  const setActive=(control,next)=>{
    const items=[...control.list.children];
    if(!items.length)return;
    control.active=(next+items.length)%items.length;
    items.forEach((li,i)=>li.setAttribute("aria-selected",i===control.active?"true":"false"));
    const li=items[control.active];
    control.input.setAttribute("aria-activedescendant",li.id);
    li.scrollIntoView({block:"nearest"});
  };

  controls.forEach(c=>{
    c.active=-1;c.values=[];
    c.input.addEventListener("input",()=>{
      if(c.kind==="keyword")selectedKeyword=null;
      else selectedTown=null;
      render(c);update(true);
    });
    c.input.addEventListener("focus",()=>render(c));
    c.input.addEventListener("keydown",e=>{
      if(e.key==="Escape"){close(c);return;}
      if(e.key==="ArrowDown"||e.key==="ArrowUp"){
        if(c.list.hidden)render(c);
        if(c.values.length){e.preventDefault();setActive(c,c.active+(e.key==="ArrowDown"?1:-1));}
      }else if(e.key==="Enter"&&!c.list.hidden&&c.active>=0){
        e.preventDefault();choose(c,c.values[c.active]);
      }
    });
    c.input.addEventListener("blur",()=>setTimeout(()=>close(c),120));
  });
  document.addEventListener("click",e=>{
    for(const c of controls)if(!c.input.parentElement.contains(e.target))close(c);
  });
  clear.addEventListener("click",()=>{
    query.value="";area.value="";
    selectedKeyword=null;selectedTown=null;
    controls.forEach(close);
    update(true);query.focus();
  });
  window.addEventListener("popstate",()=>{
    restore();controls.forEach(close);update();
  });
  restore();update();
  fetch("/assets/garden-directory-filter-data.json",{cache:"force-cache",credentials:"omit",redirect:"error"})
    .then(async response=>{
      if(!response.ok)throw Error("search index unavailable");
      const value=await response.json();
      if(value.version!==1||value.places?.length!==597||
        !Array.isArray(value.keywords)||value.keywords.length<20||
        !Array.isArray(value.regions)||value.regions.length!==17)
        throw Error("unexpected search index");
      return value;
    }).then(value=>{
      dictionary=value;
      for(const [code,label] of value.regions)regionNames.set(code,label);
      if(help)help.textContent="Type a gardening keyword or NZ town to filter approved listings. Search does not use company names.";
      update();controls.forEach(c=>{if(c.input===document.activeElement)render(c);});
    }).catch(()=>{
      if(help)help.textContent="The town and keyword suggestions are temporarily unavailable. Please try again.";
      if(query.value.trim()||area.value.trim())count.textContent="Search filters unavailable";
    });
})();
