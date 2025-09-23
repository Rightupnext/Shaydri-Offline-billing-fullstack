import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../axiosInstance'
import { notification } from 'antd'
import { token } from '../../auth'

// 🔹 Fetch All Customers
export const fetchCustomers = createAsyncThunk(
  'customers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.get(`/customers/${getdb.db_name}/get`)
      return res.data
    } catch (err) {
      notification.error({
        message: 'Fetch Failed',
        description: err?.response?.data?.message || 'Unable to fetch customers'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Create a New Customer
export const createCustomer = createAsyncThunk(
  'customers/create',
  async (customerData, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.post(`/customers/${getdb.db_name}/add`, customerData)
      notification.success({ message: 'Customer created successfully' })
      dispatch(fetchCustomers())
      return res.data
    } catch (err) {
      notification.error({
        message: 'Creation Failed',
        description: err?.response?.data?.message || 'Unable to create customer'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Update Customer by ID
export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ id, updatedData }, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.put(`/customers/${getdb.db_name}/${id}`, updatedData)
      notification.success({ message: 'Customer updated successfully' })
      dispatch(fetchCustomers())
      return res.data
    } catch (err) {
      notification.error({
        message: 'Update Failed',
        description: err?.response?.data?.message || 'Unable to update customer'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Delete Customer by ID
export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.delete(`/customers/${getdb.db_name}/${id}`)
      notification.success({ message: 'Customer deleted successfully' })
      dispatch(fetchCustomers())
      return res.data
    } catch (err) {
      notification.error({
        message: 'Deletion Failed',
        description: err?.response?.data?.message || 'Unable to delete customer'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Slice Definition
const customerSlice = createSlice({
  name: 'customers',
  initialState: {
    list: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create
      .addCase(createCustomer.pending, (state) => {
        state.loading = true
      })
      .addCase(createCustomer.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true
      })
      .addCase(updateCustomer.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Delete
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true
      })
      .addCase(deleteCustomer.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export default customerSlice.reducer
