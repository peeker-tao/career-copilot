import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

/**
 * 系统启动时自动播种学习资源
 *
 * 当数据库中学习资源数量 < 100 条时，自动调用 AI 生成覆盖多个领域的
 * 经典学习资源并持久化到数据库，确保系统开箱即有丰富内容。
 */
@Injectable()
export class LearningResourcesSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LearningResourcesSeedService.name);
  private readonly MIN_RESOURCES = 100;

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async onApplicationBootstrap() {
    // 延迟 10 秒再执行，让服务完全就绪
    await new Promise((r) => setTimeout(r, 10_000));

    try {
      const count = await this.prisma.learningResource.count();
      this.logger.log(`📊 当前学习资源数量: ${count}`);

      if (count >= this.MIN_RESOURCES) {
        this.logger.log(`✅ 资源已足够 (${count} >= ${this.MIN_RESOURCES})，跳过 AI 播种`);
        return;
      }

      const needed = this.MIN_RESOURCES - count;
      this.logger.log(`🌱 资源不足，需要补充 ${needed} 条，启动 AI 播种...`);

      // 分 4 轮生成，每轮约 25-30 条，避免单次超长
      const rounds = [
        {
          domains: ['前端开发（Frontend Development）', '后端开发（Backend Development）', '数据库（Database）'],
        },
        {
          domains: ['移动开发（Mobile Development）', 'AI / 机器学习（AI / Machine Learning）', '数据科学（Data Science）'],
        },
        {
          domains: ['DevOps / CI/CD', '云计算（Cloud Computing）', '网络安全（Cybersecurity）'],
        },
        {
          domains: ['UI / UX 设计', '项目管理与敏捷（Project Management）', '软件测试 / QA'],
        },
      ];

      let totalGenerated = 0;
      for (let i = 0; i < rounds.length; i++) {
        if (totalGenerated >= needed) break;

        const roundNeeded = Math.min(Math.ceil((needed - totalGenerated) / (rounds.length - i)), 30);
        if (roundNeeded <= 0) break;

        this.logger.log(`🔄 第 ${i + 1} 轮播种：${rounds[i].domains.join('、')}（目标 ${roundNeeded} 条）`);
        try {
          const generated = await this.generateRound(rounds[i].domains, roundNeeded);
          totalGenerated += generated;
          this.logger.log(`✅ 第 ${i + 1} 轮完成，本轮生成 ${generated} 条，累计 ${totalGenerated} 条`);
        } catch (err) {
          this.logger.error(`❌ 第 ${i + 1} 轮播种失败: ${(err as Error).message}`);
        }

        // 每轮间隔 3 秒，避免 API 限流
        if (i < rounds.length - 1) {
          await new Promise((r) => setTimeout(r, 3_000));
        }
      }

      const finalCount = await this.prisma.learningResource.count();
      this.logger.log(`🎉 AI 播种完成！最终资源总数: ${finalCount}`);
    } catch (err) {
      this.logger.error(`❌ AI 播种过程异常: ${(err as Error).message}`);
    }
  }

  /**
   * 生成一轮指定领域的学习资源
   * @returns 成功生成的资源数量
   */
  private async generateRound(domains: string[], targetCount: number): Promise<number> {
    const systemPrompt = `你是一个专业的学习资源推荐专家。请根据指定的技术领域，推荐高质量的学习资源。

以严格的 JSON 数组格式返回（不要包含 markdown 代码块标记），每条包含：
- title: 资源标题（中文，简洁明确）
- url: 资源链接（必须是知名平台的真实链接，如 MDN、Coursera、Udemy、freeCodeCamp、YouTube、B站、掘金、菜鸟教程、Runoob、W3Schools、官方文档等）
- type: 资源类型，可选值：course | article | video | book | documentation
- category: 所属技能分类（中文，如"前端开发""AI/机器学习"）
- tags: 相关标签数组（英文关键词，如 ["React", "TypeScript"]）
- description: 简短描述（中文，20-50 字）
- provider: 平台名称（如 MDN、Coursera、freeCodeCamp、YouTube、掘金、Runoob 等）
- difficulty: 难度，可选值：beginner | intermediate | advanced
- duration: 学习时长估计（如 "10 小时""4 周""3 天"）
- rating: 评分（0-5 之间的小数）

⚠️ 重要：
1. 每条资源的 url 必须是真实存在的知名学习平台链接
2. 覆盖不同难度等级（入门、进阶、高级）
3. 包含不同类型的资源（课程、文章、视频、书籍、文档）
4. 尽量使用中文资源（如 B站、掘金、菜鸟教程）和英文资源结合
5. 优先推荐免费资源`;

    const userPrompt = `请为以下 ${domains.length} 个技术领域各推荐一批学习资源，总共约 ${targetCount} 条，尽量均匀分布：

${domains.map((d, i) => `${i + 1}. ${d}`).join('\n')}

要求：
- 每条资源必须有可访问的真实链接
- 覆盖 beginner / intermediate / advanced 三个难度级别
- 包含 course、article、video、book、documentation 等多种类型
- 如果某个领域有经典的免费资源（如 freeCodeCamp、MDN、B站教程），优先推荐`;

    try {
      const raw = await this.aiService.callLLM(
        systemPrompt,
        userPrompt,
        0.3,
        'learning:seed',
      );

      let resources: any[];
      if (Array.isArray(raw)) {
        resources = raw;
      } else if (raw && typeof raw === 'object' && 'resources' in raw) {
        resources = (raw as any).resources;
      } else if (raw && typeof raw === 'object' && 'data' in raw) {
        resources = (raw as any).data;
      } else {
        resources = [];
      }

      if (!Array.isArray(resources) || resources.length === 0) {
        this.logger.warn('⚠️ AI 返回的资源为空，跳过本轮');
        return 0;
      }

      this.logger.log(`📥 AI 返回 ${resources.length} 条资源，开始持久化...`);

      let savedCount = 0;
      for (const r of resources) {
        if (!r.title || !r.url || !r.category) {
          this.logger.warn(`⚠️ 跳过无效资源: ${JSON.stringify(r)}`);
          continue;
        }

        // 检查是否已存在（按 title + url 去重）
        const exists = await this.prisma.learningResource.findFirst({
          where: { title: r.title, url: r.url },
        });
        if (exists) continue;

        try {
          await this.prisma.learningResource.create({
            data: {
              title: r.title,
              url: r.url,
              type: this.normalizeType(r.type),
              category: r.category,
              tags: Array.isArray(r.tags) ? r.tags : [],
              description: r.description || null,
              provider: r.provider || null,
              difficulty: this.normalizeDifficulty(r.difficulty),
              duration: r.duration || null,
              rating: typeof r.rating === 'number' ? Math.max(0, Math.min(5, r.rating)) : null,
              relevanceScore: 5.0,
              aiGenerated: true,
            },
          });
          savedCount++;
        } catch (err) {
          this.logger.warn(`⚠️ 保存资源失败 [${r.title}]: ${(err as Error).message}`);
        }
      }

      this.logger.log(`💾 本轮成功保存 ${savedCount}/${resources.length} 条资源`);
      return savedCount;
    } catch (err) {
      this.logger.error(`❌ AI 调用失败: ${(err as Error).message}`);
      return 0;
    }
  }

  private normalizeType(type: string): string {
    const validTypes = ['course', 'article', 'video', 'book', 'documentation'];
    const t = (type || '').toLowerCase().trim();
    if (validTypes.includes(t)) return t;
    // 模糊匹配
    if (t.includes('课') || t.includes('course')) return 'course';
    if (t.includes('文章') || t.includes('article')) return 'article';
    if (t.includes('视频') || t.includes('video')) return 'video';
    if (t.includes('书') || t.includes('book')) return 'book';
    if (t.includes('文档') || t.includes('doc')) return 'documentation';
    return 'article';
  }

  private normalizeDifficulty(difficulty: string): string {
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    const d = (difficulty || '').toLowerCase().trim();
    if (validLevels.includes(d)) return d;
    if (d.includes('入门') || d.includes('初级') || d.includes('beginner')) return 'beginner';
    if (d.includes('中级') || d.includes('intermediate')) return 'intermediate';
    if (d.includes('高级') || d.includes('进阶') || d.includes('advanced')) return 'advanced';
    return 'intermediate';
  }
}
