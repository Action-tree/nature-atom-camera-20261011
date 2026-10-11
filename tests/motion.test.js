import test from 'node:test';import assert from 'node:assert/strict';import {usableMotion} from '../src/deviceClient.js';
test('stale telemetry never becomes live merely because HTTP polling succeeds',()=>{
 const d={motion:{receivedAt:1000,gameSpeed:4},serverNow:1001,clientReceivedAt:9000};
 assert.equal(usableMotion(d,9100).gameSpeed,4);assert.equal(usableMotion({...d,serverNow:2501},9100),null);assert.equal(usableMotion(d,10501),null);
});
