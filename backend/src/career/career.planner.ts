// ============================================================
// 职业规划引擎 — 差距分析 + 学习路线 + 市场洞察
// T-015: Career Planner
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import type { RoadmapPhase } from '../ai/prompts/career.planner';

export interface CareerPlanInput {
  targetPosition: string;
  currentSkills: string[];
  experience?: string;
  education?: string;
  goals?: string;
}

export interface CareerPlanOutput {
  gapSkills: string[];
  roadmap: RoadmapPhase[];
  marketInsight: {
    marketDemand: string;
    estimatedTimeline: string;
    summary: string;
  };
}

@Injectable()
export class CareerPlanner {
  private readonly logger = new Logger(CareerPlanner.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * 生成职业规划：差距分析 + 学习路线 + 市场洞察
   * 使用 AiService.generateCareerPlan() 获取 AI 结果后，
   * 转换为 CareerPlan schema 所需的格式（gapSkills[], roadmap Json, marketInsight Json）
   */
  async generate(input: CareerPlanInput): Promise<CareerPlanOutput> {
    this.logger.log(
      `🔍 开始生成职业规划: targetPosition=${input.targetPosition}`,
    );

    // 1. 调用 AI 获取原始结果
    const raw = await this.aiService.generateCareerPlan({
      currentSkills: input.currentSkills,
      targetPosition: input.targetPosition,
      experience: input.experience,
      education: input.education,
      goals: input.goals,
    });

    // 2. 转换为 CareerPlan schema 所需的结构
    return this.transform(raw, input);
  }

  /**
   * 将 AiService 返回的通用结构转换为 CareerPlan 字段
   */
  private transform(
    raw: Record<string, unknown>,
    input: CareerPlanInput,
  ): CareerPlanOutput {
    // gapAnalysis → gapSkills[]
    const gapAnalysis = raw.gapAnalysis as
      | { missingSkills?: string[]; recommendedSkills?: string[] }
      | undefined;

    const missing = gapAnalysis?.missingSkills ?? [];
    const recommended = gapAnalysis?.recommendedSkills ?? [];
    // 去重合并：缺少技能 + 推荐技能
    const gapSet = new Set([...missing, ...recommended]);
    const gapSkills = [...gapSet];

    // roadmap → RoadmapPhase[]
    const rawRoadmap = Array.isArray(raw.roadmap) ? raw.roadmap : [];
    const roadmap: RoadmapPhase[] = rawRoadmap.map(
      (phase: Record<string, unknown>, idx: number) => ({
        phase: (phase.phase as number) ?? idx + 1,
        title: (phase.name as string) ?? `阶段 ${idx + 1}`,
        goal: (phase.focus as string) ?? '',
        skills: Array.isArray(phase.topics)
          ? (phase.topics as Array<Record<string, unknown>>)
              .map((t) => t.name as string)
              .filter(Boolean)
          : [],
        estimatedWeeks: this.parseWeeks(phase.duration as string | undefined),
        resources: Array.isArray(phase.topics)
          ? (phase.topics as Array<Record<string, unknown>>).flatMap((t) => {
              const resources = t.resources as string[] | undefined;
              return resources
                ? resources.map((r) => ({
                    name: r,
                    type: 'course' as const,
                    description: `推荐学习：${r}`,
                  }))
                : [];
            })
          : [],
      }),
    );

    // milestones + summary → marketInsight
    const summary = (raw.summary as string) ?? '';
    const rawMilestones = Array.isArray(raw.milestones) ? raw.milestones : [];
    const estimatedTimeline =
      rawMilestones.length > 0
        ? rawMilestones
            .map(
              (m: Record<string, unknown>) => `${m.name}: ${m.estimatedTime}`,
            )
            .join(' → ')
        : `${roadmap.reduce((sum, p) => sum + p.estimatedWeeks, 0)} 周`;

    const marketInsight = {
      marketDemand: this.estimateMarketDemand(input.targetPosition),
      estimatedTimeline,
      summary: summary || `针对 ${input.targetPosition} 岗位的系统性学习计划`,
    };

    return { gapSkills, roadmap, marketInsight };
  }

  /**
   * 解析时长字符串（如 "1-2个月"、"4周"）为周数
   */
  private parseWeeks(duration: string | undefined): number {
    if (!duration) return 4;
    const numMatch = duration.match(/(\d+)/);
    if (!numMatch) return 4;
    const num = parseInt(numMatch[1], 10);
    if (duration.includes('月')) return num * 4;
    if (duration.includes('周')) return num;
    return num;
  }

  /**
   * 根据目标岗位生成简要的市场需求描述
   */
  private estimateMarketDemand(position: string): string {
    return `${position} 是当前热门的岗位方向，市场需求持续增长。建议结合行业趋势，重点关注该岗位的核心技能栈和项目经验积累。`;
  }
}
