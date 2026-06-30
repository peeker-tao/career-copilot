import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Space, Tag, Modal, Form, Select,
  message, Popconfirm, Card, Typography,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { questionApi } from '../api';
import type { QuestionBank as QuestionType } from '../types';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function QuestionBank() {
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<QuestionType | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await questionApi.list({ page, limit: 20, category: category || undefined });
      const d = res.data?.data || res.data;
      setQuestions(Array.isArray(d) ? d : d?.items || []);
      setTotal(d?.pagination?.total ?? d?.total ?? 0);
    } catch {
      message.error('获取题库失败');
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

  const handleEdit = (item: QuestionType) => {
    setEditItem(item);
    form.setFieldsValue(item);
    setModal(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editItem) {
        await questionApi.update(editItem.id, values);
        message.success('更新成功');
      } else {
        await questionApi.create(values);
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
      await questionApi.remove(id);
      message.success('删除成功');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  const difficultyColor: Record<string, string> = {
    easy: 'green',
    medium: 'orange',
    hard: 'red',
  };

  const difficultyText: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  const columns = [
    {
      title: '题目',
      dataIndex: 'question',
      key: 'question',
      ellipsis: true,
      width: 350,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (v: string) => v && <Tag>{v}</Tag>,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (v: string) => (
        <Tag color={difficultyColor[v]}>{difficultyText[v] || v}</Tag>
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
      render: (_: unknown, record: QuestionType) => (
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
        <h2>题库管理</h2>
        <Space>
          <Select
            placeholder="筛选分类"
            value={category || undefined}
            onChange={(v) => setCategory(v || '')}
            allowClear
            style={{ width: 140 }}
          >
            <Select.Option value="技术">技术</Select.Option>
            <Select.Option value="HR">HR</Select.Option>
            <Select.Option value="行为">行为</Select.Option>
            <Select.Option value="项目">项目</Select.Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增题目
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={questions}
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
          locale={{ emptyText: '暂无题目' }}
        />
      </Card>

      <Modal
        title={editItem ? '编辑题目' : '新增题目'}
        open={modal}
        onOk={handleSave}
        onCancel={() => setModal(false)}
        okText="保存"
        cancelText="取消"
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="question" label="题目" rules={[{ required: true, message: '请输入题目' }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="answer" label="答案">
            <TextArea rows={6} />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select allowClear>
              <Select.Option value="技术">技术</Select.Option>
              <Select.Option value="HR">HR</Select.Option>
              <Select.Option value="行为">行为</Select.Option>
              <Select.Option value="项目">项目</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="difficulty" label="难度">
            <Select allowClear>
              <Select.Option value="easy">简单</Select.Option>
              <Select.Option value="medium">中等</Select.Option>
              <Select.Option value="hard">困难</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
