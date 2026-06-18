// ============================================================
// 面试模块共享工具函数
// ============================================================

/**
 * LLM 返回的 nextAction 字段归一化
 * 处理大小写、下划线、连字符等常见 LLM 输出变体
 *
 * @param rawAction LLM 原始输出的动作字符串
 * @returns 标准化的动作值：'followUp' | 'nextQuestion' | 'complete'
 */
export function normalizeNextAction(
  rawAction: string,
): 'followUp' | 'nextQuestion' | 'complete' {
  const normalized = (rawAction || '').toLowerCase().replace(/[_-]/g, '');

  if (normalized === 'followup') return 'followUp';
  if (normalized === 'nextquestion') return 'nextQuestion';
  if (normalized === 'complete') return 'complete';

  // 默认进入下一题
  return 'nextQuestion';
}
