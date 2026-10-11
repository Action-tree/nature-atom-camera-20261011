# ESP32-S3-ePaper-3.97 固件

为 2026-10-11 自然原子相机 Demo 新写的应用。板卡底层驱动来自 Waveshare 官方示例，保留授权头。板子不是触摸屏，使用 GPIO 4/5/6 三向拨杆与 GPIO 0 BOOT。

优先交给此前已经连通该板子的 Qoder 环境测试。本环境没有用户的物理 USB 连接，不执行远程烧录，不宣称真机通过。

已通过完整编译、链接和镜像生成。也可下载[已编译烧录包](../../自然原子相机-ESP32烧录包.zip)，按其中说明交给Qoder烧录。

## 两种接入方式

**已有稳定驱动，优先合并。** 复制 `include/MotionEngine.h`，按照 [QODER_HANDOFF.md](../QODER_HANDOFF.md) 的调度、HTTP 和状态约定接入；保留原工程的供电、显示、音频驱动。Arduino 与 ESP-IDF 均可调用这个不依赖 Arduino 的纯 C++ 类。

**没有可用应用，独立构建。** `platformio.ini` 固定 pioarduino 54.03.20 / Arduino ESP32 3.2.0，SensorLib 0.3.1。核心 N16R8，16 MB flash，OPI PSRAM；分区 2×5 MB 应用和约 5.9 MB LittleFS。更换分区前先导出旧板数据。PlatformIO的基础板型名称仍显示DevKitC-N8，工程已覆盖为16MB Flash和qio_opi内存配置；请以配置与实际板卡N16R8为准。

```bash
cd firmware
pio run
pio run -t upload --upload-port <实际串口>
pio device monitor --baud 115200 --port <实际串口>
```

仅主机验证运动逻辑：

```bash
g++ -std=c++11 -Iinclude test/motion.cpp -o motion-test
./motion-test
```

## 第一次启动

串口 115200，发送一行 JSON，最后回车（串口不回显密码）：

```json
{"ssid":"家庭或热点WiFi","password":"WiFi密码","server":"https://你的网页服务域名","code":"网页生成的32位领取凭证"}
```

`server` 不带 `/api`，不带路径；HTTP 只用于可信本地网络。HTTPS 校验证书，内置 GTS Root R4 与 ISRG Root X1；另一个证书链需替换 `include/TrustRoots.h`。配置保存在 NVS。连接会先通过 SNTP 对时，TLS 失败请先排查时钟与证书，勿使用 `setInsecure()`。

在网页“一起跑一场 → 同行大人 · 连接墨水屏”生成凭证；户外场景在页脚“户外走起！· 装入阅读器”准备地域、任务后生成。每次新凭证需要同步更新板子串口配置。网页同时只保存一个当前连接。

如果 `storage=0`，先确认没有需要救回的旧资料。全新文件系统可发送 `FORMAT_FIRST_USE`，随后重启；已挂载的存储会拒绝这个命令。程序不自动格式化。该命令不是错误恢复的第一步。

## 孩子的操作

| 状态 | 上/下 | 中键 | 长按中键 | BOOT |
|---|---|---|---|---|
| 户外手账 | 翻页；长文分段 | 选择发现线索 | 菜单 | 录下8秒声音 |
| 线索选择 | 六类图案与线索切换 | 确认，显示下一任务 | 菜单 | 新录音，最多8条待同步 |
| 运动 | 不切换 | 校准／开始／停止 | 菜单 | 先停止运动后录音 |
| 原话确认 | 分段回看 | 最后一段后确认 | 菜单 | 退回给大人修改 |

开机时不要按住 BOOT，否则可能进入下载模式。PWR 保留板卡本身电源功能。

校准需约2秒连续静止；挥动时会重新计数。摆臂保持握持方向，轻柔前后摆动。计算的是角速度往返脉冲，既不是步数，也不是距离：`游戏速度=min(10,每分钟脉冲数/20)` 格/秒，赛道100格。停止后再次开始会开启新一场。进度在网页显示为完成百分比。新增峰值估算 `peakKmh=max(peakKmh,cadence×0.048)`，假设每次脉冲对应0.8米一步。网页显示估算km/h，板端完成页显示峰值。没有GNSS/UWB位置输入，这不是实测跑速、距离或百米成绩。

## 离线循环

任务落盘成功才 ACK。三页任务及六类 `localLoop` 保存于 LittleFS；断网仍可翻页、录音、选择线索并显示下一任务。**离线分支由孩子的线索选择触发，不冒充离线 AI 听懂录音。** 联网转写后读给孩子看，确认文字才同步至网页路牌。

- `/task.json`：任务与本地分支。
- `/local.json`：最近一次下一问，重启恢复。
- `/outbox.json`：最多8个待同步录音/观察，含 taskId、eventId、clue、status。
- `/voice-*.wav`：16 kHz / mono / signed 16-bit PCM，8秒约256 KB。
- `/journal.json`：最近100条孩子确认的原话。

上传失败保留 outbox 与音频；观察接口成功后才删除对应音频/outbox。JSON 用临时文件加重命名提交。音频采集失败不会伪造转写；需真机检查音量、声道和采样率。

串口 `EXPORT_JOURNAL` 导出确认记录；`EXPORT_TASK` 导出当前任务。串口导出包含家庭原话，请由家庭保管。

## 音频转写

推荐服务端设置 `DASHSCOPE_API_KEY`，自动使用阿里云Qwen ASR。也可设置 `NATURE_ASR_URL`，约定 `POST audio/wav → {"text":"转写文字"}`；可选 `NATURE_ASR_TOKEN`。不配置时保留录音，网页阅读器的设备区可由大人听音补文字，随后板子确认。没有调用不存在的 ASR 模型或把默认文本当识别结果。

服务内队列有效6小时，重启会丢失。板子任务/录音不丢。恢复时导出原任务（保留原 id），重新 `POST /api/device/queue {pack: 原任务}`，把新 code 写入板子；**不要用不同 id 的新任务替代尚有待同步记录的旧任务**。上传过的音频如果服务端返回404，会重新进入待上传状态。

## 代码分工

- `MotionEngine.h`：纯C++校准、往返计数、虚拟速度和赛道状态。
- `Sensors.cpp`：I²C QMI8658，50 Hz 采样任务，不使用 GPIO39 作为传感器中断。
- `Display.cpp`：800×480一位画布；中文逻辑字号16、2倍绘制；按页/状态刷新，BUSY 最多等12秒。
- `StorageAudio.cpp`：ES8311 与 I²S 录音；LittleFS 原子JSON。
- `Network.cpp`：HTTP任务、命令、遥测、WAV上传、文字回看和 outbox 重试。
- `main.cpp`：拨杆、BOOT、手账分支、原话确认、串口配网。

## 驱动来源与差异

官方仓库 https://github.com/waveshareteam/ESP32-S3-ePaper-3.97 ，参考 commit `9b12d40731a80213b927ee8a421cae4082952819`。

`lib/WaveshareEPD` 来自 Arduino `02_E-Paper_Example`；仅关闭无效的 -1 电源 GPIO，并给 BUSY 添加12秒超时标记。`lib/ES8311` 来自 `01_Audio_Test`（Espressif Apache-2.0 标记保留）。SensorLib、Adafruit GFX、U8g2字体由 PlatformIO 安装，遵循各自授权。

无触屏假设；没有接入太阳能、电池电量、OTA、麦克风自动唤醒、现场鸟种识别或板端 LLM。这些不属于本次闭环。
