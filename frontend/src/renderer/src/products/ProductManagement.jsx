import React, { useEffect, useState } from 'react'
import {
  Modal,
  Button,
  Form,
  Input,
  Select,
  Table,
  DatePicker,
  InputNumber,
  Popconfirm,
  Row,
  Col,
  Image
} from 'antd'
import moment from 'moment'
import { fetchCategories } from '../store/slice/categorySlice'
import {
  createProduct,
  updateProduct,
  fetchProducts,
  deleteProduct,
  generateBarCode,
  UpdateSelectedBarcode_with_Print
} from '../store/slice/productSlice'
import { useDispatch, useSelector } from 'react-redux'
import Search from 'antd/es/transfer/search'
import { token } from '../auth'
import { fetchInventory } from '../store/slice/inventorySlice'

const defaultUnits = ['piece', 'dozen', 'kg', 'g', 'liter', 'ml', 'quintal', 'tonne']

const ProductManagement = () => {
  const [products, setProducts] = useState([])
  const { list: inventoryData, loading } = useSelector((state) => state.inventory)
  const dispatch = useDispatch()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form] = Form.useForm()
  const categories = useSelector((state) => state.categories.list)
  const productss = useSelector((state) => state.products.list)
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false)
  const user = token.getUser()

  // ✅ Always treat inventory as array
  const inventoryList = Array.isArray(inventoryData?.data) ? inventoryData.data : []

  const getBarImage = (id) => {
    const timestamp = new Date().getTime()
    return `${import.meta.env.VITE_BACKEND_URL}/barcode/${user.db_name}/image-barcode/${id}?t=${timestamp}`
  }

  const handleSearch = (value) => {
    setSearchText(value.toLowerCase())
  }

  const filteredProducts = productss.filter((product) =>
    product.product_name?.toLowerCase().includes(searchText)
  )

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys)
  }

  useEffect(() => {
    dispatch(fetchCategories())
    dispatch(fetchProducts())
    dispatch(fetchInventory())
  }, [dispatch])

  const openModal = (product = null) => {
    setEditingProduct(product)
    setModalVisible(true)
    if (product) {
      form.setFieldsValue({
        ...product,
        mfg_date: product.mfg_date ? moment(product.mfg_date) : null,
        exp_date: product.exp_date ? moment(product.exp_date) : null,
        item_id: product.inventory_item_id
      })
    } else {
      form.resetFields()
    }
  }

  const closeModal = () => {
    setModalVisible(false)
    setEditingProduct(null)
  }

  const handleDelete = (id) => {
    dispatch(deleteProduct(id))
  }

  // ✅ FIX: correctly find category & unit from inventoryData.data
  const handleFormSubmit = (values) => {
    const selectedItem = inventoryList.find((inv) => inv.id === values.item_id)
    const newProduct = {
      ...values,
      inventory_item_id: selectedItem ? selectedItem.id : null,
      product_name: selectedItem ? selectedItem.item_name : values.product_name || '',
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      ...(values.mfg_date &&
        moment(values.mfg_date).isValid() && {
          mfg_date: moment(values.mfg_date).format('YYYY-MM-DD')
        }),
      ...(values.exp_date &&
        moment(values.exp_date).isValid() && {
          exp_date: moment(values.exp_date).format('YYYY-MM-DD')
        })
    }

    if (editingProduct) {
      dispatch(updateProduct({ id: editingProduct.id, updatedData: newProduct })).unwrap()
    } else {
      dispatch(createProduct(newProduct)).unwrap()
    }
    setModalVisible(false)
  }

  const columns = [
    { title: 'Name', dataIndex: 'product_name', key: 'product_name' },
    {
      title: 'Category',
      dataIndex: 'category_id',
      key: 'category_id',
      render: (id) => categories.find((cat) => cat.id === id)?.category_name || '-'
    },
    { title: 'Unit', dataIndex: 'unit', key: 'unit' },
    { title: 'QTY', dataIndex: 'grams', key: 'grams' },
    { title: 'MRP', dataIndex: 'mrp', key: 'mrp' },
    { title: 'Sale MRP', dataIndex: 'saleMrp', key: 'saleMrp' },
    {
      title: 'Actions',
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => openModal(record)}>
            Edit
          </Button>
          <Popconfirm title="Are you sure to delete?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </>
      )
    }
  ]

  const handleOpenAndGenerateBarcodes = () => {
    dispatch(UpdateSelectedBarcode_with_Print({ barcodeIds: selectedRowKeys }))
    setBarcodeModalVisible(true)
  }

  const selectedUnit = Form.useWatch('unit', form)

  const renderUnitFields = () => {
    switch (selectedUnit) {
      case 'kg':
      case 'liter':
        return (
          <>
            <Form.Item name="kilo" label={selectedUnit === 'liter' ? 'Liters' : 'Kilo'}>
              <InputNumber min={0} step={0.001} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="grams" label={selectedUnit === 'liter' ? 'Milli Liters' : 'Grams'}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )
      case 'g':
      case 'ml':
        return (
          <Form.Item name="grams" label={selectedUnit === 'ml' ? 'Milli Liters' : 'Grams'}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        )
      case 'piece':
      case 'dozen':
        return (
          <Form.Item name="grams" label="Qty" initialValue={1}>
            <InputNumber min={0} style={{ width: '100%' }} readOnly />
          </Form.Item>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-4">
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Button type="primary" onClick={() => openModal()}>
            Add Product
          </Button>
        </Col>

        <Col>
          <Search
            placeholder="Search by product name"
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </Col>
      </Row>

      <Table
        dataSource={filteredProducts}
        columns={columns}
        rowKey="id"
        bordered
        rowSelection={rowSelection}
      />

      {/* 🟢 Modal for Add/Edit Product */}
      <Modal
        open={modalVisible}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="item_id"
                label="Item Name"
                rules={[{ required: true, message: 'Please select item' }]}
              >
                <Select
                  placeholder="Select Item"
                  onChange={(itemId) => {
                    const selectedItem = inventoryList.find((inv) => inv.id === itemId)
                    if (selectedItem) {
                      form.setFieldsValue({
                        product_name: selectedItem.item_name,
                        category_id: selectedItem.category_id,
                        unit: selectedItem.unit
                      })
                    }
                  }}
                  showSearch
                  optionFilterProp="children"
                >
                  {inventoryList.map((item) => (
                    <Select.Option key={item.id} value={item.id}>
                      {item.item_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="category_id"
                label="Category"
                rules={[{ required: true, message: 'Category is required' }]}
              >
                <Select placeholder="Auto-filled from item" disabled>
                  {categories.map((cat) => (
                    <Select.Option key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="unit" label="Unit" rules={[{ required: true }]} initialValue="piece">
                <Select placeholder="Select unit" disabled>
                  {defaultUnits.map((u) => (
                    <Select.Option key={u} value={u}>
                      {u}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* 🧩 Dynamic unit-based fields */}
            {renderUnitFields()}

            <Col span={12}>
              <Form.Item name="mrp" label="MRP" rules={[{ required: true }]}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="saleMrp" label="Sale MRP">
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item>
                <div className="flex justify-end gap-2">
                  <Button onClick={closeModal}>Cancel</Button>
                  <Button type="primary" htmlType="submit">
                    {editingProduct ? 'Update' : 'Create'}
                  </Button>
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 🟣 Barcode Print Modal */}
      <Modal
        open={barcodeModalVisible}
        title="Selected Product Barcodes"
        onCancel={() => setBarcodeModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setBarcodeModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="print"
            type="primary"
            style={{ backgroundColor: 'green', borderColor: 'green' }}
            onClick={() => window.print()}
          >
            Print
          </Button>
        ]}
        width={794}
        bodyStyle={{
          height: 1123,
          overflowY: 'auto',
          padding: 24,
          backgroundColor: '#fff'
        }}
      >
        <Row gutter={[16, 16]}>
          {selectedRowKeys.map((id) => (
            <Col span={8} key={id}>
              <Image
                src={getBarImage(id)}
                alt={`Barcode-${id}`}
                style={{ width: '100%', maxWidth: 200 }}
              />
              <p style={{ textAlign: 'center' }}>{id}</p>
            </Col>
          ))}
        </Row>
      </Modal>
    </div>
  )
}

export default ProductManagement
