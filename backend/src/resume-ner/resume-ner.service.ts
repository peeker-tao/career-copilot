import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { AxiosResponse } from 'axios';

export interface NerEntityResult {
  entities: Record<string, string[]>; // tag_name -> [values]
  stats: Record<string, number>;
}

export interface NerStructuredResult {
  basicInfo: {
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  education: Array<{
    school: string;
    major: string;
    degree: string;
  }>;
  experience: any[];
  skills: string[];
  summary: string | null;
  ner_raw: Record<string, string[]>;
}

@Injectable()
export class ResumeNerService {
  private readonly logger = new Logger(ResumeNerService.name);
  private readonly nerApiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    // NER 服务地址，默认 localhost:8001
    this.nerApiUrl = this.configService.get<string>('NER_API_URL', 'http://localhost:8001');
  }

  /**
   * 从中文简历文本中提取命名实体
   */
  async extractEntities(text: string): Promise<NerEntityResult> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .post<NerEntityResult>(
            this.nerApiUrl,
            { text, mode: 'full' },
            { timeout: 10000 },
          )
          .pipe(
            timeout(15000),
            catchError((err) => {
              this.logger.warn(`NER API 调用失败: ${err.message}`);
              throw err;
            }),
          ),
      );
      const data = (response as AxiosResponse<NerEntityResult>).data;
      return data;
    } catch (error) {
      this.logger.error(`NER 实体提取失败: ${(error as Error).message}`);
      // 降级：返回空结果
      return { entities: {}, stats: { total: 0 } };
    }
  }

  /**
   * 从中文简历文本中提取结构化简历信息
   */
  async extractStructured(text: string): Promise<NerStructuredResult> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .post<NerStructuredResult>(
            this.nerApiUrl,
            { text, mode: 'structured' },
            { timeout: 10000 },
          )
          .pipe(
            timeout(15000),
            catchError((err) => {
              this.logger.warn(`NER API 调用失败: ${err.message}`);
              throw err;
            }),
          ),
      );
      const data = (response as AxiosResponse<NerStructuredResult>).data;
      return data;
    } catch (error) {
      this.logger.error(`NER 结构化提取失败: ${(error as Error).message}`);
      return {
        basicInfo: { name: null, phone: null, email: null },
        education: [],
        experience: [],
        skills: [],
        summary: null,
        ner_raw: {},
      };
    }
  }

  /**
   * 健康检查 - 检查 Python NER 服务是否在线
   */
  async healthCheck(): Promise<{ status: string; service: string } | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.nerApiUrl}/health`).pipe(timeout(5000)),
      );
      const data = (response as AxiosResponse<{ status: string; service: string }>).data;
      return data;
    } catch {
      return null;
    }
  }
}
