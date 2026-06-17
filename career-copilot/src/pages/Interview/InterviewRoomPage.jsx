import {useState, useEffect, useRef, useCallback} from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import {
  ArrowLeftOutlined,
  SendOutlined,
  StopOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  RobotOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { EmptyState } from '../../components/common';
import './InterviewRoom.css';


/* Mock 数据 */
const MOCK_INTERVIEW = {
  id: '1',
  targetPosition: '后端开发工程师',
  difficulty: '中等',
  totalRounds: 8,
  currentRound: 3,
  startedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
};

const INITIAL_MESSAGES = [
  {
    id: 'm1',
    role: 'ai',
    content: '你好！我是你的 AI 面试官，今天我们将进行一次后端开发工程师岗位的模拟面试。面试共 8 道题，预计需要 20-30 分钟。准备好了我们就开始吧！',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    rating: null,
  },
  {
    id: 'm2',
    role: 'ai',
    content: '请先简单介绍一下你自己，以及为什么想应聘后端开发工程师岗位？',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    rating: null,
  },
  {
    id: 'm3',
    role: 'user',
    content: '您好！我是一名计算机科学与技术专业的应届毕业生，熟练掌握 Java、Spring Boot、MySQL 等技术栈。在校期间参与过多个后端项目开发，对后端开发有浓厚的兴趣，希望能够在这个领域深耕发展。',
    timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    rating: null,
  },
  {
    id: 'm4',
    role: 'ai',
    content: '很好的开场！从你的自我介绍中能感受到你的热情。\n\n接下来我们进入技术问题环节。请听题：\n\n请介绍一下 Java 中 HashMap 的实现原理，包括底层数据结构、put 和 get 方法的执行流程。',
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    rating: 4,
  },
];

/** 模拟 AI 回复库 */
const AI_RESPONSES = [
  '回答得不错！你对 HashMap 的核心原理理解得比较清楚。\n\n不过我想补充一点：在 Java 8 中，当链表长度超过阈值（8）时，链表会转换为红黑树，这是为了解决哈希碰撞严重时查询效率从 O(n) 退化的问题。\n\n能说一下你对负载因子（load factor）的理解吗？',
  '很好的回答！负载因子默认是 0.75，这是时间成本和空间成本的平衡点。\n\n那我来问一个数据库相关的问题：MySQL 中索引的底层数据结构是什么？为什么要选择这种结构？',
  'B+ 树确实是 InnoDB 引擎索引的底层结构。它能很好地支持范围查询和排序操作。\n\n接下来聊聊 Redis 吧：Redis 支持哪些数据类型？分别适用于什么场景？',
  '很好，你对 Redis 的五种基本数据类型掌握得不错。\n\n最后一个问题：在分布式系统中，什么是 CAP 定理？在实际系统设计中你是如何权衡的？',
  '非常好！你对分布式系统的基本理论有清晰的认识。\n\n现在我们来到系统设计题：请设计一个短链接生成服务，需要考虑哪些核心功能和技术选型？',
];


/*  Hook: 打字机效果 */

/**
 * 流式文本渲染 Hook - 打字机效果
 * @param {string} fullText - 完整文本
 * @param {number} speed - 每个字符的间隔毫秒数，默认 30
 * @returns {string} 当前已显示的文本
 */
function useStreamingText(fullText, speed = 30) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    // 重置状态
    setDisplayed('');
    indexRef.current = 0;

    if (!fullText) return;

    const timer = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= fullText.length) {
        setDisplayed(fullText);
        clearInterval(timer);
      } else {
        setDisplayed(fullText.slice(0, indexRef.current));
      }
    }, speed);

    return () => clearInterval(timer);
  }, [fullText, speed]);

  return displayed;
}


/*  组件: 面试计时器 */

/**
 * 面试计时器组件 - 显示已用时间 (MM:SS)
 * @param {Object} props
 * @param {string} props.startedAt - ISO 时间字符串
 * @param {function} [props.onTimeUpdate] - 时间更新回调
 * @returns {JSX.Element}
 */
function InterviewTimer({startedAt, onTimeUpdate}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);
      setElapsed(diff);
      if (onTimeUpdate) onTimeUpdate(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt, onTimeUpdate]);

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');

  return (
    <span className="timer-display">
      <ClockCircleOutlined /> {minutes}:{seconds}
    </span>
  );
}


