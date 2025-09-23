import React, { useEffect, useState } from 'react'
import { Drawer, Button, Table, message } from 'antd'
import { useDispatch } from 'react-redux'
import moment from 'moment'
import { addInvoicePayment } from '../store/slice/invoiceSlice'
import { useParams } from 'react-router-dom'

function Payment({ closeDrawer, SideDrweropen, invoice, selectedInvoice }) {
  const dispatch = useDispatch()
  const { id } = useParams()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [payAmount, setPayAmount] = useState('')

  const finalAmount = Number(selectedInvoice?.computedtotals?.finalAmount || 0)
  const collectedAmount = Number(selectedInvoice?.computedtotals?.paidAmount || 0)
  const balance = finalAmount - collectedAmount

  useEffect(() => {
    if (SideDrweropen) {
      setPayAmount(balance) // Prefill with balance
    }
  }, [SideDrweropen, balance])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const enteredAmount = Number(payAmount)

    if (!enteredAmount || enteredAmount <= 0) {
      return message.warning('Please enter a valid amount')
    }

    if (enteredAmount > balance) {
      message.warning(`Entered amount exceeds balance. Max allowed is ₹${balance}`)
      setPayAmount(balance)
      return
    }

    setLoading(true)
    try {
      const res = await dispatch(
        addInvoicePayment({
          id,
          payAmount: enteredAmount
        })
      ).unwrap()

      setPayments([...payments, res])
      setPayAmount('') // clear input
    } catch (err) {
      message.error(err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => `₹ ${val}`
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('YYYY-MM-DD')
    }
  ]

  return (
    <Drawer
      title="Collect Payment"
      placement="right"
      onClose={closeDrawer}
      open={SideDrweropen}
      width={700}
    >
      <h3>Total: ₹{finalAmount}</h3>
      <h4>Collected: ₹{collectedAmount}</h4>
      <h4 style={{ color: balance > 0 ? 'red' : 'green' }}>Balance: ₹{balance}</h4>

      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="number"
          min="1"
          max={balance}
          placeholder="Enter amount"
          value={payAmount}
          onChange={(e) => setPayAmount(e.target.value)}
          style={{ width: 250, padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc' }}
        />
        <Button htmlType="submit" type="primary" loading={loading}>
          Collect
        </Button>
      </form>

      <Table
        style={{ marginTop: 24 }}
        columns={columns}
        dataSource={selectedInvoice?.computedtotals?.paymentHistory || []}
        rowKey={(record, index) => index}
        pagination={false}
      />
    </Drawer>
  )
}

export default Payment
