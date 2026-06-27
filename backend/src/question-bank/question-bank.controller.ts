import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuestionBankService } from './question-bank.service';
import { BrowseQuestionsDto, GenerateQuestionsDto } from './dto/question-bank.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('面试题库')
@Controller('question-bank')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuestionBankController {
  constructor(private readonly questionBankService: QuestionBankService) {}

  @Get()
  @ApiOperation({ summary: '浏览题库（分页、分类搜索）' })
  async browse(@Query(new ValidationPipe({ transform: true })) dto: BrowseQuestionsDto) {
    return this.questionBankService.browse(dto);
  }

  @Get('categories')
  @ApiOperation({ summary: '获取所有分类' })
  async getCategories() {
    return this.questionBankService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取题目详情' })
  async getById(@Param('id') id: string) {
    return this.questionBankService.getById(id);
  }

  @Post('generate')
  @ApiOperation({ summary: 'AI 生成面试题目' })
  async generate(@Body(new ValidationPipe({ transform: true })) dto: GenerateQuestionsDto) {
    return this.questionBankService.generate(dto);
  }
}
