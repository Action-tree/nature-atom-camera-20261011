# 本次更新：摆臂速度与真实语音

## 展示方式

“一起跑一场”直接展示估算速度、摆臂次数、频率，以及鸵鸟／郊狼／博尔特／走鹃的速度对比。没有“同行大人”额外菜单，连接设置收在右上角按钮。手机点按体验明确标记为模拟。

换算公式：`估算 km/h = cadence × 0.8 × 60 ÷ 1000`。cadence 是每分钟交替摆臂脉冲，假设每次对应一步、步长 0.8 米。120 次/分钟对应 5.76 km/h；100 米匀速外推为 62.5 秒。原地摆臂也会产生数字，不能声称是实际跑速、距离或步数。书页动物值是近似最高速度，博尔特为百米平均速度。主画面保留简短标识，公式在“计算与来源”。

## 给 Qoder 的合并顺序

1. 网页更新：`MotionRace.jsx`、`SpeedComparison.jsx`、`motionMath.js`、`motion.css`、`VoiceInput.jsx`、`voiceCapture.js`，以及 App、Journey、content 的对应改动。
2. 服务端：加入 `server/asr.js`，合并 `index.js`、`device-live.js`。安装现有 package-lock 的依赖，运行 `npm run build` 后 `npm start`。
3. 服务端环境变量 `DASHSCOPE_API_KEY` 设置为阿里云百炼 API Key。不要使用 `VITE_` 前缀，不要把密钥放进固件或前端。不需要 AccessKey ID、AccessKey Secret 或 Create Token。
4. 固件：`MotionEngine.h` 新增 `peakKmh`，`Network.cpp` 上传该字段，`main.cpp` 结束页显示估算峰值。旧固件的 `cadence` 仍可驱动网页；板端结果页需要新固件。
5. 既有接口、针脚、Wi-Fi 配置方式保持兼容。服务重启会清空 RAM 设备会话；需要重新生成连接码并写入板子。恢复待上传记录时保留原任务 ID，详见 QODER_HANDOFF.md。

## 语音 API

- `GET /api/voice/status`：是否已配置、最长录音秒数。
- `POST /api/voice/jobs`：原始 `audio/wav`，16 kHz／单声道／16-bit PCM，0.5–20 秒。返回 202 `{id,status:"transcribing"}`。
- `GET /api/voice/jobs/:id`：轮询 `transcribing / done / failed`。成功含 `text`，失败含面向用户的 `error`。
- `DELETE /api/voice/jobs/:id`：删除临时转写结果。五分钟过期；音频不落盘。

网页通过 getUserMedia 获取麦克风、编码 WAV 并上传，不依赖 Web Speech Recognition。录音按钮再次点击结束，20 秒自动结束。文字回填后可以编辑，需要用户确认才进入手记。转写期间停止编辑，离开页面停止麦克风并取消请求。

板端原有 `/api/device/:code/audio/:eventId` 同样接入此阿里云转写器，候选文字仍需板端确认。未配置阿里云时兼容原 `NATURE_ASR_URL` 外部转写接口。

使用阿里云北京兼容接口 `qwen3-asr-flash`，可用服务端 `DASHSCOPE_ASR_URL` 调整地域端点。凭据只在当前服务进程内配置，重启部署需重新注入环境变量。源码和烧录包不含凭据。

## 现场验收

- 放稳并校准：手机显示 0；开始摆臂后，速度和“我”的对比条同步变化。
- 停止摆臂后归零；数据超过 1.5 秒未更新归零；完成页保留本次峰值。
- 结束后板子显示摆臂次数和估算峰值；手机记录感受，点击路牌能回看原话。
- 手机授权麦克风，说一句话，结束后得到可编辑文字；确认前不生成手记。
- 第二部手机打开链接；有真实板子时可输入同一连接码查看数据。

服务端与自动化测试不能替代板子的麦克风收音、墨水屏显示、户外摆臂和两部实体手机验证。

阿里云接口参考：https://www.alibabacloud.com/help/en/model-studio/qwen-asr-api-reference
