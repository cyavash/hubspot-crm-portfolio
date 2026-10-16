'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {JSDOM} = require('jsdom');
function setup() {
  const dom = new JSDOM(readFileSync('bbwa.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true});
  dom.window.eval(readFileSync('qualification.js','utf8'));
  return dom.window;
}
function choose(w,name,value) {
  const input = [...w.document.querySelectorAll(`[name="${name}"]`)].find(e=>e.value===value);
  if(input.type==='radio') input.checked=true; else input.value=value;
}
test('required choices block forward navigation and identify the error',()=>{
 const w=setup(),d=w.document;d.querySelector('[data-next]').click();
 assert.equal(d.querySelector('[data-form-status]').textContent,'Step 1 of 4');
 assert.match(d.querySelector('[data-form-error]').textContent,/choose an option/);
 assert.equal(d.activeElement.name,'goal');
});
test('Back preserves choices and only the active fieldset participates in validation',()=>{
 const w=setup(),d=w.document;choose(w,'goal','Build a home');d.querySelector('[data-next]').click();
 assert.equal(d.querySelector('[data-form-status]').textContent,'Step 2 of 4');
 assert.deepEqual([...d.querySelectorAll('[data-step]')].map(e=>e.disabled),[true,false,true,true]);
 d.querySelector('[data-back]').click();assert.equal(d.querySelector('[value="Build a home"]').checked,true);
});
test('review preserves all answers and completion prevents a real submission',()=>{
 const w=setup(),d=w.document,form=d.querySelector('form');
 choose(w,'goal','Build a home');d.querySelector('[data-next]').click();
 d.querySelector('select').value='$600,000 to $800,000';d.querySelector('[data-next]').click();
 choose(w,'timing','Within 3 months');d.querySelector('[data-next]').click();
 assert.deepEqual([...d.querySelectorAll('[data-review] dd')].map(e=>e.textContent),['Build a home','$600,000 to $800,000','Within 3 months']);
 const event=new w.Event('submit',{bubbles:true,cancelable:true});form.dispatchEvent(event);
 assert.equal(event.defaultPrevented,true);assert.equal(d.querySelector('[data-complete]').hidden,false);
 assert.equal(d.querySelector('[data-finish]').disabled,true);
 assert.equal(w.document.activeElement,d.querySelector('[data-complete]'));
});

test('editing after completion restores the review action',()=>{
 const w=setup(),d=w.document;choose(w,'goal','Build a home');d.querySelector('[data-next]').click();d.querySelector('select').value='$600,000 to $800,000';d.querySelector('[data-next]').click();choose(w,'timing','Within 3 months');d.querySelector('[data-next]').click();d.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));d.querySelector('[data-back]').click();d.querySelector('[data-next]').click();assert.equal(d.querySelector('[data-complete]').hidden,true);assert.equal(d.querySelector('[data-finish]').disabled,false);
});
