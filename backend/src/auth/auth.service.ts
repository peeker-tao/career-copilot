import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/** 对外暴露的安全用户类型（不含密码等敏感字段） */
type SafeUser = Omit<Prisma.UserGetPayload<{}>, 'passwordHash'>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. 检查邮箱是否已注册
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 2. 加密密码
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3. 创建用户
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
    });

    // 4. 生成 Token 对
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    // 1. 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 2. 校验密码
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 3. 生成 Token 对
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      // 校验 refreshToken — secret 由 JwtModule 全局配置提供
      const payload = this.jwtService.verify(refreshToken);

      // 生成新的 Token 对
      return this.generateTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(
    userId: string,
    data: Partial<{
      name: string;
      avatar: string;
      education: string;
      targetPosition: string;
    }>,
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.sanitizeUser(user);
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES',
      '7d',
    );

    const [accessToken, refreshToken] = await Promise.all([
      // accessToken 使用 JwtModule 全局配置（secret + expiresIn）
      this.jwtService.signAsync(payload),
      // refreshToken 需要更长的过期时间，单独指定
      this.jwtService.signAsync(payload, {
        expiresIn: refreshExpiresIn as any,
      } as any),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private sanitizeUser(user: Prisma.UserGetPayload<{}>): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }
}
