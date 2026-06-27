import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import { AdminQueryDto, AdminUpdateUserDto, AdminChangePasswordDto } from './dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

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

    return resume;
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

    return interview;
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
}
