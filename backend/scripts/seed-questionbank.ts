/**
 * QuestionBank 种子数据脚本
 * =========================
 * 填充面试题库，供知识库 Embedding 使用。
 *
 * 用法:
 *   npx ts-node scripts/seed-questionbank.ts
 *   （在 backend 目录下执行）
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── 题库数据 ─────────────────────────────────────────────────

const questions: Array<{
  category: string;
  type: string;
  difficulty: string;
  title: string;
  content: Record<string, unknown>;
  tags: string[];
  source: string;
}> = [
  // ==================== Java ====================
  {
    category: 'java',
    type: 'short_answer',
    difficulty: 'easy',
    title: 'Java 中 ArrayList 和 LinkedList 的区别',
    content: {
      question: '请简述 ArrayList 和 LinkedList 的区别，以及各自适用的场景。',
      answer: 'ArrayList 基于动态数组实现，随机访问 O(1)，插入删除 O(n)；LinkedList 基于双向链表实现，随机访问 O(n)，头尾插入删除 O(1)。ArrayList 适合大量随机读取场景，LinkedList 适合频繁插入删除场景。',
      explanation: 'ArrayList 底层是 Object[] 数组，扩容时创建新数组并拷贝；LinkedList 每个节点存储前后指针。',
    },
    tags: ['Java', '集合', 'ArrayList', 'LinkedList'],
    source: 'manual',
  },
  {
    category: 'java',
    type: 'short_answer',
    difficulty: 'medium',
    title: 'Java 并发中的 volatile 关键字作用',
    content: {
      question: 'volatile 关键字在 Java 并发编程中有什么作用？能保证原子性吗？',
      answer: 'volatile 保证可见性和禁止指令重排序（有序性）。每次读取都从主内存读取，每次写入都立即刷回主内存。但不能保证原子性，如 count++ 操作仍需加锁或使用 Atomic 类。',
      explanation: 'volatile 的典型应用场景是状态标志位、double-checked locking（配合类初始化锁）。',
    },
    tags: ['Java', '并发', 'volatile', 'JMM'],
    source: 'manual',
  },
  {
    category: 'java',
    type: 'short_answer',
    difficulty: 'hard',
    title: 'JVM 垃圾回收算法及 CMS/G1 区别',
    content: {
      question: '请介绍 JVM 的垃圾回收算法，以及 CMS 和 G1 垃圾回收器的区别。',
      answer: '基础算法：标记-清除、标记-整理、复制、分代收集。CMS：初始标记→并发标记→重新标记→并发清除，追求低停顿，但会产生内存碎片。G1：将堆划分为 Region，通过 Remembered Set 维护跨 Region 引用，可预测停顿时间，通过混合回收兼顾老年代。',
      explanation: 'JDK 9+ 默认使用 G1。G1 的停顿预测模型通过 -XX:MaxGCPauseMillis 控制。ZGC 在 JDK 11+ 引入，JDK 17 达到生产就绪。',
    },
    tags: ['Java', 'JVM', 'GC', 'CMS', 'G1'],
    source: 'manual',
  },
  {
    category: 'java',
    type: 'choice',
    difficulty: 'easy',
    title: 'Java 中 String 是不可变类',
    content: {
      question: '以下关于 Java String 类的描述，哪一项是正确的？',
      options: [
        'String 是可变类',
        'StringBuilder 是线程安全的',
        'StringBuffer 是线程安全的',
        'String 可以直接被继承',
      ],
      answer: 'C。StringBuffer 的方法使用 synchronized 修饰，因此是线程安全的。',
      explanation: 'String 被 final 修饰，不可变；StringBuilder 非线程安全但性能更好；StringBuffer 线程安全。',
    },
    tags: ['Java', 'String', 'StringBuilder', 'StringBuffer'],
    source: 'manual',
  },
  {
    category: 'java',
    type: 'coding',
    difficulty: 'medium',
    title: '单例模式的双重检查锁实现',
    content: {
      question: '请用 Java 实现一个线程安全的单例模式（双重检查锁定方式），并说明为什么要使用 volatile。',
      answer: 'private static volatile Singleton instance;\n\npublic static Singleton getInstance() {\n  if (instance == null) {\n    synchronized (Singleton.class) {\n      if (instance == null) {\n        instance = new Singleton();\n      }\n    }\n  }\n  return instance;\n}',
      explanation: 'volatile 禁止指令重排序，确保 instance = new Singleton() 的写操作在对象完全构造后才对其他线程可见。第一次判空避免不必要的同步，第二次判空保证单例。',
    },
    tags: ['Java', '设计模式', '单例', '并发'],
    source: 'manual',
  },

  // ==================== Python ====================
  {
    category: 'python',
    type: 'short_answer',
    difficulty: 'easy',
    title: 'Python 列表和元组的区别',
    content: {
      question: 'Python 中 list 和 tuple 的区别是什么？',
      answer: 'list 可变（mutable），tuple 不可变（immutable）。list 用 [] 定义，tuple 用 () 定义。tuple 可哈希，可作为字典键。list 有 append/extend/pop 等方法，tuple 没有。',
      explanation: '由于 tuple 不可变，其存储更紧凑，遍历速度略快于 list。',
    },
    tags: ['Python', 'list', 'tuple', '基础'],
    source: 'manual',
  },
  {
    category: 'python',
    type: 'short_answer',
    difficulty: 'medium',
    title: 'Python 中的 GIL 是什么',
    content: {
      question: '什么是 Python 的 GIL（全局解释器锁）？它对多线程有什么影响？如何绕过？',
      answer: 'GIL 是 CPython 解释器中的互斥锁，确保同一时刻只有一个线程执行 Python 字节码。影响：CPU 密集型多线程无法利用多核。绕过方式：使用多进程（multiprocessing）、使用 C 扩展（如 NumPy）、使用 asyncio 协程、使用 Jython/IronPython（无 GIL）。',
      explanation: 'I/O 密集型任务中 GIL 影响较小，因为线程在 I/O 等待时会释放 GIL。',
    },
    tags: ['Python', 'GIL', '并发', '多线程'],
    source: 'manual',
  },
  {
    category: 'python',
    type: 'short_answer',
    difficulty: 'hard',
    title: 'Python 装饰器原理与实现',
    content: {
      question: '请解释 Python 装饰器的工作原理，并实现一个带参数的装饰器用于记录函数执行时间。',
      answer: '装饰器本质是接受函数作为参数并返回新函数的高阶函数。带参数装饰器需再包一层：\n\ndef log_time(unit="s"):\n    def decorator(func):\n        @functools.wraps(func)\n        def wrapper(*args, **kwargs):\n            start = time.time()\n            result = func(*args, **kwargs)\n            elapsed = time.time() - start\n            print(f"{func.__name__} took {elapsed}{unit}")\n            return result\n        return wrapper\n    return decorator',
      explanation: '@functools.wraps 保留原函数的元信息（__name__、__doc__ 等）。装饰器在模块导入时即执行（eager evaluation）。',
    },
    tags: ['Python', '装饰器', '高阶函数'],
    source: 'manual',
  },
  {
    category: 'python',
    type: 'coding',
    difficulty: 'medium',
    title: 'Python 实现 LRU 缓存',
    content: {
      question: '用 Python 实现一个 LRU（最近最少使用）缓存，支持 get 和 put 操作，时间复杂度 O(1)。',
      answer: 'from collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.cache = OrderedDict()\n        self.capacity = capacity\n\n    def get(self, key: int) -> int:\n        if key not in self.cache:\n            return -1\n        self.cache.move_to_end(key)\n        return self.cache[key]\n\n    def put(self, key: int, value: int) -> None:\n        if key in self.cache:\n            self.cache.move_to_end(key)\n        self.cache[key] = value\n        if len(self.cache) > self.capacity:\n            self.cache.popitem(last=False)',
      explanation: 'OrderedDict 底层使用双向链表 + 字典实现，move_to_end 和 popitem 都是 O(1)。也可以使用 dict + 自定义双向链表实现。',
    },
    tags: ['Python', 'LRU', '缓存', '数据结构'],
    source: 'manual',
  },
  {
    category: 'python',
    type: 'short_answer',
    difficulty: 'easy',
    title: 'Python 中的深拷贝与浅拷贝',
    content: {
      question: 'Python 中深拷贝（deep copy）和浅拷贝（shallow copy）的区别？',
      answer: '浅拷贝创建新对象，但嵌套对象仍引用原对象（copy.copy()）。深拷贝递归复制所有嵌套对象（copy.deepcopy()）。对于不可变对象两者结果相同。对于包含可变嵌套对象的场景，浅拷贝修改嵌套对象会影响原对象。',
      explanation: '列表的 [:] 或 .copy() 都是浅拷贝。deepcopy 会维护备忘录字典处理循环引用。',
    },
    tags: ['Python', '深拷贝', '浅拷贝', '对象'],
    source: 'manual',
  },

  // ==================== Frontend ====================
  {
    category: 'frontend',
    type: 'short_answer',
    difficulty: 'easy',
    title: 'React 中 useState 和 useReducer 的选择',
    content: {
      question: 'React Hooks 中，什么时候应该使用 useState？什么时候使用 useReducer？',
      answer: 'useState 适合简单的独立状态（布尔、数字、字符串）。useReducer 适合：状态逻辑复杂包含多个子值、下一个状态依赖前一个状态、需要集中管理状态变更逻辑。useReducer 的优势是状态更新逻辑集中、可测试。',
      explanation: 'useReducer 配合 Context 可以模拟 Redux 的全局状态管理模式。',
    },
    tags: ['React', 'Hooks', 'useState', 'useReducer'],
    source: 'manual',
  },
  {
    category: 'frontend',
    type: 'short_answer',
    difficulty: 'medium',
    title: 'React useEffect 的清理函数与依赖数组',
    content: {
      question: 'React useEffect 的清理函数（cleanup function）在什么时候执行？依赖数组为空和包含依赖时有什么不同？',
      answer: '清理函数在组件卸载时和重新执行 effect 之前执行。空依赖数组 []：effect 只在挂载时执行一次，卸载时清理。有依赖项 [a, b]：依赖变化时先清理上次 effect，再执行新 effect。无依赖数组：每次渲染都执行。',
      explanation: '常见清理场景：取消订阅、清除定时器、取消请求。React 18 Strict Mode 在开发模式会双重触发 effect 以检测遗漏清理。',
    },
    tags: ['React', 'useEffect', '生命周期', 'Hooks'],
    source: 'manual',
  },
  {
    category: 'frontend',
    type: 'short_answer',
    difficulty: 'hard',
    title: 'React 虚拟 DOM 与 Diff 算法',
    content: {
      question: '请解释 React 虚拟 DOM 的工作原理和 Diff 算法（Reconciliation）的核心策略。',
      answer: '虚拟 DOM 是真实 DOM 的轻量级 JS 对象表示。Diff 算法核心策略：1）只进行同层比较（O(n)）；2）不同类型节点直接替换子树；3）同类型节点通过 key 属性复用。通过 Fiber 架构实现增量渲染（可中断、可恢复）。',
      explanation: 'React 16+ 使用 Fiber 架构，将渲染拆分为多个小单元，通过时间分片（Time Slicing）避免阻塞主线程。key 应使用稳定且唯一的标识，避免使用数组下标。',
    },
    tags: ['React', '虚拟DOM', 'Diff', 'Fiber'],
    source: 'manual',
  },
  {
    category: 'frontend',
    type: 'choice',
    difficulty: 'easy',
    title: 'CSS 盒模型包含的组成部分',
    content: {
      question: 'CSS 标准盒模型由哪些部分组成？（从内到外顺序）',
      options: [
        'margin → border → padding → content',
        'content → padding → border → margin',
        'content → margin → padding → border',
        'padding → content → border → margin',
      ],
      answer: 'B。标准盒模型从内到外为：content → padding → border → margin。',
      explanation: 'box-sizing: border-box 时，width/height 包含 content+padding+border，更容易控制布局尺寸。',
    },
    tags: ['CSS', '盒模型', 'box-sizing'],
    source: 'manual',
  },
  {
    category: 'frontend',
    type: 'coding',
    difficulty: 'medium',
    title: '实现防抖和节流函数',
    content: {
      question: '请用 JavaScript 实现防抖（debounce）和节流（throttle）函数。',
      answer: '// 防抖：连续触发时只执行最后一次\nfunction debounce(fn, delay) {\n  let timer = null;\n  return function (...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}\n\n// 节流：固定时间间隔内只执行一次\nfunction throttle(fn, interval) {\n  let last = 0;\n  return function (...args) {\n    const now = Date.now();\n    if (now - last >= interval) {\n      last = now;\n      fn.apply(this, args);\n    }\n  };\n}',
      explanation: '防抖适用场景：搜索输入、窗口resize。节流适用场景：滚动事件、拖拽、按钮点击防重复提交。',
    },
    tags: ['JavaScript', '防抖', '节流', '性能优化'],
    source: 'manual',
  },

  // ==================== System Design ====================
  {
    category: 'system-design',
    type: 'short_answer',
    difficulty: 'medium',
    title: '设计一个短链接系统',
    content: {
      question: '如何设计一个类似 TinyURL 的短链接系统？请从存储、哈希算法、重定向等方面阐述。',
      answer: '1）哈希算法：取 MD5/CRC32 的前 6-8 位并用 Base62 编码（a-zA-Z0-9）。2）存储：使用 Redis 做缓存（热点短链），MySQL 做持久化存储。3）重定向：302 临时重定向（可做点击统计）或 301 永久重定向。4）解决冲突：如果哈希碰撞则追加计数再哈希。',
      explanation: '高并发场景写操作可先写入消息队列异步落库。预估 6 位 Base62 可容纳约 568 亿（62^6）个短链。',
    },
    tags: ['系统设计', '短链接', '高并发', '分布式'],
    source: 'manual',
  },
  {
    category: 'system-design',
    type: 'short_answer',
    difficulty: 'hard',
    title: '设计一个高并发秒杀系统',
    content: {
      question: '请设计一个支持百万级 QPS 的秒杀系统架构。',
      answer: '1）前端限流：按钮置灰、验证码。2）网关层限流：Nginx 限流模块（ngx_http_limit_req_module）。3）Redis 预减库存：原子操作 DECR 防止超卖。4）消息队列削峰：请求入队列，后端异步处理订单。5）数据库乐观锁：CAS 机制更新库存。6）CDN 静态化商品页面，减少后端压力。',
      explanation: '秒杀系统的核心思想是"层层过滤"——在尽量靠前的环节拦截无效请求。最终一致性优于强一致性。',
    },
    tags: ['系统设计', '秒杀', '高并发', '限流'],
    source: 'manual',
  },
  {
    category: 'system-design',
    type: 'short_answer',
    difficulty: 'medium',
    title: 'RESTful API 设计原则',
    content: {
      question: 'RESTful API 设计有哪些核心原则？请举例说明。',
      answer: '1）资源导向：使用名词而非动词，如 GET /users 而非 GET /getUsers。2）HTTP 方法语义化：GET 查询、POST 创建、PUT 全量更新、PATCH 部分更新、DELETE 删除。3）状态码正确使用：200 成功、201 创建成功、400 参数错误、401 未认证、404 不存在、500 服务端错误。4）无状态：每个请求包含所有必要信息。5）版本控制：/api/v1/users。',
      explanation: 'HATEOAS 是 REST 成熟度模型的最高级别——返回结果中包含相关资源的链接。',
    },
    tags: ['系统设计', 'RESTful', 'API', '架构'],
    source: 'manual',
  },
  {
    category: 'system-design',
    type: 'coding',
    difficulty: 'medium',
    title: '实现一个限流器（Rate Limiter）',
    content: {
      question: '设计并实现一个令牌桶（Token Bucket）限流器，支持每秒限制请求数。',
      answer: 'class TokenBucket {\n  constructor(capacity, refillRate) {\n    this.capacity = capacity;\n    this.tokens = capacity;\n    this.refillRate = refillRate;\n    this.lastRefill = Date.now();\n  }\n  allow() {\n    this._refill();\n    if (this.tokens > 0) {\n      this.tokens--;\n      return true;\n    }\n    return false;\n  }\n  _refill() {\n    const now = Date.now();\n    const elapsed = (now - this.lastRefill) / 1000;\n    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);\n    this.lastRefill = now;\n  }\n}',
      explanation: '令牌桶允许突发流量（积累的令牌可被瞬间消耗），漏桶算法则严格限制速率。Redis 实现分布式限流可用 Lua 脚本保证原子性。',
    },
    tags: ['系统设计', '限流', '令牌桶', '分布式'],
    source: 'manual',
  },

  // ==================== Behavioral ====================
  {
    category: 'behavioral',
    type: 'behavioral',
    difficulty: 'easy',
    title: '你最大的优点和缺点是什么',
    content: {
      question: '请谈谈你最大的优点和最需要改进的地方（缺点）各是什么？',
      answer: '推荐使用 STAR 法则回答。优点：选择与岗位最相关的 2-3 个，配合具体事例说明。缺点：选择一个正在积极改进的真实缺点，说明改进方法和已取得的进步。避免说"我太追求完美"之类的虚假缺点。',
      explanation: '面试官想了解：1）你的自我认知能力；2）你的诚实度；3）你的成长心态。建议缺点围绕技术广度而非态度问题。',
    },
    tags: ['行为面试', '自我介绍', 'STAR'],
    source: 'manual',
  },
  {
    category: 'behavioral',
    type: 'behavioral',
    difficulty: 'medium',
    title: '处理团队冲突的经历',
    content: {
      question: '请描述一次你在团队中遇到分歧或冲突的经历，以及你是如何处理的。',
      answer: '推荐 SBI 模型（Situation-Behavior-Impact）。示例：项目中前后端对接口规范有分歧。做法：1）组织技术讨论会，让双方充分表达观点；2）列出各方案的优缺点对比；3）以数据驱动决策（如性能测试结果）；4）达成共识后文档化。关键：以事论事，不针对个人。',
      explanation: '面试官考察：冲突解决能力、沟通能力、团队合作精神。避免说从未遇到冲突或把责任推给他人。',
    },
    tags: ['行为面试', '团队协作', '冲突管理'],
    source: 'manual',
  },
  {
    category: 'behavioral',
    type: 'behavioral',
    difficulty: 'hard',
    title: '面对压力或紧急项目的经历',
    content: {
      question: '请分享一次你在紧迫期限或高压环境下完成项目的经历。',
      answer: '使用 STAR 法：Situation（项目延期、人手不足）、Task（需要在 2 周内完成原定 1 个月的工作）、Action（1. 优先级排序 MVP 功能；2. 与 PM 沟通调整非核心需求；3. 合理加班但保证休息；4. 每日站会同步进度）、Result（按期上线，核心功能完整，获得团队认可）。',
      explanation: '面试官考察：抗压能力、时间管理、优先级判断。重点是"你是如何应对的"而非"压力有多大"。',
    },
    tags: ['行为面试', '压力', '时间管理', '项目管理'],
    source: 'manual',
  },
  {
    category: 'behavioral',
    type: 'behavioral',
    difficulty: 'easy',
    title: '你为什么想加入我们公司',
    content: {
      question: '你为什么对我们公司和这个职位感兴趣？',
      answer: '从三个层面回答：1）公司层面：认可公司的技术栈/业务方向/行业地位；2）职位层面：岗位职责与你的职业规划契合，能发挥你的核心技能；3）价值层面：你能为公司带来什么独特价值。提前研究公司的技术博客、团队背景、产品特点。',
      explanation: '避免过于功利的回答（如"工资高"）。也避免不具体的回答（如"你们公司很好"）。要展现你已经做了充分的调研。',
    },
    tags: ['行为面试', '求职动机', '面试技巧'],
    source: 'manual',
  },

  // ==================== Database ====================
  {
    category: 'database',
    type: 'short_answer',
    difficulty: 'medium',
    title: 'MySQL 索引类型与 B+ 树',
    content: {
      question: '请介绍 MySQL InnoDB 的索引类型，以及为什么使用 B+ 树？',
      answer: '索引类型：1）主键索引（聚簇索引）：叶子节点存整行数据；2）辅助索引（二级索引）：叶子节点存主键值。B+ 树优势：非叶子节点只存键（扇出大、树矮）、叶子节点通过链表连接（范围查询高效）、所有数据都在叶子节点（查询稳定 O(log n)）。回表：二级索引查到主键后回聚簇索引查完整行。',
      explanation: '覆盖索引可避免回表：需要查询的字段全部在索引中有包含。联合索引遵循最左前缀原则。',
    },
    tags: ['数据库', 'MySQL', '索引', 'B+树'],
    source: 'manual',
  },
  {
    category: 'database',
    type: 'short_answer',
    difficulty: 'hard',
    title: 'MySQL 事务隔离级别与 MVCC',
    content: {
      question: '请详细介绍 MySQL InnoDB 的事务隔离级别和 MVCC（多版本并发控制）的实现原理。',
      answer: '四种隔离级别：READ UNCOMMITTED（脏读）、READ COMMITTED（不可重复读）、REPEATABLE READ（幻读，MySQL 默认）、SERIALIZABLE。MVCC 通过三个核心机制实现：1）隐藏字段（DB_TRX_ID 事务ID、DB_ROLL_PTR 回滚指针）；2）Undo Log 版本链；3）Read View（活跃事务列表）。RC 级别每个语句创建 Read View，RR 级别每个事务创建 Read View。',
      explanation: 'MySQL 的 RR 级别通过 Gap Lock 解决幻读。快照读（SELECT）使用 MVCC，当前读（SELECT FOR UPDATE）使用锁。',
    },
    tags: ['数据库', 'MySQL', 'MVCC', '事务'],
    source: 'manual',
  },
  {
    category: 'database',
    type: 'short_answer',
    difficulty: 'easy',
    title: 'SQL 中 JOIN 的类型与区别',
    content: {
      question: 'SQL 中 INNER JOIN、LEFT JOIN、RIGHT JOIN、FULL OUTER JOIN 有什么区别？',
      answer: 'INNER JOIN：只返回两表匹配的行。LEFT JOIN：返回左表所有行，右表无匹配则 NULL。RIGHT JOIN：返回右表所有行，左表无匹配则 NULL。FULL OUTER JOIN：返回两表所有行，无匹配则 NULL（MySQL 不支持，需用 UNION 模拟）。',
      explanation: 'CROSS JOIN 是笛卡尔积，无 ON 条件时 LEFT/RIGHT JOIN 等价于 CROSS JOIN。自连接是同一张表用不同别名 JOIN。',
    },
    tags: ['数据库', 'SQL', 'JOIN', '查询'],
    source: 'manual',
  },

  // ==================== 网络 ====================
  {
    category: 'network',
    type: 'short_answer',
    difficulty: 'easy',
    title: 'HTTP 与 HTTPS 的区别',
    content: {
      question: 'HTTP 和 HTTPS 有什么区别？HTTPS 的 TLS 握手过程是怎样的？',
      answer: '区别：HTTP 明文传输（80 端口）、HTTPS 加密传输（443 端口）。TLS 1.3 握手：ClientHello（客户端随机数+支持的密码套件）→ ServerHello（服务器随机数+选定套件+证书）→ 客户端验证证书并发送密钥交换参数 → 双方计算会话密钥 → 加密通信开始。',
      explanation: 'HTTPS 使用对称加密（传输数据）和非对称加密（交换密钥）的混合加密方案。CA 证书保证服务器身份真实性。',
    },
    tags: ['网络', 'HTTP', 'HTTPS', 'TLS'],
    source: 'manual',
  },
  {
    category: 'network',
    type: 'short_answer',
    difficulty: 'medium',
    title: 'TCP 三次握手和四次挥手',
    content: {
      question: '请详细说明 TCP 三次握手建立连接和四次挥手断开连接的过程。',
      answer: '三次握手：1）Client → SYN=1, seq=x；2）Server → SYN=1, ACK=1, seq=y, ack=x+1；3）Client → ACK=1, seq=x+1, ack=y+1。四次挥手：1）Client → FIN=1；2）Server → ACK=1；3）Server → FIN=1；4）Client → ACK=1，等待 2MSL 后关闭。',
      explanation: '第三次握手可携带数据（连接复用）。四次挥手中 TIME_WAIT 状态（2MSL）确保被动关闭方收到最后的 ACK，并让过期报文从网络中消失。',
    },
    tags: ['网络', 'TCP', '三次握手', '四次挥手'],
    source: 'manual',
  },
  {
    category: 'network',
    type: 'short_answer',
    difficulty: 'hard',
    title: '从输入 URL 到页面渲染的完整过程',
    content: {
      question: '在浏览器中输入 URL 并回车，到页面渲染完成，经历了哪些步骤？',
      answer: '1）DNS 解析（浏览器缓存→系统缓存→路由器缓存→根/顶级/权威 DNS）；2）TCP 三次握手；3）TLS 握手（HTTPS）；4）发送 HTTP 请求；5）服务器处理并返回响应；6）浏览器解析 HTML 构建 DOM 树；7）解析 CSS 构建 CSSOM 树；8）合并为 Render Tree；9）布局（Layout/Reflow）计算几何信息；10）绘制（Paint）→ 合成（Composite）。',
      explanation: '现代浏览器使用并行下载（同一域名通常 6 个并发连接）。关键渲染路径优化：减少重排、CSS 放 head、JS 放 body 末尾或使用 defer/async。',
    },
    tags: ['网络', '浏览器', '渲染', 'HTTP'],
    source: 'manual',
  },
];

// ── 写入数据库 ──────────────────────────────────────────────

async function main() {
  console.log('🚀 开始填充 QuestionBank...\n');

  // 清空旧数据（可选）
  const existing = await prisma.questionBank.count();
  if (existing > 0) {
    console.log(`⚠️ 已有 ${existing} 条数据，跳过写入。如需重新写入请先执行 truncate。`);
    await prisma.$disconnect();
    return;
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    process.stdout.write(`  [${i + 1}/${questions.length}] ${q.title.padEnd(50)} `);

    try {
      await prisma.questionBank.create({
        data: {
          category: q.category,
          type: q.type,
          difficulty: q.difficulty,
          title: q.title,
          content: q.content as any,
          tags: q.tags,
          source: q.source,
        },
      });
      console.log('✅');
    } catch (err: any) {
      console.log(`❌ ${err.message}`);
    }
  }

  const total = await prisma.questionBank.count();
  console.log(`\n📊 填充完成！QuestionBank 共 ${total} 条题目`);
  console.log('按分类统计:');
  const stats = await prisma.questionBank.groupBy({
    by: ['category'],
    _count: true,
  });
  for (const s of stats) {
    console.log(`  ${s.category}: ${s._count} 条`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ 脚本执行失败:', err);
  process.exit(1);
});
