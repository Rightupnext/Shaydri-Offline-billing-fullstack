import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../store/slice/categorySlice';
import {
  Table,
  Form,
  Input,
  InputNumber,
  Button,
  Popconfirm,
  Row,
  Col,
  Typography,
  Space,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { token } from '../auth';

const { Title } = Typography;

const CategoryManager = () => {
  const dispatch = useDispatch();
  const getuser = token.getUser();
  const { list, loading } = useSelector((state) => state.categories);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null); // For tracking edit mode

  useEffect(() => {
    dispatch(fetchCategories(getuser.db_name));
  }, [dispatch]);

  const handleFormSubmit = (values) => {
    if (editingId) {
      dispatch(updateCategory({ id: editingId, updatedData: values }));
    } else {
      dispatch(createCategory(values));
    }
    form.resetFields();
    setEditingId(null);
  };

  const handleDelete = (id) => {
    dispatch(deleteCategory(id));
  };

  const handleEdit = (record) => {
    form.setFieldsValue(record);
    setEditingId(record.id);
  };

  const handleCancelEdit = () => {
    form.resetFields();
    setEditingId(null);
  };

  const columns = [
    {
      title: 'Category Name',
      dataIndex: 'category_name',
      key: 'category_name',
    },
    {
      title: 'CGST (%)',
      dataIndex: 'CGST',
      key: 'CGST',
    },
    {
      title: 'SGST (%)',
      dataIndex: 'SGST',
      key: 'SGST',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleEdit(record)}
            style={{ padding: 0 }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this category?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Category Management</Title>

      {/* Category Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="category_name"
              label="Category Name"
              rules={[{ required: true, message: 'Please enter a category name' }]}
            >
              <Input placeholder="Enter category name" />
            </Form.Item>
          </Col>

          <Col span={4}>
            <Form.Item
              name="CGST"
              label="CGST (%)"
              rules={[{ required: true, message: 'Enter CGST' }]}
            >
              <InputNumber min={0} max={100} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={4}>
            <Form.Item
              name="SGST"
              label="SGST (%)"
              rules={[{ required: true, message: 'Enter SGST' }]}
            >
              <InputNumber min={0} max={100} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={8} style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                {editingId ? 'Update Category' : 'Add Category'}
              </Button>
            </Form.Item>
            {editingId && (
              <Form.Item>
                <Button onClick={handleCancelEdit}>Cancel</Button>
              </Form.Item>
            )}
          </Col>
        </Row>
      </Form>

      {/* Categories Table */}
      <Table
        dataSource={list}
        columns={columns}
        rowKey="id"
        loading={loading}
        bordered
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default CategoryManager;
