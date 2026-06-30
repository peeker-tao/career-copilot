import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Space, Tag, Modal, Form, Select,
  message, Popconfirm, Typography, Card,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  KeyOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { userApi } from '../api';
import type { User } from '../types';
import dayjs from 'dayjs';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [resetUserId, setResetUserId] = useState<string>('');
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.list({ page, limit: 20, search });
      const d = res.data?.data || res.data;
      setUsers(Array.isArray(d) ? d : d?.users || d?.items || []);
      setTotal(d?.pagination?.total ?? d?.total ?? 0);
    } catch {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (user: User) => {
    setEditUser(user);
    form.setFieldsValue(user);
    setEditModal(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editUser) {
        await userApi.update(editUser.id, values);
        message.success('更新成功');
      }
      setEditModal(false);
      fetchUsers();
    } catch (err: any) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await userApi.remove(id);
      message.success('删除成功');
      fetchUsers();
    } catch {
      message.error('删除失败');
    }
  };

  const handleResetPassword = async (id: string) => {
    setResetUserId(id);
    passwordForm.resetFields();
    setResetPasswordModal(true);
  };

  const handleConfirmResetPassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      await userApi.resetPassword(resetUserId, values.newPassword);
      message.success('密码已重置');
      setResetPasswordModal(false);
    } catch (err: any) {
      if (err?.message) {
        message.error(err.message);
      } else {
        message.error('重置密码失败');
      }
    }
  };

  const columns = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => v || '-',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : role === 'user' ? '用户' : role}
        </Tag>
      ),
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      render: (v: string) => v || '-',
      width: 100,
    },
    {
      title: '目标岗位',
      dataIndex: 'targetPosition',
      key: 'targetPosition',
      render: (v: string) => v || '-',
      width: 150,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => handleResetPassword(record.id)}>
            重置密码
          </Button>
          <Popconfirm title="确定删除此用户？" onConfirm={() => handleDelete(record.id)}>
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
        <h2>用户管理</h2>
        <Space>
          <Input
            placeholder="搜索邮箱或姓名"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
            刷新
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={users}
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
          locale={{ emptyText: '暂无用户数据' }}
        />
      </Card>

      <Modal
        title="编辑用户"
        open={editModal}
        onOk={handleSave}
        onCancel={() => setEditModal(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select>
              <Select.Option value="user">用户</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="education" label="学历">
            <Select allowClear>
              <Select.Option value="高中">高中</Select.Option>
              <Select.Option value="大专">大专</Select.Option>
              <Select.Option value="本科">本科</Select.Option>
              <Select.Option value="硕士">硕士</Select.Option>
              <Select.Option value="博士">博士</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="targetPosition" label="目标岗位">
            <Input />
          </Form.Item>
          <Form.Item name="targetIndustry" label="目标行业">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="重置用户密码"
        open={resetPasswordModal}
        onOk={handleConfirmResetPassword}
        onCancel={() => setResetPasswordModal(false)}
        okText="确认重置"
        cancelText="取消"
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
              { max: 50, message: '密码最多50个字符' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
