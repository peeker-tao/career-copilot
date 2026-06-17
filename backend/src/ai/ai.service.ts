import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage, LLMProvider, createProvider } from './llm.provider';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private provider: LLMProvider;

  constructor(private configService: ConfigService) {
    this.provider = createProvider(this.configService);
    this.logger.log(`🤖 LLM Provider 初始化完成`);
  }

  /* ══════════════════════════════════════════════
     简历解析
     ══════════════════════════════════════════════ */

  /**
   * 将简历原始文本解析为结构化 JSON（带自动重试）
   */
  async parseResume(text: string): Promise<Record<string, unknown>> {
    const systemPrompt = `你是一个专业的简历解析助手。请从以下简历文本中提取结构化信息，以 JSON 格式返回。

返回格式（严格 JSON，不要包含 markdown 代码块标记）：
{
  "name": "姓名",
  "phone": "电话",
  "email": "邮箱",
  "education": [
    { "school": "学校名", "major": "专业", "degree": "学历", "startDate": "开始时间", "endDate": "结束时间" }
  ],
  "experience": [
    { "company": "公司名", "position": "职位", "startDate": "开始时间", "endDate": "结束时间", "description": "工作描述" }
  ],
  "projects": [
    { "name": "项目名", "role": "角色", "description": "项目描述", "techStack": ["技术栈"] }
  ],
  "skills": ["技能1", "技能2"],
  "summary": "个人总结（如有）"
}

⚠️ 重要：JSON 中所有字符串值内部的引号必须用反斜杠转义（如 \\"），
换行符必须替换为 \\n，制表符替换为 \\t。
如果简历文本中有特殊字符，请确保输出合法的 JSON。

注意：
- 如果某字段在简历中不存在，使用空数组或 null
- 日期尽量标准化为 YYYY-MM 格式
- 技能标签拆分为单个关键词`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请解析以下简历文本：\n\n${text}` },
    ];

    try {
      return await this.safeJsonParse(messages, '简历解析失败，请检查简历内容');
    } catch {
      // 第一次失败后，告知 LLM 上次输出 JSON 不合法，请求重新生成
      this.logger.warn('⚠️ 首次 JSON 解析失败，尝试带错误反馈重试...');
      const retryMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `请解析以下简历文本：\n\n${text}`,
        },
        {
          role: 'assistant',
          content: '（上次输出的 JSON 格式不合法，我将重新生成）',
        },
        {
          role: 'user',
          content:
            '你上次返回的 JSON 格式不合法，有未转义的特殊字符或字符串未正确闭合。请确保输出**严格合法的 JSON**，所有字符串中的引号必须转义，不要包含任何多余文本。',
        },
      ];
      return this.safeJsonParse(
        retryMessages,
        '简历解析失败，请检查简历内容',
        0.2,
      );
    }
  }

  /* ══════════════════════════════════════════════
     面试题生成
     ══════════════════════════════════════════════ */

  /**
   * 根据岗位信息生成面试题
   * @param context { position, industry, difficulty, count?, skills? }
   */
  async generateQuestion(context: {
    position: string;
    industry?: string;
    difficulty: 'junior' | 'mid' | 'senior';
    count?: number;
    skills?: string[];
  }): Promise<Record<string, unknown>> {
    const count = context.count || 5;
    const skillsText = context.skills?.length
      ? `重点考察技能：${context.skills.join('、')}`
      : '';
    const industryText = context.industry ? `行业：${context.industry}` : '';

    const difficultyMap: Record<string, string> = {
      junior: '初级（考察基础知识与概念理解）',
      mid: '中级（考察实践经验与原理）',
      senior: '高级（考察架构设计与复杂问题解决）',
    };

    const systemPrompt = `你是一个专业的面试官助手。请根据岗位要求生成面试题，以 JSON 格式返回。

返回格式（严格 JSON，不要包含 markdown 代码块标记）：
{
  "questions": [
    {
      "id": 1,
      "type": "technical" | "behavioral" | "scenario",
      "difficulty": "junior" | "mid" | "senior",
      "title": "题目标题",
      "description": "题目的详细描述，包括场景、要求等",
      "expectedAnswer": "回答要点 / 期望的答案方向",
      "hint": "给候选人的提示（可选）"
    }
  ]
}

生成要求：
- ${difficultyMap[context.difficulty] || difficultyMap.mid}
- 技术题占 60%、场景题占 30%、行为题占 10%
- 题目应覆盖实际工作场景
- ${skillsText}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `请为「${context.position}」岗位生成 ${count} 道面试题。${industryText}`,
      },
    ];

    return this.safeJsonParse(messages, '面试题生成失败，请稍后重试');
  }

  /* ══════════════════════════════════════════════
     回答评估
     ══════════════════════════════════════════════ */

  /**
   * 评估用户对面试题的回答
   * @param context { question, expectedAnswer, position?, difficulty? }
   * @param answer 用户的实际回答
   */
  async evaluateAnswer(
    context: {
      question: string;
      expectedAnswer?: string;
      position?: string;
      difficulty?: string;
    },
    answer: string,
  ): Promise<Record<string, unknown>> {
    const systemPrompt = `你是一个专业的面试评估助手。请根据面试题和期望答案评估用户的回答，以 JSON 格式返回。

返回格式（严格 JSON）：
{
  "score": 0-100,
  "rating": "优秀" | "良好" | "一般" | "较差",
  "summary": "总体评价",
  "strengths": ["优点1", "优点2"],
  "weaknesses": ["不足1", "不足2"],
  "suggestions": ["改进建议1", "改进建议2"],
  "referenceAnswer": "参考答案（如果原题没有提供期望答案，这里给出一个标准回答）"
}

评分标准：
- 90-100：回答完整、深入，体现丰富经验
- 70-89：回答准确，有较好的理解
- 50-69：回答基本正确，但深度不够
- 0-49：回答有明显错误或答非所问`;

    const questionInfo = [
      `面试题：${context.question}`,
      context.expectedAnswer ? `期望答案：${context.expectedAnswer}` : '',
      context.position ? `岗位：${context.position}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${questionInfo}\n\n用户的回答：\n${answer}` },
    ];

    return this.safeJsonParse(messages, '回答评估失败，请稍后重试');
  }

  /* ══════════════════════════════════════════════
     面试报告生成
     ══════════════════════════════════════════════ */

  /**
   * 根据面试对话记录生成综合评价报告
   * @param messages 面试中的问答记录
   */
  async generateReport(
    messages: { question: string; answer: string; score?: number }[],
  ): Promise<Record<string, unknown>> {
    const conversationLog = messages
      .map(
        (m, i) =>
          `[Q${i + 1}] ${m.question}\n[A${i + 1}] ${m.answer}\n[得分] ${m.score ?? '待评估'}\n`,
      )
      .join('\n');

    const systemPrompt = `你是一个专业的面试报告生成助手。请根据面试对话记录生成综合评价报告，以 JSON 格式返回。

返回格式（严格 JSON）：
{
  "overallScore": 0-100,
  "overallRating": "S" | "A" | "B" | "C" | "D",
  "summary": "综合评语（100-200字）",
  "dimensions": [
    {
      "name": "专业技能",
      "score": 0-100,
      "comment": "评语",
      "suggestions": "提升建议"
    }
  ],
  "strengths": ["核心优势1", "核心优势2"],
  "weaknesses": ["待提升1", "待提升2"],
  "learningSuggestions": [
    { "area": "学习领域", "priority": "high" | "medium" | "low", "resources": ["推荐资源"] }
  ]
}

评分维度包括：专业技能、项目经验、沟通表达、逻辑思维、学习能力
等级说明：S(≥90) A(≥80) B(≥70) C(≥60) D(<60)`;

    const msgs: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `以下是面试对话记录，请生成评估报告：\n\n${conversationLog}`,
      },
    ];

    return this.safeJsonParse(msgs, '报告生成失败，请稍后重试');
  }

  /* ══════════════════════════════════════════════
     职业规划生成
     ══════════════════════════════════════════════ */

  /**
   * 根据用户现状生成职业规划（差距分析 + 学习路线）
   * @param input { currentSkills, targetPosition, experience?, education?, goals? }
   */
  async generateCareerPlan(input: {
    currentSkills: string[];
    targetPosition: string;
    experience?: string;
    education?: string;
    goals?: string;
  }): Promise<Record<string, unknown>> {
    const systemPrompt = `你是一个专业的职业规划助手。请根据用户的技能现状和目标岗位进行差距分析，并生成学习路线，以 JSON 格式返回。

返回格式（严格 JSON）：
{
  "targetPosition": "目标岗位",
  "gapAnalysis": {
    "matchedSkills": ["已掌握的匹配技能"],
    "missingSkills": ["缺少的必须技能"],
    "recommendedSkills": ["建议额外学习的技能"],
    "matchRate": 0-100
  },
  "roadmap": [
    {
      "phase": 1,
      "name": "阶段名称",
      "duration": "建议时长",
      "focus": "学习重点",
      "topics": [
        { "name": "学习主题", "priority": "high" | "medium" | "low", "resources": ["推荐学习资料"] }
      ]
    }
  ],
  "milestones": [
    { "name": "里程碑", "description": "描述", "estimatedTime": "预计时间" }
  ],
  "summary": "总体建议（100-200字）"
}

阶段设计建议：
- Phase 1：基础补强（1-2个月）
- Phase 2：核心技能提升（2-3个月）
- Phase 3：项目实战（1-2个月）
- Phase 4：面试准备（2-4周）`;

    const userInfo = [
      `目标岗位：${input.targetPosition}`,
      `当前技能：${input.currentSkills.join('、')}`,
      input.experience ? `工作经验：${input.experience}` : '',
      input.education ? `教育背景：${input.education}` : '',
      input.goals ? `个人目标：${input.goals}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请为我生成职业规划：\n\n${userInfo}` },
    ];

    return this.safeJsonParse(messages, '职业规划生成失败，请稍后重试');
  }

  /* ══════════════════════════════════════════════
     通用 LLM 调用（供其他模块使用）
     ══════════════════════════════════════════════ */

  /**
   * 通用的 LLM 调用方法，传入 System Prompt + User Message，
   * 自动解析 JSON 返回。供 AiInterviewService 等模块使用。
   * @param systemPrompt 系统提示词
   * @param userMessage  用户消息
   * @param temperature  温度参数（默认 0.3）
   */
  async callLLM(
    systemPrompt: string,
    userMessage: string,
    temperature = 0.3,
  ): Promise<Record<string, unknown>> {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    return this.safeJsonParse(messages, 'LLM 调用失败', temperature);
  }

  /* ══════════════════════════════════════════════
     内部工具方法
     ══════════════════════════════════════════════ */

  /**
   * 调用 LLM 并安全地解析 JSON 返回
   * 自动修复常见 JSON 格式错误（未转义字符、截断等）
   */
  private async safeJsonParse(
    messages: ChatMessage[],
    errorMessage: string,
    temperature = 0.3,
  ): Promise<Record<string, unknown>> {
    const raw = await this.provider.chat(messages, { temperature });

    // 去除可能的 markdown 代码块标记
    let cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // 尝试 1: 直接解析
    try {
      return JSON.parse(cleaned);
    } catch {
      this.logger.warn(`⚠️ 直接 JSON 解析失败，尝试自动修复...`);
    }

    // 尝试 2: 提取第一个完整的 JSON 对象 {...}
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // 继续尝试修复
      }
    }

    // 尝试 3: 暴力修复 — 对常见问题进行修复
    try {
      const repaired = this.repairMalformedJson(cleaned);
      return JSON.parse(repaired);
    } catch {
      this.logger.warn('⚠️ JSON 自动修复仍失败');
    }

    // 尝试 4: 尝试 JSON5 风格的宽松解析 — 去掉尾随逗号、修复单引号等
    try {
      const lenient = cleaned
        // 去掉尾随逗号
        .replace(/,\s*([}\]])/g, '$1')
        // 将单引号替换为双引号（谨慎：仅在简单场景）
        .replace(/'/g, '"')
        // 将 undefined / None 替换为 null
        .replace(/\b(undefined|None)\b/g, 'null');
      return JSON.parse(lenient);
    } catch {
      this.logger.error(
        `${errorMessage}: ${(raw as string).substring(0, 200)}...`,
      );
      throw new Error(
        `${errorMessage}: Unterminated string or malformed JSON in LLM output`,
      );
    }
  }

  /**
   * 修复常见 JSON 格式错误
   * - 字符串值中未转义的引号
   * - 未转义的换行符
   * - 被截断的 JSON 末尾
   */
  private repairMalformedJson(raw: string): string {
    if (!raw) throw new Error('Empty JSON string');

    let result = '';
    let inString = false;
    let escaped = false;
    const len = raw.length;

    for (let i = 0; i < len; i++) {
      const ch = raw[i];

      if (escaped) {
        result += ch;
        escaped = false;
        continue;
      }

      if (ch === '\\') {
        result += ch;
        escaped = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        result += ch;
        continue;
      }

      if (inString) {
        // 字符串内部的特殊字符 — 必须转义
        if (ch === '\n') {
          result += '\\n';
          continue;
        }
        if (ch === '\r') {
          result += '\\r';
          continue;
        }
        if (ch === '\t') {
          result += '\\t';
          continue;
        }
      }

      result += ch;
    }

    // 如果字符串未闭合，补上闭合引号
    if (inString) {
      result += '"';
    }

    // 如果 JSON 被截断，补上结尾
    const openBraces = (result.match(/\{/g) || []).length;
    const closeBraces = (result.match(/\}/g) || []).length;
    const openBrackets = (result.match(/\[/g) || []).length;
    const closeBrackets = (result.match(/\]/g) || []).length;

    for (let i = 0; i < openBraces - closeBraces; i++) result += '}';
    for (let i = 0; i < openBrackets - closeBrackets; i++) result += ']';

    return result;
  }
}
