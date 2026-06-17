import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage, ChatOptions, LLMProvider } from '../llm.provider';

export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseURL: string;
  model: string;
}

@Injectable()
export class OpenAICompatibleProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;
  public readonly name: string;

  constructor(config: ProviderConfig) {
    this.name = config.name;
    this.model = config.model;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: 60_000,
      maxRetries: 2,
    });
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    const response = await this.client.chat.completions.create(
      {
        model: this.model,
        messages:
          messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 8192,
      },
      { signal: options?.signal },
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`[${this.name}] LLM 返回为空`);
    }
    return content;
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create(
      {
        model: this.model,
        messages:
          messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 8192,
        stream: true,
      },
      { signal: options?.signal },
    );

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
