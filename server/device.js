import {Router} from 'express';
import {liveRoutes} from './device-live.js';
import {inferClue,nextFieldTask} from '../src/outdoor.js';
import {randomBytes,randomUUID} from 'node:crypto';
export const deviceRouter=Router();const queues=new Map();
function cleanup(){for(const [key,q] of queues)if(q.expiresAt<Date.now())queues.delete(key);}
deviceRouter.post('/queue',(req,res)=>{
 cleanup();const p=req.body?.pack;
 if(queues.size>=100)return res.status(429).json({error:'队列繁忙'});
 if(p?.schema!=='nature-atom.task.v1'||typeof p.id!=='string'||!Array.isArray(p.pages)||p.pages.length!==3||p.pages.some(x=>typeof x.title!=='string'||x.title.length>80||typeof x.body!=='string'||x.body.length>500)||typeof p.region?.city!=='string')return res.status(400).json({error:'无效任务包'});
 const code=randomBytes(16).toString('hex');const expiresAt=Date.now()+6*3600000;
 queues.set(code,{pack:p,expiresAt,acknowledged:false,records:[],commandSeq:0,commands:[]});res.json({code,expiresAt,acknowledged:false});
});
deviceRouter.use('/:code',(req,res,next)=>{cleanup();const q=queues.get(req.params.code);if(!q)return res.status(404).json({error:'领取凭证不存在或已过期'});req.queue=q;next();});
deviceRouter.get('/:code/task',(req,res)=>res.json(req.queue.pack));
deviceRouter.post('/:code/ack',(req,res)=>{if(req.body.taskId!==req.queue.pack.id||req.body.stored!==true)return res.status(400).json({error:'必须确认对应任务已本地存储'});req.queue.acknowledged=true;res.json({ok:true});});
deviceRouter.post('/:code/observations',(req,res)=>{
 const q=req.queue;const {taskId,quote,eventId}=req.body;
 if(taskId!==q.pack.id||typeof eventId!=='string'||eventId.length>100||!eventId||typeof quote!=='string'||!quote.trim()||quote.length>300||req.body.confirmed!==true)return res.status(400).json({error:'需提供任务ID、唯一事件ID、已确认文字，最多300字'});
 const old=q.records.find(r=>r.eventId===eventId);if(old)return res.json({ok:true,id:old.id,duplicate:true});
 if(q.records.length>=100)return res.status(429).json({error:'本次记录已满'});
 const clue=['sound','flight','landing','food','none','change'].includes(req.body.clue)?req.body.clue:inferClue(quote);
 const next=nextFieldTask(quote,clue);
 const record={clue,echo:next.echo,nextQuestion:next.question,speaker:'我',id:randomUUID(),eventId,taskId,quote:quote.trim(),confirmed:true,kind:'outdoor_self_report',region:q.pack.region,at:new Date().toISOString()};q.records.push(record);const audio=q.audio?.get(eventId);if(audio){audio.status='confirmed';audio.wav=null;}res.json({ok:true,id:record.id});
});
liveRoutes(deviceRouter);
deviceRouter.get('/:code/status',(req,res)=>{const {acknowledged,records,expiresAt,motion,audio}=req.queue;res.json({acknowledged,records,expiresAt,motion:motion||null,serverNow:Date.now(),audio:audio?[...audio.values()].map(({wav,...a})=>a):[]});});
