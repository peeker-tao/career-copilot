import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ValidationPipe } from './pipes/validation.pipe';
import { PrismaService } from './prisma.service';
import { ThrottleGuard } from './guards/throttle.guard';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [
    PrismaService,
    EmailService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    ThrottleGuard,
  ],
  exports: [PrismaService, EmailService, ThrottleGuard],
})
export class CommonModule {}
