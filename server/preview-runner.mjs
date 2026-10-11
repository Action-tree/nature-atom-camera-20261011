// Keep the preview HTTP worker under the platform's managed process tree.
// Credentials stay in the inherited environment; never log or write them.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const entry=fileURLToPath(new URL('./index.js',import.meta.url));
let child,timer,stopping=false,delay=1000;
function start(){
 const began=Date.now();
 child=spawn(process.execPath,[entry,'--production'],{env:process.env,stdio:'inherit'});
 child.on('error',e=>console.error('Preview worker could not start:',e.code));
 child.on('exit',(code,signal)=>{
  if(stopping){process.exitCode=0;return;}
  if(Date.now()-began>60000)delay=1000;
  console.error(`Preview worker exited (${code??signal}); restarting in ${delay}ms.`);
  timer=setTimeout(start,delay);delay=Math.min(30000,delay*2);
 });
}
function stop(){
 if(stopping)return;stopping=true;clearTimeout(timer);
 if(child&&child.exitCode===null){child.kill('SIGTERM');setTimeout(()=>child?.kill('SIGKILL'),4000).unref();}
}
process.on('SIGTERM',stop);process.on('SIGINT',stop);start();
