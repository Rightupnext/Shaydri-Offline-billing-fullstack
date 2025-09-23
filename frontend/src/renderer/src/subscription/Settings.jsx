import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { monitorSubscription } from '../store/slice/subscriptionSlice'
import { format } from 'date-fns'
import SubscriptionCalculator from './SubscriptionCalculator'
import { CalendarOutlined, CheckCircleOutlined, DollarCircleOutlined } from '@ant-design/icons'
import { Progress, Card, Typography, Tag, Row, Col, Space } from 'antd'

const { Title, Text } = Typography

const Settings = () => {
  const dispatch = useDispatch()
  const { subscription } = useSelector((state) => state.subscription)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const splitDeviceIds = (idsString, chunkSize = 15) => {
    const result = []
    for (let i = 0; i < idsString.length; i += chunkSize) {
      result.push(idsString.slice(i, i + chunkSize))
    }
    return result
  }

  useEffect(() => {
    dispatch(monitorSubscription())
  }, [dispatch])

  useEffect(() => {
    if (!subscription?.subscription_end_date) return

    const calculateTimeLeft = () => {
      const endTime = new Date(subscription.subscription_end_date).getTime()
      const now = new Date().getTime()
      const difference = endTime - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      })
    }

    const timer = setInterval(calculateTimeLeft, 1000)
    calculateTimeLeft()
    return () => clearInterval(timer)
  }, [subscription])

  return (
    <div style={{ padding: '40px', background: '#fff', minHeight: '100vh' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
        <CalendarOutlined style={{ marginRight: 10 }} />
        Subscription Details
      </Title>

      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} sm={12} md={8}>
          <Card title="Subscription Start" bordered={false}>
            <Text strong>
              {subscription?.subscription_start_date
                ? format(new Date(subscription.subscription_start_date), 'dd MMM yyyy, HH:mm')
                : 'N/A'}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Subscription End" bordered={false}>
            <Text strong>
              {subscription?.subscription_end_date
                ? format(new Date(subscription.subscription_end_date), 'dd MMM yyyy, HH:mm')
                : 'N/A'}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Total Amount" bordered={false}>
            <Title level={3} style={{ color: '#3f8600' }}>
              ₹{subscription?.amount || 0}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Status" bordered={false}>
            <Tag color="green">
              <CheckCircleOutlined /> {subscription?.status?.toUpperCase() || 'UNKNOWN'}
            </Tag>
          </Card>
        </Col>
        <Col>
          <Card
            title={
              <>
                Device Id{' '}
                <Tag color="green" style={{ marginLeft: 8 }}>
                  <Text>{subscription?.device_limit}</Text>
                </Tag>
              </>
            }
            bordered={false}
          >
            <Space direction="vertical">
              {Array.isArray(subscription?.device_ids) &&
                subscription.device_ids.flat().map((deviceGroup, idx) => {
                  // Ensure string and split in chunks
                  const ids =
                    typeof deviceGroup === 'string' ? splitDeviceIds(deviceGroup) : [deviceGroup] // if it's already an individual ID
                  return ids.map((deviceId, index) => (
                    <Tag key={`${idx}-${index}`} color="blue">
                      <Text>{deviceId}</Text>
                    </Tag>
                  ))
                })}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Circle Progress Countdown */}
      <div style={{ marginTop: '60px', textAlign: 'center' }}>
        <Title level={3}>Subscription Remaining Time</Title>
        <Row gutter={[32, 32]} justify="center">
          <Col>
            <Progress
              type="circle"
              percent={(timeLeft.days / 365) * 100}
              format={() => `${timeLeft.days}d`}
              width={120}
              strokeColor="#1890ff"
            />
          </Col>
          <Col>
            <Progress
              type="circle"
              percent={(timeLeft.hours / 24) * 100}
              format={() => `${timeLeft.hours}h`}
              width={120}
              strokeColor="#722ed1"
            />
          </Col>
          <Col>
            <Progress
              type="circle"
              percent={(timeLeft.minutes / 60) * 100}
              format={() => `${timeLeft.minutes}m`}
              width={120}
              strokeColor="#eb2f96"
            />
          </Col>
          <Col>
            <Progress
              type="circle"
              percent={(timeLeft.seconds / 60) * 100}
              format={() => `${timeLeft.seconds}s`}
              width={120}
              strokeColor="#fa8c16"
            />
          </Col>
        </Row>
      </div>

      {/* Payment Plans */}
      <div style={{ marginTop: '80px' }}>
        <SubscriptionCalculator />
      </div>
    </div>
  )
}

export default Settings
