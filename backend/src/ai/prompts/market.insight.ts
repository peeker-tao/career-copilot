// ============================================================
// 市场洞察 Prompt 构建器
// T-016: LLM 生成模拟市场数据
// ============================================================

/**
 * 构建市场洞察的 System Prompt
 */
export function buildMarketInsightSystemPrompt(): string {
  return `你是一名资深的人力资源市场分析专家。请根据目标岗位，生成该岗位在当前市场中的数据分析报告，以严格的 JSON 格式返回。

## 分析要求
1. 分析该岗位在全国主要城市的薪资范围
2. 分析市场需求趋势（增长/稳定/下降）
3. 列出该岗位最核心的技术栈与技能要求（按重要性排序）
4. 分析经验年限的分布情况
5. 结合行业现状给出综合建议

## 返回格式（严格 JSON，不要包含 markdown 代码块标记）
{
  "averageSalary": "薪资范围，如 15K-30K",
  "demandTrend": "需求趋势，如 持续增长",
  "topSkills": ["核心技能1", "核心技能2", ...],
  "experienceDistribution": {
    "entry": "应届占比",
    "junior": "1-3年占比",
    "mid": "3-5年占比",
    "senior": "5年以上占比"
  }
}`;
}

/**
 * 构建市场洞察的 User Prompt
 */
export function buildMarketInsightUserPrompt(position: string): string {
  return `请分析 "${position}" 岗位的当前市场数据，提供薪资范围、需求趋势、核心技能和经验分布信息。`;
}
