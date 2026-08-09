import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile, mkdir, rm, copyFile} from 'node:fs/promises';
import {extname, join, resolve} from 'node:path';
import {spawn} from 'node:child_process';

const cwd=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json'};
const server=createServer(async(req,res)=>{
  try{const raw=decodeURIComponent((req.url||'/').split('?')[0]);const rel=raw==='/'?'index.html':raw.replace(/^\//,'');const path=resolve(cwd,rel);if(!path.startsWith(cwd)){res.writeHead(403);return res.end();}const b=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(b);}catch(e){res.writeHead(404);res.end('not found');}
});
await new Promise(r=>server.listen(4173,'127.0.0.1',r));
await rm('frames',{recursive:true,force:true});await mkdir('frames',{recursive:true});await mkdir('keyframes',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
page.on('console',m=>console.log('[browser]',m.type(),m.text()));
await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__ready===true);
const meta=await page.evaluate(()=>window.__meta);console.log('META',JSON.stringify(meta));
const gl=await page.evaluate(()=>{const c=document.querySelector('canvas');const gl=c.getContext('webgl2')||c.getContext('webgl');return gl?{version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER)}:null});
if(!gl)throw new Error('Headless WebGL unavailable');console.log('WEBGL',JSON.stringify(gl));
const keySec=[0.8,3.7,6.7,9.8,12.7,15.9,17.5,19.8,20.7];const keyFrames=new Set(keySec.map(s=>Math.min(meta.FRAMES-1,Math.round(s*meta.FPS))));
for(let f=0;f<meta.FRAMES;f++){
  await page.evaluate((x)=>window.setFrame(x),f);
  const path=`frames/${String(f).padStart(5,'0')}.png`;await page.screenshot({path,type:'png'});
  if(keyFrames.has(f))await copyFile(path,`keyframes/${String(f).padStart(5,'0')}.png`);
  if(f%48===0)console.log(`frame ${f}/${meta.FRAMES}`);
}
await browser.close();server.close();
function run(cmd,args){return new Promise((ok,bad)=>{const p=spawn(cmd,args,{stdio:'inherit'});p.on('exit',c=>c===0?ok():bad(new Error(`${cmd} exited ${c}`)));});}
await run('ffmpeg',['-y','-framerate',String(meta.FPS),'-i','frames/%05d.png','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart','Interfold_E3_DemoFoundry053_ThreeJS.mp4']);
await run('ffmpeg',['-y','-pattern_type','glob','-i','keyframes/*.png','-vf','scale=426:240,tile=3x3:padding=8:margin=8','-frames:v','1','Interfold_E3_DemoFoundry053_contact_sheet.jpg']);
console.log('DONE');
