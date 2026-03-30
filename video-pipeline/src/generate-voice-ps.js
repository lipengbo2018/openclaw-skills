#!/usr/bin/env node
/**
 * 使用 PowerShell 语音合成生成配音
 * Windows 内置，无需安装额外组件
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const scriptModule = require('./script.js');
const SCRIPT = scriptModule.script;
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const outputPath = path.join(OUTPUT_DIR, 'voiceover.mp3');
const tempTextPath = path.join(os.tmpdir(), 'tts_text.txt');

fs.writeFileSync(tempTextPath, SCRIPT, 'utf8');

console.log('🎤 使用 Windows 语音合成...\n');

const psScript = `
Add-Type -AssemblyName System.Speech
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice.Rate = 0

$text = Get-Content '${tempTextPath.replace(/\\/g, '\\\\')}' -Raw -Encoding UTF8
$voice.SetOutputToWaveFile('${outputPath.replace(/\\/g, '\\\\')}')
$voice.Speak($text)
Write-Output "SUCCESS"
`;

try {
  const result = execSync(`powershell -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
    encoding: 'utf8',
    timeout: 60000
  });
  
  if (fs.existsSync(outputPath)) {
    const size = fs.statSync(outputPath).size;
    console.log(`✅ 配音已生成: ${outputPath}`);
    console.log(`📊 大小: ${(size / 1024).toFixed(1)} KB`);
  } else {
    console.error('❌ 文件未生成');
    process.exit(1);
  }
} catch (e) {
  console.error('❌ 生成失败:', e.message);
  console.log('\n请安装中文语音包或使用 Edge TTS 方案');
  process.exit(1);
}
