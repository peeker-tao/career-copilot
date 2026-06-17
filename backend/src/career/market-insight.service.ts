// ============================================================
// 市场洞察服务 — AI 生成模拟市场数据
// T-016: Market Insight Service
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import {
  buildMarketInsightSystemPrompt,
  buildMarketInsightUserPrompt,
} from '../ai/prompts/market.insight';

export interface MarketInsightResult {
  averageSalary: string;
  demandTrend: string;
  topSkills: string[];
  experienceDistribution: {
    entry: string;
    junior: string;
    mid: string;
    senior: string;
  };
}

@Injectable()
export class MarketInsightService {
  private readonly logger = new Logger(MarketInsightService.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * 获取目标岗位的市场洞察数据
   * 通过 LLM 生成模拟但合理的市场数据
   */
  async getInsight(position: string): Promise<MarketInsightResult> {
    this.logger.log(`🔍 获取市场洞察: position=${position}`);

    const systemPrompt = buildMarketInsightSystemPrompt();
    const userPrompt = buildMarketInsightUserPrompt(position);

    const raw = await this.aiService.callLLM(systemPrompt, userPrompt, 0.5);

    // 解析并转换为 MarketInsightResult
    return this.transform(raw, position);
  }

  private transform(
    raw: Record<string, unknown>,
    position: string,
  ): MarketInsightResult {
    return {
      averageSalary: (raw.averageSalary as string) ?? '10K-25K',
      demandTrend: (raw.demandTrend as string) ?? '稳定增长',
      topSkills: Array.isArray(raw.topSkills)
        ? (raw.topSkills as string[])
        : [],
      experienceDistribution: {
        entry:
          ((raw.experienceDistribution as Record<string, string>)
            ?.entry as string) ?? '20%',
        junior:
          ((raw.experienceDistribution as Record<string, string>)
            ?.junior as string) ?? '35%',
        mid:
          ((raw.experienceDistribution as Record<string, string>)
            ?.mid as string) ?? '30%',
        senior:
          ((raw.experienceDistribution as Record<string, string>)
            ?.senior as string) ?? '15%',
      },
    };
  }
}
