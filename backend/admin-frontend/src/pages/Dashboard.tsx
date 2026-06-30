import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, Alert } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { dashboardApi } from '../api';
import type { DashboardStats } from '../types';
import dayjs from 'dayjs';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardApi.stats();
        setStats(res.data?.data || res.data);
      } catch (err: any) {
        // If 404/not implemented, show partial view
        setError(err?.response?.status === 404 ? 'API 未就绪' : null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 如果 stats API 不可用，用静态占位
  const data = stats || {
    userCount: 0,
    resumeCount: 0,
    interviewCount: 0,
    careerPlanCount: 0,
    questionCount: 0,
    recentUsers: [],
    dailyStats: [],
  };

  const statCards = [
    { title: '用户总数', value: data.userCount, icon: <UserOutlined />, color: '#667eea' },
    { title: '简历总数', value: data.resumeCount, icon: <FileTextOutlined />, color: '#52c41a' },
    { title: '面试记录', value: data.interviewCount, icon: <MessageOutlined />, color: '#faad14' },
    { title: '职业规划', value: data.careerPlanCount, icon: <CompassOutlined />, color: '#eb2f96' },
  ];

  const recentColumns = [
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '姓名', dataIndex: 'name', key: 'name', render: (v: string) => v || '-' },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>总览面板</h2>
      </div>

      {error && (
        <Alert
          message={error}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        {statCards.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.title}>
            <Card className="stat-card" hoverable>
              <Statistic
                title={card.title}
                value={card.value}
                prefix={
                  <span style={{ color: card.color, fontSize: 24 }}>
                    {card.icon}
                  </span>
                }
                valueStyle={{ color: card.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="最近注册用户" style={{ marginTop: 24 }}>
        <Table
          dataSource={data.recentUsers}
          columns={recentColumns}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: '暂无数据' }}
        />
      </Card>
    </div>
  );
}
