#!/usr/bin/env node
/**
 * 使用 Windows SAPI 生成配音
 * 免费，无需网络
 */

const Say = require('say').Say;
const path = require('path');
const fs = require('fs');

const scriptModule = require('./script.js');
const SCRIPT = scriptModule.script;
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const say = new Say();

console.log('🎤 检查可用语音...\n');

say.getInstalledVoices((err, voices) => {
  if (err) {
    console.error('❌ 获取语音失败:', err);
    process.exit(1);
  }
  
  console.log('可用语音:');
  voices.forEach(v => {
    console.log(`  - ${v.name} (${v.language})`);
  });
  
  const chineseVoice = voices.find(v => 
    v.language && v.language.toLowerCase().includes('zh')
  );
  
  if (!chineseVoice) {
    console.log('\n⚠️ 未找到中文语音!');
    console.log('请安装中文语音包或使用 Edge TTS 方案');
    process.exit(1);
  }
  
  console.log(`\n🎤 使用语音: ${chineseVoice.name}`);
  console.log('⏳ 正在生成配音...\n');
  
  const outputPath = path.join(OUTPUT_DIR, 'voiceover.mp3');
  
  say.export(SCRIPT, chineseVoice.name, (err, buffer) => {
    if (err) {
      console.error('❌ 生成失败:', err);
      process.exit(1);
    }
    
    fs.writeFileSync(outputPath, buffer);
    const size = fs.statSync(outputPath).size;
    console.log(`✅ 配音已生成: ${outputPath}`);
    console.log(`📊 大小: ${(size / 1024).toFixed(1)} KB`);
  });
});
