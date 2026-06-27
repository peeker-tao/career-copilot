// ============================================================
// 简历解析服务 — 文件文本提取 + LLM 结构化提取
// T-008: Resume Parser
// ============================================================

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { createCanvas } from '@napi-rs/canvas';
import { recognize } from 'tesseract.js';
import { AiService } from '../ai/ai.service';
import { ResumeNerService } from '../resume-ner/resume-ner.service';

export interface ParsedResumeResult {
  basicInfo: {
    name?: string;
    phone?: string;
    email?: string;
  };
  education: Array<{
    school: string;
    major: string;
    degree: string;
    startDate?: string;
    endDate?: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  projects: Array<{
    name: string;
    role?: string;
    techStack: string[];
    description?: string;
  }>;
  skills: string[];
  summary?: string;
  /** 简历改进建议列表 */
  suggestions?: Array<{
    category: string;
    content: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  /** 六维评估分数（面试官关注维度） */
  evaluations?: Array<{
    name: string;
    score: number;
    comment?: string;
  }>;
}

@Injectable()
export class ResumeParser {
  private readonly logger = new Logger(ResumeParser.name);

  /** pdf-parse 提取文本少于该阈值时触发 OCR 回退 */
  private readonly OCR_MIN_TEXT_LENGTH = 50;

  constructor(
    private readonly aiService: AiService,
    private readonly resumeNerService: ResumeNerService,
  ) {}

  /**
   * 从文件中提取原始文本
   * 对 PDF 文件：先用 pdf-parse 提取文本层，过短则自动回退到 OCR
   */
  async extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    this.logger.log(`📄 提取文件文本: ${filePath} (${ext})`);

    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdf = new PDFParse({ data: dataBuffer } as any);
      const result = await pdf.getText();
      let text = result.text || '';

      // pdf-parse 只能提取文本层；扫描件/图片型 PDF 无文本层 → 走 OCR
      if (text.trim().length < this.OCR_MIN_TEXT_LENGTH) {
        this.logger.warn(
          `⚠️ pdf-parse 仅提取到 ${text.length} 字符，尝试 OCR 回退...`,
        );
        const ocrText = await this.tryOcrFallback(dataBuffer);
        if (ocrText && ocrText.length > text.trim().length) {
          this.logger.log(`✅ OCR 回退成功，提取到 ${ocrText.length} 字符`);
          text = ocrText;
        } else {
          this.logger.warn('⚠️ OCR 回退未能提取到有效文本，使用原结果');
        }
      }

      return text;
    }

    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }

