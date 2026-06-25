import type { ResumeSummary, ResumeDetail, SkillScore } from '@/types/resume'

export const MOCK_RESUMES: ResumeSummary[] = [
  {
    id: '1',
    title: '小明_后端简历_2026.pdf',
    status: 'completed',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker', 'Git', 'RabbitMQ'],
    createdAt: '2026-06-15T10:30:00Z',
    isDefault: true,
    name: '小明',
    phone: '138****1234',
    email: 'xiaoming@example.com',
  },
  {
    id: '2',
    title: '小明_前端简历_2026.pdf',
    status: 'completed',
    skills: ['React', 'TypeScript', 'Vue', 'Webpack', 'CSS'],
    createdAt: '2026-06-10T08:00:00Z',
    isDefault: false,
    name: '小明',
    phone: '138****1234',
    email: 'xiaoming@example.com',
  },
  {
    id: '3',
    title: '小明_产品岗简历.pdf',
    status: 'parsing',
    skills: [],
    createdAt: '2026-06-18T12:00:00Z',
    isDefault: false,
    name: null,
    phone: null,
    email: null,
  },
  {
    id: '4',
    title: '小明_全栈简历.pdf',
    status: 'failed',
    skills: [],
    createdAt: '2026-06-08T14:00:00Z',
    isDefault: false,
    name: null,
    phone: null,
    email: null,
  },
]

export const MOCK_RESUME_DETAIL: ResumeDetail = {
  id: '1',
  title: '小明_后端简历_2026.pdf',
  status: 'completed',
  skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker', 'Git', 'RabbitMQ', 'Linux'],
  fileUrl: '#',
  createdAt: '2026-06-15T10:30:00Z',
  isDefault: true,
  parsedData: {
    basicInfo: {
      name: '小明',
      phone: '138****1234',
      email: 'xiaoming@example.com',
    },
    education: [
      { school: '华中科技大学', major: '软件工程', degree: '本科', period: '2022-2026' },
    ],
    experience: [
      {
        company: 'XX科技',
        position: '后端开发实习生',
        period: '2025.06-2025.09',
        description:
          '负责公司核心业务后端 API 开发与维护，使用 Spring Boot 框架实现了订单管理、用户认证等模块，日均处理请求 10万+。参与了数据库表结构设计与优化，将慢查询响应时间降低了 60%。',
      },
    ],
    skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker', 'Git', 'RabbitMQ', 'Linux'],
    projects: [
      {
        name: '在线商城系统',
        role: '后端开发',
        techStack: ['Spring Boot', 'MySQL', 'Redis'],
        description:
          '独立开发了订单、支付、库存等核心微服务模块，使用 Redis 缓存热点数据，QPS 提升 3 倍。',
      },
      {
        name: '即时通讯中间件',
        role: '核心开发者',
        techStack: ['Netty', 'RabbitMQ', 'MongoDB'],
        description:
          '基于 Netty 实现了高性能消息推送服务，支持万人同时在线，消息延迟 < 100ms。',
      },
    ],
  },
}

export const MOCK_SKILL_SCORES: SkillScore[] = [
  { name: 'Java', score: 85 },
  { name: 'Spring Boot', score: 80 },
  { name: 'MySQL', score: 75 },
  { name: 'Redis', score: 70 },
  { name: 'Docker', score: 65 },
  { name: 'Git', score: 80 },
]
