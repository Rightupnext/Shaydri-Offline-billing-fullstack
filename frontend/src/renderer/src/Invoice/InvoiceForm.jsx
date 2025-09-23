import React, { useEffect, useState, useMemo } from 'react'
import {
  Row,
  Col,
  Input,
  DatePicker,
  Select,
  Button,
  Form,
  Typography,
  Divider,
  Table,
  Card,
  Modal,
  Tag
} from 'antd'
import moment from 'moment'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCompanyProfile } from '../store/slice/profileSlice'
import { fetchProducts } from '../store/slice/productSlice'
import { fetchCustomers, createCustomer } from '../store/slice/customerSlice'
import { createInvoice, fetchNextInvoiceNumber } from '../store/slice/invoiceSlice'
import { useNavigate } from 'react-router-dom'
import useWebSocket from '../webSockets/useWebSocket'
import { token } from '../auth'

const { Option } = Select
const { Title } = Typography

// 🔵 Add Customer Modal Component
const AddCustomerModal = ({ isModalOpen, setIsModalOpen }) => {
  const [form] = Form.useForm()
  const dispatch = useDispatch()

  const handleOk = () => {
    form.validateFields().then((values) => {
      dispatch(createCustomer(values)).then(() => {
        dispatch(fetchCustomers())
        setIsModalOpen(false)
        form.resetFields()
      })
    })
  }

  return (
    <Modal
      title="Add New Customer"
      open={isModalOpen}
      onOk={handleOk}
      onCancel={() => setIsModalOpen(false)}
      okText="Save"
    >
      <Form layout="vertical" form={form}>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email">
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Phone">
          <Input />
        </Form.Item>
        <Form.Item name="address" label="Address">
          <Input.TextArea />
        </Form.Item>
        <Form.Item name="gst_number" label="GST Number">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

const InvoiceForm = () => {
  // ✅ Stable values
  const user = token.getUser()
  const dbName = user.db_name
  const deviceId = localStorage.getItem('deviceId')

  // ✅ Only create WebSocket once
  const [wsUrl, setWsUrl] = useState(null)

  useEffect(() => {
    setWsUrl(`wss://${import.meta.env.VITE_SOCKET_URL}/${dbName}/get-scan-product/${deviceId}`)
  }, [])

  const scannedProduct = useWebSocket(wsUrl)
  console.log('scannedProduct', scannedProduct)

  useEffect(() => {
    if (!scannedProduct) return

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.barcode_id === scannedProduct.barcode_id
      )

      const rate = parseFloat(scannedProduct.saleMrp || 0)
      const cgst = parseFloat(scannedProduct.CGST || 0)
      const sgst = parseFloat(scannedProduct.SGST || 0)
      const gst = cgst + sgst

      if (existingIndex !== -1) {
        const updatedItems = [...prevItems]
        const existingItem = updatedItems[existingIndex]
        const newQty = parseFloat(existingItem.qty) + 1
        const newAmount = (newQty * rate).toFixed(2)

        updatedItems[existingIndex] = {
          ...existingItem,
          qty: newQty,
          amount: newAmount,
          unit: scannedProduct.unit,
          kilo: scannedProduct.kilo,
          grams: scannedProduct.grams
        }
        return updatedItems
      } else {
        const newItem = {
          key: Date.now(),
          description: scannedProduct.product_name,
          qty: 1,
          rate,
          gst,
          amount: (1 * rate).toFixed(2),
          barcode_id: scannedProduct.barcode_id
        }
        return [...prevItems, newItem]
      }
    })
  }, [scannedProduct])

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { profile } = useSelector((state) => state.companyProfile)
  const { list: customers } = useSelector((state) => state.customers)
  const { list: products } = useSelector((state) => state.products)
  const { nextInvoiceNo } = useSelector((state) => state.invoices)
  const [discount, setDiscount] = useState(0)
  const [deliveryCharge, setDeliveryCharge] = useState(() => {
    return localStorage.getItem('deliveryCharge') || ''
  })
  useEffect(() => {
    if (nextInvoiceNo) {
      form.setFieldsValue({ invoiceNo: nextInvoiceNo })
    }
  }, [nextInvoiceNo])
  const [form] = Form.useForm()
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [items, setItems] = useState([])
  console.log('items', items)
  useEffect(() => {
    dispatch(fetchCompanyProfile())
    dispatch(fetchCustomers())
    dispatch(fetchProducts())
    dispatch(fetchNextInvoiceNumber())
  }, [dispatch])

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const handleDeliveryChargeChange = (e) => {
    const value = parseFloat(e.target.value || 0)
    setDeliveryCharge(value)
    localStorage.setItem('deliveryCharge', value)
  }

  const handleItemChange = (key, field, value) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)))
  }

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        key: Date.now(),
        description: '',
        qty: '',
        rate: '',
        gst: '',
        amount: ''
      }
    ])
  }

  const removeItem = (key) => {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  const columns = [
    {
      title: 'S.No',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (text, record) => (
        <Select
          showSearch
          placeholder="Select Product"
          value={record.description}
          style={{ width: 230 }}
          onChange={(value) => {
            const selected = products.find((p) => p.product_name === value)
            if (selected) {
              const gst = parseFloat(selected.SGST || 0) + parseFloat(selected.CGST || 0)
              const rate = parseFloat(selected.saleMrp || 0)
              const amount = record.qty * rate
              handleItemChange(record.key, 'description', value)
              handleItemChange(record.key, 'rate', rate)
              handleItemChange(record.key, 'gst', gst)
              handleItemChange(record.key, 'amount', amount.toFixed(2))
              handleItemChange(record.key, 'unit', selected.unit)
              handleItemChange(record.key, 'kilo', selected.kilo)
              handleItemChange(record.key, 'grams', selected.grams)
            }
          }}
        >
          {products.map((p) => (
            <Option key={p.id} value={p.product_name}>
              {p.product_name}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      render: (text, record) => (
        <Input
          type="number"
          min={0}
          value={record.qty}
          onChange={(e) => {
            const qty = parseFloat(e.target.value || 0)
            const amount = qty * parseFloat(record.rate || 0)
            handleItemChange(record.key, 'qty', qty)
            handleItemChange(record.key, 'amount', amount.toFixed(2))
          }}
        />
      )
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      render: (text, record) => <Input value={record.rate} readOnly />
    },
    {
      title: 'GST %',
      dataIndex: 'gst',
      render: (text, record) => <Input value={record.gst} readOnly />
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      render: (text, record) => <Input value={record.amount} readOnly />
    },
    {
      title: 'Action',
      render: (_, record) => (
        <Button danger onClick={() => removeItem(record.key)}>
          Delete
        </Button>
      )
    }
  ]

  const totals = useMemo(() => {
    let subtotal = 0
    let totalCGST = 0
    let totalSGST = 0

    const deliveryChargeVal = parseFloat(deliveryCharge || 0)
    const discountVal = parseFloat(discount || 0)

    items.forEach((item) => {
      const amount = parseFloat(item.amount || 0)
      const gst = parseFloat(item.gst || 0)

      subtotal += amount

      const gstAmount = (amount * gst) / 100
      const halfGst = gstAmount / 2

      totalCGST += halfGst
      totalSGST += halfGst
    })

    const gstTotal = totalCGST + totalSGST
    const netPayable = subtotal + gstTotal
    const finalAmount = netPayable + deliveryChargeVal - discountVal

    return {
      subtotal: subtotal.toFixed(2),
      cgst: totalCGST.toFixed(2),
      sgst: totalSGST.toFixed(2),
      gstTotal: gstTotal.toFixed(2),
      totalDeliveryCharge: deliveryChargeVal.toFixed(2),
      netPayable: Math.round(netPayable),
      discount: discountVal.toFixed(2),
      finalAmount: Math.round(finalAmount)
    }
  }, [items, discount, deliveryCharge])

  const gstBreakdown = useMemo(() => {
    const cgstMap = {}
    const sgstMap = {}

    items.forEach((item) => {
      const amount = parseFloat(item.amount || 0)
      const gst = parseFloat(item.gst || 0)
      if (!gst || !amount) return

      const cgstPercent = (gst / 2).toFixed(1)
      const sgstPercent = (gst / 2).toFixed(1)

      const cgstAmount = (amount * gst) / 100 / 2
      const sgstAmount = (amount * gst) / 100 / 2

      if (!cgstMap[cgstPercent]) cgstMap[cgstPercent] = 0
      cgstMap[cgstPercent] += cgstAmount

      if (!sgstMap[sgstPercent]) sgstMap[sgstPercent] = 0
      sgstMap[sgstPercent] += sgstAmount
    })

    const formatWithTotal = (map, label) => {
      const percentages = Object.keys(map).sort((a, b) => parseFloat(a) - parseFloat(b))
      const values = percentages.map((percent) => map[percent].toFixed(1))
      const total = Object.values(map).reduce((acc, val) => acc + val, 0)
      return `${percentages.join('% + ')} % : ${values.join(' + ')} = ${total.toFixed(1)}`
    }

    return {
      cgst: formatWithTotal(cgstMap),
      sgst: formatWithTotal(sgstMap)
    }
  }, [items])
  useEffect(() => {
    form.setFieldsValue({
      finalAmount: totals.finalAmount,
      subtotal: totals.subtotal,
      cgst: gstBreakdown.cgst,
      sgst: gstBreakdown.sgst,
      totalDeliveryCharge: totals.totalDeliveryCharge
    })
  }, [totals, gstBreakdown])
  useEffect(() => {
    // Set default values on mount
    form.setFieldsValue({
      invoiceNo: nextInvoiceNo,
      date: moment(),
      dueDate: moment().add(7, 'days')
    })
  }, [form])

  const handleSubmit = async (values) => {
    const formattedValues = {
      ...values,
      date: values.date ? moment(values.date).toISOString() : null,
      dueDate: values.dueDate ? moment(values.dueDate).toISOString() : null
    }

    const invoiceData = {
      invoice_no: formattedValues.invoiceNo,
      customer: selectedCustomer || null,
      items: items.map(({ key, ...rest }) => rest),
      computedtotals: {
        ...totals,
        ...formattedValues,
        deliveryCharge: Number(deliveryCharge),
        discount
      }
    }

    const proceedToDispatch = async () => {
      try {
        const resultAction = await dispatch(createInvoice(invoiceData))

        if (createInvoice.fulfilled.match(resultAction)) {
          // await fetch(`http://localhost:5001/${dbName}/${deviceId}/reset-scanned-product`, {
          //   method: 'POST'
          // })
          const newId = resultAction.payload.id
          navigate(`/editinvoice/${newId}`)
        } else {
          console.error('❌ Invoice creation failed', resultAction.error)
        }
      } catch (error) {
        console.error('❌ Unexpected error during invoice creation:', error)
      }
    }

    // ✅ Check for 0/empty delivery & box charge
    if (Number(deliveryCharge) === 0 ) {
      Modal.confirm({
        title: 'Delivery Charge  are 0',
        content: 'Are you sure you want to continue without setting any charges?',
        okText: 'Proceed Anyway',
        cancelText: 'Cancel',
        onOk: proceedToDispatch
      })
      return
    }

    // ✅ Normal dispatch if values are valid
    await proceedToDispatch()
  }
  function numberToWords(num) {
    const a = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen'
    ]
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    const numToWords = (n) => {
      if (n < 20) return a[n]
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '')
      if (n < 1000)
        return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + numToWords(n % 100) : '')
      if (n < 100000)
        return (
          numToWords(Math.floor(n / 1000)) +
          ' Thousand' +
          (n % 1000 ? ' ' + numToWords(n % 1000) : '')
        )
      if (n < 10000000)
        return (
          numToWords(Math.floor(n / 100000)) +
          ' Lakh' +
          (n % 100000 ? ' ' + numToWords(n % 100000) : '')
        )
      return (
        numToWords(Math.floor(n / 10000000)) +
        ' Crore' +
        (n % 10000000 ? ' ' + numToWords(n % 10000000) : '')
      )
    }

    if (isNaN(num)) return 'Invalid number'

    const [rupeesStr, paiseStr] = Number(num).toFixed(2).split('.')
    const rupees = parseInt(rupeesStr)
    const paise = parseInt(paiseStr)

    let words = ''
    if (rupees > 0) words += numToWords(rupees) + ' Rupees'
    if (paise > 0) words += (words ? ' and ' : '') + numToWords(paise) + ' Paise'
    if (!words) words = 'Zero Rupees'
    return words + ' Only'
  }
  const bakendUrl = import.meta.env.VITE_BACKEND_URL
  return (
    <Card
      styles={{
        header: { backgroundColor: '#1677ff' },
        body: { padding: '16px' }
      }}
      title={
        <Title style={{ color: '#fff', margin: 0 }} level={3}>
          Invoice
        </Title>
      }
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        initialValues={{
          date: moment(), // today's date
          dueDate: moment().add(7, 'days'), // default due date (e.g., 7 days later)
          invoiceNo: nextInvoiceNo
        }}
      >
        <Row gutter={16} justify="space-between">
          <Col span={12}>
            <Card>
              <img
                src={`${bakendUrl}/uploads/${profile?.logo}`}
                alt="Logo"
                style={{ height: 50 }}
              />
              <Title level={4}>{profile?.company_name}</Title>
              <div>{profile?.slogan}</div>
              <div>
                <strong>GSTIN:</strong> {profile?.gstNumber}
              </div>
              <div>
                <strong>Phone:</strong> +91 {profile?.phone}
              </div>
              <div>
                <strong>Address:</strong> {profile?.address}
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Form.Item label="Invoice No" name="invoiceNo">
              <Input readOnly />
            </Form.Item>
            <Form.Item label="Date" name="date" initialValue={moment()}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Status" name="status" initialValue="UnPaid">
              <Select defaultValue="UnPaid">
                <Option value="UnPaid">UnPaid</Option>
                {/* <Option value="Partiallly">Partially</Option>
                <Option value="Credit-Bill">Credit Bill</Option> */}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Customer Info</Divider>
        <Row gutter={16}>
          <Col span={12}>
            {!selectedCustomer ? (
              <>
                <Form.Item label="Search & Select Customer" name="customerId">
                  <Select
                    placeholder="Select Customer"
                    showSearch
                    onChange={(value) => setSelectedCustomerId(value)}
                    style={{ width: '100%' }}
                    optionFilterProp="children"
                  >
                    {customers.map((cust) => (
                      <Option key={cust.id} value={cust.id}>
                        {cust.name} - {cust.phone}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Button type="primary" onClick={() => setIsModalOpen(true)}>
                  + Add Customer
                </Button>
              </>
            ) : (
              <Card
                type="inner"
                title="Customer Details"
                bordered
                style={{ backgroundColor: '#e6f7ff' }}
              >
                <p>
                  <strong>Name:</strong> {selectedCustomer.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedCustomer.email}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedCustomer.phone}
                </p>
                <p>
                  <strong>GSTIN:</strong> {selectedCustomer.gst_number}
                </p>
                <p>
                  <strong>Address:</strong> {selectedCustomer.address}
                </p>
                <Button onClick={() => setSelectedCustomerId(null)} style={{ marginTop: 8 }}>
                  Change Customer
                </Button>
              </Card>
            )}
          </Col>

          <Col span={6}>
            <Form.Item label="Due Date" name="dueDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label="Delivery Charge">
              <Input min={0} value={deliveryCharge} onChange={handleDeliveryChargeChange} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Item Details</Divider>

        <Table
          dataSource={items}
          columns={columns}
          pagination={false}
          rowKey="key"
          bordered
          style={{ marginBottom: 16 }}
        />
        <Button
          type="dashed"
          onClick={addItem}
          style={{ marginBottom: 24, backgroundColor: 'orange', color: 'white' }}
        >
          + Add Item
        </Button>

        <Divider orientation="left">Summary</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item>
              <Title level={2}>{numberToWords(totals.finalAmount)}</Title>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Subtotal" name="subtotal">
              <Input value={totals.subtotal} readOnly />
            </Form.Item>

            <Form.Item label="CGST" name="cgst">
              <Input readOnly />
            </Form.Item>

            <Form.Item label="SGST" name="sgst">
              <Input readOnly />
            </Form.Item>

            <Form.Item label="Delivery Charge (Summary)" name="totalDeliveryCharge">
              <Input readOnly />
            </Form.Item>

            <Form.Item label="Discount" name="discount">
              <Input
                min={0}
                type="number"
                value={discount}
                onChange={(e) => {
                  setDiscount(e.target.value)
                  form.setFieldsValue({ discount: e.target.value })
                }}
              />
            </Form.Item>

            <Form.Item label="Final Amount" name="finalAmount">
              <Input value={totals.finalAmount} readOnly />
            </Form.Item>

            <Button
              htmlType="submit"
              style={{ padding: '25px 50px', textAlign: 'center', fontSize: 20 }}
              type="primary"
            >
              Save
            </Button>
          </Col>
        </Row>

        <Divider />
        <Row justify="space-between">
          <Col>
            <strong>Receiver's Signature</strong>
          </Col>
          <Col>
            <strong>Authorized Signature</strong>
          </Col>
        </Row>
      </Form>

      {/* 🔵 Modal */}
      <AddCustomerModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </Card>
  )
}

export default InvoiceForm
