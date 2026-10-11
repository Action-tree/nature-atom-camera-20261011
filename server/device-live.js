import express from 'express';
import {randomUUID} from 'node:crypto';
// Capability authorization is installed by device.js before these routes.
export function liveRoutes(router){
 router.post('/:code/command',(req,res)=>{
  const q=req.queue;const {action}=req.body;
  if(!['calibrate','start','stop','read'].includes(action))return res.status(400).json({error:'无效命令'});
  q.commands??=[];if(q.commands.length>=64)q.commands.shift();
  const command={seq:++q.commandSeq,action,runId:randomUUID(),expiresAt:Date.now()+15000};q.commands.push(command);res.json(command);
 });
 router.get('/:code/commands',(req,res)=>{const after=Number(req.query.after||0);if(!Number.isSafeInteger(after)||after<0)return res.sendStatus(400);res.json({commands:(req.queue.commands||[]).filter(c=>c.seq>after&&c.expiresAt>Date.now()),cursor:req.queue.commandSeq});});
 router.post('/:code/motion',(req,res)=>{
  const q=req.queue,m=req.body;
  if(typeof m.bootId!=='string'||m.bootId.length>64||!m.bootId||!Number.isSafeInteger(m.seq)||m.seq<0||typeof m.runId!=='string'||m.runId.length>80||!['idle','calibrating','ready','running','finished','error'].includes(m.phase)||!['strokes','cadence','gameSpeed','progress'].every(k=>Number.isFinite(m[k])&&m[k]>=0)||m.strokes>10000||m.cadence>300||m.gameSpeed>12||m.progress>100)return res.status(400).json({error:'无效运动数据'});
  q.retiredBoots??=[];if(q.retiredBoots.includes(m.bootId))return res.status(409).json({error:'旧启动会话'});
  if(q.motion?.bootId===m.bootId&&m.seq<=q.motion.seq)return res.json({ok:true,duplicate:true});
  if(q.motion&&q.motion.bootId!==m.bootId){q.retiredBoots.push(q.motion.bootId);if(q.retiredBoots.length>16)q.retiredBoots.shift();}
  q.motion={bootId:m.bootId,seq:m.seq,runId:m.runId,phase:m.phase,strokes:m.strokes,cadence:m.cadence,gameSpeed:m.gameSpeed,progress:m.progress,receivedAt:Date.now(),source:'qmi8658',unit:'game_units'};res.json({ok:true});
 });
 router.post('/:code/audio/:eventId',express.raw({type:'audio/wav',limit:'321kb'}),async(req,res)=>{
  const q=req.queue,id=req.params.eventId,b=req.body;q.audio??=new Map();
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id)||!Buffer.isBuffer(b)||b.length<46||b.length>320044||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WAVE'||b.toString('ascii',12,16)!=='fmt '||b.readUInt32LE(16)!==16||b.readUInt16LE(20)!==1||b.readUInt16LE(22)!==1||b.readUInt32LE(24)!==16000||b.readUInt32LE(28)!==32000||b.readUInt16LE(32)!==2||b.readUInt16LE(34)!==16||b.toString('ascii',36,40)!=='data'||b.readUInt32LE(40)!==b.length-44||b.readUInt32LE(4)!==b.length-8||(b.length-44)%2)return res.status(400).json({error:'需16kHz单声道16-bit PCM WAV，最长10秒'});
  if(q.audio.has(id))return res.json({ok:true,eventId:id,status:q.audio.get(id).status,duplicate:true});
  for(const [key,item] of q.audio)if(item.status==='confirmed')q.audio.delete(key);
  if(q.audio.size>=3)return res.status(429).json({error:'请先处理已有录音'});
  const a={eventId:id,status:process.env.NATURE_ASR_URL?'transcribing':'needs_transcript',text:'',wav:b};q.audio.set(id,a);res.status(202).json({ok:true,eventId:id,status:a.status});
  if(process.env.NATURE_ASR_URL){try{const r=await fetch(process.env.NATURE_ASR_URL,{method:'POST',headers:{'Content-Type':'audio/wav',...(process.env.NATURE_ASR_TOKEN?{Authorization:`Bearer ${process.env.NATURE_ASR_TOKEN}`}:{})},body:b,signal:AbortSignal.timeout(20000)});const d=await r.json();if(!r.ok||typeof d.text!=='string'||!d.text.trim()||d.text.length>300)throw Error();if(a.status==='transcribing'){a.text=d.text.trim();a.status='review';a.transcriptSource='asr';}}catch{if(a.status==='transcribing')a.status='needs_transcript';}}
 });
 router.get('/:code/audio/:eventId',(req,res)=>{const a=req.queue.audio?.get(req.params.eventId);if(!a)return res.sendStatus(404);const {wav,...meta}=a;res.json(meta);});
 router.get('/:code/audio/:eventId/wav',(req,res)=>{const a=req.queue.audio?.get(req.params.eventId);if(!a?.wav)return res.sendStatus(404);res.type('audio/wav').send(a.wav);});
 router.post('/:code/audio/:eventId/transcript',(req,res)=>{const a=req.queue.audio?.get(req.params.eventId),t=req.body?.text;if(!a)return res.sendStatus(404);if(a.status==='confirmed')return res.status(409).json({error:'记录已确认'});if(typeof t!=='string'||!t.trim()||t.length>300)return res.sendStatus(400);a.text=t.trim();a.status='review';a.transcriptSource='adult_transcription';res.json({ok:true});});
}
