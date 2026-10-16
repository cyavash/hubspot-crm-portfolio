'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {JSDOM} = require('jsdom');
const script = readFileSync('startdeliver-interactions.js', 'utf8');
const carousel = () => `<section data-sd-carousel><figure data-sd-slide>First</figure><figure data-sd-slide>Second</figure><div data-sd-controls hidden><button data-sd-prev>Previous</button><p data-sd-status role="status"></p><button data-sd-next>Next</button></div></section>`;
function setup(html, enhance = true) {
  const dom = new JSDOM(html, {runScripts:'outside-only', pretendToBeVisual:true});
  if(enhance){dom.window.eval(script);dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));}
  return dom;
}
test('without JavaScript both quotes are readable and controls stay hidden', () => {
 const d=setup(carousel(),false).window.document;
 assert.equal(d.querySelectorAll('[data-sd-slide][hidden]').length,0);
 assert.equal(d.querySelector('[data-sd-controls]').hidden,true);
});
test('Next wraps, Home/End navigate, and focus remains on the control', () => {
 const {window:w}=setup(carousel());const d=w.document,next=d.querySelector('[data-sd-next]');next.focus();next.click();
 assert.equal(d.querySelector('[data-sd-status]').textContent,'2 of 2 testimonials');assert.equal(d.activeElement,next);
 next.click();assert.equal(d.querySelector('[data-sd-slide]').hidden,false);
 next.dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true}));assert.equal(d.querySelector('[data-sd-slide]').hidden,true);
 next.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Home',bubbles:true}));assert.equal(d.querySelector('[data-sd-slide]').hidden,false);
});
test('two slider instances retain independent state', () => {
 const d=setup(carousel()+carousel()).window.document;d.querySelector('[data-sd-next]').click();
 assert.deepEqual([...d.querySelectorAll('[data-sd-status]')].map(e=>e.textContent),['2 of 2 testimonials','1 of 2 testimonials']);
});
test('scroll reveal remains visible when motion is reduced', () => {
 const {window:w}=setup('<section data-reveal>Visible</section>',false);let observed=0;
 w.matchMedia=()=>({matches:true});w.IntersectionObserver=class{observe(){observed++;}};w.eval(script);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 assert.equal(observed,0);assert.equal(w.document.querySelector('section').hasAttribute('data-reveal-state'),false);
});
test('focusing an offscreen element reveals its containing section', () => {
 const {window:w}=setup('<section data-reveal><a href="#">Focus</a></section>',false);
 w.HTMLElement.prototype.getBoundingClientRect=()=>({top:1000});w.matchMedia=()=>({matches:false,addEventListener(){}});w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
 w.eval(script);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));const section=w.document.querySelector('section');assert.equal(section.dataset.revealState,'waiting');w.document.querySelector('a').focus();assert.equal(section.dataset.revealState,'shown');
});
