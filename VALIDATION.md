# 2026-10-11 验证记录

## 软件已通过

- `npm run build`：React/Vite 生产构建。
- `npm test`：15项内容门控、真实输入分支、金句来源、声音匹配、测量单位与遥测时效测试。
- `node tests/device.mjs`：任务领取、落盘ACK契约、确认观察、重试去重、凭证校验。
- `node tests/live-device.mjs`：命令游标、运动遥测、重启/迟到包、WAV格式、人工转写、原话确认和下一问。
- `node tests/asr-adapter.mjs`：模拟转写服务验证WAV→候选文字，不把候选文字自动保存成观察。
- `node tests/browser.mjs`：五站迁徙、动态分支、路牌导出、声音播放、离线导入、存档、二维码、四入口手机布局。
- `node tests/revision.mjs`：旧存档、金句、落脚和不确定性、幕后测量、竞猜两人揭晓与手机布局。
- `node tests/motion-browser.mjs`：四入口、隐藏表单、点按→感受→路牌、模拟板端实时遥测、断联停止、手机宽度与文字兜底。
- `node tests/offline-loop.mjs`：独立HTML断网分支、说话者、刷新恢复、记录导出。
- `g++ -std=c++11 -Ifirmware/include firmware/test/motion.cpp`：静止、校准重置、零偏、0.5–2Hz平滑摆臂、传感器陈旧、停止和完成状态。

Playwright运行需已安装Chromium；本工作区使用 `PLAYWRIGHT_BROWSERS_PATH=../../tmp/browsers`。设备HTTP和ASR测试都是明确的模拟输入，不能当成物理录音或真实运动测试。

## 固件构建已通过

`pio run -j 6`：SUCCESS；目标ESP32-S3，Arduino ESP32 3.2.0 / pioarduino 54.03.20。

- 静态RAM：48,908 / 327,680字节（14.9%）；不含运行时堆分配。
- 程序Flash：1,537,810 / 5,242,880字节（29.3%）。
- 已生成 `firmware.bin`、启动镜像与分区表。启动与应用镜像校验均通过，Flash为16MB；分区边界已核对。应用镜像1,538,208字节。
- 原生PlatformIO完成编译、链接和生成镜像。首次构建的主要耗时来自工具链安装和工作区磁盘I/O。

注：esptool里的 `arduino-lib-builder` 名称及2025时间字段来自预编译Arduino SDK描述，不是本项目源码的创建日期；源码版本和烧录文件SHA-256另在烧录包记录。

## 尚须现场确认
- 真机：USB识别、实际烧录、PSRAM、中文刷新、陀螺仪阈值、8秒录音声道/音量、Wi-Fi/TLS、离线断电恢复。
- ASR：尚未连接真实转写服务；无服务时有听音补文字途径。
- 现场：第二部真实手机扫码、麦克风权限与浏览器语音支持。
- AI回音：此前网关访问层返回HTML 403，实时LLM未验通；知识卡回音明确标记，不宣传为实时AI识别。

17:53开发冻结后，只按合并单做现场验收与阻断修复。所有真机结论由实际连接设备的Qoder环境补记。
