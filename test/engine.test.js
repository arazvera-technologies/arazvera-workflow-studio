import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog, evaluate, createItem, reviewItem, simulateItem, statistics, demoState, normalizeState} from '../src/engine.js';
test('independent specialties',()=>assert.deepEqual(Object.keys(catalog),['architecture','security','documentation']));
test('read only route ready',()=>assert.equal(evaluate('architecture','system_design').status,'ready'));
test('release requires review',()=>assert.equal(evaluate('architecture','deploy_release').status,'review_required'));
test('containment requires review',()=>assert.equal(evaluate('security','isolate_service').status,'review_required'));
test('unknown and cross-domain denied',()=>assert.equal(evaluate('architecture','delete_everything').status,'denied'));
test('unknown domain denied',()=>assert.equal(evaluate('marketing','system_design').status,'denied'));
test('request immutable and auditable',()=>{
 const s={items:[],audit:[]};const n=createItem(s,{title:' Plan a service ',domain:'architecture',action:'system_design',priority:'high'},'req-1','t');
 assert.equal(n.items[0].title,'Plan a service');assert.equal(n.items[0].status,'ready');assert.equal(n.audit[0].kind,'request.created');assert.equal(s.items.length,0);
});
test('blank title and invalid priority rejected',()=>{
 assert.throws(()=>createItem({items:[],audit:[]},{title:' ',domain:'security',action:'read_audit',priority:'low'},'a','t'));
 assert.throws(()=>createItem({items:[],audit:[]},{title:'ABC',domain:'security',action:'read_audit',priority:'critical'},'a','t'));
});
test('approval gates simulation',()=>{
 const s=createItem({items:[],audit:[]},{title:'Isolate',domain:'security',action:'isolate_service',priority:'high'},'x','t');
 assert.equal(s.items[0].status,'review_required');assert.throws(()=>simulateItem(s,'x','t2'),/approval/i);
});
test('approval then simulation, never actual execution',()=>{
 const s=createItem({items:[],audit:[]},{title:'Isolate',domain:'security',action:'isolate_service',priority:'high'},'x','t');
 const a=reviewItem(s,'x','approve','t2');assert.equal(a.items[0].status,'approved');
 const b=simulateItem(a,'x','t3');assert.equal(b.items[0].status,'simulated');assert.equal(b.items[0].executionMode,'simulation_only');
});
test('rejection blocks simulation',()=>{
 const s=createItem({items:[],audit:[]},{title:'Release',domain:'architecture',action:'deploy_release',priority:'medium'},'x','t');
 const n=reviewItem(s,'x','reject','t2');assert.equal(n.items[0].status,'rejected');assert.throws(()=>simulateItem(n,'x','t3'));
});
test('ready can simulate, cannot review',()=>{
 const s=createItem({items:[],audit:[]},{title:'Doc',domain:'documentation',action:'draft_brief',priority:'low'},'x','t');
 assert.equal(simulateItem(s,'x','t2').items[0].status,'simulated');assert.throws(()=>reviewItem(s,'x','approve','t2'));
});
test('duplicates forbidden',()=>{
 const s=createItem({items:[],audit:[]},{title:'Doc',domain:'documentation',action:'draft_brief',priority:'low'},'x','t');
 assert.throws(()=>createItem(s,{title:'Other',domain:'security',action:'read_audit',priority:'low'},'x','t2'),/duplicate/i);
});
test('statistics transparent',()=>{
 const s=createItem({items:[],audit:[]},{title:'Doc',domain:'documentation',action:'draft_brief',priority:'low'},'x','t');
 assert.deepEqual(statistics(s),{total:1,simulated:0,pending:0,denied:0});
});
test('seed clearly synthetic',()=>{
 const s=demoState('2026-01-01T00:00:00Z');assert.ok(s.items.length>=4);assert.ok(s.audit.length>=4);assert.ok(s.items.every(i=>i.synthetic===true));
});
test('malformed saved data safely reset',()=>{
 assert.equal(normalizeState('evil').items.length,0);assert.equal(normalizeState({items:[{foo:'bar'}],audit:[]}).items.length,0);
});