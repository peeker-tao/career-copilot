// ============================================================
// 面试报告生成 Prompt 构建器
// T-013: 根据面试对话记录生成多维度综合评价报告
// ============================================================

export interface FeedbackPromptParams {
  position: string;
  difficulty: string;
  questionCount: number;
  qaPairs: Array<{
    question: string;
    answer: string;
    questionType?: string;
  }>;
}

export interface FeedbackReport {
  overallScore: number;
  overallRating: 'S' | 'A' | 'B' | 'C' | 'D';
  summary: string;
  questionScores: Array<{
    questionIndex: number;
    score: number;
    comment: string;
    strength: string;
    weakness: string;
  }>;
  dimensions: Array<{
    name: string;
    score: number;
    comment: string;
    suggestions: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  learningSuggestions: Array<{
    area: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    resources: string[];
  }>;
}

/**
 * 构建面试报告生成的 System Prompt
 */
export function buildFeedbackSystemPrompt(): string {
  return `你是一个资深的面试评估专家。请根据面试对话记录生成综合评价报告，以严格的 JSON 格式返回。

## 评估要求
1. 对每道题目的回答进行独立评分（1-5分），并给出具体评语
2. 从五个维度评分（专业技能、项目经验、沟通表达、逻辑思维、学习能力），各 0-100 分
3. 总结 2-3 条核心优势和 2-3 条待改进项
4. 给出具体的学习资源建议（含优先级和理由）
5. 综合评分 0-100，等级标准：S(≥90) A(≥80) B(≥70) C(≥60) D(<60)
6. 综合评语 100-200 字，需结合岗位要求给出针对性建议

## 返回格式（严格 JSON，不要包含 markdown 代码块标记）
{
  "overallScore": 85,
  "overallRating": "B",
  "summary": "综合评语...",
  "questionScores": [
    {
      "questionIndex": 1,
      "score": 4,
      "comment": "回答准确，展现了扎实的基础知识",
      "strength": "概念理解清晰",
      "weakness": "缺少实际案例支撑"
    }
  ],
  "dimensions": [
    {
      "name": "专业技能",
      "score": 85,
      "comment": "基础知识扎实",
      "suggestions": "建议深入源码层面理解"
    }
  ],
  "strengths": ["核心优势1", "核心优势2"],
  "weaknesses": ["待提升1", "待提升2"],
  "learningSuggestions": [
    {
      "area": "学习领域",
      "priority": "high",
      "reason": "为什么需要学习",
      "resources": ["推荐书籍/课程/文档"]
    }
  ]
}`;
}

/**
 * 构建面试报告生成的 User Prompt
 */
export function buildFeedbackUserPrompt(params: FeedbackPromptParams): string {
  const { position, difficulty, questionCount, qaPairs } = params;

  const difficultyLabel =
    difficulty === 'easy' ? '基础' : difficulty === 'hard' ? '困难' : '中等';

  const conversationLog = qaPairs
    .map(
      (pair, i) =>
        `【题目 ${i + 1}】${pair.questionType ? `（${pair.questionType}）` : ''}
${pair.question}

【回答 ${i + 1}】
${pair.answer}`,
    )
    .join('\n\n---\n\n');

  return `## 面试基本信息
- **目标岗位**：${position}
- **面试难度**：${difficultyLabel}
- **回答题目数**：${questionCount}

## 面试对话记录

${conversationLog}

---

请根据以上信息生成综合评价报告。`;
}
