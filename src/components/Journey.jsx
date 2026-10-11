import React,{useState,useEffect} from 'react';
import {ArrowRight,Feather,BookOpen,Check,ChevronDown,Send,RotateCcw} from 'lucide-react';
import {STOPS} from '../content.js';
import {confirmRecord,journeyStop,cardReply} from '../logic.js';
import VoiceInput from './VoiceInput.jsx';
import RouteMap from './RouteMap.jsx';
export default function Journey({state,setState,onBadge,onSources}){
 const [view,setView]=useState(Math.min(state.records.length,4));const [quote,setQuote]=useState('');const [echo,setEcho]=useState(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [detail,setDetail]=useState(false);
 const stop=journeyStop(state,view);const saved=state.records[view];const previous=state.records[view-1];
 useEffect(()=>{setQuote('');setEcho(null);setError('');setDetail(false);},[view]);
 async function listen(){if(quote.trim().length<2){setError('写两个字以上，或选一个你喜欢的想法。');return;}setBusy(true);setError('');try{const r=await fetch('/api/echo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({index:view,quote:quote.trim()}),signal:AbortSignal.timeout(22000)});const data=await r.json();if(data.error==='model_access_denied'){setError(data.message);return;}if(!r.ok)throw Error();setEcho({...data,quote:quote.trim()});}catch{setEcho({...cardReply(view,quote.trim()),quote:quote.trim()});}finally{setBusy(false);}}
 function confirm(){const next=confirmRecord(state,view,echo.quote,echo.echo,echo.mode);setState(next);if(view===4)onBadge();else setView(view+1);}
 return <><section className="journey-heading"><div><div className="eyebrow"><span/>每日观鸟 · 第一封迁徙手记</div><h1>跟着一只燕鸥，<br/><em>去遇见两个夏天。</em></h1><p>用一个问题出发，把自己的发现刻成路牌。</p></div><div className="journey-count"><span>你的远行手记</span><strong>{String(state.records.length).padStart(2,'0')}<i>/ 05</i></strong><span>不赶路，每一站都可以停一停。</span></div></section>
 <section className="journey-grid"><RouteMap active={view} completed={state.records.length} onSelect={i=>{if(!busy&&i<=state.records.length)setView(i);}}/>
 <div className="journal-panel"><div className="chapter-nav">{STOPS.map((s,i)=><button key={s.id} disabled={i>state.records.length||busy} onClick={()=>setView(i)} className={view===i?'active':''} aria-label={`第${i+1}站 ${s.short}`} aria-current={view===i?'step':undefined}>{i<state.records.length?<Check size={14}/>:s.num}</button>)}<span>第 {view+1} 站 / 共 5 站</span></div>
 <article className="field-card"><div className="field-meta"><span>{stop.place}</span><span>{stop.season}</span></div><h2>{stop.title}</h2><p className="fact-text">{stop.fact}</p>
 <button className="text-button" onClick={()=>setDetail(!detail)} aria-expanded={detail}><BookOpen size={14}/>翻开这一站的故事<ChevronDown size={14}/></button>
 {detail&&<div className="story-detail"><p>{stop.detail}</p><h4>{stop.humanTitle}</h4><p>{stop.human}</p><button className="text-button" onClick={()=>onSources(stop.sources)}>查看资料来源</button></div>}
 </article>
 {saved?<div className="saved-note"><span className="eyebrow">这一站，你留下了</span><blockquote>“{saved.quote}”</blockquote><p>{saved.echo}</p><div className="stamp-label"><Check size={16}/>{stop.stamp}已刻下 · {saved.mode==='ai'?'AI 回音':'知识卡回音'}</div><button className="primary" onClick={()=>view===4?onBadge():setView(view+1)}>继续旅程<ArrowRight size={17}/></button></div>:<div className="question-card">
 {previous&&<div className="previous-note">上一站，你说：“{previous.quote.slice(0,42)}{previous.quote.length>42?'…':''}”</div>}
 <span className="eyebrow"><Feather size={14}/>留下你的{stop.stamp}</span><h3>{stop.prompt}</h3>
 {!echo?<><div className="choice-list">{stop.choices.map(c=><button key={c} className={quote===c?'selected':''} onClick={()=>{setQuote(c);setError('');}} disabled={busy}>{c}</button>)}</div>
 <VoiceInput id="discovery" value={quote} onChange={setQuote} disabled={busy} placeholder={stop.hint} label="我的发现、想法或问题"/>
 <button className="primary full" onClick={listen} disabled={busy||quote.trim().length<2}>{busy?'回音石正在读你的话…':'让回音石听见'}{!busy&&<Send size={16}/>}</button></>:<div className="echo-note" aria-live="polite"><span className="mode-label">{echo.mode==='ai'?'AI 回音 · 依据本关知识卡':'知识卡回音 · 模板模式'}</span><blockquote>“{echo.quote}”</blockquote><p>{echo.echo}</p>{echo.mode==='ai'&&<p className="followup">带着想一想：{echo.followup}</p>}<span className="confirm-caption">这句话和「{stop.stamp}」刻印，是你想留下的吗？</span><button className="primary full" onClick={confirm}>确认，{view===4?'生成我的路牌':'刻下发现并继续'}<ArrowRight size={16}/></button><button className="text-button" onClick={()=>setEcho(null)}><RotateCcw size={13}/>我想改一改</button></div>}
 {error&&<p className="error" role="alert">{error}</p>}
 </div>}
 <div className="panel-footnote">原创游戏 · 阅读与想象旅程，不计为实地观鸟记录</div></div></section></>;
}
