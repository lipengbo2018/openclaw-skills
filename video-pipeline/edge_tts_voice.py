#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Edge TTS 中文配音生成器
免费、高质量、支持多种中文语音
"""

import asyncio
import argparse
import os
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

try:
    from edge_tts import Communicate
except ImportError:
    print("正在安装 edge-tts...")
    os.system(f"{sys.executable} -m pip install edge-tts -q")
    from edge_tts import Communicate

VOICES = {
    "xiaoxiao": ("zh-CN-XiaoxiaoNeural", "晓晓 (女声)"),
    "xiaoyi": ("zh-CN-XiaoyiNeural", "小艺 (女声)"),
    "yunxi": ("zh-CN-YunxiNeural", "云希 (男声)"),
    "yunxia": ("zh-CN-YunxiaNeural", "云夏 (男声)"),
    "yunjian": ("zh-CN-YunjianNeural", "云健 (男声)"),
    "yunyang": ("zh-CN-YunyangNeural", "云扬 (男声，新闻风)"),
}

async def generate_voice(text, output_file, voice_key="xiaoxiao", speed="+0%"):
    voice_id, voice_name = VOICES.get(voice_key, VOICES["xiaoxiao"])
    
    print("Generating voice...")
    print(f"Voice: {voice_name}")
    print(f"Speed: {speed}")
    
    communicate = Communicate(text, voice_id, rate=speed)
    await communicate.save(output_file)
    
    size = os.path.getsize(output_file)
    print(f"Voice generated: {output_file}")
    print(f"Size: {size / 1024:.1f} KB")

def main():
    parser = argparse.ArgumentParser(description="Edge TTS Chinese Voice Generator")
    parser.add_argument("--text", "-t", required=True, help="Text to convert")
    parser.add_argument("--output", "-o", default="output/voiceover.mp3", help="Output file path")
    parser.add_argument("--voice", "-v", default="xiaoxiao", 
                        choices=list(VOICES.keys()), help="Voice: xiaoxiao, xiaoyi, yunxi, yunxia, yunjian, yunyang")
    parser.add_argument("--speed", "-s", default="+0%", help="Speed, e.g. +10% or -10%")
    
    args = parser.parse_args()
    
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    asyncio.run(generate_voice(args.text, args.output, args.voice, args.speed))

if __name__ == "__main__":
    main()
