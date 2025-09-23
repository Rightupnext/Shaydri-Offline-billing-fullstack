import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../axiosInstance'
import { notification } from 'antd'
import { token } from '../../auth'

// 🔹 Fetch All Invoices
export const fetchInvoices = createAsyncThunk(
  'invoices/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.get(`/invoices/${getdb.db_name}/get`)
      return res.data
    } catch (err) {
      notification.error({
        message: 'Fetch Failed',
        description: err?.response?.data?.message || 'Unable to fetch invoices'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Get Next Invoice Number
export const fetchNextInvoiceNumber = createAsyncThunk(
  'invoices/fetchNextInvoiceNumber',
  async (_, { rejectWithValue }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.get(`/invoices/${getdb.db_name}/next/invoice-number`)
      return res.data.nextInvoiceNo
    } catch (err) {
      notification.error({
        message: 'Failed to Get Invoice Number',
        description: err?.response?.data?.message || 'Error fetching next invoice number'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Create a New Invoice
export const createInvoice = createAsyncThunk(
  'invoices/create',
  async (invoiceData, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.post(`/invoices/${getdb.db_name}/add`, invoiceData)
      notification.success({ message: 'Invoice created successfully' })
      dispatch(fetchInvoices())
      dispatch(fetchNextInvoiceNumber())
      return res.data
    } catch (err) {
      notification.error({
        message: 'Creation Failed',
        description: err?.response?.data?.message || 'Unable to create invoice'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)
// 🔹 Get Invoice by ID
export const fetchInvoiceById = createAsyncThunk(
  'invoices/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.get(`/invoices/${getdb.db_name}/${id}`)
      return res.data
    } catch (err) {
      notification.error({
        message: 'Fetch Failed',
        description: err?.response?.data?.message || 'Unable to fetch invoice'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Update Invoice by ID (e.g. update balance, status, etc.)
export const updateInvoiceById = createAsyncThunk(
  'invoices/updateById',
  async ({ id, updatedData }, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.put(`/invoices/${getdb.db_name}/${id}`, updatedData)
      notification.success({ message: 'Invoice updated successfully' })
      // dispatch(fetchInvoices())
      // // dispatch(fetchNextInvoiceNumber())
      // dispatch(updateInvoiceById(getdb.id))
      return res.data
    } catch (err) {
      notification.error({
        message: 'Update Failed',
        description: err?.response?.data?.message || 'Unable to update invoice'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Delete Invoice by ID
export const deleteInvoiceById = createAsyncThunk(
  'invoices/deleteById',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.delete(`/invoices/${getdb.db_name}/${id}`)
      notification.success({ message: 'Invoice deleted successfully' })
      dispatch(fetchInvoices()) // optional refresh
      return res.data
    } catch (err) {
      notification.error({
        message: 'Delete Failed',
        description: err?.response?.data?.message || 'Unable to delete invoice'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)
export const addInvoicePayment = createAsyncThunk(
  'invoices/addPayment',
  async ({ id, payAmount }, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.post(`/invoices/${getdb.db_name}/payment/${id}`, {
        payAmount
      })

      notification.success({
        message: 'Payment Added',
        description: `Collected ₹${payAmount} successfully`
      })

      dispatch(fetchInvoiceById(id)) // Refresh list

      return res.data
    } catch (err) {
      notification.error({
        message: 'Payment Failed',
        description: err?.response?.data?.message || 'Failed to record payment'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)
export const fetchInvoiceAnalytics = createAsyncThunk(
  'invoices/fetchAnalytics',
  async ({ startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const getdb = token.getUser()
      const from = startDate || moment().startOf('month').format('YYYY-MM-DD')
      const to = endDate || moment().endOf('month').format('YYYY-MM-DD')

      const db = getdb.db_name

      const res = await axiosInstance.get(
        `invoices/${db}?startDate=${encodeURIComponent(from)}&endDate=${encodeURIComponent(to)}`
      )

      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || err)
    }
  }
)

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState: {
    list: [],
    loading: false,
    error: null,
    nextInvoiceNo: '',
    selectedInvoice: null,
    analytics: {
      totalInvoices: 0,
      customerCount: 0,
      statusCounts: {
        UnPaid: 0,
        Partially: 0,
        'Credit-Bill': 0
      },
      statusAmounts: {
        UnPaid: 0,
        Partially: 0,
        'Credit-Bill': 0
      }
    }
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create
      .addCase(createInvoice.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createInvoice.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch Next Invoice No
      .addCase(fetchNextInvoiceNumber.fulfilled, (state, action) => {
        state.nextInvoiceNo = action.payload
      })
      .addCase(fetchNextInvoiceNumber.rejected, (state, action) => {
        state.nextInvoiceNo = ''
        state.error = action.payload
      })
      // Get by ID
      .addCase(fetchInvoiceById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.loading = false
        // Optionally store the fetched invoice
        state.selectedInvoice = action.payload
      })
      .addCase(fetchInvoiceById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update by ID
      .addCase(updateInvoiceById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateInvoiceById.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updateInvoiceById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Delete by ID
      .addCase(deleteInvoiceById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteInvoiceById.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(deleteInvoiceById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(addInvoicePayment.pending, (state) => {
        state.loading = true
        state.paymentStatus = null
        state.error = null
      })
      .addCase(addInvoicePayment.fulfilled, (state, action) => {
        state.loading = false
        state.paymentStatus = action.payload
      })
      .addCase(addInvoicePayment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchInvoiceAnalytics.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchInvoiceAnalytics.fulfilled, (state, action) => {
        state.loading = false
        state.analytics = action.payload
      })
      .addCase(fetchInvoiceAnalytics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to load analytics'
      })
  }
})

export default invoiceSlice.reducer
