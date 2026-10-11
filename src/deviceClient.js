const KEY='nature-atom-device-v1';
export function pairedDevice(){try{const d=JSON.parse(localStorage.getItem(KEY));return /^[a-f0-9]{32}$/.test(d?.code)&&d.expiresAt>Date.now()?d:null;}catch{return null;}}
export function rememberDevice(d){try{localStorage.setItem(KEY,JSON.stringify(d));}catch{}window.dispatchEvent(new Event('nature-device'));return d;}
export async function pairDevice(pack){const r=await fetch('/api/device/queue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pack})});if(!r.ok)throw Error('设备队列暂不可用');return rememberDevice(await r.json());}
export async function deviceCommand(code,action){const r=await fetch(`/api/device/${code}/command`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});if(!r.ok)throw Error('设备队列已过期，请重新连接');return r.json();}
export function usableMotion(data,now=Date.now()){const m=data?.motion;return m&&data.serverNow-m.receivedAt<=1500&&now-(data.clientReceivedAt||0)<=1500?m:null;}
