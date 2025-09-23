import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {
  createSubscription,
  verifyPayment,
  monitorSubscription
} from '../store/slice/subscriptionSlice'
import { notification, Card, Button, Typography, Row, Col, Badge } from 'antd'
import { CheckOutlined, StarFilled, InfoCircleOutlined } from '@ant-design/icons'
import { token } from '../auth'

const { Title, Paragraph, Text } = Typography

const showNotification = (type, message, description = '') => {
  notification[type]({
    message: type === 'success' ? 'Success' : 'Error',
    description: message || description,
    placement: 'topRight'
  })
}

const SubscriptionCalculator = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const loadRazorpay = () => {
      if (!document.querySelector("script[src='https://checkout.razorpay.com/v1/checkout.js']")) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        script.onload = () => console.log('Razorpay script loaded successfully.')
        script.onerror = () => console.error('Failed to load Razorpay script.')
        document.body.appendChild(script)
      }
    }
    loadRazorpay()
  }, [])

  const handlePayment = async (amount) => {
    if (!window.Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)

      script.onload = () => processPayment(amount)
      script.onerror = () => showNotification('error', 'Failed to load Razorpay. Try again.')
      return
    }
    processPayment(amount)
  }
  const user = token.getUser()
  const processPayment = async (amount) => {
    try {
      const db_name = user?.db_name
      if (!db_name) throw new Error('db_name not found.')

      const { payload } = await dispatch(createSubscription({ db_name, amount }))
      if (!payload || !payload.orderId) throw new Error('Failed to get order details from backend.')

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: payload.amount * 100,
        currency: 'INR',
        name: 'RightUpNext Innovations',
        description: 'Billing software',
        order_id: payload.orderId,
        handler: async function (response) {
          try {
            await dispatch(
              await dispatch(
                verifyPayment({
                  db_name: user?.db_name, // ✅ Correct
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  amount
                })
              )
            )
            dispatch(monitorSubscription())
            showNotification('success', 'Payment verified successfully!')
          } catch (error) {
            showNotification('error', 'Payment verification failed.')
          }
        },
        theme: { color: '#3399cc' }
      }

      const rzp1 = new window.Razorpay(options)
      rzp1.open()
    } catch (error) {
      showNotification('error', error.message || 'Payment process failed.')
    }
  }

  const plans = [
    {
      title: 'Starter',
      price: 18000,
      description: 'For individuals and small teams',
      features: [
        'Trending Dashboard',
        'Analytics Report',
        'Unlimited Invoice Generating',
        '2 Users',
        'Multi-language',
        'Basic Support'
      ]
    },
    {
      title: 'Pro',
      price: 32000,
      description: 'For agencies and businesses',
      popular: true,
      features: [
        'Trending Dashboard',
        'Analytics Report',
        'Unlimited Invoice Generating',
        '5 Users',
        'Early Beta Features',
        'Premium Support'
      ]
    }
  ]

  return (
    <div style={{ padding: '40px' }}>
      <Row gutter={32} justify="center">
        {plans.map((plan, index) => (
          <Col key={index} xs={24} sm={20} md={12} lg={8}>
            <Badge.Ribbon
              text="POPULAR"
              color="red"
              style={{ display: plan.popular ? 'block' : 'none' }}
            >
              <Card
                title={
                  <div style={{ textAlign: 'center' }}>
                    <Title level={3} style={{ marginBottom: 0 }}>
                      {plan.title} {plan.popular && <StarFilled style={{ color: '#faad14' }} />}
                    </Title>
                    <Paragraph type="secondary">{plan.description}</Paragraph>
                    <Title level={2}>₹{plan.price}</Title>
                    <Text type="secondary">/year</Text>
                  </div>
                }
                bordered
                style={{
                  minHeight: 400,
                  borderColor: plan.popular ? '#ffa940' : '#d9d9d9'
                }}
              >
                <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 8
                      }}
                    >
                      <CheckOutlined style={{ color: 'green', marginRight: 8 }} />
                      <Text>{feature}</Text>
                    </li>
                  ))}
                </ul>
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <Button type="primary" size="large" onClick={() => handlePayment(plan.price)}>
                    Get Started
                  </Button>
                </div>
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default SubscriptionCalculator
