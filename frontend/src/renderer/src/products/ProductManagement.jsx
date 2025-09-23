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

const defaultUnits = ['piece', 'dozen', 'kg', 'g', 'liter', 'ml', 'quintal', 'tonne']

const ProductManagement = () => {
  const [products, setProducts] = useState([])
  const dispatch = useDispatch()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form] = Form.useForm()
  const categories = useSelector((state) => state.categories.list)
  const productss = useSelector((state) => state.products.list)
  const [searchText, setSearchText] = useState('')
  // console.log('productss', productss)
  const handleSearch = (value) => {
    setSearchText(value.toLowerCase())
  }
  const user = token.getUser()
  const getBarImage = (id) => {
    const timestamp = new Date().getTime()
    return `${import.meta.env.VITE_BACKEND_URL}/barcode/${user.db_name}/image-barcode/${id}?t=${timestamp}`
  }

  const filteredProducts = productss.filter((product) =>
    product.product_name?.toLowerCase().includes(searchText)
  )
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  // console.log('selectedRowKeys', selectedRowKeys)
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false)

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys)
    }
  }

  useEffect(() => {
    dispatch(fetchCategories())
    dispatch(fetchProducts())
  }, [dispatch])
  const openModal = (product = null) => {
    setEditingProduct(product)
    setModalVisible(true)
    if (product) {
      form.setFieldsValue({
        ...product,
        mfg_date: moment(product.mfg_date),
        exp_date: moment(product.exp_date)
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

  const handleFormSubmit = (values) => {
    const newProduct = {
      ...values,
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
      render: (id) => categories.find((cat) => cat.id === id)?.category_name
    },
    { title: 'Unit', dataIndex: 'unit', key: 'unit' },
    { title: 'Kilo', dataIndex: 'kilo', key: 'kilo' },
    { title: 'Grams', dataIndex: 'grams', key: 'grams' },
    { title: 'MRP', dataIndex: 'mrp', key: 'mrp' },
    { title: 'Sale MRP', dataIndex: 'saleMrp', key: 'saleMrp' },
    {
      title: 'MFG',
      dataIndex: 'mfg_date',
      key: 'mfg_date',
      render: (text) => moment(text).format('DD/MM/YYYY')
    },
    {
      title: 'EXP',
      dataIndex: 'exp_date',
      key: 'exp_date',
      render: (text) => moment(text).format('DD/MM/YYYY')
    },
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

  // Watch selected unit from form
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
      case 'quintal':
      case 'tonne':
        return (
          <Form.Item name="kilo" label="Kilo">
            <InputNumber min={0} step={0.001} style={{ width: '100%' }} />
          </Form.Item>
        )
      case 'piece':
      case 'dozen':
        return (
          <Form.Item name="grams" label="Count">
            <InputNumber min={0} style={{ width: '100%' }} />
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

        <Col>
          <Button
            type="primary"
            onClick={handleOpenAndGenerateBarcodes}
            disabled={selectedRowKeys.length === 0}
            style={{
              backgroundColor: '#FFA500',
              borderColor: '#FFA500',
              color: 'white'
            }}
          >
            Show Selected Barcodes
          </Button>
        </Col>
      </Row>

      <Table
        dataSource={filteredProducts}
        columns={columns}
        rowKey="id"
        bordered
        rowSelection={rowSelection}
      />

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
              <Form.Item name="product_name" label="Product Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="category_id" label="Category" rules={[{ required: true }]}>
                <Select placeholder="Select a category">
                  {categories.map((cat) => (
                    <Select.Option key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
                <Select placeholder="Select unit">
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

            <Col span={12}>
              <Form.Item name="mfg_date" label="Manufacture Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="exp_date" label="Expiry Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24} style={{ display: 'flex' }}>
              {editingProduct?.id && (
                <>
                  <Image
                    src={getBarImage(editingProduct.id)}
                    alt="Barcode"
                    style={{ width: 250, marginBottom: 12 }}
                  />

                  {editingProduct.barcode_status === 'barcode not generated' && (
                    <Button
                      type="primary"
                      onClick={() =>
                        dispatch(generateBarCode(editingProduct.id), setModalVisible(false))
                      }
                      style={{
                        backgroundColor: 'orange',
                        borderColor: 'orange',
                        width: 250
                      }}
                    >
                      Generate Barcode
                    </Button>
                  )}

                  {editingProduct.barcode_status === 'barcode not updated' && (
                    <Button
                      onClick={() =>
                        dispatch(generateBarCode(editingProduct.id), setModalVisible(false))
                      }
                      type="default"
                      style={{
                        backgroundColor: '#ffc107',
                        borderColor: '#ffc107',
                        color: '#000',
                        width: 250
                      }}
                    >
                      Barcode Not Updated
                    </Button>
                  )}

                  {editingProduct.barcode_status === 'barcode updated' && (
                    <Button
                      onClick={() =>
                        dispatch(generateBarCode(editingProduct.id), setModalVisible(false))
                      }
                      type="default"
                      style={{
                        backgroundColor: 'green',
                        borderColor: 'green',
                        color: '#fff',
                        width: 250,
                        marginTop: 125
                      }}
                    >
                      Barcode Updated
                    </Button>
                  )}
                </>
              )}
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
        width={794} // A4 width in pixels
        bodyStyle={{
          height: 1123, // A4 height in pixels
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
