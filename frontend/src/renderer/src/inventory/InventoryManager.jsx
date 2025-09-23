import React, { useEffect, useState } from 'react'
import { Modal, Button, Form, Input, Select, Table, Popconfirm, message, Spin } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchInventory,
  createInventory,
  deleteInventory,
  updateInventory
} from '../store/slice/inventorySlice'

const { Option } = Select
const allowedUnits = ['kg', 'g', 'liter', 'ml', 'quintal', 'tonne', 'milligram', 'dozen', 'piece']

const InventoryManager = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const [formMode, setFormMode] = useState('create') // create, add, reduce
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const dispatch = useDispatch()
  const [searchText, setSearchText] = useState('')
  const { list: inventoryData, loading } = useSelector((state) => state.inventory)
  const filteredData = inventoryData?.filter((item) =>
    item.item_name?.toLowerCase().includes(searchText.toLowerCase())
  )
  useEffect(() => {
    dispatch(fetchInventory())
  }, [dispatch])

  const openModal = (mode, record = null) => {
    setFormMode(mode)
    setEditingItem(record || null)

    const unit = record?.unit || 'kg'
    const [kilo = '', grams = ''] = record?.stock_quantity?.split('.') || []

    form.setFieldsValue({
      item_name: record?.item_name || '',
      category: record?.category || '',
      unit,
      kilo: ['kg', 'liter', 'quintal', 'tonne'].includes(unit)
        ? mode === 'add' || mode === 'reduce'
          ? '0'
          : kilo
        : '',
      grams: ['kg', 'g', 'ml', 'liter', 'dozen', 'piece'].includes(unit)
        ? mode === 'add' || mode === 'reduce'
          ? '0'
          : grams
        : ''
    })

    setModalVisible(true)
  }

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
        await dispatch(createInventory(payload)).unwrap()
      } else if (formMode === 'add') {
        await dispatch(
          updateInventory({ id: editingItem.id, data: payload, action: 'add' })
        ).unwrap()
      } else if (formMode === 'reduce') {
        await dispatch(
          updateInventory({ id: editingItem.id, data: payload, action: 'reduce' })
        ).unwrap()
      }

      form.resetFields()
      setModalVisible(false)
      setEditingItem(null)
    } catch (error) {
      message.error(error?.message || 'Submission failed')
    }
  }

  const columns = [
    { title: 'Item Name', dataIndex: 'item_name', key: 'item_name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Stock', dataIndex: 'stock_quantity', key: 'stock_quantity' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit' },
    {
      title: 'Actions',
      render: (_, record) => (
        <>
          <Button onClick={() => openModal('reduce', record)} type="link">
            Reduce
          </Button>
          <Button onClick={() => openModal('add', record)} type="link">
            Add
          </Button>
          <Popconfirm
            title="Are you sure to delete?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger type="link">
              Delete
            </Button>
          </Popconfirm>
        </>
      )
    }
  ]

  return (
    <div className="p-4">
      <Button type="primary" onClick={() => openModal('create')}>
        Add Inventory Item
      </Button>
      <Input
        placeholder="Search by item name"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ width: 300, marginBottom: 16 }}
      />
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
              : 'Reduce Stock'
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
            <Input readOnly={formMode !== 'create'} />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Category is required' }]}
          >
            <Input readOnly={formMode !== 'create'} />
          </Form.Item>

          <Form.Item
            label="Unit"
            name="unit"
            rules={[{ required: true, message: 'Unit is required' }]}
          >
            <Select disabled={formMode !== 'create'}>
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
                  <Form.Item label="Count" name="grams" initialValue="0">
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
