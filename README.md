# 自然原子相机 · 每日观鸟

[板端能力、按键与交付边界](BOARD_DELIVERY.md) · [下载完整源码和已编译烧录包](https://github.com/Action-tree/nature-atom-camera-20261011/releases/tag/hackathon-20261011)

展示入口：https://5173-capy-1773292403825-216435-preview.happycapy.ai

2026-10-11 为 Ship it Sunday #014「AI for Kids」从零创建的独立项目。首个可玩主题：跟随北极燕鸥，遇见两个夏天。未复用 Action-Tree 历史代码。

## 当前交付

网页保留四个入口：迁徙旅程、一起跑一场、声音猜想、我的路牌。“户外走起！”在页脚进入，负责装入阅读器任务；现实对手和测量表单收进同行大人工具。

- 摆臂速度：ESP32遥测驱动估算 km/h、摆臂频率与书页速度对比；按0.8米假设步长换算。静止校准、断联归零，完成后留下感受收进路牌。手机点按标记为模拟。
- 语音优先：网页实际采集麦克风，编码16 kHz WAV，经服务端阿里云ASR转写。文字可编辑，确认后保存；需要联网及麦克风权限。
- 板子手账：三页任务和六种线索分支、LittleFS本地保存、拨杆翻页、按键8秒录音、联网转写候选、孩子确认后入路牌。Arduino完整源码在 `firmware/`。
- 真实记录有依据：路牌可点击回看原话，选择金句；飞行、落脚、风、食物等主题来自确认的内容。
- 声音竞猜使用两段有来源的欧乌鸫/家麻雀参考录音，匹配才显影；原环境音保留自由聆听。

**开始合并请读 [QODER_HANDOFF.md](QODER_HANDOFF.md)。** 固件说明见 [firmware/README.md](firmware/README.md)。真机须由已连接设备的Qoder环境烧录并验收，不把软件模拟当真机结果。

## 运行

Node.js 20.19+ / 22.12+。在此目录执行：

```bash
npm install
npm run dev
```

服务使用 5173 端口；`PORT` 可覆盖。生产模式：

```bash
npm run build
npm start
```

浏览器页面与 API 由同一 Node 服务提供。独立离线HTML另行下载使用；主网页不是已缓存离线的PWA。公开部署应使用 HTTPS，以保证剪贴板、浏览器存储与设备权限正常。音频原文件由用户提供，当前工作区已复制到 `public/nature.mp3`，未纳入 Git。新环境需自行放入有使用权的同名音频。

阿里云转写：服务端设置 `DASHSCOPE_API_KEY`，网页和板端共享转写器。接口与现场验收见 [最新增量](UPDATE_SPEED_ASR.md)。也兼容外部适配器：设置服务端 `NATURE_ASR_URL`，接收 `audio/wav`、返回 `{text}`；可选 `NATURE_ASR_TOKEN`。无配置时使用大人听音补文字，再交孩子确认，绝不伪造ASR。

AI 接口仅读取服务端环境变量 `AI_GATEWAY_BASE_URL`、`AI_GATEWAY_API_KEY`。默认模型 `openai/gpt-5.6-luna`，可由 `NATURE_ATOM_MODEL` 覆盖为账户可用的受支持模型。不要把密钥放在前端或仓库。

## 已实现

- 五站迁徙地图与知识/人文卡；地域文化延伸不伪装成鸟的实际到访。
- 逐站输入、回音、修改和确认；没有确认不解锁刻印。
- “风/食物/歇脚”的兴趣会改变第二站任务；“垃圾/食物”等约定会改变最终问题。
- 四维刻印、原话与下一问构成个性化路牌；羽翼两侧的风纹、鱼纹、岛形或日光与首站表达关联。
- 路牌 PNG 和 Markdown 手记导出，进度保存在设备本地。
- 鸵鸟/郊狼/博尔特/走鹃/孩子的交互竞速与时间滑块，明确最高与平均速度的差别。
- 用户音频播放、声音描述、想象轮廓和猜想存档；不自动识别鸟种。
- 上海区域参考和通用生境任务、电子纸预览、离线 HTML 与任务 JSON 下载、观察导入和去重。
- 真实描述产生不同的下一轮观察任务：未遇鸟→换感官；声音→再比较；取食→看食物关系。
- HTTP 设备任务、确认存储、命令、陀螺仪遥测、WAV接收、候选转写、原话确认与同步接口。
- 公开入口二维码不含儿童记录；设备凭证单独保管。重新开始前有确认。

## 当前交付边界

本次实测 AI 网关被 Cloudflare 访问层返回 HTTP 403（HTML），并非已确认的 `model_access_denied` 模型套餐错误。当前展示采用明确标记的知识卡模式；实时模型回音尚未验通。知识卡模式是检索/规则驱动，不宣传为实时生成式 AI。

若模型端返回明确的 `model_access_denied`，前端显示升级提示，不自动改用其他模型。其他超时或网络错误转知识卡。

尚未获得完整《何以为鸟》；只核读用户提供的封面、迁徙图与竞速页，并查阅公开来源。本轮已提供板端驱动集成与断网应用源码；真实阿里云ASR及浏览器录音链路已用公开语音样本验证；实际 ESP32 联通、物理录音质量需Qoder现场验证。蓝牙未接入。浏览器离线阅读器测试不等同于真机测试。

新项目已独立初始化 Git；远端 GitHub 尚未创建/推送。现有 CLI 登录不可用；聊天中暴露的凭据不存储到项目，应撤销并通过安全方式重新授权。

## 验证

```bash
npm test
```

浏览器流程测试需要开发依赖与 Chromium：

```bash
npm install --include=dev
npx playwright install chromium --only-shell
node tests/browser.mjs
node tests/revision.mjs
node tests/motion-browser.mjs
node tests/live-device.mjs
```

测试默认同机服务，`TEST_BASE` 可改为测试环境地址。五站流程使用明确的知识卡测试响应，不能将测试通过当作实时模型通过。

## 文件导航

- `src/content.js`：五站剧本、知识卡来源、本地生境。
- `src/logic.js`：门控、分支、里程碑、竞速和户外下一轮。
- `src/components/`：迁徙、竞速、聆听、路牌、户外界面。
- `src/reader.js`：独立离线阅读器生成。
- `server/index.js`：网页服务与 AI 边界。
- `server/device.js`：设备领取/确认/同步。
- `QODER_HANDOFF.md`：交给 Qoder 的墨水屏接口契约；`firmware/`：独立固件与可移植运动核心。

地图采用 Natural Earth 数据，经 `world-atlas` 分发。轮廓和路牌为代码绘制的原创矢量图；迁徙路线是教学示意。
