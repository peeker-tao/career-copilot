import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CareerPlanner } from './career.planner';

@Injectable()
export class CareerService {
  private readonly logger = new Logger(CareerService.name);

  constructor(
    private prisma: PrismaService,
    private careerPlanner: CareerPlanner,
  ) {}

  async createPlan(
    userId: string,
    data: {
      targetPosition: string;
      currentSkills?: string[];
      resumeId?: string;
    },
  ) {
    // 1. 调用 AI 生成职业规划（差距分析 + 学习路线 + 市场洞察）
    const planResult = await this.careerPlanner.generate({
      targetPosition: data.targetPosition,
      currentSkills: data.currentSkills || [],
    });

    this.logger.log(
      `✅ 职业规划 AI 生成完成: gapSkills=${planResult.gapSkills.length} 项, roadmap=${planResult.roadmap.length} 阶段`,
    );

    // 2. 持久化到数据库
    const plan = await this.prisma.careerPlan.create({
      data: {
        userId,
        targetPosition: data.targetPosition,
        currentSkills: data.currentSkills || [],
        gapSkills: planResult.gapSkills,
        roadmap: JSON.parse(JSON.stringify(planResult.roadmap)),
        marketInsight: JSON.parse(JSON.stringify(planResult.marketInsight)),
        progress: 0,
      },
    });

    return plan;
  }

  async getPlans(userId: string) {
    return this.prisma.careerPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPlan(id: string, userId: string) {
    const plan = await this.prisma.careerPlan.findFirst({
      where: { id, userId },
    });

    if (!plan) {
      throw new NotFoundException('职业规划不存在');
    }

    return plan;
  }
}
