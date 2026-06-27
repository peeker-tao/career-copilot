import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ResumeModule } from './resume/resume.module';
import { InterviewModule } from './interview/interview.module';
import { CareerModule } from './career/career.module';
import { AiModule } from './ai/ai.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';
import { AdminModule } from './admin/admin.module';
import { VoiceInterviewModule } from './voice-interview/voice-interview.module';
import { JobMatchingModule } from './job-matching/job-matching.module';
import { QuestionBankModule } from './question-bank/question-bank.module';
import { LearningResourcesModule } from './learning-resources/learning-resources.module';
import { ResumeNerModule } from './resume-ner/resume-ner.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    AuthModule,
    UserModule,
    ResumeModule,
    InterviewModule,
    CareerModule,
    AiModule,
    QueueModule,
    RedisModule,
    AdminModule,
    VoiceInterviewModule,
    JobMatchingModule,
    QuestionBankModule,
    LearningResourcesModule,
    ResumeNerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
