// ARAZVERA Workflow Studio — local, deterministic simulation. No external tools.
export const catalog = Object.freeze({
  architecture: Object.freeze({
    label: 'Systems architecture',
    agent: 'Architecture specialist',
    actions: Object.freeze([
      {id:'system_design',label:'Design a system',review:false},
      {id:'deploy_release',label:'Stage a production release',review:true}
    ])
  }),
  security: Object.freeze({
    label:'Defensive security',
    agent:'Security reviewer',
    actions:Object.freeze([
      {id:'read_audit',label:'Review audit metadata',review:false},
      {id:'isolate_service',label:'Isolate a service',review:true}
    ])
  }),
  documentation: Object.freeze({
    label:'Technical documentation',
    agent:'Documentation specialist',
    actions:Object.freeze([
      {id:'draft_brief',label:'Draft a technical brief',review:false},
      {id:'publish_content',label:'Publish public content',review:true}
    ])
  })
});
export const emptyState = () => ({items:[],audit:[]});
export function evaluate(domain,action){
  const specialist = typeof domain==='string' ? catalog[domain] : undefined;
  const capability = specialist?.actions.find(a=>a.id===action);
  if (!capability) return {status:'denied',agent:null,reason:'No matching approved specialist capability.'};
  if (capability.review) return {status:'review_required',agent:specialist.agent,reason:'Requires explicit human review before any simulation.'};
  return {status:'ready',agent:specialist.agent,reason:'Allowlisted in this local policy demonstration.'};
}
function appendAudit(state,entry){
  return {items:state.items,audit:[entry,...state.audit]};
}
function validateTime(t){
  if(typeof t!=='string'||t.length>50||!t.trim())throw Error('Invalid event time');
}
export function createItem(state,payload,id,at){
  if(!state||!Array.isArray(state.items)||!Array.isArray(state.audit))throw Error('Invalid state');
  const title=typeof payload?.title==='string'?payload.title.trim():'';
  if(!title||title.length>100)throw Error('A title of 1–100 characters is required');
  if(!['low','medium','high'].includes(payload?.priority))throw Error('Invalid priority');
  if(typeof id!=='string'||!id||id.length>100)throw Error('Invalid request ID');
  if(state.items.some(t=>t.id===id))throw Error('Duplicate request ID');
  validateTime(at);
  const decision=evaluate(payload.domain,payload.action);
  const item={id,title,domain:String(payload.domain).slice(0,60),
    action:String(payload.action).slice(0,60),priority:payload.priority,
    agent:decision.agent??'Unassigned',status:decision.status,reason:decision.reason,
    createdAt:at,updatedAt:at,executionMode:'simulation_only',synthetic:false};
  return appendAudit({...state,items:[item,...state.items]},{
    id:id+'-created',requestId:id,kind:'request.created',at,detail:'Policy result: '+decision.status
  });
}
function updateItem(state,id,status,at,kind,detail){
  validateTime(at);
  const item=state.items.find(t=>t.id===id);
  if(!item)throw Error('Request not found');
  const items=state.items.map(t=>t.id===id?{...t,status,updatedAt:at}:t);
  return appendAudit({...state,items},{
    id:id+'-'+kind+'-'+state.audit.length,requestId:id,kind,at,detail
  });
}
export function reviewItem(state,id,decision,at){
  const item=state.items.find(t=>t.id===id);
  if(!item||item.status!=='review_required')throw Error('Request is not pending review');
  if(!['approve','reject'].includes(decision))throw Error('Invalid review decision');
  return updateItem(state,id,decision==='approve'?'approved':'rejected',at,
    'review.'+decision,decision==='approve'?'Operator approved a demonstration.':'Operator rejected request.');
}
export function simulateItem(state,id,at){
  const item=state.items.find(t=>t.id===id);
  if(!item)throw Error('Request not found');
  if(item.status==='review_required')throw Error('Human approval is required');
  if(!['ready','approved'].includes(item.status))throw Error('Request is not runnable');
  return updateItem(state,id,'simulated',at,'simulation.completed',
    'Simulated locally. No external action or AI model was executed.');
}
export function statistics(state){
  const items=state.items;
  return {total:items.length,simulated:items.filter(i=>i.status==='simulated').length,
    pending:items.filter(i=>i.status==='review_required').length,
    denied:items.filter(i=>i.status==='denied'||i.status==='rejected').length};
}
export function demoState(at=new Date().toISOString()){
  const scenarios=[
    {title:'Review service boundary design',domain:'architecture',action:'system_design',priority:'medium'},
    {title:'Production release policy check',domain:'architecture',action:'deploy_release',priority:'high'},
    {title:'Review metadata integrity report',domain:'security',action:'read_audit',priority:'low'},
    {title:'Contain suspicious service activity',domain:'security',action:'isolate_service',priority:'high'},
    {title:'Draft integration specification',domain:'documentation',action:'draft_brief',priority:'medium'}
  ];
  let state=emptyState();
  scenarios.forEach((task,index)=>{
    state=createItem(state,task,'SAMPLE-0'+(index+1),at);
  });
  state=simulateItem(state,'SAMPLE-03',at);
  return {items:state.items.map(i=>({...i,synthetic:true})),audit:state.audit};
}
export function normalizeState(raw){
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.items)||!Array.isArray(raw.audit))return emptyState();
  if(raw.items.length>500||raw.audit.length>2000)return emptyState();
  const validItems=raw.items.every(i=>i&&typeof i.id==='string'&&typeof i.title==='string'
    &&typeof i.domain==='string'&&typeof i.action==='string'
    &&['ready','review_required','approved','rejected','simulated','denied'].includes(i.status)
    &&typeof i.createdAt==='string'&&typeof i.priority==='string');
  const validAudit=raw.audit.every(a=>a&&typeof a.kind==='string'&&typeof a.at==='string'&&typeof a.requestId==='string');
  return validItems&&validAudit?{items:raw.items,audit:raw.audit}:emptyState();
}