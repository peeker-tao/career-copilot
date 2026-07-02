import { Module } from '@nestjs/common';
import { QuestionBankController } from './question-bank.controller';
import { QuestionBankService } from './question-bank.service';
import { CommonModule } from '../common/common.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [CommonModule, AiModule],
  controllers: [QuestionBankController],
  providers: [QuestionBankService],
  exports: [QuestionBankService],
})
export class QuestionBankModule {}
