import React,{useEffect,useState} from 'react';
import {Compass,Flag,Headphones,Footprints,ArrowUpRight,X,Link,Check,BookOpen,Menu} from 'lucide-react';
import QRCode from 'qrcode';
import useDeviceSync from './useDeviceSync.js';
import {loadState,STORAGE_KEY,initialState} from './logic.js';
import {SOURCES} from './content.js';
import {Bird} from './components/Illustrations.jsx';
import Journey from './components/Journey.jsx';
import Race from './components/Race.jsx';
import MotionRace from './components/MotionRace.jsx';
import Listen from './components/Listen.jsx';
import Badge from './components/Badge.jsx';
import Outdoor from './components/Outdoor.jsx';
const NAV=[['journey','迁徙旅程',Compass],['race','一起跑一场',Footprints],['listen','声音猜想',Headphones],['badge','我的路牌',Flag]];
export default function App(){const [state,setState]=useState(loadState);const [tab,setTab]=useState('journey');const [sources,setSources]=useState(null);const [share,setShare]=useState(false);const [qr,setQr]=useState('');const [copied,setCopied]=useState(false);const [saveError,setSaveError]=useState(false);const [menu,setMenu]=useState(false);const [reset,setReset]=useState(false);
 useDeviceSync(setState);
 useEffect(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));setSaveError(false);}catch{setSaveError(true);}},[state]);
 useEffect(()=>{if(share)QRCode.toDataURL(location.origin,{width:240,margin:2,color:{dark:'#203e48',light:'#ffffff'}}).then(setQr).catch(()=>{});},[share]);
 useEffect(()=>{function key(e){if(e.key==='Escape'){setShare(false);setSources(null);setReset(false);}}window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
 function navigate(t){setTab(t);setMenu(false);window.scrollTo({top:0,behavior:'instant'});}
 async function copy(){try{await navigator.clipboard.writeText(location.origin);setCopied(true);}catch{setCopied(false);}}
 return <><header className="site-header"><button className="brand" onClick={()=>navigate('journey')} aria-label="自然原子相机，返回迁徙旅程"><Bird/><span>自然原子<span className="brand-sub">NATURE ATOM / 每日观鸟</span></span></button><nav className={menu?'open':''} aria-label="主导航">{NAV.map(([id,label,Icon])=><button className={tab===id?'active':''} onClick={()=>navigate(id)} key={id}><Icon size={15}/>{label}{id==='badge'&&state.records.length>0&&<span className="nav-dot"/>}</button>)}</nav><div className="header-actions"><button className="share-button" onClick={()=>setShare(true)}>带走这段旅程<ArrowUpRight size={15}/></button><button className="menu-button" aria-label="展开导航" aria-expanded={menu} onClick={()=>setMenu(!menu)}><Menu size={22}/></button></div></header>
 {saveError&&<div className="save-warning" role="alert">浏览器未能保存进度。离开前请在“我的路牌”导出手记。</div>}
 <main>{tab==='journey'&&<Journey state={state} setState={setState} onBadge={()=>{setState(s=>({...s,activeBadge:'journey'}));navigate('badge');}} onSources={setSources}/>}{tab==='race'&&<><MotionRace state={state} setState={setState} onBadge={()=>{setState(s=>({...s,activeBadge:'challenge'}));navigate('badge');}}/><details className="adult-tools"><summary>同行大人 · 观察测量与书本实验</summary><Race state={state} setState={setState} onSources={setSources} onBadge={()=>{setState(s=>({...s,activeBadge:'challenge'}));navigate('badge');}}/></details></>}{tab==='listen'&&<Listen state={state} setState={setState} onBadge={()=>{setState(s=>({...s,activeBadge:'listening'}));navigate('badge');}}/>}{tab==='badge'&&<Badge state={state} setState={setState} onJourney={()=>navigate('journey')} onOutdoor={()=>navigate('outdoor')}/>}{tab==='outdoor'&&<Outdoor state={state} setState={setState} onSources={setSources} onBadge={()=>{setState(s=>({...s,activeBadge:'outdoor'}));navigate('badge');}}/>}</main>
 <footer><span>自然原子相机<span className="footer-separator">/</span>身体去感受，回音石来记住。</span><div><button className="device-link" onClick={()=>navigate('outdoor')}>户外走起！· 装入阅读器</button><button onClick={()=>setSources(SOURCES.map(s=>s.id))}><BookOpen size={13}/>资料与创作说明</button><button onClick={()=>setReset(true)}>重新开始</button><span>SHIP IT SUNDAY · AI FOR KIDS</span></div></footer>
 {(sources||share||reset)&&<div className="modal-backdrop" onClick={()=>{setSources(null);setShare(false);setReset(false);}}><section className="modal" role="dialog" aria-modal="true" aria-label={sources?'资料与创作说明':share?'带走这段旅程':'重新开始旅程'} onClick={e=>e.stopPropagation()}><button className="close-modal" aria-label="关闭弹窗" onClick={()=>{setSources(null);setShare(false);setReset(false);}} autoFocus><X size={22}/></button>
 {sources&&<><span className="eyebrow">事实有来源，想象有边界</span><h2>旅程背后的知识卡</h2><p>角色口吻、关卡与问题是原创游戏。路线是研究启发的教学示意，不是所有燕鸥的固定航线。</p><div className="source-list">{SOURCES.filter(s=>sources.includes(s.id)).map(s=><article key={s.id}><h3>{s.url?<a href={s.url} target="_blank" rel="noreferrer">{s.label}<ArrowUpRight size={14}/></a>:s.label}</h3><p>{s.note}</p></article>)}</div><p className="fine-print">自由聆听环境音由用户提供；竞猜使用有来源标注的欧乌鸫与家麻雀参考录音。手机手记保存在当前设备；连接板子时，确认的记录与待处理录音会暂存本次设备会话。公开分享入口不包含原话或录音。</p></>}
 {share&&<div className="share-content"><span className="eyebrow">给一个也想出发的人</span><h2>带走一段迁徙，<br/>带回一个问题。</h2>{qr?<img className="qr" src={qr} alt="扫码打开新的自然原子迁徙旅程"/>:<p>正在生成二维码…</p>}<p>扫码开始自己的旅程。<br/>不会分享你的私人手记。</p><input aria-label="公开体验链接" readOnly value={location.origin}/><button className="primary full" onClick={copy}>{copied?<Check size={16}/>:<Link size={16}/>} {copied?'入口链接已复制':'复制体验入口'}</button></div>}
 {reset&&<><h2>开启一段新的旅程？</h2><p>这会清除本设备里的迁徙刻印和户外记录。建议先在“我的路牌”保存手记。</p><div className="badge-actions"><button className="secondary" onClick={()=>setReset(false)}>保留这段旅程</button><button className="primary" onClick={()=>{setState(initialState());setReset(false);navigate('journey');}}>确认重新开始</button></div></>}
 </section></div>}
 </>;
}