    throw new BadRequestException('不支持的文件格式，仅支持 PDF 和 DOCX');
  }

  /**
   * OCR 回退 — 将 PDF 每页渲染为图片后调用 Tesseract.js 识别文字
   * 适用于扫描件/图片型 PDF
   */
  private async tryOcrFallback(dataBuffer: Buffer): Promise<string | null> {
    try {
      // pdfjs-dist 为 ESM 模块，NestJS CJS 项目需要动态导入
      const pdfjsLib: any = await import('pdfjs-dist');

      // 设置 worker 路径（Node.js 环境需要）
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          require.resolve('pdfjs-dist/build/pdf.worker.min.mjs');
      }

      const doc = await pdfjsLib.getDocument({ data: dataBuffer }).promise;
      this.logger.log(`📑 OCR 处理 PDF，共 ${doc.numPages} 页`);

      let fullText = '';
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        // 2x 缩放提高 OCR 对小字体的识别率
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;

        const imageBuffer: Buffer = canvas.toBuffer('image/png');
        const {
          data: { text },
        } = await recognize(
          imageBuffer,
          'chi_sim+eng', // 简体中文 + 英文
        );

        this.logger.log(
          `  第 ${i}/${doc.numPages} 页 OCR → ${text.length} 字符`,
        );
        fullText += text + '\n';
      }

      await doc.destroy();
      return fullText.trim();
    } catch (err) {
      this.logger.error('❌ OCR 回退失败', err);
      return null;
    }
  }

  /**
   * 对中文简历文本执行 NER 预提取，返回带标注的增强文本
   * 将 NER 识别出的实体作为上下文注入 LLM 提示词
   */
  private async enhanceWithNer(text: string): Promise<{
    enhancedText: string;
    nerEntities: Record<string, string[]>;
  }> {
    // 仅对含中文的文本启用 NER
    const hasChinese = /[\u4e00-\u9fff]/.test(text);
    if (!hasChinese) {
      return { enhancedText: text, nerEntities: {} };
    }

    try {
      const nerResult = await this.resumeNerService.extractEntities(text);
      const entities = nerResult.entities;
      const total = nerResult.stats?.total ?? 0;

      if (total === 0) {
        return { enhancedText: text, nerEntities: {} };
      }

      // 构建 NER 标注摘要
      const nerSummary = Object.entries(entities)
        .filter(([, values]) => values.length > 0)
        .map(([tag, values]) => `  - ${tag}: ${[...new Set(values)].join('、')}`)
        .join('\n');

      // 在文本前添加 NER 预提取的实体信息，作为 LLM 的辅助上下文
      const enhancedText = [
        '【NER 预提取的简历实体信息（供参考）】',
        nerSummary,
        '',
        '【简历原文】',
        text,
      ].join('\n');

      this.logger.log(
        `🧠 NER 预提取完成: ${total} 个实体 | ${Object.keys(entities).length} 种类别`,
      );

      return { enhancedText, nerEntities: entities };
    } catch (error) {
      this.logger.warn(`NER 增强跳过: ${(error as Error).message}`);
      return { enhancedText: text, nerEntities: {} };
    }
  }

  /**
   * 调用 LLM 解析简历文本为结构化数据
   * 中文简历会自动使用 NER 预提取增强
   */
  async parseWithLLM(text: string): Promise<ParsedResumeResult> {
    this.logger.log(`🤖 LLM 解析简历文本 (${text.length} 字符)`);

    // 对中文文本执行 NER 预提取
    const { enhancedText, nerEntities } = await this.enhanceWithNer(text);

    const raw = await this.aiService.parseResume(enhancedText);

    // 将 AiService 返回的通用结构转换为 ParsedResumeResult
    const result = this.transformResult(raw);

    // 如果 LLM 未识别出姓名但 NER 有结果，补充到结果中
    if (!result.basicInfo.name && nerEntities['姓名']?.length) {
      result.basicInfo.name = nerEntities['姓名'][0];
    }

    return result;
  }

  /**
   * 将 AiService.parseResume() 的通用结果转换为标准格式
   */
  private transformResult(raw: Record<string, unknown>): ParsedResumeResult {
    // 兼容两种字段命名风格: basicInfo/name 或直接 name
    const basicInfoRaw = (raw.basicInfo as Record<string, unknown>) ?? raw;

    const basicInfo = {
      name: (basicInfoRaw.name as string) ?? undefined,
      phone: (basicInfoRaw.phone as string) ?? undefined,
      email: (basicInfoRaw.email as string) ?? undefined,
    };

    const education = Array.isArray(raw.education)
      ? raw.education.map((e: Record<string, unknown>) => ({
          school: (e.school as string) ?? '',
          major: (e.major as string) ?? '',
          degree: (e.degree as string) ?? '',
          startDate: (e.startDate as string) ?? undefined,
          endDate: (e.endDate as string) ?? undefined,
        }))
      : [];

    const experience = Array.isArray(raw.experience)
      ? raw.experience.map((e: Record<string, unknown>) => ({
          company: (e.company as string) ?? '',
          position: (e.position as string) ?? '',
          startDate: (e.startDate as string) ?? undefined,
          endDate: (e.endDate as string) ?? undefined,
          description: (e.description as string) ?? undefined,
        }))
      : [];

    const projects = Array.isArray(raw.projects)
      ? raw.projects.map((p: Record<string, unknown>) => ({
          name: (p.name as string) ?? '',
          role: (p.role as string) ?? undefined,
          techStack: Array.isArray(p.techStack)
            ? (p.techStack as string[])
            : [],
          description: (p.description as string) ?? undefined,
        }))
      : [];

    const skills = Array.isArray(raw.skills) ? (raw.skills as string[]) : [];

    const summary = (raw.summary as string) ?? undefined;

    // 提取改进建议（新版 LLM 输出）
    const suggestions = Array.isArray(raw.suggestions)
      ? raw.suggestions.map((s: Record<string, unknown>) => ({
          category: (s.category as string) ?? '',
          content: (s.content as string) ?? '',
          priority: (['high', 'medium', 'low'].includes(s.priority as string)
            ? (s.priority as 'high' | 'medium' | 'low')
            : 'medium') as 'high' | 'medium' | 'low',
        }))
      : undefined;

    // 提取六维评估分数（新版 LLM 输出）
    const evaluations = Array.isArray(raw.evaluations)
      ? raw.evaluations.map((e: Record<string, unknown>) => ({
          name: (e.name as string) ?? '',
          score: (e.score as number) ?? 0,
          comment: (e.comment as string) ?? undefined,
        }))
      : undefined;

    return {
      basicInfo,
      education,
      experience,
      projects,
      skills,
      summary,
      suggestions,
      evaluations,
    };
  }
}
