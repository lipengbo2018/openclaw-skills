#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const FONTS_DIR = path.join(__dirname, '..', 'fonts');
const subtitlesPath = path.join(OUTPUT_DIR, 'subtitles.json');
const audioPath = path.join(OUTPUT_DIR, 'voiceover.mp3');
const videoPath = path.join(OUTPUT_DIR, 'video.mp4');

const FONT_FILE = path.join(FONTS_DIR, 'NotoSansSC.ttf');

console.log('Generating video...\n');

if (!fs.existsSync(audioPath)) {
  console.error('Audio file not found:', audioPath);
  console.log('Run: npm run voice');
  process.exit(1);
}

if (!fs.existsSync(subtitlesPath)) {
  console.error('Subtitles file not found:', subtitlesPath);
  console.log('Run: npm run subtitles');
  process.exit(1);
}

const subtitles = JSON.parse(fs.readFileSync(subtitlesPath, 'utf8'));
console.log(`Loaded ${subtitles.length} subtitles`);

let audioDuration;
try {
  const probeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
  audioDuration = parseFloat(execSync(probeCmd, { encoding: 'utf8' }).trim());
  console.log(`Audio duration: ${audioDuration.toFixed(2)} seconds`);
} catch (e) {
  audioDuration = 10;
  console.log(`Could not get audio duration, using default: ${audioDuration}`);
}

const width = 1080;
const height = 1920;
const fps = 30;

if (!fs.existsSync(FONT_FILE)) {
  console.error('Font file not found:', FONT_FILE);
  console.log('Please download the Noto Sans SC font to the fonts directory');
  process.exit(1);
}

console.log('\nGenerating video with Chinese subtitles using drawtext...');

const fontPath = FONT_FILE.replace(/\\/g, '/').replace(/:/g, '\\:');

const subtitleFilters = subtitles.map((sub, i) => {
  const text = sub.text.replace(/'/g, "\\'").replace(/\n/g, ' ');
  const start = parseFloat(sub.start);
  const end = parseFloat(sub.end);
  return `drawtext=text='${text}':fontsize=56:fontcolor=white:borderw=2:bordercolor=black:fontfile='${fontPath}':x=(w-text_w)/2:y=h-300:enable='between(t,${start},${end})'`;
}).join(',');

const cmd = `ffmpeg -y `
  + `-f lavfi -i "color=size=${width}x${height}:duration=${audioDuration}:rate=${fps}:color=0x1a1a2e"`
  + ` -stream_loop 1 -i "${audioPath}"`
  + ` -filter_complex "[0:v]${subtitleFilters}[out]"`
  + ` -map "[out]" -map "1:a"`
  + ` -c:v libx264 -preset fast -crf 23`
  + ` -c:a aac -b:a 128k`
  + ` -pix_fmt yuv420p`
  + ` -shortest`
  + ` "${videoPath}"`;

try {
  console.log('Running ffmpeg with drawtext subtitles...');
  execSync(cmd, { stdio: 'inherit' });

  if (fs.existsSync(videoPath)) {
    const stats = fs.statSync(videoPath);
    console.log(`\n✅ Video generated successfully!`);
    console.log(`   File: ${videoPath}`);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Duration: ${audioDuration.toFixed(2)} seconds`);
    console.log(`   Resolution: ${width}x${height} (9:16 vertical video)`);
  }
} catch (e) {
  console.error('\n❌ Video generation failed:', e.message);
  process.exit(1);
}