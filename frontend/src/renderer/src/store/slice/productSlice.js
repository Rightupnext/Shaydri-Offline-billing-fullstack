import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../axiosInstance'
import { notification } from 'antd'
import { token } from '../../auth'

// 🔄 Fetch All Products
export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.get(`/products/${getdb.db_name}/all`)
      return res.data.products
    } catch (err) {
      notification.error({
        message: 'Fetch Failed',
        description: err?.response?.data?.message || 'Unable to fetch products',
        placement: 'topRight'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// ➕ Create Product
export const createProduct = createAsyncThunk(
  'products/create',
  async (productData, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.post(`/products/${getdb.db_name}/create`, productData)
      notification.success({
        message: 'Success',
        description: 'Product created successfully',
        placement: 'topRight'
      })
      dispatch(fetchProducts())
      return res.data
    } catch (err) {
      notification.error({
        message: 'Creation Failed',
        description: err?.response?.data?.message || 'Unable to create product',
        placement: 'topRight'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// ✏️ Update Product
export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, updatedData }, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.put(`/products/${getdb.db_name}/${id}`, updatedData)
      notification.success({
        message: 'Success',
        description: 'Product updated successfully',
        placement: 'topRight'
      })
      dispatch(fetchProducts())
      return res.data
    } catch (err) {
      notification.error({
        message: 'Update Failed',
        description: err?.response?.data?.message || 'Unable to update product',
        placement: 'topRight'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// ❌ Delete Product
export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.delete(`/products/${getdb.db_name}/${id}`)
      notification.success({
        message: 'Success',
        description: 'Product deleted successfully',
        placement: 'topRight'
      })
      dispatch(fetchProducts())
      return res.data
    } catch (err) {
      notification.error({
        message: 'Deletion Failed',
        description: err?.response?.data?.message || 'Unable to delete product',
        placement: 'topRight'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🧾 Generate Barcode
export const generateBarCode = createAsyncThunk(
  'product/generateBarCode',
  async (productId, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const { data } = await axiosInstance.get(
        `/barcode/${getdb.db_name}/create-barcode/${productId}`
      )
      notification.success({
        message: 'Success',
        description: data?.message || 'Barcode created successfully!',
        placement: 'topRight'
      })
      dispatch(fetchProducts())
      return data
    } catch (error) {
      notification.error({
        message: 'Barcode Failed',
        description: error?.response?.data?.message || 'Failed to create barcode.',
        placement: 'topRight'
      })
      return rejectWithValue(error.response?.data || error)
    }
  }
)

// 🔁 Update Selected Barcodes
export const UpdateSelectedBarcode_with_Print = createAsyncThunk(
  'product/UpdateSelectedBarcode_with_Print',
  async (barcodeIds, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const { data } = await axiosInstance.put(
        `/barcode/${getdb.db_name}/update-barcodes`,
        barcodeIds
      )
      notification.success({
        message: 'Success',
        description: data?.message || 'Barcodes updated successfully!',
        placement: 'topRight'
      })
      dispatch(fetchProducts())
      return data
    } catch (error) {
      notification.error({
        message: 'Update Failed',
        description: error?.response?.data?.message || 'Failed to update barcodes.',
        placement: 'topRight'
      })
      return rejectWithValue(error.response?.data || error)
    }
  }
)

// 🔧 Slice
const productSlice = createSlice({
  name: 'products',
  initialState: {
    list: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(createProduct.pending, (state) => {
        state.loading = true
      })
      .addCase(createProduct.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(updateProduct.pending, (state) => {
        state.loading = true
      })
      .addCase(updateProduct.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(deleteProduct.pending, (state) => {
        state.loading = true
      })
      .addCase(deleteProduct.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(generateBarCode.pending, (state) => {
        state.loading = true
      })
      .addCase(generateBarCode.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(generateBarCode.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(UpdateSelectedBarcode_with_Print.pending, (state) => {
        state.loading = true
      })
      .addCase(UpdateSelectedBarcode_with_Print.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(UpdateSelectedBarcode_with_Print.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export default productSlice.reducer
