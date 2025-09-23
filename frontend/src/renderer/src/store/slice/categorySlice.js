import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../axiosInstance'
import { notification } from 'antd'
import { token } from '../../auth'

// 🔹 Fetch All Categories
export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.get(`/categories/${getdb.db_name}`)
      return res.data
    } catch (err) {
      notification.error({
        message: 'Fetch Failed',
        description: err?.response?.data?.message || 'Unable to fetch categories'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Create a New Category
export const createCategory = createAsyncThunk(
  'categories/create',
  async (categoryData, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.post(`/categories/${getdb.db_name}`, categoryData)
      notification.success({ message: 'Category created successfully' })
      dispatch(fetchCategories())
      return res.data
    } catch (err) {
      notification.error({
        message: 'Creation Failed',
        description: err?.response?.data?.message || 'Unable to create category'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Update Category by ID
export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, updatedData }, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.put(`/categories/${getdb.db_name}/${id}`, updatedData)
      notification.success({ message: 'Category updated successfully' })
      dispatch(fetchCategories())
      return res.data
    } catch (err) {
      notification.error({
        message: 'Update Failed',
        description: err?.response?.data?.message || 'Unable to update category'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Delete Category by ID
export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.delete(`/categories/${getdb.db_name}/${id}`)
      notification.success({ message: 'Category deleted successfully' })
      dispatch(fetchCategories())
      return res.data
    } catch (err) {
      notification.error({
        message: 'Deletion Failed',
        description: err?.response?.data?.message || 'Unable to delete category'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Slice Definition
const categorySlice = createSlice({
  name: 'categories',
  initialState: {
    list: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create
      .addCase(createCategory.pending, (state) => {
        state.loading = true
      })
      .addCase(createCategory.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update
      .addCase(updateCategory.pending, (state) => {
        state.loading = true
      })
      .addCase(updateCategory.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Delete
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true
      })
      .addCase(deleteCategory.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export default categorySlice.reducer
