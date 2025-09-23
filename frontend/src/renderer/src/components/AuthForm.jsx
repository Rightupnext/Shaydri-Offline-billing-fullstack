import React, { useState } from 'react'
import { Tabs, Form, Input, Button, Checkbox, Row, Col, Typography, message } from 'antd'
import {
  MailOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  UserOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser } from '../store/slice/authSlice'
import { useDispatch } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

const { Title, Text } = Typography

const AuthForm = () => {
  const [form] = Form.useForm()
  const [activeKey, setActiveKey] = useState('1')
  const [remember, setRemember] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSignIn = async (values) => {
    try {
      const resultAction = await dispatch(loginUser(values))
      const result = unwrapResult(resultAction)

      // ✅ Store email if "Remember Me" checked
      if (remember) {
        localStorage.setItem('rememberedEmail', values.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      navigate('/') // go to home on success
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  const handleSignUp = async (values) => {
    try {
      await dispatch(registerUser(values)).unwrap()
      setActiveKey('1') // Switch to Sign In tab
    } catch (err) {
      console.error('Register error:', err)
    }
  }

  const items = [
    {
      key: '1',
      label: 'Sign In',
      children: (
        <Form
          form={form}
          name="signin"
          layout="vertical"
          onFinish={handleSignIn}
          initialValues={{
            email: localStorage.getItem('rememberedEmail') || ''
          }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              {
                type: 'email',
                message: 'Please enter a valid email address'
              }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              placeholder="Enter password"
            />
          </Form.Item>

          <Form.Item>
            <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} required>
              Remember me
            </Checkbox>
            <a style={{ float: 'right' }} href="#">
              Forgot Password?
            </a>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: '2',
      label: 'Sign Up',
      children: (
        <Form name="signup" layout="vertical" onFinish={handleSignUp}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Enter name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              placeholder="Enter password"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Sign Up
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ]

  return (
    <Row
      style={{
        minHeight: '100vh',
        background: '#f0f2f5',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Col
        xs={22}
        sm={20}
        md={16}
        lg={14}
        xl={12}
        style={{
          display: 'flex',
          background: '#fff',
          borderRadius: 10,
          overflow: 'hidden'
        }}
      >
        {/* Left Form */}
        <Col span={12} style={{ padding: '40px' }}>
          <Title level={3}>Welcome</Title>
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />

          <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
            or Sign in with
          </Text>
          <div style={{ textAlign: 'center', marginTop: 8 }}>{/* Social buttons here */}</div>
        </Col>

        {/* Right Image */}
        <Col span={12} style={{ background: '#001529', padding: 24 }}>
          {/* <img
            alt="login"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 10
            }}
          /> */}
        </Col>
      </Col>
    </Row>
  )
}

export default AuthForm
