import { STOPS, DIMENSIONS, HABITATS } from './content.js';
import {CLUES,nextFieldTask} from './outdoor.js';
export const STORAGE_KEY='nature-atom-tern-v1';
export const initialState=()=>({version:1,records:[],outdoor:[],activities:[],golden:{},badgeNames:{},activeBadge:'journey',nextQuestion:'',name:'',createdAt:new Date().toISOString()});
export function validState(s){return s?.version===1&&Array.isArray(s.records)&&s.records.length<=5&&s.records.every((r,i)=>r.stopId===STOPS[i].id&&typeof r.quote==='string'&&r.quote.length>0&&r.quote.length<=300)&&Array.isArray(s.outdoor);}
export function loadState(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));return validState(s)?{...initialState(),...s}:initialState();}catch{return initialState();}}
export function confirmRecord(state,index,quote,echo,mode){
 const clean=String(quote).trim().slice(0,300);if(!clean||index!==state.records.length||index>=STOPS.length)return state;
 const stop=STOPS[index];return {...state,records:[...state.records,{stopId:stop.id,dimension:stop.dimension,quote:clean,echo:String(echo).slice(0,300),mode,confirmed:true,kind:'story',at:new Date().toISOString()}],nextQuestion:stop.id==='return'?clean:state.nextQuestion};
}
export function journeyStop(state,index){
 const stop={...STOPS[index]};const first=state.records[0]?.quote||'';
 if(index===1&&/风/.test(first)){stop.prompt='你关心风。给一处能借风、也能休息的海上补给站起个名字吧。';stop.choices=['借风小站','顺风歇脚处','风与鱼的约会'];stop.hint='为什么选这个名字？你的回答会成为路牌的一部分。';}
 else if(index===1&&/歇|休息|累/.test(first)){stop.prompt='你关心歇脚。给长途飞行中的休息站起个名字吧，你希望那里有什么？';stop.choices=['安心歇脚湾','不赶路小站','等一等海湾'];}
 else if(index===1&&/吃|鱼|食/.test(first)){stop.prompt='你关心食物。给燕鸥的海上食堂起个名字吧，想想谁也会来。';stop.choices=['鱼群食堂','大家的补给站','一口海洋'];}
 const pledge=state.records[2]?.quote||'';
 if(index===4&&/垃圾/.test(pledge)){stop.prompt='你约定让海面少一点垃圾。回到身边，你想观察什么？';stop.choices=['风会把地面的轻物吹向哪里','附近的鸟在哪里找食物','人和鸟怎样共享一片草地'];}
 else if(index===4&&/食物|鱼|吃/.test(pledge)){stop.prompt='你在意鸟的食物。下次在安全的地方，你想观察哪个问题？';stop.choices=['鸟在树上还是草地找食物','一只鸟会在原地停多久','树和鸟之间有什么联系'];}
 return stop;
}
export function cardReply(index,quote){
 const s=STOPS[index];let echo=s.echo,followup=s.prompt,sourceIds=s.sources;
 if(/[?？]|为什么|怎么|什么|多少|吗/.test(quote)){
  if(/吃|食物|饿/.test(quote)){echo='知识卡里记着：北极燕鸥会吃小鱼、甲壳动物等。远行中需要找到食物丰富的海域，停下来补给。';followup='你会把补给站设在什么样的地方？';sourceIds=['cornell','author'];}
  else if(/多远|多少公里|距离/.test(quote)){echo='2010 年研究中，11 只燕鸥的年度往返平均约 70,900 公里。这是样本平均值，不是每只鸟都飞同样远。';followup='如果远行需要休息，你想在哪种地方停下？';sourceIds=['tracking','author'];}
  else if(/风|直线|弯/.test(quote)){echo='研究中的北返航线形成巨大的 S 形，与盛行风系统相应。路更直，不一定飞起来更合适。';followup='你有没有感受过顺风和逆风的不同？';sourceIds=['author'];}
  else if(/夏天|冬天|南极/.test(quote)){echo='南北半球的季节相反。北方进入冬季时，南方迎来夏季，燕鸥可以在南方遇到较长的白昼。';followup='想到一只鸟遇见两个夏天，你有什么感受？';sourceIds=['author'];}
  else{echo='这张知识卡还不能直接回答你的问题。先把它留下：'+s.fact;followup='你想通过观察，先弄清其中哪一小部分？';}
 }
 return {mode:'knowledge_card',echo,followup,sourceIds};
}
export function badgeData(state){const dims=DIMENSIONS.filter(d=>state.records.some(r=>r.dimension===d.id&&r.confirmed));const ocean=state.records.find(r=>r.stopId==='atlantic');const interest=state.records[0]?.quote||'';const motif=/风/.test(interest)?'wind':/鱼|食|吃/.test(interest)?'fish':/休息|歇/.test(interest)?'island':'sun';return {complete:dims.length===4&&state.records.length===5,dimensions:dims,name:state.name||((ocean?.quote||'追光').slice(0,9)+' · 远行路牌'),quote:state.records.find(r=>r.dimension==='feeling')?.quote||'把一句属于你的话，留给这段旅程。',next:state.nextQuestion||'下次，去听听窗外。',motif,motifReason:interest||'等待第一站的选择'};}
export function outdoorNext(quote){
 if(/没.*鸟|没有遇见|没找到/.test(quote))return {title:'换一种感官，再试一次',body:'不必去追着找鸟。在同一个安全位置，看看叶子有没有动，再听声音从哪里来。仍然没有发现也可以。',question:'这次换用眼睛，和刚才用耳朵有什么不同？'};
 if(/声音|听|叫/.test(quote))return {title:'同一个位置，再听一回',body:'与同行大人站在原来的安全位置，再安静听一会儿。声音的远近、方向或节奏，有没有与你刚才的描述不同？不播放声音引鸟。',question:'同一个位置，两次听到的声音有什么不同？'};
 if(/吃|食|啄/.test(quote))return {title:'食物旁边，还有谁',body:'保持距离，不投喂。看看鸟取食的地方附近还有树、草、水或其他鸟吗？选一个你确实看见的联系说出来。',question:'这只鸟的食物，和身边什么东西有关？'};
 return {title:'回到这条发现旁边',body:'和同行大人回到同一个安全位置，比较鸟的动作或周围环境有没有变化。说一句“刚才……现在……”，一样也可以。',question:'刚才和现在，你发现了什么变化？'};
}
export function raceRows(seconds){return [{id:'ostrich',label:'鸵鸟',speed:97,note:'书页最高速度估计'},{id:'coyote',label:'郊狼',speed:64,note:'书页近似速度'},{id:'bolt',label:'博尔特',speed:360/9.58,note:'100 米 9.58 秒的平均速度'},{id:'roadrunner',label:'走鹃',speed:32,note:'书页最高速度估计'},{id:'child',label:'我',speed:360/seconds,note:`你输入的 100 米 ${seconds} 秒`}].map(r=>({...r,time:360/r.speed}));}
export function taskPack(city,habitat,question){const h=HABITATS[habitat]||HABITATS.park;return {schema:'nature-atom.task.v1',id:crypto.randomUUID(),createdAt:new Date().toISOString(),region:{city:String(city).slice(0,30)||'尚未选择',habitat:h.label,method:'family_selected'},question:String(question||'附近的鸟在哪里歇脚？').slice(0,300),pages:[{id:'go',title:'把屏幕放下，听一会儿',body:h.task},{id:'notice',title:'记录动作，不急着认名字',body:city.includes('上海')?h.clue:'先观察动作与环境。本地区尚未加载鸟种资料，不提供物种判断。'},{id:'return',title:'带一个发现回来',body:'记下：我看见／听见了什么？它在做什么？我还有什么问题？没有遇见鸟也算真实记录。'}],localLoop:CLUES.map(([id,label])=>({id,label,...nextFieldTask('',id)})),safety:'与同行人在一起；不追、不投喂、不播放鸟叫引鸟；远离水边、道路和电力设施。',sourceIds:city.includes('上海')?['shanghai']:[],hardwareStatus:'task-package-only'};}
export function downloadFile(name,content,type='application/json'){const b=content instanceof Blob?content:new Blob([content],{type});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);}
