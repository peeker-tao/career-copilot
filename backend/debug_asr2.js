/**
 * DashScope ASR (Paraformer) 调试脚本
 *
 * 完整流程：
 *   1. 获取临时上传凭证 → 2. 上传文件到 OSS → 3. 提交异步转录任务 → 4. 轮询结果
 *
 * 用法: node debug_asr2.js [音频文件路径]
 * 默认使用测试音频: uploads/audio/ 下的第一个 .wav 文件
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DASHSCOPE_HOST = 'dashscope.aliyuncs.com';
const API_KEY = process.env.DASHSCOPE_API_KEY;
if (!API_KEY) {
  console.error('❌ 请设置环境变量 DASHSCOPE_API_KEY');
  process.exit(1);
}

// ── 工具函数 ──────────────────────────────────────

/** 发起 HTTPS JSON 请求 */
function jsonRequest(method, host, pathname, headers, body) {
  return new Promise((resolve, reject) => {
    const hdrs = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...headers,
    };
    if (body) hdrs['Content-Length'] = Buffer.byteLength(body);

    const opts = { hostname: host, path: pathname, method, headers: hdrs };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

/** 生成 multipart/form-data 请求体 */
function buildMultipart(fields, boundary) {
  const parts = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'file') {
      // value = { filename, content (Buffer) }
      parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${value.filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`);
      parts.push(value.content);
      parts.push('\r\n');
    } else {
      parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`);
    }
  }
  parts.push(`--${boundary}--\r\n`);

  const chunks = [];
  for (const p of parts) {
    if (Buffer.isBuffer(p)) chunks.push(p);
    else chunks.push(Buffer.from(p, 'utf-8'));
  }
  return Buffer.concat(chunks);
}

/** 生成随机 boundary */
function randomBoundary() {
  return '----ASRDebug' + Math.random().toString(36).slice(2, 18);
}

// ── ASR 流程 ──────────────────────────────────────

/**
 * 步骤1: 获取文件上传凭证
 */
async function getUploadPolicy(model) {
  const params = `?action=getPolicy&model=${encodeURIComponent(model)}`;
  const result = await jsonRequest('GET', DASHSCOPE_HOST, `/api/v1/uploads${params}`, {}, null);
  if (result.status !== 200) {
    throw new Error(`获取上传凭证失败 (${result.status}): ${JSON.stringify(result.data || result.raw)}`);
  }
  console.log('✅ [步骤1] 获取上传凭证成功');
  console.log(`   upload_host: ${result.data.data.upload_host}`);
  console.log(`   upload_dir:  ${result.data.data.upload_dir}`);
  console.log(`   有效期: ${result.data.data.expire_in_seconds}s`);
  return result.data.data;
}

/**
 * 步骤2: 上传文件到临时 OSS 存储
 */
