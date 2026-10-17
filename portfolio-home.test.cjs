const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {JSDOM}=require('jsdom');
const html=readFileSync('index.html','utf8');
const script=readFileSync('portfolio-home.js','utf8');
function setup(enhance=true){const dom=new JSDOM(html,{runScripts:'outside-only'});if(enhance)dom.window.eval(script);return dom;}
function visible(document){return [...document.querySelectorAll('[data-project]')].filter(card=>!card.hidden);}
test('selected projects are unique and National College appears once',()=>{
 const {document}=setup(false).window;
 const cards=[...document.querySelectorAll('[data-project]')];
 const targets=cards.map(card=>card.querySelector('.project-art-link').getAttribute('href'));
 assert.equal(cards.length,9);
 assert.equal(new Set(targets).size,9);
 assert.equal(targets.filter(url=>url==='email.html').length,1);
 assert.equal(document.querySelectorAll('.lab-card').length,4);
 assert.equal(document.querySelectorAll('.lab-card a[href="email.html"]').length,0);
});
test('the complete project grid stays readable without JavaScript',()=>{
 const {document}=setup(false).window;
 assert.equal(visible(document).length,9);
 assert.equal(document.querySelector('[data-project-filters]').hidden,true);
 assert.equal(document.querySelectorAll('h1').length,1);
});
test('filters combine multi-category projects and announce accurate counts',()=>{
 const {document}=setup().window;
 for(const [category,count]of [['crm',5],['web',5],['email',2]]){
  const button=document.querySelector('[data-project-filter="'+category+'"]');
  button.click();
  assert.equal(visible(document).length,count);
  assert.equal(document.querySelector('[data-project-count]').textContent,count+' projects');
  assert.equal(button.getAttribute('aria-pressed'),'true');
  assert.equal(document.querySelectorAll('[data-project-filter][aria-pressed="true"]').length,1);
  assert.ok(visible(document).every(card=>card.dataset.category.split(' ').includes(category)));
 }
});
test('returning to all work restores every project and its links',()=>{
 const {document}=setup().window;
 document.querySelector('[data-project-filter="email"]').click();
 document.querySelector('[data-project-filter="all"]').click();
 assert.equal(visible(document).length,9);
 assert.equal(document.querySelector('[data-project-count]').textContent,'9 projects');
 assert.equal(document.querySelector('[data-project-filters]').hidden,false);
 assert.ok(visible(document).every(card=>card.querySelector('.index-card-links a[href]')));
});
