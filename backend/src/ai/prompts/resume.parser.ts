// ============================================================
// 简历解析 Prompt 构建器
// T-008: LLM 结构化提取简历信息
// ============================================================

export interface ParsedResumeData {
  name?: string;
  phone?: string;
  email?: string;
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
}

/**
 * 构建简历解析的 System Prompt
 */
export function buildResumeParseSystemPrompt(): string {
  return `你是一名专业的简历解析助手。请从以下简历文本中提取结构化信息，以严格的 JSON 格式返回。

返回格式（严格 JSON，不要包含 markdown 代码块标记）：
{
  "basicInfo": {
    "name": "姓名",
    "phone": "电话",
    "email": "邮箱"
  },
  "education": [
    { "school": "学校名", "major": "专业", "degree": "学历", "startDate": "开始时间", "endDate": "结束时间" }
  ],
  "experience": [
    { "company": "公司名", "position": "职位", "startDate": "开始时间", "endDate": "结束时间", "description": "工作描述" }
  ],
  "projects": [
    { "name": "项目名", "role": "角色", "techStack": ["技术栈"], "description": "项目描述" }
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
- 技能标签拆分为单个关键词，不要合并`;
}

/**
 * 构建简历解析的 User Prompt
 */
export function buildResumeParseUserPrompt(text: string): string {
  return `请解析以下简历文本：\n\n${text}`;
}
