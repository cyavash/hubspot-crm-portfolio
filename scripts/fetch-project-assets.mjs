import { JSDOM } from 'jsdom';
import { mkdir, writeFile } from 'node:fs/promises';
const base='https://www.functionly.com/';
const html=await (await fetch(base)).text();
const doc=new JSDOM(html).window.document;
console.log('BRAND CANDIDATES', [...doc.querySelectorAll('img')].filter(e=>/logo|functionly/i.test(e.alt+' '+e.src)).slice(0,12).map(e=>({alt:e.alt,src:e.src})));
console.log('HEADER', (doc.querySelector('header')?.outerHTML||doc.querySelector('[class*="header"]')?.outerHTML||'').slice(0,22000));
console.log('STYLES', [...doc.querySelectorAll('link[rel="stylesheet"]')].map(e=>e.href));
for (const e of [...doc.querySelectorAll('link[rel="stylesheet"]')].slice(0,12)) {
const url=new URL(e.href,base);if(!/functionly.com$/.test(url.hostname)&&!url.hostname.endsWith('hubspotusercontent.net'))continue;
const css=await (await fetch(url)).text();
console.log('CSS',url.href,css.match(/[^{}]*(?:btn|button|cta|trial)[^{}]*\{[^{}]*\}/gi)?.slice(0,30).join('\n'));
}
await mkdir('project-art',{recursive:true});
const image='https://framerusercontent.com/images/5hHgaarerrZdwypPUZMN1qzw.png?height=719&width=1181';
const result=await fetch(image);if(!result.ok)throw new Error('Product image '+result.status);
await writeFile('project-art/startdeliver-platform.png',Buffer.from(await result.arrayBuffer()));
