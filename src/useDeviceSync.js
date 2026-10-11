import {useEffect,useState} from 'react';
import {pairedDevice} from './deviceClient.js';
export default function useDeviceSync(setState){const [device,setDevice]=useState(pairedDevice);
 useEffect(()=>{const f=()=>setDevice(pairedDevice());window.addEventListener('nature-device',f);return()=>window.removeEventListener('nature-device',f);},[]);
 useEffect(()=>{if(!device)return;let alive=true,busy=false;async function sync(){if(busy)return;busy=true;try{const r=await fetch(`/api/device/${device.code}/status`,{signal:AbortSignal.timeout(2500)});if(!r.ok)return;const d=await r.json();if(alive&&d.records?.length)setState(s=>{const ids=new Set(s.outdoor.map(x=>x.id));const fresh=d.records.filter(x=>x.confirmed&&!ids.has(x.id));return fresh.length?{...s,outdoor:[...s.outdoor,...fresh]}:s;});}catch{}finally{busy=false;}}sync();const timer=setInterval(sync,3000);return()=>{alive=false;clearInterval(timer);};},[device?.code,setState]);
}