function uploadFileToOSS(policy, filePath) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);
    const key = `${policy.upload_dir}/${fileName}`;
    const boundary = randomBoundary();

    const fields = {
      'OSSAccessKeyId': policy.oss_access_key_id,
      'Signature': policy.signature,
      'policy': policy.policy,
      'x-oss-object-acl': policy.x_oss_object_acl,
      'x-oss-forbid-overwrite': policy.x_oss_forbid_overwrite,
      'key': key,
      'success_action_status': '200',
      'file': { filename: fileName, content: fileContent },
    };

    const bodyBuffer = buildMultipart(fields, boundary);

    const url = new URL(policy.upload_host);
    const isHttps = url.protocol === 'https:';
    const mod = isHttps ? https : http;

    const opts = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length,
      },
    };

    const req = mod.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode === 200) {
          const ossUrl = `oss://${key}`;
          console.log('✅ [步骤2] 文件上传到 OSS 成功');
          console.log(`   oss:// URL: ${ossUrl}`);
          resolve(ossUrl);
        } else {
          reject(new Error(`上传文件到 OSS 失败 (${res.statusCode}): ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(bodyBuffer);
    req.end();
  });
}

/**
 * 步骤3: 提交异步转录任务
 */
async function submitTranscriptionTask(ossUrl) {
  const body = JSON.stringify({
    model: 'paraformer-v2',
    input: {
      file_urls: [ossUrl],
    },
  });

  const result = await jsonRequest(
    'POST',
    DASHSCOPE_HOST,
    '/api/v1/services/audio/asr/transcription',
    {
      'X-DashScope-Async': 'enable',
      'X-DashScope-OssResourceResolve': 'enable',
    },
    body,
  );

  if (result.status !== 200) {
    throw new Error(`提交转录任务失败 (${result.status}): ${JSON.stringify(result.data || result.raw)}`);
  }

  const taskId = result.data?.output?.task_id || result.data?.task_id;
  if (!taskId) {
    throw new Error(`无法获取 task_id: ${JSON.stringify(result.data)}`);
  }

  console.log(`✅ [步骤3] 转录任务已提交, task_id: ${taskId}`);
  return taskId;
}

/**
 * 步骤4: 轮询任务结果
 */
async function pollTaskResult(taskId, maxRetries = 60, intervalMs = 2000) {
  console.log(`⏳ [步骤4] 轮询任务结果... (最多 ${maxRetries} 次, 间隔 ${intervalMs}ms)`);

  for (let i = 0; i < maxRetries; i++) {
    const result = await jsonRequest(
      'GET',
      DASHSCOPE_HOST,
      `/api/v1/tasks/${taskId}`,
      {},
      null,
    );

    if (result.status !== 200) {
      throw new Error(`查询任务状态失败 (${result.status}): ${JSON.stringify(result.data || result.raw)}`);
    }

    const status = result.data?.output?.task_status || result.data?.task_status;
    console.log(`   第 ${i + 1} 次轮询: task_status = ${status}`);

    if (status === 'SUCCEEDED') {
      console.log('✅ [步骤4] 转录任务完成!');
      return result.data;
    } else if (status === 'FAILED') {
      throw new Error(`转录任务失败: ${JSON.stringify(result.data?.output || result.data)}`);
    }
    // 继续轮询
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`轮询超时 (${maxRetries * intervalMs / 1000}s), task_id: ${taskId}`);
}

/**
 * 从 transcription_url 下载识别结果
 */
function downloadTranscription(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const mod = isHttps ? https : http;

    mod.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    }).on('error', reject);
  });
}

// ── 主流程 ────────────────────────────────────────

async function main() {
  // 解析音频文件路径
  let audioPath = process.argv[2];
  if (!audioPath) {
    // 默认找 uploads/audio/ 下的第一个 .wav 文件
    const audioDir = path.join(__dirname, 'uploads', 'audio');
    if (fs.existsSync(audioDir)) {
      const files = fs.readdirSync(audioDir).filter((f) => /\.(wav|mp3|m4a|ogg)$/i.test(f));
      if (files.length > 0) {
        audioPath = path.join(audioDir, files[0]);
      }
    }
  }

  if (!audioPath || !fs.existsSync(audioPath)) {
    console.error('❌ 未找到音频文件。请提供文件路径: node debug_asr2.js <audio_file>');
    console.error('   或者将音频文件放到 backend/uploads/audio/ 目录下');
    process.exit(1);
  }

  const fileSize = fs.statSync(audioPath).size;
  const ext = path.extname(audioPath).toLowerCase();
  console.log(`🎤 DashScope ASR 调试脚本`);
  console.log(`   文件: ${audioPath}`);
  console.log(`   大小: ${(fileSize / 1024).toFixed(1)} KB`);
  console.log(`   格式: ${ext}`);
  console.log('');

  const model = 'paraformer-v2';

  try {
    // 步骤1: 获取上传凭证
    const policy = await getUploadPolicy(model);

    // 步骤2: 上传文件到 OSS
    const ossUrl = await uploadFileToOSS(policy, audioPath);

    // 步骤3: 提交转录任务
    const taskId = await submitTranscriptionTask(ossUrl);

    // 步骤4: 轮询结果
    const taskResult = await pollTaskResult(taskId);

    // 提取结果 — transcription_url 在 results[0] 或 results[0].output 中
    const output = taskResult.output || taskResult;
    const results = output.results || [];
    const firstResult = results[0] || {};
    const nestedOutput = firstResult.output || {};
    const transcriptionUrl = firstResult.transcription_url || nestedOutput.transcription_url || output.transcription_url;
    const text = output.text || firstResult.text || nestedOutput.text;

    if (transcriptionUrl) {
      console.log('📥 下载详细转录结果...');
      const transcriptionData = await downloadTranscription(transcriptionUrl);
      console.log('\n📝 完整转录数据:');
      console.log(JSON.stringify(transcriptionData, null, 2));
      // 尝试从不同格式提取文本
      const extractedText =
        transcriptionData?.transcripts?.[0]?.text ||
        transcriptionData?.transcript ||
        transcriptionData?.text ||
        transcriptionData?.result?.text ||
        transcriptionData?.results?.[0]?.text ||
        transcriptionData?.output?.text ||
        transcriptionData?.transcription?.text ||
        (Array.isArray(transcriptionData?.sentences) ? transcriptionData.sentences.map(s => s.text).join(' ') : '') ||
        (typeof transcriptionData === 'object' ? JSON.stringify(transcriptionData) : transcriptionData);
      console.log(`\n📝 转录文字: "${extractedText.slice(0, 300)}"`);
    } else if (text) {
      console.log(`\n📝 转录文字: "${text}"`);
    } else {
      console.log('\n📝 原始结果:');
      console.log(JSON.stringify(taskResult, null, 2));
    }

    console.log('\n🎉 ASR 流程完成!');
  } catch (err) {
    console.error(`\n❌ 错误: ${err.message}`);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
