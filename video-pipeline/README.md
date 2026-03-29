# Video Pipeline 项目

这是一个基础的视频生成项目，用于在 OpenClaw 环境中生成短视频。

## 已安装的组件

✅ ffmpeg - 视频处理工具  
✅ jq - JSON 处理工具  
✅ Noto CJK - 中文字体  
✅ Node.js + npm - 运行环境  
✅ faster-whisper - 可选的语音转文字工具  

## 项目结构

```
video-pipeline/
├── src/
│   └── render-sample.js  # 示例视频渲染脚本
├── output/                # 生成的视频输出目录
└── package.json
```

## 使用方法

### 生成示例视频

```bash
npm run render:sample
```

这会生成一个 10 秒的测试视频，包含测试图案和音频。

### 可用命令

- `npm run render:sample` - 生成示例测试视频

## 下一步

- 准备好可以开始生成第一条视频了！
