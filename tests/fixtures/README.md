# 语音测试素材

`aliyun-welcome.wav` 来自阿里云公开示例 https://dashscope.oss-cn-beijing.aliyuncs.com/audios/welcome.mp3 ，仅做语音接口联调。使用浏览器解码并转为 16 kHz 单声道 PCM WAV，未改变声音内容。它不是孩子或用户的录音。

`tests/voice-browser.mjs` 将它作为浏览器模拟麦克风输入，会调用当前服务端配置的真实 ASR。验证录音上传、文字回填和确认保存，不代表实体设备收音或中文准确率评测。
