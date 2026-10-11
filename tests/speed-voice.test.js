import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateSpeed,projectedHundred} from '../src/motionMath.js';
import {encodeWav} from '../src/voiceCapture.js';
import {validateWav} from '../server/asr.js';
test('arm estimates remain estimates: cadence and assumed step, not gameSpeed',()=>{assert.equal(estimateSpeed(120),5.76);assert.equal(projectedHundred(5.76),62.5);assert.equal(estimateSpeed(0),0);assert.equal(projectedHundred(0),null);assert.equal(estimateSpeed(NaN),0);assert.equal(estimateSpeed(-4),0);assert.equal(estimateSpeed(1000),11.52);});
test('browser recording resamples a 48kHz microphone into firmware-compatible WAV',async()=>{const a=Float32Array.from({length:48000},(_,i)=>Math.sin(i*.12)*.4);const wav=Buffer.from(await encodeWav([a.subarray(0,17000),a.subarray(17000)],48000).arrayBuffer());assert.equal(wav.length,32044);assert.equal(validateWav(wav),true);assert.equal(wav.readUInt32LE(24),16000);wav.writeUInt32LE(44100,24);assert.equal(validateWav(wav),false);});
