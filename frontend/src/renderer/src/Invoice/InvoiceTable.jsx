import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Table, Input, DatePicker, Space, Button, Popconfirm, message, Tag } from 'antd'
import { fetchInvoices, deleteInvoiceById } from '../store/slice/invoiceSlice' // ⬅️ add delete action if you have
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

const { RangePicker } = DatePicker

function InvoiceTable() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { list: invoices,loading  } = useSelector((state) => state.invoices)
  const [filteredData, setFilteredData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [dateRange, setDateRange] = useState(null)

  useEffect(() => {
    dispatch(fetchInvoices())
  }, [dispatch])

  useEffect(() => {
    let data = [...invoices]

    // 🔍 Multi-field filter
    if (searchText) {
      data = data.filter((item) => {
        const customer = item.customer || {}
        const finalAmount = item.computedtotals?.finalAmount?.toString() || ''
        const invoiceNo = item.invoice_no || ''
        return (
          customer.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          customer.phone?.includes(searchText) ||
          invoiceNo.toLowerCase().includes(searchText.toLowerCase()) ||
          finalAmount.includes(searchText)
        )
      })
    }

    // 📅 Date Range Filter
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange
      data = data.filter((item) => {
        const createdAt = moment(item.created_at)
        return createdAt.isBetween(start, end, 'day', '[]')
      })
    }

    setFilteredData(data)
  }, [searchText, dateRange, invoices])

  const handleDelete = (id) => {
    dispatch(deleteInvoiceById(id))
      .then(() => {
        message.success('Invoice deleted')
      })
      .catch(() => {
        message.error('Delete failed')
      })
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: 'Invoice No',
      dataIndex: 'invoice_no',
      key: 'invoice_no'
    },
    {
      title: 'Customer (Name / Phone)',
      key: 'customer',
      render: (record) => {
        const { name, phone } = record.customer || {}
        return (
          <div>
            <div>{name || 'N/A'}</div>
            <div style={{ color: '#999' }}>{phone || '-'}</div>
          </div>
        )
      }
    },
   {
  title: 'Status',
  key: 'status',
  render: (record) => {
    const status = record.computedtotals?.status ?? '-';

    let color = 'default'; // fallback color

    if (status === 'UnPaid') color = 'red';
    else if (status === 'Partially') color = 'blue';
    else if (status === 'Credit-Bill') color = 'green';

    return <Tag color={color}>{status}</Tag>;
  }
}
,
    {
      title: 'Final Amount',
      key: 'finalAmount',
      render: (record) => record.computedtotals?.finalAmount ?? '-'
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => moment(date).format('YYYY-MM-DD')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/editinvoice/${record.id}`)}
          />
          <Popconfirm
            title="Are you sure to delete this invoice?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Search Name / Phone / Invoice / Amount"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          allowEmpty={[true, true]}
        />
        <Button
          onClick={() => {
            setSearchText('')
            setDateRange(null)
          }}
        >
          Clear Filters
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        pagination={{ pageSize: 10 }}
        bordered
        loading={loading}
      />
    </div>
  )
}

export default InvoiceTable
