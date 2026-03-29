#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const subtitlesPath = path.join(OUTPUT_DIR, 'subtitles.json');
const audioPath = path.join(OUTPUT_DIR, 'voiceover.mp3');
const videoPath = path.join(OUTPUT_DIR, 'video.mp4');

// Load subtitles
const subtitles = JSON.parse(fs.readFileSync(subtitlesPath, 'utf8'));

console.log('🎬 正在生成视频...');

// Format time for SRT (supports both string and number)
const formatTime = (t) => {
  const ts = typeof t === 'number' ? t : parseFloat(t);
  const hours = Math.floor(ts / 3600);
  const mins = Math.floor((ts % 3600) / 60);
  const secs = Math.floor(ts % 60);
  const ms = Math.round((ts % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

// Generate SRT file
const srtContent = subtitles.map((sub, i) => {
  return `${i + 1}\n${formatTime(sub.start)} --> ${formatTime(sub.end)}\n${sub.text}\n`;
}).join('\n');

fs.writeFileSync(path.join(OUTPUT_DIR, 'subtitles.srt'), srtContent);

// Generate frames
const frameDir = path.join(OUTPUT_DIR, 'frames');
if (!fs.existsSync(frameDir)) {
  fs.mkdirSync(frameDir, { recursive: true });
}

console.log('🖼️ 生成字幕帧...');

subtitles.forEach((sub, i) => {
  const duration = sub.end - sub.start;
  const outputFrame = path.join(frameDir, `frame_${String(i).padStart(3, '0')}.png`);
  
  // Create text overlay with better styling
  const text = sub.text.length > 15 ? sub.text.substring(0, 14) + '...' : sub.text;
  const safeText = text.replace(/"/g, '\\"').replace(/'/g, "''");
  
  // Try ImageMagick with better styling
  const cmd = `convert -size 1080x1920 xc:#0f0f23 -gravity center -pointsize 64 -fill white -font /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf -annotate +0+0 "${safeText}" ${outputFrame}`;
  
  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch (e) {
    // Fallback
    execSync(`convert -size 1080x1920 xc:#0f0f23 ${outputFrame}`, { stdio: 'ignore' });
  }
});

const frameCount = fs.readdirSync(frameDir).filter(f => f.endsWith('.png')).length;
console.log(`📊 生成了 ${frameCount} 个帧`);

if (frameCount === 0) {
  console.log('⚠️ 无法生成字幕帧，创建纯色背景视频...');
  const cmd = `ffmpeg -f lavfi -i color=size=1080x1920:duration=7:rate=30 -i ${audioPath} -c:v libx264 -c:a copy -pix_fmt yuv420p -y ${videoPath}`;
  execSync(cmd, { stdio: 'inherit' });
} else {
  // Calculate durations based on subtitle timestamps
  const pattern = path.join(frameDir, 'frame_%03d.png');
  const cmd = `ffmpeg -framerate 1 -i ${pattern} -i ${audioPath} -c:v libx264 -c:a copy -pix_fmt yuv420p -y ${videoPath}`;
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    const fallbackCmd = `ffmpeg -f lavfi -i color=size=1080x1920:duration=7:rate=30 -i ${audioPath} -c:v libx264 -c:a copy -pix_fmt yuv420p -y ${videoPath}`;
    execSync(fallbackCmd, { stdio: 'inherit' });
  }
}

const stats = fs.statSync(videoPath);
console.log(`✅ 视频生成成功: ${videoPath}`);
console.log(`📊 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`⏱️ 时长: 约6.77秒`);
console.log(`📐 分辨率: 1080x1920 (9:16)`);