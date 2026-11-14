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
    .replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/\s+/g," ").trim();
  const words=value=>String(value||"").split("|").map(normal).filter(Boolean);
  const pairs=code=>String(code||"").match(/.{2}/g)||[];
  const MAX_OPTIONS=10;
  const PAGE_SIZE=15;
  const pager=document.getElementById("gardener-pagination");
  let currentPage=1;
  let dictionary=null;
  let selectedKeyword=null;
  let selectedTown=null;
  const regionNames=new Map();

  // Normalize once, never repeatedly scan the town catalogue per card.
  const cardFacts=new Map(cards.map(card=>[card,{
    keywords:words(card.dataset.keywords),
    areas:new Set(words(card.dataset.areas)),
    locations:new Set(words(card.dataset.locations))
  }]));
  let keywordIndex=[],placeIndex=[];
  const collator=new Intl.Collator("en-NZ");
  const rank=(items,needle)=>{
    if(!needle)return [];
    const prefix=[],other=[];
    for(const item of items){
      if(!item.terms.some(v=>v.includes(needle)))continue;
      const list=item.name.startsWith(needle)?prefix:other;
      if(list.length<MAX_OPTIONS)list.push(item.value);
      if(prefix.length===MAX_OPTIONS)break;
    }
    return prefix.concat(other).slice(0,MAX_OPTIONS);
  };
  const keywordsFor=text=>rank(keywordIndex,normal(text));
  const placesFor=text=>rank(placeIndex,normal(text));
  const candidateTerms=()=>{
    const keyword=normal(query.value),town=normal(area.value);
    const keywords=keyword?(selectedKeyword&&normal(selectedKeyword.label)===keyword
      ?keywordIndex.filter(x=>x.value===selectedKeyword)
      :keywordIndex.filter(x=>x.terms.some(v=>v.includes(keyword)))):[];
    const places=town?(selectedTown&&normal(selectedTown[0])===town
      ?placeIndex.filter(x=>x.value===selectedTown)
      :placeIndex.filter(x=>x.name.includes(town))):[];
    const synonyms=[...new Set(keywords.flatMap(x=>x.terms))];
    const towns=new Set(),regions=new Set();
    for(const place of places){
      towns.add(place.name);
      for(const code of pairs(place.value[1])){
        const region=regionNames.get(code);
        if(!region||code==="99")continue;
        regions.add(region);
        regions.add(region.replace(/ region$/,""));
      }
    }
    return {keyword,town,synonyms,towns,regions};
  };
  const matchesKeywords=(facts,terms)=>!terms.keyword||facts.keywords.some(fact=>
    terms.synonyms.some(v=>fact===v||(v.length>=5&&fact.includes(v))||
      (fact.length>=5&&v.includes(fact))));
  const matchesArea=(facts,terms)=>{
    if(!terms.town)return true;
    // Supplier premises never expand into inferred service areas.
    for(const name of facts.locations)if(terms.towns.has(name))return true;
    for(const name of facts.areas)if(terms.towns.has(name)||terms.regions.has(name))return true;
    return false;
  };
  const updateUrl=(push=false)=>{
    const p=new URLSearchParams();
    if(query.value.trim())p.set("q",query.value.trim().slice(0,100));
    if(area.value.trim())p.set("area",area.value.trim().slice(0,100));
    if(currentPage>1)p.set("page",String(currentPage));
    const next=window.location.pathname+(p.size?"?"+p:"");
    if(next!==window.location.pathname+window.location.search)window.history[push?"pushState":"replaceState"](null,"",next);
  };
  const restore=()=>{
    const p=new URLSearchParams(window.location.search);
    query.value=(p.get("q")||"").slice(0,100);
    area.value=(p.get("area")||"").slice(0,100);
    selectedKeyword=null;selectedTown=null;
    const requested=Number(p.get("page")||1);
    currentPage=Number.isSafeInteger(requested)&&requested>0?requested:1;
  };
  let lastPager="";
  const renderPager=total=>{
    if(!pager)return;
    const key=total+":"+currentPage;
    if(key===lastPager)return;
    lastPager=key;
    pager.replaceChildren();
    pager.hidden=total<=1;
    if(total<=1)return;
    const add=(label,page,disabled=false,active=false)=>{
      const button=document.createElement("button");
      button.type="button";button.textContent=label;button.disabled=disabled;
      button.setAttribute("aria-label",typeof label==="number"?"Page "+label:label+" page");
      if(active)button.setAttribute("aria-current","page");
      button.addEventListener("click",()=>{
        if(page===currentPage)return;
        currentPage=page;update();updateUrl(true);
        count.focus({preventScroll:true});
        count.scrollIntoView({block:"start",behavior:"instant"});
      });
      pager.append(button);
    };
    add("Previous",currentPage-1,currentPage===1);
    const start=Math.max(1,Math.min(currentPage-2,total-4));
    const end=Math.min(total,start+4);
    if(start>1){add(1,1);if(start>2){const gap=document.createElement("span");gap.textContent="…";gap.setAttribute("aria-hidden","true");pager.append(gap);}}
    for(let p=start;p<=end;p++)add(p,p,false,p===currentPage);
    if(end<total){if(end<total-1){const gap=document.createElement("span");gap.textContent="…";gap.setAttribute("aria-hidden","true");pager.append(gap);}add(total,total);}
    add("Next",currentPage+1,currentPage===total);
  };
  const update=(persist=false)=>{
    const searching=!!(query.value.trim()||area.value.trim());
    let reviewed=0,provisional=0;
    const matches=[];
    const terms=searching&&dictionary?candidateTerms():null;
    for(const card of cards){
      const facts=cardFacts.get(card);
      const match=!searching||(terms&&matchesKeywords(facts,terms)&&matchesArea(facts,terms));
      if(match){
        matches.push(card);
        if(card.dataset.sourceGrade==="provisional")provisional++;
        else if(card.dataset.sourceGrade==="reviewed")reviewed++;
      }
    }
    const visible=matches.length;
    const loading=searching&&!dictionary;
    const total=Math.ceil(visible/PAGE_SIZE);
    // Do not discard a restored filtered page while its index is loading.
    if(!loading)currentPage=Math.max(1,Math.min(currentPage,total||1));
    const offset=(currentPage-1)*PAGE_SIZE;
    const shown=new Set(matches.slice(offset,offset+PAGE_SIZE));
    for(const card of cards){const hide=!shown.has(card);if(card.hidden!==hide)card.hidden=hide;}
    if(loading){
      if(count.textContent!=="Loading search filters…")count.textContent="Loading search filters…";
    }else{
      const message=cards.length===0?"No independent listings yet":
        visible+" listed "+(visible===1?"business":"businesses")+" · "+
        reviewed+" source-reviewed · "+provisional+" provisional NZBN"+
        (visible?" · Showing "+(offset+1)+"–"+Math.min(offset+PAGE_SIZE,visible)+" of "+visible:"");
      if(count.textContent!==message)count.textContent=message;
    }
    if(empty){const hide=visible!==0||loading;if(empty.hidden!==hide)empty.hidden=hide;}
    renderPager(loading?0:total);
    if(persist)updateUrl();
  };

  const controls=[
    {input:query,list:keywordList,kind:"keyword",options:keywordsFor,
      title:x=>x.label,extra:x=>x.kind==="supplier"?"Supplies":"Service"},
    {input:area,list:areaList,kind:"town",options:placesFor,
      title:x=>x[0],extra:x=>x[2]==="rural"?"Town / settlement":"Town / city"}
  ];
  const close=control=>{
    if(!control.list.hidden)control.list.hidden=true;
    if(control.list.childElementCount)control.list.replaceChildren();
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
    currentPage=1;
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
    const fragment=document.createDocumentFragment();
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
      fragment.append(li);
    });
    control.list.append(fragment);
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
      currentPage=1;render(c);update(true);
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
    c.input.addEventListener("blur",()=>{
      // The user may immediately focus the same combobox again (for example
      // after Clear). An older blur timer must not erase the NEW suggestions.
      setTimeout(()=>{
        if(document.activeElement!==c.input)close(c);
      },120);
    });
  });
  document.addEventListener("click",e=>{
    for(const c of controls)if(!c.input.parentElement.contains(e.target))close(c);
  });
  clear.addEventListener("click",()=>{
    query.value="";area.value="";
    selectedKeyword=null;selectedTown=null;
    controls.forEach(close);
    currentPage=1;update(true);query.focus();
  });
  window.addEventListener("popstate",()=>{
    restore();controls.forEach(close);update();
  });
  function initialise(value){
    if(value.version!==1||value.places?.length!==597||
       !Array.isArray(value.keywords)||value.keywords.length<20||
       !Array.isArray(value.regions)||value.regions.length!==17)
      throw Error("unexpected search index");
    keywordIndex=value.keywords.map(item=>({value:item,name:normal(item.label),
      terms:[item.label,...item.aliases].map(normal)})).sort((a,b)=>collator.compare(a.value.label,b.value.label));
    placeIndex=value.places.map(item=>({value:item,name:normal(item[0]),terms:[normal(item[0])]}))
      .sort((a,b)=>collator.compare(a.value[0],b.value[0]));
    for(const [code,label] of value.regions)regionNames.set(code,normal(label));
    dictionary=value;
    if(help)help.textContent="Type a gardening keyword or NZ town to filter approved listings. Search does not use company names.";
    update(true);
    controls.forEach(c=>{if(c.input===document.activeElement)render(c);});
  }
  const unavailable=()=>{
    if(help)help.textContent="The town and keyword suggestions are temporarily unavailable. Please try again.";
    if(query.value.trim()||area.value.trim())count.textContent="Search filters unavailable";
  };
  restore();
  // The small build-time vocabulary ships with the directory HTML: typing
  // never waits for a separate network request. Legacy/fixture fallback only.
  const inline=document.getElementById("gardener-search-index");
  if(inline){
    try{initialise(JSON.parse(inline.textContent));}
    catch{update();unavailable();}
  }else{
    update();
    fetch("/assets/garden-directory-filter-data.json",{cache:"force-cache",credentials:"omit",redirect:"error"})
      .then(r=>{if(!r.ok)throw Error("search index unavailable");return r.json();})
      .then(initialise).catch(unavailable);
  }
})();
