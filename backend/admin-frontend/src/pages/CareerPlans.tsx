import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Space, Tag, Modal, Card,
  message, Descriptions, Typography,
} from 'antd';
import {
  SearchOutlined, EyeOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { careerPlanApi } from '../api';
import type { CareerPlan } from '../types';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function CareerPlans() {
  const [plans, setPlans] = useState<CareerPlan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [detail, setDetail] = useState<CareerPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await careerPlanApi.list({ page, limit: 20, search });
      const d = res.data?.data || res.data;
      setPlans(Array.isArray(d) ? d : d?.plans || d?.items || []);
      setTotal(d?.pagination?.total ?? d?.total ?? 0);
    } catch {
      message.error('获取职业规划列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleViewDetail = (record: CareerPlan) => {
    setDetail(record);
    setDetailModal(true);
  };

  const statusColor: Record<string, string> = {
    draft: 'default',
    completed: 'success',
    processing: 'processing',
  };

  const statusText: Record<string, string> = {
    draft: '草稿',
    completed: '已完成',
    processing: '生成中',
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true,
    },
    {
      title: '用户',
      key: 'user',
      width: 180,
      render: (_: unknown, record: CareerPlan) => record.user?.email || record.userId || '-',
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
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: CareerPlan) => (
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
        <h2>职业规划</h2>
        <Space>
          <Input
            placeholder="搜索标题或用户"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={fetchPlans}>
            刷新
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={plans}
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
          locale={{ emptyText: '暂无职业规划数据' }}
        />
      </Card>

      <Modal
        title="规划详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={720}
      >
        {detail && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="标题" span={2}>{detail.title}</Descriptions.Item>
              <Descriptions.Item label="用户">
                {detail.user?.email || detail.userId}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColor[detail.status]}>
                  {statusText[detail.status] || detail.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(detail.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
            {detail.content && (
              <Card title="规划内容" size="small" style={{ marginTop: 16 }}>
                <pre style={{ maxHeight: 400, overflow: 'auto', fontSize: 13, whiteSpace: 'pre-wrap' }}>
                  {typeof detail.content === 'string'
                    ? detail.content
                    : JSON.stringify(detail.content, null, 2)}
                </pre>
              </Card>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
