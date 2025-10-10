import React, { useEffect, useState, useMemo, useRef } from 'react'
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
  Tooltip,
  Tag
} from 'antd'
import moment from 'moment'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCompanyProfile } from '../store/slice/profileSlice'
import { fetchProducts } from '../store/slice/productSlice'
import { fetchCustomers, createCustomer } from '../store/slice/customerSlice'
import {
  fetchNextInvoiceNumber,
  updateInvoiceById,
  fetchInvoiceById
} from '../store/slice/invoiceSlice'
import { useParams } from 'react-router-dom'
import numberToWords from './numberToWords'
import {
  PrinterOutlined,
  DownloadOutlined,
  WhatsAppOutlined,
  DollarCircleOutlined
} from '@ant-design/icons'
import InvoicePDF from './InvoicePDF'
import Payment from './Payment'
import { PDFViewer, pdf } from '@react-pdf/renderer'
import DownloadA4Invocie from './DownloadA4Invocie'
import WhatsAppUploader from '../whatsapp/WhatsAppPdfSender'
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

const InvoiceEditForm = () => {
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
  // console.log('scannedProduct', scannedProduct)

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
  const { id } = useParams()
  const [open, setOpen] = useState(false)
  const [openWhatsapp, setWhatsappOpen] = useState(false)
  const [SideDrweropen, setSideDrweropenOpen] = useState(false)

  const showDrawer = () => setSideDrweropenOpen(true)
  const closeDrawer = () => setSideDrweropenOpen(false)
  const { profile } = useSelector((state) => state.companyProfile)
  const { list: customers } = useSelector((state) => state.customers)
  const { list: products } = useSelector((state) => state.products)
  const { nextInvoiceNo, selectedInvoice } = useSelector((state) => state.invoices)

  const [discount, setDiscount] = useState(0)
  const [deliveryCharge, setDeliveryCharge] = useState('')
  useEffect(() => {
    if (nextInvoiceNo) {
      form.setFieldsValue({ invoiceNo: nextInvoiceNo })
    }
  }, [nextInvoiceNo])
  const [form] = Form.useForm()
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [items, setItems] = useState([])
  const [selectedDateStr, setSelectedDateStr] = useState(null)
  const [selectedDueDateStr, setSelectedDueDateStr] = useState(null)

  useEffect(() => {
    dispatch(fetchCompanyProfile())
    dispatch(fetchCustomers())
    dispatch(fetchProducts())
    dispatch(fetchNextInvoiceNumber())
  }, [dispatch])
  useEffect(() => {
    if (id) {
      dispatch(fetchInvoiceById(id))
    }
  }, [dispatch, id])
  useEffect(() => {
    if (selectedInvoice) {
      const customerId = selectedInvoice.customer?.id
      setSelectedCustomerId(customerId)

      const computed = selectedInvoice.computedtotals || {}

      const parsedDiscount = parseFloat(computed.discount || 0)
      setDiscount(parsedDiscount)
      setDeliveryCharge(selectedInvoice?.computedtotals?.deliveryCharge)
      form.setFieldsValue({
        invoiceNo: selectedInvoice.invoice_no,
        date: computed.date ? moment(computed.date) : null, // ✅ fixed
        dueDate: computed.dueDate ? moment(computed.dueDate) : null, // ✅ fixed
        discount: parsedDiscount,
        deliveryCharge: computed.deliveryCharge || '',
        totalDeliveryCharge: computed.totalDeliveryCharge || '',
        // totalBoxCharge: computed.totalBoxCharge || '',
        finalAmount: computed.finalAmount || '',
        subtotal: computed.subtotal || '',
        cgst: computed.cgst || '',
        sgst: computed.sgst || '',
        status: computed.status || 'UnPaid'
      })

      const mappedItems =
        selectedInvoice.items?.map((item) => ({
          ...item,
          key: Date.now() + Math.random()
        })) || []

      setItems(mappedItems)
    }
  }, [selectedInvoice])

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
  useEffect(() => {
    if (!id) {
      form.setFieldsValue({
        invoiceNo: nextInvoiceNo,
        // date: moment(),
        dueDate: moment().add(7, 'days')
      })
    }
  }, [form, nextInvoiceNo, id])

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
              handleItemChange(record.key, 'productId', selected.id)
              handleItemChange(record.key, 'description', value)
              handleItemChange(record.key, 'rate', rate)
              handleItemChange(record.key, 'gst', gst)
              handleItemChange(record.key, 'amount', amount.toFixed(2))
              handleItemChange(record.key, 'unit', selected.unit)
              handleItemChange(record.key, 'kilo', selected.kilo)
              handleItemChange(record.key, 'grams', selected.grams)
              handleItemChange(record.key, 'mrp', parseFloat(selected.mrp || 0))
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
      render: (text, record) => (
        <Input
          type="number"
          min={0}
          value={record.rate}
          onChange={(e) => {
            const rate = parseFloat(e.target.value || 0)
            const amount = rate * parseFloat(record.qty || 0)
            handleItemChange(record.key, 'rate', rate)
            handleItemChange(record.key, 'amount', amount.toFixed(2))
          }}
        />
      )
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

  const handleSubmit = (values) => {
    const rawDate = form.getFieldValue('date')
    const rawDueDate = form.getFieldValue('dueDate')

    const dateValue =
      selectedDateStr || (rawDate && moment.isMoment(rawDate) ? rawDate.format('YYYY-MM-DD') : null)
    const dueDateValue =
      selectedDueDateStr ||
      (rawDueDate && moment.isMoment(rawDueDate) ? rawDueDate.format('YYYY-MM-DD') : null)

    const formattedValues = {
      ...values,
      date: dateValue,
      dueDate: dueDateValue
    }

    const invoiceData = {
      invoice_no: formattedValues.invoiceNo,
      customer: selectedCustomer || null,
      items: items.map(({ key, ...rest }) => rest),
      computedtotals: {
        ...totals,
        ...formattedValues,
        deliveryCharge,
        discount
      }
    }

    dispatch(updateInvoiceById({ id, updatedData: invoiceData })).then(() => {
      dispatch(fetchInvoiceById(id))
    })
    // console.log('🧾 Final Payload:', invoiceData)
  }

  const handleOpen = () => {
    setOpen(true)
  }
  const WhatsApphandleOpen = () => {
    setWhatsappOpen(true)
  }
  const invoiceRef = useRef(null)

  const handleDownload = async () => {
    const customerName = selectedInvoice?.customer?.name?.replace(/\s+/g, '_') || 'customer'
    const invoiceNo = selectedInvoice?.invoice_no || 'invoice'
    const fileName = `${invoiceNo}_${customerName}.pdf`

    const logoUrl = `${import.meta.env.VITE_BACKEND_URL}/uploads/${profile?.logo}`

    const getBase64Image = async (imageUrl) => {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }

    const logoBase64 = profile?.logo ? await getBase64Image(logoUrl) : null

    const blob = await pdf(
      <DownloadA4Invocie
        selectedInvoice={selectedInvoice}
        profile={profile}
        logoBase64={logoBase64}
      />
    ).toBlob()

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
  }

  const statusColors = {
    UnPaid: 'red',
    Partially: 'blue',
    'Credit-Bill': 'green'
  }
  const status = selectedInvoice?.computedtotals?.status
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
      extra={
        <div style={{ display: 'flex', gap: '30px' }}>
          <Tooltip title="Send on WhatsApp">
            <Button
              onClick={WhatsApphandleOpen}
              icon={<WhatsAppOutlined style={{ fontSize: '30px' }} />}
              type="text"
              style={{ color: '#fff' }}
            />
          </Tooltip>
          <Tooltip title="Download Invoice">
            <Button
              type="text"
              onClick={handleDownload}
              icon={<DownloadOutlined style={{ fontSize: '30px' }} />}
              style={{ color: '#fff' }}
            />
          </Tooltip>

          <Tooltip title="Payment Collect">
            <Button
              onClick={showDrawer}
              icon={<DollarCircleOutlined style={{ fontSize: '30px' }} />}
              type="text"
              style={{ color: '#fff' }}
            />
          </Tooltip>

          <Tooltip title="Print">
            <Button
              onClick={handleOpen}
              icon={<PrinterOutlined style={{ fontSize: '30px' }} />}
              type="text"
              style={{ color: '#fff' }}
            />
          </Tooltip>
        </div>
      }
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        initialValues={{
          date: moment(), // today's date
          // dueDate: moment().add(7, 'days'), // default due date (e.g., 7 days later)
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
                {profile?.gstNumber?.trim() && (
                  <>
                    <strong>GSTIN:</strong> {profile.gstNumber}
                  </>
                )}
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
            <Form.Item label="Date" name="date">
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                onChange={(date, dateString) => {
                  // console.log('📝 Selected Date string:', dateString)
                  setSelectedDateStr(dateString) // Save string
                }}
              />
            </Form.Item>

            <Form.Item label="Status">
              <Tag
                style={{
                  fontSize: '16px',
                  padding: '6px 12px',
                  height: 'auto',
                  borderRadius: '6px',
                  lineHeight: '20px'
                }}
                color={statusColors[status]}
              >
                {status}
              </Tag>
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
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                onChange={(date, dateString) => {
                  // console.log('📝 Selected Date string:', dateString)
                  setSelectedDueDateStr(dateString) // Save string
                }}
              />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label="Delivery Charge" name="deliveryCharge">
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

            <Form.Item label="Delivery Charge" name="totalDeliveryCharge">
              <Input readOnly />
            </Form.Item>

            <Form.Item label="Discount">
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
              Upadate
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
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={[
          <Button key="download" onClick={handleDownload}>
            Download PDF
          </Button>,
          <Button key="print" type="primary" onClick={() => window.print()}>
            Print
          </Button>
        ]}
        width={900}
        style={{ top: 20 }}
      >
        <div style={{ height: '80vh' }}>
          <PDFViewer width="100%" height="100%">
            <InvoicePDF selectedInvoice={selectedInvoice} profile={profile} />
          </PDFViewer>
        </div>
        <div style={{ display: 'none' }}>
          <div ref={invoiceRef}>
            <InvoicePDF selectedInvoice={selectedInvoice} profile={profile} />
          </div>
        </div>
      </Modal>

      <Modal open={openWhatsapp} onCancel={() => setWhatsappOpen(false)} footer={null}>
        <WhatsAppUploader selectedInvoice={selectedInvoice} profile={profile} />
      </Modal>
      <Payment
        SideDrweropen={SideDrweropen}
        closeDrawer={closeDrawer}
        selectedInvoice={selectedInvoice}
      />
    </Card>
  )
}

export default InvoiceEditForm
