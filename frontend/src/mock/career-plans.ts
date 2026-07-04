import type { CareerPlan, CareerPlanSummary, MarketInsight } from '@/types/career'

export const MOCK_PLAN_SUMMARIES: CareerPlanSummary[] = [
  {
    id: '1',
    targetPosition: '后端开发工程师',
    progress: 45,
    createdAt: '2026-06-13',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Git'],
  },
  {
    id: '2',
    targetPosition: '前端开发工程师',
    progress: 20,
    createdAt: '2026-06-10',
    skills: ['JavaScript', 'React', 'CSS'],
  },
  {
    id: '3',
    targetPosition: '全栈开发工程师',
    progress: 60,
    createdAt: '2026-05-28',
    skills: ['Java', 'React', 'Node.js', 'Docker', 'PostgreSQL'],
  },
]

export const MOCK_PLAN_DETAIL: CareerPlan = {
  id: '1',
  targetPosition: '后端开发工程师',
  progress: 45,
  createdAt: '2026-06-13',
  possessedSkills: ['Java', 'Spring Boot', 'MySQL', 'Git', 'Linux'],
  targetSkills: ['Redis', '消息队列', '微服务架构', 'Docker', 'Kubernetes'],
  stages: [
    {
      id: 's1',
      title: '阶段一：基础巩固',
      duration: '2 周',
      goal: '熟练掌握 Spring Boot 开发框架',
      resources: [
        { name: 'Spring Boot 官方文档', type: '文档', url: '#' },
        { name: '尚硅谷 Spring Boot 教程', type: '视频', url: '#' },
        { name: '《Spring Boot 实战》', type: '书籍', url: '#' },
      ],
      learned: false,
    },
    {
      id: 's2',
      title: '阶段二：中间件进阶',
      duration: '3 周',
      goal: '掌握 Redis、消息队列等主流中间件',
      resources: [
        { name: '《Redis 设计与实现》', type: '书籍', url: '#' },
        { name: 'Kafka 官方文档', type: '文档', url: '#' },
        { name: 'RabbitMQ 实战教程', type: '视频', url: '#' },
      ],
      learned: false,
    },
    {
      id: 's3',
      title: '阶段三：微服务与云原生',
      duration: '4 周',
      goal: '掌握微服务架构设计和容器化部署',
      resources: [
        { name: 'Docker 从入门到实践', type: '文档', url: '#' },
        { name: 'Kubernetes 官方教程', type: '文档', url: '#' },
        { name: 'Spring Cloud Alibaba 教程', type: '视频', url: '#' },
        { name: '《微服务架构设计模式》', type: '书籍', url: '#' },
      ],
      learned: false,
    },
  ],
}

export const POSITION_SUGGESTIONS = [
  '后端开发工程师',
  '前端开发工程师',
  '全栈开发工程师',
  '算法工程师',
  '数据分析师',
  '产品经理',
  '测试工程师',
  'DevOps 工程师',
  '嵌入式开发工程师',
  '机器学习工程师',
  'Android 开发工程师',
  'iOS 开发工程师',
  '安全工程师',
  '运维工程师',
  '数据库管理员',
]

export const MOCK_MARKET_INSIGHT: MarketInsight = {
  salary: [
    { position: '后端开发工程师', min: 15, max: 35 },
    { position: '前端开发工程师', min: 12, max: 30 },
    { position: '全栈开发工程师', min: 18, max: 40 },
    { position: '算法工程师', min: 25, max: 60 },
    { position: '数据分析师', min: 10, max: 25 },
    { position: '产品经理', min: 12, max: 30 },
    { position: '测试工程师', min: 8, max: 20 },
    { position: 'DevOps 工程师', min: 15, max: 35 },
  ],
  trend: [65, 72, 78, 82, 85, 88, 92, 95, 93, 97, 100, 98],
  topSkills: [
    { name: 'Java', count: 95 },
    { name: 'Spring Boot', count: 88 },
    { name: 'MySQL', count: 82 },
    { name: 'Redis', count: 76 },
    { name: 'Docker', count: 70 },
    { name: 'Kubernetes', count: 62 },
    { name: '消息队列', count: 58 },
    { name: '微服务架构', count: 55 },
    { name: 'Linux', count: 50 },
    { name: 'Git', count: 45 },
  ],
  experienceDistribution: [
    { name: '应届（<1年）', value: 25 },
    { name: '1-3 年', value: 35 },
    { name: '3-5 年', value: 22 },
    { name: '5-10 年', value: 13 },
    { name: '10 年以上', value: 5 },
  ],
}
