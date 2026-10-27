import {catalog,evaluate,createItem,reviewItem,simulateItem,statistics,demoState,normalizeState} from './engine.js';
const $ = (s) => document.querySelector(s);
const storeKey = 'arazvera.workflow-studio.v1';
const labels = {
  ready:'Ready',review_required:'Needs approval',approved:'Approved',
  rejected:'Rejected',simulated:'Simulated',denied:'Denied'
};
const app = {state:null,view:'workbench'};
function readState(){
  try {
    const data=localStorage.getItem(storeKey);
    if(data)return normalizeState(JSON.parse(data));
  } catch(error) { console.warn('Local state unavailable:',error?.name); }
  return demoState();
}
function persist(){
  try{localStorage.setItem(storeKey,JSON.stringify(app.state));}catch(error){console.warn('Local save unavailable:',error?.name);}
}
function now(){return new Date().toISOString();}
function el(tag,cls,text){
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=String(text);
  return node;
}
function formatTime(at){
  const date=new Date(at);
  return Number.isFinite(date.getTime())?date.toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'Local event';
}
function toast(message){
  const node=$('#toast');
  node.textContent=message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>node.classList.remove('show'),3500);
}
function count(){
  const s=statistics(app.state);
  $('#metric-total').textContent=s.total;
  $('#metric-simulated').textContent=s.simulated;
  $('#metric-pending').textContent=s.pending;
  $('#metric-denied').textContent=s.denied;
  $('#nav-pending').textContent=s.pending;
}
function statusElement(status){return el('span','pill '+status,labels[status]||status);}
function actionButton(text,handler,css='row-btn'){
  const b=el('button',css,text);
  b.type='button';
  b.addEventListener('click',handler);
  return b;
}
function transition(kind,id,choice){
  try{
    app.state=kind==='review'?reviewItem(app.state,id,choice,now()):simulateItem(app.state,id,now());
    persist();render();
    toast(kind==='review'?(choice==='approve'?'Approval recorded locally.':'Rejection recorded locally.'):'Simulation complete. No external action occurred.');
  }catch(error){toast(error.message||'The request could not be updated.');}
}
function specialistLabel(item){
  return item.agent||catalog[item.domain]?.agent||'Unassigned';
}
function renderQueue(){
  const term=$('#search-input').value.trim().toLocaleLowerCase();
  const filter=$('#status-filter').value;
  const items=app.state.items.filter(item=>(filter==='all'||item.status===filter)
    &&(!term||[item.title,item.domain,item.action,item.agent,item.id].join(' ').toLocaleLowerCase().includes(term)));
  const target=$('#task-rows');target.replaceChildren();
  $('#empty-tasks').classList.toggle('hidden',items.length!==0);
  for(const item of items){
    const tr=el('tr');
    const tdTitle=el('td');tdTitle.append(el('div','task-title',item.title));
    tdTitle.append(el('small','',item.id+(item.synthetic?' · Sample record':'')));
    tr.append(tdTitle);
    const tdAgent=el('td','agent-cell');tdAgent.append(el('div','',specialistLabel(item)));
    tdAgent.append(el('small','',catalog[item.domain]?.label||'No matching route'));tr.append(tdAgent);
    const tdPriority=el('td');tdPriority.append(el('span','priority '+item.priority,item.priority));tr.append(tdPriority);
    const tdStatus=el('td');tdStatus.append(statusElement(item.status));tr.append(tdStatus);
    const tdAction=el('td');
    if(item.status==='ready'||item.status==='approved'){
      tdAction.append(actionButton('Simulate ↗',()=>transition('simulate',item.id)));
    }else if(item.status==='review_required'){
      tdAction.append(actionButton('Review ↗',()=>showView('approvals')));
    }else{tdAction.append(el('span','muted-action','—'));}
    tr.append(tdAction);
    target.append(tr);
  }
}
function renderApprovals(){
  const pending=app.state.items.filter(i=>i.status==='review_required');
  const target=$('#approval-items');target.replaceChildren();
  $('#empty-approvals').classList.toggle('hidden',pending.length!==0);
  for(const item of pending){
    const card=el('article','approval-card');
    const summary=el('div');
    summary.append(statusElement('review_required'));
    summary.append(el('h3','',item.title));
    summary.append(el('p','',specialistLabel(item)+' · '+item.action.replaceAll('_',' ')+' · '+item.priority.toUpperCase()+' PRIORITY'));
    const actions=el('div','actions');
    actions.append(actionButton('Approve demo',()=>transition('review',item.id,'approve'),'review-approve'));
    actions.append(actionButton('Reject',()=>transition('review',item.id,'reject'),'review-reject'));
    card.append(summary,actions);
    target.append(card);
  }
}
function renderAudit(){
  const target=$('#activity-items');target.replaceChildren();
  if(!app.state.audit.length){
    target.append(el('div','empty','No events recorded yet. Create a request to begin the audit trail.'));
    return;
  }
  for(const event of app.state.audit){
    const wrapper=el('div','event');wrapper.append(el('span','event-dot'));
    const details=el('div');
    details.append(el('h3','',event.kind.replaceAll('.',' / ').toUpperCase()));
    details.append(el('p','',event.detail));
    details.append(el('time','',event.requestId+' · '+formatTime(event.at)));
    wrapper.append(details);target.append(wrapper);
  }
}
function render(){count();renderQueue();renderApprovals();renderAudit();}
function showView(name){
  if(!['workbench','approvals','activity','about'].includes(name))return;
  app.view=name;
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active-view',v.id==='view-'+name));
  document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  window.scrollTo({top:0,behavior:'smooth'});
}
function updateActions(){
  const domain=$('#request-domain').value;
  const target=$('#request-action');
  const previous=target.value;
  target.replaceChildren();
  for(const action of catalog[domain].actions){
    const option=el('option','',action.label);option.value=action.id;target.append(option);
  }
  if(catalog[domain].actions.some(a=>a.id===previous))target.value=previous;
  preview();
}
function preview(){
  const d=evaluate($('#request-domain').value,$('#request-action').value);
  const node=$('#policy-preview');node.replaceChildren();
  const icon=el('span','',d.status==='review_required'?'◇':d.status==='ready'?'✓':'×');
  const text=el('div');text.append(el('b','',labels[d.status]||'Denied'));
  text.append(el('small','',d.agent?d.agent+' — '+d.reason:d.reason));
  node.append(icon,text);
}
function openDialog(){
  const dialog=$('#request-dialog');
  $('#request-form').reset();
  $('#form-error').textContent='';
  updateActions();
  dialog.showModal();
  $('#request-title').focus();
}
function closeDialog(){ $('#request-dialog').close(); }
function addFromForm(event){
  event.preventDefault();
  const payload={
    title:$('#request-title').value,domain:$('#request-domain').value,
    action:$('#request-action').value,priority:$('#request-priority').value
  };
  const id='REQ-'+(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID().slice(0,8).toUpperCase():Date.now().toString(36).toUpperCase());
  try{
    app.state=createItem(app.state,payload,id,now());
    persist();render();closeDialog();showView('workbench');
    toast('Request recorded and evaluated. No external action was taken.');
  }catch(error){$('#form-error').textContent=error.message;}
}
function exportData(){
  const report={
    metadata:{product:'ARAZVERA Workflow Studio',type:'LOCAL_SIMULATION',exportedAt:now(),externalExecution:false},
    ...app.state
  };
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=el('a');link.href=url;
  link.download='arazvera-workflow-audit-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500);
  toast('Local audit snapshot exported.');
}
function resetDemo(){
  if(!confirm('Replace your current local requests and audit with the sample demonstration? This cannot be undone.'))return;
  app.state=demoState();persist();render();showView('workbench');toast('Sample data restored.');
}
function boot(){
  app.state=readState();
  if(app.state.items.length===0&&app.state.audit.length===0){
    // Persist an empty state only if a prior store exists; new visitors receive sample records.
    let existing=null;
    try{existing=localStorage.getItem(storeKey);}catch{}
    if(existing===null)app.state=demoState();
  }
  persist();render();
  document.querySelectorAll('[data-view]').forEach(node=>node.addEventListener('click',()=>showView(node.dataset.view)));
  $('#new-request-top').addEventListener('click',openDialog);
  $('#new-request-small').addEventListener('click',openDialog);
  $('#close-dialog').addEventListener('click',closeDialog);
  $('#cancel-dialog').addEventListener('click',closeDialog);
  $('#request-form').addEventListener('submit',addFromForm);
  $('#request-domain').addEventListener('change',updateActions);
  $('#request-action').addEventListener('change',preview);
  $('#search-input').addEventListener('input',renderQueue);
  $('#status-filter').addEventListener('change',renderQueue);
  $('#export-top').addEventListener('click',exportData);
  $('#export-activity').addEventListener('click',exportData);
  $('#reset-demo').addEventListener('click',resetDemo);
  $('#request-dialog').addEventListener('click',event=>{
    if(event.target===$('#request-dialog'))closeDialog();
  });
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
      event.preventDefault();openDialog();
    }
  });
  updateActions();
}
boot();