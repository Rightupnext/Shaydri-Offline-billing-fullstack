import React, { useState } from 'react'
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
import { Table, Tag } from 'antd'
const SalesMRPDashboard = ({ analytics }) => {
  const salesReport = analytics?.salesReport || []
  // Get profitPercent from the first month
  const profitPercent = salesReport.length > 0 ? Number(salesReport[0].profitPercent) : 0
  const pieData = [
    { name: 'Sales Profit', value: profitPercent },
    { name: 'Purchase MRP', value: 100 - profitPercent }
  ]

  const COLORS = ['#10b981', '#f59e0b']

  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (text, record) => `${record.year} - ${record.month}`
    },
    {
      title: 'Purchase MRP',
      dataIndex: 'Buymrp', // <-- match API key
      key: 'Buymrp',
      align: 'right',
      render: (value) => (value ? `₹${value.toLocaleString()}` : '-')
    },
    {
      title: 'Selling Amount',
      dataIndex: 'SellingRate',
      key: 'SellingRate',
      align: 'right',
      render: (value) => (value ? `₹${value.toLocaleString()}` : '-')
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      align: 'right',
      render: (value) => (value ? `₹${value.toLocaleString()}` : '-')
    },
    {
      title: 'Profit %',
      dataIndex: 'profitPercent',
      key: 'profitPercent',
      align: 'right',
      render: (value) => (value ? `${value}%` : '-')
    }
  ]

  const formatCurrency = (value) => `₹${(value / 1000).toFixed(0)}K`

  const styles = {
    container: {
      minHeight: '100vh',

      padding: '32px'
    },
    maxWidth: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#1e293b',
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#64748b'
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
    },
    metricCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      padding: '24px',
      borderLeft: '4px solid'
    },
    metricTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#64748b',
      marginBottom: '8px'
    },
    metricValue: {
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#1e293b'
    },
    metricSubtext: {
      fontSize: '14px',
      marginTop: '8px'
    },
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px'
    },
    chartCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      padding: '24px'
    },
    chartCardLarge: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      padding: '24px',
      gridColumn: 'span 2'
    },
    chartTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1e293b',
      marginBottom: '16px'
    },
    tableCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      padding: '24px',
      marginTop: '24px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    tableHeader: {
      borderBottom: '2px solid #e2e8f0',
      padding: '12px 16px',
      fontWeight: '600',
      color: '#475569',
      textAlign: 'left'
    },
    tableHeaderRight: {
      borderBottom: '2px solid #e2e8f0',
      padding: '12px 16px',
      fontWeight: '600',
      color: '#475569',
      textAlign: 'right'
    },
    tableCell: {
      padding: '12px 16px',
      borderBottom: '1px solid #f1f5f9',
      color: '#1e293b',
      fontWeight: '500'
    },
    tableCellRight: {
      padding: '12px 16px',
      borderBottom: '1px solid #f1f5f9',
      textAlign: 'right',
      color: '#64748b'
    },
    tableRow: {
      transition: 'background-color 0.2s',
      cursor: 'pointer'
    },
    badge: {
      display: 'inline-block',
      backgroundColor: '#fef3c7',
      color: '#92400e',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500'
    },
    tooltipCard: {
      backgroundColor: 'white',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      border: '1px solid #e2e8f0'
    },
    tooltipTitle: {
      fontWeight: '600',
      color: '#1e293b'
    },
    tooltipText: {
      fontSize: '13px'
    }
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={styles.tooltipCard}>
          <p style={styles.tooltipTitle}>{payload[0].payload.month}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ ...styles.tooltipText, color: entry.color }}>
              {entry.name}: ₹{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = pieData.reduce((sum, entry) => sum + entry.value, 0)
      return (
        <div style={styles.tooltipCard}>
          <p style={styles.tooltipTitle}>{payload[0].name}</p>
          <p style={{ ...styles.tooltipText, color: '#64748b' }}>
            ₹{payload[0].value.toLocaleString()}
          </p>
          <p style={{ ...styles.tooltipText, color: '#64748b' }}>
            {((payload[0].value / total) * 100).toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }
  // Prepare chart data from analytics.salesReport
  const salesChartData = (analytics?.salesReport || []).map(item => ({
    month: item.month,
    mrp: Number(item.Buymrp || 0),       // Buy MRP
    sales: Number(item.SellingRate || 0) // Selling Rate
  }))

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        <div style={styles.chartsGrid}>
          {/* Line Chart */}
          <div style={styles.chartCardLarge}>
            <h2 style={styles.chartTitle}>Sales vs MRP Trend</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis tickFormatter={formatCurrency} stroke="#64748b" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Selling Rate"
                  dot={{ fill: '#10b981', r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="mrp"
                  stroke="#ef4444"
                  strokeWidth={3}
                  name="Buy MRP"
                  dot={{ fill: '#ef4444', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>Revenue Distribution</h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
          <h2 style={{ marginBottom: 16 }}>Monthly Breakdown</h2>
          <Table
            columns={columns}
            dataSource={analytics?.salesReport || []}
            rowKey={(record) => record.month}
            pagination={{
              pageSize: 6,
              showSizeChanger: true,
              pageSizeOptions: ['6', '12', '24', '50'],
              showTotal: (total) => `Total ${total} months`
            }}
            bordered
          />
        </div>
      </div>
    </div>
  )
}

export default SalesMRPDashboard
