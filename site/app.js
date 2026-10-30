(()=>{const C=window.BUYE_CONFIG,$=s=>document.querySelector(s);let token=null;
const el=(t,a={},...k)=>{const e=document.createElement(t);for(const[x,v]of Object.entries(a))x in e?e[x]=v:e.setAttribute(x,v);k.flat().forEach(c=>e.append(c));return e};
async function api(action,payload){ // text/plain avoids CORS preflight against Apps Script
 const r=await fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action,idToken:token,payload})});
 const j=await r.json();if(!j.ok)throw new Error(j.error);return j.data}
const note=(v,m,bad)=>v.prepend(el('p',{className:bad?'err':'ok',role:'status'},m));
const VIEWS={
Overview:async v=>{const[h,u,a]=await Promise.all([api('health'),api('usage'),api('listAgents')]);
 v.append(el('div',{className:'card'},el('h2',{},'Overview'),el('p',{},`Signed in as ${h.user}${h.admin?' (admin)':''}`),
 el('p',{},`Agents: ${a.length} · Runs this month: ${u.runs}`),el('span',{className:'tag'},'Live backend data')))},
'Agent Factory':async v=>{const prov=await api('listProviders');
 const f=el('div',{className:'card'},el('h2',{},'Agent Factory'));const F={};
 const add=(k,l,t='input')=>{F[k]=el(t,{id:'f'+k});f.append(el('label',{htmlFor:'f'+k},l),F[k])};
 add('name','Name');add('mission','Mission','textarea');add('sys','System instructions','textarea');
 F.prov=el('select',{id:'fprov'},prov.map(p=>el('option',{value:p.id},p.name)));f.append(el('label',{htmlFor:'fprov'},'Provider'),F.prov);
 add('model','Exact model ID (see AI Models page / provider docs)');
 F.conn=el('select',{id:'fconn'},el('option',{value:'managed'},'BUYE-managed key'),el('option',{value:'byok'},'Bring your own key (per request, not stored)'));f.append(el('label',{htmlFor:'fconn'},'Connection'),F.conn);
 f.append(el('button',{className:'p',onclick:async()=>{try{await api('saveAgent',{agent:{name:F.name.value,description:F.name.value,mission:F.mission.value,
  systemInstructions:F.sys.value,model:{provider:F.prov.value,modelId:F.model.value.trim(),connection:F.conn.value},tools:[],
  limits:{maxTokens:1000,maxRetries:2,timeoutSec:60},trigger:{type:'manual'},approvalPolicy:'none'}});note(v,'Saved as DRAFT. Run a test in My Agents to validate.')}catch(e){note(v,e.message,1)}}},'Save agent'));v.append(f)},
'My Agents':async v=>{const[agents,kb]=await Promise.all([api('listAgents'),api('listKb')]);v.append(el('h2',{},'My Agents'));if(!agents.length)v.append(el('p',{},'No agents yet.'));
 agents.forEach(a=>{const ks=el('select',{multiple:true,'aria-label':'Attach saved notes (sent to the AI provider)'},kb.map(k=>el('option',{value:k.id},k.title))),inp=el('textarea',{'aria-label':'Test input'}),key=el('input',{type:'password','aria-label':'BYOK key',placeholder:'API key (never stored)'}),out=el('pre');
  v.append(el('div',{className:'card'},el('b',{},a.name),' ',el('span',{className:'tag'},a.status+' v'+a.version),el('p',{},`${a.model.provider} / ${a.model.modelId}`),inp,kb.length?ks:'',a.model.connection==='byok'?key:'',
  el('button',{className:'p',onclick:async()=>{out.textContent='Running…';try{const j=await api('runAgent',{agentId:a.id,input:inp.value,byokKey:key.value,kbIds:[...ks.selectedOptions].map(o=>o.value),isTest:true,idempotencyKey:crypto.randomUUID()});
   out.textContent=`[${j.status}] model used: ${j.modelUsed||'n/a'}\n`+(j.error||j.output)+(j.cost?`\nEstimated cost: ${j.cost.amount} ${j.cost.currency}`:'\nCost: pricing unavailable')}catch(e){out.textContent=e.message}}},'Test run'),
  el('button',{className:'p',onclick:async()=>{if(confirm('Delete agent?')){await api('deleteAgent',{id:a.id});show('My Agents')}}},'Delete'),out))})},
'AI Models':async v=>{const[models,prov]=await Promise.all([api('listModels'),api('listProviders')]);v.append(el('h2',{},'AI Models'));
 v.append(el('div',{className:'card'},el('b',{},'Providers'),el('ul',{},prov.map(p=>el('li',{},el('a',{href:p.docs,target:'_blank',rel:'noopener'},p.name),' — connection not yet tested')))));
 if(!models.length)v.append(el('p',{},'Catalogue empty: an admin must run refreshModels for a provider that has a managed key.'));
 models.slice(0,200).forEach(m=>v.append(el('div',{className:'card'},el('b',{},m.modelId),' ',el('span',{className:'tag'},m.provider),el('p',{},m.priceLabel||`In ${m.pricing.inputPerM}/M · Out ${m.pricing.outputPerM}/M ${m.pricing.currency} (verified ${m.pricing.verifiedAt})`))))},
'Job Queue':async v=>{const r=await api('listRuns');v.append(el('h2',{},'Runs'));if(!r.length)v.append(el('p',{},'No runs yet.'));
 r.forEach(j=>v.append(el('div',{className:'card'},el('b',{className:j.status==='FAILED'?'err':'ok'},j.status),` ${j.startedAt} · ${j.modelUsed||j.modelRequested}`,el('pre',{},j.error||''))))}};
async function show(n){const v=$('#view');v.replaceChildren(el('p',{},'Loading…'));document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',b.textContent===n));
 const box=el('div');try{await VIEWS[n](box)}catch(e){box.prepend(el('p',{className:'err',role:'alert'},'Error: '+e.message))}v.replaceChildren(box)}
function start(r){token=r.credential;$('#login').hidden=true;$('#app').hidden=false;
 try{$('#who').textContent=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).email}catch{} // display only; server re-verifies
 api('health').then(h=>{const O=['Overview','Agent Templates','Agent Factory','My Agents','Workflow Studio','Job Queue','Approval Inbox','Knowledge Base','AI Models','Reports and Logs','Billing and Usage'].concat(h.admin?['Admin']:[]).filter(n=>VIEWS[n]);
  O.forEach(n=>$('#nav').append(el('button',{onclick:()=>show(n)},n)));const pid=new URLSearchParams(location.search).get('razorpay_payment_id');
  if(pid){history.replaceState(null,'',location.pathname);show('Billing and Usage');api('claimPayment',{paymentId:pid}).then(()=>show('Billing and Usage')).catch(e=>$('#view').prepend(el('p',{className:'err',role:'alert'},'Payment could not be verified: '+e.message+'. Contact support with your payment ID.')))}else show('Overview')}).catch(e=>{$('#view').textContent='Error: '+e.message})}
window.BUYE={el,api,note,VIEWS,show};$('#out').onclick=()=>location.reload();
if(C.API_URL.startsWith('PASTE')||C.GOOGLE_CLIENT_ID.startsWith('PASTE'))$('#cfgwarn').hidden=false;
window.onload=()=>{if(window.google){google.accounts.id.initialize({client_id:C.GOOGLE_CLIENT_ID,callback:start});google.accounts.id.renderButton($('#gbtn'),{theme:'outline',size:'large'})}};
})();
