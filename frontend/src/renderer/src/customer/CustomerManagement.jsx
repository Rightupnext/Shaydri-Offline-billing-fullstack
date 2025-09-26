import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileExcelOutlined,   // ✅ NEW
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../store/slice/customerSlice';

// ✅ NEW IMPORTS
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const CustomerManagement = () => {
  const dispatch = useDispatch();
  const { list: customers, loading } = useSelector((state) => state.customers);

  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const filteredCustomers = customers.filter((cust) =>
    cust.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    cust.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    cust.phone?.includes(searchText)
  );

  // ✅ NEW: Export to Excel
  const exportToExcel = () => {
    const exportData = filteredCustomers.map(({ id, name, phone, email, address, gst_number }) => ({
      ID: id,
      Name: name,
      Phone: phone,
      Email: email,
      Address: address,
      "GST Number": gst_number,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "customers.xlsx");
  };

  const showModal = (customer = null) => {
    setEditingCustomer(customer);
    if (customer) {
      form.setFieldsValue(customer);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCustomer(null);
  };

  const handleFinish = (values) => {
    if (editingCustomer) {
      dispatch(updateCustomer({ id: editingCustomer.id, updatedData: values }))
        .unwrap()
        .then(() => {
          setIsModalVisible(false);
          setEditingCustomer(null);
        });
    } else {
      dispatch(createCustomer(values))
        .unwrap()
        .then(() => setIsModalVisible(false));
    }
  };

  const handleDelete = (id) => {
    dispatch(deleteCustomer(id));
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Phone', dataIndex: 'phone' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Address', dataIndex: 'address', ellipsis: true },
    { title: 'GST Number', dataIndex: 'gst_number' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => showModal(record)} />
          <Popconfirm
            title="Are you sure to delete this customer?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by name, phone, or email"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />

        <Space>
          <Button
            icon={<FileExcelOutlined />}
            onClick={exportToExcel}
          >
            Export Excel
          </Button>

          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Add Customer
          </Button>
        </Space>
      </Space>

      <Table
        dataSource={filteredCustomers}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8 }}
      />

      <Modal
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        visible={isModalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText={editingCustomer ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="gst_number" label="GST Number">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerManagement;
