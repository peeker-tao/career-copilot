/**
 * 调试 DashScope CosyVoice TTS API
 * 直接用 axios 调用，查看精确的错误响应
 */
import axios from 'axios';

const API_KEY = process.env.DASHSCOPE_API_KEY || '';
const text = '你好，欢迎使用智能面试助手。';

console.log('=== DashScope TTS 调试 ===');
console.log(`API Key: ${API_KEY.slice(0, 16)}...${API_KEY.slice(-8)}`);
console.log(`文本: "${text}"\n`);

async function tryBody(description, body, label) {
  console.log(`\n--- ${description} ---`);
  try {
    const res = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer',
      body,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    console.log(`✅ 成功! status=${res.status}`);
    console.log(`响应: ${JSON.stringify(res.data, null, 2)}`);
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.log(`❌ 失败 (${err.response?.status || 'no response'})`);
      if (err.response?.data) {
        const data = typeof err.response.data === 'string'
          ? err.response.data
          : JSON.stringify(err.response.data, null, 2);
        console.log(`响应体: ${data}`);
      }
      if (err.response?.headers) {
        console.log(`Headers: ${JSON.stringify(err.response.headers)}`);
      }
    } else {
      console.log(`❌ 错误: ${err.message}`);
    }
  }
}

// 尝试1: 标准 SDK 格式
await tryBody(
  '格式1: model + input (标准 SDK 格式)',
  {
    model: 'cosyvoice-v3-flash',
    input: {
      text,
      voice: 'longxiaochun',
      format: 'mp3',
      sample_rate: 24000,
    },
  },
  'format1'
);

// 尝试2: 只有 model + text (最简格式)
await tryBody(
  '格式2: 最简格式',
  {
    model: 'cosyvoice-v3-flash',
    input: {
      text,
    },
  },
  'format2'
);

// 尝试3: 老版 DashScope 格式 (text 在顶层)
await tryBody(
  '格式3: 老版格式 (text 在顶层)',
  {
    model: 'cosyvoice-v3-flash',
    text,
    voice: 'longxiaochun',
  },
  'format3'
);

// 尝试4: wav 格式 + 更低的采样率
await tryBody(
  '格式4: wav 格式 + 16000 采样率',
  {
    model: 'cosyvoice-v3-flash',
    input: {
      text,
      voice: 'longxiaochun',
      format: 'wav',
      sample_rate: 16000,
    },
  },
  'format4'
);

// 尝试5: 换用 cosyvoice-v1 模型
await tryBody(
  '格式5: cosyvoice-v1 模型',
  {
    model: 'cosyvoice-v1',
    input: {
      text,
      voice: 'longxiaochun',
      format: 'mp3',
      sample_rate: 22050,
    },
  },
  'format5'
);

// 尝试6: 换用 longshu 发音人 (SDK 测试用的)
await tryBody(
  '格式6: longshu 发音人',
  {
    model: 'cosyvoice-v3-flash',
    input: {
      text,
      voice: 'longshu',
      format: 'mp3',
      sample_rate: 24000,
    },
  },
  'format6'
);
