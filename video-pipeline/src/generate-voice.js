#!/usr/bin/env node
/**
 * 配音生成脚本
 * 支持两种模式:
 * 1. MiniMax API (需要 MINIMAX_API_KEY)
 * 2. Edge TTS (免费, 默认使用)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const scriptModule = require('./script.js');
const SCRIPT = scriptModule.script;

const envPath = path.join(__dirname, '..', '.env');

function loadEnv() {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
    });
  }
}

loadEnv();

const API_KEY = process.env.MINIMAX_API_KEY;
const VOICE = process.env.EDGE_VOICE || 'xiaoxiao';
const SPEED = process.env.EDGE_SPEED || '+0%';

const PYTHON_PATHS = [
  'C:\\Users\\Administrator\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
  'python',
  'python3',
];

function findPython() {
  for (const p of PYTHON_PATHS) {
    try {
      execSync(`"${p}" --version`, { stdio: 'ignore' });
      return p;
    } catch (e) {}
  }
  return 'python';
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

async function generateWithEdgeTTS() {
  console.log('Using Edge TTS (free high quality)\n');
  
  const pythonScript = path.join(__dirname, '..', 'edge_tts_voice.py');
  const outputPath = path.join(OUTPUT_DIR, 'voiceover.mp3');
  const pythonExe = findPython();
  
  ensureOutputDir();
  
  const escapedText = SCRIPT.replace(/"/g, '\\"');
  const cmd = `"${pythonExe}" "${pythonScript}" --text "${escapedText}" --output "${outputPath}" --voice ${VOICE} --speed ${SPEED}`;
  
  try {
    execSync(cmd, { stdio: 'inherit', timeout: 60000 });
    return fs.existsSync(outputPath);
  } catch (e) {
    console.error('Edge TTS failed:', e.message);
    return false;
  }
}

async function generateWithMiniMax() {
  console.log('Using MiniMax API\n');
  
  const https = require('https');
  const { URL } = require('url');
  
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
  
  return new Promise((resolve, reject) => {
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
            console.log(`Voice generated: ${outputPath}`);
            console.log(`Size: ${(audioData.length / 1024).toFixed(1)} KB`);
            resolve(true);
          } else if (json.base_resp) {
            console.error('API error:', json.base_resp.status_msg);
            resolve(false);
          } else {
            console.error('Unexpected response format');
            resolve(false);
          }
        } catch (e) {
          console.error('Parse failed:', e.message);
          resolve(false);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('Request failed:', e.message);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

async function main() {
  ensureOutputDir();
  
  let success = false;
  
  if (API_KEY) {
    console.log('MINIMAX_API_KEY detected, using MiniMax API first');
    success = await generateWithMiniMax();
    if (!success) {
      console.log('\nMiniMax failed, trying Edge TTS...');
      success = await generateWithEdgeTTS();
    }
  } else {
    console.log('No MINIMAX_API_KEY, using Edge TTS');
    success = await generateWithEdgeTTS();
  }
  
  if (!success) {
    console.error('\nVoice generation failed');
    process.exit(1);
  }
  
  console.log('\nVoice generation complete!');
}

main();
