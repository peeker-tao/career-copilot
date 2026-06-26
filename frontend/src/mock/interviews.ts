import type { Interview, InterviewMessage } from '@/types/interview'

export const MOCK_INTERVIEWS: Interview[] = [
  { id: '1', targetPosition: '前端开发工程师', difficulty: 'medium', score: 85, rounds: 8, duration: '28分钟', status: 'completed', startedAt: '2026-06-15T10:00:00Z' },
  { id: '2', targetPosition: '后端开发工程师', difficulty: 'hard', score: 92, rounds: 8, duration: '32分钟', status: 'completed', startedAt: '2026-06-10T10:00:00Z' },
  { id: '3', targetPosition: '算法工程师', difficulty: 'easy', score: 78, rounds: 6, duration: '22分钟', status: 'completed', startedAt: '2026-06-05T10:00:00Z' },
  { id: '4', targetPosition: '产品经理', difficulty: 'medium', score: 70, rounds: 8, duration: '30分钟', status: 'completed', startedAt: '2026-05-28T10:00:00Z' },
  { id: '5', targetPosition: '全栈开发工程师', difficulty: 'hard', score: 88, rounds: 8, duration: '35分钟', status: 'completed', startedAt: '2026-05-20T10:00:00Z' },
  { id: '6', targetPosition: '数据分析师', difficulty: 'medium', score: null, rounds: 3, duration: '12分钟', status: 'interrupted', startedAt: '2026-06-12T10:00:00Z' },
  { id: '7', targetPosition: 'DevOps 工程师', difficulty: 'hard', score: null, rounds: 0, duration: '-', status: 'pending', startedAt: '2026-06-18T10:00:00Z' },
]

export const MOCK_INTERVIEW_SESSION = {
  id: '1',
  targetPosition: '后端开发工程师',
  difficulty: '中等' as const,
  totalRounds: 8,
  currentRound: 3,
  startedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
}

export const MOCK_INITIAL_MESSAGES: InterviewMessage[] = [
  {
    id: 'm1',
    role: 'ai',
    content:
      '你好！我是你的 AI 面试官，今天我们将进行一次后端开发工程师岗位的模拟面试。面试共 8 道题，预计需要 20-30 分钟。准备好了我们就开始吧！',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    rating: null,
  },
  {
    id: 'm2',
    role: 'ai',
    content:
      '请先简单介绍一下你自己，以及为什么想应聘后端开发工程师岗位？',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    rating: null,
  },
  {
    id: 'm3',
    role: 'user',
    content:
      '您好！我是一名计算机科学与技术专业的应届毕业生，熟练掌握 Java、Spring Boot、MySQL 等技术栈。在校期间参与过多个后端项目开发，对后端开发有浓厚的兴趣，希望能够在这个领域深耕发展。',
    timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    rating: null,
  },
  {
    id: 'm4',
    role: 'ai',
    content:
      '很好的开场！从你的自我介绍中能感受到你的热情。\n\n接下来我们进入技术问题环节。请听题：\n\n请介绍一下 Java 中 HashMap 的实现原理，包括底层数据结构、put 和 get 方法的执行流程。',
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    rating: 4,
  },
]

/** AI 对用户回答的点评（反馈+补充） */
export const AI_FEEDBACKS = [
  '回答得不错！你对 HashMap 的核心原理理解得比较清楚。\n\n不过我想补充一点：在 Java 8 中，当链表长度超过阈值（8）时，链表会转换为红黑树，这是为了解决哈希碰撞严重时查询效率从 O(n) 退化的问题。',
  '很好的回答！负载因子默认是 0.75，这是时间成本和空间成本的平衡点。',
  'B+ 树确实是 InnoDB 引擎索引的底层结构。它能很好地支持范围查询和排序操作。',
  '很好，你对 Redis 的五种基本数据类型掌握得不错。',
  '非常好！你对分布式系统的基本理论有清晰的认识。',
]

/** AI 下一道面试题 */
export const AI_NEXT_QUESTIONS = [
  '能说一下你对负载因子（load factor）的理解吗？',
  '那我来问一个数据库相关的问题：MySQL 中索引的底层数据结构是什么？为什么要选择这种结构？',
  '接下来聊聊 Redis 吧：Redis 支持哪些数据类型？分别适用于什么场景？',
  '最后一个问题：在分布式系统中，什么是 CAP 定理？在实际系统设计中你是如何权衡的？',
  '现在我们来到系统设计题：请设计一个短链接生成服务，需要考虑哪些核心功能和技术选型？',
]

/** @deprecated 保留以兼容旧引用，新代码请使用 AI_FEEDBACKS + AI_NEXT_QUESTIONS */
export const AI_RESPONSES = AI_FEEDBACKS.map((fb, i) => fb + '\n\n' + AI_NEXT_QUESTIONS[i])
