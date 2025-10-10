import React, { useEffect, useMemo, useState } from 'react'
import { Card, Col, Row, Typography, DatePicker, Button, Tag, Progress, Table } from 'antd'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useDispatch, useSelector } from 'react-redux'
import { fetchInvoiceAnalytics } from '../store/slice/invoiceSlice'
import moment from 'moment'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import SalesMRPDashboard from './SalesMRPDashboard'

const { RangePicker } = DatePicker
const { Title, Text } = Typography

const cardColorMap = {
  'Total Amount': '#52c41a', // light green
  'Pending Amount': '#ff4d4f', // red
  'Credit Amount': '#ffc107', // amber
  'Credit Invoices': '#ffc107', // amber
  'Unpaid Invoices': '#ff4d4f', // red
  'Partially Paid': '#1890ff', // blue
  'Total Invoices': '#52c41a', // green
  'Total Customers': '#9254de' // violet
}
const pieColors = ['#52c41a', '#ff4d4f', '#ffc107']; // Adjust colors if needed

const getChange = (current, previous) => {
  if (previous === null || previous === undefined || previous === 0) {
    return current ? 'new' : 0
  }
  const change = ((current - previous) / previous) * 100
  return isNaN(change) || !isFinite(change) ? 0 : parseFloat(change.toFixed(2))
}

const StatCard = ({ title, value, percent, change, range }) => {
  const isNew = change === 'new'
  const progressColor = cardColorMap[title] || 'blue'

  return (
    <Card style={{ height: '100%' }}>
      <Row justify="space-between" align="middle" wrap={false}>
        <Col flex="auto">
          <Title level={4} style={{ margin: 0 }}>
            {value}
          </Title>
          <Text type="secondary">{title}</Text>
          <div style={{ marginTop: 8 }}>
            {change === 'new' ? (
              <Tag color="blue" style={{ fontSize: 12 }}>
                New
              </Tag>
            ) : (
              <Tag color={change >= 0 ? 'green' : 'red'} style={{ fontSize: 12 }}>
                {change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(change)}%
              </Tag>
            )}

            <span style={{ fontSize: 12, marginLeft: 6, color: '#888' }}>
              {range[0] && range[1]
                ? `From ${range[0].format('DD MMM')} to ${range[1].format('DD MMM')}`
                : 'Current Month'}
            </span>
          </div>
        </Col>
        <Col>
          <Progress
            type="circle"
            percent={percent}
            width={80}
            strokeWidth={13}
            strokeColor={cardColorMap[title] || 'blue'}
            format={() => ''}
          />
        </Col>
      </Row>
    </Card>
  )
}

