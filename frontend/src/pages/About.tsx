import React from 'react';
import { GithubOutlined, BookOutlined, TeamOutlined, SafetyOutlined } from '@ant-design/icons';

const About: React.FC = () => {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 32px',
      textAlign: 'left',
      animation: 'fade-in-up 0.4s ease-out',
    }}>
      {/* 标题区 */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--text-h)',
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
        }}>
          关于 Career Copilot
        </h1>
        <p style={{
          fontSize: '15px',
          color: 'var(--text-muted)',
          margin: 0,
          lineHeight: 1.6,
        }}>
          你的 AI 驱动的职业发展助手
        </p>
      </div>

      {/* 介绍卡片 */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-sm)',
        lineHeight: 1.7,
        fontSize: '14px',
        color: 'var(--text-muted)',
      }}>
        <p style={{ margin: '0 0 12px' }}>
          Career Copilot 是一个全栈 AI 面试准备与职业规划平台，帮助求职者通过模拟面试、
          简历管理和个性化职业规划，全面提升求职竞争力。
        </p>
        <p style={{ margin: 0 }}>
          平台整合了 AI 模拟面试、实时语音交互、智能简历解析、职业路径规划等功能，
          为用户的职业发展提供全方位的支持。
        </p>
      </div>

      {/* 特性网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '24px',
      }}>
        {[
          { icon: <GithubOutlined />, title: 'AI 模拟面试', desc: '真实面试场景模拟' },
          { icon: <BookOutlined />, title: '简历管理', desc: '智能解析与评分' },
          { icon: <TeamOutlined />, title: '职业规划', desc: '个性化发展路径' },
          { icon: <SafetyOutlined />, title: '语音交互', desc: '实时对话练习' },
        ].map((item) => (
          <div key={item.title} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius)',
            padding: '20px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.25s ease',
            cursor: 'default',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              e.currentTarget.style.borderColor = 'var(--accent-border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.borderColor = 'var(--border-light)';
            }}
          >
            <div style={{
              fontSize: '28px',
              color: 'var(--accent)',
              marginBottom: '10px',
            }}>
              {item.icon}
            </div>
            <h3 style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-h)',
              margin: '0 0 4px',
            }}>
              {item.title}
            </h3>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              margin: 0,
            }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* 技术栈卡片 */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        fontSize: '14px',
      }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-h)',
          margin: '0 0 16px',
        }}>
          技术栈
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {['React 19', 'TypeScript 6', 'NestJS', 'Prisma', 'PostgreSQL', 'Redis', 'Socket.IO', 'Docker'].map((tech) => (
            <span key={tech} style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '8px',
              background: 'var(--accent-bg)',
              color: 'var(--accent)',
              fontSize: '12px',
              fontWeight: 500,
            }}>
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About
