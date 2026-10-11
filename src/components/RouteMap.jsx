import React from 'react';
import {geoEquirectangular,geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import world from 'world-atlas/land-110m.json';
import {STOPS} from '../content.js';
const proj=geoEquirectangular().center([-25,0]).scale(217).translate([360,330]);
const path=geoPath(proj);const land=feature(world,world.objects.land);
const pt=(lon,lat)=>proj([lon,lat]).map(v=>v.toFixed(1)).join(',');
const south=`M${pt(-30,71)} C${pt(-47,62)} ${pt(-43,52)} ${pt(-34,47)} S${pt(-22,25)} ${pt(-17,15)} C${pt(-10,-5)} ${pt(8,-6)} ${pt(11,-25)} S${pt(-4,-52)} ${pt(-35,-65)}`;
const north=`M${pt(-35,-65)} C${pt(-1,-54)} ${pt(23,-33)} ${pt(10,-23)} C${pt(-12,3)} ${pt(-56,9)} ${pt(-55,25)} S${pt(-32,51)} ${pt(-30,71)}`;
export default function RouteMap({active,completed,onSelect}){return <div className="map-wrap">
 <div className="map-topline"><span className="micro">FIELD ATLAS / 001</span><span className="map-pill">跟着夏天飞行</span></div>
 <svg className="route-map" viewBox="0 0 720 660" role="img" aria-label="北极燕鸥从格陵兰经大西洋向南极迁徙，再沿 S 形路线返回的示意图">
 <defs><pattern id="ocean-dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".65" fill="#9dbac0" opacity=".27"/></pattern><filter id="land-shadow"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#456a76" floodOpacity=".06"/></filter></defs>
 <rect width="720" height="660" fill="url(#ocean-dots)"/>
 {[-60,-30,0,30,60].map(lat=><g key={lat}><line x1="0" y1={proj([0,lat])[1]} x2="720" y2={proj([0,lat])[1]} stroke="#bed1d2" strokeWidth=".7" strokeDasharray="3 7"/><text x="16" y={proj([0,lat])[1]-6} className="map-degree">{Math.abs(lat)}°{lat>0?'N':lat<0?'S':''}</text></g>)}
 <path d={path(land)} fill="#f5f8ee" stroke="#cbd9cf" strokeWidth="1" filter="url(#land-shadow)"/>
 <text x="84" y="155" className="land-label">北美洲</text><text x="149" y="428" className="land-label">南美洲</text><text x="567" y="152" className="land-label">欧洲</text><text x="542" y="314" className="land-label">非洲</text><text x="319" y="631" className="land-label">南极洲</text><text x="235" y="304" className="ocean-label">大 西 洋</text>
 <path d={`M${pt(-34,47)} C${pt(-19,23)} ${pt(-44,6)} ${pt(-43,-21)} S${pt(-43,-48)} ${pt(-35,-65)}`} fill="none" stroke="#c9ad8f" strokeWidth="1.5" strokeDasharray="4 7"/>
 <path d={north} fill="none" stroke="#4f8075" strokeWidth="2" strokeDasharray="6 6" opacity={active===4?1:.5}/><path d={south} fill="none" stroke="#c96741" strokeWidth="2.5"/>
 <text x="281" y="392" fill="#527969" fontSize="11" transform="rotate(-48 281 392)">借风北返</text>
 {STOPS.slice(0,4).map((s,i)=>{const [x,y]=proj(s.coord);const selected=i===(active===4?0:active);return <g key={s.id} onClick={()=>onSelect(i)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(i);}}} aria-label={`${s.short}${i>completed?'，尚未抵达':''}`} className="map-stop"><circle cx={x} cy={y} r="23" fill="transparent"/>{selected&&<circle cx={x} cy={y} r="19" fill="#c96741" opacity=".12"/>}<circle cx={x} cy={y} r={selected?9:5} fill={i<=completed?'#c96741':'#e6eff0'} stroke="#c96741" strokeWidth="2"/><text x={x+20} y={y-8} className="stop-label">{s.short}</text><text x={x+20} y={y+9} className="stop-sub">{s.num} / {s.place.split(' · ')[0]}</text></g>;})}
 <g transform="translate(611 502)"><circle r="29" fill="none" stroke="#8ca9ac" strokeWidth=".7"/><path d="M0 -22L6 13L0 7L-6 13Z" fill="#254751"/><text y="-36" textAnchor="middle" className="map-degree">N</text></g>
 </svg>
 <div className="map-bottom"><div><span className="line-key south"/>南迁 <span className="line-key north"/>北返</div><span>研究启发的航线示意 · 非实时追踪</span></div>
 <div className="map-stat"><strong>70,900 <small>km</small></strong><span>2010 年研究样本的平均年度往返<br/>每只鸟，都有不同的路。</span></div>
 </div>;}