const DashboardAnalytics = () => {
  const dispatch = useDispatch()
  const analytics = useSelector((state) => state.invoices.analytics)
  const [range, setRange] = useState([null, null])

  useEffect(() => {
    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD')
    const endOfMonth = moment().endOf('month').format('YYYY-MM-DD')
    dispatch(fetchInvoiceAnalytics({ startDate: startOfMonth, endDate: endOfMonth }))
  }, [dispatch])

  const handleSearch = () => {
    if (range[0] && range[1]) {
      dispatch(
        fetchInvoiceAnalytics({
          startDate: range[0].format('YYYY-MM-DD'),
          endDate: range[1].format('YYYY-MM-DD')
        })
      )
    }
  }

  const handleClear = () => {
    const start = moment().startOf('month').format('YYYY-MM-DD')
    const end = moment().endOf('month').format('YYYY-MM-DD')
    setRange([null, null])
    dispatch(fetchInvoiceAnalytics({ startDate: start, endDate: end }))
  }

  const totalAmount = analytics?.totalFinalAmount || 1
  const totalInvoices = analytics?.totalInvoices || 1

  const statCards = [
    {
      title: 'Total Amount',
      value: analytics?.totalFinalAmount || 0,
      percent: 100,
      change: getChange(analytics?.totalFinalAmount, analytics?.previousFinalAmount)
    },
    {
      title: 'Pending Amount',
      value: analytics?.totalBalanceAmount || 0,
      percent: Math.round(((analytics?.totalBalanceAmount || 0) / totalAmount) * 100),
      change: getChange(analytics?.totalBalanceAmount, analytics?.previousBalanceAmount)
    },
    {
      title: 'Credit Amount',
      value: analytics?.totalCreditBillAmount || 0,
      percent: Math.round(((analytics?.totalCreditBillAmount || 0) / totalAmount) * 100),
      change: getChange(analytics?.totalCreditBillAmount, analytics?.previousCreditBillAmount)
    },
    {
      title: 'Credit Invoices',
      value: analytics?.statusCounts?.CreditBill || 0,
      percent: Math.round(((analytics?.statusCounts?.CreditBill || 0) / totalInvoices) * 100),
      change: getChange(
        analytics?.statusCounts?.CreditBill,
        analytics?.previousStatusCounts?.CreditBill
      )
    },
    {
      title: 'Unpaid Invoices',
      value: analytics?.statusCounts?.UnPaid || 0,
      percent: Math.round(((analytics?.statusCounts?.UnPaid || 0) / totalInvoices) * 100),
      change: getChange(analytics?.statusCounts?.UnPaid, analytics?.previousStatusCounts?.UnPaid)
    },
    {
      title: 'Partially Paid',
      value: analytics?.statusCounts?.Partially || 0,
      percent: Math.round(((analytics?.statusCounts?.Partially || 0) / totalInvoices) * 100),
      change: getChange(
        analytics?.statusCounts?.Partially,
        analytics?.previousStatusCounts?.Partially
      )
    },
    {
      title: 'Total Invoices',
      value: analytics?.totalInvoices || 0,
      percent: 100,
      change: getChange(analytics?.totalInvoices, analytics?.previousTotalInvoices)
    },
    {
      title: 'Total Customers',
      value: analytics?.customerCount || 0,
      percent: 100,
      change: getChange(analytics?.customerCount, analytics?.previousCustomerCount)
    }
  ]

  const lineData = useMemo(() => {
    const dateMap = {}
    analytics?.mergedPaymentHistory?.forEach(({ date, amount }) => {
      const key = moment(date).format('MMM D')
      dateMap[key] = (dateMap[key] || 0) + amount
    })
    return Object.entries(dateMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => moment(a.date, 'MMM D').toDate() - moment(b.date, 'MMM D').toDate())
  }, [analytics])
  const lineConfig = {
    data: lineData,
    xField: 'date',
    yField: 'amount',
    height: 200,
    point: { size: 4 },
    lineStyle: { lineWidth: 3 },
    smooth: true,
    autoFit: true
  }
  const pieData = [
    { type: 'Total Amount', value: analytics?.totalFinalAmount || 0 },
    { type: 'Pending Amount', value: analytics?.totalBalanceAmount || 0 },
    { type: 'Credit Amount', value: analytics?.totalCreditBillAmount || 0 }
  ]




  const pieConfig = {
    data: pieData,
    dataKey: 'value',
    nameKey: 'type',
    cx: '50%',
    cy: '50%',
    innerRadius: 60,
    outerRadius: 100,
    paddingAngle: 4,
    label: ({ percent }) => `${(percent * 100).toFixed(1)}%`,
    colors: pieColors,
    legend: { verticalAlign: 'bottom', height: 36 }
  }

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <RangePicker value={range} onChange={(dates) => setRange(dates)} />
        </Col>
        <Col>
          <Button type="primary" onClick={handleSearch}>
            Search
          </Button>
        </Col>
        <Col>
          <Button onClick={handleClear}>Clear Filter</Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {statCards.map((card, idx) => (
          <Col key={idx} xs={24} sm={12} md={8} lg={6}>
            <StatCard {...card} range={range} />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Credit Payments">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineConfig.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={lineConfig.xField} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type={lineConfig.smooth ? 'monotone' : 'linear'}
                  dataKey={lineConfig.yField}
                  stroke={lineConfig.lineStyle.stroke}
                  strokeWidth={lineConfig.lineStyle.strokeWidth}
                  dot={{ r: lineConfig.point.size }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Amount Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieConfig.data}
                  dataKey={pieConfig.dataKey}
                  nameKey={pieConfig.nameKey}
                  cx={pieConfig.cx}
                  cy={pieConfig.cy}
                  innerRadius={pieConfig.innerRadius}
                  outerRadius={pieConfig.outerRadius}
                  paddingAngle={pieConfig.paddingAngle}
                  label={pieConfig.label}
                >
                  {pieConfig.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieConfig.colors[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend {...pieConfig.legend} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      <SalesMRPDashboard analytics={analytics} />
    </div>
  )
}

export default DashboardAnalytics
