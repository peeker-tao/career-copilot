import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

/**
 * 统一异常过滤器：捕获所有异常
 * - HttpException → 透传原状态码和消息
 * - Prisma 已知错误 → 400/409 等业务状态码
 * - 其他未知错误 → 500（开发环境输出 stack）
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    // 1. HttpException（含 class-validator 校验失败）
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(resp.message)) {
          message = (resp.message as string[])[0] || '参数校验失败';
        } else {
          message = (resp.message as string) || '服务器内部错误';
        }
      }
    }
    // 2. Prisma 已知错误
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = `字段 ${(exception.meta?.target as string[])?.join(', ') || '未知'} 已存在`;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = '记录不存在';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = '外键约束失败';
          break;
        default:
          message = `数据库错误 [${exception.code}]`;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = '数据库查询参数错误';
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = '数据库连接失败，请检查数据库是否已启动';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 4xx 客户端错误（如 401/403/404）是预期行为，记录为 WARN
    // 5xx 服务器错误才记录为 ERROR
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status} ${message}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else if (status >= 400) {
      this.logger.warn(
        `[${request.method}] ${request.url} → ${status} ${message}`,
      );
    } else {
      this.logger.log(
        `[${request.method}] ${request.url} → ${status} ${message}`,
      );
    }

    response.status(status).json({
      code: status,
      message,
      error: process.env.NODE_ENV === 'development' && exception instanceof Error
        ? exception.stack
        : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
