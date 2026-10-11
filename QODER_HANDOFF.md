# Qoder 合并与真机验收单

[下载完整网页与固件源码包](../自然原子相机-Qoder源码包.zip)。解压后进入 `arctic-tern`。另有[已编译烧录包](../自然原子相机-ESP32烧录包.zip)，可减少现场下载编译工具链的时间。

完整固件已通过编译与链接；[验证记录](VALIDATION.md)。真机结果仍须现场补记。

目标：当天 Demo；网页四入口，板子独立带任务到户外。请先使用已有成功驱动，避免整套重写。所有硬件验证需要你所在电脑连接的 ESP32-S3-ePaper-3.97；本交付不代表已经烧录。

## 最短合并路线

1. 备份当前可用固件和板上资料。确认旧工程是 Arduino 还是 ESP-IDF、真实串口及板卡版本。
2. 保留旧工程已验证的显示/I²C/音频。先合并 `firmware/include/MotionEngine.h`，以50 Hz输入陀螺仪 deg/s 和加速度模长 g。
3. 对齐下面三个运动接口；网页无需替换其他部分。先验证静止校准、开始、停止、断联与100格完成。
4. 然后合并任务包落盘与确认，使用拨杆翻页；六类 `localLoop` 离线可选。
5. 最后接录音和转写；已有 ASR 复用。来不及时以网页语音或大人补文字兜底，必须标识输入来源。

独立 Arduino 方案完整在 `firmware/`。该方案用 PlatformIO / Arduino ESP32 3.2.0，不要求你把已有 ESP-IDF 工程迁回 Arduino。

## 已核对的硬件

官方资料：https://docs.waveshare.net/ESP32-S3-ePaper-3.97

| 部件 | 连接 / 参数 |
|---|---|
| MCU | ESP32-S3-WROOM-1-N16R8，16MB Flash、8MB PSRAM |
| 电子纸 | 800×480，3.97英寸；本次黑白文字 |
| EPD SPI | SCK11 / MOSI12 / CS10 / DC9 / RST46 / BUSY3 |
| I²C | SDA41 / SCL42 |
| 运动 | QMI8658，轮询；先探0x6B，再0x6A |
| 音频 | ES8311，I²C地址0x18 |
| I²S | MCLK13 / BCLK14 / LRCK47 / DOUT48 / DIN21 |
| 功放 | GPIO39；本次录音时保持静音，不作IMU中断 |
| 拨杆 | 上4 / 中5 / 下6，低有效，内部上拉 |
| BOOT | GPIO0，低有效；运行时触发8秒录音 |

引脚依据官方 Arduino 示例与 ESP-IDF 完整例程 `button_bsp.c`。不要把同系列别的屏幕引脚代入，也不要按屏幕大小猜分辨率。官方示例中的 EPD_PWR=-1 已在本交付中禁用。

## 运动状态约定

`idle → calibrating → ready → running → finished`；传感器异常为 `error`。停止回 `ready`，下次 start 新开一场。没有校准不能开始。

伪代码（使用自己的锁和调度）：

```cpp
MotionEngine engine;
// 用户静止校准时：
engine.calibrate();
// 50 Hz采样；若原驱动输出rad/s，必须先乘180/PI。
engine.sample(gx_dps, gy_dps, gz_dps, accel_magnitude_g, monotonic_ms);
// ready后按键或网页start：
engine.start();
// 与采样相同的互斥锁内读取，再释放锁做网络请求：
auto snapshot = engine.snapshot(monotonic_ms);
```

如果原驱动的加速度单位是 m/s²，先除以9.80665；ESP-IDF时间可用 `uint32_t(esp_timer_get_time()/1000)`。

2秒连续静止、陀螺仪零偏扣除、主轴正负阈值45 deg/s、220 ms最短间隔、240次/分钟上限。每次前向/后向达到阈值计一个摆动脉冲，不称作完整步数。没有新摆动约1.1秒后速度归零；采样断流150ms后快照速度归零。持续超2秒读不到IMU时驱动报 error。

映射：`min(10, cadence / 20)` 格/秒；100格完成。不要换成实际m/s或km/h。字体刷新不参与积分：采样独立任务50 Hz、网络约250ms循环加请求耗时、屏幕只在页/阶段变化刷新。

## HTTP 协议（同一网页服务）

`BASE` 为网页服务域名，带 `https://`。手机、板子可以各自联网，不要求彼此直连；局域网 Demo 可同热点连接本机服务的 LAN IP。

1. 网页 `POST /api/device/queue`，正文 `{"pack":taskPack}`，取得6小时随机 `code`。
2. 板子 `GET /api/device/{code}/task`；LittleFS保存成功后 `POST /ack`：

```json
{"taskId":"任务原始id","stored":true}
```

3. 网页 `POST /api/device/{code}/command`：

```json
{"action":"calibrate"}
```

