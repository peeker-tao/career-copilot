import {
  Injectable,
  UnprocessableEntityException,
  ValidationPipe as NestValidationPipe,
  ValidationError,
} from '@nestjs/common';

@Injectable()
export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints;
          if (constraints) {
            return Object.values(constraints)[0];
          }
          return `${error.property} 校验失败`;
        });
        throw new UnprocessableEntityException(messages[0] || '参数校验失败');
      },
    });
  }
}
