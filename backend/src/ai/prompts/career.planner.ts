// ============================================================
// 职业规划 Prompt 构建器
// T-015: 技能差距分析 + 分阶段学习路线
// ============================================================

export interface CareerPlanPromptParams {
  targetPosition: string;
  currentSkills: string[];
  resumeContext?: string;
  experience?: string;
  education?: string;
  goals?: string;
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  goal: string;
  skills: string[];
  estimatedWeeks: number;
  resources: Array<{
    name: string;
    type: 'video' | 'book' | 'project' | 'course' | 'article';
    url?: string;
    description?: string;
  }>;
}

export interface CareerPlanResult {
  gapSkills: string[];
  roadmap: RoadmapPhase[];
  summary: string;
  marketDemand: string;
  estimatedTimeline: string;
}

/**
 * 构建职业规划的 System Prompt
 */
export function buildCareerPlanSystemPrompt(): string {
  return `你是一名资深的职业规划顾问专家。请根据用户的技能现状和目标岗位，进行差距分析并生成学习路线，以严格的 JSON 格式返回。

## 分析要求
1. 分析目标岗位的核心技能要求（技术栈、软技能、领域知识）
2. 对比用户当前技能，列出需要学习的技能差距（按优先级排序）
3. 生成 3-4 个阶段的学习路线，每个阶段包含明确的阶段目标
4. 每个阶段推荐具体的学习资源（课程、书籍、项目实战）
5. 给出综合评估和建议

## 返回格式（严格 JSON，不要包含 markdown 代码块标记）
{
  "gapSkills": ["需要学习的技能1", "技能2", ...],
  "summary": "综合评估和建议（100-200字）",
  "marketDemand": "该岗位的市场需求分析",
  "estimatedTimeline": "预估达到目标所需的总时间",
  "roadmap": [
    {
      "phase": 1,
      "title": "阶段名称（如：基础夯实）",
      "goal": "阶段目标描述",
      "skills": ["本阶段需要学习的技能"],
      "estimatedWeeks": 4,
      "resources": [
        {
          "name": "推荐资源名称",
          "type": "video|book|project|course|article",
          "url": "资源链接（可选）",
          "description": "为什么推荐这个资源"
        }
      ]
    }
  ]
}`;
}

/**
 * 构建职业规划的 User Prompt
 */
export function buildCareerPlanUserPrompt(
  params: CareerPlanPromptParams,
): string {
  const {
    targetPosition,
    currentSkills,
    resumeContext,
    experience,
    education,
    goals,
  } = params;

  const sections: string[] = [];

  sections.push(`## 用户信息
- **目标岗位**：${targetPosition}
- **当前技能**：${currentSkills.length > 0 ? currentSkills.join('、') : '未提供'}
- **工作经验**：${experience || '未提供'}
- **教育背景**：${education || '未提供'}
- **职业目标**：${goals || '未提供'}`);

  if (resumeContext) {
    sections.push(`\n## 简历信息\n${resumeContext}`);
  }

  sections.push(`\n---\n请根据以上信息进行差距分析并生成个性化学习路线。`);

  return sections.join('\n');
}
