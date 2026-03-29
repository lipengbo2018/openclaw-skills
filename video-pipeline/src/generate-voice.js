#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Load env from project root
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
});

const API_KEY = process.env.MINIMAX_API_KEY;
if (!API_KEY) {
  console.error('❌ MINIMAX_API_KEY not found in .env');
  process.exit(1);
}

// Load script
const scriptModule = require('./script.js');
const SCRIPT = scriptModule.script;

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// MiniMax TTS v1 API
const apiUrl = `https://api.minimax.chat/v1/audio/gen`;

const postData = JSON.stringify({
  model: 'speech-01',
  text: SCRIPT,
  voice_id: 'female-shaonv',
  speed: 1.0,
  volume: 1.0,
  pitch: 0,
  audio_sample_rate: 32000,
  bitrate: 128000,
  format: 'mp3'
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

console.log('🎤 正在调用 MiniMax TTS API...');

const req = https.request(options, (res) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const body = Buffer.concat(chunks).toString();
    try {
      const json = JSON.parse(body);
      if (json.data && json.data.audio) {
        const audioData = Buffer.from(json.data.audio, 'base64');
        const outputPath = path.join(OUTPUT_DIR, 'voiceover.mp3');
        fs.writeFileSync(outputPath, audioData);
        console.log(`✅ 配音已生成: ${outputPath}`);
        console.log(`📊 文件大小: ${(audioData.length / 1024).toFixed(1)} KB`);
      } else if (json.base_resp) {
        console.error('❌ API错误:', json.base_resp.status_msg);
        process.exit(1);
      } else {
        console.error('❌ 未预期的响应格式');
        console.log(body);
        process.exit(1);
      }
    } catch (e) {
      console.error('❌ 解析失败:', e.message);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ 请求失败:', e.message);
  process.exit(1);
});

req.write(postData);
req.end();