import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      code: status,
      message: this.getErrorMessage(exceptionResponse),
      error:
        process.env.NODE_ENV === 'development'
          ? exception.stack
          : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private getErrorMessage(exceptionResponse: string | object): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    const response = exceptionResponse as Record<string, any>;

    // class-validator 校验失败的情况
    if (response.message && Array.isArray(response.message)) {
      return response.message[0] || '参数校验失败';
    }

    return response.message || '服务器内部错误';
  }
}
