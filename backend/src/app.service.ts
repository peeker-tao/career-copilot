import { Injectable } from '@nestjs/common';
import { PrismaService } from './common/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDashboard(userId: string) {
    // 1. 获取统计数据
    const [totalInterviews, totalResumes, activePlans] = await Promise.all([
      this.prisma.interview.count({
        where: { userId },
      }),
      this.prisma.resume.count({
        where: { userId },
      }),
      this.prisma.careerPlan.count({
        where: { 
          userId,
          progress: { lt: 100 }
        },
      }),
    ]);

    // 2. 计算平均面试分数
    const interviewsWithScore = await this.prisma.interview.findMany({
      where: { 
        userId,
        score: { not: null }
      },
      select: { score: true },
    });

    const averageScore = interviewsWithScore.length > 0
      ? Math.round(
          interviewsWithScore.reduce((sum, i) => sum + (i.score || 0), 0) /
            interviewsWithScore.length,
        )
      : 0;

    // 3. 获取最近的面试记录（最近5条）
    const recentInterviews = await this.prisma.interview.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        targetPosition: true,
        score: true,
        completedAt: true,
      },
    });

    // 4. 获取最近的职业规划（最近5条）
    const recentPlans = await this.prisma.careerPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        targetPosition: true,
        progress: true,
      },
    });

    // 5. 获取分数趋势（最近10次有分数的面试）
    const scoreTrendData = await this.prisma.interview.findMany({
      where: {
        userId,
        score: { not: null },
        completedAt: { not: null },
      },
      orderBy: { completedAt: 'asc' },
      take: 10,
      select: {
        score: true,
        completedAt: true,
      },
    });

    const scoreTrend = scoreTrendData.map((item) => ({
      date: item.completedAt!.toISOString().split('T')[0],
      score: item.score!,
    }));

    return {
      stats: {
        totalInterviews,
        averageScore,
        totalResumes,
        activePlans,
      },
      recentInterviews,
      recentPlans,
      scoreTrend,
    };
  }
}
