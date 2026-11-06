const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {JSDOM}=require('jsdom');
function setup(){
 const dom=new JSDOM(readFileSync('website-preview/index.html','utf8'),{runScripts:'outside-only'});
 dom.window.matchMedia=()=>({matches:true,addEventListener(){}});
 dom.window.eval(readFileSync('website-preview/main.js','utf8'));
 return dom.window.document;
}
test('website filters expose matching cases and restore every case',()=>{
 const doc=setup(), cards=[...doc.querySelectorAll('[data-case]')];
 assert.equal(cards.length,7);
 for(const [category,total] of [['crm',4],['web',3],['ai',2],['email',1],['all',7]]){
  const button=doc.querySelector('[data-case-filter="'+category+'"]');
  button.click();
  assert.equal(cards.filter(c=>!c.hidden).length,total);
  assert.equal(doc.querySelector('[data-case-count]').textContent,total+(total===1?' project':' projects'));
  assert.equal(doc.querySelectorAll('[data-case-filter][aria-pressed="true"]').length,1);
  assert.ok(cards.filter(c=>!c.hidden).every(c=>category==='all'||c.dataset.category.split(' ').includes(category)));
 }
});
test('mobile navigation closes on Escape and restores menu focus',()=>{
 const doc=setup(), button=doc.querySelector('.menu-toggle');
 button.click(); assert.equal(button.getAttribute('aria-expanded'),'true');
 doc.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown',{key:'Escape'}));
 assert.equal(button.getAttribute('aria-expanded'),'false');
 assert.equal(doc.activeElement,button);
});
