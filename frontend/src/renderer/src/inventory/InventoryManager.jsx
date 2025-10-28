import React, { useEffect, useState } from 'react'
import { Modal, Button, Form, Input, Select, Table, Popconfirm, message, Spin, Space, DatePicker } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchInventory,
  createInventory,
  deleteInventory,
  updateInventory
} from '../store/slice/inventorySlice'
import { fetchCategories } from '../store/slice/categorySlice'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import dayjs from 'dayjs'
const { Option } = Select
const { RangePicker } = DatePicker
const allowedUnits = ['piece', 'kg', 'g', 'liter', 'ml', 'quintal', 'tonne', 'milligram', 'dozen',]
const InventoryManager = () => {
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ])
  const [modalVisible, setModalVisible] = useState(false)
  const categories = useSelector((state) => state.categories.list)
  const [formMode, setFormMode] = useState('create') // create, add, reduce
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const dispatch = useDispatch()
  const [searchText, setSearchText] = useState('')
  const { list: inventoryData, loading } = useSelector((state) => state.inventory)
  const filteredData = inventoryData?.data?.filter((item) =>
    item.item_name?.toLowerCase().includes(searchText.toLowerCase())
  )
  useEffect(() => {
    dispatch(fetchCategories());
    handleFetchInventory(); // ✅ Load data on first render + on date change
  }, [dispatch, dateRange]); // ✅ Re-run when dateRange changes

  const handleFetchInventory = () => {
    const [start, end] = dateRange;
    dispatch(
      fetchInventory({
        start_date: start.format('YYYY-MM-DD'),
        end_date: end.format('YYYY-MM-DD')
      })
    );
  };


  const openModal = (mode, record = null) => {
    setFormMode(mode);
    setEditingItem(record || null);

    const unit = record?.unit || 'piece';
    const [kilo = '', grams = ''] = record?.stock_quantity?.split('.') || [];

    form.setFieldsValue({
      item_name: record?.item_name || '',
      category_id: record?.category_id || '',
      unit,
      kilo: ['kg', 'liter', 'quintal', 'tonne'].includes(unit)
        ? mode === 'add' || mode === 'reduce'
          ? '0'
          : kilo
        : '',
      grams: ['piece', 'kg', 'g', 'ml', 'liter', 'dozen'].includes(unit)
        ? mode === 'add' || mode === 'reduce'
          ? '0'
          : grams
        : ''
    });

    setModalVisible(true);
  };


  const handleDelete = async (id) => {
    try {
      await dispatch(deleteInventory(id)).unwrap()
      message.success('Item deleted successfully')
    } catch (err) {
      message.error(err?.message || 'Failed to delete item')
    }
  }

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields()
      const stock_quantity =
        values.kilo && values.grams
          ? `${values.kilo}.${values.grams}`
          : values.kilo || values.grams || '0'

      const payload = {
        ...values,
        stock_quantity
      }

      if (formMode === 'create') {
        await dispatch(createInventory(payload)).unwrap();
      } else if (formMode === 'add') {
        await dispatch(updateInventory({ id: editingItem.id, data: payload, action: 'add' })).unwrap();
      } else if (formMode === 'reduce') {
        await dispatch(updateInventory({ id: editingItem.id, data: payload, action: 'reduce' })).unwrap();
      } else if (formMode === 'edit') {
        await dispatch(updateInventory({ id: editingItem.id, data: payload })).unwrap(); // no action
      }


      form.resetFields()
      setModalVisible(false)
      setEditingItem(null)
    } catch (error) {
      message.error(error?.message || 'Submission failed')
    }
  }

  const columns = [
    { title: 'Product Name', dataIndex: 'item_name', key: 'item_name' },
    { title: 'Category', dataIndex: 'category_name', key: 'category_name' },
    {
      title: 'Stock',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      render: (value) => {
        if (!value) return '0'
        // Remove trailing zeros and unnecessary decimal part
        const num = parseFloat(value)
        return Number.isInteger(num) ? num : num.toFixed(3).replace(/\.?0+$/, '')
      }
    },
    { title: 'Unit', dataIndex: 'unit', key: 'unit' },
    { title: 'Total Sold Qty', dataIndex: 'total_sold_qty', key: 'total_sold_qty' },
    { title: 'Total Mrp Amount', dataIndex: 'total_mrp_amount', key: 'total_mrp_amount' },
    { title: 'Total Sales Amount', dataIndex: 'total_sales_amount', key: 'total_sales_amount' },
    { title: 'Profit Amount', dataIndex: 'profit_amount', key: 'profit_amount' },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openModal('reduce', record)}>
            Reduce
          </Button>
          <Button size="small" onClick={() => openModal('add', record)}>
            Add
          </Button>
          <Button size="small" onClick={() => openModal('edit', record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }

  ]
  const exportToExcel = () => {
    if (!inventoryData || inventoryData.length === 0) {
      message.warning('No data available to export')
      return
    }

    const dataToExport = inventoryData.map((item, index) => ({
      'S.No': index + 1,
      'Item Name': item.item_name,
      'Category': item.category_name,
      'Stock Quantity': item.stock_quantity,
      'Unit': item.unit,
      'Total Sold Qty': item.total_sold_qty,
      'Total Sales Amount': item.total_sales_amount,
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' })

    saveAs(dataBlob, `Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }


  return (
    <div className="p-4">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Button type="primary" onClick={() => openModal('create')}>
          Add Inventory Item
        </Button>

        <Input
          placeholder="Search by item name"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates) {
              setDateRange(dates);
              // ✅ Optional: trigger fetch immediately on date selection
              const [start, end] = dates;
              dispatch(
                fetchInventory({
                  start_date: start.format('YYYY-MM-DD'),
                  end_date: end.format('YYYY-MM-DD')
                })
              );
            }
          }}
          style={{ width: 260 }}
        />

        <Button onClick={exportToExcel}>
          Export to Excel
        </Button>
      </div>

      {loading ? (
        <div className="text-center my-8">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          className="mt-4"
          pagination={{ pageSize: 10 }}
        />
      )}

      <Modal
        title={
          formMode === 'create'
            ? 'Add Inventory'
            : formMode === 'add'
              ? 'Add Stock'
              : formMode === 'reduce'
                ? 'Reduce Stock'
                : 'Edit Inventory'
        }

        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingItem(null)
          form.resetFields()
        }}
        onOk={handleFormSubmit}
        okText="Submit"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Item Name"
            name="item_name"
            rules={[{ required: true, message: 'Item name is required' }]}
          >
            <Input readOnly={formMode === 'add' || formMode === 'reduce'} />
          </Form.Item>

          <Form.Item name="category_id" label="Category" rules={[{ required: true }]}>
            <Select placeholder="Select a category">
              {categories.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.category_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Unit"
            name="unit"
            initialValue="piece"
            rules={[{ required: true, message: 'Unit is required' }]}
          >
            <Select disabled>
              {allowedUnits.map((unit) => (
                <Option key={unit} value={unit}>
                  {unit}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.unit !== curr.unit}>
            {({ getFieldValue }) => {
              const unit = getFieldValue('unit')
              const labelText =
                formMode === 'add'
                  ? 'Add Stock'
                  : formMode === 'reduce'
                    ? 'Reduce Stock'
                    : unit === 'kg' || unit === 'liter'
                      ? 'Kilo / Grams'
                      : 'Stock Quantity'
              if (unit === 'kg' || unit === 'liter') {
                return (
                  <>
                    <Form.Item label="Kilo" name="kilo" initialValue="0">
                      <Input type="number" step="0.001" />
                    </Form.Item>
                    <Form.Item label="Grams" name="grams" initialValue="0">
                      <Input type="number" step="1" />
                    </Form.Item>
                  </>
                )
              }
              if (unit === 'g' || unit === 'ml') {
                return (
                  <Form.Item label="Grams" name="grams" initialValue="0">
                    <Input type="number" step="1" />
                  </Form.Item>
                )
              }
              if (unit === 'quintal' || unit === 'tonne') {
                return (
                  <Form.Item label="Kilo" name="kilo" initialValue="0">
                    <Input type="number" step="0.001" />
                  </Form.Item>
                )
              }
              if (unit === 'dozen' || unit === 'piece') {
                return (
                  <Form.Item label={labelText} name="grams" initialValue="0">
                    <Input type="number" step="1" />
                  </Form.Item>
                )
              }
              return null
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default InventoryManager
