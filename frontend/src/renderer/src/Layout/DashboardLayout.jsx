import React, { useEffect, useState } from 'react'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
  AuditOutlined,
  TeamOutlined,
  AppstoreOutlined,
  CreditCardOutlined,
  FolderOpenOutlined,
  DatabaseOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { Button, Input, Layout, Menu, theme, Tooltip, Typography } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
const { Text } = Typography
const { Header, Sider, Content } = Layout

const DashboardLayout = () => {
  const [deviceId, setDeviceId] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    navigate('/login')
  }
  const {
    token: { colorBgContainer }
  } = theme.useToken()

  const menuItems = [
    { key: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
    { key: '/invoice', label: 'Invoice', icon: <FileTextOutlined /> },
    { key: '/invoice-list', label: 'Invoice List', icon: <UnorderedListOutlined /> },
    // { key: '/admin/invoice-audit', label: 'Invoice Audit', icon: <AuditOutlined /> },
    { key: '/product', label: 'Product Price', icon: <AppstoreOutlined /> },
    { key: '/inventory', label: 'Inventory Stock', icon: <DatabaseOutlined /> },
    { key: '/category', label: 'Category', icon: <FolderOpenOutlined /> },
    { key: '/customers', label: 'Customer List', icon: <TeamOutlined /> },
    { key: '/profile', label: 'Profile', icon: <UserOutlined /> },
    // { key: '/subscription', label: 'Subscription', icon: <CreditCardOutlined /> }
  ]
  useEffect(() => {
    const savedDeviceId = localStorage.getItem('deviceId')
    if (savedDeviceId) {
      setDeviceId(savedDeviceId)
    }
  }, [])

  const handleDeviceIdChange = (e) => {
    const value = e.target.value
    setDeviceId(value)
    localStorage.setItem('deviceId', value)
  }
  return (
    <Layout style={{ height: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64
            }}
          />
          {/* <div style={{ display: 'flex', flexDirection: 'row', marginLeft: 16 }}>
            <Text strong style={{ marginBottom: 4 }}>
              Device ID
            </Text>
            <Input
              placeholder="Enter Device ID"
              value={deviceId}
              onChange={handleDeviceIdChange}
              style={{ width: 200 }}
            />
          </div> */}
          <Tooltip title="Logout">
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ marginRight: 16 }}
            >
              Logout
            </Button>
          </Tooltip>
        </Header>
        <Content
          style={{ margin: '16px', padding: '24px', background: '#fff', overflowY: 'scroll' }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default DashboardLayout
