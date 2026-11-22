/* Shared behavior for independently addressable HTML pages. */
(() => {
  'use strict';
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => [...document.querySelectorAll(q)];
  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);
  const locales = ['en','zh','ja'];
  let language=locales.includes(params.get('lang'))?params.get('lang'):'en';
  if(!params.has('lang'))try{const saved=localStorage.getItem('wanzhou-language:'+new URL('.',location.href).pathname);if(locales.includes(saved))language=saved;}catch{}
  const flavorIds=['mala','pickled-pepper','black-bean','garlic'];
  const stepIds=['preparation','grilling','seasoning','serving'];
  const positions=['0% 0%','100% 0%','0% 100%','100% 100%'];
  const topicIds=['fish','preparation','peppercorn','location','mild'];
  const copy=()=>({...window.CONTENT[language],...window.PAGE_CONTENT[language],...window.AI_CONTENT[language]});
  const escape=(text)=>String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const setText=(q,text)=>{if($(q))$(q).textContent=text;};
  const textWithBreaks=(node,text)=>{node.replaceChildren();String(text).split(/<br\s*\/?>|\n/).forEach((line,i)=>{if(i)node.append(document.createElement('br'));node.append(document.createTextNode(line));});};
  const heatHTML=(level)=>`<span class="heat-meter" role="img" aria-label="${escape(copy().heatLabel)}: ${level}/3">${[0,1,2].map(n=>`<span class="${n<level?'on':''}"></span>`).join('')}</span>`;
  const flavorLink=(i)=>`flavor.html?type=${flavorIds[i]}`;
  const stepLink=(i)=>`craft.html?step=${stepIds[i]}`;
  function flavorCard(i){
    const c=copy(),item=c.flavors[i];
    return `<a class="flavor-card" href="${flavorLink(i)}"><div class="flavor-image ingredient-photo" style="background-position:${positions[i]}"><span lang="zh">${escape(item.zh)}</span></div><h3>${escape(item.name)}</h3><p>${escape(item.teaser)}</p><div class="flavor-card-bottom"><span class="flavor-action">${escape(c.flavorAction)}</span>${heatHTML(item.heat)}</div></a>`;
  }
  function localizeLinks(){
    $$('a[href]').forEach(link=>{const raw=link.getAttribute('href');if(!raw||raw.startsWith('#'))return;const url=new URL(raw,location.href);if(url.origin!==location.origin||!url.pathname.endsWith('.html'))return;url.searchParams.set('lang',language);link.setAttribute('href',url.pathname.split('/').pop()+url.search+url.hash);});
  }
  function activateNavigation(){
    const section=page==='flavor'?'flavors':page;
    $$('[data-nav]').forEach(link=>{const active=link.dataset.nav===section;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  }
  function renderCraft(){
    const root=$('#craft-view');if(!root)return;const c=copy(),selected=params.get('step');
    if(!selected){
      root.innerHTML=`<div class="chapter-directory">${c.craft.map((item,i)=>`<a class="chapter-card" href="${stepLink(i)}"><div class="chapter-card-photo ${i===1||i===3?'fish-photo':'ingredient-photo'}" style="background-position:${i===0?'100% 100%':i===2?'0% 0%':'center'}"><span lang="zh">${escape(item.zh)}</span></div><div class="chapter-card-copy"><span class="eyebrow">${escape(item.name)}</span><h2>${escape(item.title)}</h2><p>${escape(item.body)}</p><span class="chapter-read">${escape(c.craftReadStep)}</span></div></a>`).join('')}</div><p class="editorial-note">${escape(c.craftNote)}</p>`;return;
    }
    const i=stepIds.indexOf(selected);if(i<0){renderMissing(root,'craft.html',c.craftOverview);return;}
    const item=c.craft[i],note=c.craftNotes[i];setText('#page-title',item.title);setText('#page-description',c.craftDetailLabel);setText('#breadcrumb-current',item.name);document.title=`${item.name} · The Taste of Wanzhou`;
    root.innerHTML=`<div class="chapter-detail"><aside class="chapter-sidebar"><p class="eyebrow">${escape(c.chapterLabel)}</p><nav aria-label="Cooking chapters">${c.craft.map((chapter,n)=>`<a href="${stepLink(n)}" ${n===i?'aria-current="page"':''}><span>${escape(chapter.name)}</span><small lang="zh">${escape(chapter.zh)}</small></a>`).join('')}</nav><a class="chapter-overview" href="craft.html">${escape(c.craftOverview)}</a></aside><article class="chapter-article"><div class="chapter-detail-photo ${i===1||i===3?'fish-photo':'ingredient-photo'}" style="background-position:${i===0?'100% 100%':i===2?'0% 0%':'center'}"><span lang="zh">${escape(item.zh)}</span></div><p class="article-lead">${escape(item.body)}</p><div class="article-note"><p class="eyebrow">${escape(c.craftDetailLabel)}</p><h2>${escape(note.title)}</h2><p>${escape(note.body)}</p></div><p>${escape(item.cultural)}</p><p class="editorial-note">${escape(c.craftNote)}</p><nav class="chapter-pager" aria-label="Chapter navigation">${i>0?`<a href="${stepLink(i-1)}"><small>${escape(c.craftPrevious)}</small><strong>${escape(c.craft[i-1].name)}</strong></a>`:'<span></span>'}${i<3?`<a href="${stepLink(i+1)}"><small>${escape(c.craftNext)}</small><strong>${escape(c.craft[i+1].name)}</strong></a>`:`<a href="flavors.html"><small>${escape(c.continueExploring)}</small><strong>${escape(c.allFlavors)}</strong></a>`}</nav></article></div>`;
  }
  function renderFlavors(){
    const root=$('#flavor-grid');if(!root)return;const c=copy(),selected=['gentle','bold'].includes(params.get('heat'))?params.get('heat'):'all';
    $('#flavor-filters').innerHTML=[['all',c.filterAll],['gentle',c.filterGentle],['bold',c.filterBold]].map(([value,label])=>`<a href="flavors.html${value==='all'?'':`?heat=${value}`}" ${value===selected?'aria-current="page"':''}>${escape(label)}</a>`).join('');
    const matching=c.flavors.map((_,i)=>i).filter(i=>selected==='all'||(selected==='gentle'?c.flavors[i].heat<=1:c.flavors[i].heat>=2));root.innerHTML=matching.map(flavorCard).join('');setText('#filter-result',c.filterResult.replace('{count}',matching.length));
  }
  function renderFlavor(){
    const root=$('#flavor-view');if(!root)return;const c=copy(),i=flavorIds.indexOf(params.get('type'));if(i<0){renderMissing(root,'flavors.html',c.allFlavors);return;}
    const item=c.flavors[i],story=c.flavorStories[i];setText('#breadcrumb-current',item.name);document.title=`${item.name} · The Taste of Wanzhou`;
    root.innerHTML=`<section class="flavor-detail-top container"><div class="flavor-portrait ingredient-photo" style="background-position:${positions[i]}"><span lang="zh">${escape(item.zh)}</span></div><div class="flavor-detail-heading"><p class="eyebrow">THE FLAVORS / ${escape(item.zh)}</p><h1 class="display-title">${escape(item.name)}</h1><p class="flavor-detail-teaser">${escape(item.teaser)}</p><div class="flavor-heat-label">${heatHTML(item.heat)}<span>${escape(c.heatLabel)}</span></div><dl class="flavor-facts"><dt>${escape(c.flavorIngredients)}</dt><dd>${escape(item.ingredients)}</dd><dt>${escape(c.flavorProfile)}</dt><dd>${escape(item.profile)}</dd><dt>${escape(c.flavorFor)}</dt><dd>${escape(item.preference)}</dd></dl><a class="text-link" href="flavors.html">${escape(c.flavorBack)}</a></div></section><section class="flavor-editorial container"><article><p class="eyebrow">${escape(c.flavorStoryLabel)}</p><h2 class="display-title">${escape(story.title)}</h2><p>${escape(story.body)}</p></article><aside class="pairing-note"><p class="eyebrow">${escape(c.flavorPairingLabel)}</p><p>${escape(c.flavorPairingBody)}</p><a class="text-link" href="explore.html?flavor=${flavorIds[i]}">${escape(c.flavorAsk)}</a></aside></section><section class="related-flavors container"><div class="section-heading"><h2 class="display-title">${escape(c.flavorRelatedTitle)}</h2><a class="text-link" href="flavors.html">${escape(c.allFlavors)}</a></div><div class="related-grid">${c.flavors.map((_,n)=>n).filter(n=>n!==i).map(flavorCard).join('')}</div></section>`;
  }
  function renderCity(){if($('#city-stories'))$('#city-stories').innerHTML=copy().cityStories.map(item=>`<article><span class="editorial-rule"></span><h3>${escape(item.title)}</h3><p>${escape(item.body)}</p></article>`).join('');}
  function renderMissing(root,href,label){root.innerHTML=`<div class="empty-state container"><p>${escape(copy().pageNotFound)}</p><a class="button button-red" href="${href}">${escape(label)}</a></div>`;document.title=`${copy().pageNotFound} · The Taste of Wanzhou`;}
  function setupReveals(){if(!('IntersectionObserver'in window))return;if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('js-motion');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.08});$$('.reveal').forEach(node=>observer.observe(node));}
  function setLanguage(lang){
    if(!locales.includes(lang))return;language=lang;document.documentElement.lang=lang;try{localStorage.setItem('wanzhou-language:'+new URL('.',location.href).pathname,lang);}catch{}
    try{const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url);}catch{}
    const c=copy();$$('[data-i18n]').forEach(node=>{const value=c[node.dataset.i18n];if(typeof value==='string')textWithBreaks(node,value);});$$('[data-lang]').forEach(button=>{button.classList.toggle('active',button.dataset.lang===lang);button.setAttribute('aria-pressed',String(button.dataset.lang===lang));});
    $('.menu-toggle').setAttribute('aria-label',$('.menu-toggle').getAttribute('aria-expanded')==='true'?({'en':'Close navigation','zh':'关闭导航','ja':'ナビゲーションを閉じる'}[lang]):c.menuLabel);
    const titles={home:'江城有味',craft:c.navCraft,flavors:c.navFlavors,wanzhou:c.navCity,explore:c.navExplore,credits:c.creditsTitle};
    if(titles[page])document.title=`${titles[page]} · The Taste of Wanzhou`;
    renderCraft();renderFlavors();renderFlavor();renderCity();window.WanziChat?.setLanguage(lang);activateNavigation();localizeLinks();
  }
  $$('[data-lang]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));
  const toggle=$('.menu-toggle');
  function toggleMenu(open){toggle.setAttribute('aria-expanded',String(open));$('#main-nav').classList.toggle('open',open);toggle.setAttribute('aria-label',open?({'en':'Close navigation','zh':'关闭导航','ja':'ナビゲーションを閉じる'}[language]):copy().menuLabel);}
  toggle.addEventListener('click',()=>toggleMenu(toggle.getAttribute('aria-expanded')!=='true'));
  $$('.main-nav a').forEach(link=>link.addEventListener('click',()=>toggleMenu(false)));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')toggleMenu(false);});
  setLanguage(language);
  window.WanziChat?.start(params);
  setupReveals();
})();
