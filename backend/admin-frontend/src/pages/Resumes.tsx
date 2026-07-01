import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Space, Tag, Modal, Descriptions,
  message, Popconfirm, Card, Typography,
} from 'antd';
import { SearchOutlined, EyeOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { resumeApi } from '../api';
import type { Resume } from '../types';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function Resumes() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [detail, setDetail] = useState<Resume | null>(null);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await resumeApi.list({ page, limit: 20, search });
      const d = res.data?.data || res.data;
      setResumes(Array.isArray(d) ? d : d?.resumes || d?.items || []);
      setTotal(d?.pagination?.total ?? d?.total ?? 0);
    } catch {
      message.error('获取简历列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleViewDetail = async (id: string) => {
    try {
      const res = await resumeApi.get(id);
      setDetail(res.data?.data || res.data);
      setDetailModal(true);
    } catch {
      message.error('获取简历详情失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await resumeApi.remove(id);
      message.success('删除成功');
      fetchResumes();
    } catch {
      message.error('删除失败');
    }
  };

  const statusColor: Record<string, string> = {
    pending: 'default',
    processing: 'processing',
    completed: 'success',
    failed: 'error',
  };

  const statusText: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
      width: 250,
    },
    {
      title: '用户',
      key: 'user',
      width: 180,
      render: (_: unknown, record: Resume) => record.user?.email || record.userId || '-',
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
      render: (size: number) => {
        if (!size) return '-';
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
      },
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
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Resume) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            查看
          </Button>
          <Popconfirm title="确定删除此简历？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>简历管理</h2>
        <Space>
          <Input
            placeholder="搜索文件名或用户"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={fetchResumes}>
            刷新
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={resumes}
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
          locale={{ emptyText: '暂无简历数据' }}
        />
      </Card>

      <Modal
        title="简历详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={720}
      >
        {detail && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="文件名" span={2}>
              {detail.fileName}
            </Descriptions.Item>
            <Descriptions.Item label="用户">
              {detail.user?.email || detail.userId}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColor[detail.status]}>{statusText[detail.status] || detail.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="文件大小">
              {detail.fileSize ? `${(detail.fileSize / 1024).toFixed(1)} KB` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="文件类型">
              {detail.fileType || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="上传时间" span={2}>
              {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {detail.parsedData && (
              <Descriptions.Item label="解析数据" span={2}>
                <pre style={{ maxHeight: 300, overflow: 'auto', background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(detail.parsedData, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
