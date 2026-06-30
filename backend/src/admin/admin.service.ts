import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../common/prisma.service';
import { AdminQueryDto, AdminUpdateUserDto, AdminChangePasswordDto } from './dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  /* ========================================
     Dashboard 统计
     ======================================== */

  /** 获取Dashboard统计数据 */
  async getDashboardStats() {
    const [
      userCount,
      resumeCount,
      interviewCount,
      careerPlanCount,
      questionCount,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.resume.count(),
      this.prisma.interview.count(),
      this.prisma.careerPlan.count(),
      this.prisma.questionBank.count(),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          education: true,
          targetPosition: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    // 获取最近7天的每日统计数据（用户注册数）
    const dailyStats = await this.getDailyStats();

    return {
      userCount,
      resumeCount,
      interviewCount,
      careerPlanCount,
      questionCount,
      recentUsers,
      dailyStats,
    };
  }

  /** 获取最近7天的每日统计数据 */
  private async getDailyStats() {
    const now = new Date();
    const stats = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      stats.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    return stats;
  }

  /* ========================================
     用户管理
     ======================================== */

  /** 获取用户列表（分页 + 搜索） */
  async listUsers(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          education: true,
          targetPosition: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** 获取单个用户详情 */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        education: true,
        targetPosition: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            resumes: true,
            interviews: true,
            careerPlans: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  /** 更新用户信息 */
  async updateUser(id: string, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 如果修改邮箱，检查唯一性
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('该邮箱已被占用');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.education !== undefined && { education: dto.education }),
        ...(dto.targetPosition !== undefined && { targetPosition: dto.targetPosition }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        education: true,
        targetPosition: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`👤 管理员更新用户: userId=${id}`);
    return updated;
  }

  /** 删除用户（级联删除关联数据） */
  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // Prisma schema 已配置级联删除（onDelete: Cascade），无需手动删关联
    await this.prisma.user.delete({ where: { id } });

    this.logger.warn(`🗑️ 管理员删除用户: userId=${id}, email=${user.email}`);
  }

  /** 管理员重置用户密码 */
  async resetPassword(id: string, dto: AdminChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    this.logger.log(`🔑 管理员重置密码: userId=${id}`);
  }

  /* ========================================
     简历管理
     ======================================== */

  /** 获取全部简历列表（跨用户，分页） */
  async listResumes(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.resume.count({ where }),
    ]);

    // 映射字段：将 title 映射为 fileName，根据 fileUrl 读取实际文件大小
    const mappedItems = items.map((item) => {
      let fileSize = null;

      // 如果文件存储在本地，尝试读取实际大小
      if (item.fileUrl && item.fileUrl.startsWith('/uploads/')) {
        try {
          const fullPath = path.join(process.cwd(), item.fileUrl);
          if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            fileSize = stats.size;
          }
        } catch (err) {
          this.logger.warn(`无法读取文件大小: ${item.fileUrl}, ${(err as Error).message}`);
        }
      }

      return {
        ...item,
        fileName: item.title,
        fileSize,
      };
    });

    return {
      items: mappedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** 获取简历详情 */
  async getResumeById(id: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!resume) {
      throw new NotFoundException('简历不存在');
    }

    // 映射字段，读取真实文件大小
    let fileSize = null;

    if (resume.fileUrl && resume.fileUrl.startsWith('/uploads/')) {
      try {
        const fullPath = path.join(process.cwd(), resume.fileUrl);
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          fileSize = stats.size;
        }
      } catch (err) {
        this.logger.warn(`无法读取文件大小: ${resume.fileUrl}, ${(err as Error).message}`);
      }
    }

    return {
      ...resume,
      fileName: resume.title,
      fileSize,
    };
  }

  /** 删除任意简历 */
  async deleteResume(id: string) {
    const resume = await this.prisma.resume.findUnique({ where: { id } });
    if (!resume) {
      throw new NotFoundException('简历不存在');
    }

    // 删除本地文件
    if (resume.fileUrl) {
      try {
        const fs = await import('fs');
        if (fs.existsSync(resume.fileUrl)) {
          fs.unlinkSync(resume.fileUrl);
        }
      } catch {
        // 文件已不存在则忽略
      }
    }

    await this.prisma.resume.delete({ where: { id } });

    this.logger.warn(`🗑️ 管理员删除简历: resumeId=${id}, userId=${resume.userId}`);
  }

  /* ========================================
     面试管理
     ======================================== */

  /** 获取全部面试列表（跨用户，分页） */
  async listInterviews(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { targetPosition: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.interview.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.interview.count({ where }),
    ]);

    // 映射字段：将 targetPosition 映射为 position
    const mappedItems = items.map((item) => ({
      ...item,
      position: item.targetPosition,
    }));

    return {
      items: mappedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** 获取面试详情（含消息） */
  async getInterviewById(id: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('面试不存在');
    }

    // 映射字段
    return {
      ...interview,
      position: interview.targetPosition,
    };
  }

  /** 删除任意面试 */
  async deleteInterview(id: string) {
    const interview = await this.prisma.interview.findUnique({ where: { id } });
    if (!interview) {
      throw new NotFoundException('面试不存在');
    }

    await this.prisma.interview.delete({ where: { id } });

    this.logger.warn(`🗑️ 管理员删除面试: interviewId=${id}, userId=${interview.userId}`);
  }

  /* ========================================
     职业规划管理
     ======================================== */

  /** 获取全部职业规划列表（跨用户，分页） */
  async listCareerPlans(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { targetPosition: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.careerPlan.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.careerPlan.count({ where }),
    ]);

    // 映射字段：生成title和status
    const mappedItems = items.map((item) => ({
      ...item,
      title: `${item.targetPosition}职业规划`,
      status: item.progress === 100 ? 'completed' : item.progress > 0 ? 'processing' : 'draft',
    }));

    return {
      items: mappedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** 获取职业规划详情 */
  async getCareerPlanById(id: string) {
    const plan = await this.prisma.careerPlan.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('职业规划不存在');
    }

    return plan;
  }

  /** 删除任意职业规划 */
  async deleteCareerPlan(id: string) {
    const plan = await this.prisma.careerPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('职业规划不存在');
    }

    await this.prisma.careerPlan.delete({ where: { id } });

    this.logger.warn(`🗑️ 管理员删除职业规划: planId=${id}, userId=${plan.userId}`);
  }

  /* ========================================
     学习资源管理
     ======================================== */

  /** 获取全部学习资源列表（分页 + 筛选） */
  async listLearningResources(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { search, category } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.learningResource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.learningResource.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** 获取学习资源详情 */
  async getLearningResourceById(id: string) {
    const resource = await this.prisma.learningResource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException('学习资源不存在');
    }

    return resource;
  }

  /** 创建学习资源 */
  async createLearningResource(data: any) {
    const resource = await this.prisma.learningResource.create({
      data: {
        title: data.title,
        description: data.description || '',
        url: data.url || '',
        category: data.category || '',
        type: data.type || 'article',
        difficulty: data.difficulty || 'medium',
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map((t: string) => t.trim()) : []),
        relevanceScore: data.relevanceScore || 0,
        usageCount: 0,
      },
    });

    this.logger.log(`📚 管理员创建学习资源: resourceId=${resource.id}, title=${resource.title}`);
    return resource;
  }

  /** 更新学习资源 */
  async updateLearningResource(id: string, data: any) {
    const resource = await this.prisma.learningResource.findUnique({ where: { id } });
    if (!resource) {
      throw new NotFoundException('学习资源不存在');
    }

    const updated = await this.prisma.learningResource.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.tags !== undefined && {
          tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map((t: string) => t.trim()) : [])
        }),
        ...(data.relevanceScore !== undefined && { relevanceScore: data.relevanceScore }),
      },
    });

    this.logger.log(`✏️ 管理员更新学习资源: resourceId=${id}`);
    return updated;
  }

  /** 删除学习资源 */
  async deleteLearningResource(id: string) {
    const resource = await this.prisma.learningResource.findUnique({ where: { id } });
    if (!resource) {
      throw new NotFoundException('学习资源不存在');
    }

    await this.prisma.learningResource.delete({ where: { id } });

    this.logger.warn(`🗑️ 管理员删除学习资源: resourceId=${id}, title=${resource.title}`);
    return { message: `学习资源 "${resource.title}" 已删除` };
  }

  /* ========================================
     题库管理
     ======================================== */

  /** 获取全部题目列表（分页 + 筛选） */
  async listQuestions(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { search, category } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { path: '$.question', stringContains: search, mode: 'insensitive' as any } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.questionBank.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.questionBank.count({ where }),
    ]);

    // 映射字段：将 title 映射为 question，从 content 中提取 answer 和 explanation
    const mappedItems = items.map((item) => {
      const contentData = item.content as any;
      return {
        id: item.id,
        question: item.title,
        answer: contentData?.answer || '',
        explanation: contentData?.explanation || '',
        category: item.category,
        difficulty: item.difficulty,
        type: item.type,
        tags: item.tags,
        source: item.source,
        usageCount: item.usageCount,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    return {
      items: mappedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** 获取题目详情 */
  async getQuestionById(id: string) {
    const question = await this.prisma.questionBank.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('题目不存在');
    }

    // 映射字段
    const contentData = question.content as any;
    return {
      id: question.id,
      question: question.title,
      answer: contentData?.answer || '',
      explanation: contentData?.explanation || '',
      options: contentData?.options || null,
      category: question.category,
      difficulty: question.difficulty,
      type: question.type,
      tags: question.tags,
      source: question.source,
      usageCount: question.usageCount,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  /** 创建题目 */
  async createQuestion(data: any) {
    // 构建 content 对象
    const content: any = {
      question: data.question,
      answer: data.answer || '',
    };

    if (data.explanation) {
      content.explanation = data.explanation;
    }

    if (data.options && Array.isArray(data.options)) {
      content.options = data.options;
    }

    const question = await this.prisma.questionBank.create({
      data: {
        category: data.category || 'general',
        type: data.type || 'short_answer',
        difficulty: data.difficulty || 'medium',
        title: data.question,
        content: content,
        tags: Array.isArray(data.tags)
          ? data.tags
          : data.tags
          ? data.tags.split(',').map((t: string) => t.trim())
          : [],
        source: data.source || 'manual',
      },
    });

    this.logger.log(
      `❓ 管理员创建题目: questionId=${question.id}, title=${question.title}`,
    );

    // 返回映射后的数据
    return {
      id: question.id,
      question: question.title,
      answer: content.answer,
      explanation: content.explanation || '',
      category: question.category,
      difficulty: question.difficulty,
      type: question.type,
      tags: question.tags,
      source: question.source,
      usageCount: question.usageCount,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  /** 更新题目 */
  async updateQuestion(id: string, data: any) {
    const question = await this.prisma.questionBank.findUnique({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException('题目不存在');
    }

    // 构建更新的 content 对象
    const contentData = question.content as any;
    const content = { ...contentData };

    if (data.question !== undefined) {
      content.question = data.question;
    }

    if (data.answer !== undefined) {
      content.answer = data.answer;
    }

    if (data.explanation !== undefined) {
      content.explanation = data.explanation;
    }

    if (data.options !== undefined) {
      content.options = data.options;
    }

    const updated = await this.prisma.questionBank.update({
      where: { id },
      data: {
        ...(data.question !== undefined && { title: data.question }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.tags !== undefined && {
          tags: Array.isArray(data.tags)
            ? data.tags
            : data.tags
            ? data.tags.split(',').map((t: string) => t.trim())
            : [],
        }),
        ...(data.source !== undefined && { source: data.source }),
        content: content,
      },
    });

    this.logger.log(`✏️ 管理员更新题目: questionId=${id}`);

    // 返回映射后的数据
    const updatedContent = updated.content as any;
    return {
      id: updated.id,
      question: updated.title,
      answer: updatedContent?.answer || '',
      explanation: updatedContent?.explanation || '',
      category: updated.category,
      difficulty: updated.difficulty,
      type: updated.type,
      tags: updated.tags,
      source: updated.source,
      usageCount: updated.usageCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /** 删除题目 */
  async deleteQuestion(id: string) {
    const question = await this.prisma.questionBank.findUnique({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException('题目不存在');
    }

    await this.prisma.questionBank.delete({ where: { id } });

    this.logger.warn(
      `🗑️ 管理员删除题目: questionId=${id}, title=${question.title}`,
    );
    return { message: `题目 "${question.title}" 已删除` };
  }

}