action 为 `calibrate/start/stop/read`；返回 `{seq,action,runId,expiresAt}`，命令15秒内有效。板子 `GET /commands?after=上次seq`，返回 `{commands,cursor}`。固件按顺序入队；NVS保留当前code的游标，避免重启重复执行旧命令。执行成功由下一次 motion.phase 体现；HTTP发出命令不等于执行成功。

4. 板子 `POST /api/device/{code}/motion`：

```json
{"bootId":"每次启动随机id","seq":1,"runId":"start命令的runId","phase":"running","strokes":12,"cadence":90,"gameSpeed":4.5,"progress":28.3}
```

本机中键开始时自行产生runId。seq 在同boot内递增；重复不更新freshness，旧boot退役后不接受迟到包。服务端记 receivedAt；网页超过1.5秒没有新数据即停止显示速度，保留最后进度，不外推运动。若公网TLS延迟明显，优先用同热点本地服务测试。

5. `GET /api/device/{code}/status`：

```json
{"acknowledged":true,"records":[],"expiresAt":0,"serverNow":0,"motion":null,"audio":[]}
```

网页收到 `records` 自动按id去重放入户外路牌；同时可在设备区手动同步。

## 音频与原话确认

- `POST /api/device/{code}/audio/{eventId}`，Content-Type `audio/wav`，body为WAV字节。
- 只接收规范44字节头的16kHz / mono / 16-bit PCM，最长10秒；固件8秒。每队列最多3个未处理云端录音，本地最多8条。
- 返回202；再 `GET /audio/{eventId}` 查询：`needs_transcript/transcribing/review/confirmed`。
- 有ASR时服务端 `NATURE_ASR_URL` 收WAV，返回 `{"text":"..."}`，可用 `NATURE_ASR_TOKEN`。服务地址和密钥只放Node服务环境变量。
- 无ASR时网页设备区可播放声音并 `POST /audio/{eventId}/transcript {"text":"..."}`，来源标为成人转写。
- 板子展示候选文字；孩子读完并按中键，才 `POST /observations`。

```json
{"taskId":"任务id","eventId":"与音频相同的id","quote":"看见两只鸟，一只滑行后落在电线上，像鸽子但不确定。","clue":"landing","confirmed":true}
```

服务端依据孩子确认的clue产生下一问，保留“不确定”原话。`landing → 落脚前翅膀或尾巴怎样变化`；`none → 原地换感官`。不是任意鸟种识别，不将读书想象算作实地记录。

该接口200后板子才删除outbox和WAV；服务端释放原声缓冲区，保留文字至会话过期。断网选择线索照样进入下一轮；转写和生成路牌可延迟。

## 网页文件位置

| 文件 | 责任 |
|---|---|
| `src/App.jsx` | 四个主入口；户外阅读器放在页脚 |
| `src/components/MotionRace.jsx` | 设备运动／显式点按兜底／感受入路牌 |
| `src/components/VoiceInput.jsx` | 浏览器语音优先，文字可展开；确认前不保存 |
| `src/deviceClient.js` | 配对、命令、遥测时效判断 |
| `src/useDeviceSync.js` | 已确认板端观察自动入网页手记 |
| `src/components/DeviceInbox.jsx` | 大人补录音文字，交还孩子确认 |
| `src/components/Outdoor.jsx` | 本地任务准备、离线包和设备区 |
| `server/device.js` / `device-live.js` | 能力凭证、任务、记录、命令、运动和音频接口 |

原来的现实对手、身长比较和百米实验留在“一起跑一场”底部折叠的家长工具；不占主展示。旧localStorage数据兼容。

## 17:53 前的真机验收顺序

- 显示：中文可读，连续翻3页；BUSY异常不拖死IMU和网络。
- 运动：桌上静止0进度；校准后轻摆可推进；停止归零；重开新runId；拔网网页不假跑。
- 户外：ACK后断手机与Wi-Fi，仍读任务；选择“落脚”确实换下一问；重启恢复。
- 记录：8秒声音可播放、转写可修改；板子确认前不进路牌；重试一次只留一条；失败时outbox仍在。
- 手机：第二部手机扫码独立打开，四入口可玩；私密原话不会跟公开入口分享。

10分钟还没通IMU，就切手机点按；10分钟还没通录音，就用网页语音或大人输入。保留问题日志，17:53冻结新功能，最后一小时只做验证、修复阻断和提交。

## 已知边界

队列目前内存保存、6小时过期。主服务重启需重新配对；板端任务与原声不自动抹去。恢复旧outbox时必须用导出的原任务id创建新队列，见 `firmware/README.md`。网页声音是浏览器语音服务，不保证所有手机或离线可用。默认地域上海是家庭可改的任务区域，不是GPS定位结果。

今日先验证亲子循环与内容有效性；长续航、低功耗、随时录音、多人云账户、完整地区鸟库及板端AI留到下一轮。
