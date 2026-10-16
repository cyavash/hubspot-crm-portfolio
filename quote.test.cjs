'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {JSDOM}=require('jsdom');
const html=readFileSync('quote.html','utf8');
const source=readFileSync('quote.js','utf8');
for(const billing of ['monthly','quarterly','annual'])for(const report of [false,true])for(const branding of [false,true]){
 test(`quote totals: ${billing}, reporting ${report}, branding ${branding}`,()=>{
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.com/'});
  dom.window.eval(source);
  const result=dom.window.eval(`calculateQuote(${JSON.stringify(billing)},${report},${branding})`);
  const monthly=171000+(branding?15000:0);
  const subscription=billing==='annual'?Math.round(monthly*12*.85):monthly*12;
  const upfront=330000+(report?180000:0);
  const installment=billing==='annual'?subscription:monthly*(billing==='quarterly'?3:1);
  assert.equal(result.subscriptionCents,subscription);assert.equal(result.oneTimeCents,upfront);assert.equal(result.dueCents,installment+upfront);
  for(const value of Object.values(result))if(typeof value==='number')assert.ok(Number.isSafeInteger(value));
  dom.window.close();
 });
}
