import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Space, Tag, Modal, Card,
  message, Timeline, Typography, Descriptions,
} from 'antd';
import {
  SearchOutlined, EyeOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { interviewApi } from '../api';
import type { Interview, InterviewMessage } from '../types';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function Interviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [detail, setDetail] = useState<Interview | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await interviewApi.list({ page, limit: 20, search });
      const d = res.data?.data || res.data;
      setInterviews(Array.isArray(d) ? d : d?.interviews || d?.items || []);
      setTotal(d?.pagination?.total ?? d?.total ?? 0);
    } catch {
      message.error('获取面试记录失败');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const handleViewDetail = async (record: Interview) => {
    setDetail(record);
    setMessages([]);
    try {
      const res = await interviewApi.get(record.id);
      const data = res.data?.data || res.data;
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch {
      // 即使获取详情失败，也显示基本信息
    }
    setDetailModal(true);
  };

  const statusColor: Record<string, string> = {
    pending: 'default',
    in_progress: 'processing',
    completed: 'success',
    cancelled: 'warning',
  };

  const statusText: Record<string, string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  };

  const columns = [
    {
      title: '面试职位',
      dataIndex: 'position',
      key: 'position',
      width: 200,
    },
    {
      title: '用户',
      key: 'user',
      width: 180,
      render: (_: unknown, record: Interview) => record.user?.email || record.userId || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (v: string) => v || '文本',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColor[status] || 'default'}>
          {statusText[status] || status}
        </Tag>
      ),
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (v: number | null) => (v != null ? `${v} 分` : '-'),
    },
    {
      title: '开始时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 160,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Interview) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>面试管理</h2>
        <Space>
          <Input
            placeholder="搜索职位或用户"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={fetchInterviews}>
            刷新
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={interviews}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: (p) => setPage(p),
            showTotal: (t) => `共 ${t} 条`,
          }}
          scroll={{ x: 900 }}
          locale={{ emptyText: '暂无面试记录' }}
        />
      </Card>

      <Modal
        title="面试详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={800}
      >
        {detail && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="职位">{detail.position}</Descriptions.Item>
              <Descriptions.Item label="类型">{detail.type || '文本'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColor[detail.status]}>
                  {statusText[detail.status] || detail.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="分数">
                {detail.score != null ? `${detail.score} 分` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="用户">
                {detail.user?.email || detail.userId}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {detail.startedAt ? dayjs(detail.startedAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              {detail.feedback && (
                <Descriptions.Item label="反馈" span={2}>
                  <Text>{detail.feedback}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {messages.length > 0 && (
              <Card title="对话记录" size="small">
                <Timeline
                  items={messages.map((msg) => ({
                    color: msg.role === 'assistant' ? '#667eea' : '#52c41a',
                    children: (
                      <div>
                        <Text strong style={{ fontSize: 12 }}>
                          {msg.role === 'assistant' ? 'AI 面试官' : '用户'} · {dayjs(msg.createdAt).format('HH:mm:ss')}
                        </Text>
                        <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                      </div>
                    ),
                  }))}
                />
              </Card>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
