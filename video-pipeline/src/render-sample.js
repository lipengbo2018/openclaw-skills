#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🎬 开始生成示例视频...');

const outputDir = path.join(__dirname, '../output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputFile = path.join(outputDir, 'sample-video.mp4');

// 使用 ffmpeg 生成一个简单的测试视频
const ffmpegCommand = [
  'ffmpeg',
  '-f', 'lavfi',
  '-i', 'testsrc=duration=10:size=1280x720:rate=30',
  '-f', 'lavfi',
  '-i', 'sine=frequency=440:duration=10',
  '-c:v', 'libx264',
  '-c:a', 'aac',
  '-pix_fmt', 'yuv420p',
  '-y',
  outputFile
].join(' ');

console.log('📦 运行 ffmpeg 命令...');
try {
  execSync(ffmpegCommand, { stdio: 'inherit' });
  console.log(`✅ 视频生成成功！保存在: ${outputFile}`);
  
  const stats = fs.statSync(outputFile);
  console.log(`📊 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
} catch (error) {
  console.error('❌ 视频生成失败:', error.message);
  process.exit(1);
}
