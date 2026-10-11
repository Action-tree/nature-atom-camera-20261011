import React from 'react';
import {ArrowUpRight, Bird, Footprints, Dog} from 'lucide-react';
import {raceRows} from '../logic.js';
import {projectedHundred} from '../motionMath.js';
export default function SpeedComparison({speed,onSources}){
 const rows=raceRows(14).filter(r=>r.id!=='child');
 rows.push({id:'child',label:'我',speed,note:'随摆臂更新'});
 return <div className="live-comparison"><div className="comparison-heading"><div><span className="eyebrow">书里的百米实验</span><h2>和不同的身体，比一比。</h2></div><span className="comparison-unit">km/h</span></div><div className="speed-lanes">{rows.map(r=>{const Icon=['ostrich','roadrunner'].includes(r.id)?Bird:r.id==='coyote'?Dog:Footprints;return <div className={'speed-lane '+(r.id==='child'?'is-me':'')} key={r.id}><span className="speed-runner"><Icon size={20}/>{r.label}</span><div className="speed-rail"><i style={{width:`${Math.min(100,r.speed/97*100)}%`}}/></div><strong>{r.speed.toFixed(1)}</strong></div>;})}</div><div className="comparison-bottom"><span>照这个节奏，100 米约 <strong>{projectedHundred(speed)?.toFixed(1)||'—'}</strong> 秒</span><button className="text-button" onClick={()=>onSources(['book','bolt','motion'])}>计算与来源<ArrowUpRight size={13}/></button></div><p className="comparison-caption">动物为书页近似最高速度，博尔特为百米平均速度，我为摆臂估算。</p></div>;
}
