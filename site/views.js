(()=>{const{el,api,note,VIEWS,show}=window.BUYE,uid=()=>crypto.randomUUID();
const sel=(id,o)=>el('select',{id},o.map(([v,t])=>el('option',{value:v},t)));
const fld=(b,id,l,n)=>b.append(el('label',{htmlFor:id},l),n);
const btn=(t,fn)=>el('button',{className:'p',onclick:fn},t);
const go=(v,fn,then)=>async()=>{try{const r=await fn();then?then(r):0}catch(e){note(v,e.message,1)}};
const keyIn=()=>el('input',{type:'password','aria-label':'API key for bring-your-own-key agents (never stored)',placeholder:'API key (BYOK only, never stored)'});
VIEWS['Agent Templates']=async v=>{const[t,prov]=await Promise.all([api('listTemplates'),api('listProviders')]);
 const c=el('div',{className:'card'},el('h2',{},'Agent Templates'),el('p',{},'Choose provider, exact model ID and connection, then use a template.'));
 const p=sel('tp',prov.map(x=>[x.id,x.name])),m=el('input',{id:'tm'}),k=sel('tc',[['managed','BUYE-managed (paid plans)'],['byok','Bring your own key']]);
 fld(c,'tp','Provider',p);fld(c,'tm','Exact model ID',m);fld(c,'tc','Connection',k);v.append(c);let ws='';
 t.forEach(x=>{if(x.workspace!==ws){ws=x.workspace;v.append(el('h3',{},ws))}
  v.append(el('div',{className:'card'},el('b',{},x.name),el('p',{},x.purpose),btn('Use template',go(v,()=>api('createFromTemplate',{templateId:x.id,model:{provider:p.value,modelId:m.value.trim(),connection:k.value}}),()=>note(v,'Created as DRAFT. Test it in My Agents.')))))})};
VIEWS['Workflow Studio']=async v=>{const[ag,wfs]=await Promise.all([api('listAgents'),api('listWorkflows')]);v.append(el('h2',{},'Workflow Studio'));
 if(!ag.length){v.append(el('p',{},'Create an agent first.'));return}
 const c=el('div',{className:'card'},el('p',{},'Steps run in order; each step receives the previous step\u2019s output as data.')),name=el('input',{id:'wn'}),steps=el('div');fld(c,'wn','Workflow name',name);c.append(steps);
 const add=()=>steps.append(el('div',{},sel('',ag.map(a=>[a.id,a.name])),el('label',{},el('input',{type:'checkbox'}),' Require my approval before this step')));add();
 c.append(btn('Add step',add),btn('Save workflow',go(v,()=>api('saveWorkflow',{workflow:{name:name.value,steps:[...steps.children].map(d=>({agentId:d.querySelector('select').value,approval:d.querySelector('input').checked}))}}),()=>show('Workflow Studio'))));v.append(c);
 wfs.forEach(w=>{const i=el('textarea',{'aria-label':'Workflow input'}),k=keyIn(),out=el('pre');
  v.append(el('div',{className:'card'},el('b',{},w.name),el('p',{},w.steps.length+' step(s)'),i,k,btn('Run',async()=>{out.textContent='Running\u2026';try{const j=await api('startWorkflow',{workflowId:w.id,input:i.value,byokKey:k.value,idempotencyKey:uid()});
   out.textContent=j.status+(j.error?'\n'+j.error:'')+(j.status==='WAITING_FOR_APPROVAL'?'\nOpen Approval Inbox.':'')+(j.status==='COMPLETED'?'\n'+j.outputs[j.outputs.length-1]:'')}catch(e){out.textContent=e.message}}),
   btn('Delete',go(v,()=>api('deleteWorkflow',{id:w.id}),()=>show('Workflow Studio'))),out))})};
VIEWS['Job Queue']=async v=>{const[jobs,runs]=await Promise.all([api('listJobs'),api('listRuns')]);v.append(el('h2',{},'Workflow jobs'));if(!jobs.length)v.append(el('p',{},'No workflow jobs yet.'));
 jobs.forEach(j=>{const k=keyIn();v.append(el('div',{className:'card'},el('b',{className:j.status==='FAILED'?'err':'ok'},j.status),` step ${j.stepIndex} \u00b7 ${j.startedAt}`,el('pre',{},j.error||j.note||''),
  ['QUEUED','FAILED'].includes(j.status)?[k,btn('Resume / retry',go(v,()=>api('resumeJob',{jobId:j.id,byokKey:k.value}),()=>show('Job Queue')))]:'',
  ['QUEUED','RUNNING','WAITING_FOR_APPROVAL'].includes(j.status)?btn('Cancel',go(v,()=>api('cancelJob',{jobId:j.id}),()=>show('Job Queue'))):''))});
 v.append(el('h2',{},'Agent runs'));runs.forEach(j=>v.append(el('div',{className:'card'},el('b',{className:j.status==='FAILED'?'err':'ok'},j.status),` ${j.startedAt} \u00b7 ${j.modelUsed||j.modelRequested}`,el('pre',{},j.error||''))))};
VIEWS['Approval Inbox']=async v=>{const a=await api('listApprovals');v.append(el('h2',{},'Approval Inbox'));if(!a.length)v.append(el('p',{},'No approvals.'));
 a.forEach(x=>{const k=keyIn(),d=ap=>go(v,()=>api('decideApproval',{id:x.id,approve:ap,byokKey:k.value}),()=>show('Approval Inbox'));
  v.append(el('div',{className:'card'},el('b',{},x.description),el('p',{},`${x.status}${x.expired?' (expired)':''} \u00b7 expires ${x.expiresAt}${x.decidedBy?' \u00b7 decided by '+x.decidedBy:''}`),x.status==='PENDING'?[k,btn('Approve',d(true)),btn('Reject',d(false))]:''))})};
VIEWS['Knowledge Base']=async v=>{const l=await api('listKb'),c=el('div',{className:'card'},el('h2',{},'Knowledge Base'),el('p',{},'Saved notes are sent to the AI provider only when you attach them to a run.')),t=el('input',{id:'kt'}),x=el('textarea',{id:'kx'});
 fld(c,'kt','Title',t);fld(c,'kx','Text (max 20,000 characters)',x);c.append(btn('Save',go(v,()=>api('saveKb',{title:t.value,text:x.value}),()=>show('Knowledge Base'))));v.append(c);
 l.forEach(k=>v.append(el('div',{className:'card'},el('b',{},k.title),` ${k.chars} chars `,btn('Delete',go(v,()=>api('deleteKb',{id:k.id}),()=>show('Knowledge Base'))))))};
VIEWS['Reports and Logs']=async v=>{const r=await api('reports');
 v.append(el('div',{className:'card'},el('h2',{},'Reports and Logs'),el('p',{},'Runs by status: '+JSON.stringify(r.runsByStatus)),el('p',{},'Workflow jobs: '+JSON.stringify(r.workflowsByStatus)),
  el('p',{},`This month: ${r.usage.runs} runs (${r.usage.managed} BUYE-managed)`),el('p',{},'Estimated cost (only where verified pricing exists): '+(Object.keys(r.estimatedCost).length?JSON.stringify(r.estimatedCost):'unavailable'))));
 v.append(el('h3',{},'Audit log'));r.audit.forEach(a=>v.append(el('p',{},`${a.t} \u00b7 ${a.action} ${a.detail?JSON.stringify(a.detail):''}`)))};
VIEWS['Billing and Usage']=async v=>{const b=await api('billing'),cur=b.plans[b.plan];
 v.append(el('div',{className:'card'},el('h2',{},'Billing and Usage'),el('p',{},`Current plan: ${cur.name}${b.expiresAt&&b.plan!=='free'?' \u00b7 valid until '+b.expiresAt:''}`),
  el('p',{},`This month: ${b.usage.runs}/${cur.runs} runs \u00b7 ${b.usage.managed}/${cur.managedRuns} BUYE-managed runs`),
  b.claims.length?el('p',{},'Your activation requests: '+b.claims.map(c=>`${b.plans[c.plan].name} (${c.status})`).join(', ')):''));
 v.append(el('p',{},'1) Buy a plan in the BUYE-Online store using the same email as your Google account. 2) Come back and press \u201cI have paid\u201d. Your plan is activated after BUYE confirms the payment.'));
 Object.values(b.plans).filter(p=>p.id!=='free').forEach(p=>{const ref=el('input',{'aria-label':p.name+' payment reference','placeholder':'Order / payment reference (optional)'});
  v.append(el('div',{className:'card'},el('b',{},p.name),` ${p.priceInr?'\u20b9'+p.priceInr+(p.oneTime?' one-time':' / 30 days'):'Custom quotation'}`,el('p',{},`${p.runs} runs, ${p.managedRuns} BUYE-managed, ${p.workflows} workflows`),
   p.payLink?el('a',{href:p.payLink,className:'tag',target:'_blank',rel:'noopener'},p.priceInr?'Buy in BUYE store':'Request quotation'):'',
   p.priceInr?[ref,btn('I have paid',go(v,()=>api('requestActivation',{plan:p.id,reference:ref.value}),()=>{note(v,'Request sent. We will activate your plan after confirming payment.');}))]:''))})};
VIEWS['Admin']=async v=>{const[us,pl,cl]=await Promise.all([api('adminUsers'),api('listPlans'),api('adminClaims')]),rows={};v.append(el('h2',{},'Admin'));
 v.append(el('div',{className:'card'},el('h3',{},'Activation requests (confirm the purchase in your store dashboard first)'),cl.length?cl.map(x=>el('p',{},`${x.email} \u00b7 ${pl[x.plan].name} \u00b7 ref: ${x.reference||'-'} \u00b7 ${x.status} `,x.status==='PENDING'?[btn('Approve',go(v,()=>api('adminResolveClaim',{id:x.id,approve:true}),()=>show('Admin'))),btn('Reject',go(v,()=>api('adminResolveClaim',{id:x.id,approve:false}),()=>show('Admin')))]:'')):el('p',{},'None.')));
 const c=el('div',{className:'card'},el('h3',{},'Plans and Razorpay payment links'),el('p',{},'Fields: price \u20b9, runs, managed runs, workflows, store link (https://www.buye.online/courses/\u2026). Prices must be unique across plans.'));
 Object.values(pl).filter(p=>p.id!=='free').forEach(p=>{const d=el('div',{},el('b',{},p.name+' '));rows[p.id]={};['priceInr','runs','managedRuns','workflows','payLink'].forEach(k=>{const i=el('input',{value:p[k]||'','aria-label':p.name+' '+k,placeholder:k});rows[p.id][k]=i;d.append(i)});c.append(d)});
 c.append(btn('Save plans',go(v,()=>{const o={};for(const id in rows){o[id]={};for(const k in rows[id])o[id][k]=k==='payLink'?rows[id][k].value:(rows[id][k].value||undefined)}return api('adminSetPlanConfig',{plans:o})},()=>note(v,'Saved'))));v.append(c);
 const g=el('div',{className:'card'},el('h3',{},'Grant or change a plan (refunds: set to free)')),em=el('input',{id:'ge'}),pp=sel('gp',Object.keys(pl).map(k=>[k,pl[k].name])),dy=el('input',{id:'gd',value:'30'});
 fld(g,'ge','User email (must have signed in once)',em);fld(g,'gp','Plan',pp);fld(g,'gd','Days',dy);
 g.append(btn('Apply',go(v,()=>api('adminSetPlan',{email:em.value,plan:pp.value,days:dy.value}),()=>show('Admin'))),btn('Backup now',go(v,()=>api('adminBackup'),r=>note(v,'Backup '+r.folder+' ('+r.files+' files)'))));v.append(g);
 us.forEach(x=>v.append(el('p',{},`${x.email} \u00b7 ${x.plan}${x.expiresAt?' until '+x.expiresAt:''}`)))};
})();
