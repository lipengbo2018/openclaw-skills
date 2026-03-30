# Video Pipeline 短视频生成管道

使用 AI 配音 + 自动字幕生成 + ffmpeg 渲染的短视频制作工具。

## 功能特点

- 🎤 **AI 配音**：支持 Edge TTS（免费无需 API Key）或 MiniMax API
- 📝 **自动字幕**：支持 Whisper API 转写或时间戳生成
- 🎬 **专业渲染**：ffmpeg 字幕滤镜渲染，渐变背景
- 📱 **竖屏适配**：9:16 竖屏格式，适配抖音/视频号/小红书

## 环境要求

- Node.js 18+
- ffmpeg (需添加到 PATH)
- Python 3.12+ (用于 Edge TTS)
- edge-tts Python 包
- 中文字体文件 (NotoSansSC-Regular.otf)

### 字体文件

视频渲染需要中文字体。首次运行前需要下载字体：

```bash
# Windows PowerShell
mkdir -p fonts
Invoke-WebRequest -Uri "https://fonts.gstatic.com/ea/notosanssc/v1/NotoSansSC-Regular.otf" -OutFile "fonts/NotoSansSC.ttf"

# 或手动下载
# 下载地址：https://fonts.google.com/noto/specimen/Noto+Sans+SC
# 将文件保存为 fonts/NotoSansSC.ttf
```

## 快速开始

### 1. 安装依赖

```bash
cd video-pipeline
npm install
```

### 2. 安装 Python 和 edge-tts (用于免费配音)

```bash
# 安装 Python 3.12
winget install Python.Python.3.12

# 安装 edge-tts
pip install edge-tts
```

### 3. 配置脚本内容

修改 `src/script.js` 中的脚本内容：

```javascript
const scripts = {
  default: `你的脚本内容...`,
};
```

### 4. 运行完整流程

```bash
npm start
```

### 5. 单独运行各步骤

```bash
npm run voice      # 仅生成配音
npm run subtitles  # 仅生成字幕
npm run video      # 仅渲染视频
```

## 配音方案

### 方案一：Edge TTS（推荐，免费）

无需 API Key，安装后即可使用：

```bash
pip install edge-tts
```

可选语音：

| 语音 | 说明 |
|------|------|
| xiaoxiao | 晓晓（女声）- 默认 |
| xiaoyi | 小艺（女声） |
| yunxi | 云希（男声） |
| yunxia | 云夏（男声） |
| yunjian | 云健（男声） |
| yunyang | 云扬（男声，新闻风） |

设置语音：
```bash
EDGE_VOICE=xiaoyi npm run voice
```

### 方案二：MiniMax API（需要 API Key）

1. 创建 `.env` 文件：
```
MINIMAX_API_KEY=your_api_key_here
```

2. 运行配音生成

## 输出文件

生成的文件保存在 `output/` 目录：

| 文件 | 说明 |
|------|------|
| voiceover.mp3 | AI 配音音频 |
| subtitles.json | 字幕时间戳 (JSON) |
| subtitles.srt | 字幕文件 (SRT) |
| video.mp4 | 最终视频 |

## 视频规格

- 分辨率：1080x1920 (9:16 竖屏)
- 帧率：30fps
- 视频编码：H.264 (libx264)
- 音频编码：AAC 128kbps
- 字幕：白色文字带黑色描边

## 故障排除

### ffmpeg 找不到

重启终端，或确保 ffmpeg 已添加到 PATH：

```bash
winget install Gyan.FFmpeg
```

### Edge TTS 失败

1. 确认 Python 已安装：`python --version`
2. 确认 edge-tts 已安装：`pip show edge-tts`
3. 如未安装：`pip install edge-tts`

### 视频生成失败

1. 检查 ffmpeg：`ffmpeg -version`
2. 检查字幕文件：`output/subtitles.json`
3. 检查音频文件：`output/voiceover.mp3`

### 清理输出

```bash
npm run clean
```
