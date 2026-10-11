import {badgeData} from './logic.js';
export const MEMORY_TYPES=[['journey','迁徙手记'],['outdoor','户外相遇'],['challenge','万物运动会'],['listening','声音显影']];
export function memoryRecords(state,type){
 if(type==='journey')return state.records.map(r=>({...r,id:'story:'+r.stopId,speaker:'我',label:'迁徙手记',kind:'story'}));
 if(type==='outdoor')return state.outdoor.map(r=>({...r,label:r.region?.city||'户外相遇',speaker:r.speaker||'我'}));
 return (state.activities||[]).filter(r=>r.category===type);
}
export function memoryBadge(state,type){
 const records=memoryRecords(state,type);const old=badgeData(state);const text=records.map(r=>r.quote).join(' ');
 let motif=type==='journey'?old.motif:type==='listening'?'sound':/蚂蚁|搬运|体重/.test(text)?'ant':/蚯蚓|土/.test(text)?'earth':/滑[行翔]|降落|落[脚地]|电线/.test(text)?'landing':/吃|食|啄/.test(text)?'fish':/风/.test(text)?'wind':type==='challenge'?'trail':'leaf';
 if(type==='outdoor'&&records.at(-1)?.clue){const c=records.at(-1).clue;motif=({landing:'landing',flight:'wind',sound:'sound',food:'forage',none:'leaf',change:'leaf'})[c]||motif;}
 const goldenId=state.golden?.[type];const chosen=records.find(r=>r.id===goldenId)||records.find(r=>r.dimension==='feeling')||records.at(-1);
 const defaultNames={forage:'食物旁的小小联系',landing:/一秒|1\s*秒/.test(text)?'一秒钟的落脚处':'飞行停下的地方',sound:'听见的小小世界',ant:'小身体的大本领',earth:'脚下的另一条路',trail:'万物各有一程',leaf:'今天的自然回音',wind:'风经过的地方',fish:'与食物相遇'};
 return { ...old,type,motif,records,wire:/电线|高压线|电杆/.test(text),birdCount:/两只|2\s*只/.test(text)?2:1,quote:chosen?.quote||'下一句回音，等你来写。',name:state.badgeNames?.[type]||(type==='journey'?state.name||old.name:defaultNames[motif]||'我的自然回音'),next:type==='journey'?old.next:records.at(-1)?.nextQuestion||'再回来看看，有什么不同。',complete:type==='journey'?old.complete:records.length>0,sourceLabel:MEMORY_TYPES.find(t=>t[0]===type)?.[1]||'自然手记',date:(records.at(-1)?.at||state.createdAt||new Date().toISOString()).slice(0,10),goldenId:chosen?.id,motifReason:type==='journey'?old.motifReason:text.slice(0,80)};
}
export function addActivity(state,activity){return {...state,activities:[...(state.activities||[]),{id:crypto.randomUUID(),at:new Date().toISOString(),confirmed:true,speaker:'我',...activity}]};}
export function memoryMarkdown(state){return '# 自然原子 · 我的回音手记\n\n'+MEMORY_TYPES.map(([type,label])=>{const records=memoryRecords(state,type);return `## ${label}\n\n`+(records.length?records.map(r=>`### ${r.speaker||'我'} · ${r.at?.slice(0,10)||''}\n\n${r.quote}\n\n${r.echo?'回音：'+r.echo+'\n\n':''}${r.nextQuestion?'下一问：'+r.nextQuestion+'\n\n':''}`).join(''):'还没有记录。\n\n');}).join('');}
