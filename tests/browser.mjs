import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {cardReply,taskPack} from '../src/logic.js';
const base=process.env.TEST_BASE||'http://127.0.0.1:5173';
const artifacts=path.resolve('../../tmp/verification');await fs.mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/echo',async route=>{const {index,quote}=route.request().postDataJSON();await route.fulfill({json:cardReply(index,quote)});});
try{
 await page.goto(base);await page.getByRole('heading',{name:'从一个漫长的白天出发'}).waitFor();
 await page.screenshot({path:path.join(artifacts,'desktop-home.png'),fullPage:true});
 await page.getByRole('button',{name:'风从哪边来',exact:true}).click();await page.getByRole('button',{name:'让回音石听见',exact:true}).click();
 await page.getByRole('button',{name:'我想改一改'}).click();assert.equal(await page.locator('#discovery').inputValue(),'风从哪边来');
 await page.getByRole('button',{name:'让回音石听见',exact:true}).click();await page.getByRole('button',{name:'确认，刻下发现并继续'}).click();
 assert.match(await page.locator('.question-card h3').textContent(),/你关心风/);
 const quotes=['借风小站','让海面少一点垃圾','原来休息也很勇敢','风会把地面的轻物吹向哪里'];
 for(let i=0;i<quotes.length;i++){await page.locator('#discovery').fill(quotes[i]);await page.getByRole('button',{name:'让回音石听见',exact:true}).click();await page.getByRole('button',{name:i===3?'确认，生成我的路牌':'确认，刻下发现并继续'}).click();}
 await page.getByRole('button',{name:'保存路牌图片'}).waitFor();assert.equal(await page.getByRole('button',{name:'保存路牌图片'}).isEnabled(),true);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('nature-atom-tern-v1')));assert.equal(saved.records.length,5);assert.equal(saved.nextQuestion,quotes[3]);
 await page.locator('#sign-name').fill('借风小站');const pngPromise=page.waitForEvent('download');await page.getByRole('button',{name:'保存路牌图片'}).click();const png=await pngPromise;await png.saveAs(path.join(artifacts,'milestone.png'));const bytes=await fs.readFile(path.join(artifacts,'milestone.png'));assert.equal(bytes.slice(1,4).toString(),'PNG');
 await page.screenshot({path:path.join(artifacts,'milestone-screen.png'),fullPage:true});
 await page.locator('.site-header nav').getByRole('button',{name:'一起跑一场'}).click();await page.getByRole('button',{name:'书里的百米实验'}).click();await page.getByLabel('我的百米秒数').fill('14');assert.match(await page.locator('.you').innerText(),/25.7/);await page.getByRole('button',{name:'一起跑一场',exact:true}).last().click();await page.waitForTimeout(300);assert.ok(Number(await page.locator('#race-time').inputValue())>0);await page.getByRole('button',{name:'暂停比赛'}).click();
 await page.locator('.site-header nav').getByRole('button',{name:'声音猜想'}).click();await page.getByRole('button',{name:'独处，自由聆听'}).click();await page.getByRole('button',{name:'播放自然环境音'}).click();await page.waitForFunction(()=>document.querySelector('audio').currentTime>0,{timeout:10000});await page.getByRole('button',{name:'像短短的口哨'}).click();await page.getByRole('button',{name:'留下一条声音猜想'}).click();await page.getByRole('button',{name:'猜想已保存在这台设备'}).waitFor();
 await page.locator('.site-header nav').getByRole('button',{name:'户外走起！'}).click();await page.locator('#city').fill('成都');await page.getByRole('button',{name:'准备这次的观察卡'}).click();await page.getByLabel('下一页观察卡').click();assert.match(await page.locator('.eink-screen').textContent(),/尚未加载鸟种资料/);
 const readerPromise=page.waitForEvent('download');await page.getByRole('button',{name:'下载离线阅读器'}).click();const reader=await readerPromise;const readerPath=path.join(artifacts,'offline-reader.html');await reader.saveAs(readerPath);
 const offline=await browser.newContext({offline:true,acceptDownloads:true});const op=await offline.newPage();await op.goto('file://'+readerPath);await op.locator('#note').fill('没有遇见鸟，但听到右边短短的声音。');await op.locator('#clue').selectOption('none');await op.locator('#save').click();assert.match(await op.locator('#status').textContent(),/已保存/);const obsPromise=op.waitForEvent('download');await op.locator('#export').click();const obs=await obsPromise;const obsPath=path.join(artifacts,'observations.json');await obs.saveAs(obsPath);await offline.close();
 await page.locator('input[type=file]').setInputFiles(obsPath);await page.waitForFunction(()=>document.querySelector('.status-message')?.textContent.includes('已导入 1 条'));await page.locator('input[type=file]').setInputFiles(obsPath);await page.waitForFunction(()=>document.querySelector('.status-message')?.textContent.includes('已导入 0 条'));await page.getByRole('button',{name:'带着这个发现，再出发'}).click();assert.match(await page.locator('.eink-screen h2').textContent(),/换一种感官/);
 await page.reload();const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('nature-atom-tern-v1')));assert.equal(restored.records.length,5);assert.equal(restored.outdoor.length,1);
 await page.getByRole('button',{name:'带走这段旅程'}).click();await page.locator('.qr').waitFor();assert.equal(await page.getByLabel('公开体验链接').inputValue(),base);await page.getByRole('button',{name:'关闭弹窗'}).click();
 await page.setViewportSize({width:390,height:844});
 for(const name of ['迁徙旅程','一起跑一场','声音猜想','我的路牌','户外走起！']){await page.getByRole('button',{name:'展开导航'}).click();await page.locator('.site-header nav').getByRole('button',{name,exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`mobile overflow ${name}`);await page.screenshot({path:path.join(artifacts,`mobile-${name}.png`),fullPage:true});}
 assert.deepEqual(errors,[]);console.log('PASS: five stations, confirmation/edit, dynamic branch, PNG export, race, MP3 playback, offline reader, import/dedup, persistence, QR, five mobile screens.');
}finally{await browser.close();}
