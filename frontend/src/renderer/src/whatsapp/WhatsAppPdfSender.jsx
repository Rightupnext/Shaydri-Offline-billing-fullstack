import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { uploadWhatsAppMessage } from '../store/slice/whatsappSlice'
import { Form, Input, Button, message } from 'antd'
import { pdf } from '@react-pdf/renderer'
import DownloadA4Invocie from '../KovaimannvaasanaiInvoice/DownloadA4Invocie'

const WhatsAppUploader = ({ selectedInvoice, profile }) => {
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  const { uploading, downloadUrl } = useSelector((state) => state.whatsapp)

  useEffect(() => {
    form.setFieldsValue({
      fromNumber: profile?.phone || '',
      toNumber: selectedInvoice?.customer?.phone || ''
    })
  }, [profile, selectedInvoice])

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

  const generatePDFBlob = async () => {
    const logoUrl = `${import.meta.env.VITE_BACKEND_URL}/uploads/${profile?.logo}`
    const logoBase64 = profile?.logo ? await getBase64Image(logoUrl) : null

    return await pdf(
      <DownloadA4Invocie
        selectedInvoice={selectedInvoice}
        profile={profile}
        logoBase64={logoBase64}
      />
    ).toBlob()
  }

 const onFinish = async (values) => {
  try {
    const blob = await generatePDFBlob()
    const customerName = selectedInvoice?.customer?.name?.replace(/\s+/g, '_') || 'customer'
    const invoiceNo = selectedInvoice?.invoice_no || 'invoice'
    const fileName = `${invoiceNo}_${customerName}.pdf`

    const formData = new FormData()
    formData.append('file', new File([blob], fileName, { type: 'application/pdf' }))
    formData.append('fromNumber', values.fromNumber)
    formData.append('toNumber', values.toNumber)
    formData.append('message', values.message || '')
    formData.append('selectedOption', values.selectedOption || '')

    const result = await dispatch(uploadWhatsAppMessage(formData)).unwrap()

    if (result.success && result.downloadUrl) {
      const fileLink = `${import.meta.env.VITE_BACKEND_URL}${result.downloadUrl}`
      const messageText = encodeURIComponent(`${values.message || ''}\nDownload Invoice: ${fileLink}`)
      const phone = values.toNumber.replace(/[^0-9]/g, '') // Ensure only digits

      const whatsappURL = `https://wa.me/${phone}?text=${messageText}`
      window.open(whatsappURL, '_blank') // ✅ Opens WhatsApp Web or App
    }
  } catch (err) {
    console.error('Failed to upload WhatsApp message:', err)
    message.error('Failed to generate or upload PDF')
  }
}


  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        name="fromNumber"
        label="From Number"
        rules={[{ required: true, message: 'Please enter from number' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="toNumber"
        label="To Number"
        rules={[{ required: true, message: 'Please enter to number' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item name="message" label="Message">
        <Input.TextArea placeholder="Type message (optional)" />
      </Form.Item>

      <Form.Item name="selectedOption" label="Selected Option" initialValue="Invoice">
        <Input readOnly />
      </Form.Item>

      <Button type="primary" htmlType="submit" loading={uploading}>
        Send Invoice via WhatsApp
      </Button>

      {downloadUrl && (
        <p className="mt-3">
          Download Link:{' '}
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
            {downloadUrl}
          </a>
        </p>
      )}
    </Form>
  )
}

export default WhatsAppUploader
