import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Space, Tag, Modal, Form, Select,
  message, Popconfirm, Card, Typography,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, LinkOutlined,
} from '@ant-design/icons';
import { resourceApi } from '../api';
import type { LearningResource } from '../types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;

export default function LearningResources() {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<LearningResource | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await resourceApi.list({ page, limit: 20, category: category || undefined });
      const d = res.data?.data || res.data;
      setResources(Array.isArray(d) ? d : d?.items || []);
      setTotal(d?.pagination?.total ?? d?.total ?? 0);
    } catch {
      message.error('获取学习资源失败');
    } finally {
      setLoading(false);
    }
  }, [page, category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditItem(null);
    form.resetFields();
    setModal(true);
  };

  const handleEdit = (item: LearningResource) => {
    setEditItem(item);
    form.setFieldsValue(item);
    setModal(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editItem) {
        await resourceApi.update(editItem.id, values);
        message.success('更新成功');
      } else {
        await resourceApi.create(values);
        message.success('创建成功');
      }
      setModal(false);
      fetchData();
    } catch (err: any) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await resourceApi.remove(id);
      message.success('删除成功');
      fetchData();
    } catch {
      message.error('删除失败');
    }
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
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (v: string) => v && <Tag color="purple">{v}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 250,
      render: (v: string) => v || '-',
    },
    {
      title: '链接',
      dataIndex: 'url',
      key: 'url',
      width: 200,
      ellipsis: true,
      render: (v: string) =>
        v ? (
          <a href={v} target="_blank" rel="noopener noreferrer">
            <LinkOutlined /> {v.length > 30 ? v.slice(0, 30) + '...' : v}
          </a>
        ) : (
          '-'
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
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: LearningResource) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
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
        <h2>学习资源</h2>
        <Space>
          <Select
            placeholder="筛选分类"
            value={category || undefined}
            onChange={(v) => setCategory(v || '')}
            allowClear
            style={{ width: 140 }}
          >
            <Select.Option value="前端">前端</Select.Option>
            <Select.Option value="后端">后端</Select.Option>
            <Select.Option value="算法">算法</Select.Option>
            <Select.Option value="系统设计">系统设计</Select.Option>
            <Select.Option value="职业发展">职业发展</Select.Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增资源
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={resources}
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
          scroll={{ x: 1000 }}
          locale={{ emptyText: '暂无学习资源' }}
        />
      </Card>

      <Modal
        title={editItem ? '编辑资源' : '新增资源'}
        open={modal}
        onOk={handleSave}
        onCancel={() => setModal(false)}
        okText="保存"
        cancelText="取消"
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="url" label="链接">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select allowClear>
              <Select.Option value="前端">前端</Select.Option>
              <Select.Option value="后端">后端</Select.Option>
              <Select.Option value="算法">算法</Select.Option>
              <Select.Option value="系统设计">系统设计</Select.Option>
              <Select.Option value="职业发展">职业发展</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
