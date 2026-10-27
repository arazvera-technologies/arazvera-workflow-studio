import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const file=name=>readFileSync(resolve(process.cwd(),name),'utf8');
test('product page declares identity, viewport and app module',()=>{
 const html=file('index.html');
 assert.match(html,/<html lang="en">/);
 assert.match(html,/name="viewport"/);
 assert.match(html,/src="\.\/src\/app\.js"/);
 assert.match(html,/ARAZVERA TECHNOLOGIES/);
});
test('required panels and accessible controls exist',()=>{
 const html=file('index.html');
 for(const id of ['view-workbench','view-approvals','view-activity','view-about','request-dialog','request-title','request-action','request-form','task-rows','approval-items','activity-items']){
   assert.ok(html.includes('id="'+id+'"'),id);
 }
});
test('brand image is present locally',()=>{
 assert.ok(existsSync(resolve('assets','arazvera-mark.webp')));
});
test('application avoids external API requests and unsafe HTML insertion',()=>{
 const app=file('src/app.js');
 assert.doesNotMatch(app,/\bfetch\s*\(/);
 assert.doesNotMatch(app,/innerHTML\s*=/);
});