/* 组件: 消息气泡 */

/**
 * AI 消息的评分星级显示
 * @param {number} rating - 1-5 分
 * @returns {JSX.Element}
 */
function StarRating({rating}) {
  if (!rating) return null;
  return (
    <span className="star-rating">
      {'⭐'.repeat(rating)}
      <span className="star-score">{rating}/5</span>
    </span>
  );
}

/**
 * 单条消息气泡组件
 * @param {Object} props
 * @param {Object} props.message - 消息对象
 * @param {boolean} props.isStreaming - 是否正在流式渲染
 * @returns {JSX.Element}
 */
function MessageBubble({message, isStreaming}) {
  const isAI = message.role === 'ai';
  const streamingText = useStreamingText(
    isStreaming ? message.content : '',
    25
  );

  const displayContent = isStreaming ? streamingText : message.content;
  const isComplete = !isStreaming || streamingText.length >= message.content.length;
  const formattedTime = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`message-row ${isAI ? 'ai' : 'user'}`}>
      <div className="message-avatar">
        {isAI ? <RobotOutlined /> : <UserOutlined />}
      </div>
      <div className={`message-bubble ${isAI ? 'ai-bubble' : 'user-bubble'}`}>
        {message.role === 'ai' && (
          <div className="message-sender">AI 面试官</div>
        )}
        <div className="message-content">
          {displayContent.split('\n').map((line, i) => (
            <p key={i}>{line || '\u00A0'}</p>
          ))}
          {isStreaming && !isComplete && (
            <span className="streaming-cursor">|</span>
          )}
        </div>
        <div className="message-footer">
          {message.rating != null && <StarRating rating={message.rating} />}
          <span className="message-time">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
}


/*  组件: 消息列表 */

/**
 * 聊天消息列表组件 - 带自动滚动
 * @param {Object} props
 * @param {Array} props.messages - 消息数组
 * @param {string|null} props.aiStreamingId - 正在流式渲染的消息 ID
 * @returns {JSX.Element}
 */
function ChatMessages({messages, aiStreamingId}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    // 自动滚动到底部
    bottomRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages]);

  return (
    <div className="chat-messages">
      {messages.length === 0 && (
        <EmptyState
          icon={RobotOutlined}
          title="正在准备面试题目..."
          size="small"
          style={{ paddingTop: 80 }}
        />
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isStreaming={msg.id === aiStreamingId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}


/*  组件: 输入区域 */

/**
 * 输入区域组件 - 文本框 + 发送按钮 + 结束面试按钮
 * @param {Object} props
 * @param {boolean} props.disabled - 是否禁用输入
 * @param {boolean} props.isFinished - 面试是否已结束
 * @param {function} props.onSend - 发送消息回调
 * @param {function} props.onEnd - 结束面试回调
 * @returns {JSX.Element}
 */
function InputArea({disabled, isFinished, onSend, onEnd}) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  // 输入框自动聚焦
  useEffect(() => {
    if (!disabled && !isFinished) {
      inputRef.current?.focus();
    }
  }, [disabled, isFinished]);

  /** 发送消息 */
  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled || isFinished) return;
    onSend(trimmed);
    setText('');
  }, [text, disabled, isFinished, onSend]);

  /** 键盘事件处理 */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (isFinished) {
    return (
      <div className="input-area finished">
        <div className="finished-banner">
          <CheckCircleOutlined style={{color: '#52c41a', fontSize: 18}} />
          <span>面试已结束</span>
          <Link to={`/interview/${MOCK_INTERVIEW.id}/report`} className="btn-report">
            查看报告
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <textarea
          ref={inputRef}
          className="input-textarea"
          placeholder="输入你的回答... (Enter 发送, Shift+Enter 换行)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={2}
        />
        <button
          className="btn-send"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          title="发送"
        >
          {disabled ? <LoadingOutlined /> : <SendOutlined />}
        </button>
      </div>
      <button className="btn-end" onClick={onEnd}>
        <StopOutlined /> 结束面试
      </button>
    </div>
  );
}


/*  主组件: 面试对话页 */

/**
 * 面试对话页 - 核心面试交互界面
 * @returns {JSX.Element}
 */
