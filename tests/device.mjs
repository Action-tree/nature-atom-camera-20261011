import assert from 'node:assert/strict';import {taskPack} from '../src/logic.js';
const base=process.env.TEST_BASE||'http://127.0.0.1:5173';
async function post(url,body){return fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}
const pack=taskPack('上海','park','鸟在哪里歇脚？');
const create=await post('/api/device/queue',{pack});assert.equal(create.status,200);const {code}=await create.json();assert.match(code,/^[a-f0-9]{32}$/);
const task=await(await fetch(base+`/api/device/${code}/task`)).json();assert.equal(task.id,pack.id);
assert.equal((await post(`/api/device/${code}/ack`,{taskId:'wrong',stored:true})).status,400);
assert.equal((await post(`/api/device/${code}/ack`,{taskId:pack.id,stored:true})).status,200);
const event={taskId:pack.id,eventId:'device-event-1',quote:'没遇见鸟，但有树叶的声音。',confirmed:true};
const first=await(await post(`/api/device/${code}/observations`,event)).json();const repeat=await(await post(`/api/device/${code}/observations`,event)).json();assert.equal(first.id,repeat.id);assert.equal(repeat.duplicate,true);
const status=await(await fetch(base+`/api/device/${code}/status`)).json();assert.equal(status.records.length,1);assert.equal(status.acknowledged,true);
assert.equal((await fetch(base+'/api/device/not-a-code/task')).status,404);
assert.equal((await post('/api/echo',{index:99,quote:'test'})).status,400);
console.log('PASS: task queue, download, task-id validation, ACK, observation upload, retry deduplication, sync, unknown capability, API validation. Hardware transport simulated; not a physical ESP32 test.');
