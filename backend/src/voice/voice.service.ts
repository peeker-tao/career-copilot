import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join, basename } from 'path';
import { randomUUID } from 'crypto';
import axios, { AxiosInstance } from 'axios';

/**
 * DashScope CosyVoice 发音人映射
 *
 * 模型: cosyvoice-v3-flash（推荐，支持系统音色）
 * v3-flash 标杆音色列表:
 *   - longanyang      阳光大男孩（标杆）
 *   - longxiaochun_v3 知性积极女
 *   - longwan_v3      细腻柔声女
 *   - longanyun_v3    居家暖男
 *   - longanzhi_v3    睿智轻熟男
 */
const DASHSCOPE_VOICE_MAP: Record<string, string> = {
  alloy: 'longanyang',       // 面试官（中性友好）
  echo: 'longanzhi_v3',      // 成熟面试官
  fable: 'longxiaochun_v3',  // 引导/介绍
  onyx: 'longanyun_v3',      // 放松场景
  nova: 'longwan_v3',        // 温和反馈
  shimmer: 'longxiaochun_v3',// 默认通用
};

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  /** 用于 TTS 的 OpenAI-compatible 客户端（DashScope 兼容模式 / OpenAI） */
  private openai: OpenAI | null = null;
  /** 用于 ASR 的 DashScope 原生 REST 客户端 */
  private dashScopeHttp: AxiosInstance | null = null;
  /** 是否为 DashScope 模式 */
  private useDashScope = false;
  private dashScopeApiKey: string | null = null;
  private dashScopeWorkspaceId: string | null = null;

  private readonly audioDir: string;

  constructor(private configService: ConfigService) {
    // 确保音频存储目录存在
    this.audioDir = join(process.cwd(), 'uploads', 'audio');
    if (!existsSync(this.audioDir)) {
      mkdirSync(this.audioDir, { recursive: true });
    }

    // 优先使用 DashScope（阿里云百炼），其次 OpenAI
    const dashScopeKey = this.configService.get<string>('DASHSCOPE_API_KEY');
    const dashScopeBase = this.configService.get<string>('DASHSCOPE_BASE_URL')
      || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const workspaceId = this.configService.get<string>('DASHSCOPE_WORKSPACE_ID');

    if (dashScopeKey && dashScopeKey !== 'sk-xxx' && dashScopeKey.length > 6) {
      // TTS: OpenAI 兼容模式
      this.openai = new OpenAI({ apiKey: dashScopeKey, baseURL: dashScopeBase });
      // ASR: DashScope 原生 REST API（Paraformer 异步文件识别）
      this.dashScopeHttp = axios.create({
        baseURL: 'https://dashscope.aliyuncs.com',
        headers: { Authorization: `Bearer ${dashScopeKey}` },
        timeout: 30000,
      });
      this.dashScopeApiKey = dashScopeKey;
      this.dashScopeWorkspaceId = workspaceId || null;
      this.useDashScope = true;
      this.logger.log('🎤 DashScope 语音客户端初始化完成');
      this.logger.log('   TTS: CosyVoice (OpenAI 兼容模式)');
      this.logger.log('   ASR: Paraformer v2 (原生 REST API + OSS 上传)');
      if (!this.dashScopeWorkspaceId) {
        this.logger.warn('⚠️ 未配置 DASHSCOPE_WORKSPACE_ID，TTS 需要 WorkspaceId');
      }
    } else {
      // 兜底：尝试 OpenAI
      const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
      const openaiBase = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';

      if (openaiKey && openaiKey !== 'sk-xxx' && openaiKey.length > 6) {
        this.openai = new OpenAI({ apiKey: openaiKey, baseURL: openaiBase });
        this.logger.log('🎤 OpenAI 语音客户端初始化完成（ASR: Whisper / TTS）');
      } else {
        this.logger.warn('⚠️ 未配置有效的 DASHSCOPE_API_KEY 或 OPENAI_API_KEY，语音功能不可用');
      }
    }
  }

  /* ════════════════════════════════════════
     语音识别 (ASR)
     ════════════════════════════════════════ */

  /**
   * 语音识别 (ASR)
   *
   * DashScope 模式: 使用 Paraformer v2 异步文件识别
   *   1. 获取临时 OSS 上传凭证
   *   2. 上传音频文件到 OSS
   *   3. 提交异步转录任务
   *   4. 轮询任务结果直到完成
   *
   * OpenAI 模式: 使用 Whisper-1 直接识别（兜底）
   */
  async speechToText(file: Express.Multer.File): Promise<{ text: string }> {
    // 验证音频格式
    const allowedExts = ['.mp3', '.wav', '.ogg', '.webm', '.mp4', '.m4a', '.flac', '.wma', '.aac'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (!allowedExts.includes(ext)) {
      throw new BadRequestException(`不支持的音频格式: ${ext}。支持: ${allowedExts.join(', ')}`);
    }

    if (this.useDashScope && this.dashScopeHttp) {
      return this.dashScopeAsr(file);
    }

    if (this.openai) {
      return this.openaiWhisperAsr(file);
    }

    throw new BadRequestException('语音服务未配置（缺少 API Key）');
  }

  /**
   * DashScope Paraformer v2 异步文件识别
   *
   * 流程:
   *   1. GET /api/v1/uploads?action=getPolicy → 获取 OSS 上传凭证
   *   2. POST {upload_host} multipart → 上传文件到临时 OSS 存储
   *   3. POST /api/v1/services/audio/asr/transcription (async) → 提交转录任务
   *   4. GET /api/v1/tasks/{task_id} → 轮询直到 SUCCEEDED
   */
  private async dashScopeAsr(file: Express.Multer.File): Promise<{ text: string }> {
    const model = 'paraformer-v2';

    try {
      // 步骤1: 获取临时上传凭证
      this.logger.log('📤 [ASR 步骤1] 获取临时 OSS 上传凭证...');
      const policy = await this.getUploadPolicy(model);

      // 步骤2: 上传文件到 OSS
      this.logger.log(`📤 [ASR 步骤2] 上传文件到 OSS: ${file.originalname}`);
      const ossUrl = await this.uploadFileToOSS(policy, file.path, file.originalname);

      // 步骤3: 提交异步转录任务
      this.logger.log('⏳ [ASR 步骤3] 提交异步转录任务...');
      const taskId = await this.submitTranscriptionTask(ossUrl);

      // 步骤4: 轮询结果
      this.logger.log(`⏳ [ASR 步骤4] 轮询任务结果 (task_id: ${taskId})...`);
      const taskResult = await this.pollTaskResult(taskId);

      // 提取文本
      const text = await this.extractTranscriptionText(taskResult);
      this.logger.log(`✅ ASR 完成: "${text.slice(0, 80)}..."`);
      return { text };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`❌ ASR 识别失败: ${msg}`);
      if (axios.isAxiosError(err) && err.response?.data) {
        this.logger.error(`   响应: ${JSON.stringify(err.response.data)}`);
      }
      throw new InternalServerErrorException(`语音识别失败: ${msg}`);
    }
  }

  /**
   * 步骤1: 获取临时 OSS 上传凭证
   */
  private async getUploadPolicy(model: string): Promise<any> {
    const response = await this.dashScopeHttp!.get('/api/v1/uploads', {
      params: { action: 'getPolicy', model },
    });

    if (response.status !== 200 || !response.data?.data) {
      throw new Error(`获取上传凭证失败: ${JSON.stringify(response.data)}`);
    }

    this.logger.log(`    upload_host: ${response.data.data.upload_host}`);
    this.logger.log(`    upload_dir:  ${response.data.data.upload_dir}`);
    return response.data.data;
  }

  /**
   * 步骤2: 上传文件到临时 OSS 存储（multipart/form-data）
   */
  private async uploadFileToOSS(policy: any, filePath: string, originalName: string): Promise<string> {
    const fileName = basename(originalName);
    const fileContent = readFileSync(filePath);
    const key = `${policy.upload_dir}/${fileName}`;

    // 使用 FormData 构建 multipart 请求
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('OSSAccessKeyId', policy.oss_access_key_id);
    form.append('Signature', policy.signature);
    form.append('policy', policy.policy);
    form.append('x-oss-object-acl', policy.x_oss_object_acl);
    form.append('x-oss-forbid-overwrite', policy.x_oss_forbid_overwrite);
    form.append('key', key);
    form.append('success_action_status', '200');
    form.append('file', fileContent, { filename: fileName, contentType: 'application/octet-stream' });

    const uploadResponse = await axios.post(policy.upload_host, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      timeout: 60000,
    });

    if (uploadResponse.status !== 200) {
      throw new Error(`上传到 OSS 失败 (${uploadResponse.status}): ${uploadResponse.data}`);
    }

    const ossUrl = `oss://${key}`;
    this.logger.log(`    oss:// URL: ${ossUrl}`);
    return ossUrl;
  }

  /**
   * 步骤3: 提交异步转录任务
   */
  private async submitTranscriptionTask(ossUrl: string): Promise<string> {
    const response = await this.dashScopeHttp!.post(
      '/api/v1/services/audio/asr/transcription',
      {
        model: 'paraformer-v2',
        input: { file_urls: [ossUrl] },
      },
      {
        headers: {
          'X-DashScope-Async': 'enable',
          'X-DashScope-OssResourceResolve': 'enable',
        },
      },
    );

    if (response.status !== 200) {
      throw new Error(`提交转录任务失败 (${response.status}): ${JSON.stringify(response.data)}`);
    }

    const taskId = response.data?.output?.task_id || response.data?.task_id;
    if (!taskId) {
      throw new Error(`无法获取 task_id: ${JSON.stringify(response.data)}`);
    }

    this.logger.log(`    task_id: ${taskId}`);
    return taskId;
  }

  /**
   * 步骤4: 轮询任务结果
   */
  private async pollTaskResult(taskId: string, maxRetries = 60, intervalMs = 2000): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      const response = await this.dashScopeHttp!.get(`/api/v1/tasks/${taskId}`);
      const status = response.data?.output?.task_status || response.data?.task_status;

      if (i % 5 === 0 || status === 'SUCCEEDED' || status === 'FAILED') {
        this.logger.log(`    轮询 ${i + 1}/${maxRetries}: task_status = ${status}`);
      }

      if (status === 'SUCCEEDED') {
        this.logger.log('✅ 转录任务完成');
        return response.data;
      }

      if (status === 'FAILED') {
        throw new Error(`转录任务失败: ${JSON.stringify(response.data?.output || response.data)}`);
      }

      // 等待后继续轮询
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error(`轮询超时 (${maxRetries * intervalMs / 1000}s), task_id: ${taskId}`);
  }

  /**
   * 从转录结果中提取文本
   */
  private async extractTranscriptionText(taskResult: any): Promise<string> {
    const output = taskResult.output || taskResult;
    const results = output.results || [];
    const firstResult = results[0] || {};
    const nestedOutput = firstResult.output || {};
    const transcriptionUrl = firstResult.transcription_url || nestedOutput.transcription_url || output.transcription_url;
    const inlineText = output.text || firstResult.text || nestedOutput.text;

    // 如果有 transcription_url 则下载详细结果
    if (transcriptionUrl) {
      try {
        this.logger.log('📥 下载详细转录结果...');
        const downloadResponse = await axios.get(transcriptionUrl, {
          timeout: 15000,
        });
        const data = downloadResponse.data;
        // 尝试从不同格式中提取文本
        if (typeof data === 'string') return data;
        // DashScope Paraformer 格式: { transcripts: [{ text: '...', sentences: [...] }] }
        if (data?.transcripts?.length > 0) {
          const text = data.transcripts.map((t: any) => t.text || '').filter(Boolean).join('\n');
          if (text) return text;
        }
        if (data?.text) return data.text;
        if (data?.transcriptions?.length > 0) return data.transcriptions[0]?.text || '';
        if (data?.results?.length > 0) return data.results[0]?.text || '';
        // 兜底：取第一个 non-empty 字符串字段
        for (const val of Object.values(data)) {
          if (typeof val === 'string' && val.length > 0) return val;
        }
        return JSON.stringify(data);
      } catch (err) {
        this.logger.warn(`下载转录结果失败: ${(err as Error).message}，使用内联文本`);
        return inlineText || '';
      }
    }

    return inlineText || '';
  }

  /**
   * OpenAI Whisper ASR（兜底）
   */
  private async openaiWhisperAsr(file: Express.Multer.File): Promise<{ text: string }> {
    const { createReadStream } = await import('fs');
    try {
      const transcription = await this.openai!.audio.transcriptions.create({
        file: createReadStream(file.path),
        model: 'whisper-1',
        language: 'zh',
        response_format: 'verbose_json',
      });

      const text = transcription.text;
      this.logger.log(`✅ OpenAI Whisper ASR 完成: "${text.slice(0, 50)}..."`);
      return { text };
    } catch (err) {
      this.logger.error(`OpenAI Whisper ASR 失败: ${(err as Error).message}`);
      throw new InternalServerErrorException('语音识别失败，请稍后重试');
    }
  }

  /* ════════════════════════════════════════
     语音合成 (TTS)
     ════════════════════════════════════════ */

  async textToSpeech(
    text: string,
    voice: string = 'longanyang',
    baseUrl: string = '',
  ): Promise<{ url: string }> {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('文本内容不能为空');
    }
    if (text.length > 4096) {
      throw new BadRequestException('文本过长（最多 4096 字符）');
    }

    if (this.useDashScope && this.dashScopeApiKey) {
      return this.dashScopeTts(text, voice, baseUrl);
    }
    if (this.openai) {
      return this.openaiTts(text, voice, baseUrl);
    }
    throw new BadRequestException('语音服务未配置（缺少 API Key）');
  }

  /**
   * 通过 DashScope CosyVoice 合成语音
   *
   * 使用非流式 HTTP API，SDK 参考:
   *   POST /api/v1/services/audio/tts/SpeechSynthesizer
   *   body: { model, input: { text, voice, format, sample_rate } }
   *   response: { output: { audio: { url, id, expires_at } } }
   */
  private async dashScopeTts(text: string, voice: string, baseUrl: string = ''): Promise<{ url: string }> {
    const dashScopeVoice = DASHSCOPE_VOICE_MAP[voice] || 'longanyang';

    // 构造 Workspace 专属端点
    const workspaceId = this.dashScopeWorkspaceId;
    if (!workspaceId) {
      throw new BadRequestException('未配置 DASHSCOPE_WORKSPACE_ID，无法使用 TTS');
    }
    const ttsEndpoint =
      `https://${workspaceId}.cn-beijing.maas.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer`;

    try {
      // 1) 调用 CosyVoice API 获取音频 URL
      const synthesisResponse = await axios.post(
        ttsEndpoint,
        {
          model: 'cosyvoice-v3-flash',
          input: {
            text,
            voice: dashScopeVoice,
            format: 'wav',
            sample_rate: 24000,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.dashScopeApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // 2) 从响应中提取音频 URL（DashScope OSS 直链，可直接下载）
      const audioUrl: string | undefined =
        synthesisResponse.data?.output?.audio?.url;

      if (!audioUrl) {
        this.logger.error(`DashScope TTS 响应缺少 audio.url: ${JSON.stringify(synthesisResponse.data)}`);
        throw new Error('合成响应中未找到音频 URL');
      }

      this.logger.log(`✅ DashScope TTS 完成: "${text.slice(0, 50)}..." → OSS URL`);
      return { url: audioUrl };
    } catch (err) {
      // 尝试解析错误响应体
      if (axios.isAxiosError(err) && err.response?.data) {
        let detail = '';
        try {
          detail = typeof err.response.data === 'string'
            ? err.response.data
            : JSON.stringify(err.response.data);
        } catch {
          detail = String(err.response.data);
        }
        this.logger.error(`DashScope TTS 失败 (${err.response.status}): ${detail}`);
      } else {
        this.logger.error(`DashScope TTS 失败: ${(err as Error).message}`);
      }
      throw new InternalServerErrorException('语音合成失败，请稍后重试');
    }
  }

  /**
   * 通过 OpenAI TTS 合成语音（兜底）
   */
  private async openaiTts(text: string, voice: string, baseUrl: string = ''): Promise<{ url: string }> {
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'alloy';

    try {
      const response = await this.openai!.audio.speech.create({
        model: 'tts-1',
        voice: selectedVoice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
        input: text,
        response_format: 'mp3',
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      const filename = `${randomUUID()}.mp3`;
      const filePath = join(this.audioDir, filename);
      await writeFile(filePath, buffer);

      const url = `${baseUrl}/uploads/audio/${filename}`;
      this.logger.log(`✅ OpenAI TTS 完成: "${text.slice(0, 50)}..." → ${filename}`);
      return { url };
    } catch (err) {
      this.logger.error(`OpenAI TTS 失败: ${(err as Error).message}`);
      throw new InternalServerErrorException('语音合成失败，请稍后重试');
    }
  }
}
