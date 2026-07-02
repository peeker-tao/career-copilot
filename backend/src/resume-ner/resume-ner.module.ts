import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ResumeNerService } from './resume-ner.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 0,
    }),
  ],
  providers: [ResumeNerService],
  exports: [ResumeNerService],
})
export class ResumeNerModule {}
