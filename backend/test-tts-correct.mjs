/**
 * 调试 DashScope CosyVoice TTS - 使用正确的端点格式
 * 端点: https://{WorkspaceId}.cn-beijing.maas.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer
 */
import axios from 'axios';
import { writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';

const API_KEY = process.env.DASHSCOPE_API_KEY || '';
const WORKSPACE_ID = 'ws-5g540k9v22ziupgp';
const BASE_URL = `https://${WORKSPACE_ID}.cn-beijing.maas.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer`;

const text = '你好，欢迎使用智能面试助手。我们正在测试阿里云百炼平台的语音合成功能。';

console.log('=== DashScope TTS 正确端点测试 ===\n');
console.log(`端点: ${BASE_URL}\n`);

async function testTTS(model, voice, format = 'wav') {
  console.log(`--- ${model} / ${voice} ---`);
  try {
    const res = await axios.post(
      BASE_URL,
      {
        model,
        input: {
          text,
          voice,
          format,
          sample_rate: 24000,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    console.log(`✅ 成功! status=${res.status}`);
    const data = res.data;

    if (data?.output?.audio?.url) {
      const audioUrl = data.output.audio.url;
      const expiresAt = data.output.audio.expires_at;
      console.log(`   音频URL: ${audioUrl}`);
      console.log(`   过期时间: ${expiresAt}`);

      // 下载音频文件
      const audioRes = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      const filename = `tts-${model.replace(/[^a-z0-9]/g, '-')}-${voice}-${randomUUID().slice(0, 8)}.${format}`;
      await writeFile(filename, Buffer.from(audioRes.data));
      console.log(`   已保存: ${filename} (${(Buffer.from(audioRes.data).length / 1024).toFixed(1)} KB)`);
      return true;
    } else {
      console.log(`   响应: ${JSON.stringify(data).slice(0, 500)}`);
      return false;
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.log(`❌ 失败 (${err.response?.status || '无响应'})`);
      if (err.response?.data) {
        const detail = typeof err.response.data === 'string'
          ? err.response.data
          : JSON.stringify(err.response.data, null, 2);
        console.log(`   响应体: ${detail.slice(0, 500)}`);
      } else if (err.code === 'ECONNABORTED') {
        console.log('   超时');
      } else {
        console.log(`   错误: ${err.message}`);
      }
    } else {
      console.log(`❌ 错误: ${err.message}`);
    }
    return false;
  }
}

(async () => {
  // 测试 v3-flash + 系统音色
  console.log('\n📢 测试 cosyvoice-v3-flash (推荐 - 支持系统音色)\n');
  await testTTS('cosyvoice-v3-flash', 'longanyang');     // 标杆音色 - 阳光大男孩
  await testTTS('cosyvoice-v3-flash', 'longxiaochun_v3'); // 知性积极女
  await testTTS('cosyvoice-v3-flash', 'longwan_v3');      // 细腻柔声女
  await testTTS('cosyvoice-v3-flash', 'longanyun_v3');    // 居家暖男
  await testTTS('cosyvoice-v3-flash', 'longanzhi_v3');    // 睿智轻熟男

  // 测试 v3.5 (可能只支持定制音色)
  console.log('\n📢 测试 cosyvoice-v3.5-plus (仅支持声音复刻/定制音色)\n');
  await testTTS('cosyvoice-v3.5-plus', 'longanyang');
})();
