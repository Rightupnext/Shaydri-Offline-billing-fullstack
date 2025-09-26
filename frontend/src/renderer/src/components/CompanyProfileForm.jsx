import React, { useEffect, useState } from 'react'
import { Form, Input, Button, Upload, Row, Col, Typography, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { upsertCompanyProfile, fetchCompanyProfile } from '../store/slice/profileSlice'
import { useDispatch, useSelector } from 'react-redux'
import { token } from '../auth'
const { Title } = Typography

const CompanyProfileForm = () => {
  const authUser = token.getUser()

  const dispatch = useDispatch()
  const [form] = Form.useForm()
  const [previewLogo, setPreviewLogo] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const companyProfile = useSelector((state) => state.companyProfile?.profile)
  // console.log('com', companyProfile)
  useEffect(() => {
    dispatch(fetchCompanyProfile(authUser.db_name))
  }, [dispatch])
  useEffect(() => {
    if (companyProfile) {
      const { bank_details = {}, ...rest } = companyProfile

      form.setFieldsValue({
        ...rest,
        bank_name: bank_details.bankName || '',
        account_number: bank_details.accountNumber || '',
        ifsc_code: bank_details.ifscCode || '',
        branch_name: bank_details.branchName || ''
      })

      // Optional: show logo preview if stored in DB and has a public URL
      if (companyProfile.logo) {
        setPreviewLogo(companyProfile.logo)
      }
    }
  }, [companyProfile])

  const onFinish = (values) => {
    const { bank_name, account_number, ifsc_code, branch_name, ...rest } = values

    const bank_details = {
      bankName: bank_name,
      accountNumber: account_number,
      ifscCode: ifsc_code,
      branchName: branch_name
    }

    const formData = new FormData()

    formData.append('bank_details', JSON.stringify(bank_details))
    formData.append('logo', logoFile)

    Object.entries(rest).forEach(([key, value]) => {
      formData.append(key, value)
    })

    dispatch(upsertCompanyProfile(formData))
  }
const bakendUrl=import.meta.env.VITE_BACKEND_URL;
  return (
    <Row justify="center">
      <Col span={20}>
        <Title level={3}>Company Profile</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ country: 'India', state: 'Tamil Nadu' }}
        >
          {/* Logo Upload at the top */}
          <Form.Item label="Company Logo" name="logo">
            <Upload
              name="logo"
              listType="picture"
              maxCount={1}
              showUploadList={false}
              accept="image/*"
              beforeUpload={() => false}
              onChange={(info) => {
                const file = info.fileList[0]?.originFileObj
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (e) => {
                    setPreviewLogo(e.target.result)
                  }
                  reader.readAsDataURL(file)
                  setLogoFile(file)
                }
              }}
            >
              <Button icon={<UploadOutlined />}>Upload Logo</Button>
            </Upload>

            {previewLogo && (
              <img
                src={
                  previewLogo.startsWith('data:')
                    ? previewLogo
                    : `${bakendUrl}/uploads/${previewLogo}`
                }
                alt="Logo Preview"
                style={{ marginTop: 10, maxWidth: 150 }}
              />
            )}
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Company Name"
                name="company_name"
                rules={[{ required: true, message: 'Company name is required' }]}
              >
                <Input placeholder="Enter company name" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Slogan" name="slogan">
                <Input placeholder="Enter slogan" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Phone"
                name="phone"
                rules={[{ required: true, message: 'Phone number is required' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Email" name="email">
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>

            {/* <Col span={12}>
              <Form.Item label="Node Mail" name="node_mail">
                <Input placeholder="Enter Node.js mail ID" />
              </Form.Item>
            </Col> */}

            {/* <Col span={12}>
              <Form.Item
                label="Node Password"
                name="node_password"
                rules={[{ message: 'Node password is required' }]}
              >
                <Input.Password placeholder="Enter Node.js mail password" />
              </Form.Item>
            </Col> */}

            <Col span={12}>
              <Form.Item
                label="GST Number"
                name="gstNumber"
                rules={[{ required: true, message: 'GST Number is required' }]}
              >
                <Input placeholder="Enter GST Number" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Address"
                name="address"
                rules={[{ required: true, message: 'Address is required' }]}
              >
                <Input.TextArea rows={2} placeholder="Enter company address" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="State" name="state">
                <Input placeholder="Enter state" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Country" name="country">
                <Input placeholder="Enter country" />
              </Form.Item>
            </Col>

            {/* Bank Detail Fields */}
            <Col span={12}>
              <Form.Item label="Bank Name" name="bank_name">
                <Input placeholder="Enter Bank Name" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Account Number" name="account_number">
                <Input placeholder="Enter Account Number" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="IFSC Code" name="ifsc_code">
                <Input placeholder="Enter IFSC Code" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Branch Name" name="branch_name">
                <Input placeholder="Enter Branch Name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit Profile
            </Button>
          </Form.Item>
        </Form>
      </Col>
    </Row>
  )
}

export default CompanyProfileForm
