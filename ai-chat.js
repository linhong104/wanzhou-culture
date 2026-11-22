/* Wanzi: explicit cloud AI and local cultural-library modes. */
(() => {
  'use strict';
  if(document.body.dataset.page!=='explore')return;
  const $=(selector)=>document.querySelector(selector);
  const topicIds=['fish','preparation','peppercorn','location','mild'];
  const flavorIds=['mala','pickled-pepper','black-bean','garlic'];
  const records=[];
  let language=['en','zh','ja'].includes(document.documentElement.lang)?document.documentElement.lang:'en';
  let configured=false,checking=true,mode='knowledge',busy=false,controller=null,revision=0;
  const copy=()=>({...window.CONTENT[language],...window.PAGE_CONTENT[language],...window.AI_CONTENT[language]});
  const signal=(state)=>window.dispatchEvent(new CustomEvent('wanzi:state',{detail:{state}}));
  const save=()=>{try{sessionStorage.setItem('wanzhou-chat-v3:'+new URL('.',location.href).pathname,JSON.stringify(records.slice(-32)));}catch{}};
  try{
    const saved=JSON.parse(sessionStorage.getItem('wanzhou-chat-v3:'+new URL('.',location.href).pathname)||'[]');
    if(Array.isArray(saved))saved.slice(-32).forEach(record=>{
      if(!record||!['user','assistant'].includes(record.role)||typeof record.content!=='string')return;
      records.push({role:record.role,content:record.content.slice(0,8000),kind:['ai','library','error'].includes(record.kind)?record.kind:'library',
        ...(Number.isInteger(record.questionIndex)&&record.questionIndex>=0&&record.questionIndex<5?{questionIndex:record.questionIndex}:{}),
        ...(Number.isInteger(record.flavor)&&record.flavor>=0&&record.flavor<4?{flavor:record.flavor}:{}),
        ...(typeof record.errorKey==='string'&&/^ai[A-Z][a-zA-Z]+$/.test(record.errorKey)?{errorKey:record.errorKey}:{}),preset:record.preset===true});
    });
  }catch{}
  function findAnswer(question){
    const text=question.normalize('NFKC').toLowerCase();
    const intents=[
      [4,/non.?spicy|less spicy|not spicy|mild|spiciness|不辣|微辣|少辣|不能吃辣|辣不辣|辣吗|辛くない|控えめ|辛さ/],
      [1,/prepar|how.*(?:cook|grill|made)|cooking|cooked|怎么做|如何制作|做法|工艺|制作|作り方|調理/],
      [3,/where|locat|在哪|哪里|地理|どこ|場所/],
      [2,/peppercorn|huajiao|numbing|tingling|málà|mala|花椒|麻辣|发麻|しびれ|花山椒|ホアジャオ/]
    ];
    for(const [index,pattern]of intents)if(pattern.test(text))return index;
    if(/grilled\s*fish|烤鱼|烤魚|魚料理|what fish|species/.test(text))return 0;
    let best=0,index=-1;const generic=new Set(['what is','是什么','とは']);
    copy().faq.forEach((item,n)=>{const score=item.keywords.reduce((sum,key)=>sum+(!generic.has(key)&&text.includes(key.toLowerCase())?key.length:0),0);if(score>best){best=score;index=n;}});
    return index;
  }
  function messageText(record){
    const c=copy();
    if(record.kind==='error')return c[record.errorKey]||c.aiUnknownError;
    if(record.role==='user'&&record.preset){
      if(Number.isInteger(record.flavor))return `${c.flavorAsk} · ${c.flavors[record.flavor].name}`;
      if(Number.isInteger(record.questionIndex))return c.faq[record.questionIndex].question;
    }
    if(record.role==='assistant'&&record.kind==='library'){
      if(Number.isInteger(record.flavor)){const item=c.flavors[record.flavor];return `${c.flavorStories[record.flavor].body}\n\n${c.flavorIngredients}: ${item.ingredients}\n\n${c.flavorFor}: ${item.preference}`;}
      if(Number.isInteger(record.questionIndex))return c.faq[record.questionIndex].answer;
      return c.assistantUnknown;
    }
    return record.content;
  }
  function addMessage(text,role='assistant',kind='library'){
    const row=document.createElement('div');row.className=`chat-message ${role} ${kind} ${kind==='error'?'chat-error':''}`;
    if(role==='assistant'){
      const label=document.createElement('span');label.className='chat-message-source';label.textContent=copy()[kind==='ai'?'aiAnswerLabel':kind==='error'?'aiErrorLabel':'aiLibraryLabel'];row.append(label);
    }
    const body=document.createElement('p');body.textContent=text;row.append(body);$('#chat-transcript').append(row);
  }
  function render(){
    const c=copy();$('#chat-transcript').replaceChildren();addMessage(c.assistantWelcome,'assistant','library');
    records.forEach(record=>addMessage(messageText(record),record.role,record.kind));
    if(busy){const typing=document.createElement('div');typing.className='chat-typing';typing.setAttribute('role','status');typing.textContent=c.aiThinking;$('#chat-transcript').append(typing);}
    $('#suggested-questions').replaceChildren(...c.faq.slice(0,3).map((item,index)=>{const button=document.createElement('button');button.type='button';button.textContent=item.question;button.disabled=busy;button.addEventListener('click',()=>ask(item.question,index));return button;}));
    $('#guide-topics').replaceChildren(...c.faq.map((item,index)=>{const button=document.createElement('button');button.type='button';button.textContent=item.question;button.disabled=busy;button.classList.toggle('selected',records.at(-1)?.questionIndex===index);button.addEventListener('click',()=>ask(item.question,index));return button;}));
    $('#chat-input').placeholder=c.assistantPlaceholder;$('#chat-form button[type=submit]').setAttribute('aria-label',c.aiSend);$('#chat-form button[type=submit]').disabled=busy||checking;
    $('#chat-cancel').hidden=!busy;$('#chat-cancel').textContent=c.aiCancel;
    const badge=$('#ai-mode-label');badge.textContent=checking?c.aiChecking:mode==='ai'?c.aiReady:c.aiLibraryMode;badge.dataset.mode=checking?'checking':mode;
    $('#chat-mode-ai').textContent=c.aiCloudMode;$('#chat-mode-library').textContent=c.aiLibraryMode;
    $('#chat-mode-ai').disabled=!configured||busy||checking;$('#chat-mode-library').disabled=busy;
    $('#chat-mode-ai').setAttribute('aria-pressed',String(mode==='ai'));$('#chat-mode-library').setAttribute('aria-pressed',String(mode==='knowledge'));
    $('#ai-availability-banner').hidden=checking||configured;$('#ai-availability-banner').textContent=c.aiUnavailableNotice;
    $('#ai-mode-help').textContent=c.aiModeHelp;$('#ai-privacy').textContent=c.aiPrivacy;
    $('#chat-transcript').scrollTop=$('#chat-transcript').scrollHeight;
  }
  // GitHub Pages has no server runtime. Use the local cultural library.
  async function checkStatus(){
    configured=false;checking=false;mode='knowledge';signal('unconfigured');render();
  }
  const ready=checkStatus();
  function contextMessages(){
    const selected=[];let length=0;
    for(let index=records.length-1;index>=0&&selected.length<8;index--){
      const record=records[index];if(record.kind!=='ai')continue;
      const content=messageText(record).slice(0,1000);if(length+content.length>5500)break;length+=content.length;selected.unshift({role:record.role,content});
    }
    while(selected.length&&selected[0].role!=='user')selected.shift();
    return selected;
  }
  async function ask(question,questionIndex,flavor){
    const requestRevision=revision;
    await ready;if(busy||revision!==requestRevision)return;
    const text=String(question).trim().slice(0,500);if(!text)return;
    records.push({role:'user',content:text,kind:mode==='ai'?'ai':'library',preset:Number.isInteger(questionIndex)||Number.isInteger(flavor),...(Number.isInteger(questionIndex)?{questionIndex}:{}),...(Number.isInteger(flavor)?{flavor}: {})});
    $('#chat-input').value='';
    if(mode==='knowledge'){
      const index=Number.isInteger(questionIndex)?questionIndex:findAnswer(text);
      records.push({role:'assistant',content:'',kind:'library',...(index>=0?{questionIndex:index}:{}),...(Number.isInteger(flavor)?{flavor}: {})});
      if(records.length>32)records.splice(0,records.length-32);save();render();signal('speaking');return;
    }
    busy=true;controller=new AbortController();signal('thinking');render();
    const taskController=controller;
    const timer=setTimeout(()=>taskController.abort('timeout'),30000);
    try{
      const response=await fetch('/api/chat',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({language,messages:contextMessages()}),signal:taskController.signal});
      const data=await response.json().catch(()=>({}));
      if(revision!==requestRevision)return;
      if(!response.ok){
        const keys={ai_not_configured:'aiNoKey',quota_exceeded:'aiQuotaExceeded',ai_auth_failed:'aiAuthFailed',ai_timeout:'aiTimeout',ai_unavailable:'aiUnavailable',rate_limited:'aiRateLimit',request_in_progress:'aiRateLimit'};
        const key=keys[data.error?.code||data.code]||'aiUnknownError';
        const error=new Error(key);error.displayKey=key;throw error;
      }
      if(typeof data.answer!=='string'||!data.answer.trim())throw new Error('aiUnknownError');
      records.push({role:'assistant',content:data.answer.trim().slice(0,8000),kind:'ai'});signal('speaking');
    }catch(error){
      if(revision!==requestRevision)return;
      const key=taskController.signal.aborted?(taskController.signal.reason==='timeout'?'aiTimeout':'aiCanceled'):(error.displayKey||'aiUnavailable');
      records.push({role:'assistant',content:'',kind:'error',errorKey:key});signal(key==='aiCanceled'?'idle':'error');
    }finally{
      clearTimeout(timer);
      if(revision===requestRevision){busy=false;controller=null;if(records.length>32)records.splice(0,records.length-32);save();render();}
    }
  }
  function clear(){
    revision+=1;controller?.abort('cleared');controller=null;busy=false;records.length=0;$('#chat-input').value='';save();render();
    try{const url=new URL(location.href);url.searchParams.delete('topic');url.searchParams.delete('flavor');history.replaceState(null,'',url);}catch{}
    $('#guide-status').textContent=copy().guideClearDone;signal(configured?'idle':'unconfigured');
  }
  $('#chat-form').addEventListener('submit',event=>{event.preventDefault();ask($('#chat-input').value);});
  $('#chat-clear').addEventListener('click',clear);
  $('#chat-cancel').addEventListener('click',()=>controller?.abort('canceled'));
  $('#chat-mode-ai').addEventListener('click',()=>{if(configured&&!busy){mode='ai';render();}});
  $('#chat-mode-library').addEventListener('click',()=>{if(!busy){mode='knowledge';render();}});
  window.addEventListener('wanzi:ask',event=>{
    const index=topicIds.indexOf(event.detail?.topic);if(index>=0)ask(copy().faq[index].question,index);
    $('#chat-input').focus({preventScroll:true});$('#chat-form').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
  });
  window.WanziChat={
    setLanguage(lang){if(['en','zh','ja'].includes(lang))language=lang;render();},ask,
    async start(query){const startRevision=revision;await ready;if(revision!==startRevision)return;const flavor=flavorIds.indexOf(query.get('flavor')),topic=topicIds.indexOf(query.get('topic'));
      if(flavor>=0&&records.at(-1)?.flavor!==flavor)ask(`${copy().flavorAsk} · ${copy().flavors[flavor].name}`,undefined,flavor);
      else if(flavor<0&&topic>=0&&records.at(-1)?.questionIndex!==topic)ask(copy().faq[topic].question,topic);
    }
  };
  render();
})();
