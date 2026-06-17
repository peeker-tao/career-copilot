// ============================================================
// LLM Provider 统一接口 & 工厂
// 支持多模型：OpenAI、通义千问 (DashScope)、DeepSeek
// ============================================================

import { ConfigService } from '@nestjs/config';
import { OpenAICompatibleProvider, ProviderConfig } from './providers/openai-compatible.provider';

/* ────────── 类型定义 ────────── */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface LLMProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<string>;
}

/* ────────── Provider 元信息 ────────── */

interface ProviderMeta {
  name: string;
  envKey: string;
  defaultBaseURL: string;
  defaultModel: string;
}

const PROVIDER_REGISTRY: Record<string, ProviderMeta> = {
  openai: {
    name: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    defaultBaseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  dashscope: {
    name: '通义千问',
    envKey: 'DASHSCOPE_API_KEY',
    defaultBaseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-turbo',
  },
  deepseek: {
    name: 'DeepSeek',
    envKey: 'DEEPSEEK_API_KEY',
    defaultBaseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
};

/* ────────── 工厂 ────────── */

/**
 * 根据环境变量自动选择合适的 Provider。
 * 优先级：LLM_PROVIDER 显式指定 > OpenAI > 通义千问 > DeepSeek
 */
export function createProvider(configService: ConfigService): LLMProvider {
  // 1) 用户显式指定的 provider
  const explicit = configService.get<string>('LLM_PROVIDER')?.toLowerCase();
  if (explicit && PROVIDER_REGISTRY[explicit]) {
    return buildProvider(PROVIDER_REGISTRY[explicit], configService);
  }

  // 2) 自动检测：谁的 API Key 不为空且不是占位符就用谁
  const candidates = ['openai', 'dashscope', 'deepseek'] as const;
  for (const id of candidates) {
    const meta = PROVIDER_REGISTRY[id];
    const key = configService.get<string>(meta.envKey) || '';
    if (key && key !== 'sk-xxx' && key.length > 6) {
      return buildProvider(meta, configService);
    }
  }

  // 3) 兜底：用 OpenAI，让用户去配 key
  return buildProvider(PROVIDER_REGISTRY.openai, configService, true);
}

function buildProvider(
  meta: ProviderMeta,
  configService: ConfigService,
  warnIfMissingKey = false,
): LLMProvider {
  const apiKey = configService.get<string>(meta.envKey) || 'sk-placeholder';
  const baseURL =
    configService.get<string>(`${meta.envKey.replace('_API_KEY', '_BASE_URL')}`) ||
    meta.defaultBaseURL;
  const model =
    configService.get<string>(`${meta.envKey.replace('_API_KEY', '_MODEL')}`) ||
    meta.defaultModel;

  if (warnIfMissingKey || apiKey === 'sk-placeholder' || apiKey === 'sk-xxx') {
    console.warn(
      `[LLM] ⚠️ 未检测到有效的 API Key (${meta.envKey})，请配置后使用。` +
        `当前使用 ${meta.name} (${model}) 作为默认 provider。`,
    );
  }

  const config: ProviderConfig = { name: meta.name, apiKey, baseURL, model };
  return new OpenAICompatibleProvider(config);
}

