# 2026-10-11 验证记录

## 软件已通过

- `npm run build`：React/Vite 生产构建。
- `npm test`：17项内容门控、真实输入分支、金句来源、声音匹配、测量单位与遥测时效测试。
- `node tests/device.mjs`：任务领取、落盘ACK契约、确认观察、重试去重、凭证校验。
- `node tests/live-device.mjs`：命令游标、运动遥测、重启/迟到包、WAV格式、人工转写、原话确认和下一问。
- `node tests/voice-browser.mjs`：公开HTTPS入口，模拟麦克风采集→真实阿里云ASR→可编辑文字→确认保存；ASR成功不会自动生成记录。
- `node tests/asr-adapter.mjs`：模拟转写服务验证WAV→候选文字，不把候选文字自动保存成观察。
- `node tests/browser.mjs`：五站迁徙、动态分支、路牌导出、声音播放、离线导入、存档、二维码、四入口手机布局。
- `node tests/revision.mjs`：旧存档、金句、落脚和不确定性、直接速度对比、竞猜两人揭晓与手机布局。
- `node tests/motion-browser.mjs`：四入口、直接书页速度对比、点按→感受→路牌、模拟板端实时遥测、断联停止、手机宽度与文字兜底。
- `node tests/offline-loop.mjs`：独立HTML断网分支、说话者、刷新恢复、记录导出。
- `g++ -std=c++11 -Ifirmware/include firmware/test/motion.cpp`：静止、校准重置、零偏、0.5–2Hz平滑摆臂、传感器陈旧、停止和完成状态。

Playwright运行需已安装Chromium；本工作区使用 `PLAYWRIGHT_BROWSERS_PATH=../../tmp/browsers`。设备HTTP测试使用模拟遥测。真实ASR测试使用公开语音样本作为浏览器模拟麦克风输入，不能当成实体手机或板子收音验证。

## 本次固件构建与镜像验证

- PlatformIO 完成本次全部应用源文件编译。宿主 C++ 测试覆盖摆臂峰值估算、停止保留峰值、校准及完成状态。
- 常规链接受工作区随机写入延迟影响；使用同一原生链接器、同一输入参数和环境，将 ELF／map 输出到匿名内存，原生链接返回 0。随后顺序写回工作区。原先缓慢的链接任务主动停止，因此不把本次记作整条 `pio run` 的 SUCCESS。
- 使用平台构建脚本相同的 esptool 参数生成镜像：ESP32-S3、DIO、80 MHz、16 MB Flash。
- 新应用镜像 **1,539,280 字节**；六段，镜像 checksum 和 SHA-256 验证均通过，低于 5 MB 应用分区。
- ELF SHA-256：`be2d26d67b5d83923ffcfb7a099b20e9f6d0f735c9b24193d422c2edd0ee58c4`。
- 包中 bootloader、分区表与 boot_app0 沿用上次校验通过的同一配置。镜像包含新增 `peakKmh` 与“峰值估算”界面。

esptool 所示 `arduino-lib-builder` 与 2025 时间来自预编译 SDK 描述字段；源码为本项目当天开发，源码提交及各烧录文件 SHA-256 随包记录。此构建验证不代替实际烧录。

## 尚须现场确认
- 真机：USB识别、实际烧录、PSRAM、中文刷新、陀螺仪阈值、8秒录音声道/音量、Wi-Fi/TLS、离线断电恢复。
- ASR：阿里云真实接口与公开链接上的浏览器录音链路已通过；尚需现场验证孩子语音、口音及噪声环境的准确率。
- 现场：第二部真实手机扫码、麦克风权限与浏览器语音支持。
- AI回音：此前网关访问层返回HTML 403，实时LLM未验通；知识卡回音明确标记，不宣传为实时AI识别。

17:53开发冻结后，只按合并单做现场验收与阻断修复。所有真机结论由实际连接设备的Qoder环境补记。
