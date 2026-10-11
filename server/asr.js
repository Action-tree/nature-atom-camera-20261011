import express from 'express';
import {randomBytes} from 'node:crypto';
export function asrConfigured(){return !!(process.env.DASHSCOPE_API_KEY||process.env.NATURE_ASR_URL);}
export function validateWav(b,maxSeconds=20){
 if(!Buffer.isBuffer(b)||b.length<44+16000||b.length>44+maxSeconds*32000)return false;
 return b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WAVE'&&b.toString('ascii',12,16)==='fmt '&&b.readUInt32LE(16)===16&&b.readUInt16LE(20)===1&&b.readUInt16LE(22)===1&&b.readUInt32LE(24)===16000&&b.readUInt32LE(28)===32000&&b.readUInt16LE(32)===2&&b.readUInt16LE(34)===16&&b.toString('ascii',36,40)==='data'&&b.readUInt32LE(40)===b.length-44&&b.readUInt32LE(4)===b.length-8&&(b.length-44)%2===0;
}
export async function transcribeWav(wav){
 let r,text;
 if(process.env.DASHSCOPE_API_KEY){
  r=await fetch(process.env.DASHSCOPE_ASR_URL||'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',{method:'POST',signal:AbortSignal.timeout(25000),headers:{Authorization:`Bearer ${process.env.DASHSCOPE_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:'qwen3-asr-flash',messages:[{role:'user',content:[{type:'input_audio',input_audio:{data:`data:audio/wav;base64,${wav.toString('base64')}`}}]}],stream:false,asr_options:{language:'zh',enable_itn:true}})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(r.status===401||r.status===403?'语音服务授权未通过，请检查阿里云配置。':'语音服务暂不可用，请重试或写下来。');e.status=r.status;e.providerCode=String(d.error?.code||d.code||'unknown').slice(0,60);throw e;}
  text=d.choices?.[0]?.message?.content;
 }else if(process.env.NATURE_ASR_URL){
  r=await fetch(process.env.NATURE_ASR_URL,{method:'POST',signal:AbortSignal.timeout(25000),headers:{'Content-Type':'audio/wav',...(process.env.NATURE_ASR_TOKEN?{Authorization:`Bearer ${process.env.NATURE_ASR_TOKEN}`}:{})},body:wav});
  const d=await r.json();if(!r.ok)throw Error('语音服务暂不可用。');text=d.text;
 }else throw Error('语音服务尚未配置，可以先写下来。');
 if(typeof text!=='string'||!text.trim())throw Error('没有听清，请靠近麦克风再说一次。');
 return text.trim().slice(0,300);
}
export const voiceRouter=express.Router();
const jobs=new Map(),limits=new Map();let calls=0,active=0;
voiceRouter.get('/status',(_,res)=>res.json({configured:asrConfigured(),maxSeconds:20}));
voiceRouter.post('/jobs',express.raw({type:'audio/wav',limit:'641kb'}),(req,res)=>{
 const now=Date.now();for(const [k,v]of jobs)if(v.expiresAt<now)jobs.delete(k);
 for(const [k,v]of limits)if(now-v.at>600000)limits.delete(k);
 if(!asrConfigured())return res.status(503).json({error:'语音服务尚未配置，可以先写下来。'});
 // Reverse proxies rewrite Host. Fetch Metadata checks the browser's origin relation.
 // No CORS headers are granted; cross-origin audio/wav requests require preflight.
 if(req.get('sec-fetch-site')==='cross-site')return res.status(403).json({error:'请从体验页面录音。'});
 if(!validateWav(req.body))return res.status(400).json({error:'请录制 0.5–20 秒的语音。'});
 const bucket=limits.get(req.ip)||{at:now,n:0};
 if(bucket.n>=20||calls>=250||active>=4||jobs.size>=100)return res.status(429).json({error:'请稍后再说，或先写下来。'});
 bucket.n++;limits.set(req.ip,bucket);calls++;active++;
 const id=randomBytes(24).toString('hex'),job={status:'transcribing',text:'',expiresAt:now+300000};jobs.set(id,job);
 res.status(202).json({id,status:job.status});
 transcribeWav(req.body).then(text=>{job.text=text;job.status='done';},e=>{job.status='failed';job.error=e.name==='TimeoutError'?'这次转写用时较长，请重试或写下来。':e.message;}).finally(()=>{active--;});
});
voiceRouter.get('/jobs/:id',(req,res)=>{res.set('Cache-Control','no-store');const j=jobs.get(req.params.id);if(!j||j.expiresAt<Date.now())return res.status(404).json({error:'录音已过期，请重新说一次。'});res.json(j);});
voiceRouter.delete('/jobs/:id',(req,res)=>{jobs.delete(req.params.id);res.sendStatus(204);});
