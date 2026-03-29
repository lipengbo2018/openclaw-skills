#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
});

const API_KEY = process.env.MINIMAX_API_KEY;

const SCRIPT = `哎！微信刚刚又偷偷更新了，我估计你还没注意到。就在昨天，微信推送了一个新版本，很多人更新完以后，发现界面好像没什么变化，就直接忽略了。但实啊，真正的功能藏在你最容易忽略的地方。我研究了一下，发现这次更新最大的变化，其实在对话框里。你现在去试试，随手打开一个好友的聊天界面，注意看顶部那个地方——是不是多了个叫"ai小结"的小按钮？对，就是它！这个功能可厉害了。你只要点一下，它就能帮你自动梳理出你们最近聊了什么、提到了哪些关键信息。就算是几百条的聊天记录，它也能在几秒钟之内给你整理得明明白白。比如说，你之前跟朋友讨论过的一个方案、时间、地点，或者答应别人的一件事是不是忘了——过去你得往上翻半天，现在点一下这个按钮，一目了然。而且不只是文字，语音聊天也能识别！这个功能目前不是所有人都能用，你更新到最新版本了没有？快去试试看！好用的话，记得回来告诉我。`;

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Call Whisper API via MiniMax
const https = require('https');
const { URL } = require('url');

const audioPath = path.join(OUTPUT_DIR, 'voiceover.mp3');
if (!fs.existsSync(audioPath)) {
  console.error('❌ 音频文件不存在');
  process.exit(1);
}

const audioData = fs.readFileSync(audioPath);
const base64Audio = audioData.toString('base64');

const apiUrl = `https://api.minimax.chat/v1/audio/asr`;
const postData = JSON.stringify({
  file: base64Audio,
  file_name: 'voiceover.mp3',
  language: 'zh-CN'
});

const url = new URL(apiUrl);
const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔤 正在调用 Whisper API...');

const req = https.request(options, (res) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const body = Buffer.concat(chunks).toString();
    console.log('📥 响应:', body.substring(0, 500));
    try {
      const json = JSON.parse(body);
      if (json.result && json.result.text) {
        console.log('✅ 转写成功:', json.result.text);
      } else if (json.base_resp) {
        console.log('⚠️ Whisper API 不可用，使用时间戳生成...');
        generateTimestamps();
      } else {
        generateTimestamps();
      }
    } catch (e) {
      console.log('⚠️ 解析失败，使用时间戳生成...');
      generateTimestamps();
    }
  });
});

req.on('error', (e) => {
  console.log('⚠️ 请求失败，使用时间戳生成...');
  generateTimestamps();
});

req.write(postData);
req.end();

function generateTimestamps() {
  // Split script into sentences and generate timestamps
  const sentences = SCRIPT.split(/[。！？]/).filter(s => s.trim());
  const totalDuration = 55; // seconds
  const avgDuration = totalDuration / sentences.length;
  
  let currentTime = 0;
  const subtitles = sentences.map((sentence, i) => {
    const start = currentTime;
    currentTime += avgDuration;
    return {
      start: start.toFixed(2),
      end: currentTime.toFixed(2),
      text: sentence.trim()
    };
  });
  
  const outputPath = path.join(OUTPUT_DIR, 'subtitles.json');
  fs.writeFileSync(outputPath, JSON.stringify(subtitles, null, 2));
  console.log(`✅ 字幕时间戳已生成: ${outputPath}`);
  console.log(JSON.stringify(subtitles, null, 2));
}