const assets=[
 ['project-art/functionly-logo.svg','https://www.functionly.com/hubfs/Functionly%20Logo.svg'],
 ['project-art/startdeliver-platform.png','https://framerusercontent.com/images/5hHgaarerrZdwypPUZMN1qzw.png?height=719&width=1181']
];
for(const [file,url] of assets){
const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error(url+': '+response.status);
if(!/image\//.test(response.headers.get('content-type')||''))throw new Error('Expected image');
const bytes=Buffer.from(await response.arrayBuffer());
console.log('ASSET '+JSON.stringify({file,url,encoding:'base64',content:bytes.toString('base64')}));
}