const InterviewRoomPage = () => {
  const {id} = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiResponding, setAiResponding] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected'); // connected | reconnecting | disconnected
  const roundRef = useRef(3);
  const aiResponseIndexRef = useRef(0);

  /**
   * 加载面试数据 (GET /interviews/:id)
   */
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setTimeout(() => {
      if (!mounted) return;
      setInterview({...MOCK_INTERVIEW, id});
      setMessages([...INITIAL_MESSAGES]);
      roundRef.current = MOCK_INTERVIEW.currentRound;
      setLoading(false);
    }, 500);
    return () => {mounted = false;};
  }, [id]);

  /**
   * 发送消息 - 模拟 POST /interviews/:id/answer + AI 回复
   * @param {string} content - 用户输入的回答
   */
  const handleSend = useCallback((content) => {
    // 添加用户消息
    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    // 添加 AI 占位消息（准备流式渲染）
    const aiMsgId = `ai_${Date.now()}`;
    const aiResponse = AI_RESPONSES[aiResponseIndexRef.current % AI_RESPONSES.length];
    aiResponseIndexRef.current += 1;

    const aiMsg = {
      id: aiMsgId,
      role: 'ai',
      content: aiResponse,
      timestamp: new Date(Date.now() + 500).toISOString(),
      rating: Math.floor(Math.random() * 2) + 3, // 3-4 分
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setAiResponding(true);
    setStreamingId(aiMsgId);

    // 更新轮次
    roundRef.current += 1;

    // 模拟 AI 回复结束
    const totalLength = aiResponse.length;
    const typingDuration = totalLength * 25 + 500; // 打字机速度 25ms/字
    setTimeout(() => {
      setAiResponding(false);
      setStreamingId(null);
    }, typingDuration);
  }, []);

  /**
   * 结束面试 - 模拟 POST /interviews/:id/feedback
   */
  const handleEnd = useCallback(() => {
    const confirmed = window.confirm(
      '确定要结束当前面试吗？结束后将生成面试报告。'
    );
    if (!confirmed) return;

    setIsFinished(true);
    setAiResponding(false);
    setStreamingId(null);

    // 模拟短暂的结束处理
    setTimeout(() => {
      navigate(`/interview/${id}/report`);
    }, 1200);
  }, [id, navigate]);

  // --- 加载状态 ---
  if (loading) {
    return (
      <div className="room-page">
        <div className="room-loading">
          <div className="loading-header-skeleton" />
          <div className="loading-body-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-message">
                <div className="skeleton-avatar-sm" />
                <div className="skeleton-lines">
                  <div className="skeleton-line" style={{width: '70%'}} />
                  <div className="skeleton-line" style={{width: '45%'}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="room-page">
        <EmptyState
          icon={ExclamationCircleOutlined}
          title="面试不存在或已被删除"
          actionText="返回面试准备"
          onAction={() => navigate('/interview')}
        />
      </div>
    );
  }

  return (
    <div className="room-page">
      {/* 顶部栏 */}
      <div className="room-topbar">
        <Link to="/interview" className="topbar-back">
          <ArrowLeftOutlined />
        </Link>
        <div className="topbar-info">
          <span className="topbar-position">{interview.targetPosition}</span>
          <span className="topbar-divider">·</span>
          <span className="topbar-difficulty">{interview.difficulty}</span>
          <span className="topbar-divider">·</span>
          <span className="topbar-round">
            第 {roundRef.current}/{interview.totalRounds} 轮
          </span>
        </div>
        <div className="topbar-right">
          {/* 连接状态 */}
          <span
            className={`connection-status ${connectionStatus}`}
            title={
              connectionStatus === 'connected'
                ? '已连接'
                : connectionStatus === 'reconnecting'
                  ? '重连中...'
                  : '已断开'
            }
          >
            <ApiOutlined />
          </span>
          <InterviewTimer startedAt={interview.startedAt} />
        </div>
      </div>

      {/* 消息列表 */}
      <ChatMessages messages={messages} aiStreamingId={streamingId} />

      {/* 输入区域 */}
      <InputArea
        disabled={aiResponding}
        isFinished={isFinished}
        onSend={handleSend}
        onEnd={handleEnd}
      />
    </div>
  );
};

export default InterviewRoomPage;
