// Capture raw microphone PCM, then encode canonical 16 kHz mono WAV for browser + ESP32 parity.
export function encodeWav(chunks,sourceRate){
 const length=chunks.reduce((n,c)=>n+c.length,0),input=new Float32Array(length);let offset=0;
 for(const c of chunks){input.set(c,offset);offset+=c.length;}
 const count=Math.floor(length*16000/sourceRate),b=new ArrayBuffer(44+count*2),v=new DataView(b);
 const word=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};
 word(0,'RIFF');v.setUint32(4,b.byteLength-8,true);word(8,'WAVE');word(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,16000,true);v.setUint32(28,32000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,count*2,true);
 for(let i=0;i<count;i++){const start=Math.floor(i*sourceRate/16000),end=Math.min(length,Math.floor((i+1)*sourceRate/16000));let sum=0;for(let j=start;j<end;j++)sum+=input[j];const x=Math.max(-1,Math.min(1,sum/Math.max(1,end-start)));v.setInt16(44+i*2,x<0?x*32768:x*32767,true);}
 return new Blob([b],{type:'audio/wav'});
}
export async function openMicrophone(){
 if(!navigator.mediaDevices?.getUserMedia)throw Error('请用系统浏览器打开链接，或先写下来。');
 const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});
 let context,source,processor,gain;const chunks=[];let closed=false,total=0;
 const cleanup=()=>{processor?.disconnect();source?.disconnect();gain?.disconnect();stream.getTracks().forEach(t=>t.stop());context?.close().catch(()=>{});};
 try{const AC=window.AudioContext||window.webkitAudioContext;context=new AC();await context.resume();source=context.createMediaStreamSource(stream);processor=context.createScriptProcessor(4096,1,1);gain=context.createGain();gain.gain.value=0;processor.onaudioprocess=e=>{if(!closed&&total<context.sampleRate*20){const c=new Float32Array(e.inputBuffer.getChannelData(0));chunks.push(c.subarray(0,Math.min(c.length,context.sampleRate*20-total)));total+=chunks[chunks.length-1].length;}};source.connect(processor);processor.connect(gain);gain.connect(context.destination);
 return {stop(){if(closed)return null;closed=true;cleanup();if(total<context.sampleRate*.5)throw Error('多说一点点，再按完成。');return encodeWav(chunks,context.sampleRate);},cancel(){closed=true;cleanup();}};
 }catch(e){cleanup();throw e;}
}
export async function transcribeRecording(wav,signal){
 const r=await fetch('/api/voice/jobs',{method:'POST',headers:{'Content-Type':'audio/wav'},body:wav,signal});
 const job=await r.json();if(!r.ok)throw Error(job.error||'录音没有送达，请重试。');
 try{const until=Date.now()+32000;while(Date.now()<until){signal.throwIfAborted();await new Promise(resolve=>setTimeout(resolve,500));const p=await fetch(`/api/voice/jobs/${job.id}`,{signal});const d=await p.json();if(!p.ok||d.status==='failed')throw Error(d.error||'没有听清，请再说一次。');if(d.status==='done')return d.text;}throw Error('这次转写用时较长，可以先写下来。');}
 finally{fetch(`/api/voice/jobs/${job.id}`,{method:'DELETE',keepalive:true}).catch(()=>{});}
}
